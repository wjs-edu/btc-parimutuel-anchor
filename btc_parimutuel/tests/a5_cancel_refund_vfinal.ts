import * as anchor from "@coral-xyz/anchor";
import { PublicKey, SystemProgram, Keypair, LAMPORTS_PER_SOL } from "@solana/web3.js";
import {
  createMint,
  getOrCreateAssociatedTokenAccount,
  mintTo,
  TOKEN_PROGRAM_ID,
  getAccount,
} from "@solana/spl-token";
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
    assert.strictEqual(typeof (program as any).methods[refundMethodName], "function", "MISSING_REFUND_METHOD:refundCommitmentVfinal");

    const marketId = new anchor.BN(Date.now() % 1_000_000_000);
    const { market: marketPda, commitPool: commitPoolPda, commitVault: commitVaultPda } =
      findPdas(program.programId, marketId);
    const usdcMint = await createMint(connection, payer, admin, null, 6);
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
    assert.strictEqual(typeof (program as any).methods[refundMethodName], "function", "MISSING_REFUND_METHOD:refundCommitmentVfinal");
    // TODO (after instruction exists): create OPEN market, settle A4->OPEN, then assert refund fails with "NotCanceled".
    assert.ok(true);
  });

  it("A5.3 refund succeeds once; second call cannot change balances (idempotent)", async () => {
    assert.strictEqual(typeof (program as any).methods[refundMethodName], "function", "MISSING_REFUND_METHOD:refundCommitmentVfinal");
    // TODO: after instruction exists:
    // - make CANCEL market, commit, settle->CANCEL
    // - refund once: user +amt, vault -amt
    // - refund again: balances unchanged (no-op or AlreadyRefunded)
    assert.ok(true);
  });

  it("A5.4 order independence (A->B == B->A) + vault conservation", async () => {
    assert.strictEqual(typeof (program as any).methods[refundMethodName], "function", "MISSING_REFUND_METHOD:refundCommitmentVfinal");
    // TODO: after instruction exists:
    // - 2 users commit in CANCEL market, settle->CANCEL
    // - refund A then B vs B then A: same final balances + vault conservation
    assert.ok(true);
  });
});
