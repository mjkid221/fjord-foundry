import { Program } from "@coral-xyz/anchor";
import { findProgramAddressSync } from "@project-serum/anchor/dist/cjs/utils/pubkey";
import { PublicKey } from "@solana/web3.js";
import { BanksClient } from "solana-bankrun";

import { BN } from "../constants";
import { FjordLbp } from "../types";

import { getAccountBalance } from "./bankrun";

export const getAllAccountState = async ({
  program,
  poolPda,
  bankRunClient,
  shareTokenMint,
  assetTokenMint,
  user,
  creator,
  ownerConfigPda = PublicKey.findProgramAddressSync(
    [Buffer.from("owner_config")],
    program.programId
  )[0],
  treasuryPda = PublicKey.findProgramAddressSync(
    [Buffer.from("treasury")],
    program.programId
  )[0],
}: {
  program: any | Program<FjordLbp>;
  poolPda: PublicKey;
  bankRunClient: BanksClient;
  shareTokenMint: PublicKey;
  assetTokenMint: PublicKey;
  creator: PublicKey;
  user: PublicKey;
  ownerConfigPda?: PublicKey;
  treasuryPda?: PublicKey;
}) => {
  const tryFetchAccountBalance = async (
    userAddress: PublicKey,
    tokenAddress: PublicKey
  ) => {
    try {
      return await getAccountBalance(bankRunClient, userAddress, tokenAddress);
    } catch {
      return BN(0);
    }
  };

  const pool = await program.account.liquidityBootstrappingPool.fetch(poolPda);
  const treasury = await program.account.treasury.fetch(treasuryPda);
  const poolShareBalance = await tryFetchAccountBalance(
    poolPda,
    shareTokenMint
  );
  const poolAssetBalance = await tryFetchAccountBalance(
    poolPda,
    assetTokenMint
  );

  const treasuryAssetBalance = await tryFetchAccountBalance(
    treasuryPda,
    assetTokenMint
  );
  const treasuryShareBalance = await tryFetchAccountBalance(
    treasuryPda,
    shareTokenMint
  );

  const userPoolPda = findProgramAddressSync(
    [user.toBuffer(), poolPda.toBuffer()],
    program.programId
  )[0];
  let userPoolAccount: any;
  try {
    userPoolAccount = await program.account.userStateInPool.fetch(userPoolPda);
  } catch {
    // Do nothing
  }

  const userShareBalance = await tryFetchAccountBalance(user, shareTokenMint);

  const userAssetBalance = await tryFetchAccountBalance(user, assetTokenMint);

  const creatorShareBalance = await tryFetchAccountBalance(
    creator,
    shareTokenMint
  );

  const creatorAssetBalance = await tryFetchAccountBalance(
    creator,
    assetTokenMint
  );

  const ownerConfig = await program.account.ownerConfig.fetch(ownerConfigPda);

  return {
    // Pool
    pool,
    poolShareBalance,
    poolAssetBalance,
    // User
    userPoolPda,
    userPoolAccount,
    userShareBalance,
    userAssetBalance,
    // Owner config
    ownerConfig,
    // Treasury
    treasury,
    treasuryAssetBalance,
    treasuryShareBalance,
    // Pool creator
    creatorShareBalance,
    creatorAssetBalance,
  };
};
