import { Keypair, PublicKey } from "@solana/web3.js";

import { FjordLbpStruct } from "./mockPoolConfig";

export const createMockOwnerConfig = (
  requestField?: Partial<
    FjordLbpStruct<"initializeOwnerConfig"> & {
      ownerKey: PublicKey;
      swapFeeRecipient: PublicKey;
      feeRecipients: PublicKey;
    }
  >
) => ({
  ownerKey: requestField?.ownerKey || Keypair.generate().publicKey,
  swapFeeRecipient:
    requestField?.swapFeeRecipient || Keypair.generate().publicKey,
  feeRecipients: requestField?.feeRecipients || [
    Keypair.generate().publicKey,
    Keypair.generate().publicKey,
  ],
  feePercentages: requestField?.feePercentages || [5000, 5000], // 50%, 50%
  platformFee: requestField?.platformFee || 100, // 1%
  referralFee: requestField?.referralFee || 100, // 1%
  swapFee: requestField?.swapFee || 100, // 1%
});
