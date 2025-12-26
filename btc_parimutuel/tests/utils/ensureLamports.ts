import { Connection, PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";

export async function ensureLamports(
  connection: Connection,
  pubkey: PublicKey,
  minLamports: number = 2 * LAMPORTS_PER_SOL
) {
  const bal = await connection.getBalance(pubkey, "confirmed");
  if (bal >= minLamports) return;

  const sig = await connection.requestAirdrop(pubkey, Math.max(minLamports, 2 * LAMPORTS_PER_SOL));
  const bh = await connection.getLatestBlockhash("confirmed");
  await connection.confirmTransaction({ signature: sig, ...bh }, "confirmed");

  const bal2 = await connection.getBalance(pubkey, "confirmed");
  if (bal2 < minLamports) throw new Error(`ensureLamports failed: balance=${bal2} < ${minLamports}`);
}
