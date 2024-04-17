import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { findProgramAddressSync } from "@project-serum/anchor/dist/cjs/utils/pubkey";
import { Keypair, PublicKey } from "@solana/web3.js";
import chai, { expect } from "chai";
import chaiAsPromised from "chai-as-promised";

import { airdropSolana, createMockOwnerConfig } from "../helpers";
import { FjordLbp } from "../target/types/fjord_lbp";

chai.use(chaiAsPromised);

/**
 * This test suite is for testing the access control of the Fjord LBP program.
 * We will be using a two-step ownership transfer process where the original owner will be required to nominate a new owner.
 * Which then the new owner must accept for the full ownership transfer to occur.
 */
describe("Fjord LBP - Access Controls", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());
  const { payer: creator }: { payer: Keypair } =
    anchor.workspace.FjordLbp.provider.wallet;

  let testUserA: Keypair;

  const program = anchor.workspace.FjordLbp as Program<FjordLbp>;
  const { connection } = program.provider;

  const programDataAddress = findProgramAddressSync(
    [program.programId.toBytes()],
    new anchor.web3.PublicKey("BPFLoaderUpgradeab1e11111111111111111111111")
  )[0];

  const ownerInitializationParams = createMockOwnerConfig({
    ownerKey: creator.publicKey,
  });

  beforeEach(async () => {
    // Set up a random user
    testUserA = Keypair.generate();
    await airdropSolana(connection, 1, testUserA.publicKey.toBase58());
  });

  describe("Before admin initialization", () => {
    it("Should not be able to initially set program admin/owner as a non-deployer", async () => {
      const params = Object.values(ownerInitializationParams) as any;
      await expect(
        program.methods
          .initializeOwnerConfig(...params)
          .accounts({
            program: program.programId,
            programData: programDataAddress,
            authority: testUserA.publicKey,
          })
          .signers([testUserA])
          .rpc()
      ).to.be.rejectedWith("ConstraintRaw"); // ConstraintRaw is an anchor defined error message which is defined in our program_data in our
    });
  });

  describe("After admin initialization", () => {
    let configPda: PublicKey;
    let bump: number;

    before(async () => {
      [configPda, bump] = findProgramAddressSync(
        [Buffer.from("owner_config")],
        program.programId
      );

      await program.methods
        .initializeOwnerConfig(
          ...(Object.values(ownerInitializationParams) as any)
        )
        .accounts({
          program: program.programId,
          programData: programDataAddress,
        })
        .rpc();

      const ownerConfig = await program.account.ownerConfig.fetch(configPda);

      expect(ownerConfig.owner.toBase58()).to.be.eq(
        creator.publicKey.toBase58()
      );
      expect(ownerConfig.bump).to.be.eq(bump);
    });

    it("Should be able to nominate a new owner and accept as new owner", async () => {
      // This will put the testUserA as a pending owner
      await program.methods
        .nominateNewOwner(testUserA.publicKey)
        .accounts({})
        .rpc();

      const ownerConfig = await program.account.ownerConfig.fetch(configPda);

      expect(ownerConfig.owner.toBase58()).to.be.eq(
        creator.publicKey.toBase58()
      );

      expect(ownerConfig.pendingOwner?.toBase58()).to.be.eq(
        testUserA.publicKey.toBase58()
      );

      // This will accept the pending owner
      await program.methods
        .acceptNewOwner()
        .accounts({ newOwner: testUserA.publicKey })
        .signers([testUserA])
        .rpc();

      const newOwnerConfig = await program.account.ownerConfig.fetch(configPda);
      expect(newOwnerConfig.owner.toBase58()).to.be.eq(
        testUserA.publicKey.toBase58()
      );
    });

    it("Should not be able to nominate a new owner as a non-owner", async () => {
      await expect(
        program.methods
          .nominateNewOwner(testUserA.publicKey)
          .accounts({
            owner: testUserA.publicKey,
          })
          .signers([testUserA])
          .rpc()
      ).to.be.rejectedWith("Unauthorized");
    });

    it("Should not be able to accept a new owner position as a non-pending owner", async () => {
      await expect(
        program.methods
          .acceptNewOwner()
          .accounts({ newOwner: testUserA.publicKey })
          .signers([testUserA])
          .rpc()
      ).to.be.rejectedWith("ConstraintRaw.");
    });
  });

  // Add more tests here if needed.
});
