import { getMerkleRoot } from "@metaplex-foundation/js";

/**
 * Generate a merkle root from a list of addresses and converts it into an array to be consumable by the program.
 */
export const generateMerkleRoot = (addresses: string[]) =>
  Array.from(getMerkleRoot(addresses));
