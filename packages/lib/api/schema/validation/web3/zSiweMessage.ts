/**
 * `zSiweMessage` is a Zod validation schema for validating Siwe messages.
 *
 */
import { z } from "zod";

import { zWalletAddress } from "./zWalletAddress";

export const zSiweMessage = z.object({
  domain: z.string(),
  address: zWalletAddress,
  statement: z.string(),
  uri: z.string(),
  version: z.string(),
  chainId: z.number(),
  nonce: z.string(),
  expirationTime: z.string().datetime(),
  issuedAt: z.string().datetime(),
});
