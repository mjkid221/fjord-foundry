/**
 * `zMobileNumber` is a Zod validation schema for validating mobile phone numbers.
 *
 * @typedef {z.ZodString} zMobileNumber - A Zod validation schema for mobile phone numbers.
 * @throws {z.ZodError} Throws an error if the input is not a valid mobile phone number.
 *
 * @description
 * This schema uses the `isMobilePhone` function from the `validator` library to validate mobile phone numbers.
 * The `strictMode` option is set to `true`, which enforces strict validation of the phone number format.
 *
 * @see https://github.com/validatorjs/validator.js#validators
 *
 * @example
 *
 * const validMobileNumber = "+639123456789";
 * const invalidMobileNumber = "123456789";
 *
 * try {
 *  zMobileNumber.parse(validMobileNumber); // returns the validMobileNumber
 * } catch (error) {
 * console.error(error);
 * }
 *
 * try {
 * zMobileNumber.parse(invalidMobileNumber); // Throws a z.ZodError
 * } catch (error) {
 * console.error(error);
 * }
 *
 */
import isMobilePhone from "validator/lib/isMobilePhone";
import { z } from "zod";

export const zMobileNumber = z
  .string()
  .refine((value) => isMobilePhone(value, "any", { strictMode: true }), {
    message: "Invalid Mobile Number.",
  });
