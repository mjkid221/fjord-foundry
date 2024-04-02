import { TransactionResponse } from "@ethersproject/abstract-provider";
import { ContractTransaction } from "ethers";
import { Interface } from "ethers/lib/utils";

import { HttpError } from "../HttpError";

import { decodeError } from "./decode-error";

/**
 * Handles a transaction by wrapping it in a try/catch block
 * @param transaction The transaction to be handled
 * @param contractInterface a contract interface from typechain. Used to decode contract errors, if thrown
 * @param noOfConfirmations (optional) the number of confirmations on chain before the transaction is accepted
 * @returns If successful, returns a transaction receipt (https://docs.ethers.org/v6/api/providers/types/#providers-TransactionReceipt)
 * @returns On error, returns a decoded contract error https://docs.ethers.org/v5/api/utils/abi/interface/#ErrorDescription
 */
export const transactionHandler = async (
  transaction: () => Promise<ContractTransaction>,
  contractInterface: Interface,
  noOfConfirmations?: number
) => {
  try {
    const tx = (await transaction()) as TransactionResponse;
    const receipt = await tx.wait(noOfConfirmations);
    return receipt;
  } catch (err: any) {
    if (err.code === "ACTION_REJECTED") {
      throw new HttpError(400, err.code);
    }

    const errorBytes =
      err?.error?.data?.data?.data ?? err?.error?.data?.originalError?.data;

    if (!errorBytes) {
      throw new HttpError(400, `Cannot find error bytes`);
    }

    return decodeError(errorBytes, contractInterface);
  }
};
