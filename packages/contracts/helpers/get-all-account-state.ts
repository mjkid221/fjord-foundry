import { Program } from "@coral-xyz/anchor";
import { findProgramAddressSync } from "@project-serum/anchor/dist/cjs/utils/pubkey";
import { PublicKey } from "@solana/web3.js";
import { BanksClient } from "solana-bankrun";

import { FjordLbp } from "../types";

import { getAccountBalance } from "./bankrun";

export const getAllAccountState = async ({
  program,
  poolPda,
  bankRunClient,
  shareTokenMint,
  assetTokenMint,
  user,
  ownerConfigPda,
}: {
  program: Program<FjordLbp>;
  poolPda: PublicKey;
  bankRunClient: BanksClient;
  shareTokenMint: PublicKey;
  assetTokenMint: PublicKey;
  user: PublicKey;
  ownerConfigPda: PublicKey;
}) => {
  const pool = await program.account.liquidityBootstrappingPool.fetch(poolPda);
  const poolShareBalance = await getAccountBalance(
    bankRunClient,
    poolPda,
    shareTokenMint
  );
  const poolAssetBalance = await getAccountBalance(
    bankRunClient,
    poolPda,
    assetTokenMint
  );
  const userPoolPda = findProgramAddressSync(
    [user.toBuffer(), poolPda.toBuffer()],
    program.programId
  )[0];

  const userPoolAccount = await program.account.userStateInPool.fetch(
    userPoolPda
  );

  const userShareBalance = await getAccountBalance(
    bankRunClient,
    user,
    shareTokenMint
  );

  const userAssetBalance = await getAccountBalance(
    bankRunClient,
    user,
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
  };
};
