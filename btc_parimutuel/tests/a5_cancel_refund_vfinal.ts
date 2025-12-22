import * as anchor from "@coral-xyz/anchor";
import { PublicKey, SystemProgram, Keypair, LAMPORTS_PER_SOL } from "@solana/web3.js";
import {
  createMint,
  getOrCreateAssociatedTokenAccount,
  mintTo,
  TOKEN_PROGRAM_ID,
  getAccount,
} from "@solana/spl-token";
import { getAssociatedTokenAddressSync } from "@solana/spl-token";
import { marketIdFromLabel } from "./utils/runSalt";
import assert from "assert";
import { rpcRetry, sendAndConfirmRetry } from "./utils/rpc";

function leU64(n: anchor.BN): Buffer {
  const b = Buffer.alloc(8);
  b.writeBigUInt64LE(BigInt(n.toString()));
  return b;
}

function findPdas(programId: PublicKey, marketId: anchor.BN) {
  const marketIdLe = leU64(marketId);
  const [market] = PublicKey.findProgramAddressSync([Buffer.from("market_v1"), marketIdLe], programId);
  const [commitPool] = PublicKey.findProgramAddressSync([Buffer.from("commit_pool_v1"), market.toBuffer()], programId);
  const [commitVault] = PublicKey.findProgramAddressSync([Buffer.from("commit_vault_v1"), market.toBuffer()], programId);
  return { market, commitPool, commitVault };
}

async function waitUntilAfterTs(connection: anchor.web3.Connection, targetTs: number, padSec = 2) {
  const slot = await connection.getSlot("confirmed");
  const chainNow = (await connection.getBlockTime(slot)) ?? Math.floor(Date.now() / 1000);
  const waitSec = Math.max(0, targetTs - chainNow + padSec);
  if (waitSec > 0) await new Promise((r) => setTimeout(r, waitSec * 1000));
}

async function tokenBal(connection: anchor.web3.Connection, ata: PublicKey): Promise<bigint> {
  const info = await connection.getAccountInfo(ata, "confirmed");
  if (info === null) return 0n; // treat missing ATA as zero balance (devnet-safe)
  const acct = await getAccount(connection, ata, "confirmed");
  return acct.amount;
}



async function expectFailContains(p: Promise<any>, needle: string) {
  let threw = false;
  try {
    await p;
  } catch (e: any) {
    threw = true;
    const msg = `${e?.message ?? e}`;
    assert(msg.includes(needle), `expected error to include "${needle}", got: ${msg}`);
  }
  assert(threw, `expected throw containing "${needle}"`);
}

