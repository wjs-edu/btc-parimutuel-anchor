import * as anchor from "@coral-xyz/anchor";

function sleep(ms: number) { return new Promise((r) => setTimeout(r, ms)); }

export async function rpcRetry<T>(fn: () => Promise<T>, retries = 12) {
  let lastErr: any;
  for (let i = 0; i < retries; i++) {
    try { return await fn(); }
    catch (e: any) {
      lastErr = e;
      const msg = String(e?.message ?? e);
      const retryable =
        msg.includes("Blockhash not found") ||
        msg.includes("Node is behind") ||
        msg.includes("Transaction was not confirmed") ||
        msg.includes("429") ||
        msg.includes("timed out");
      if (!retryable) throw e;
      await sleep(800 * (i + 1));
    }
  }
  throw lastErr;
}

export async function sendAndConfirmRetry(
  provider: anchor.AnchorProvider,
  tx: anchor.web3.Transaction,
  signers: anchor.web3.Signer[] = [],
  opts: anchor.web3.ConfirmOptions = { commitment: "confirmed" },
  retries = 12
) {
  return rpcRetry(() => provider.sendAndConfirm(tx, signers, opts), retries);
}
