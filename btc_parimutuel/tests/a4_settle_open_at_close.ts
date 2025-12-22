import * as anchor from "@coral-xyz/anchor";
import { PublicKey, SystemProgram, Keypair, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { createMint, getOrCreateAssociatedTokenAccount, mintTo, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { marketIdFromLabel } from "./utils/runSalt";
import assert from "assert";
import { rpcRetry, sendAndConfirmRetry } from "./utils/rpc";

describe("A4 settle at commit close (OPEN)", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.BtcParimutuel as anchor.Program<any>;
  const admin = provider.wallet.publicKey;
  const connection = provider.connection;
  const payer = (provider.wallet as any).payer;

  it("does not settle early; settles once after close", async () => {
    const marketIdLe = Buffer.alloc(8);
    marketIdLe.writeBigUInt64LE(BigInt(marketId.toString()));
    const [marketPda] = PublicKey.findProgramAddressSync([Buffer.from("market_v1"), marketIdLe], program.programId);
    const [commitPoolPda] = PublicKey.findProgramAddressSync([Buffer.from("commit_pool_v1"), marketPda.toBuffer()], program.programId);
    const [commitVaultPda] = PublicKey.findProgramAddressSync([Buffer.from("commit_vault_v1"), marketPda.toBuffer()], program.programId);

    const usdcMint = await createMint(connection, payer, admin, null, 6);
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
    let earlyThrew = false;
    try {
      await rpcRetry(() =>
        (program as any).methods.settleCommitCloseVfinal(marketId)
          .accounts({ market: marketPda, commitPool: commitPoolPda })
          .rpc({ commitment: "confirmed" })
      );
    } catch { earlyThrew = true; }
    assert(earlyThrew, "expected early settle to throw");

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
