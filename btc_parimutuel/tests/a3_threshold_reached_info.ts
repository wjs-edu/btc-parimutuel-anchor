import * as anchor from "@coral-xyz/anchor";
import { PublicKey, SystemProgram, Keypair, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { createMint, getOrCreateAssociatedTokenAccount, mintTo, getAccount, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { marketIdFromLabel } from "./utils/runSalt";
import assert from "assert";
import { isThresholdReachedInfo } from "./utils/a3_threshold";
import { rpcRetry, sendAndConfirmRetry } from "./utils/rpc";

describe("A3 threshold reached (informational only)", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.BtcParimutuel as anchor.Program<any>;
  const admin = provider.wallet.publicKey;
  const connection = provider.connection;
  const payer = (provider.wallet as any).payer;

  it("threshold can be reached pre-close without exceeding per-user cap (label only)", async () => {
    const marketIdLe = Buffer.alloc(8);
    marketIdLe.writeBigUInt64LE(BigInt(marketId.toString()));

    const [marketPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("market_v1"), marketIdLe],
      program.programId
    );
    const [commitPoolPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("commit_pool_v1"), marketPda.toBuffer()],
      program.programId
    );
    const [commitVaultPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("commit_vault_v1"), marketPda.toBuffer()],
      program.programId
    );

    const usdcMint = await createMint(connection, payer, admin, null, 6);

    const now = Math.floor(Date.now() / 1000);
    const args = {
      variant: 0,
      creator: admin,
      commitOpenTs: new anchor.BN(now - 5),
      commitCloseTs: new anchor.BN(now + 300),
      resolutionTs: new anchor.BN(now + 600),
      overrideMinToOpenUsd: new anchor.BN(20),
      overrideBetCutoffTs: null,
    };

    await rpcRetry(() =>
      program.methods
        .publishMarketVfinal(marketId, args)
        .accounts({ admin, market: marketPda, systemProgram: SystemProgram.programId })
        .rpc({ commitment: "confirmed" })
    );

    const marketBefore = await program.account.vFinalMarket.fetch(marketPda);
    const minToOpenUsd = BigInt(marketBefore.minToOpenUsd.toString());
    const dominanceCapBps = BigInt(marketBefore.dominanceCapBps.toString());
    const minToOpenUsdc = minToOpenUsd * 1_000_000n;

    const capPerUser = (minToOpenUsdc * dominanceCapBps) / 10_000n;
    assert(capPerUser > 0n, "capPerUser must be > 0");

    // Be extra-safe: stay strictly under cap
    const commitAmt = capPerUser - 1n;
    assert(commitAmt > 0n, "commitAmt must be > 0");

    // Determine N users needed so N * commitAmt >= minToOpenUsdc
    const users: { pubkey: PublicKey; signer: Keypair | null }[] = [{ pubkey: admin, signer: null }];
    while (BigInt(users.length) * commitAmt < minToOpenUsdc) {
      const kp = Keypair.generate();
      users.push({ pubkey: kp.publicKey, signer: kp });
    }
    // Fund non-admin users for fees
    for (let i = 1; i < users.length; i++) {
      const kp = users[i].signer!;
      const tx = new anchor.web3.Transaction().add(
        SystemProgram.transfer({
          fromPubkey: admin,
          toPubkey: kp.publicKey,
          lamports: Math.floor(0.005 * LAMPORTS_PER_SOL),
        })
      );
      await sendAndConfirmRetry(provider, tx, [], { commitment: "confirmed" });
    }

    // Create ATAs + mint enough USDC for each user to cover commitAmt (+2 USDC slack)
    const atas: Record<string, PublicKey> = {};
    const mintPerUser = Number(commitAmt + 2_000_000n);
    for (const u of users) {
      const ata = await getOrCreateAssociatedTokenAccount(connection, payer, usdcMint, u.pubkey);
      atas[u.pubkey.toBase58()] = ata.address;
      await mintTo(connection, payer, usdcMint, ata.address, admin, mintPerUser);
    }
    for (const u of users) {
      const [commitmentPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("commitment_v1"), marketPda.toBuffer(), u.pubkey.toBuffer()],
        program.programId
      );

      await rpcRetry(() =>
        program.methods
          .commitVfinal(marketId, 1, new anchor.BN(commitAmt.toString()))
          .accounts({
            user: u.pubkey,
            market: marketPda,
            commitPool: commitPoolPda,
            commitVault: commitVaultPda,
            commitment: commitmentPda,
            userUsdcAta: atas[u.pubkey.toBase58()],
            usdcMint,
            systemProgram: SystemProgram.programId,
            tokenProgram: TOKEN_PROGRAM_ID,
            rent: anchor.web3.SYSVAR_RENT_PUBKEY,
          })
          .signers(u.signer ? [u.signer] : [])
          .rpc({ commitment: "confirmed" })
      );
    }

    const marketAfter = await program.account.vFinalMarket.fetch(marketPda);
    assert.deepEqual(marketAfter, marketBefore);

    const pool = await program.account.vFinalCommitPool.fetch(commitPoolPda);
    const slot = await connection.getSlot("confirmed");
    const nowSec = (await connection.getBlockTime(slot)) ?? Math.floor(Date.now() / 1000);

    const ok = isThresholdReachedInfo({
      nowTs: nowSec,
      commitCloseTs: Number(marketAfter.commitCloseTs),
      totalCommitted: BigInt(pool.totalCommitted.toString()),
      minToOpenUsd: BigInt(marketAfter.minToOpenUsd.toString()),
    });
    assert.equal(ok, true, "expected threshold reached info to be true");

    const vaultAcc = await getAccount(connection, commitVaultPda);
    assert(Number(vaultAcc.amount) >= Number(minToOpenUsdc), "expected vault to reach threshold");
  });
});
