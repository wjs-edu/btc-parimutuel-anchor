import * as anchor from "@coral-xyz/anchor";
import { PublicKey, SystemProgram } from "@solana/web3.js";
import { createMint, getOrCreateAssociatedTokenAccount, mintTo, getAccount, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { marketIdFromLabel } from "./utils/runSalt";
import assert from "assert";

function sleep(ms: number) { return new Promise((r) => setTimeout(r, ms)); }

function isBlockhashFlake(e: any): boolean {
  const msg = String(e?.message ?? e);
  return msg.includes("Blockhash not found") || msg.includes("blockhash not found");
}

async function withBlockhashRetry<T>(label: string, fn: () => Promise<T>, max = 5): Promise<T> {
  let last: any;
  for (let i = 0; i <= max; i++) {
    try {
      return await fn();
    } catch (e) {
      last = e;
      if (!isBlockhashFlake(e) || i === max) break;
      console.warn(`[blockhashRetry] ${label} retry ${i + 1}/${max}`);
      await new Promise((r) => setTimeout(r, 400 * (i + 1)));
    }
  }
  throw last;
}

async function rpcRetry<T>(fn: () => Promise<T>, retries = 6) {
  let lastErr: any;
  for (let i = 0; i < retries; i++) {
    try { return await fn(); } catch (e) { lastErr = e; await sleep(600 * (i + 1)); }
  }
  throw lastErr;
}

describe("A2 commit_vfinal", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.BtcParimutuel as anchor.Program<any>;
  const admin = provider.wallet.publicKey;
  const connection = provider.connection;
  const payer = (provider.wallet as any).payer;

  const marketId = marketIdFromLabel("tests/a2_commit_vfinal.ts");

  const marketIdLe = Buffer.alloc(8);
  marketIdLe.writeBigUInt64LE(BigInt(marketId.toString()));
  const [marketPda] = PublicKey.findProgramAddressSync([Buffer.from("market_v1"), marketIdLe], program.programId);

  const [commitPoolPda] = PublicKey.findProgramAddressSync([Buffer.from("commit_pool_v1"), marketPda.toBuffer()], program.programId);
  const [commitVaultPda] = PublicKey.findProgramAddressSync([Buffer.from("commit_vault_v1"), marketPda.toBuffer()], program.programId);
  const [commitmentPda] = PublicKey.findProgramAddressSync([Buffer.from("commitment_v1"), marketPda.toBuffer(), admin.toBuffer()], program.programId);

  let usdcMint: PublicKey;
  let userAta: PublicKey;

  it("publishes + commits + rejects side switch", async () => {
    usdcMint = await createMint(connection, payer, admin, null, 6);
    const ata = await getOrCreateAssociatedTokenAccount(connection, payer, usdcMint, admin);
    userAta = ata.address;

    // 3000 USDC
    await mintTo(connection, payer, usdcMint, userAta, admin, 3_000_000_000);

    const now = Math.floor(Date.now() / 1000);
    const args = {
      variant: 0,
      creator: admin,
      commitOpenTs: new anchor.BN(now - 5),
      commitCloseTs: new anchor.BN(now + 300),
      resolutionTs: new anchor.BN(now + 600),
      overrideMinToOpenUsd: null,
      overrideBetCutoffTs: null,
    };

    await rpcRetry(() =>
      program.methods.publishMarketVfinal(marketId, args)
        .accounts({ admin, market: marketPda, systemProgram: SystemProgram.programId })
        .rpc({ commitment: "confirmed" })
    );

    await rpcRetry(() =>
      program.methods.commitVfinal(marketId, 1, new anchor.BN(1_000_000_000))
        .accounts({
          user: admin, market: marketPda, commitPool: commitPoolPda, commitVault: commitVaultPda, commitment: commitmentPda,
          userUsdcAta: userAta, usdcMint,
          systemProgram: SystemProgram.programId, tokenProgram: TOKEN_PROGRAM_ID, rent: anchor.web3.SYSVAR_RENT_PUBKEY,
        })
        .rpc({ commitment: "confirmed" })
    );

    await rpcRetry(() =>
      program.methods.commitVfinal(marketId, 1, new anchor.BN(1_000_000))
        .accounts({
          user: admin, market: marketPda, commitPool: commitPoolPda, commitVault: commitVaultPda, commitment: commitmentPda,
          userUsdcAta: userAta, usdcMint,
          systemProgram: SystemProgram.programId, tokenProgram: TOKEN_PROGRAM_ID, rent: anchor.web3.SYSVAR_RENT_PUBKEY,
        })
        .rpc({ commitment: "confirmed" })
    );

    let threw = false;
    try {
      await program.methods.commitVfinal(marketId, 2, new anchor.BN(1_000_000))
        .accounts({
          user: admin, market: marketPda, commitPool: commitPoolPda, commitVault: commitVaultPda, commitment: commitmentPda,
          userUsdcAta: userAta, usdcMint,
          systemProgram: SystemProgram.programId, tokenProgram: TOKEN_PROGRAM_ID, rent: anchor.web3.SYSVAR_RENT_PUBKEY,
        })
        .rpc({ commitment: "confirmed" });
    } catch (e: any) {
      threw = true;
      const msg = String(e?.message || e);
      assert(/Side switch|SideSwitchForbidden/i.test(msg), msg);
    }
    assert(threw, "expected side-switch to throw");

    const c = await program.account.vFinalCommitment.fetch(commitmentPda);
    assert.equal(c.side, 1);
    assert.equal(Number(c.amount), 1_001_000_000);

    const p = await program.account.vFinalCommitPool.fetch(commitPoolPda);
    assert.equal(Number(p.totalCommitted), 1_001_000_000);
    assert.equal(Number(p.totalUp), 1_001_000_000);
    assert.equal(Number(p.totalDown), 0);

    const vaultAcc = await getAccount(connection, commitVaultPda);
    assert.equal(Number(vaultAcc.amount), 1_001_000_000);
  });

  
  it("enforces dominance cap (Proof: 2500 USDC cap)", async () => {
    let threw = false;
    try {
      await withBlockhashRetry("A2 dominance-cap", () =>
        rpcRetry(() =>
          program.methods
            .commitVfinal(marketId, 1, new anchor.BN(2_000_000_000))
            .accounts({
              user: admin,
              market: marketPda,
              commitPool: commitPoolPda,
              commitVault: commitVaultPda,
              commitment: commitmentPda,
              userUsdcAta: userAta,
              usdcMint,
              systemProgram: SystemProgram.programId,
              tokenProgram: TOKEN_PROGRAM_ID,
              rent: anchor.web3.SYSVAR_RENT_PUBKEY,
            })
            .rpc({ commitment: "confirmed" })
        )
      );
    } catch (e: any) {
      threw = true;
      const msg = String(e?.message || e);
      assert(/Dominance cap|DominanceCapExceeded/i.test(msg), msg);
    }
    assert(threw, "expected dominance cap to throw");
  });

});
