import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";

import { FjordLbp } from "../../target/types/fjord_lbp";

describe("Fjord LBP - Deployments", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.FjordLbp as Program<FjordLbp>;

  it("Is initialized!", async () => {
    // Add your test here.
    const tx = await program.methods.initialize().rpc();
    console.log("Your transaction signature", tx);
  });
});
