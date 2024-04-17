import {
  getMerkleProof,
  getMerkleRoot,
  getMerkleTree,
} from "@metaplex-foundation/js";
import { keccak_256 as keccak256 } from "@noble/hashes/sha3";

/**
 * Generate a merkle root from a list of addresses and converts it into an array to be consumable by the program.
 */
export const generateMerkleRoot = (addresses: string[]) =>
  Array.from(getMerkleRoot(addresses));

export const generateMerkleProof = (
  allowAddresses: string[],
  userAddress: string
) => {
  // Original call returns Uint8Array[]
  const proof = getMerkleProof(allowAddresses, userAddress);
  // Convert each Uint8Array to number[]
  return proof.map((entry) => Array.from(entry));
};

export const isValidMerkleProof = (
  allowAddresses: string[],
  userAddress: string,
  validMerkleProof: number[][] = generateMerkleProof(
    allowAddresses,
    userAddress
  ),
  merkleRoot: number[] = generateMerkleRoot(allowAddresses)
) => {
  const isTreeValid = getMerkleTree(allowAddresses).verify(
    validMerkleProof.map((e) => Buffer.from(e)),
    Buffer.from(keccak256(userAddress)),
    Buffer.from(merkleRoot)
  );

  return isTreeValid;
};
