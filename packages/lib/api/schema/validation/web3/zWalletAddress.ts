/**
 * `zWalletAddress` is a validation schema using zod library for validating Ethereum addresses.
 * It ensures the address is a string and validates it using "isEthereumAddress" function from the "validator" library.
 * @typedef {z.ZodString} walletAddress - a zod validation schema for Ethereum wallet addresses.
 * @throws {z.ZodError} Throws an error if the input is not a valid Ethereum address.
 * @example
 * const validAddress = '0x5375f4A6EDea8E06F6b402506Df8f6355A8341f6';
 * const invalidAddress = '123abc';
 *
 * try {
 *   zWalletAddress.parse(validAddress); // returns the validAddress
 * } catch (error) {
 *   console.error(error);
 * }
 *
 * try {
 *   zWalletAddress.parse(invalidAddress); // Throws a z.ZodError
 * } catch (error) {
 *   console.error(error);
 * }
 *
 */
import isEthereumAddress from "validator/lib/isEthereumAddress";
import { z } from "zod";

export const zWalletAddress = z
  .string()
  .refine(isEthereumAddress, { message: "Invalid Wallet Address." });
