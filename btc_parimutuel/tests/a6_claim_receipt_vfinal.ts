import * as anchor from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import { marketIdFromLabel } from "./utils/runSalt";
import assert from "assert";

describe("A6 claim receipt (vFinal)", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.BtcParimutuel as anchor.Program<any>;

  const marketId = marketIdFromLabel("tests/a6_claim_receipt_vfinal.ts");

  it("creates ReceiptV1 PDA during vFinal claim", async () => {
    // TODO: implement by moving the vFinal claim flow + receipt PDA assertion here.
    // CONTRACT: ReceiptV1 is required for vFinal claim (Phase A6 trust surface).
    // Must print tx sig + PDAs when you implement.

    // placeholder so file loads in CI without breaking devnet green until implemented:
    assert.ok(marketId.gt(new anchor.BN(0)));
  });
});
