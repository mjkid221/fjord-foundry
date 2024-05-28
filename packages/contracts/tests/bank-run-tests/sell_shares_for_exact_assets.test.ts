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

import { BN, BigNumber, testMerkleWhitelistedAddresses } from "../../constants";
import {
  createMockOwnerConfig,
  createMockpoolConfig,
  generateMerkleProof,
  generateMerkleRoot,
  getAccountBalance,
  getAllAccountState,
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

describe("Fjord LBP - Sell - shares for exact assets", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());
  const lbpProgramId = (anchor.workspace.FjordLbp as Program<FjordLbp>)
    .programId;

  let creator: Keypair;
  let testUserA: Keypair;
  let testUserB: Keypair;

  let shareTokenMint: PublicKey; // project token address
  let assetTokenMint: PublicKey; // collateral token address

  let assetTokenMintUserAccount: PublicKey | undefined;
  let shareTokenMintUserAccount: PublicKey | undefined;

  // Address of the deployed pool
  let poolPda: PublicKey;

  // A fixed account that holds the owner configuration of all the pools (e.g. fees)
  let ownerConfigPda: PublicKey;
  const treasuryPda: PublicKey = PublicKey.findProgramAddressSync(
    [Buffer.from("treasury")],
    lbpProgramId
  )[0];

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
    // Setup
    testUserA = Keypair.generate();
    testUserB = Keypair.generate();

    creator = anchor.workspace.FjordLbp.provider.wallet.payer;
    program = anchor.workspace.FjordLbp as Program<FjordLbp>;
    connection = program.provider.connection;

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

    // Setting up some basic whitelisted addresses
    whitelistedAddresses = [
      testUserA.publicKey.toBase58(),
      ...testMerkleWhitelistedAddresses,
    ];

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
  });

  describe("Success cases - no merkle proof", async () => {
    beforeEach(async () => {
      const sharesAmount = initialProjectTokenBalanceCreator;
      const assetsAmount = initialCollateralTokenBalanceCreator;

      const poolParams = createMockpoolConfig({
        assets: assetsAmount,
        shares: sharesAmount,
        maxSharePrice: GENERIC_BN,
        maxAssetsIn: GENERIC_BN,
        maxSharesOut: GENERIC_BN,
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

      const initialUserCollateralTokenBalance = await getAccountBalance(
        bankRunClient,
        testUserA.publicKey,
        assetTokenMint
      );

      // Get user's pool account
      const initialUserPoolPda = findProgramAddressSync(
        [testUserA.publicKey.toBuffer(), poolPda.toBuffer()],
        program.programId
      )[0];

      const assetAmountIn = initialUserCollateralTokenBalance.div(BN(2));

      // Get expected shares out by reading a view function's emitted event.
      const expectedSharesOut = await program.methods
        .previewSharesOut(
          // Assets In (Collateral)
          assetAmountIn
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
        .then((data) => data.events[0].data.sharesOut as BigNumber);

      // Buy project token
      await program.methods
        .swapExactAssetsForShares(assetAmountIn, expectedSharesOut, null, null)
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
          userStateInPool: initialUserPoolPda,
        })
        .signers([testUserA])
        .rpc();
    });

    it("should be able to sell project token (shares) for exact collateral tokens (assets)", async () => {
      const {
        userAssetBalance: userAssetBalanceBefore,
        poolAssetBalance: poolAssetBalanceBefore,
        userPoolPda,
        userPoolAccount: userPoolAccountBefore,
        pool: poolBefore,
      } = await getAllAccountState({
        program,
        poolPda,
        bankRunClient,
        shareTokenMint,
        assetTokenMint,
        user: testUserA.publicKey,
        ownerConfigPda,
        creator: creator.publicKey,
      });

      const assetsToSell = BN("100000000");

      const maxSharesIn = await program.methods
        .previewSharesIn(
          // Assets to sell (Collateral)
          assetsToSell
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
        .then((data) => data.events[0].data.sharesIn as BigNumber);

      // Sell project token
      await program.methods
        .swapSharesForExactAssets(assetsToSell, maxSharesIn, null, null)
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
        .rpc();

      const {
        userPoolAccount: userPoolAccountAfter,
        userAssetBalance: userAssetBalanceAfter,
        poolAssetBalance: poolAssetBalanceAfter,
        pool: poolAfter,
        ownerConfig: { swapFee },
      } = await getAllAccountState({
        program,
        poolPda,
        bankRunClient,
        shareTokenMint,
        assetTokenMint,
        user: testUserA.publicKey,
        ownerConfigPda,
        creator: creator.publicKey,
      });

      expect(userPoolAccountAfter?.purchasedShares.toString()).to.eq(
        userPoolAccountBefore?.purchasedShares.sub(maxSharesIn).toString()
      );
      expect(userAssetBalanceAfter.toString()).to.eq(
        userAssetBalanceBefore.add(assetsToSell).toString()
      );

      expect(poolAfter.totalSwapFeesShare.toNumber()).to.be.closeTo(
        poolBefore.totalSwapFeesShare
          .add(maxSharesIn.mul(BN(swapFee)).div(BN(MAX_FEE_BASIS_POINTS)))
          .toNumber(),
        120000 // 0.99% error margin
      );
      expect(poolAfter.totalPurchased.toString()).to.eq(
        poolBefore.totalPurchased.sub(maxSharesIn).toString()
      );
      expect(poolAssetBalanceAfter.toString()).to.eq(
        poolAssetBalanceBefore.sub(assetsToSell).toString()
      );
    });

    it("should be able to sell project tokens (shares) for exact collateral tokens (assets) with a referrer but no referrer fee is assigned", async () => {
      const { userPoolPda } = await getAllAccountState({
        program,
        poolPda,
        bankRunClient,
        shareTokenMint,
        assetTokenMint,
        user: testUserA.publicKey,
        ownerConfigPda,
        creator: creator.publicKey,
      });

      // We compute the referrer's account in the pool if a referrer exists
      const referrer: PublicKey | null = Keypair.generate().publicKey;
      const referrerPda = referrer
        ? findProgramAddressSync(
            [(referrer as PublicKey).toBuffer(), poolPda.toBuffer()],
            program.programId
          )[0]
        : null;

      // Number of project tokens to sell (Shares)
      const assetsToSell = BN("100000000");

      const maxSharesIn = await program.methods
        .previewSharesIn(
          // Assets to sell (Collateral)
          assetsToSell
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
        .then((data) => data.events[0].data.sharesIn as BigNumber);

      // Sell project token
      await program.methods
        .swapSharesForExactAssets(assetsToSell, maxSharesIn, null, referrer)
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

      const referrerPoolAccount = await program.account.userStateInPool.fetch(
        referrerPda!
      );

      expect(referrerPoolAccount.referredAssets.toString()).to.eq(
        BN(0).toString()
      );
    });

    it("should update reserves and weights", async () => {
      const { userPoolPda } = await getAllAccountState({
        program,
        poolPda,
        bankRunClient,
        shareTokenMint,
        assetTokenMint,
        user: testUserA.publicKey,
        ownerConfigPda,
        creator: creator.publicKey,
      });

      const assetsToSell = BN("100000000");

      await skipBlockTimestamp(bankRunCtx, 1000);

      const maxSharesIn = await program.methods
        .previewSharesIn(
          // Assets to sell (Collateral)
          assetsToSell
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
        .then((data) => data.events[0].data.sharesIn as BigNumber);

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

      // Sell project token
      await program.methods
        .swapSharesForExactAssets(assetsToSell, maxSharesIn, null, null)
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

      // Asset reserve should decrease, share reserve should increase
      expect(statePre.assetReserve.gt(statePost.assetReserve)).to.eq(true);
      expect(statePre.shareReserve.lt(statePost.shareReserve)).to.eq(true);
      // Should maintain total weight of 100%
      expect(
        statePost.assetWeight.add(statePost.shareWeight).eq(BN(10000))
      ).to.eq(true);
    });
  });

  describe("Success case - merkle proof", async () => {
    beforeEach(async () => {
      const sharesAmount = initialProjectTokenBalanceCreator;
      const assetsAmount = initialCollateralTokenBalanceCreator;

      const poolParams = createMockpoolConfig({
        assets: assetsAmount,
        shares: sharesAmount,
        whitelistMerkleRoot: generateMerkleRoot(whitelistedAddresses),
        maxSharePrice: GENERIC_BN,
        maxAssetsIn: GENERIC_BN,
        maxSharesOut: GENERIC_BN,
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

      const initialUserCollateralTokenBalance = await getAccountBalance(
        bankRunClient,
        testUserA.publicKey,
        assetTokenMint
      );

      // Get user's pool account
      const initialUserPoolPda = findProgramAddressSync(
        [testUserA.publicKey.toBuffer(), poolPda.toBuffer()],
        program.programId
      )[0];

      const merkleProof = generateMerkleProof(
        whitelistedAddresses,
        testUserA.publicKey.toBase58()
      );

      const assetAmountIn = initialUserCollateralTokenBalance.div(BN(2));

      // Get expected shares out by reading a view function's emitted event.
      const expectedSharesOut = await program.methods
        .previewSharesOut(
          // Assets In (Collateral)
          assetAmountIn
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
        .then((data) => data.events[0].data.sharesOut as BigNumber);

      // Buy project token
      await program.methods
        .swapExactAssetsForShares(
          assetAmountIn,
          expectedSharesOut,
          merkleProof,
          null
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
          referrerStateInPool: null,
          userStateInPool: initialUserPoolPda,
        })
        .signers([testUserA])
        .rpc();
    });

    it("should be able to sell project tokens (shares) for exact collateral tokens (assets) when a user is whitelisted", async () => {
      const {
        userAssetBalance: userAssetBalanceBefore,
        poolAssetBalance: poolAssetBalanceBefore,
        userPoolPda,
        userPoolAccount: userPoolAccountBefore,
        pool: poolBefore,
      } = await getAllAccountState({
        program,
        poolPda,
        bankRunClient,
        shareTokenMint,
        assetTokenMint,
        user: testUserA.publicKey,
        ownerConfigPda,
        creator: creator.publicKey,
      });

      const merkleProof = generateMerkleProof(
        whitelistedAddresses,
        testUserA.publicKey.toBase58()
      );

      const assetsToSell = BN("100000000");

      const maxSharesIn = await program.methods
        .previewSharesIn(
          // Assets to sell (Collateral)
          assetsToSell
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
        .then((data) => data.events[0].data.sharesIn as BigNumber);

      // Sell project token
      await program.methods
        .swapSharesForExactAssets(assetsToSell, maxSharesIn, merkleProof, null)
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
        .rpc();

      const {
        userPoolAccount: userPoolAccountAfter,
        userAssetBalance: userAssetBalanceAfter,
        poolAssetBalance: poolAssetBalanceAfter,
        pool: poolAfter,
        ownerConfig: { swapFee },
      } = await getAllAccountState({
        program,
        poolPda,
        bankRunClient,
        shareTokenMint,
        assetTokenMint,
        user: testUserA.publicKey,
        ownerConfigPda,
        creator: creator.publicKey,
      });

      expect(userPoolAccountAfter.purchasedShares.toString()).to.eq(
        userPoolAccountBefore.purchasedShares.sub(maxSharesIn).toString()
      );
      expect(userAssetBalanceAfter.toString()).to.eq(
        userAssetBalanceBefore.add(assetsToSell).toString()
      );

      expect(poolAfter.totalSwapFeesShare.toNumber()).to.be.closeTo(
        poolBefore.totalSwapFeesShare
          .add(maxSharesIn.mul(BN(swapFee)).div(BN(MAX_FEE_BASIS_POINTS)))
          .toNumber(),
        120000 // 0.99% error margin
      );
      expect(poolAfter.totalPurchased.toString()).to.eq(
        poolBefore.totalPurchased.sub(maxSharesIn).toString()
      );
      expect(poolAssetBalanceAfter.toString()).to.eq(
        poolAssetBalanceBefore.sub(assetsToSell).toString()
      );
    });
  });

  describe("Failure cases - merkle root whitelist present", async () => {
    beforeEach(async () => {
      const sharesAmount = initialProjectTokenBalanceCreator;
      const assetsAmount = initialCollateralTokenBalanceCreator;

      const poolParams = createMockpoolConfig({
        assets: assetsAmount,
        shares: sharesAmount,
        whitelistMerkleRoot: generateMerkleRoot(whitelistedAddresses),
        maxSharePrice: GENERIC_BN,
        maxAssetsIn: GENERIC_BN,
        maxSharesOut: GENERIC_BN,
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

      const initialUserCollateralTokenBalance = await getAccountBalance(
        bankRunClient,
        testUserA.publicKey,
        assetTokenMint
      );

      // Get user's pool account
      const initialUserPoolPda = findProgramAddressSync(
        [testUserA.publicKey.toBuffer(), poolPda.toBuffer()],
        program.programId
      )[0];

      const merkleProof = generateMerkleProof(
        whitelistedAddresses,
        testUserA.publicKey.toBase58()
      );

      const assetAmountIn = initialUserCollateralTokenBalance.div(BN(2));

      // Get expected shares out by reading a view function's emitted event.
      const expectedSharesOut = await program.methods
        .previewSharesOut(
          // Assets In (Collateral)
          assetAmountIn
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
        .then((data) => data.events[0].data.sharesOut as BigNumber);

      // Buy project token
      await program.methods
        .swapExactAssetsForShares(
          assetAmountIn,
          expectedSharesOut,
          merkleProof,
          null
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
          referrerStateInPool: null,
          userStateInPool: initialUserPoolPda,
        })
        .signers([testUserA])
        .rpc();
    });
    it("Should not be able to sell when the whitelist is not passed as a param", async () => {
      const { userPoolPda } = await getAllAccountState({
        program,
        poolPda,
        bankRunClient,
        shareTokenMint,
        assetTokenMint,
        user: testUserA.publicKey,
        ownerConfigPda,
        creator: creator.publicKey,
      });

      const assetsToSell = BN("100000000");

      const maxSharesIn = await program.methods
        .previewSharesIn(
          // Assets to sell (Collateral)
          assetsToSell
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
        .then((data) => data.events[0].data.sharesIn as BigNumber);

      // Sell project token
      await expect(
        // Sell project token
        program.methods
          .swapSharesForExactAssets(assetsToSell, maxSharesIn, null, null)
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
      ).to.be.rejectedWith("WhitelistProof");
    });
  });

  describe("Failure cases - no merkle proof", async () => {
    beforeEach(async () => {
      const sharesAmount = initialProjectTokenBalanceCreator;
      const assetsAmount = initialCollateralTokenBalanceCreator;

      const poolParams = createMockpoolConfig({
        assets: assetsAmount,
        shares: sharesAmount,
        maxSharePrice: BN("1000000000000000000"),
        maxAssetsIn: BN("1000000000000000000"),
        maxSharesOut: BN("1000000000000000000"),
        sellingAllowed: false,
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

      const assetAmountIn = initialUserCollateralTokenBalance.div(BN(2));

      // Get expected shares out by reading a view function's emitted event.
      const expectedSharesOut = await program.methods
        .previewSharesOut(
          // Assets In (Collateral)
          assetAmountIn
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
        .then((data) => data.events[0].data.sharesOut as BigNumber);

      // Buy some project tokens
      await program.methods
        .swapExactAssetsForShares(assetAmountIn, expectedSharesOut, null, null)
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
        .rpc();
    });
    it("Should not be able to sell when selling is disallowed", async () => {
      const pool = await program.account.liquidityBootstrappingPool.fetch(
        poolPda
      );
      expect(pool.sellingAllowed).to.eq(false);

      await expect(
        program.methods
          .swapSharesForExactAssets(BN(1), BN(1), null, null)
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
          })
          .signers([testUserA])
          .rpc()
      ).to.be.rejectedWith("SellingDisallowed");
    });
    it("Should not be able to sell when the sale is over", async () => {
      const pool = await program.account.liquidityBootstrappingPool.fetch(
        poolPda
      );
      // Skip time by 1100 seconds
      await skipBlockTimestamp(bankRunCtx, pool.saleEndTime.toNumber() + 1);

      await expect(
        program.methods
          .swapSharesForExactAssets(BN(1), BN(1), null, null)
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
          })
          .signers([testUserA])
          .rpc()
      ).to.be.rejectedWith("TradingDisallowed");
    });
  });
});