describe("A5 cancel refund + recovery (vFinal)", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.BtcParimutuel as anchor.Program<any>;
  const admin = provider.wallet.publicKey;
  const connection = provider.connection;
  const payer = (provider.wallet as any).payer;

  // NOTE: tests are written to the intended instruction name.
  // If you choose a different name in-program, update here and keep semantics identical.
  const refundMethodName = "refundCommitmentVfinal";

  it("A5.1 refund blocked before commit_close_ts", async () => {
    const marketId = marketIdFromLabel("tests/a5_cancel_refund_vfinal.ts#A5.1");
    assert.strictEqual(typeof (program as any).methods[refundMethodName], "function", "MISSING_REFUND_METHOD:refundCommitmentVfinal");

    const { market: marketPda, commitPool: commitPoolPda, commitVault: commitVaultPda } =
      findPdas(program.programId, marketId);
    const usdcMint = await createMint(connection, payer, admin, null, 6);
      const commitVaultAta = getAssociatedTokenAddressSync(usdcMint, marketPda, true);
    const adminAta = await getOrCreateAssociatedTokenAccount(connection, payer, usdcMint, admin);
    await mintTo(connection, payer, usdcMint, adminAta.address, admin, 2_000_000);
    const now = Math.floor(Date.now() / 1000);
    const commitClose = now + 60;

    await rpcRetry(() =>
      program.methods.publishMarketVfinal(marketId, {
        variant: 0, creator: admin,
        commitOpenTs: new anchor.BN(now - 2),
        commitCloseTs: new anchor.BN(commitClose),
        resolutionTs: new anchor.BN(commitClose + 60),
        overrideMinToOpenUsd: new anchor.BN(20),
        overrideBetCutoffTs: null,
      }).accounts({ admin, market: marketPda, systemProgram: SystemProgram.programId })
        .rpc({ commitment: "confirmed" })
    );
    const [commitmentPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("commitment_v1"), marketPda.toBuffer(), admin.toBuffer()],
      program.programId
    );

    await rpcRetry(() =>
      program.methods.commitVfinal(marketId, 1, new anchor.BN(1_000_000))
        .accounts({
          user: admin, market: marketPda, commitPool: commitPoolPda, commitVault: commitVaultPda,
          commitment: commitmentPda, userUsdcAta: adminAta.address, usdcMint,
          systemProgram: SystemProgram.programId, tokenProgram: TOKEN_PROGRAM_ID, rent: anchor.web3.SYSVAR_RENT_PUBKEY,
        })
        .rpc({ commitment: "confirmed" })
    );
    await expectFailContains(
      rpcRetry(() =>
        (program as any).methods[refundMethodName](marketId)
          .accounts({
            user: admin, market: marketPda, commitPool: commitPoolPda, commitVault: commitVaultPda,
            commitment: commitmentPda, userUsdcAta: adminAta.address, usdcMint,
            systemProgram: SystemProgram.programId, tokenProgram: TOKEN_PROGRAM_ID,
          })
          .rpc({ commitment: "confirmed" })
      ),
      "TooEarly"
    );
  });

