import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { findProgramAddressSync } from "@project-serum/anchor/dist/cjs/utils/pubkey";
import { getAssociatedTokenAddress } from "@solana/spl-token";
import { Keypair, PublicKey } from "@solana/web3.js";
import chai, { expect } from "chai";
import chaiAsPromised from "chai-as-promised";

import {
  BN,
  BigNumber,
  PERCENTAGE_BASIS_POINTS,
  testMerkleWhitelistedAddresses,
} from "../constants";
import {
  Accounts,
  createMockpoolConfig,
  formatPoolParams,
  generateMerkleRoot,
  generateTimestamp,
  setup,
} from "../helpers";
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

  let accounts: Accounts;

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

    accounts = {
      creator: creator.publicKey,
      shareTokenMint,
      assetTokenMint,
      poolShareTokenAccount,
      poolAssetTokenAccount,
      creatorShareTokenAccount,
      creatorAssetTokenAccount,
    };
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
      .accounts(accounts)
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

    const formattedPoolParams = formatPoolParams(poolParams);
    await program.methods
      .initializePool(...formattedPoolParams)
      .accounts(accounts)
      .rpc();

    // Initialize again. It should fail with a program error 0x0 which is a native check in the program
    await expect(
      program.methods
        .initializePool(...formattedPoolParams)
        .accounts(accounts)
        .rpc()
    ).to.be.rejectedWith("custom program error: 0x0");
  });

  it("Should not be able to deploy the pool with same project and collateral token", async () => {
    const sharesAmount = initialProjectTokenBalanceCreator;

    const poolParams = createMockpoolConfig({
      shares: sharesAmount,
      assets: sharesAmount,
    });

    const formattedPoolParams = formatPoolParams(poolParams);
    // Deploy the pool
    await expect(
      program.methods
        .initializePool(...formattedPoolParams)
        .accounts({
          ...accounts,
          shareTokenMint: assetTokenMint,
          poolShareTokenAccount: poolAssetTokenAccount,
          creatorShareTokenAccount: creatorAssetTokenAccount,
        })
        .rpc()
    ).to.be.rejected;
  });

  it("Should not be able to deploy the pool with sale end time within one day of current time", async () => {
    const sharesAmount = initialProjectTokenBalanceCreator;
    const assetsAmount = initialCollateralTokenBalanceCreator;

    // Sale end time is 23 hours from now
    const invalidTime = generateTimestamp(23);
    const poolParams = createMockpoolConfig({
      shares: sharesAmount,
      assets: assetsAmount,
      saleEndTime: BN(invalidTime),
    });

    const formattedPoolParams = formatPoolParams(poolParams);

    // Deploy the pool
    await expect(
      program.methods
        .initializePool(...formattedPoolParams)
        .accounts(accounts)
        .rpc()
    ).to.be.rejectedWith("SalePeriodLow");
  });

  it("Should not be able to deploy the pool if the sale period between start and end time is less than a day", async () => {
    const sharesAmount = initialProjectTokenBalanceCreator;
    const assetsAmount = initialCollateralTokenBalanceCreator;

    const validStartTime = generateTimestamp(240); // 10 days from now
    const invalidEndTime = generateTimestamp(240 + 23); // 10 days and 23 hours from now

    // Create pool with sale period less than a day
    const poolParams = createMockpoolConfig({
      shares: sharesAmount,
      assets: assetsAmount,
      saleStartTime: BN(validStartTime),
      saleEndTime: BN(invalidEndTime),
    });

    const formattedPoolParams = formatPoolParams(poolParams);

    // Deploy the pool
    await expect(
      program.methods
        .initializePool(...formattedPoolParams)
        .accounts(accounts)
        .rpc()
    ).to.be.rejectedWith("SalePeriodLow");
  });

  it("Should not be able to deploy the pool if the sale end time is after the vesting end time", async () => {
    const sharesAmount = initialProjectTokenBalanceCreator;
    const assetsAmount = initialCollateralTokenBalanceCreator;

    const validStartTime = generateTimestamp(240); // 10 days from now
    const validEndTime = generateTimestamp(240 + 48); // 10 days and 48 hours from now
    const invalidVestEndTime = generateTimestamp(240 + 47); // 10 days and 47 hours from now
    const validVestCliffTime = generateTimestamp(240 + 50); // 10 days and 50 hours from now

    // Create pool with invalid vesting end time
    const poolParams = createMockpoolConfig({
      shares: sharesAmount,
      assets: assetsAmount,
      saleStartTime: BN(validStartTime),
      saleEndTime: BN(validEndTime),
      vestEnd: BN(invalidVestEndTime),
      vestCliff: BN(validVestCliffTime),
    });

    const formattedPoolParams = formatPoolParams(poolParams);

    // Deploy the pool
    await expect(
      program.methods
        .initializePool(...formattedPoolParams)
        .accounts(accounts)
        .rpc()
    ).to.be.rejectedWith("InvalidVestEnd");
  });

  it("Should not be able to deploy the pool if the sale end time is after the vesting cliff time", async () => {
    const sharesAmount = initialProjectTokenBalanceCreator;
    const assetsAmount = initialCollateralTokenBalanceCreator;

    const validStartTime = generateTimestamp(240); // 10 days from now
    const validEndTime = generateTimestamp(240 + 48); // 10 days and 48 hours from now
    const invalidVestCliffTime = generateTimestamp(240 + 47); // 10 days and 47 hours from now
    const validVestEndTime = generateTimestamp(240 + 49); // 10 days and 49 hours from now

    // Create pool with sale period less than a day
    const poolParams = createMockpoolConfig({
      shares: sharesAmount,
      assets: assetsAmount,
      saleStartTime: BN(validStartTime),
      saleEndTime: BN(validEndTime),
      vestCliff: BN(invalidVestCliffTime),
      vestEnd: BN(validVestEndTime),
    });

    const formattedPoolParams = formatPoolParams(poolParams);

    // Deploy the pool
    await expect(
      program.methods
        .initializePool(...formattedPoolParams)
        .accounts(accounts)
        .rpc()
    ).to.be.rejectedWith("InvalidVestCliff");
  });

  it("Should not be able to deploy the pool if the vesting cliff time is after or during the vesting end time", async () => {
    const sharesAmount = initialProjectTokenBalanceCreator;
    const assetsAmount = initialCollateralTokenBalanceCreator;

    const validStartTime = generateTimestamp(240); // 10 days from now
    const validEndTime = generateTimestamp(240 + 48); // 10 days and 48 hours from now
    const invalidVestCliffTime = generateTimestamp(240 + 50); // 10 days and 50 hours from now
    const validVestEndTime = generateTimestamp(240 + 49); // 10 days and 49 hours from now

    // Create pool with invalid vesting cliff after vesting end time
    const poolParams = createMockpoolConfig({
      shares: sharesAmount,
      assets: assetsAmount,
      saleStartTime: BN(validStartTime),
      saleEndTime: BN(validEndTime),
      vestCliff: BN(invalidVestCliffTime),
      vestEnd: BN(validVestEndTime),
    });

    // Create pool with vesting cliff at the same time as vesting end time
    const poolParams2 = createMockpoolConfig({
      shares: sharesAmount,
      assets: assetsAmount,
      saleStartTime: BN(validStartTime),
      saleEndTime: BN(validEndTime),
      vestCliff: BN(validVestEndTime),
      vestEnd: BN(validVestEndTime),
    });

    const formattedPoolParams = formatPoolParams(poolParams);
    const formattedPoolParams2 = formatPoolParams(poolParams2);

    // Deploy the pool with invalid vesting cliff time after vesting end time
    await expect(
      program.methods
        .initializePool(...formattedPoolParams)
        .accounts(accounts)
        .rpc()
    ).to.be.rejectedWith("InvalidVestEnd");

    // Deploy the pool with vesting cliff time at the same time as vesting end time
    await expect(
      program.methods
        .initializePool(...formattedPoolParams2)
        .accounts(accounts)
        .rpc()
    ).to.be.rejectedWith("InvalidVestEnd");
  });

  it("Should not be able to deploy the pool if the start weight is smaller than 1%", async () => {
    const sharesAmount = initialProjectTokenBalanceCreator;
    const assetsAmount = initialCollateralTokenBalanceCreator;

    // Create pool with invalid start weight
    const poolParams = createMockpoolConfig({
      shares: sharesAmount,
      assets: assetsAmount,
      startWeightBasisPoints: 0.99 * PERCENTAGE_BASIS_POINTS, // 0.99%
    });

    const formattedPoolParams = formatPoolParams(poolParams);

    // Deploy the pool
    await expect(
      program.methods
        .initializePool(...formattedPoolParams)
        .accounts(accounts)
        .rpc()
    ).to.be.rejectedWith("InvalidWeightConfig");
  });

  it("Should deploy the pool if the start weight is 1%", async () => {
    const sharesAmount = initialProjectTokenBalanceCreator;
    const assetsAmount = initialCollateralTokenBalanceCreator;

    // Create pool with valid start weight
    const poolParams = createMockpoolConfig({
      shares: sharesAmount,
      assets: assetsAmount,
      startWeightBasisPoints: 1 * PERCENTAGE_BASIS_POINTS, // 1%
    });

    const formattedPoolParams = formatPoolParams(poolParams);

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
    ).to.be.fulfilled;
  });

  it("Should not be able to deploy the pool if the start weight is a negative percentage", async () => {
    const sharesAmount = initialProjectTokenBalanceCreator;
    const assetsAmount = initialCollateralTokenBalanceCreator;

    // Create pool with invalid start weight
    const poolParams = createMockpoolConfig({
      shares: sharesAmount,
      assets: assetsAmount,
      startWeightBasisPoints: -1 * PERCENTAGE_BASIS_POINTS, // -1%
    });

    const formattedPoolParams = formatPoolParams(poolParams);

    // Deploy the pool
    await expect(
      program.methods
        .initializePool(...formattedPoolParams)
        .accounts(accounts)
        .rpc()
    ).to.be.rejectedWith(/out of range/i);
  });

  it("Should not be able to deploy the pool if the start weight is greater than 99%", async () => {
    const sharesAmount = initialProjectTokenBalanceCreator;
    const assetsAmount = initialCollateralTokenBalanceCreator;

    // Create pool with invalid start weight
    const poolParams = createMockpoolConfig({
      shares: sharesAmount,
      assets: assetsAmount,
      startWeightBasisPoints: 99.01 * PERCENTAGE_BASIS_POINTS, // 99.01%
    });

    const formattedPoolParams = formatPoolParams(poolParams);

    // Deploy the pool
    await expect(
      program.methods
        .initializePool(...formattedPoolParams)
        .accounts(accounts)
        .rpc()
    ).to.be.rejectedWith("InvalidWeightConfig");
  });

  it("Should deploy the pool if the start weight is 99%", async () => {
    const sharesAmount = initialProjectTokenBalanceCreator;
    const assetsAmount = initialCollateralTokenBalanceCreator;

    // Create pool with valid start weight of 99%
    const poolParams = createMockpoolConfig({
      shares: sharesAmount,
      assets: assetsAmount,
      startWeightBasisPoints: 99 * PERCENTAGE_BASIS_POINTS, // 99%
    });

    const formattedPoolParams = formatPoolParams(poolParams);

    // Deploy the pools
    await expect(
      program.methods
        .initializePool(...formattedPoolParams)
        .accounts(accounts)
        .rpc()
    ).to.be.fulfilled;
  });

  it("Should not be able to deploy the pool if the end weight is smaller than 1%", async () => {
    const sharesAmount = initialProjectTokenBalanceCreator;
    const assetsAmount = initialCollateralTokenBalanceCreator;

    // Create pool with invalid end weight
    const poolParams = createMockpoolConfig({
      shares: sharesAmount,
      assets: assetsAmount,
      endWeightBasisPoints: 0.05 * PERCENTAGE_BASIS_POINTS, // 0.05%
    });

    const formattedPoolParams = formatPoolParams(poolParams);

    // Deploy the pool
    await expect(
      program.methods
        .initializePool(...formattedPoolParams)
        .accounts(accounts)
        .rpc()
    ).to.be.rejectedWith("InvalidWeightConfig");
  });

  it("Should not be able to deploy the pool if the end weight is a negative percentage", async () => {
    const sharesAmount = initialProjectTokenBalanceCreator;
    const assetsAmount = initialCollateralTokenBalanceCreator;

    // Create pool with invalid end weight
    const poolParams = createMockpoolConfig({
      shares: sharesAmount,
      assets: assetsAmount,
      endWeightBasisPoints: -1 * PERCENTAGE_BASIS_POINTS, // -1%
    });

    const formattedPoolParams = formatPoolParams(poolParams);

    // Deploy the pool
    await expect(
      program.methods
        .initializePool(...formattedPoolParams)
        .accounts(accounts)
        .rpc()
    ).to.be.rejectedWith(/out of range/i);
  });

  it("Should deploy the pool if the end weight is 1%", async () => {
    const sharesAmount = initialProjectTokenBalanceCreator;
    const assetsAmount = initialCollateralTokenBalanceCreator;

    // Create pool with valid end weight
    const poolParams = createMockpoolConfig({
      shares: sharesAmount,
      assets: assetsAmount,
      endWeightBasisPoints: 1 * PERCENTAGE_BASIS_POINTS, // 1%
    });

    const formattedPoolParams = formatPoolParams(poolParams);

    // Deploy the pool
    await expect(
      program.methods
        .initializePool(...formattedPoolParams)
        .accounts(accounts)
        .rpc()
    ).to.be.fulfilled;
  });

  it("Should not be able to deploy the pool if the end weight is greater than 99%", async () => {
    const sharesAmount = initialProjectTokenBalanceCreator;
    const assetsAmount = initialCollateralTokenBalanceCreator;

    // Create pool with invalid end weight
    const poolParams = createMockpoolConfig({
      shares: sharesAmount,
      assets: assetsAmount,
      endWeightBasisPoints: 99.01 * PERCENTAGE_BASIS_POINTS, // 99.01%
    });

    const formattedPoolParams = formatPoolParams(poolParams);
    // Deploy the pool
    await expect(
      program.methods
        .initializePool(...formattedPoolParams)
        .accounts(accounts)
        .rpc()
    ).to.be.rejectedWith("InvalidWeightConfig");
  });

  it("Should deploy the pool if the end weight is 99%", async () => {
    const sharesAmount = initialProjectTokenBalanceCreator;
    const assetsAmount = initialCollateralTokenBalanceCreator;

    // Create pool with valid end weight of 99%
    const poolParams = createMockpoolConfig({
      shares: sharesAmount,
      assets: assetsAmount,
      endWeightBasisPoints: 99 * PERCENTAGE_BASIS_POINTS, // 99%
    });

    const formattedPoolParams = formatPoolParams(poolParams);

    // Deploy the pool
    await expect(
      program.methods
        .initializePool(...formattedPoolParams)
        .accounts(accounts)
        .rpc()
    ).to.be.fulfilled;
  });

  it("Should not be able to deploy the pool if deposited collateral tokens (asset token) is 0 and virtual assets is also 0 ", async () => {
    const sharesAmount = initialProjectTokenBalanceCreator;

    // Create pool with invalid asset token and virtual assets
    const poolParams = createMockpoolConfig({
      shares: sharesAmount,
      assets: BN(0),
      virtualAssets: BN(0),
    });

    const formattedPoolParams = formatPoolParams(poolParams);

    // Deploy the pool
    await expect(
      program.methods
        .initializePool(...formattedPoolParams)
        .accounts(accounts)
        .rpc()
    ).to.be.rejectedWith("InvalidAssetValue");
  });

  it("Should deploy the pool with a positive value for the assetToken if the deposited collateral tokens (asset token) is a negative value", async () => {
    const sharesAmount = initialProjectTokenBalanceCreator;

    // Create pool with invalid asset token and valid virtual assets
    const poolParams = createMockpoolConfig({
      shares: sharesAmount,
      assets: BN(-20000000000000),
      virtualAssets: BN(0),
    });

    const formattedPoolParams = formatPoolParams(poolParams);

    // Deploy the pool
    await expect(
      program.methods
        .initializePool(...formattedPoolParams)
        .accounts(accounts)
        .rpc()
    ).to.be.fulfilled;

    const {
      value: { amount: assetTokenBalancePool },
    } = await connection.getTokenAccountBalance(poolAssetTokenAccount);

    expect(assetTokenBalancePool).to.eq("20000000000000");
  });

  it("Should be able to deploy the pool with a positive virtual assets number if the deposited collateral tokens (asset token) 0 and the virtual assets are a negative value", async () => {
    const sharesAmount = initialProjectTokenBalanceCreator;

    // Create pool with invalid asset token and valid virtual assets
    const poolParams = createMockpoolConfig({
      shares: sharesAmount,
      assets: BN(0),
      virtualAssets: BN(-20000000000000),
    });

    const formattedPoolParams = formatPoolParams(poolParams);

    // Deploy the pool
    await expect(
      program.methods
        .initializePool(...formattedPoolParams)
        .accounts(accounts)
        .rpc()
    ).to.be.fulfilled;

    const pool = await program.account.liquidityBootstrappingPool.fetch(
      poolPda
    );

    expect(Number(pool.virtualAssets)).to.eq(20000000000000);
  });

  it("Should deploy the pool if the deposited collateral tokens (asset token) is 0 and virtual assets is not 0 ", async () => {
    const sharesAmount = initialProjectTokenBalanceCreator;

    // Create pool with valid asset token and virtual assets
    const poolParams = createMockpoolConfig({
      shares: sharesAmount,
      assets: BN(0),
      virtualAssets: BN(1000000000000),
    });

    const formattedPoolParams = formatPoolParams(poolParams);

    // Deploy the pool
    await expect(
      program.methods
        .initializePool(...formattedPoolParams)
        .accounts(accounts)
        .rpc()
    ).to.be.fulfilled;
  });

  it("Should not be able to deploy the pool if deposited project tokens (share token) is 0 and virtual shares is also 0 ", async () => {
    const assetsAmount = initialCollateralTokenBalanceCreator;
    // Create pool with invalid share token and virtual shares
    const poolParams = createMockpoolConfig({
      shares: BN(0),
      assets: assetsAmount,
      virtualShares: BN(0),
    });

    const formattedPoolParams = formatPoolParams(poolParams);

    // Deploy the pool
    await expect(
      program.methods
        .initializePool(...formattedPoolParams)
        .accounts(accounts)
        .rpc()
    ).to.be.rejectedWith("InvalidShareValue");
  });

  it("Should be able to deploy the pool with a positive shareToken value if the deposited project tokens (share token) is a negative value", async () => {
    const assetsAmount = initialCollateralTokenBalanceCreator;

    // Create pool with invalid share token and valid virtual shares
    const poolParams = createMockpoolConfig({
      shares: BN(-100000000),
      assets: assetsAmount,
      virtualShares: BN(0),
    });

    const formattedPoolParams = formatPoolParams(poolParams);

    // Deploy the pool
    await expect(
      program.methods
        .initializePool(...formattedPoolParams)
        .accounts(accounts)
        .rpc()
    ).to.be.fulfilled;

    const {
      value: { amount: shareTokenBalancePool },
    } = await connection.getTokenAccountBalance(poolShareTokenAccount);

    expect(shareTokenBalancePool).to.eq("100000000");
  });

  it("Should be able to deploy the pool with a positive virtual shares value if the deposited project tokens (share token) 0 and the virtual shares are a negative value", async () => {
    const assetsAmount = initialCollateralTokenBalanceCreator;

    // Create pool with valid share token and invalid virtual shares
    const poolParams = createMockpoolConfig({
      shares: BN(0),
      assets: assetsAmount,
      virtualShares: BN(-100000000),
    });

    const formattedPoolParams = formatPoolParams(poolParams);

    // Deploy the pool
    await expect(
      program.methods
        .initializePool(...formattedPoolParams)
        .accounts(accounts)
        .rpc()
    ).to.be.fulfilled;

    const pool = await program.account.liquidityBootstrappingPool.fetch(
      poolPda
    );

    expect(Number(pool.virtualShares)).to.eq(100000000);
  });

  it("Should deploy the pool if the deposited project tokens (share token) is 0 and virtual shares is not 0 ", async () => {
    const assetsAmount = initialCollateralTokenBalanceCreator;

    // Create pool with valid share token and virtual shares
    const poolParams = createMockpoolConfig({
      shares: BN(0),
      assets: assetsAmount,
      virtualShares: BN(1000000000000),
    });

    const formattedPoolParams = formatPoolParams(poolParams);

    // Deploy the pool
    await expect(
      program.methods
        .initializePool(...formattedPoolParams)
        .accounts(accounts)
        .rpc()
    ).to.be.fulfilled;
  });

  it("Should not be able to deploy the pool if the share token mint is undefined", async () => {
    const sharesAmount = initialProjectTokenBalanceCreator;
    const assetsAmount = initialCollateralTokenBalanceCreator;

    // Create pool with undefined share token mint
    const poolParams = createMockpoolConfig({
      shares: sharesAmount,
      assets: assetsAmount,
    });

    const formattedPoolParams = formatPoolParams(poolParams);

    // Deploy the pool
    await expect(
      program.methods
        .initializePool(...formattedPoolParams)
        .accounts({ ...accounts, shareTokenMint: undefined })
        .rpc()
    ).to.be.rejectedWith("Invalid arguments: pool not provided.");
  });

  it("Should not be able to deploy the pool if the asset token mint is undefined", async () => {
    const sharesAmount = initialProjectTokenBalanceCreator;
    const assetsAmount = initialCollateralTokenBalanceCreator;

    // Create pool with undefined asset token mint
    const poolParams = createMockpoolConfig({
      shares: sharesAmount,
      assets: assetsAmount,
    });

    const formattedPoolParams = formatPoolParams(poolParams);

    // Deploy the pool
    await expect(
      program.methods
        .initializePool(...formattedPoolParams)
        .accounts({
          ...accounts,
          assetTokenMint: undefined,
        })
        .rpc()
    ).to.be.rejectedWith("Invalid arguments: pool not provided.");
  });

  it("Should not be able to deploy the pool if the pool share token account is undefined", async () => {
    const sharesAmount = initialProjectTokenBalanceCreator;
    const assetsAmount = initialCollateralTokenBalanceCreator;

    // Create pool with undefined pool share token account
    const poolParams = createMockpoolConfig({
      shares: sharesAmount,
      assets: assetsAmount,
    });

    const formattedPoolParams = formatPoolParams(poolParams);

    // Deploy the pool
    await expect(
      program.methods
        .initializePool(...formattedPoolParams)
        .accounts({ ...accounts, poolShareTokenAccount: undefined })
        .rpc()
    ).to.be.rejectedWith(
      "Invalid arguments: poolShareTokenAccount not provided."
    );
  });

  it("Should not be able to deploy the pool if the pool asset token account is undefined", async () => {
    const sharesAmount = initialProjectTokenBalanceCreator;
    const assetsAmount = initialCollateralTokenBalanceCreator;

    // Create pool with undefined pool asset token account
    const poolParams = createMockpoolConfig({
      shares: sharesAmount,
      assets: assetsAmount,
    });

    const formattedPoolParams = formatPoolParams(poolParams);

    // Deploy the pool
    await expect(
      program.methods
        .initializePool(...formattedPoolParams)
        .accounts({
          ...accounts,
          poolAssetTokenAccount: undefined,
        })
        .rpc()
    ).to.be.rejectedWith(
      "Invalid arguments: poolAssetTokenAccount not provided."
    );
  });

  it("Should not be able to deploy the pool if the creator share token account is undefined", async () => {
    const sharesAmount = initialProjectTokenBalanceCreator;
    const assetsAmount = initialCollateralTokenBalanceCreator;

    // Create pool with undefined creator share token account
    const poolParams = createMockpoolConfig({
      shares: sharesAmount,
      assets: assetsAmount,
    });

    const formattedPoolParams = formatPoolParams(poolParams);

    // Deploy the pool
    await expect(
      program.methods
        .initializePool(...formattedPoolParams)
        .accounts({
          ...accounts,
          creatorShareTokenAccount: undefined,
        })
        .rpc()
    ).to.be.rejectedWith(
      "Invalid arguments: creatorShareTokenAccount not provided."
    );
  });

  it("Should not be able to deploy the pool if the creator asset token account is undefined", async () => {
    const sharesAmount = initialProjectTokenBalanceCreator;
    const assetsAmount = initialCollateralTokenBalanceCreator;

    // Create pool with undefined creator asset token account
    const poolParams = createMockpoolConfig({
      shares: sharesAmount,
      assets: assetsAmount,
    });

    const formattedPoolParams = formatPoolParams(poolParams);

    // Deploy the pool
    await expect(
      program.methods
        .initializePool(...formattedPoolParams)
        .accounts({
          ...accounts,
          creatorAssetTokenAccount: undefined,
        })
        .rpc()
    ).to.be.rejectedWith(
      "Invalid arguments: creatorAssetTokenAccount not provided."
    );
  });

  it("Should not be able to deploy the pool if max share price is 0", async () => {
    const sharesAmount = initialProjectTokenBalanceCreator;
    const assetsAmount = initialCollateralTokenBalanceCreator;

    // Create pool with invalid max share price
    const poolParams = createMockpoolConfig({
      shares: sharesAmount,
      assets: assetsAmount,
      maxSharePrice: BN(0),
    });

    const formattedPoolParams = formatPoolParams(poolParams);

    // Deploy the pool
    await expect(
      program.methods
        .initializePool(...formattedPoolParams)
        .accounts(accounts)
        .rpc()
    ).to.be.rejectedWith("InvalidSharePrice");
  });

  it("Should be able to deploy the pool with a positive max share price value if max share price is a negative value", async () => {
    const sharesAmount = initialProjectTokenBalanceCreator;
    const assetsAmount = initialCollateralTokenBalanceCreator;

    // Create pool with invalid max share price
    const poolParams = createMockpoolConfig({
      shares: sharesAmount,
      assets: assetsAmount,
      maxSharePrice: BN(-100000000),
    });

    const formattedPoolParams = formatPoolParams(poolParams);

    // Deploy the pool
    await expect(
      program.methods
        .initializePool(...formattedPoolParams)
        .accounts(accounts)
        .rpc()
    ).to.be.fulfilled;

    const pool = await program.account.liquidityBootstrappingPool.fetch(
      poolPda
    );

    expect(Number(pool.maxSharePrice)).to.eq(100000000);
  });

  it("Should deploy the pool if max share price is not 0", async () => {
    const sharesAmount = initialProjectTokenBalanceCreator;
    const assetsAmount = initialCollateralTokenBalanceCreator;

    // Create pool with valid max share price
    const poolParams = createMockpoolConfig({
      shares: sharesAmount,
      assets: assetsAmount,
      maxSharePrice: BN(1000000000000),
    });

    const formattedPoolParams = formatPoolParams(poolParams);
    // Deploy the pool
    await expect(
      program.methods
        .initializePool(...formattedPoolParams)
        .accounts(accounts)
        .rpc()
    ).to.be.fulfilled;
  });

  it("Should not deploy if the maxSharesOut is 0", async () => {
    const sharesAmount = initialProjectTokenBalanceCreator;
    const assetsAmount = initialCollateralTokenBalanceCreator;

    // Create pool with invalid max share price
    const poolParams = createMockpoolConfig({
      shares: sharesAmount,
      assets: assetsAmount,
      maxSharesOut: BN(0),
    });

    const formattedPoolParams = formatPoolParams(poolParams);

    // Deploy the pool
    await expect(
      program.methods
        .initializePool(...formattedPoolParams)
        .accounts(accounts)
        .rpc()
    ).to.be.rejectedWith("InvalidMaxSharesOut");
  });

  it("Should deploy with a positive maxSharesOut value if the maxSharesOut is a negative number", async () => {
    const sharesAmount = initialProjectTokenBalanceCreator;
    const assetsAmount = initialCollateralTokenBalanceCreator;

    // Create pool with invalid max share price
    const poolParams = createMockpoolConfig({
      shares: sharesAmount,
      assets: assetsAmount,
      maxSharesOut: BN(-3000000000),
    });

    const formattedPoolParams = formatPoolParams(poolParams);

    // Deploy the pool
    await expect(
      program.methods
        .initializePool(...formattedPoolParams)
        .accounts(accounts)
        .rpc()
    ).to.be.fulfilled;

    const pool = await program.account.liquidityBootstrappingPool.fetch(
      poolPda
    );

    expect(Number(pool.maxSharesOut)).to.eq(3000000000);
  });

  it("Should deploy if the maxSharesOut is not 0", async () => {
    const sharesAmount = initialProjectTokenBalanceCreator;
    const assetsAmount = initialCollateralTokenBalanceCreator;

    // Create pool with valid max share price
    const poolParams = createMockpoolConfig({
      shares: sharesAmount,
      assets: assetsAmount,
      maxSharesOut: BN(1000000000),
    });

    const formattedPoolParams = formatPoolParams(poolParams);

    // Deploy the pool
    await expect(
      program.methods
        .initializePool(...formattedPoolParams)
        .accounts(accounts)
        .rpc()
    ).to.be.fulfilled;
  });

  it("Should not deploy if maxAssetsIn is 0", async () => {
    const sharesAmount = initialProjectTokenBalanceCreator;
    const assetsAmount = initialCollateralTokenBalanceCreator;

    // Create pool with invalid max share price
    const poolParams = createMockpoolConfig({
      shares: sharesAmount,
      assets: assetsAmount,
      maxAssetsIn: BN(0),
    });

    const formattedPoolParams = formatPoolParams(poolParams);

    // Deploy the pool
    await expect(
      program.methods
        .initializePool(...formattedPoolParams)
        .accounts(accounts)
        .rpc()
    ).to.be.rejected;
  });

  it("Should deploy with a positive value for maxAssetsIn if maxAssetsIn is a negative number", async () => {
    const sharesAmount = initialProjectTokenBalanceCreator;
    const assetsAmount = initialCollateralTokenBalanceCreator;

    // Create pool with invalid max share price
    const poolParams = createMockpoolConfig({
      shares: sharesAmount,
      assets: assetsAmount,
      maxAssetsIn: BN(-4000000000),
    });

    const formattedPoolParams = formatPoolParams(poolParams);

    // Deploy the pool
    await expect(
      program.methods
        .initializePool(...formattedPoolParams)
        .accounts(accounts)
        .rpc()
    ).to.be.fulfilled;

    const pool = await program.account.liquidityBootstrappingPool.fetch(
      poolPda
    );

    expect(Number(pool.maxAssetsIn)).to.eq(4000000000);
  });

  it("Should deploy if the maxAssetsIn is not 0", async () => {
    const sharesAmount = initialProjectTokenBalanceCreator;
    const assetsAmount = initialCollateralTokenBalanceCreator;

    // Create pool with valid max share price
    const poolParams = createMockpoolConfig({
      shares: sharesAmount,
      assets: assetsAmount,
      maxAssetsIn: BN(1000000000),
    });

    const formattedPoolParams = formatPoolParams(poolParams);

    // Deploy the pool
    await expect(
      program.methods
        .initializePool(...formattedPoolParams)
        .accounts(accounts)
        .rpc()
    ).to.be.fulfilled;
  });

  it("Should deploy with edge case values for the pool", async () => {
    // Create pool with edge case values
    const poolParams = createMockpoolConfig({
      shares: BN(1),
      assets: BN(1),
      maxSharePrice: BN(1),
      maxSharesOut: BN(1),
      maxAssetsIn: BN(1),
      startWeightBasisPoints: 1 * PERCENTAGE_BASIS_POINTS, // 1%
      endWeightBasisPoints: 99 * PERCENTAGE_BASIS_POINTS, // 99%
      saleStartTime: BN(generateTimestamp(240)), // 10 days from now
      saleEndTime: BN(generateTimestamp(240 + 48)), // 10 days and 48 hours from now
      vestCliff: BN(generateTimestamp(240 + 50)), // 10 days and 50 hours from now
      vestEnd: BN(generateTimestamp(240 + 51)), // 10 days and 51 hours from now
      whitelistMerkleRoot: generateMerkleRoot(testMerkleWhitelistedAddresses),
      sellingAllowed: true,
    });

    const formattedPoolParams = formatPoolParams(poolParams);

    // Deploy the pool
    await expect(
      program.methods
        .initializePool(...formattedPoolParams)
        .accounts(accounts)
        .rpc()
    ).to.be.fulfilled;

    const pool = await program.account.liquidityBootstrappingPool.fetch(
      poolPda
    );

    // Assertions to confirm pool creation with edge case parameters
    expect(pool.virtualAssets.toString()).to.eq("0");
    expect(pool.virtualShares.toString()).to.eq("0");
    expect(pool.maxSharePrice.toString()).to.eq("1");
    expect(pool.maxSharesOut.toString()).to.eq("1");
    expect(pool.maxAssetsIn.toString()).to.eq("1");
    expect(pool.startWeightBasisPoints).to.eq(100);
    expect(pool.endWeightBasisPoints).to.eq(9900);
  });

  it("Fails to create a pool without sufficient shares token balance", async () => {
    const assetsAmount = initialCollateralTokenBalanceCreator;

    // Assuming this config tries to create a pool with more assets and shares than the creator has
    const poolParams = createMockpoolConfig({
      assets: assetsAmount,
      shares: BN(1000000000000001),
    }); // Large amounts assuming insufficient balance

    const formattedPoolParams = formatPoolParams(poolParams);

    await expect(
      program.methods
        .initializePool(...formattedPoolParams)
        .accounts(accounts)
        .rpc()
    ).to.be.rejectedWith("InsufficientShares");
  });

  it("Fails to create a pool without sufficient asset token balance", async () => {
    const sharesAmount = initialProjectTokenBalanceCreator;
    // Assuming this config tries to create a pool with more assets and shares than the creator has
    const poolParams = createMockpoolConfig({
      assets: BN(1000000000000001),
      shares: sharesAmount,
    }); // Large amounts assuming insufficient balance

    const formattedPoolParams = formatPoolParams(poolParams);

    await expect(
      program.methods
        .initializePool(...formattedPoolParams)
        .accounts(accounts)
        .rpc()
    ).to.be.rejectedWith("InsufficientAssets");
  });
});
