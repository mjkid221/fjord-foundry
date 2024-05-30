import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { findProgramAddressSync } from "@project-serum/anchor/dist/cjs/utils/pubkey";
import {
  MAX_FEE_BASIS_POINTS,
  getAssociatedTokenAddress,
} from "@solana/spl-token";
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

import {
  BN,
  BigNumber,
  PERCENTAGE_BASIS_POINTS,
  testMerkleWhitelistedAddresses,
} from "../../constants";
import {
  createMockOwnerConfig,
  createMockpoolConfig,
  generateMerkleProof,
  generateMerkleRoot,
  getAccountBalance,
  setup,
  skipBlockTimestamp,
} from "../../helpers";
import { FjordLbp, IDL } from "../../target/types/fjord_lbp";
import { ComputedReservesAndWeights } from "../../types";

const MOCK_PK = new anchor.web3.PublicKey(
  "BPFLoaderUpgradeab1e11111111111111111111111"
);

const GENERIC_BN = BN("1000000000000000000");

chai.use(chaiAsPromised);

describe("Fjord LBP - Buy `swapAssetsForExactShares`", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());
  const lbpProgramId = (anchor.workspace.FjordLbp as Program<FjordLbp>)
    .programId;

  let creator: Keypair = anchor.workspace.FjordLbp.provider.wallet.payer;
  let testUserA: Keypair;
  let testUserB: Keypair;

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

  let whitelistedAddresses: string[];

  beforeEach(async () => {
    testUserA = Keypair.generate();
    testUserB = Keypair.generate();

    // Setup owner configurations. This includes global pool fees, etc...
    const ownerConfig = createMockOwnerConfig();

    const [programDataAddress] = findProgramAddressSync(
      [program.programId.toBytes()],
      MOCK_PK
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
    transferTx.add(
      SystemProgram.transfer({
        fromPubkey: creator.publicKey,
        toPubkey: testUserB.publicKey,
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
      supplyTokenA: 1_000_000_000_000,
      supplyTokenB: 1_000_000_000,
      decimalsTokenA: 6,
      decimalsTokenB: 9,
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

    const sharesAmount = BN(50_000_000_000).mul(BN(10 ** 6));
    const assetsAmount = BN(1_000_000).mul(BN(10 ** 9));

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

    // Setting up some basic whitelisted addresses
    whitelistedAddresses = [
      testUserA.publicKey.toBase58(),
      ...testMerkleWhitelistedAddresses,
    ];
    const poolParams = createMockpoolConfig({
      assets: assetsAmount,
      shares: sharesAmount,
      startWeightBasisPoints: 1 * PERCENTAGE_BASIS_POINTS,
      endWeightBasisPoints: 40 * PERCENTAGE_BASIS_POINTS,
      whitelistMerkleRoot: generateMerkleRoot(whitelistedAddresses),
      maxSharePrice: GENERIC_BN,
      maxAssetsIn: GENERIC_BN,
      maxSharesOut: GENERIC_BN,
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
  });

  describe("Buy Success Cases", () => {
    it("should swap assets for exact shares without a referrer", async () => {
      // Skip time by 1100 seconds
      await skipBlockTimestamp(bankRunCtx, 1100);

      // Get user's pool account
      const userPoolPda = findProgramAddressSync(
        [testUserA.publicKey.toBuffer(), poolPda.toBuffer()],
        program.programId
      )[0];
      const referrer: PublicKey | null = null;
      const merkleProof = generateMerkleProof(
        whitelistedAddresses,
        testUserA.publicKey.toBase58()
      );

      const pool = await program.account.liquidityBootstrappingPool.fetch(
        poolPda
      );

      const sharesAmountOut = BN(1).mul(BN(10 ** 5));

      // Get expected shares out by reading a view function's emitted event.
      const expectedAssetsIn = await program.methods
        .previewAssetsIn(
          // Shares Out
          sharesAmountOut
        )
        .accounts({
          assetTokenMint,
          shareTokenMint,
          pool: poolPda,
          poolAssetTokenAccount,
          poolShareTokenAccount,
        })
        .signers([creator])
        .simulate()
        .then((data) => data.events[0].data.assetsIn as BigNumber);

      // Buy project token
      await program.methods
        .swapAssetsForExactShares(
          // shares out
          sharesAmountOut,
          // Minimum assets in
          expectedAssetsIn,
          // Merkle proof can be 'null' if there are no proofs
          merkleProof,
          // Referrer can be null if there are no referrers
          referrer
        )
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
          referrerStateInPool: referrer,
          userStateInPool: userPoolPda,
        })
        .signers([testUserA])
        .rpc();

      expect(pool.totalReferred.toString()).to.eq(BN(0).toString());
    });
    it("should swap assets for exact shares with a referrer", async () => {
      // Skip time by 1100 seconds
      await skipBlockTimestamp(bankRunCtx, 1100);
      // Get user's pool account
      const userPoolPda = findProgramAddressSync(
        [testUserA.publicKey.toBuffer(), poolPda.toBuffer()],
        program.programId
      )[0];
      // We compute the referrer's account in the pool if a referrer exists
      const referrer: PublicKey | null = Keypair.generate().publicKey;
      const referrerPda = referrer
        ? findProgramAddressSync(
            [(referrer as PublicKey).toBuffer(), poolPda.toBuffer()],
            program.programId
          )[0]
        : null;

      const merkleProof = generateMerkleProof(
        whitelistedAddresses,
        testUserA.publicKey.toBase58()
      );
      const pool = await program.account.liquidityBootstrappingPool.fetch(
        poolPda
      );

      const { maxSharesOut } = pool;

      const sharesAmountOut = maxSharesOut.div(BN("1000000000000000"));

      // Get expected shares out by reading a view function's emitted event.
      const expectedAssetsIn = await program.methods
        .previewAssetsIn(
          // Shares Out
          sharesAmountOut
        )
        .accounts({
          assetTokenMint,
          shareTokenMint,
          pool: poolPda,
          poolAssetTokenAccount,
          poolShareTokenAccount,
        })
        .signers([creator])
        .simulate()
        .then((data) => data.events[0].data.assetsIn as BigNumber);

      // Buy project token
      await program.methods
        .swapAssetsForExactShares(
          // shares out
          sharesAmountOut,
          // Minimum assets in
          expectedAssetsIn,
          // Merkle proof can be 'null' if there are no proofs
          merkleProof,
          // Referrer can be null if there are no referrers
          referrer
        )
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
          referrerStateInPool: referrerPda,
          userStateInPool: userPoolPda,
        })
        .signers([testUserA])
        .rpc();

      const globalPoolConfig = await program.account.ownerConfig.fetch(
        ownerConfigPda
      );
      const referrerPoolAccount = await program.account.userStateInPool.fetch(
        referrerPda!
      );

      expect(referrerPoolAccount.referredAssets.toString()).to.eq(
        expectedAssetsIn
          .mul(BN(globalPoolConfig.referralFee))
          .div(BN(MAX_FEE_BASIS_POINTS))
          .toString()
      );
    });
    it("should be able to swap tokens using swapAssetsForExactShares during sale time", async () => {
      // Skip time by 1100 seconds
      await skipBlockTimestamp(bankRunCtx, 1100);
      // Fetch balances before running the test
      const poolCollateralTokenBalanceBefore = await getAccountBalance(
        bankRunClient,
        poolPda,
        assetTokenMint
      );
      const initialUserCollateralTokenBalance = await getAccountBalance(
        bankRunClient,
        testUserA.publicKey,
        assetTokenMint
      );
      // Get user's pool account
      const userPoolPda = findProgramAddressSync(
        [testUserA.publicKey.toBuffer(), poolPda.toBuffer()],
        program.programId
      )[0];
      // We compute the referrer's account in the pool if a referrer exists
      const referrer: PublicKey | null = Keypair.generate().publicKey;
      const referrerPda = referrer
        ? findProgramAddressSync(
            [(referrer as PublicKey).toBuffer(), poolPda.toBuffer()],
            program.programId
          )[0]
        : null;

      const merkleProof = generateMerkleProof(
        whitelistedAddresses,
        testUserA.publicKey.toBase58()
      );

      const pool = await program.account.liquidityBootstrappingPool.fetch(
        poolPda
      );

      const { maxSharesOut } = pool;

      const sharesAmountOut = maxSharesOut.div(BN(10000000000));
      // Get expected shares out by reading a view function's emitted event.
      const expectedAssetsIn = await program.methods
        .previewAssetsIn(
          // Shares Out
          sharesAmountOut
        )
        .accounts({
          assetTokenMint,
          shareTokenMint,
          pool: poolPda,
          poolAssetTokenAccount,
          poolShareTokenAccount,
        })
        .signers([creator])
        .simulate()
        .then((data) => data.events[0].data.assetsIn as BigNumber);

      // Buy project token
      await program.methods
        .swapAssetsForExactShares(
          // shares out
          sharesAmountOut,
          // Minimum assets in
          expectedAssetsIn,
          // Merkle proof can be 'null' if there are no proofs
          merkleProof,
          // Referrer can be null if there are no referrers
          referrer
        )
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
          referrerStateInPool: referrerPda,
          userStateInPool: userPoolPda,
        })
        .signers([testUserA])
        .rpc();

      const globalPoolConfig = await program.account.ownerConfig.fetch(
        ownerConfigPda
      );
      const userPoolAccount = await program.account.userStateInPool.fetch(
        userPoolPda
      );
      const referrerPoolAccount = await program.account.userStateInPool.fetch(
        referrerPda!
      );
      const poolCollateralTokenBalanceAfter = await getAccountBalance(
        bankRunClient,
        poolPda,
        assetTokenMint
      );

      const userCollateralTokenBalanceAfter = await getAccountBalance(
        bankRunClient,
        testUserA.publicKey,
        assetTokenMint
      );

      const poolAfterTransaction =
        await program.account.liquidityBootstrappingPool.fetch(poolPda);

      // Check if the pool has the correct amount of shares
      expect(poolAfterTransaction.totalPurchased.toString()).to.eq(
        sharesAmountOut.toString()
      );

      // Check that the fees collected are correct
      const feesCollected = poolAfterTransaction.totalSwapFeesAsset.sub(
        pool.totalSwapFeesAsset
      );
      const assetInWithoutFees = expectedAssetsIn.sub(feesCollected);
      expect(feesCollected.toString()).to.eq(
        assetInWithoutFees
          .mul(BN(globalPoolConfig.swapFee))
          .div(BN(MAX_FEE_BASIS_POINTS))
          .toString()
      );

      // Check if the referrer has the correct amount of referred assets
      expect(referrerPoolAccount.referredAssets.toString()).to.eq(
        expectedAssetsIn
          .mul(BN(globalPoolConfig.referralFee))
          .div(BN(MAX_FEE_BASIS_POINTS))
          .toString()
      );

      // Check if the pool has the correct amount of collateral
      expect(poolCollateralTokenBalanceAfter.toString()).to.eq(
        poolCollateralTokenBalanceBefore.add(expectedAssetsIn).toString()
      );

      // Check if the user has the correct amount of collateral
      expect(userCollateralTokenBalanceAfter.toString()).to.eq(
        initialUserCollateralTokenBalance.sub(expectedAssetsIn).toString()
      );

      // Check if the user has the correct amount of shares
      expect(userPoolAccount.purchasedShares.toString()).to.eq(
        sharesAmountOut.toString()
      );
    });
    it("should be able to swap tokens using swapAssetsForExactShares during sale time if there is no merkel proof", async () => {
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
        testUser: testUserB,
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
      const sharesAmount = initialProjectTokenBalanceCreator;
      const assetsAmount = initialCollateralTokenBalanceCreator;

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

      const poolParams = createMockpoolConfig({
        assets: assetsAmount,
        shares: sharesAmount,
        startWeightBasisPoints: 15 * PERCENTAGE_BASIS_POINTS,
        maxSharePrice: GENERIC_BN,
        maxAssetsIn: GENERIC_BN,
        maxSharesOut: GENERIC_BN,
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
      // Fetch balances before running the test
      const poolCollateralTokenBalanceBefore = await getAccountBalance(
        bankRunClient,
        poolPda,
        assetTokenMint
      );
      const initialUserCollateralTokenBalance = await getAccountBalance(
        bankRunClient,
        testUserB.publicKey,
        assetTokenMint
      );
      // Get user's pool account
      const userPoolPda = findProgramAddressSync(
        [testUserB.publicKey.toBuffer(), poolPda.toBuffer()],
        program.programId
      )[0];

      // We compute the referrer's account in the pool if a referrer exists
      const referrer: PublicKey | null = Keypair.generate().publicKey;
      const referrerPda = referrer
        ? findProgramAddressSync(
            [(referrer as PublicKey).toBuffer(), poolPda.toBuffer()],
            program.programId
          )[0]
        : null;

      const poolBeforeTransaction =
        await program.account.liquidityBootstrappingPool.fetch(poolPda);

      const { maxSharesOut } = poolBeforeTransaction;

      const sharesAmountOut = maxSharesOut.div(BN(10000000000));
      // Get expected shares out by reading a view function's emitted event.
      const expectedAssetsIn = await program.methods
        .previewAssetsIn(
          // Shares Out
          sharesAmountOut
        )
        .accounts({
          assetTokenMint,
          shareTokenMint,
          pool: poolPda,
          poolAssetTokenAccount,
          poolShareTokenAccount,
        })
        .signers([creator])
        .simulate()
        .then((data) => data.events[0].data.assetsIn as BigNumber);

      // Buy project token
      await program.methods
        .swapAssetsForExactShares(
          // shares out
          sharesAmountOut,
          // Minimum assets in
          expectedAssetsIn,
          // Merkle proof can be 'null' if there are no proofs
          null,
          // Referrer can be null if there are no referrers
          referrer
        )
        .accounts({
          assetTokenMint,
          shareTokenMint,
          user: testUserB.publicKey,
          pool: poolPda,
          poolAssetTokenAccount,
          poolShareTokenAccount,
          userAssetTokenAccount: assetTokenMintUserAccount,
          userShareTokenAccount: shareTokenMintUserAccount,
          config: ownerConfigPda,
          referrerStateInPool: referrerPda,
          userStateInPool: userPoolPda,
        })
        .signers([testUserB])
        .rpc();

      const poolAfterTransaction =
        await program.account.liquidityBootstrappingPool.fetch(poolPda);
      const globalPoolConfig = await program.account.ownerConfig.fetch(
        ownerConfigPda
      );
      const userPoolAccount = await program.account.userStateInPool.fetch(
        userPoolPda
      );
      const referrerPoolAccount = await program.account.userStateInPool.fetch(
        referrerPda!
      );
      const poolCollateralTokenBalanceAfter = await getAccountBalance(
        bankRunClient,
        poolPda,
        assetTokenMint
      );

      const userCollateralTokenBalanceAfter = await getAccountBalance(
        bankRunClient,
        testUserB.publicKey,
        assetTokenMint
      );

      // Check if the pool has the correct amount of shares
      expect(poolAfterTransaction.totalPurchased.toString()).to.eq(
        sharesAmountOut.toString()
      );

      // Check if the pool has the correct amount of swap fees
      const feesCollected = poolAfterTransaction.totalSwapFeesAsset.sub(
        poolBeforeTransaction.totalSwapFeesAsset
      );
      const assetInWithoutFees = expectedAssetsIn.sub(feesCollected);
      expect(feesCollected.toString()).to.eq(
        assetInWithoutFees
          .mul(BN(globalPoolConfig.swapFee))
          .div(BN(MAX_FEE_BASIS_POINTS))
          .toString()
      );

      // Check if the referrer has the correct amount of referred assets
      expect(referrerPoolAccount.referredAssets.toString()).to.eq(
        expectedAssetsIn
          .mul(BN(globalPoolConfig.referralFee))
          .div(BN(MAX_FEE_BASIS_POINTS))
          .toString()
      );

      // Check if the pool has the correct amount of collateral
      expect(poolCollateralTokenBalanceAfter.toString()).to.eq(
        poolCollateralTokenBalanceBefore.add(expectedAssetsIn).toString()
      );

      // Check if the user has the correct amount of collateral
      expect(userCollateralTokenBalanceAfter.toString()).to.eq(
        initialUserCollateralTokenBalance.sub(expectedAssetsIn).toString()
      );

      // Check if the user has the correct amount of shares
      expect(userPoolAccount.purchasedShares.toString()).to.eq(
        sharesAmountOut.toString()
      );
    });
    it("should update reserves and weights", async () => {
      // Skip time by 1100 seconds
      await skipBlockTimestamp(bankRunCtx, 1100);

      // Get user's pool account
      const userPoolPda = findProgramAddressSync(
        [testUserA.publicKey.toBuffer(), poolPda.toBuffer()],
        program.programId
      )[0];
      // We compute the referrer's account in the pool if a referrer exists
      const referrer: PublicKey | null = Keypair.generate().publicKey;
      const referrerPda = referrer
        ? findProgramAddressSync(
            [(referrer as PublicKey).toBuffer(), poolPda.toBuffer()],
            program.programId
          )[0]
        : null;

      const merkleProof = generateMerkleProof(
        whitelistedAddresses,
        testUserA.publicKey.toBase58()
      );

      const pool = await program.account.liquidityBootstrappingPool.fetch(
        poolPda
      );

      const { maxSharesOut } = pool;

      const sharesAmountOut = maxSharesOut.div(BN(10000000000));

      const statePre = await program.methods
        .reservesAndWeights()
        .accounts({
          assetTokenMint,
          shareTokenMint,
          pool: poolPda,
          poolAssetTokenAccount,
          poolShareTokenAccount,
        })
        .signers([creator])
        .simulate()
        .then((data) => data.events[0].data as ComputedReservesAndWeights);

      // Get expected shares out by reading a view function's emitted event.
      const expectedAssetsIn = await program.methods
        .previewAssetsIn(
          // Shares Out
          sharesAmountOut
        )
        .accounts({
          assetTokenMint,
          shareTokenMint,
          pool: poolPda,
          poolAssetTokenAccount,
          poolShareTokenAccount,
        })
        .signers([creator])
        .simulate()
        .then((data) => data.events[0].data.assetsIn as BigNumber);

      // Buy project token
      await program.methods
        .swapAssetsForExactShares(
          // shares out
          sharesAmountOut,
          // Minimum assets in
          expectedAssetsIn,
          // Merkle proof can be 'null' if there are no proofs
          merkleProof,
          // Referrer can be null if there are no referrers
          referrer
        )
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
          referrerStateInPool: referrerPda,
          userStateInPool: userPoolPda,
        })

        .signers([testUserA])
        .rpc();

      await skipBlockTimestamp(bankRunCtx, 1000); // takes time for the interpolated weights to update

      const statePost = await program.methods
        .reservesAndWeights()
        .accounts({
          assetTokenMint,
          shareTokenMint,
          pool: poolPda,
          poolAssetTokenAccount,
          poolShareTokenAccount,
        })
        .signers([creator])
        .simulate()
        .then((data) => data.events[0].data as ComputedReservesAndWeights);

      // Asset reserve should increase, share reserve should decrease
      expect(statePre.assetReserve.lt(statePost.assetReserve)).to.eq(true);
      expect(statePre.shareReserve.gt(statePost.shareReserve)).to.eq(true);
      // Asset weight should increase, share weight should decrease
      expect(statePre.assetWeight.lt(statePost.assetWeight)).to.eq(true);
      expect(statePre.shareWeight.gt(statePost.shareWeight)).to.eq(true);
      // Should maintain total weight of 100%
      expect(
        statePost.assetWeight.add(statePost.shareWeight).eq(BN(10000))
      ).to.eq(true);
    });
  });
  describe("Buy Failure Cases", () => {
    it("should not be able to swap tokens if the user is not whitelisted", async () => {
      // Skip time by 1100 seconds
      await skipBlockTimestamp(bankRunCtx, 1100);

      // Get user's pool account
      const userPoolPda = findProgramAddressSync(
        [testUserA.publicKey.toBuffer(), poolPda.toBuffer()],
        program.programId
      )[0];

      const referrer: PublicKey | null = null;
      const merkleProof = generateMerkleProof(
        testMerkleWhitelistedAddresses,
        testUserA.publicKey.toBase58()
      );

      const poolBeforeTransaction =
        await program.account.liquidityBootstrappingPool.fetch(poolPda);

      const { maxSharesOut } = poolBeforeTransaction;

      const sharesAmountOut = maxSharesOut.div(BN("1000000000000000"));

      // Get expected assets in by reading a view function's emitted event.
      const expectedAssetsIn = await program.methods
        .previewAssetsIn(
          // Shares Out
          sharesAmountOut
        )
        .accounts({
          assetTokenMint,
          shareTokenMint,
          pool: poolPda,
          poolAssetTokenAccount,
          poolShareTokenAccount,
        })
        .signers([creator])
        .simulate()
        .then((data) => data.events[0].data.assetsIn as BigNumber);

      // Buy project token with a non-whitelisted user
      await expect(
        program.methods
          .swapAssetsForExactShares(
            // shares out
            sharesAmountOut,
            // Minimum assets in
            expectedAssetsIn,
            // Merkle proof can be 'null' if there are no proofs
            merkleProof,
            // Referrer can be null if there are no referrers
            referrer
          )
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
            referrerStateInPool: referrer,
            userStateInPool: userPoolPda,
          })
          .signers([testUserA])
          .rpc()
      ).to.be.rejectedWith("WhitelistProof");
    });
    it("should not be able to swap tokens using swapAssetsForExactShares before sale time", async () => {
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
        testUser: testUserB,
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
      const sharesAmount = initialProjectTokenBalanceCreator;
      const assetsAmount = initialCollateralTokenBalanceCreator;

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

      const poolParams = createMockpoolConfig({
        assets: assetsAmount,
        shares: sharesAmount,
        startWeightBasisPoints: 15 * PERCENTAGE_BASIS_POINTS,
        saleStartTime: BN(new Date().getTime() / 1000 + 50000000),
        saleEndTime: BN(new Date().getTime() / 1000 + 100000000),
        maxSharePrice: GENERIC_BN,
        maxAssetsIn: GENERIC_BN,
        maxSharesOut: GENERIC_BN,
        vestCliff: BN(0),
        vestEnd: BN(0),
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

      // Get user's pool account
      const userPoolPda = findProgramAddressSync(
        [testUserB.publicKey.toBuffer(), poolPda.toBuffer()],
        program.programId
      )[0];
      // We compute the referrer's account in the pool if a referrer exists
      const referrer: PublicKey | null = Keypair.generate().publicKey;
      const referrerPda = referrer
        ? findProgramAddressSync(
            [(referrer as PublicKey).toBuffer(), poolPda.toBuffer()],
            program.programId
          )[0]
        : null;
      const merkleProof = generateMerkleProof(
        whitelistedAddresses,
        testUserB.publicKey.toBase58()
      );

      const poolBeforeTransaction =
        await program.account.liquidityBootstrappingPool.fetch(poolPda);

      const { maxSharesOut } = poolBeforeTransaction;

      const sharesAmountOut = maxSharesOut.div(BN(1000000000000));
      // Get expected shares out by reading a view function's emitted event.
      const expectedAssetsIn = await program.methods
        .previewAssetsIn(
          // Shares Out
          sharesAmountOut
        )
        .accounts({
          assetTokenMint,
          shareTokenMint,
          pool: poolPda,
          poolAssetTokenAccount,
          poolShareTokenAccount,
        })
        .signers([creator])
        .simulate()
        .then((data) => data.events[0].data.assetsIn as BigNumber);
      // Buy project token
      await expect(
        program.methods
          .swapAssetsForExactShares(
            // shares out
            sharesAmountOut,
            // Minimum assets in
            expectedAssetsIn,
            // Merkle proof can be 'null' if there are no proofs
            merkleProof,
            // Referrer can be null if there are no referrers
            referrer
          )
          .accounts({
            assetTokenMint,
            shareTokenMint,
            user: testUserB.publicKey,
            pool: poolPda,
            poolAssetTokenAccount,
            poolShareTokenAccount,
            userAssetTokenAccount: assetTokenMintUserAccount,
            userShareTokenAccount: shareTokenMintUserAccount,
            config: ownerConfigPda,
            referrerStateInPool: referrerPda,
            userStateInPool: userPoolPda,
          })
          .signers([testUserB])
          .rpc()
      ).to.be.rejectedWith("TradingDisallowed");
    });

    it("should not be able to swap tokens if current assets plus assets in minus swap fees is equal or greater that the pool maxAssetsIn", async () => {
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
      const sharesAmount = initialProjectTokenBalanceCreator;
      const assetsAmount = initialCollateralTokenBalanceCreator;

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

      // Setting up some basic whitelisted addresses
      whitelistedAddresses = [
        testUserA.publicKey.toBase58(),
        ...testMerkleWhitelistedAddresses,
      ];
      const poolParams = createMockpoolConfig({
        assets: assetsAmount,
        shares: sharesAmount,
        startWeightBasisPoints: 15 * PERCENTAGE_BASIS_POINTS,
        whitelistMerkleRoot: generateMerkleRoot(whitelistedAddresses),
        maxSharePrice: GENERIC_BN,
        maxAssetsIn: GENERIC_BN.div(BN(1000000000)), // Intentionally set to a very low value
        maxSharesOut: GENERIC_BN,
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
      // Get the pool
      const poolBeforeTransaction =
        await program.account.liquidityBootstrappingPool.fetch(poolPda);

      // Get user's pool account
      const userPoolPda = findProgramAddressSync(
        [testUserA.publicKey.toBuffer(), poolPda.toBuffer()],
        program.programId
      )[0];

      const referrer: PublicKey | null = null;
      const merkleProof = generateMerkleProof(
        whitelistedAddresses,
        testUserA.publicKey.toBase58()
      );

      const { maxSharesOut } = poolBeforeTransaction;

      const sharesAmountOut = maxSharesOut.div(BN("10000000000000")); // Intentionally set to a very high value

      // Get expected shares out by reading a view function's emitted event.
      const expectedAssetsIn = await program.methods
        .previewAssetsIn(
          // Shares Out
          sharesAmountOut
        )
        .accounts({
          assetTokenMint,
          shareTokenMint,
          pool: poolPda,
          poolAssetTokenAccount,
          poolShareTokenAccount,
        })
        .signers([creator])
        .simulate()
        .then((data) => data.events[0].data.assetsIn as BigNumber);

      // Buy project token
      await expect(
        program.methods
          .swapAssetsForExactShares(
            // shares out
            sharesAmountOut,
            // Minimum assets in
            expectedAssetsIn,
            // Merkle proof can be 'null' if there are no proofs
            merkleProof,
            // Referrer can be null if there are no referrers
            referrer
          )
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
            referrerStateInPool: referrer,
            userStateInPool: userPoolPda,
          })
          .signers([testUserA])
          .rpc()
      ).to.be.rejectedWith("AssetsInExceeded");
    });

    it("should not be able to swap tokens if the user does not have enough assets to swap", async () => {
      // Skip time by 1100 seconds
      await skipBlockTimestamp(bankRunCtx, 1100);

      // Get user's pool account
      const userPoolPda = findProgramAddressSync(
        [testUserA.publicKey.toBuffer(), poolPda.toBuffer()],
        program.programId
      )[0];

      const referrer: PublicKey | null = null;
      const merkleProof = generateMerkleProof(
        whitelistedAddresses,
        testUserA.publicKey.toBase58()
      );

      const poolBeforeTransaction =
        await program.account.liquidityBootstrappingPool.fetch(poolPda);

      const { maxSharesOut } = poolBeforeTransaction;

      const sharesAmountOut = maxSharesOut.div(BN("1000000")); // Intentionally set to a very high value

      // Get expected assets in out by reading a view function's emitted event.
      const expectedAssetsIn = await program.methods
        .previewAssetsIn(
          // Shares Out
          sharesAmountOut
        )
        .accounts({
          assetTokenMint,
          shareTokenMint,
          pool: poolPda,
          poolAssetTokenAccount,
          poolShareTokenAccount,
        })
        .signers([creator])
        .simulate()
        .then((data) => data.events[0].data.assetsIn as BigNumber);

      // Buy project token
      await expect(
        program.methods
          .swapAssetsForExactShares(
            // shares out
            sharesAmountOut,
            // Minimum assets in
            expectedAssetsIn,
            // Merkle proof can be 'null' if there are no proofs
            merkleProof,
            // Referrer can be null if there are no referrers
            referrer
          )
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
            referrerStateInPool: referrer,
            userStateInPool: userPoolPda,
          })
          .signers([testUserA])
          .rpc()
      ).to.be.rejected;
    });
    it("should not be able to swap tokens if the signer is not the user", async () => {
      // Skip time by 1100 seconds
      await skipBlockTimestamp(bankRunCtx, 1100);

      // Get user's pool account
      const userPoolPda = findProgramAddressSync(
        [testUserA.publicKey.toBuffer(), poolPda.toBuffer()],
        program.programId
      )[0];

      const referrer: PublicKey | null = null;
      const merkleProof = generateMerkleProof(
        whitelistedAddresses,
        testUserA.publicKey.toBase58()
      );

      const poolBeforeTransaction =
        await program.account.liquidityBootstrappingPool.fetch(poolPda);

      const { maxSharesOut } = poolBeforeTransaction;

      const sharesAmountOut = maxSharesOut.div(BN("1000000000000000"));

      // Get expected assets in by reading a view function's emitted event.
      const expectedAssetsIn = await program.methods
        .previewAssetsIn(
          // Shares Out
          sharesAmountOut
        )
        .accounts({
          assetTokenMint,
          shareTokenMint,
          pool: poolPda,
          poolAssetTokenAccount,
          poolShareTokenAccount,
        })
        .signers([creator])
        .simulate()
        .then((data) => data.events[0].data.assetsIn as BigNumber);

      // Buy project token with the wrong signer
      await expect(
        program.methods
          .swapAssetsForExactShares(
            // shares out
            sharesAmountOut,
            // Minimum assets in
            expectedAssetsIn,
            // Merkle proof can be 'null' if there are no proofs
            merkleProof,
            // Referrer can be null if there are no referrers
            referrer
          )
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
            referrerStateInPool: referrer,
            userStateInPool: userPoolPda,
          })
          .signers([testUserB])
          .rpc()
      ).to.be.rejectedWith("unknown signer");

      // Buy project token using the creator as the signer
      await expect(
        program.methods
          .swapAssetsForExactShares(
            // shares out
            sharesAmountOut,
            // Minimum assets in
            expectedAssetsIn,
            // Merkle proof can be 'null' if there are no proofs
            merkleProof,
            // Referrer can be null if there are no referrers
            referrer
          )
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
            referrerStateInPool: referrer,
            userStateInPool: userPoolPda,
          })
          .signers([creator])
          .rpc()
      ).to.be.rejectedWith("Signature verification failed");
    });
    it("should not be able to swap tokens if the from asset token account is not the user's asset token account", async () => {
      // Skip time by 1100 seconds
      await skipBlockTimestamp(bankRunCtx, 1100);

      // Get user's pool account
      const userPoolPda = findProgramAddressSync(
        [testUserA.publicKey.toBuffer(), poolPda.toBuffer()],
        program.programId
      )[0];

      const referrer: PublicKey | null = null;
      const merkleProof = generateMerkleProof(
        whitelistedAddresses,
        testUserA.publicKey.toBase58()
      );
      const poolBeforeTransaction =
        await program.account.liquidityBootstrappingPool.fetch(poolPda);

      const { maxSharesOut } = poolBeforeTransaction;

      const sharesAmountOut = maxSharesOut.div(BN("1000000000000000"));

      // Get expected assets in by reading a view function's emitted event.
      const expectedAssetsIn = await program.methods
        .previewAssetsIn(
          // Shares Out
          sharesAmountOut
        )
        .accounts({
          assetTokenMint,
          shareTokenMint,
          pool: poolPda,
          poolAssetTokenAccount,
          poolShareTokenAccount,
        })
        .signers([creator])
        .simulate()
        .then((data) => data.events[0].data.assetsIn as BigNumber);

      // Buy project token with the wrong signer and the wrong user
      await expect(
        program.methods
          .swapAssetsForExactShares(
            // shares out
            sharesAmountOut,
            // Minimum assets in
            expectedAssetsIn,
            // Merkle proof can be 'null' if there are no proofs
            merkleProof,
            // Referrer can be null if there are no referrers
            referrer
          )
          .accounts({
            assetTokenMint,
            shareTokenMint,
            user: testUserB.publicKey,
            pool: poolPda,
            poolAssetTokenAccount,
            poolShareTokenAccount,
            userAssetTokenAccount: assetTokenMintUserAccount,
            userShareTokenAccount: shareTokenMintUserAccount,
            config: ownerConfigPda,
            referrerStateInPool: referrer,
            userStateInPool: userPoolPda,
          })
          .signers([testUserB])
          .rpc()
      ).to.be.rejectedWith("ConstraintTokenOwner");
    });

    it("should not be able to swap tokens if the pool asset token account is not the pool asset token account", async () => {
      // Skip time by 1100 seconds
      await skipBlockTimestamp(bankRunCtx, 1100);

      // Get user's pool account
      const userPoolPda = findProgramAddressSync(
        [testUserA.publicKey.toBuffer(), poolPda.toBuffer()],
        program.programId
      )[0];

      const referrer: PublicKey | null = null;
      const merkleProof = generateMerkleProof(
        whitelistedAddresses,
        testUserA.publicKey.toBase58()
      );

      const poolBeforeTransaction =
        await program.account.liquidityBootstrappingPool.fetch(poolPda);

      const { maxSharesOut } = poolBeforeTransaction;

      const sharesAmountOut = maxSharesOut.div(BN("1000000000000000"));

      // Get expected assets in by reading a view function's emitted event.
      const expectedAssetsIn = await program.methods
        .previewAssetsIn(
          // Shares Out
          sharesAmountOut
        )
        .accounts({
          assetTokenMint,
          shareTokenMint,
          pool: poolPda,
          poolAssetTokenAccount,
          poolShareTokenAccount,
        })
        .signers([creator])
        .simulate()
        .then((data) => data.events[0].data.assetsIn as BigNumber);

      // Buy project token with the wrong pool asset token account
      await expect(
        program.methods
          .swapAssetsForExactShares(
            // shares out
            sharesAmountOut,
            // Minimum assets in
            expectedAssetsIn,
            // Merkle proof can be 'null' if there are no proofs
            merkleProof,
            // Referrer can be null if there are no referrers
            referrer
          )
          .accounts({
            assetTokenMint,
            shareTokenMint,
            user: testUserA.publicKey,
            pool: poolPda,
            poolAssetTokenAccount: assetTokenMintUserAccount,
            poolShareTokenAccount,
            userAssetTokenAccount: assetTokenMintUserAccount,
            userShareTokenAccount: shareTokenMintUserAccount,
            config: ownerConfigPda,
            referrerStateInPool: referrer,
            userStateInPool: userPoolPda,
          })
          .signers([testUserA])
          .rpc()
      ).to.be.rejectedWith("ConstraintTokenOwner");
    });

    it("should not be able to swap tokens if the pool share token account is not the pool share token account", async () => {
      // Skip time by 1100 seconds
      await skipBlockTimestamp(bankRunCtx, 1100);

      // Get user's pool account
      const userPoolPda = findProgramAddressSync(
        [testUserA.publicKey.toBuffer(), poolPda.toBuffer()],
        program.programId
      )[0];

      const referrer: PublicKey | null = null;
      const merkleProof = generateMerkleProof(
        whitelistedAddresses,
        testUserA.publicKey.toBase58()
      );

      const poolBeforeTransaction =
        await program.account.liquidityBootstrappingPool.fetch(poolPda);

      const { maxSharesOut } = poolBeforeTransaction;

      const sharesAmountOut = maxSharesOut.div(BN("1000000000000000"));

      // Get expected assets in by reading a view function's emitted event.
      const expectedAssetsIn = await program.methods
        .previewAssetsIn(
          // Shares Out
          sharesAmountOut
        )
        .accounts({
          assetTokenMint,
          shareTokenMint,
          pool: poolPda,
          poolAssetTokenAccount,
          poolShareTokenAccount,
        })
        .signers([creator])
        .simulate()
        .then((data) => data.events[0].data.assetsIn as BigNumber);

      // Buy project token with the wrong pool share token account
      await expect(
        program.methods
          .swapAssetsForExactShares(
            // shares out
            sharesAmountOut,
            // Minimum assets in
            expectedAssetsIn,
            // Merkle proof can be 'null' if there are no proofs
            merkleProof,
            // Referrer can be null if there are no referrers
            referrer
          )
          .accounts({
            assetTokenMint,
            shareTokenMint,
            user: testUserA.publicKey,
            pool: poolPda,
            poolAssetTokenAccount,
            poolShareTokenAccount: shareTokenMintUserAccount,
            userAssetTokenAccount: assetTokenMintUserAccount,
            userShareTokenAccount: shareTokenMintUserAccount,
            config: ownerConfigPda,
            referrerStateInPool: referrer,
            userStateInPool: userPoolPda,
          })
          .signers([testUserA])
          .rpc()
      ).to.be.rejectedWith("ConstraintTokenOwner");
    });

    it("should not be able to swap tokens if the user share token account is not the user share token account", async () => {
      // Skip time by 1100 seconds
      await skipBlockTimestamp(bankRunCtx, 1100);

      // Get user's pool account
      const userPoolPda = findProgramAddressSync(
        [testUserA.publicKey.toBuffer(), poolPda.toBuffer()],
        program.programId
      )[0];

      const referrer: PublicKey | null = null;
      const merkleProof = generateMerkleProof(
        whitelistedAddresses,
        testUserA.publicKey.toBase58()
      );
      const poolBeforeTransaction =
        await program.account.liquidityBootstrappingPool.fetch(poolPda);

      const { maxSharesOut } = poolBeforeTransaction;

      const sharesAmountOut = maxSharesOut.div(BN("1000000000000000"));

      // Get expected assets in by reading a view function's emitted event.
      const expectedAssetsIn = await program.methods
        .previewAssetsIn(
          // Shares Out
          sharesAmountOut
        )
        .accounts({
          assetTokenMint,
          shareTokenMint,
          pool: poolPda,
          poolAssetTokenAccount,
          poolShareTokenAccount,
        })
        .signers([creator])
        .simulate()
        .then((data) => data.events[0].data.assetsIn as BigNumber);

      // Buy project token with the wrong user share token account
      await expect(
        program.methods
          .swapAssetsForExactShares(
            // shares out
            sharesAmountOut,
            // Minimum assets in
            expectedAssetsIn,
            // Merkle proof can be 'null' if there are no proofs
            merkleProof,
            // Referrer can be null if there are no referrers
            referrer
          )
          .accounts({
            assetTokenMint,
            shareTokenMint,
            user: testUserA.publicKey,
            pool: poolPda,
            poolAssetTokenAccount,
            poolShareTokenAccount,
            userAssetTokenAccount: assetTokenMintUserAccount,
            userShareTokenAccount: assetTokenMintUserAccount,
            config: ownerConfigPda,
            referrerStateInPool: referrer,
            userStateInPool: userPoolPda,
          })
          .signers([testUserA])
          .rpc()
      ).to.be.rejectedWith("ConstraintTokenMint");
    });

    it("should not be able to swap tokens if the asset token account is not the user asset token account", async () => {
      // Skip time by 1100 seconds
      await skipBlockTimestamp(bankRunCtx, 1100);

      // Get user's pool account
      const userPoolPda = findProgramAddressSync(
        [testUserA.publicKey.toBuffer(), poolPda.toBuffer()],
        program.programId
      )[0];

      const referrer: PublicKey | null = null;
      const merkleProof = generateMerkleProof(
        whitelistedAddresses,
        testUserA.publicKey.toBase58()
      );
      const poolBeforeTransaction =
        await program.account.liquidityBootstrappingPool.fetch(poolPda);

      const { maxSharesOut } = poolBeforeTransaction;

      const sharesAmountOut = maxSharesOut.div(BN("1000000000000000"));

      // Get expected assets in by reading a view function's emitted event.
      const expectedAssetsIn = await program.methods
        .previewAssetsIn(
          // Shares Out
          sharesAmountOut
        )
        .accounts({
          assetTokenMint,
          shareTokenMint,
          pool: poolPda,
          poolAssetTokenAccount,
          poolShareTokenAccount,
        })
        .signers([creator])
        .simulate()
        .then((data) => data.events[0].data.assetsIn as BigNumber);

      // Buy project token with the wrong asset token account
      await expect(
        program.methods
          .swapAssetsForExactShares(
            // shares out
            sharesAmountOut,
            // Minimum assets in
            expectedAssetsIn,
            // Merkle proof can be 'null' if there are no proofs
            merkleProof,
            // Referrer can be null if there are no referrers
            referrer
          )
          .accounts({
            assetTokenMint,
            shareTokenMint,
            user: testUserA.publicKey,
            pool: poolPda,
            poolAssetTokenAccount,
            poolShareTokenAccount,
            userAssetTokenAccount: shareTokenMintUserAccount,
            userShareTokenAccount: shareTokenMintUserAccount,
            config: ownerConfigPda,
            referrerStateInPool: referrer,
            userStateInPool: userPoolPda,
          })
          .signers([testUserA])
          .rpc()
      ).to.be.rejectedWith("ConstraintTokenMint");
    });

    it("should not be able to swap tokens if the user pool account is not the correct user pool account", async () => {
      // Skip time by 1100 seconds
      await skipBlockTimestamp(bankRunCtx, 1100);

      // Get incorrect user's pool account
      const userPoolPda = findProgramAddressSync(
        [testUserB.publicKey.toBuffer(), poolPda.toBuffer()],
        program.programId
      )[0];

      const referrer: PublicKey | null = null;
      const merkleProof = generateMerkleProof(
        whitelistedAddresses,
        testUserA.publicKey.toBase58()
      );
      const poolBeforeTransaction =
        await program.account.liquidityBootstrappingPool.fetch(poolPda);

      const { maxSharesOut } = poolBeforeTransaction;

      const sharesAmountOut = maxSharesOut.div(BN("1000000000000000"));

      // Get expected assets in by reading a view function's emitted event.
      const expectedAssetsIn = await program.methods
        .previewAssetsIn(
          // Shares Out
          sharesAmountOut
        )
        .accounts({
          assetTokenMint,
          shareTokenMint,
          pool: poolPda,
          poolAssetTokenAccount,
          poolShareTokenAccount,
        })
        .signers([creator])
        .simulate()
        .then((data) => data.events[0].data.assetsIn as BigNumber);

      // Buy project token with the wrong user pool account
      await expect(
        program.methods
          .swapAssetsForExactShares(
            // shares out
            sharesAmountOut,
            // Minimum assets in
            expectedAssetsIn,
            // Merkle proof can be 'null' if there are no proofs
            merkleProof,
            // Referrer can be null if there are no referrers
            referrer
          )
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
            referrerStateInPool: referrer,
            userStateInPool: userPoolPda,
          })
          .signers([testUserA])
          .rpc()
      ).to.be.rejectedWith("ConstraintSeeds");
    });

    it("should not be able to swap tokens if the totalPurchaseAfterSwap is greater than the pool maxSharesOut", async () => {
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
      const sharesAmount = initialProjectTokenBalanceCreator;
      const assetsAmount = initialCollateralTokenBalanceCreator;

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

      // Setting up some basic whitelisted addresses
      whitelistedAddresses = [
        testUserA.publicKey.toBase58(),
        ...testMerkleWhitelistedAddresses,
      ];
      const poolParams = createMockpoolConfig({
        assets: assetsAmount,
        shares: sharesAmount,
        startWeightBasisPoints: 15 * PERCENTAGE_BASIS_POINTS,
        whitelistMerkleRoot: generateMerkleRoot(whitelistedAddresses),
        maxSharePrice: GENERIC_BN,
        maxAssetsIn: GENERIC_BN,
        maxSharesOut: sharesAmount.div(BN(1000000000)), // Intentionally set to a very low value
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

      // Get user's pool account
      const userPoolPda = findProgramAddressSync(
        [testUserA.publicKey.toBuffer(), poolPda.toBuffer()],
        program.programId
      )[0];

      const referrer: PublicKey | null = null;
      const merkleProof = generateMerkleProof(
        whitelistedAddresses,
        testUserA.publicKey.toBase58()
      );
      const poolBeforeTransaction =
        await program.account.liquidityBootstrappingPool.fetch(poolPda);

      const { maxSharesOut } = poolBeforeTransaction;

      const sharesAmountOut = maxSharesOut.add(BN(1));

      // Get expected assets in by reading a view function's emitted event.
      const expectedAssetsIn = await program.methods
        .previewAssetsIn(
          // Shares Out
          sharesAmountOut
        )
        .accounts({
          assetTokenMint,
          shareTokenMint,
          pool: poolPda,
          poolAssetTokenAccount,
          poolShareTokenAccount,
        })
        .signers([creator])
        .simulate()
        .then((data) => data.events[0].data.assetsIn as BigNumber);

      // Buy project token with the larger shares out
      await expect(
        program.methods
          .swapAssetsForExactShares(
            // shares out
            sharesAmountOut,
            // Minimum assets in
            expectedAssetsIn,
            // Merkle proof can be 'null' if there are no proofs
            merkleProof,
            // Referrer can be null if there are no referrers
            referrer
          )
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
            referrerStateInPool: referrer,
            userStateInPool: userPoolPda,
          })
          .signers([testUserA])
          .rpc()
      ).to.be.rejectedWith("SharesOutExceeded");
    });

    it("should not be able to swap tokens if the the expected assets in is less than that generated in the preview", async () => {
      // Skip time by 1100 seconds
      await skipBlockTimestamp(bankRunCtx, 1100);

      // Get user's pool account
      const userPoolPda = findProgramAddressSync(
        [testUserA.publicKey.toBuffer(), poolPda.toBuffer()],
        program.programId
      )[0];

      const referrer: PublicKey | null = null;
      const merkleProof = generateMerkleProof(
        whitelistedAddresses,
        testUserA.publicKey.toBase58()
      );

      const poolBeforeTransaction =
        await program.account.liquidityBootstrappingPool.fetch(poolPda);

      const { maxSharesOut } = poolBeforeTransaction;

      const sharesAmountOut = maxSharesOut.div(BN("1000000000000000"));

      // Get expected assets in by reading a view function's emitted event.
      const expectedAssetsIn = await program.methods
        .previewAssetsIn(
          // Shares Out
          sharesAmountOut
        )
        .accounts({
          assetTokenMint,
          shareTokenMint,
          pool: poolPda,
          poolAssetTokenAccount,
          poolShareTokenAccount,
        })
        .signers([creator])
        .simulate()
        .then((data) => data.events[0].data.assetsIn as BigNumber);

      const smallerExpectedAssetsIn = BN(expectedAssetsIn.toNumber() * 0.99);

      // Buy project token with the smaller expected assets in
      await expect(
        program.methods
          .swapAssetsForExactShares(
            // shares out
            sharesAmountOut,
            // Minimum assets in
            smallerExpectedAssetsIn,
            // Merkle proof can be 'null' if there are no proofs
            merkleProof,
            // Referrer can be null if there are no referrers
            referrer
          )
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
            referrerStateInPool: referrer,
            userStateInPool: userPoolPda,
          })
          .signers([testUserA])
          .rpc()
      ).to.be.rejectedWith("SlippageExceeded");
    });

    it("should not be able to swap tokens if the max assets in is 0", async () => {
      await skipBlockTimestamp(bankRunCtx, 1100);

      // Get user's pool account
      const userPoolPda = findProgramAddressSync(
        [testUserA.publicKey.toBuffer(), poolPda.toBuffer()],
        program.programId
      )[0];

      const referrer: PublicKey | null = null;
      const merkleProof = generateMerkleProof(
        whitelistedAddresses,
        testUserA.publicKey.toBase58()
      );

      const poolBeforeTransaction =
        await program.account.liquidityBootstrappingPool.fetch(poolPda);

      const { maxSharesOut } = poolBeforeTransaction;

      const sharesAmountOut = maxSharesOut.div(BN("1000000000000000"));

      // Buy project token with the smaller expected assets in
      await expect(
        program.methods
          .swapAssetsForExactShares(
            // shares out
            sharesAmountOut,
            // Minimum assets in
            BN(0),
            // Merkle proof can be 'null' if there are no proofs
            merkleProof,
            // Referrer can be null if there are no referrers
            referrer
          )
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
            referrerStateInPool: referrer,
            userStateInPool: userPoolPda,
          })
          .signers([testUserA])
          .rpc()
      ).to.be.rejectedWith("ZeroSlippage");
    });
  });
});
