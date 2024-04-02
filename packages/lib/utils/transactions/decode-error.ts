import { ErrorDescription } from "@ethersproject/abi/lib/interface";
import { Interface, BytesLike } from "ethers/lib/utils";

/**
 * Decode an error thrown by a contract
 * @param error an error data string
 * @param contractInterface a contract interface from typechain. Can be created from a typechain factory with factory.createInstance()
 */
export const decodeError = (
  error: BytesLike,
  contractInterface: Interface
): ErrorDescription => {
  try {
    const errorDescription = contractInterface.parseError(error);
    if (!errorDescription) {
      return { name: "Unknown Error" } as ErrorDescription;
    }
    return errorDescription;
  } catch (contractError) {
    return { name: "Unknown Error" } as ErrorDescription;
  }
};
