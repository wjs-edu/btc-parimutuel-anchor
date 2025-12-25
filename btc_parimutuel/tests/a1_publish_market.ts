import { strict as assert } from "assert";
import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { PublicKey, SystemProgram } from "@solana/web3.js";
import { rpcRetry } from "./utils/rpc";
import { marketIdFromLabel } from "./utils/runSalt";

describe("A1 publish_market_vfinal", () => {
  const marketId = marketIdFromLabel("tests/a1_publish_market.ts");

  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.BtcParimutuel as Program;
  const admin = provider.wallet.publicKey;

  it("publishes once and rejects second publish", async () => {
    const conn = provider.connection;
    const now =
      (await conn.getBlockTime(await conn.getSlot("confirmed"))) ??
      Math.floor(Date.now() / 1000);
    const marketIdLe = marketId.toArrayLike(Buffer, "le", 8);

    const [marketPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("market_v1"), marketIdLe],
      program.programId
    );

    const args = {
      variant: 0,
      creator: admin,
      commitOpenTs: new anchor.BN(now),
      commitCloseTs: new anchor.BN(now + 10),
      resolutionTs: new anchor.BN(now + 20),
      overrideMinToOpenUsd: null,
      overrideBetCutoffTs: null,
    };

    const publishSig = await rpcRetry(() =>
      (program as any).methods
        .publishMarketVfinal(marketId, args)
        .accounts({
          admin,
          market: marketPda,
          systemProgram: SystemProgram.programId,
        })
        .rpc({ commitment: "confirmed" })
    );

    console.log("A1 ARTIFACT market_id:", marketId.toString());

    console.log("A1 ARTIFACT market_pda:", marketPda.toBase58());

    console.log("A1 ARTIFACT publish_sig:", publishSig);

    console.log(
      "A1 ARTIFACT publish_url:",
      `https://explorer.solana.com/tx/${publishSig}?cluster=devnet`
    );
    await assert.rejects(
      () =>
        rpcRetry(() =>
          (program as any).methods
            .publishMarketVfinal(marketId, args)
            .accounts({
              admin,
              market: marketPda,
              systemProgram: SystemProgram.programId,
            })
            .rpc({ commitment: "confirmed" })
        ),
      /AlreadyPublished|Market already published/i
    );
  });
});