it("A5.2 refund blocked when A4 outcome == OPEN", async () => {
    const marketId = marketIdFromLabel("tests/a5_cancel_refund_vfinal.ts#A5.2");
    const marketIdLe = Buffer.alloc(8);
    marketIdLe.writeBigUInt64LE(BigInt(marketId.toString()));
    const [marketPda] = PublicKey.findProgramAddressSync([Buffer.from("market_v1"), marketIdLe], program.programId);
    const [commitPoolPda] = PublicKey.findProgramAddressSync([Buffer.from("commit_pool_v1"), marketPda.toBuffer()], program.programId);
    const [commitVaultPda] = PublicKey.findProgramAddressSync([Buffer.from("commit_vault_v1"), marketPda.toBuffer()], program.programId);

    const usdcMint = await createMint(connection, payer, admin, null, 6);
      const commitVaultAta = getAssociatedTokenAddressSync(usdcMint, marketPda, true);
    const now = Math.floor(Date.now() / 1000);
    const commitClose = now + 120;

    await rpcRetry(() =>
      program.methods.publishMarketVfinal(marketId, {
        variant: 0, creator: admin,
        commitOpenTs: new anchor.BN(now - 2),
        commitCloseTs: new anchor.BN(commitClose),
        resolutionTs: new anchor.BN(commitClose + 60),
        overrideMinToOpenUsd: new anchor.BN(20),
        overrideBetCutoffTs: null,
      }).accounts({ admin, market: marketPda, systemProgram: SystemProgram.programId })
        .rpc({ commitment: "confirmed" })
    );

    const m = await program.account.vFinalMarket.fetch(marketPda);
    const minToOpenUsd = BigInt(m.minToOpenUsd.toString());
    const dominanceCapBps = BigInt(m.dominanceCapBps.toString());
    const minToOpenUsdc = minToOpenUsd * 1_000_000n;
    const capPerUser = (minToOpenUsdc * dominanceCapBps) / 10_000n;
    const commitAmt = capPerUser - 1n;
    const users: { pubkey: PublicKey; signer: Keypair | null }[] = [{ pubkey: admin, signer: null }];
    while (BigInt(users.length) * commitAmt < minToOpenUsdc) {
      const kp = Keypair.generate();
      users.push({ pubkey: kp.publicKey, signer: kp });
    }

    for (let i = 1; i < users.length; i++) {
      const kp = users[i].signer!;
      const tx = new anchor.web3.Transaction().add(
        SystemProgram.transfer({ fromPubkey: admin, toPubkey: kp.publicKey, lamports: Math.floor(0.005 * LAMPORTS_PER_SOL) })
      );
      await sendAndConfirmRetry(provider, tx, [], { commitment: "confirmed" });
    }

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
        program.methods.commitVfinal(marketId, 1, new anchor.BN(commitAmt.toString()))
          .accounts({
            user: u.pubkey, market: marketPda, commitPool: commitPoolPda, commitVault: commitVaultPda,
            commitment: commitmentPda, userUsdcAta: atas[u.pubkey.toBase58()], usdcMint,
            systemProgram: SystemProgram.programId, tokenProgram: TOKEN_PROGRAM_ID, rent: anchor.web3.SYSVAR_RENT_PUBKEY,
          })
          .signers(u.signer ? [u.signer] : [])
          .rpc({ commitment: "confirmed" })
      );
    }

    const slot = await connection.getSlot("confirmed");
    const chainNow = (await connection.getBlockTime(slot)) ?? Math.floor(Date.now() / 1000);
    const waitSec = Math.max(0, commitClose - chainNow + 2);
    await new Promise((r) => setTimeout(r, waitSec * 1000));

    await rpcRetry(() =>
      (program as any).methods.settleCommitCloseVfinal(marketId)
        .accounts({ market: marketPda, commitPool: commitPoolPda })
        .rpc({ commitment: "confirmed" })
    );


    const [adminCommitmentPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("commitment_v1"), marketPda.toBuffer(), admin.toBuffer()],
      program.programId
    );
    const adminAta = atas[admin.toBase58()];

    await expectFailContains(
      rpcRetry(() =>
        (program as any).methods.refundCommitmentVfinal(marketId)
          .accounts({
            user: admin, market: marketPda, commitPool: commitPoolPda, commitVault: commitVaultPda,
            commitment: adminCommitmentPda, userUsdcAta: adminAta, tokenProgram: TOKEN_PROGRAM_ID,
          })
          .rpc({ commitment: "confirmed" })
      ),
      "NotCanceled"
    );
});

