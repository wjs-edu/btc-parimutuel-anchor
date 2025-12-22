import * as anchor from "@coral-xyz/anchor";
import { PublicKey, SystemProgram } from "@solana/web3.js";
import { createMint, getOrCreateAssociatedTokenAccount, mintTo, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { marketIdFromLabel } from "./utils/runSalt";
import assert from "assert";
import { rpcRetry } from "./utils/rpc";

describe("A4 settle at commit close (CANCEL)", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.BtcParimutuel as anchor.Program<any>;
  const admin = provider.wallet.publicKey;
  const connection = provider.connection;
  const payer = (provider.wallet as any).payer;

  it("settles once after close when below threshold", async () => {
    const marketIdLe = Buffer.alloc(8);
    const marketId = marketIdFromLabel("tests/a4_settle_cancel_at_close.ts");

    marketIdLe.writeBigUInt64LE(BigInt(marketId.toString()));

    const [marketPda] = PublicKey.findProgramAddressSync([Buffer.from("market_v1"), marketIdLe], program.programId);
    const [commitPoolPda] = PublicKey.findProgramAddressSync([Buffer.from("commit_pool_v1"), marketPda.toBuffer()], program.programId);
    const [commitVaultPda] = PublicKey.findProgramAddressSync([Buffer.from("commit_vault_v1"), marketPda.toBuffer()], program.programId);

    const usdcMint = await createMint(connection, payer, admin, null, 6);
    const ata = await getOrCreateAssociatedTokenAccount(connection, payer, usdcMint, admin);
    await mintTo(connection, payer, usdcMint, ata.address, admin, 2_000_000);

    const now = Math.floor(Date.now() / 1000);
    const commitClose = now + 10;

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
          commitment: commitmentPda, userUsdcAta: ata.address, usdcMint,
          systemProgram: SystemProgram.programId, tokenProgram: TOKEN_PROGRAM_ID, rent: anchor.web3.SYSVAR_RENT_PUBKEY,
        })
        .rpc({ commitment: "confirmed" })
    );
    const slot = await connection.getSlot("confirmed");
    const chainNow = (await connection.getBlockTime(slot)) ?? Math.floor(Date.now() / 1000);
    const waitSec = Math.max(0, commitClose - chainNow + 2);
    await new Promise((r) => setTimeout(r, waitSec * 1000));

    await rpcRetry(() =>
      (program as any).methods.settleCommitCloseVfinal(marketId)
        .accounts({ market: marketPda, commitPool: commitPoolPda })
        .rpc({ commitment: "confirmed" })
    );

    let secondThrew = false;
    try {
      await rpcRetry(() =>
        (program as any).methods.settleCommitCloseVfinal(marketId)
          .accounts({ market: marketPda, commitPool: commitPoolPda })
          .rpc({ commitment: "confirmed" })
      );
    } catch { secondThrew = true; }
    assert(secondThrew, "expected second settle to throw");
  });
});
