import { PublicKey } from "@metaplex-foundation/js";
import { getAssociatedTokenAddress, AccountLayout } from "@solana/spl-token";
import { BanksClient } from "solana-bankrun";

import { BN } from "../../constants";

/**
 * Helper function to fetch balance of a token account.
 * This is exclusively used for testing purposes when running the Bankrun client.
 */
export const getAccountBalance = async (
  client: BanksClient,
  userAddress: PublicKey,
  tokenAddress: PublicKey
) => {
  const ata = await getAssociatedTokenAddress(tokenAddress, userAddress);
  const rawAccountData = (await client.getAccount(ata))?.data;
  const decoded = AccountLayout.decode(rawAccountData!);
  return BN(decoded.amount.toString());
};