it("A5.3 refund succeeds once; second call cannot change balances (idempotent)", async () => {
    const marketId = marketIdFromLabel("tests/a5_cancel_refund_vfinal.ts#A5.3");
  const { market: marketPda, commitPool: commitPoolPda, commitVault: commitVaultPda } =
    findPdas(program.programId, marketId);

  const usdcMint = await createMint(connection, payer, admin, null, 6);
      const commitVaultAta = getAssociatedTokenAddressSync(usdcMint, marketPda, true);
  const adminAta = await getOrCreateAssociatedTokenAccount(connection, payer, usdcMint, admin);
  await mintTo(connection, payer, usdcMint, adminAta.address, admin, 5_000_000);

  const now = Math.floor(Date.now() / 1000);
  const commitClose = now + 20;

  await rpcRetry(() =>
    program.methods.publishMarketVfinal(marketId, {
      variant: 0, creator: admin,
      commitOpenTs: new anchor.BN(now - 2),
      commitCloseTs: new anchor.BN(commitClose),
      resolutionTs: new anchor.BN(commitClose + 60),
      overrideMinToOpenUsd: new anchor.BN(20),
      overrideBetCutoffTs: null,
    }).accounts({ admin, market: marketPda, systemProgram: SystemProgram.programId })
      .rpc({ commitment: "confirmed" })
  );
  const [commitmentPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("commitment_v1"), marketPda.toBuffer(), admin.toBuffer()],
    program.programId
  );

  const amt = 1_000_000n;

  await rpcRetry(() =>
    program.methods.commitVfinal(marketId, 1, new anchor.BN(amt.toString()))
      .accounts({
        user: admin, market: marketPda, commitPool: commitPoolPda, commitVault: commitVaultPda,
        commitment: commitmentPda, userUsdcAta: adminAta.address, usdcMint,
        systemProgram: SystemProgram.programId, tokenProgram: TOKEN_PROGRAM_ID, rent: anchor.web3.SYSVAR_RENT_PUBKEY,
      })
      .rpc({ commitment: "confirmed" })
  );

  await waitUntilAfterTs(connection, commitClose, 2);

  await rpcRetry(() =>
    (program as any).methods.settleCommitCloseVfinal(marketId)
      .accounts({ market: marketPda, commitPool: commitPoolPda })
      .rpc({ commitment: "confirmed" })
  );
  const u0 = await tokenBal(connection, adminAta.address);
  const v0 = await tokenBal(connection, commitVaultAta);

  await rpcRetry(() =>
    (program as any).methods.refundCommitmentVfinal(marketId)
      .accounts({
        user: admin, market: marketPda, commitPool: commitPoolPda, commitVault: commitVaultPda,
        commitment: commitmentPda, userUsdcAta: adminAta.address, tokenProgram: TOKEN_PROGRAM_ID,
      })
      .rpc({ commitment: "confirmed" })
  );

  const u1 = await tokenBal(connection, adminAta.address);
  const v1 = await tokenBal(connection, commitVaultAta);
  assert(u1 - u0 === amt, "refund: user delta");
  assert(v0 - v1 === amt, "refund: vault delta");
  const u2b = await tokenBal(connection, adminAta.address);
  const v2b = await tokenBal(connection, commitVaultAta);

  try {
    await rpcRetry(() =>
      (program as any).methods.refundCommitmentVfinal(marketId)
        .accounts({
          user: admin, market: marketPda, commitPool: commitPoolPda, commitVault: commitVaultPda,
          commitment: commitmentPda, userUsdcAta: adminAta.address, tokenProgram: TOKEN_PROGRAM_ID,
        })
        .rpc({ commitment: "confirmed" })
    );
  } catch {}

  const u2 = await tokenBal(connection, adminAta.address);
  const v2 = await tokenBal(connection, commitVaultAta);
  assert(u2 === u2b, "second refund must not pay again");
  assert(v2 === v2b, "second refund must not drain vault");
});
it("A5.4 order independence (A->B == B->A) + vault conservation", async () => {
    const marketId = marketIdFromLabel("tests/a5_cancel_refund_vfinal.ts#A5.4");
  async function run(order: "AB" | "BA") {
    const marketId = marketIdFromLabel("tests/a5_cancel_refund_vfinal.ts#A5.4-" + order);
      const { market: marketPda, commitPool: commitPoolPda, commitVault: commitVaultPda } =
      findPdas(program.programId, marketId);

    const usdcMint = await createMint(connection, payer, admin, null, 6);
      const commitVaultAta = getAssociatedTokenAddressSync(usdcMint, marketPda, true);
    const now = Math.floor(Date.now() / 1000);
    const commitClose = now + 20;

    await rpcRetry(() =>
      program.methods.publishMarketVfinal(marketId, {
        variant: 0, creator: admin,
        commitOpenTs: new anchor.BN(now - 2),
        commitCloseTs: new anchor.BN(commitClose),
        resolutionTs: new anchor.BN(commitClose + 60),
        overrideMinToOpenUsd: new anchor.BN(20),
        overrideBetCutoffTs: null,
      }).accounts({ admin, market: marketPda, systemProgram: SystemProgram.programId })
        .rpc({ commitment: "confirmed" })
    );
    const kpB = Keypair.generate();
    const tx = new anchor.web3.Transaction().add(
      SystemProgram.transfer({
        fromPubkey: admin,
        toPubkey: kpB.publicKey,
        lamports: Math.floor(0.005 * LAMPORTS_PER_SOL),
      })
    );
    await sendAndConfirmRetry(provider, tx, [], { commitment: "confirmed" });

    const ataA = await getOrCreateAssociatedTokenAccount(connection, payer, usdcMint, admin);
    const ataB = await getOrCreateAssociatedTokenAccount(connection, payer, usdcMint, kpB.publicKey);
    await mintTo(connection, payer, usdcMint, ataA.address, admin, 5_000_000);
    await mintTo(connection, payer, usdcMint, ataB.address, admin, 5_000_000);

    const [cA] = PublicKey.findProgramAddressSync(
      [Buffer.from("commitment_v1"), marketPda.toBuffer(), admin.toBuffer()],
      program.programId
    );
    const [cB] = PublicKey.findProgramAddressSync(
      [Buffer.from("commitment_v1"), marketPda.toBuffer(), kpB.publicKey.toBuffer()],
      program.programId
    );

    const aAmt = 1_000_000n;
    const bAmt = 2_000_000n;
    await rpcRetry(() =>
      program.methods.commitVfinal(marketId, 1, new anchor.BN(aAmt.toString()))
        .accounts({
          user: admin, market: marketPda, commitPool: commitPoolPda, commitVault: commitVaultPda,
          commitment: cA, userUsdcAta: ataA.address, usdcMint,
          systemProgram: SystemProgram.programId, tokenProgram: TOKEN_PROGRAM_ID, rent: anchor.web3.SYSVAR_RENT_PUBKEY,
        }).rpc({ commitment: "confirmed" })
    );

    await rpcRetry(() =>
      program.methods.commitVfinal(marketId, 1, new anchor.BN(bAmt.toString()))
        .accounts({
          user: kpB.publicKey, market: marketPda, commitPool: commitPoolPda, commitVault: commitVaultPda,
          commitment: cB, userUsdcAta: ataB.address, usdcMint,
          systemProgram: SystemProgram.programId, tokenProgram: TOKEN_PROGRAM_ID, rent: anchor.web3.SYSVAR_RENT_PUBKEY,
        }).signers([kpB]).rpc({ commitment: "confirmed" })
    );

    await waitUntilAfterTs(connection, commitClose, 2);

    await rpcRetry(() =>
      (program as any).methods.settleCommitCloseVfinal(marketId)
        .accounts({ market: marketPda, commitPool: commitPoolPda })
        .rpc({ commitment: "confirmed" })
    );
    const a0 = await tokenBal(connection, ataA.address);
    const b0 = await tokenBal(connection, ataB.address);
    const v0 = await tokenBal(connection, commitVaultAta);

    const rA = () => rpcRetry(() =>
      (program as any).methods.refundCommitmentVfinal(marketId)
        .accounts({
          user: admin, market: marketPda, commitPool: commitPoolPda, commitVault: commitVaultPda,
          commitment: cA, userUsdcAta: ataA.address, tokenProgram: TOKEN_PROGRAM_ID,
        }).rpc({ commitment: "confirmed" })
    );
    const rB = () => rpcRetry(() =>
      (program as any).methods.refundCommitmentVfinal(marketId)
        .accounts({
          user: kpB.publicKey, market: marketPda, commitPool: commitPoolPda, commitVault: commitVaultPda,
          commitment: cB, userUsdcAta: ataB.address, tokenProgram: TOKEN_PROGRAM_ID,
        }).signers([kpB]).rpc({ commitment: "confirmed" })
    );

    if (order === "AB") { await rA(); await rB(); } else { await rB(); await rA(); }
      const a1 = await tokenBal(connection, ataA.address);
    const b1 = await tokenBal(connection, ataB.address);
    const v1 = await tokenBal(connection, commitVaultAta);

    assert(((a1 - a0) + (b1 - b0)) === (v0 - v1), "vault conservation violated");
    return { a1, b1, v1 };
  }

  const ab = await run("AB");
  const ba = await run("BA");

  assert(ab.a1 === ba.a1, "order dependence A");
  assert(ab.b1 === ba.b1, "order dependence B");
  assert(ab.v1 === ba.v1, "order dependence vault");
});
});
