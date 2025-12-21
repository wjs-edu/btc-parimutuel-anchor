import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { PublicKey, SystemProgram, SYSVAR_RENT_PUBKEY, Keypair, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { createMint, getOrCreateAssociatedTokenAccount, mintTo, TOKEN_PROGRAM_ID } from "@solana/spl-token";

process.env.ANCHOR_PROVIDER_URL = process.env.ANCHOR_PROVIDER_URL || "https://api.devnet.solana.com";
process.env.ANCHOR_WALLET = process.env.ANCHOR_WALLET || (process.env.HOME + "/.config/solana/id.json");

async function rpcRetry<T>(fn: () => Promise<T>, tries = 6) {
  let lastErr: any;
  for (let i = 0; i < tries; i++) {
    try { return await fn(); }
    catch (e: any) {
      lastErr = e;
      const msg = String(e?.message ?? e);
      if (msg.includes("Blockhash not found")) { await new Promise((r) => setTimeout(r, 600)); continue; }
      throw e;
    }
  }
  throw lastErr;
}

describe("btc_parimutuel devnet smoke", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.BtcParimutuel as Program;

  it("initialize_market idempotent", async () => {
    const admin = provider.wallet.publicKey;
    const connection = provider.connection;
    const payer = (provider.wallet as any).payer;

    // Multi-market: fresh market id each run (u64) so devnet never "expires"
    const marketId = new anchor.BN(Math.floor(Date.now() / 1000));

    // PDA seeds = ["market", market_id (u64 LE)]
    const marketIdLe = marketId.toArrayLike(Buffer, "le", 8);
    const [marketPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("market"), marketIdLe],
      program.programId
    );

    const tokenMint = await createMint(connection, payer, admin, null, 6);
    const usdcVaultAta = await getOrCreateAssociatedTokenAccount(connection, payer, tokenMint, marketPda, true);
    const feeVaultAta = await getOrCreateAssociatedTokenAccount(connection, payer, tokenMint, admin);
    const creatorFeeVaultAta = await getOrCreateAssociatedTokenAccount(connection, payer, tokenMint, admin);

    const existing = await (program as any).account.market.fetchNullable(marketPda);
    if (existing) {
      console.log("market exists:", {
        status: existing.status,
        admin: existing.admin?.toBase58?.() ?? String(existing.admin),
        resolutionTs: existing.resolutionTs?.toString?.() ?? String(existing.resolutionTs),
        usdcMint: existing.usdcMint?.toBase58?.() ?? String(existing.usdcMint),
      });
    }

    const slot = await connection.getSlot("confirmed");
    const nowSec = (await connection.getBlockTime(slot)) ?? Math.floor(Date.now() / 1000);

    try {
      const txSig = await rpcRetry(() =>
        (program as any).methods
          .initializeMarket(
            marketId,
            new anchor.BN(nowSec + 12),
            new anchor.BN(100_000 * 100),
            2,
            200,
            50,
            admin
          )
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
      console.log("initializeMarket tx:", txSig);
    } catch (e: any) {
      const msg = String(e?.message ?? e);
      console.log("initializeMarket threw:", msg);
      const after = await (program as any).account.market.fetch(marketPda);
      if (msg.includes("MarketNotOpen") || msg.includes("6001")) {
        if (after.status !== 1) throw new Error("Expected OPEN after MarketNotOpen");
        // continue (market already open on devnet)
      } else {
        throw e;
      }
    }

    // -----------------------------
    // place_bet (devnet) - setup
    // -----------------------------
    const marketAcc = await (program as any).account.market.fetch(marketPda);
    const marketMint = marketAcc.usdcMint;
    const marketVault = marketAcc.usdcVault;

    const userKp = Keypair.generate();
    // Fund user via admin transfer (devnet airdrop is flaky)
    const tx = new anchor.web3.Transaction().add(
      SystemProgram.transfer({
        fromPubkey: admin,
        toPubkey: userKp.publicKey,
        lamports: Math.floor(0.05 * LAMPORTS_PER_SOL),
      })
    );
    const sig = await rpcRetry(() => provider.sendAndConfirm(tx, [], { commitment: "confirmed" }));
    console.log("fund user tx:", sig);

    const userAta = await getOrCreateAssociatedTokenAccount(
      connection,
      payer,
      marketMint,
      userKp.publicKey
    );

    // Mint 10 tokens (decimals=6 => 10_000_000)
    await mintTo(connection, payer, marketMint, userAta.address, payer, 10_000_000);

    const [betPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("bet"), marketPda.toBuffer(), userKp.publicKey.toBuffer()],
      program.programId
    );

    const betTx = await rpcRetry(() =>
      (program as any).methods
        .placeBet(marketId, 1, new anchor.BN(1_000_000)) // direction=1, amount=1 token
        .accounts({
          user: userKp.publicKey,
          userUsdcAta: userAta.address,
          market: marketPda,
          bet: betPda,
          usdcVault: marketVault,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
          rent: SYSVAR_RENT_PUBKEY,
        })
        .signers([userKp])
        .rpc({ commitment: "confirmed" })
    );

    console.log("placeBet tx:", betTx);
    // wait until resolution_ts passes, then resolve + claim
    // wait until on-chain time >= resolution_ts (devnet can be slow)
    const slot2 = await connection.getSlot("confirmed");
    const now2 = (await connection.getBlockTime(slot2)) ?? Math.floor(Date.now() / 1000);
    const mWait = await (program as any).account.market.fetch(marketPda);
    const waitSec = Math.max(0, Number(mWait.resolutionTs) - now2 + 2);
    console.log("waiting seconds until resolution:", waitSec);
    await new Promise((r) => setTimeout(r, waitSec * 1000));

    const m2 = await (program as any).account.market.fetch(marketPda);
    const before = (await connection.getTokenAccountBalance(userAta.address)).value.amount;

    const resolveTx = await rpcRetry(() =>
      (program as any).methods
        .resolveMarket(marketId, 1) // outcome=1 (UP)
        .accounts({
          admin: admin,
          market: marketPda,
          usdcVault: m2.usdcVault,
          feeVault: m2.feeVault,
          creatorFeeVault: m2.creatorFeeVault,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .rpc({ commitment: "confirmed" })
    );
    console.log("resolveMarket tx:", resolveTx);

    const claimTx = await rpcRetry(() =>
      (program as any).methods
        .claimPayout(marketId)
        .accounts({
          user: userKp.publicKey,
          market: marketPda,
          bet: betPda,
          usdcVault: m2.usdcVault,
          userUsdcAta: userAta.address,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .signers([userKp])
        .rpc({ commitment: "confirmed" })
    );
    console.log("claimPayout tx:", claimTx);

    const after = (await connection.getTokenAccountBalance(userAta.address)).value.amount;
    console.log("user ATA balance before/after:", before, after);



  });
});
