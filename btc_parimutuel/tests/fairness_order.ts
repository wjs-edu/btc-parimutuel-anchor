import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Keypair, PublicKey, SystemProgram, SYSVAR_RENT_PUBKEY, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { createMint, getOrCreateAssociatedTokenAccount, mintTo, TOKEN_PROGRAM_ID } from "@solana/spl-token";

async function rpcRetry<T>(fn: () => Promise<T>, tries = 6) {
  let lastErr: any;
  for (let i = 0; i < tries; i++) {
    try { return await fn(); } catch (e: any) {
      lastErr = e; const msg = String(e?.message ?? e);
      if (msg.includes("Blockhash not found")) { await new Promise(r => setTimeout(r, 800)); continue; }
      throw e;
    }
  }
  throw lastErr;
}
describe("fairness (devnet)", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.BtcParimutuel as Program;

  it("payout order-independence (2 winners)", async () => {
    const admin = provider.wallet.publicKey;
    const connection = provider.connection;
    const payer = (provider.wallet as any).payer;

    async function run(claimAB: boolean) {
      const marketId = new anchor.BN(Date.now() + (claimAB ? 0 : 1));
      const marketIdLe = marketId.toArrayLike(Buffer, "le", 8);
      const [marketPda] = PublicKey.findProgramAddressSync([Buffer.from("market"), marketIdLe], program.programId);
      const tokenMint = await createMint(connection, payer, admin, null, 6);
      const usdcVaultAta = await getOrCreateAssociatedTokenAccount(connection, payer, tokenMint, marketPda, true);
      const feeVaultAta = await getOrCreateAssociatedTokenAccount(connection, payer, tokenMint, admin);
      const creatorFeeVaultAta = await getOrCreateAssociatedTokenAccount(connection, payer, tokenMint, admin);

      const slot = await connection.getSlot("confirmed");
      const nowSec = (await connection.getBlockTime(slot)) ?? Math.floor(Date.now() / 1000);

      await rpcRetry(() => (program as any).methods
        .initializeMarket(marketId, new anchor.BN(nowSec + 12), new anchor.BN(100_000 * 100), 2, 200, 50, admin)
        .accounts({
          admin,
          market: marketPda,
          usdcVault: usdcVaultAta.address,
          feeVault: feeVaultAta.address,
          creatorFeeVault: creatorFeeVaultAta.address,
          tokenMint,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
          rent: SYSVAR_RENT_PUBKEY,
        })
        .rpc({ commitment: "confirmed" })
      );
      const userA = Keypair.generate();
      const userB = Keypair.generate();
      const fundTx = new anchor.web3.Transaction().add(
        SystemProgram.transfer({ fromPubkey: admin, toPubkey: userA.publicKey, lamports: Math.floor(0.05 * LAMPORTS_PER_SOL) }),
        SystemProgram.transfer({ fromPubkey: admin, toPubkey: userB.publicKey, lamports: Math.floor(0.05 * LAMPORTS_PER_SOL) })
      );
      await rpcRetry(() => provider.sendAndConfirm(fundTx, [], { commitment: "confirmed" }));

      const ataA = await getOrCreateAssociatedTokenAccount(connection, payer, tokenMint, userA.publicKey);
      const ataB = await getOrCreateAssociatedTokenAccount(connection, payer, tokenMint, userB.publicKey);
      await mintTo(connection, payer, tokenMint, ataA.address, payer, 10_000_000);
      await mintTo(connection, payer, tokenMint, ataB.address, payer, 10_000_000);

      const [betA] = PublicKey.findProgramAddressSync(
        [Buffer.from("bet"), marketPda.toBuffer(), userA.publicKey.toBuffer()],
        program.programId
      );
      const [betB] = PublicKey.findProgramAddressSync(
        [Buffer.from("bet"), marketPda.toBuffer(), userB.publicKey.toBuffer()],
        program.programId
      );
      await rpcRetry(() => (program as any).methods
        .placeBet(marketId, 1, new anchor.BN(1_000_000))
        .accounts({ user: userA.publicKey, userUsdcAta: ataA.address, market: marketPda, bet: betA, usdcVault: usdcVaultAta.address, tokenProgram: TOKEN_PROGRAM_ID, systemProgram: SystemProgram.programId, rent: SYSVAR_RENT_PUBKEY })
        .signers([userA])
        .rpc({ commitment: "confirmed" })
      );
      await rpcRetry(() => (program as any).methods
        .placeBet(marketId, 1, new anchor.BN(1_000_000))
        .accounts({ user: userB.publicKey, userUsdcAta: ataB.address, market: marketPda, bet: betB, usdcVault: usdcVaultAta.address, tokenProgram: TOKEN_PROGRAM_ID, systemProgram: SystemProgram.programId, rent: SYSVAR_RENT_PUBKEY })
        .signers([userB])
        .rpc({ commitment: "confirmed" })
      );
      const now2 = (await connection.getBlockTime(await connection.getSlot("confirmed"))) ?? Math.floor(Date.now() / 1000);
      const mWait = await (program as any).account.market.fetch(marketPda);
      const waitSec = Math.max(0, Number(mWait.resolutionTs) - now2 + 2);
      await new Promise(r => setTimeout(r, waitSec * 1000));

      const m2 = await (program as any).account.market.fetch(marketPda);
      await rpcRetry(() => (program as any).methods
        .resolveMarket(marketId, 1)
        .accounts({ admin, market: marketPda, usdcVault: m2.usdcVault, feeVault: m2.feeVault, creatorFeeVault: m2.creatorFeeVault, tokenProgram: TOKEN_PROGRAM_ID })
        .rpc({ commitment: "confirmed" })
      );
      const bA0 = BigInt((await connection.getTokenAccountBalance(ataA.address)).value.amount);
      const bB0 = BigInt((await connection.getTokenAccountBalance(ataB.address)).value.amount);

      const claim = async (who: "A" | "B") => {
        const u = who === "A" ? userA : userB;
        const b = who === "A" ? betA : betB;
        const a = who === "A" ? ataA : ataB;
        await rpcRetry(() => (program as any).methods
          .claimPayout(marketId)
          .accounts({ user: u.publicKey, market: marketPda, bet: b, usdcVault: m2.usdcVault, userUsdcAta: a.address, tokenProgram: TOKEN_PROGRAM_ID })
          .signers([u])
          .rpc({ commitment: "confirmed" })
        );
      };
      if (claimAB) { await claim("A"); await claim("B"); }
      else { await claim("B"); await claim("A"); }

      const bA1 = BigInt((await connection.getTokenAccountBalance(ataA.address)).value.amount);
      const bB1 = BigInt((await connection.getTokenAccountBalance(ataB.address)).value.amount);
      return [bA1 - bA0, bB1 - bB0] as const;
    }

    const [a1, b1] = await run(true);
    const [a2, b2] = await run(false);
    if (a1 !== a2 || b1 !== b2) throw new Error(`Order-dependence: AB=(${a1},${b1}) BA=(${a2},${b2})`);
  });
});
