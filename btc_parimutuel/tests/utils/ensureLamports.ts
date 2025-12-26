import { Connection, PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";

export async function ensureLamports(
  connection: Connection,
  pubkey: PublicKey,
  minLamports: number = 2 * LAMPORTS_PER_SOL
) {
  const bal = await connection.getBalance(pubkey, "confirmed");
  if (bal >= minLamports) return;

  throw new Error(
    `ensureLamports: insufficient SOL for CI payer. pubkey=${pubkey.toBase58()} balance=${bal} < ${minLamports}.`
  );
}
