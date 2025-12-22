import * as anchor from "@coral-xyz/anchor";

function sleep(ms: number) { return new Promise((r) => setTimeout(r, ms)); }

export async function rpcRetry<T>(fn: () => Promise<T>, retries = 18) {
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
        msg.includes("Too many requests") ||
        msg.includes("Transaction simulation failed") ||
        msg.includes("timed out");
      if (!retryable) throw e;
      await sleep(1200 * (i + 1));
    }
  }
  throw lastErr;
}

export async function sendAndConfirmRetry(
  provider: anchor.AnchorProvider,
  tx: anchor.web3.Transaction,
  signers: anchor.web3.Signer[] = [],
  opts: anchor.web3.ConfirmOptions = { commitment: "confirmed" },
  retries = 18
) {
  return rpcRetry(() => provider.sendAndConfirm(tx, signers, opts), retries);
}

export async function waitForAccount(connection: any, pubkey: any, tries = 20, delayMs = 500) {
  for (let i = 0; i < tries; i++) {
    const info = await connection.getAccountInfo(pubkey, "confirmed");
    if (info && info.data && info.data.length > 0) return;
    await new Promise((r) => setTimeout(r, delayMs));
  }
  throw new Error(`waitForAccount: ${pubkey.toBase58?.() ?? String(pubkey)} not initialized after ${tries} tries`);
}
