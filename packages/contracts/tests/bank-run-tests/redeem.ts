import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { findProgramAddressSync } from "@project-serum/anchor/dist/cjs/utils/pubkey";
import {
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
  getAccount,
  MAX_FEE_BASIS_POINTS,
} from "@solana/spl-token";
import {
  Keypair,
  PublicKey,
  Transaction,
  LAMPORTS_PER_SOL,
  SystemProgram,
  AccountMeta,
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

describe("Fjord LBP - Redeem", () => {
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
        lamports: 100 * LAMPORTS_PER_SOL,
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
      supplyTokenA: 3_000_000_000,
      supplyTokenB: 3_000_000_000,
      // decimalsTokenA: 8,
      // decimalsTokenB: 8,
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

  describe("Set up Buy and Sell", async () => {
    beforeEach(async () => {
      const sharesAmount = initialProjectTokenBalanceCreator;
      const assetsAmount = initialCollateralTokenBalanceCreator;

      const poolParams = createMockpoolConfig({
        assets: assetsAmount,
        shares: sharesAmount,
        maxSharePrice: BN("10000000000000000000"),
        maxAssetsIn: BN("9000000000000000000"),
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
          userStateInPool: userPoolPda,
        })
        .signers([testUserA])
        .rpc();

      const { userPoolAccount: userPoolAccountBefore } =
        await getAllAccountState({
          program,
          poolPda,
          bankRunClient,
          shareTokenMint,
          assetTokenMint,
          user: testUserA.publicKey,
          ownerConfigPda,
          creator: creator.publicKey,
        });

      // Number of project tokens to sell (Shares)
      const sharesIn = userPoolAccountBefore?.purchasedShares.div(BN(2))!;

      const minAssetsOut = await program.methods
        .previewAssetsOut(
          // Shares to sell (Collateral)
          sharesIn
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
        .then((data) => data.events[0].data.assetsOut as BigNumber);

      // Sell project token
      await program.methods
        .swapExactSharesForAssets(sharesIn, minAssetsOut, null, null)
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
    describe("Success case", async () => {
      it("should be able to close the pool", async () => {
        const {
          pool,
          poolShareBalance,
          treasury,
          poolAssetBalance,
          ownerConfig,
          creatorAssetBalance: creatorAssetBalanceBefore,
          creatorShareBalance: creatorShareBalanceBefore,
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
        // Skip time by 1100 seconds
        await skipBlockTimestamp(bankRunCtx, pool.saleEndTime.toNumber() + 1);

        // Get fee recipient informations.
        // !NOTE - There are two types of fee recipients in the treasury.
        // 1. Swap fee recipient - This is a single user who will receive the swap fees in asset and share token.
        // 2. Fee recipients - These are the array of users who will receive a set fee (in asset token) based on the percentage set.
        const { feeRecipients, swapFeeRecipient } = treasury;
        const [
          swapFeeRecipientAssetTokenAccount,
          swapFeeRecipientShareTokenAccount,
          swapFeeRecipientAssetBalanceBefore,
          swapFeeRecipientShareBalanceBefore,
          treasuryAssetTokenAccount,
          treasuryShareTokenAccount,
        ] = await Promise.all([
          getAssociatedTokenAddress(assetTokenMint, swapFeeRecipient),
          getAssociatedTokenAddress(shareTokenMint, swapFeeRecipient),
          getAccountBalance(bankRunClient, swapFeeRecipient, assetTokenMint),
          getAccountBalance(bankRunClient, swapFeeRecipient, shareTokenMint),
          getAssociatedTokenAddress(assetTokenMint, treasuryPda, true),
          getAssociatedTokenAddress(shareTokenMint, treasuryPda, true),
        ]);

        // Get all information about fee recipients
        const feeRecipientsAssetBalancesBefore = await Promise.all(
          feeRecipients.map(async ({ user, percentage }) => ({
            user,
            assetTokenBalance: await getAccountBalance(
              bankRunClient,
              user,
              assetTokenMint
            ),
            percentage,
          }))
        );

        const totalAssetsInPool = poolAssetBalance.sub(pool.totalSwapFeesAsset);
        const platformFees = totalAssetsInPool
          .mul(BN(ownerConfig.platformFee))
          .div(BN(MAX_FEE_BASIS_POINTS));
        const totalAssetsMinusFees = totalAssetsInPool
          .sub(platformFees)
          .sub(pool.totalReferred);

        // Add instructions to create asset token accounts for recipient atas if they dont exist
        const preInstructions = new Transaction();
        const recipientAccountsSetup: Array<AccountMeta> = [];
        const promises: Promise<void>[] = [];

        [assetTokenMint].forEach((token) => {
          feeRecipients.forEach(({ user: recipient }) => {
            const promise = getAssociatedTokenAddress(
              token,
              recipient,
              true
            ).then(async (recipientAta) => {
              try {
                // This should throw an error if the account doesn't exist
                await getAccount(connection, recipientAta);
              } catch {
                // Add instruction to create one
                preInstructions.add(
                  createAssociatedTokenAccountInstruction(
                    testUserA.publicKey, // fee payer
                    recipientAta, // recipient's associated token account
                    recipient, // recipient's public key
                    token // token mint address
                  )
                );
              }
              // Add extra recipient accounts to the accounts array for our program to use as a reference
              recipientAccountsSetup.push({
                pubkey: recipientAta,
                isWritable: true,
                isSigner: false,
              });
            });
            promises.push(promise);
          });
        });

        // Wait for all promises to complete
        await Promise.all(promises);

        await program.methods
          .closePool()
          .accounts({
            assetTokenMint,
            shareTokenMint,
            pool: poolPda,
            poolAssetTokenAccount,
            poolShareTokenAccount,
            treasuryAssetTokenAccount,
            treasuryShareTokenAccount,
            treasury: treasuryPda,
            creatorAssetTokenAccount,
            creatorShareTokenAccount,
            ownerConfig: ownerConfigPda,
            user: testUserA.publicKey,
            poolCreator: creator.publicKey,
            swapFeeRecipientAssetTokenAccount,
            swapFeeRecipientShareTokenAccount,
            swapFeeRecipient: treasury.swapFeeRecipient,
          })
          .signers([testUserA])
          // Creates the associated token accounts for the recipients if they don't exist
          .preInstructions(preInstructions.instructions)
          // Pass all the recipient accounts to the program via remaining accounts
          .remainingAccounts(recipientAccountsSetup)
          .rpc();

        const {
          treasuryAssetBalance: treasuryAssetBalanceAfter,
          treasuryShareBalance: treasuryShareBalanceAfter,
          creatorShareBalance: creatorShareBalanceAfter,
          creatorAssetBalance: creatorAssetBalanceAfter,
        } = await getAllAccountState({
          program,
          poolPda,
          bankRunClient,
          shareTokenMint,
          assetTokenMint,
          user: testUserA.publicKey,
          treasuryPda,
          creator: creator.publicKey,
        });

        // Get all fees received by fee recipients
        const feeRecipientsAssetBalancesAfter = await Promise.all(
          feeRecipients.map(async ({ user, percentage }) => ({
            user,
            assetTokenBalance: await getAccountBalance(
              bankRunClient,
              user,
              assetTokenMint
            ),
            percentage,
          }))
        );
        const [
          swapFeeRecipientAssetBalanceAfter,
          swapFeeRecipientShareBalanceAfter,
        ] = await Promise.all([
          getAccountBalance(bankRunClient, swapFeeRecipient, assetTokenMint),
          getAccountBalance(bankRunClient, swapFeeRecipient, shareTokenMint),
        ]);

        // Expect most of the treasury balance to be emptied out as it is sent to relevant parties with some delta due to decimal precision.
        expect(treasuryShareBalanceAfter.toNumber()).to.be.closeTo(0, 1);
        expect(treasuryAssetBalanceAfter.toNumber()).to.be.closeTo(0, 1);
        const unsoldShares = poolShareBalance.sub(pool.totalPurchased);
        expect(
          creatorShareBalanceAfter.eq(
            creatorShareBalanceBefore.add(unsoldShares)
          )
        ).to.be.eq(true);
        // Check the swap fee recipient has received their share of the fees in asset and share token
        expect(
          swapFeeRecipientAssetBalanceAfter.eq(
            swapFeeRecipientAssetBalanceBefore.add(pool.totalSwapFeesAsset)
          )
        ).to.be.eq(true);
        expect(
          swapFeeRecipientShareBalanceAfter.eq(
            swapFeeRecipientShareBalanceBefore.add(pool.totalSwapFeesShare)
          )
        ).to.be.eq(true);
        // Check if the fee recipients have received their share of the fees in asset token
        feeRecipientsAssetBalancesBefore.forEach(
          ({
            user: recipient,
            assetTokenBalance: balanceBefore,
            percentage,
          }) => {
            const balanceAfter = feeRecipientsAssetBalancesAfter.find(
              ({ user }) => user.equals(recipient)
            )?.assetTokenBalance;
            expect(
              balanceAfter?.eq(
                balanceBefore.add(
                  platformFees.mul(BN(percentage)).div(BN(MAX_FEE_BASIS_POINTS))
                )
              )
            ).to.be.eq(true);
          }
        );
        expect(
          creatorAssetBalanceAfter.eq(
            creatorAssetBalanceBefore.add(totalAssetsMinusFees)
          )
        ).to.be.eq(true);
      });

      it("Should be able to redeem after closing pool", async () => {
        const {
          pool,
          treasury,
          userAssetBalance: userAssetBalanceBefore,
          userShareBalance: userShareBalanceBefore,
          userPoolAccount,
          userPoolPda,
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
        await skipBlockTimestamp(bankRunCtx, pool.saleEndTime.toNumber() + 1);

        // Get fee recipient informations.
        const { feeRecipients, swapFeeRecipient } = treasury;
        const [
          swapFeeRecipientAssetTokenAccount,
          swapFeeRecipientShareTokenAccount,
          treasuryAssetTokenAccount,
          treasuryShareTokenAccount,
        ] = await Promise.all([
          getAssociatedTokenAddress(assetTokenMint, swapFeeRecipient),
          getAssociatedTokenAddress(shareTokenMint, swapFeeRecipient),
          getAssociatedTokenAddress(assetTokenMint, treasuryPda, true),
          getAssociatedTokenAddress(shareTokenMint, treasuryPda, true),
        ]);

        // Add instructions to create asset token accounts for recipient atas if they dont exist
        const preInstructions = new Transaction();
        const recipientAccountsSetup: Array<AccountMeta> = [];
        const promises: Promise<void>[] = [];

        [assetTokenMint].forEach((token) => {
          feeRecipients.forEach(({ user: recipient }) => {
            const promise = getAssociatedTokenAddress(
              token,
              recipient,
              true
            ).then(async (recipientAta) => {
              try {
                // This should throw an error if the account doesn't exist
                await getAccount(connection, recipientAta);
              } catch {
                // Add instruction to create one
                preInstructions.add(
                  createAssociatedTokenAccountInstruction(
                    testUserA.publicKey, // fee payer
                    recipientAta, // recipient's associated token account
                    recipient, // recipient's public key
                    token // token mint address
                  )
                );
              }
              // Add extra recipient accounts to the accounts array for our program to use as a reference
              recipientAccountsSetup.push({
                pubkey: recipientAta,
                isWritable: true,
                isSigner: false,
              });
            });
            promises.push(promise);
          });
        });

        // Wait for all promises to complete
        await Promise.all(promises);

        await program.methods
          .closePool()
          .accounts({
            assetTokenMint,
            shareTokenMint,
            pool: poolPda,
            poolAssetTokenAccount,
            poolShareTokenAccount,
            treasuryAssetTokenAccount,
            treasuryShareTokenAccount,
            treasury: treasuryPda,
            creatorAssetTokenAccount,
            creatorShareTokenAccount,
            ownerConfig: ownerConfigPda,
            user: testUserA.publicKey,
            poolCreator: creator.publicKey,
            swapFeeRecipientAssetTokenAccount,
            swapFeeRecipientShareTokenAccount,
            swapFeeRecipient: treasury.swapFeeRecipient,
          })
          .signers([testUserA])
          // Creates the associated token accounts for the recipients if they don't exist
          .preInstructions(preInstructions.instructions)
          // Pass all the recipient accounts to the program via remaining accounts
          .remainingAccounts(recipientAccountsSetup)
          .rpc();

        // Redeem
        const isReferred = true;
        await program.methods
          .redeem(isReferred)
          .accounts({
            assetTokenMint,
            shareTokenMint,
            pool: poolPda,
            poolAssetTokenAccount,
            poolShareTokenAccount,
            user: testUserA.publicKey,
            userAssetTokenAccount: assetTokenMintUserAccount,
            userShareTokenAccount: shareTokenMintUserAccount,
            userStateInPool: userPoolPda,
          })
          .signers([testUserA])
          .rpc();

        const {
          userAssetBalance: userAssetBalanceAfter,
          userShareBalance: userShareBalanceAfter,
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

        expect(userShareBalanceAfter.toNumber() / 1e9).to.be.closeTo(
          userShareBalanceBefore
            .add(userPoolAccount?.purchasedShares!)
            .toNumber() / 1e9,
          10
        );
        expect(
          userAssetBalanceAfter.eq(
            userAssetBalanceBefore.add(userPoolAccount?.referredAssets!)
          )
        ).to.be.eq(true);
      });
    });
    describe("Failure case", async () => {
      it("Should not be able to close pool if sale period is not over", async () => {
        const { treasury } = await getAllAccountState({
          program,
          poolPda,
          bankRunClient,
          shareTokenMint,
          assetTokenMint,
          user: testUserA.publicKey,
          ownerConfigPda,
          creator: creator.publicKey,
        });

        // Get fee recipient informations.
        const { feeRecipients, swapFeeRecipient } = treasury;
        const [
          swapFeeRecipientAssetTokenAccount,
          swapFeeRecipientShareTokenAccount,
          treasuryAssetTokenAccount,
          treasuryShareTokenAccount,
        ] = await Promise.all([
          getAssociatedTokenAddress(assetTokenMint, swapFeeRecipient),
          getAssociatedTokenAddress(shareTokenMint, swapFeeRecipient),
          getAssociatedTokenAddress(assetTokenMint, treasuryPda, true),
          getAssociatedTokenAddress(shareTokenMint, treasuryPda, true),
        ]);

        // Add instructions to create asset token accounts for recipient atas if they dont exist
        const preInstructions = new Transaction();
        const recipientAccountsSetup: Array<AccountMeta> = [];
        const promises: Promise<void>[] = [];

        [assetTokenMint].forEach((token) => {
          feeRecipients.forEach(({ user: recipient }) => {
            const promise = getAssociatedTokenAddress(
              token,
              recipient,
              true
            ).then(async (recipientAta) => {
              try {
                // This should throw an error if the account doesn't exist
                await getAccount(connection, recipientAta);
              } catch {
                // Add instruction to create one
                preInstructions.add(
                  createAssociatedTokenAccountInstruction(
                    testUserA.publicKey, // fee payer
                    recipientAta, // recipient's associated token account
                    recipient, // recipient's public key
                    token // token mint address
                  )
                );
              }
              // Add extra recipient accounts to the accounts array for our program to use as a reference
              recipientAccountsSetup.push({
                pubkey: recipientAta,
                isWritable: true,
                isSigner: false,
              });
            });
            promises.push(promise);
          });
        });

        // Wait for all promises to complete
        await Promise.all(promises);

        await expect(
          program.methods
            .closePool()
            .accounts({
              assetTokenMint,
              shareTokenMint,
              pool: poolPda,
              poolAssetTokenAccount,
              poolShareTokenAccount,
              treasuryAssetTokenAccount,
              treasuryShareTokenAccount,
              treasury: treasuryPda,
              creatorAssetTokenAccount,
              creatorShareTokenAccount,
              ownerConfig: ownerConfigPda,
              user: testUserA.publicKey,
              poolCreator: creator.publicKey,
              swapFeeRecipientAssetTokenAccount,
              swapFeeRecipientShareTokenAccount,
              swapFeeRecipient: treasury.swapFeeRecipient,
            })
            .signers([testUserA])
            // Creates the associated token accounts for the recipients if they don't exist
            .preInstructions(preInstructions.instructions)
            // Pass all the recipient accounts to the program via remaining accounts
            .remainingAccounts(recipientAccountsSetup)
            .rpc()
        ).to.be.rejectedWith("ClosingDisallowed");
      });

      it("Should not be able to close pool again if it's already closed", async () => {
        const { treasury, pool } = await getAllAccountState({
          program,
          poolPda,
          bankRunClient,
          shareTokenMint,
          assetTokenMint,
          user: testUserA.publicKey,
          ownerConfigPda,
          creator: creator.publicKey,
        });

        await skipBlockTimestamp(bankRunCtx, pool.saleEndTime.toNumber() + 1);

        // Get fee recipient informations.
        const { feeRecipients, swapFeeRecipient } = treasury;
        const [
          swapFeeRecipientAssetTokenAccount,
          swapFeeRecipientShareTokenAccount,
          treasuryAssetTokenAccount,
          treasuryShareTokenAccount,
        ] = await Promise.all([
          getAssociatedTokenAddress(assetTokenMint, swapFeeRecipient),
          getAssociatedTokenAddress(shareTokenMint, swapFeeRecipient),
          getAssociatedTokenAddress(assetTokenMint, treasuryPda, true),
          getAssociatedTokenAddress(shareTokenMint, treasuryPda, true),
        ]);

        // Add instructions to create asset token accounts for recipient atas if they dont exist
        const preInstructions = new Transaction();
        const recipientAccountsSetup: Array<AccountMeta> = [];
        const promises: Promise<void>[] = [];

        [assetTokenMint].forEach((token) => {
          feeRecipients.forEach(({ user: recipient }) => {
            const promise = getAssociatedTokenAddress(
              token,
              recipient,
              true
            ).then(async (recipientAta) => {
              try {
                // This should throw an error if the account doesn't exist
                await getAccount(connection, recipientAta);
              } catch {
                // Add instruction to create one
                preInstructions.add(
                  createAssociatedTokenAccountInstruction(
                    testUserA.publicKey, // fee payer
                    recipientAta, // recipient's associated token account
                    recipient, // recipient's public key
                    token // token mint address
                  )
                );
              }
              // Add extra recipient accounts to the accounts array for our program to use as a reference
              recipientAccountsSetup.push({
                pubkey: recipientAta,
                isWritable: true,
                isSigner: false,
              });
            });
            promises.push(promise);
          });
        });

        // Wait for all promises to complete
        await Promise.all(promises);

        // Close pool
        await program.methods
          .closePool()
          .accounts({
            assetTokenMint,
            shareTokenMint,
            pool: poolPda,
            poolAssetTokenAccount,
            poolShareTokenAccount,
            treasuryAssetTokenAccount,
            treasuryShareTokenAccount,
            treasury: treasuryPda,
            creatorAssetTokenAccount,
            creatorShareTokenAccount,
            ownerConfig: ownerConfigPda,
            user: testUserA.publicKey,
            poolCreator: creator.publicKey,
            swapFeeRecipientAssetTokenAccount,
            swapFeeRecipientShareTokenAccount,
            swapFeeRecipient: treasury.swapFeeRecipient,
          })
          .signers([testUserA])
          // Creates the associated token accounts for the recipients if they don't exist
          .preInstructions(preInstructions.instructions)
          // Pass all the recipient accounts to the program via remaining accounts
          .remainingAccounts(recipientAccountsSetup)
          .rpc();

        await expect(
          program.methods
            .closePool()
            .accounts({
              assetTokenMint,
              shareTokenMint,
              pool: poolPda,
              poolAssetTokenAccount,
              poolShareTokenAccount,
              treasuryAssetTokenAccount,
              treasuryShareTokenAccount,
              treasury: treasuryPda,
              creatorAssetTokenAccount,
              creatorShareTokenAccount,
              ownerConfig: ownerConfigPda,
              user: testUserA.publicKey,
              poolCreator: creator.publicKey,
              swapFeeRecipientAssetTokenAccount,
              swapFeeRecipientShareTokenAccount,
              swapFeeRecipient: treasury.swapFeeRecipient,
            })
            .signers([testUserA])
            // Pass all the recipient accounts to the program via remaining accounts
            .remainingAccounts(recipientAccountsSetup)
            .rpc()
        ).to.be.rejectedWith("ClosingDisallowed");
      });

      it("Should not be able to redeem if the pool is not closed", async () => {
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

        // Redeem
        await expect(
          program.methods
            .redeem(false)
            .accounts({
              assetTokenMint,
              shareTokenMint,
              pool: poolPda,
              poolAssetTokenAccount,
              poolShareTokenAccount,
              user: testUserA.publicKey,
              userAssetTokenAccount: assetTokenMintUserAccount,
              userShareTokenAccount: shareTokenMintUserAccount,
              userStateInPool: userPoolPda,
            })
            .signers([testUserA])
            .rpc()
        ).to.be.rejectedWith("RedeemingDisallowed");
      });
    });
  });
});
