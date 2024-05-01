import {
  TOKEN_PROGRAM_ID,
  createInitializeMintInstruction,
  getAccount,
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
  createMintToInstruction,
  getMinimumBalanceForRentExemptMint,
  MINT_SIZE,
} from "@solana/spl-token";
import {
  Keypair,
  clusterApiUrl,
  Connection,
  Transaction,
  SystemProgram,
  sendAndConfirmTransaction,
  PublicKey,
} from "@solana/web3.js";
import { BanksClient } from "solana-bankrun";

/**
 * Mint two tokens for testing.
 */
export const setup = async ({
  payer,
  testUser,
  connection = new Connection(clusterApiUrl("devnet")),
  bankRunClient,
  decimalsTokenA = 9,
  decimalsTokenB = 9,
  supplyTokenA = 1000000,
  supplyTokenB = 1000000,
}: {
  payer: Keypair;
  testUser?: Keypair;
  connection?: Connection;
  bankRunClient?: BanksClient;
  decimalsTokenA?: number;
  decimalsTokenB?: number;
  supplyTokenA?: number;
  supplyTokenB?: number;
}) => {
  // Deploys two tokens for testing. Token A and Token B.
  const {
    tokenMint: tokenAMint,
    tokenPayerAccount: tokenAMintPayerAccount,
    userTokenAccountAddress: tokenAUserAccount,
  } = await createToken({
    payer,
    connection,
    testUser,
    bankRunClient,
    decimals: decimalsTokenA,
    amount: supplyTokenA,
  });

  const {
    tokenMint: tokenBMint,
    tokenPayerAccount: tokenBMintPayerAccount,
    userTokenAccountAddress: tokenBUserAccount,
  } = await createToken({
    payer,
    connection,
    testUser,
    bankRunClient,
    decimals: decimalsTokenB,
    amount: supplyTokenB,
  });

  return {
    tokenAMint,
    tokenBMint,
    tokenAMintPayerAccount,
    tokenBMintPayerAccount,
    tokenAUserAccount,
    tokenBUserAccount,
  };
};

const createToken = async ({
  payer,
  testUser,
  decimals = 9,
  amount = 1000000,
  connection,
  bankRunClient,
}: {
  payer: Keypair;
  testUser?: Keypair;
  decimals?: number;
  amount?: number;
  connection: Connection;
  bankRunClient?: BanksClient;
}) => {
  const tokenMint = Keypair.generate();

  const transaction = new Transaction();

  const lamports = await getMinimumBalanceForRentExemptMint(connection);

  transaction.add(
    // Create an account which will store our tokens.
    SystemProgram.createAccount({
      fromPubkey: payer.publicKey,
      newAccountPubkey: tokenMint.publicKey,
      lamports,
      space: MINT_SIZE,
      programId: TOKEN_PROGRAM_ID,
    }),
    // create new token mint where we use the account we just created
    createInitializeMintInstruction(
      tokenMint.publicKey,
      decimals,
      payer.publicKey,
      null,
      TOKEN_PROGRAM_ID
    )
  );

  // Pre-compute the address of our token account which will hold the tokens.
  const tokenAccountAddress = await getAssociatedTokenAddress(
    tokenMint.publicKey,
    payer.publicKey
  );

  // getAccount throws an error if the account doesn't exist,
  // so we need to create it if an error is thrown.
  try {
    await getAccount(connection, tokenAccountAddress);
  } catch {
    transaction.add(
      createAssociatedTokenAccountInstruction(
        payer.publicKey, // fee payer
        tokenAccountAddress, // token account
        payer.publicKey, // token owner
        tokenMint.publicKey // token mint
      )
    );
  }

  // Mint tokens to the `tokenAccountAddress` we've fetched/created.
  transaction.add(
    createMintToInstruction(
      tokenMint.publicKey,
      tokenAccountAddress,
      payer.publicKey,
      amount * 10 ** decimals
    )
  );

  const userTokenAccountAddress = await _mintSomeTokensToTestUser({
    user: testUser,
    payer,
    tokenMint: tokenMint.publicKey,
    transaction,
    decimals,
  });

  if (bankRunClient) {
    const blockhash = await bankRunClient.getLatestBlockhash();
    transaction.recentBlockhash = blockhash?.[0];
    transaction.sign(payer, tokenMint);
    await bankRunClient.processTransaction(transaction);
  } else {
    await sendAndConfirmTransaction(connection, transaction, [
      payer,
      tokenMint,
    ]);
  }

  return {
    tokenMint: tokenMint.publicKey,
    tokenPayerAccount: tokenAccountAddress,
    userTokenAccountAddress,
    decimals,
    amount,
  };
};

/**
 * Mint some tokens to the test user.
 */
const _mintSomeTokensToTestUser = async ({
  user,
  payer,
  tokenMint,
  transaction,
  decimals,
  amount = 1000,
}: {
  user?: Keypair;
  payer: Keypair;
  tokenMint: PublicKey;
  transaction: Transaction;
  decimals: number;
  amount?: number;
}) => {
  if (!user) {
    return undefined;
  }
  const userTokenAccountAddress = await getAssociatedTokenAddress(
    tokenMint,
    user.publicKey
  );

  transaction.add(
    createAssociatedTokenAccountInstruction(
      payer.publicKey, // fee payer
      userTokenAccountAddress, // token account
      user.publicKey, // token owner
      tokenMint // token mint
    ),
    // Mint some tokens to testUser
    createMintToInstruction(
      tokenMint,
      userTokenAccountAddress,
      payer.publicKey,
      amount * 10 ** decimals
    )
  );

  return userTokenAccountAddress;
};
