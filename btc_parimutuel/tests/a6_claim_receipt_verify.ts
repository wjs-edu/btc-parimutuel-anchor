import * as anchor from "@coral-xyz/anchor";
import assert from "assert";

describe("A6 claim receipts + verify recomputation", () => {
  it("A6.1 claim creates a receipt (expected to fail until implemented)", async () => {
    // NOTE:
    // This test should use your existing helpers to:
    // 1) create market
    // 2) place bet
    // 3) resolve
    // 4) claim
    //
    // Then it derives the receipt PDA from bet PDA:
    // ["receipt_v1", bet_pda]
    //
    // Finally it asserts the receipt account exists.
    //
    // Replace the stub below with your project’s canonical helper calls.

    throw new Error("TODO: wire to existing market+bet+resolve+claim helpers, then assert receipt PDA exists");
  });
});
