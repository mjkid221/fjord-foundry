import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { findProgramAddressSync } from "@project-serum/anchor/dist/cjs/utils/pubkey";
import { getAssociatedTokenAddress } from "@solana/spl-token";
import {
  Keypair,
  PublicKey,
  Transaction,
  LAMPORTS_PER_SOL,
  SystemProgram,
} from "@solana/web3.js";
import { BankrunProvider } from "anchor-bankrun";
import chai, { expect } from "chai";
import chaiAsPromised from "chai-as-promised";
import { beforeEach } from "mocha";
import { BanksClient, ProgramTestContext, startAnchor } from "solana-bankrun";

import { BN, BigNumber } from "../../constants";
import {
  createMockOwnerConfig,
  createMockpoolConfig,
  getAccountBalance,
  getAllAccountState,
  setup,
  skipBlockTimestamp,
} from "../../helpers";
import { FjordLbp, IDL } from "../../target/types/fjord_lbp";

chai.use(chaiAsPromised);

describe("Fjord LBP - Pool Management", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());
  const lbpProgramId = (anchor.workspace.FjordLbp as Program<FjordLbp>)
    .programId;

  let creator: Keypair;
  let testUserA: Keypair;

  let shareTokenMint: PublicKey; // project token address
  let assetTokenMint: PublicKey; // collateral token address

  let assetTokenMintUserAccount: PublicKey | undefined;
  let shareTokenMintUserAccount: PublicKey | undefined;

  // Address of the deployed pool
  let poolPda: PublicKey;
  const treasuryPda: PublicKey = PublicKey.findProgramAddressSync(
    [Buffer.from("treasury")],
    lbpProgramId
  )[0];

  // A fixed account that holds the owner configuration of all the pools (e.g. fees)
  let ownerConfigPda: PublicKey;

  // Pool accounts that store the tokens
  let poolShareTokenAccount: PublicKey;
  let poolAssetTokenAccount: PublicKey;

  // creator accounts that holds the tokens
  let creatorShareTokenAccount: PublicKey;
  let creatorAssetTokenAccount: PublicKey;

  let initialProjectTokenBalanceCreator: BigNumber;
  let initialCollateralTokenBalanceCreator: BigNumber;

  // Misc
  let program: Program<FjordLbp> = anchor.workspace
    .FjordLbp as Program<FjordLbp>;
  let { connection } = program.provider;
  let bankRunClient: BanksClient;
  let bankRunCtx: ProgramTestContext;

  beforeEach(async () => {
    // Setup
    testUserA = Keypair.generate();
    creator = anchor.workspace.FjordLbp.provider.wallet.payer;
    program = anchor.workspace.FjordLbp as Program<FjordLbp>;
    connection = program.provider.connection;

    // Setup owner configurations. This includes global pool fees, etc...
    const ownerConfig = createMockOwnerConfig();
    const [programDataAddress] = findProgramAddressSync(
      [program.programId.toBytes()],
      new anchor.web3.PublicKey("BPFLoaderUpgradeab1e11111111111111111111111")
    );

    try {
      // Initialize global pool settings
      const tx = program.methods
        .initializeOwnerConfig(...(Object.values(ownerConfig) as any))
        .accounts({
          program: program.programId,
          programData: programDataAddress,
          authority: creator.publicKey,
        })
        .signers([creator]);

      const pubkeys = await tx.pubkeys();
      ownerConfigPda = pubkeys.config as PublicKey;
      await tx.rpc();
    } catch {
      // Do nothing
    }

    // Setup bankrun client [HACKY]
    // Bankrun runs a fresh instance of the network which doesn't come with a valid program_data account that's needed in initializeOwnerConfig().
    // So we must first start the anchor with our program, then initialize the owner config, then start the bankrun client with the ported over account.
    const ownerConfigAcc = await connection.getAccountInfo(ownerConfigPda);
    const treasuryAcc = await connection.getAccountInfo(treasuryPda);
    bankRunCtx = await startAnchor(
      "",
      [],
      [
        {
          address: ownerConfigPda,
          info: ownerConfigAcc!,
        },
        {
          address: treasuryPda,
          info: treasuryAcc!,
        },
      ]
    );
    const provider = new BankrunProvider(bankRunCtx);
    bankRunClient = bankRunCtx.banksClient;

    program = new Program<FjordLbp>(IDL, lbpProgramId, provider);
    connection = provider.connection;
    creator = bankRunCtx.payer;

    // Transfer some sol to testUserA from creator for fees
    const transferTx = new Transaction();
    transferTx.recentBlockhash = bankRunCtx.lastBlockhash;
    transferTx.feePayer = creator.publicKey;
    transferTx.add(
      SystemProgram.transfer({
        fromPubkey: creator.publicKey,
        toPubkey: testUserA.publicKey,
        lamports: 5 * LAMPORTS_PER_SOL,
      })
    );
    transferTx.sign(creator);
    await bankRunClient.processTransaction(transferTx);

    ({
      tokenAMint: shareTokenMint,
      tokenBMint: assetTokenMint,
      tokenAMintPayerAccount: creatorShareTokenAccount,
      tokenBMintPayerAccount: creatorAssetTokenAccount,
      tokenAUserAccount: shareTokenMintUserAccount,
      tokenBUserAccount: assetTokenMintUserAccount,
    } = await setup({
      payer: creator,
      connection,
      testUser: testUserA,
      bankRunClient,
    }));

    // get token balance
    initialProjectTokenBalanceCreator = await getAccountBalance(
      bankRunCtx.banksClient,
      creator.publicKey,
      shareTokenMint
    );

    initialCollateralTokenBalanceCreator = await getAccountBalance(
      bankRunCtx.banksClient,
      creator.publicKey,
      assetTokenMint
    );

    // Get pool address
    [poolPda] = findProgramAddressSync(
      [
        shareTokenMint.toBuffer(),
        assetTokenMint.toBuffer(),
        creator.publicKey.toBuffer(),
      ],
      program.programId
    );

    // Pre-compute the account addresses
    // These will store the pool's tokens
    poolShareTokenAccount = await getAssociatedTokenAddress(
      shareTokenMint,
      poolPda,
      true
    );
    poolAssetTokenAccount = await getAssociatedTokenAddress(
      assetTokenMint,
      poolPda,
      true
    );

    const sharesAmount = initialProjectTokenBalanceCreator;
    const assetsAmount = initialCollateralTokenBalanceCreator;

    const poolParams = createMockpoolConfig({
      assets: assetsAmount,
      shares: sharesAmount,
      maxSharePrice: BN("1000000000000000000"),
      maxAssetsIn: BN("1000000000000000000"),
      maxSharesOut: BN("1000000000000000000"),
      sellingAllowed: true,
    });

    const formattedPoolParams = Object.values(poolParams) as any;

    await program.methods
      .initializePool(...formattedPoolParams)
      .accounts({
        creator: creator.publicKey,
        shareTokenMint,
        assetTokenMint,
        poolShareTokenAccount,
        poolAssetTokenAccount,
        creatorShareTokenAccount,
        creatorAssetTokenAccount,
      })
      .signers([creator])
      .rpc();

    // Skip time by 1100 seconds
    await skipBlockTimestamp(bankRunCtx, 1100);
  });

  describe("Success case", async () => {
    it("Should be able to pause the pool", async () => {
      const { pool: poolBefore } = await getAllAccountState({
        program,
        poolPda,
        bankRunClient,
        shareTokenMint,
        assetTokenMint,
        user: testUserA.publicKey,
        ownerConfigPda,
        creator: creator.publicKey,
      });

      expect(poolBefore?.paused).to.eq(false);

      await program.methods
        .togglePause()
        .accounts({
          creator: creator.publicKey,
          pool: poolPda,
          assetTokenMint,
          shareTokenMint,
        })
        .signers([creator])
        .rpc();

      const { pool: poolAfter } = await getAllAccountState({
        program,
        poolPda,
        bankRunClient,
        shareTokenMint,
        assetTokenMint,
        user: testUserA.publicKey,
        ownerConfigPda,
        creator: creator.publicKey,
      });

      expect(poolAfter?.paused).to.eq(true);

      const userPoolPda = findProgramAddressSync(
        [testUserA.publicKey.toBuffer(), poolPda.toBuffer()],
        program.programId
      )[0];

      // Try to buy some project tokens
      await expect(
        program.methods
          .swapExactAssetsForShares(BN(10000), BN(10000), null, null)
          .accounts({
            assetTokenMint,
            shareTokenMint,
            user: testUserA.publicKey,
            pool: poolPda,
            poolAssetTokenAccount,
            poolShareTokenAccount,
            userAssetTokenAccount: assetTokenMintUserAccount,
            userShareTokenAccount: shareTokenMintUserAccount,
            config: ownerConfigPda,
            referrerStateInPool: null,
            userStateInPool: userPoolPda,
          })
          .signers([testUserA])
          .rpc()
      ).to.be.rejectedWith("Paused");
    });

    it("Should be able to unpause the pool", async () => {
      await program.methods
        .togglePause()
        .accounts({
          creator: creator.publicKey,
          pool: poolPda,
          assetTokenMint,
          shareTokenMint,
        })
        .signers([creator])
        .rpc();

      const { pool: poolBefore } = await getAllAccountState({
        program,
        poolPda,
        bankRunClient,
        shareTokenMint,
        assetTokenMint,
        user: testUserA.publicKey,
        ownerConfigPda,
        creator: creator.publicKey,
      });

      expect(poolBefore?.paused).to.eq(true);

      await program.methods
        .togglePause()
        .accounts({
          creator: creator.publicKey,
          pool: poolPda,
          assetTokenMint,
          shareTokenMint,
        })
        .signers([creator])
        .rpc();

      const { pool: poolAfterUnpause } = await getAllAccountState({
        program,
        poolPda,
        bankRunClient,
        shareTokenMint,
        assetTokenMint,
        user: testUserA.publicKey,
        ownerConfigPda,
        creator: creator.publicKey,
      });

      expect(poolAfterUnpause?.paused).to.eq(false);
    });
  });

  describe("Failure case", async () => {
    it("Should not be able to pause the pool as a non pool-creator", async () => {
      await expect(
        program.methods
          .togglePause()
          .accounts({
            creator: testUserA.publicKey,
            pool: poolPda,
            assetTokenMint,
            shareTokenMint,
          })
          .signers([testUserA])
          .rpc()
      ).to.be.rejected;
    });
  });
});
