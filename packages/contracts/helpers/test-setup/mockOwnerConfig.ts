import { Keypair } from "@solana/web3.js";

import { FjordLbpStruct } from "./mockPoolConfig";

export const createMockOwnerConfig = (
  requestField?: Partial<FjordLbpStruct<"initializeOwnerConfig">>
) => ({
  ownerKey: requestField?.ownerKey || Keypair.generate().publicKey,
  feeRecipient: requestField?.feeRecipient || Keypair.generate().publicKey,
  platformFee: requestField?.platformFee || 100, // 1%
  referralFee: requestField?.referralFee || 100, // 1%
  swapFee: requestField?.swapFee || 100, // 1%
});
