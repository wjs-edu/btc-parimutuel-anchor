import * as anchor from "@coral-xyz/anchor";
import crypto from "crypto";

// Stable per process; different across separate suite reruns.
// CI should provide GITHUB_RUN_ID / CI_PIPELINE_ID; local falls back to time+pid.
const RAW =
  process.env.GITHUB_RUN_ID ??
  process.env.CI_PIPELINE_ID ??
  process.env.TEST_RUN_ID ??
  `${Date.now()}-${process.pid}`;

const RUN_SALT = crypto.createHash("sha256").update(RAW).digest().subarray(0, 8);

export function marketIdFromLabel(label: string): anchor.BN {
  const h = crypto.createHash("sha256").update(label).digest().subarray(0, 8);
  const out = Buffer.alloc(8);
  for (let i = 0; i < 8; i++) out[i] = h[i] ^ RUN_SALT[i];
  return new anchor.BN(out, "le");
}
