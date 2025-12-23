export function isThresholdReachedInfo(params: {
  nowTs: number;
  commitCloseTs: number;
  totalCommitted: bigint;   // USDC smallest units
  minToOpenUsd: bigint;     // whole USD units
}): boolean {
  const minToOpenUsdc = params.minToOpenUsd * 1_000_000n;
  return params.nowTs < params.commitCloseTs && params.totalCommitted >= minToOpenUsdc;
}
