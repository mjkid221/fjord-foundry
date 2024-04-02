/**
 * `zCurrency` is a Zod validation schema for validating currency amounts.
 *
 * @typedef {z.ZodString} zCurrency - A Zod validation schema for currency amounts.
 * @throws {z.ZodError} Throws an error if the input is not a valid currency amount.
 *
 * @description
 * This schema uses the `isCurrency` function from the `validator` library to validate currency amounts.
 * The `digits_after_decimal` option is set to `[2]`, which enforces that the currency amount has exactly two digits after the decimal point.
 *
 * @see https://github.com/validatorjs/validator.js#validators
 */
import isCurrency from "validator/lib/isCurrency";
import { z } from "zod";

export const zCurrency = z.string().refine(
  (value) =>
    isCurrency(value, {
      digits_after_decimal: [2],
    }),
  { message: "Invalid Currency Amount." }
);
