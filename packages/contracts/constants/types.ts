import * as anchor from "@coral-xyz/anchor";

/**
 * Use Anchor defined BN type for BigNumber
 */
export const BN = (n: number | string) => new anchor.BN(n);
export type BigNumber = anchor.BN;
