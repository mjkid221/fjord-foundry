import {
  arrayify,
  keccak256,
  defaultAbiCoder,
  ParamType,
} from "ethers/lib/utils";

export type TypedMessage = {
  types: ReadonlyArray<string | ParamType>;
  values: ReadonlyArray<any>;
};

/**
 * Encodes a message hash as an arrayified value
 * @param types an array of the types that are being encoded (i.e. ["uint256", "address"])
 * @param values And array of values to be encoded. Their position in the array must match the position of their type in the "types" param
 * @example arrayifyHash({types: ["address", "bool", "uint256"], values:[useAddress, isValid, timestamp]})
 * @returns Values encoded as a 32 byte array. Can be used for signing messages.
 */
export const arrayifyHash = ({ types, values }: TypedMessage) => {
  const messageHash = createMessageHash({ types, values });
  return arrayify(messageHash);
};

/**
 * A message as a hash value
 * @param types an array of the types that are being encoded (i.e. ["uint256", "address"])
 * @param values And array of values to be encoded. Their position in the array must match the position of their type in the "types" param
 * @example createMessageHash({types: ["address", "bool", "uint256"], values:[useAddress, isValid, timestamp]})
 * @returns An encoded string value (i.e. "0xac3e416ccbae4e3f68359342c75f168a4b36f0db85eb3b813ba6738603dc5b07")
 */
export const createMessageHash = ({ types, values }: TypedMessage) =>
  keccak256(defaultAbiCoder.encode(types, values));
