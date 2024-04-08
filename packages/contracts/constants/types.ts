import * as anchor from "@coral-xyz/anchor";

/**
 * Define custom shortened types for convenience
 */
export const BN = (n: number | string) => new anchor.BN(n);
export type BigNumber = anchor.BN;
