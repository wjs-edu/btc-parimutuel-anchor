export function isBlockhashFlake(e: any): boolean {
  const msg = String(e?.message ?? e);
  return msg.includes("Blockhash not found") || msg.includes("blockhash not found");
}

export async function withBlockhashRetry<T>(label: string, fn: () => Promise<T>, max = 5): Promise<T> {
  let last: any;
  for (let i = 0; i <= max; i++) {
    try {
      return await fn();
    } catch (e) {
      last = e;
      if (!isBlockhashFlake(e) || i === max) break;
      // eslint-disable-next-line no-console
      console.warn(`[blockhashRetry] ${label} retry ${i + 1}/${max}`);
      await new Promise((r) => setTimeout(r, 400 * (i + 1)));
    }
  }
  throw last;
}
