import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { findProgramAddressSync } from "@project-serum/anchor/dist/cjs/utils/pubkey";
import { getAssociatedTokenAddress } from "@solana/spl-token";
import { Keypair, PublicKey } from "@solana/web3.js";
import chai, { expect } from "chai";
import chaiAsPromised from "chai-as-promised";
import { addHours } from "date-fns";

import { BN, BigNumber, testMerkleWhitelistedAddresses } from "../constants";
import { createMockpoolConfig, generateMerkleRoot, setup } from "../helpers";
import { FjordLbp } from "../target/types/fjord_lbp";

chai.use(chaiAsPromised);

describe("Fjord LBP - Initialization", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());
  const { payer: creator }: { payer: Keypair } =
    anchor.workspace.FjordLbp.provider.wallet;

  let shareTokenMint: PublicKey; // project token
  let assetTokenMint: PublicKey; // collateral token
  let shareTokenMintPayerAccount: PublicKey;
  let assetTokenMintPayerAccount: PublicKey;

  // Address of the deployed pool
  let poolPda: PublicKey;

  // Pool accounts that store the tokens
  let poolShareTokenAccount: PublicKey;
  let poolAssetTokenAccount: PublicKey;

  // creator accounts that holds the tokens
  let creatorShareTokenAccount: PublicKey;
  let creatorAssetTokenAccount: PublicKey;

  let initialProjectTokenBalanceCreator: BigNumber;
  let initialCollateralTokenBalanceCreator: BigNumber;

  const program = anchor.workspace.FjordLbp as Program<FjordLbp>;
  const { connection } = program.provider;

  beforeEach(async () => {
    ({
      tokenAMint: shareTokenMint,
      tokenBMint: assetTokenMint,
      tokenAMintPayerAccount: shareTokenMintPayerAccount,
      tokenBMintPayerAccount: assetTokenMintPayerAccount,
    } = await setup({ payer: creator, connection }));

    // get token balance
    const {
      value: { amount: amountA },
    } = await connection.getTokenAccountBalance(shareTokenMintPayerAccount);
    initialProjectTokenBalanceCreator = BN(amountA);

    const {
      value: { amount: amountB },
    } = await connection.getTokenAccountBalance(assetTokenMintPayerAccount);
    initialCollateralTokenBalanceCreator = BN(amountB);

    [poolPda] = findProgramAddressSync(
      [
        shareTokenMint.toBuffer(),
        assetTokenMint.toBuffer(),
        creator.publicKey.toBuffer(),
      ],
      program.programId
    );

    // Pre-compute the account addresses
    // These will be the pool's token balances
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

    // These are "our" accounts for our share and asset tokens
    creatorShareTokenAccount = await getAssociatedTokenAddress(
      shareTokenMint,
      creator.publicKey
    );

    creatorAssetTokenAccount = await getAssociatedTokenAddress(
      assetTokenMint,
      creator.publicKey
    );
  });

  it("Is initialized!", async () => {
    const sharesAmount = initialProjectTokenBalanceCreator;
    const assetsAmount = initialCollateralTokenBalanceCreator;

    const {
      virtualAssets,
      virtualShares,
      maxSharePrice,
      maxSharesOut,
      maxAssetsIn,
      startWeightBasisPoints,
      endWeightBasisPoints,
      saleStartTime,
      saleEndTime,
      vestCliff,
      vestEnd,
      whitelistMerkleRoot,
      sellingAllowed,
    } = createMockpoolConfig({
      assets: assetsAmount,
      shares: sharesAmount,
      whitelistMerkleRoot: generateMerkleRoot(testMerkleWhitelistedAddresses),
    });

    // We need to subscribe to the events manually unlike Ethereum's hardhat
    const events: any[] = [];
    const poolCreationEventListener = program.addEventListener(
      "PoolCreatedEvent",
      (event) => {
        events.push(event);
      }
    );

    await program.methods
      .initializePool(
        assetsAmount,
        sharesAmount,
        virtualAssets,
        virtualShares,
        maxSharePrice,
        maxSharesOut,
        maxAssetsIn,
        startWeightBasisPoints,
        endWeightBasisPoints,
        saleStartTime,
        saleEndTime,
        vestCliff,
        vestEnd,
        whitelistMerkleRoot,
        sellingAllowed
      )
      .accounts({
        creator: creator.publicKey,
        shareTokenMint,
        assetTokenMint,
        poolShareTokenAccount,
        poolAssetTokenAccount,
        creatorShareTokenAccount,
        creatorAssetTokenAccount,
      })
      .rpc();

    const pool = await program.account.liquidityBootstrappingPool.fetch(
      poolPda
    );

    // Get token balance of creator
    const {
      value: { amount: shareTokenBalanceCreator },
    } = await connection.getTokenAccountBalance(assetTokenMintPayerAccount);

    const {
      value: { amount: assetTokenBalanceCreator },
    } = await connection.getTokenAccountBalance(assetTokenMintPayerAccount);

    // Get token balance of the pool
    const {
      value: { amount: shareTokenBalancePool },
    } = await connection.getTokenAccountBalance(poolShareTokenAccount);

    const {
      value: { amount: assetTokenBalancePool },
    } = await connection.getTokenAccountBalance(poolAssetTokenAccount);

    // Check that relevant balances have been updated
    expect(shareTokenBalanceCreator).to.eq("0");
    expect(assetTokenBalanceCreator).to.eq("0");
    expect(shareTokenBalancePool).to.eq(sharesAmount.toString());
    expect(assetTokenBalancePool).to.eq(assetsAmount.toString());
    expect(events.length).to.equal(1);
    // Check the event has fired.
    expect(events[0].pool.toBase58()).to.equal(poolPda?.toBase58());
    // Check the pool settings
    expect(pool.assetToken.toBase58()).to.eq(assetTokenMint.toBase58());
    expect(pool.shareToken.toBase58()).to.eq(shareTokenMint.toBase58());
    expect(pool.creator.toBase58()).to.eq(creator.publicKey.toBase58());
    expect(pool.virtualAssets.toString()).to.eq(virtualAssets.toString());
    expect(pool.virtualShares.toString()).to.eq(virtualShares.toString());
    expect(pool.maxSharePrice.toString()).to.eq(maxSharePrice.toString());
    expect(pool.maxSharesOut.toString()).to.eq(maxSharesOut.toString());
    expect(pool.maxAssetsIn.toString()).to.eq(maxAssetsIn.toString());
    expect(pool.startWeightBasisPoints).to.eq(startWeightBasisPoints);
    expect(pool.endWeightBasisPoints).to.eq(endWeightBasisPoints);
    expect(pool.saleStartTime.toString()).to.eq(saleStartTime.toString());
    expect(pool.saleEndTime.toString()).to.eq(saleEndTime.toString());
    expect(pool.vestCliff.toString()).to.eq(vestCliff.toString());
    expect(pool.vestEnd.toString()).to.eq(vestEnd.toString());
    expect(pool.whitelistMerkleRoot.toString()).to.be.eq(
      whitelistMerkleRoot.toString()
    );
    expect(pool.sellingAllowed).to.eq(sellingAllowed);

    // Remove event listener
    program.removeEventListener(poolCreationEventListener);
  });

  it("Should not be able to initialize the pool twice", async () => {
    const sharesAmount = initialProjectTokenBalanceCreator;
    const assetsAmount = initialCollateralTokenBalanceCreator;

    const poolParams = createMockpoolConfig({
      shares: sharesAmount,
      assets: assetsAmount,
      whitelistMerkleRoot: generateMerkleRoot(testMerkleWhitelistedAddresses),
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
      .rpc();

    // Initialize again. It should fail with a program error 0x0 which is a native check in the program
    await expect(
      program.methods
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
        .rpc()
    ).to.be.rejectedWith("custom program error: 0x0");
  });
  it("Should not be able to deploy the pool with same project and collateral token", async () => {
    const sharesAmount = initialProjectTokenBalanceCreator;

    const poolParams = createMockpoolConfig({
      shares: sharesAmount,
      assets: sharesAmount,
    });

    const formattedPoolParams = Object.values(poolParams) as any;

    // Deploy the pool
    await expect(
      program.methods
        .initializePool(...formattedPoolParams)
        .accounts({
          creator: creator.publicKey,
          shareTokenMint: assetTokenMint,
          assetTokenMint,
          poolShareTokenAccount: poolAssetTokenAccount,
          poolAssetTokenAccount,
          creatorShareTokenAccount: creatorAssetTokenAccount,
          creatorAssetTokenAccount,
        })
        .rpc()
    ).to.be.rejected;
  });

  it("Should not be able to deploy the pool with sale end time within one day of current time", async () => {
    const sharesAmount = initialProjectTokenBalanceCreator;
    const assetsAmount = initialCollateralTokenBalanceCreator;

    // Sale end time is 23 hours from now
    const invalidTime = addHours(new Date(), 23).getTime() / 1000;
    const poolParams = createMockpoolConfig({
      shares: sharesAmount,
      assets: assetsAmount,
      saleEndTime: BN(invalidTime),
    });

    const formattedPoolParams = Object.values(poolParams) as any;

    // Deploy the pool
    await expect(
      program.methods
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
        .rpc()
    ).to.be.rejectedWith("SalePeriodLow");
  });

  it("Should not be able to deploy the pool if the sale period between start and end time is less than a day", async () => {
    throw Error("Not implemented");
  });

  it("Should not be able to deploy the pool if the sale end time is before the vesting end time", async () => {
    throw Error("Not implemented");
  });

  it("Should not be able to deploy the pool if the sale end time is after the vesting cliff time", async () => {
    throw Error("Not implemented");
  });

  it("Should not be able to deploy the pool if the vesting cliff time is after or during the vesting end time", async () => {
    throw Error("Not implemented");
  });

  it("Should not be able to deploy the pool if the start weight is smaller than 1%", async () => {
    throw Error("Not implemented");
  });

  it("Should not be able to deploy the pool if the start weight is greater than 99%", async () => {
    throw Error("Not implemented");
  });

  it("Should not be able to deploy the pool if the end weight is smaller than 1%", async () => {
    throw Error("Not implemented");
  });

  it("Should not be able to deploy the pool if the end weight is greater than 99%", async () => {
    throw Error("Not implemented");
  });

  it("Should not be able to deploy the pool if deposited collateral tokens (asset token) is 0 and virtual assets is also 0 ", async () => {
    throw Error("Not implemented");
  });

  // Add more tests here if needed.
});
