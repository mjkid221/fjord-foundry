import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { findProgramAddressSync } from "@project-serum/anchor/dist/cjs/utils/pubkey";
import { MAX_FEE_BASIS_POINTS } from "@solana/spl-token";
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

  const treasuryPda: PublicKey = PublicKey.findProgramAddressSync(
    [Buffer.from("treasury")],
    program.programId
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
      ).to.be.rejectedWith("NotUpgradeAuthority");
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
      ).to.be.rejectedWith("Unauthorized");
    });

    it("Should be able to change the treasury fee recipients as a owner", async () => {
      const newSwapFeeRecipient = Keypair.generate().publicKey;
      const newFeesPercentages = [];
      const newFeeRecipients = [];
      const newRecipientsSize = 5;
      for (let i = 0; i < newRecipientsSize; i += 1) {
        newFeeRecipients.push(Keypair.generate().publicKey);
        newFeesPercentages.push(MAX_FEE_BASIS_POINTS / newRecipientsSize);
      }
      await program.methods
        .setTreasuryFeeRecipients(
          newSwapFeeRecipient,
          newFeeRecipients,
          newFeesPercentages
        )
        .accounts({ owner: creator.publicKey, treasury: treasuryPda })
        .signers([creator])
        .rpc();

      const treasury = await program.account.treasury.fetch(treasuryPda);

      const newTreasuryFeeRecipients = treasury.feeRecipients.map(
        (x) => x.user
      );
      const newTreasuryFeePercentages = treasury.feeRecipients.map(
        (x) => x.percentage
      );
      expect(newTreasuryFeeRecipients).to.deep.eq(newFeeRecipients);
      expect(newTreasuryFeePercentages).to.deep.eq(newFeesPercentages);
    });

    it("Should not be able to change the treasury fee recipients if not the same length as percentages", async () => {
      const newSwapFeeRecipient = Keypair.generate().publicKey;
      const newFeesPercentages: number[] = [];
      const newFeeRecipients = [];
      for (let i = 0; i < 2; i += 1) {
        newFeeRecipients.push(Keypair.generate().publicKey);
      }

      await expect(
        program.methods
          .setTreasuryFeeRecipients(
            newSwapFeeRecipient,
            newFeeRecipients,
            newFeesPercentages
          )
          .accounts({ owner: creator.publicKey, treasury: treasuryPda })
          .signers([creator])
          .rpc()
      ).to.be.rejectedWith("InvalidFeeRecipients.");
    });

    it("Should not be able to change treasury settings as a non-owner", async () => {
      const newSwapFeeRecipient = Keypair.generate().publicKey;
      const newFeesPercentages = [];
      const newFeeRecipients = [];
      for (let i = 0; i < 10; i += 1) {
        newFeeRecipients.push(Keypair.generate().publicKey);
        newFeesPercentages.push(1000); // 1% each
      }

      await expect(
        program.methods
          .setTreasuryFeeRecipients(
            newSwapFeeRecipient,
            newFeeRecipients,
            newFeesPercentages
          )
          .accounts({ owner: testUserA.publicKey, treasury: treasuryPda })
          .signers([testUserA])
          .rpc()
      ).to.be.rejectedWith("Unauthorized");
    });

    it("Should not be able to change to invalid treasury fees", async () => {
      const invalidFee = 10001; // 100.01%
      const newSwapFeeRecipient = Keypair.generate().publicKey;
      const newFeesPercentages = [];
      const newFeeRecipients = [];
      for (let i = 0; i < 10; i += 1) {
        newFeeRecipients.push(Keypair.generate().publicKey);
        newFeesPercentages.push(invalidFee);
      }
      await expect(
        program.methods
          .setTreasuryFeeRecipients(
            newSwapFeeRecipient,
            newFeeRecipients,
            newFeesPercentages
          )
          .accounts({ owner: creator.publicKey, treasury: treasuryPda })
          .signers([creator])
          .rpc()
      ).to.be.rejectedWith("MaxFeeExceeded");
    });

    it("Should be able to set pool fees as a owner", async () => {
      const newPlatformFee = 300;
      const newReferralFee = 300;
      const newSwapFee = 300;

      await program.methods
        .setFees(newPlatformFee, newReferralFee, newSwapFee)
        .accounts({ owner: creator.publicKey })
        .signers([creator])
        .rpc();

      const { platformFee, swapFee, referralFee } =
        await program.account.ownerConfig.fetch(configPda);

      expect(platformFee).to.eq(newPlatformFee);
      expect(swapFee).to.eq(newSwapFee);
      expect(referralFee).to.eq(newReferralFee);
    });

    it("Should not be able to set pool fees as a non-owner", async () => {
      const newPlatformFee = 300;
      const newReferralFee = 300;
      const newSwapFee = 300;

      await expect(
        program.methods
          .setFees(newPlatformFee, newReferralFee, newSwapFee)
          .accounts({ owner: testUserA.publicKey })
          .signers([testUserA])
          .rpc()
      ).to.be.rejectedWith("Unauthorized");
    });

    it("Should not be able to change to invalid pool fee percentages", async () => {
      const invalidFee = 10001;

      await expect(
        program.methods
          .setFees(invalidFee, null, null)
          .accounts({ owner: creator.publicKey })
          .signers([creator])
          .rpc()
      ).to.be.rejectedWith("MaxFeeExceeded");

      await expect(
        program.methods
          .setFees(null, invalidFee, null)
          .accounts({ owner: creator.publicKey })
          .signers([creator])
          .rpc()
      ).to.be.rejectedWith("MaxFeeExceeded");

      await expect(
        program.methods
          .setFees(null, null, invalidFee)
          .accounts({ owner: creator.publicKey })
          .signers([creator])
          .rpc()
      ).to.be.rejectedWith("MaxFeeExceeded");
    });

    it("Should not be able to set pool fees total to more than 100%", async () => {
      const newPlatformFee = 5000;
      const newReferralFee = 5000;
      const newSwapFee = 5000;

      await expect(
        program.methods
          .setFees(newPlatformFee, newReferralFee, newSwapFee)
          .accounts({ owner: creator.publicKey })
          .signers([creator])
          .rpc()
      ).to.be.rejectedWith("MaxFeeExceeded");
    });

    // This test must come last as it will change the owner
    it("Should be able to nominate a new owner and accept as new owner", async () => {
      // Try using owner only functions
      await expect(
        program.methods
          .setFees(200, null, null)
          .accounts({ owner: testUserA.publicKey })
          .signers([testUserA])
          .rpc()
      ).to.be.rejectedWith("Unauthorized");

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

      // Try using owner only functions
      const newPlatformFee = 200;
      await program.methods
        .setFees(newPlatformFee, null, null)
        .accounts({ owner: testUserA.publicKey })
        .signers([testUserA])
        .rpc();

      const { platformFee } = await program.account.ownerConfig.fetch(
        configPda
      );
      expect(platformFee).to.eq(newPlatformFee);
    });
  });

  // Add more tests here if needed.
});
