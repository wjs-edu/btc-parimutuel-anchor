import { Connection, PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";

const attempted = new Set<string>();

export async function ensureLamports(
  connection: Connection,
  pubkey: PublicKey,
  minLamports: number = 2 * LAMPORTS_PER_SOL
) {
  const key = pubkey.toBase58();

  // Don't spam faucet for the same key in one test run.
  if (attempted.has(key)) {
    const bal = await connection.getBalance(pubkey, "confirmed");
    if (bal < minLamports) {
      throw new Error(`ensureLamports: already attempted airdrop for ${key}; balance still low ${bal} < ${minLamports}`);
    }
    return;
  }

  const bal = await connection.getBalance(pubkey, "confirmed");
  if (bal >= minLamports) return;

  attempted.add(key);

  try {
    const sig = await connection.requestAirdrop(pubkey, Math.max(minLamports, 2 * LAMPORTS_PER_SOL));
    const bh = await connection.getLatestBlockhash("confirmed");
    await connection.confirmTransaction({ signature: sig, ...bh }, "confirmed");
  } catch (e: any) {
    const msg = (e?.message || String(e)).toLowerCase();
    if (msg.includes("429") || msg.includes("too many requests") || msg.includes("airdrop")) {
      throw new Error("ensureLamports: devnet faucet rate-limited (429). Reduce airdrop calls; fund payer once with buffer.");
    }
    throw e;
  }

  const bal2 = await connection.getBalance(pubkey, "confirmed");
  if (bal2 < minLamports) throw new Error(`ensureLamports failed: balance=${bal2} < ${minLamports} for ${key}`);
}
