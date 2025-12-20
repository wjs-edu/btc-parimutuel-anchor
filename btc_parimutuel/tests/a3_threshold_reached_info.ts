import * as anchor from "@coral-xyz/anchor";
import { PublicKey, SystemProgram, Keypair, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { createMint, getOrCreateAssociatedTokenAccount, mintTo, getAccount, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import assert from "assert";
import { isThresholdReachedInfo } from "./utils/a3_threshold";
import { rpcRetry, sendAndConfirmRetry } from "./utils/rpc";

function sleep(ms: number) { return new Promise((r) => setTimeout(r, ms)); }
async function rpcRetry<T>(fn: () => Promise<T>, retries = 10) {
  let lastErr: any;
  for (let i = 0; i < retries; i++) {
    try { return await fn(); }
    catch (e: any) {
      lastErr = e;
      const msg = String(e?.message ?? e);
      if (msg.includes("Blockhash not found")) { await sleep(800 * (i + 1)); continue; }
      await sleep(600 * (i + 1));
    }
  }
  throw lastErr;
}

describe("A3 threshold reached (informational only)", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.BtcParimutuel as anchor.Program<any>;
  const admin = provider.wallet.publicKey;
  const connection = provider.connection;
  const payer = (provider.wallet as any).payer;

  it("threshold can be reached pre-close with no on-chain market mutation (label only)", async () => {
    const marketId = new anchor.BN(Date.now() % 1_000_000_000);
    const marketIdLe = Buffer.alloc(8);
    marketIdLe.writeBigUInt64LE(BigInt(marketId.toString()));

    const [marketPda] = PublicKey.findProgramAddressSync([Buffer.from("market_v1"), marketIdLe], program.programId);
    const [commitPoolPda] = PublicKey.findProgramAddressSync([Buffer.from("commit_pool_v1"), marketPda.toBuffer()], program.programId);
    const [commitVaultPda] = PublicKey.findProgramAddressSync([Buffer.from("commit_vault_v1"), marketPda.toBuffer()], program.programId);

    const usdcMint = await createMint(connection, payer, admin, null, 6);

    // user A (admin)
    const ataA = await getOrCreateAssociatedTokenAccount(connection, payer, usdcMint, admin);
    await mintTo(connection, payer, usdcMint, ataA.address, admin, 10_000_000);

    // user B (fresh keypair)
    const userB = Keypair.generate();
    const fundTx = new anchor.web3.Transaction().add(
      SystemProgram.transfer({ fromPubkey: admin, toPubkey: userB.publicKey, lamports: Math.floor(0.05 * LAMPORTS_PER_SOL) })
    );
    await sendAndConfirmRetry(provider, fundTx, [], { commitment: "confirmed" });
    const ataB = await getOrCreateAssociatedTokenAccount(connection, payer, usdcMint, userB.publicKey);
    await mintTo(connection, payer, usdcMint, ataB.address, admin, 10_000_000);
    const now = Math.floor(Date.now() / 1000);
    const args = {
      variant: 0,
      creator: admin,
      commitOpenTs: new anchor.BN(now - 5),
      commitCloseTs: new anchor.BN(now + 300),
      resolutionTs: new anchor.BN(now + 600),
      overrideMinToOpenUsd: new anchor.BN(6),
      overrideBetCutoffTs: null,
    };

    await rpcRetry(() =>
      program.methods.publishMarketVfinal(marketId, args)
        .accounts({ admin, market: marketPda, systemProgram: SystemProgram.programId })
        .rpc({ commitment: "confirmed" })
    );

    const marketBefore = await program.account.vFinalMarket.fetch(marketPda);
    const [commitmentPdaA] = PublicKey.findProgramAddressSync([Buffer.from("commitment_v1"), marketPda.toBuffer(), admin.toBuffer()], program.programId);
    const [commitmentPdaB] = PublicKey.findProgramAddressSync([Buffer.from("commitment_v1"), marketPda.toBuffer(), userB.publicKey.toBuffer()], program.programId);

    // A commits 3 USDC to side=1
    await rpcRetry(() =>
      program.methods.commitVfinal(marketId, 1, new anchor.BN(3_000_000))
        .accounts({
          user: admin, market: marketPda, commitPool: commitPoolPda, commitVault: commitVaultPda, commitment: commitmentPdaA,
          userUsdcAta: ataA.address, usdcMint,
          systemProgram: SystemProgram.programId, tokenProgram: TOKEN_PROGRAM_ID, rent: anchor.web3.SYSVAR_RENT_PUBKEY,
        })
        .rpc({ commitment: "confirmed" })
    );

    // B commits 3 USDC to side=2 (no side-switch because different user)
    await rpcRetry(() =>
      program.methods.commitVfinal(marketId, 2, new anchor.BN(3_000_000))
        .accounts({
          user: userB.publicKey, market: marketPda, commitPool: commitPoolPda, commitVault: commitVaultPda, commitment: commitmentPdaB,
          userUsdcAta: ataB.address, usdcMint,
          systemProgram: SystemProgram.programId, tokenProgram: TOKEN_PROGRAM_ID, rent: anchor.web3.SYSVAR_RENT_PUBKEY,
        })
        .signers([userB])
        .rpc({ commitment: "confirmed" })
    );

    const marketAfter = await program.account.vFinalMarket.fetch(marketPda);
    assert.deepEqual(marketAfter, marketBefore);

    const p = await program.account.vFinalCommitPool.fetch(commitPoolPda);
    const slot = await connection.getSlot("confirmed");
    const nowSec = (await connection.getBlockTime(slot)) ?? Math.floor(Date.now() / 1000);

    const ok = isThresholdReachedInfo({
      nowTs: nowSec,
      commitCloseTs: Number(marketAfter.commitCloseTs),
      totalCommitted: BigInt(p.totalCommitted.toString()),
      minToOpenUsd: BigInt(marketAfter.minToOpenUsd.toString()),
    });
    assert.equal(ok, true, "expected threshold reached info to be true");

    const vaultAcc = await getAccount(connection, commitVaultPda);
    assert.equal(Number(vaultAcc.amount), 6_000_000);
  });
});
