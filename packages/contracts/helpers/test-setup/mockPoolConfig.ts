import { BN } from "@coral-xyz/anchor";
import * as anchor from "@coral-xyz/anchor";
import { IdlType } from "@coral-xyz/anchor/dist/cjs/idl";
import {
  DecodeType,
  IdlTypes,
} from "@coral-xyz/anchor/dist/cjs/program/namespace/types";

import {
  DEFAULT_SALE_END_TIME_BN,
  DEFAULT_SALE_START_TIME_BN,
  DEFAULT_VESTING_CLIFF_BN,
  DEFAULT_VESTING_END_BN,
  generateRandomSalt,
  PERCENTAGE_BASIS_POINTS,
} from "../../constants";
import { FjordLbp } from "../../types/fjord_lbp_old";

/**
 * Create a mock pool config
 * @param requestField - The fields to override
 * @returns The mock pool config
 * @ignore This is a helper function for the tests
 */
export const createMockpoolConfig = (
  requestField?: Partial<FjordLbpStruct<"initializePool">>
): FjordLbpStruct<"initializePool"> => ({
  salt: requestField?.salt || generateRandomSalt(),
  assets: requestField?.assets || new BN(0), // Collateral token
  shares: requestField?.shares || new BN(0), // Project token
  virtualAssets: requestField?.virtualAssets || new BN(0),
  virtualShares: requestField?.virtualShares || new BN(0),
  maxSharePrice: requestField?.maxSharePrice || new BN(10000000),
  maxSharesOut: requestField?.maxSharesOut || new BN(10000000),
  maxAssetsIn: requestField?.maxAssetsIn || new BN(10000000),
  startWeightBasisPoints:
    requestField?.startWeightBasisPoints || 50 * PERCENTAGE_BASIS_POINTS, // Default: 50%
  endWeightBasisPoints:
    requestField?.endWeightBasisPoints || 50 * PERCENTAGE_BASIS_POINTS, // Default: 50%
  saleStartTime: requestField?.saleStartTime || DEFAULT_SALE_START_TIME_BN,
  saleEndTime: requestField?.saleEndTime || DEFAULT_SALE_END_TIME_BN,
  vestCliff: requestField?.vestCliff || DEFAULT_VESTING_CLIFF_BN,
  vestEnd: requestField?.vestEnd || DEFAULT_VESTING_END_BN,
  whitelistMerkleRoot: requestField?.whitelistMerkleRoot || [],
  sellingAllowed: requestField?.sellingAllowed || false,
});

type PoolConfig = ReturnType<typeof createMockpoolConfig>;
export type Accounts = {
  creator: anchor.Address | undefined;
  shareTokenMint: anchor.Address | undefined;
  assetTokenMint: anchor.Address | undefined;
  poolShareTokenAccount: anchor.Address | undefined;
  poolAssetTokenAccount: anchor.Address | undefined;
  creatorShareTokenAccount: anchor.Address | undefined;
  creatorAssetTokenAccount: anchor.Address | undefined;
};

export const formatPoolParams = (poolParams: PoolConfig) =>
  Object.values(poolParams) as any;

/**
 * Helpers to infer types from Anchor's IDL. We need to do this because the IDL is built to be consumed by Anchor and Rust runtime.
 * This means that the IDL is not directly consumable by Typescript.
 * For example, type "u64" in the IDL is represented as "BN" in Typescript.
 * @typedef {Name} Name Program's function name
 * @typedef {Program} Program Optional program IDL
 * @usage
 * ```ts
 * type InitializePool = FjordLbpStruct<"initializePool">;
 * ```
 * @author MJ
 */
export type FjordLbpStruct<
  Name extends string,
  Program = FjordLbp
> = UnionToIntersection<ArgsType<ProgramInstruction<Name, Program>>>;

// Type decoder helpers
type ProgramInstruction<Name extends string, Program> = InstructionTypeByName<
  Program,
  Name
>;

type InstructionTypeByName<Program, Name extends string> = Program extends {
  instructions: Array<infer I>;
}
  ? I extends { name: Name }
    ? I
    : never
  : never;

type ArgsType<Instruction> = Instruction extends { args: infer Args }
  ? Args extends Array<infer Arg>
    ? Arg extends { name: infer Name; type: infer Type extends IdlType }
      ? Name extends string
        ? // Decodes types that work in Typescript
          { [P in Name]: DecodeType<Type, IdlTypes<any>> }
        : never
      : never
    : never
  : never;

type UnionToIntersection<U> = (U extends any ? (k: U) => void : never) extends (
  k: infer I
) => void
  ? I
  : never;
