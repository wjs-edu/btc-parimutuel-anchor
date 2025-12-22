export function isDevnet(): boolean {
  const url = (process.env.ANCHOR_PROVIDER_URL ?? "").toLowerCase();
  return url.includes("devnet") || url.includes("api.devnet.solana.com");
}
