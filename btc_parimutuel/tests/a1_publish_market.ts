import { strict as assert } from "assert";
import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { PublicKey, SystemProgram } from "@solana/web3.js";

describe("A1 publish_market_vfinal", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.BtcParimutuel as Program;
  const admin = provider.wallet.publicKey;

  it("publishes once and rejects second publish", async () => {
    const conn = provider.connection;
    const now = (await conn.getBlockTime(await conn.getSlot("confirmed"))) ?? Math.floor(Date.now()/1000);
    const marketId = new anchor.BN(Date.now());
    const marketIdLe = marketId.toArrayLike(Buffer, "le", 8);
    const [marketPda] = PublicKey.findProgramAddressSync([Buffer.from("market_v1"), marketIdLe], program.programId);

    await program.methods.publishMarketVfinal(
      marketId,
      { variant: 0, creator: admin, commitOpenTs: new anchor.BN(now), commitCloseTs: new anchor.BN(now+10), resolutionTs: new anchor.BN(now+20), overrideMinToOpenUsd: null, overrideBetCutoffTs: null }
    ).accounts({ admin, market: marketPda, systemProgram: SystemProgram.programId }).rpc({ commitment: "confirmed" });

    await assert.rejects(
      program.methods.publishMarketVfinal(
        marketId,
        { variant: 0, creator: admin, commitOpenTs: new anchor.BN(now), commitCloseTs: new anchor.BN(now+10), resolutionTs: new anchor.BN(now+20), overrideMinToOpenUsd: null, overrideBetCutoffTs: null }
      ).accounts({ admin, market: marketPda, systemProgram: SystemProgram.programId }).rpc({ commitment: "confirmed" }),
      /AlreadyPublished|Market already published/i
    );
  });
});
