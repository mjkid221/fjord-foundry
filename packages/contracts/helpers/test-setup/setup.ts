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
} from "@solana/web3.js";

/**
 * Mint two tokens for testing.
 */
export const setup = async ({
  payer,
  connection = new Connection(clusterApiUrl("devnet")),
}: {
  payer: Keypair;
  connection?: Connection;
}) => {
  // Deploys two tokens for testing. Token A and Token B.
  const { tokenMint: tokenAMint, tokenPayerAccount: tokenAMintPayerAccount } =
    await createToken({
      payer,
      connection,
    });

  const { tokenMint: tokenBMint, tokenPayerAccount: tokenBMintPayerAccount } =
    await createToken({
      payer,
      connection,
    });

  return {
    tokenAMint,
    tokenBMint,
    tokenAMintPayerAccount,
    tokenBMintPayerAccount,
  };
};

const createToken = async ({
  payer,
  decimals = 9,
  amount = 1000000,
  connection,
}: {
  payer: Keypair;
  decimals?: number;
  amount?: number;
  connection: Connection;
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

  const transactionSignature = await sendAndConfirmTransaction(
    connection,
    transaction,
    [payer, tokenMint]
  );

  return {
    tokenMint: tokenMint.publicKey,
    tokenPayerAccount: tokenAccountAddress,
    transactionSignature,
    decimals,
    amount,
  };
};
