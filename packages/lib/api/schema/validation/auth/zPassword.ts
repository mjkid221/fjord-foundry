/**
 * `zPassword` is a password validation schema using the zod library.
 * It validates that the password is a string and checks the password's length and strength.
 *
 * The length of the password should be between 8 and 128 characters.
 * The password strength is checked using the "isStrongPassword" function from the "validator" library,
 * and requires at least one lowercase letter, one uppercase letter, and one number.
 *
 * @typedef {z.ZodString} zPassword - a zod validation schema for passwords.
 * @throws {z.ZodError} Throws an error if the password is not valid, detailing the specific issue.
 *
 * @example
 * const validPassword = 'Password123';
 * const invalidPassword = 'pass';
 *
 * try {
 *   zPassword.parse(validPassword); // returns the validPassword
 * } catch (error) {
 *   console.error(error);
 * }
 *
 * try {
 *   zPassword.parse(invalidPassword); // Throws a z.ZodError
 * } catch (error) {
 *   console.error(error);
 * }
 */
import isStrongPassword from "validator/lib/isStrongPassword";
import { z } from "zod";

/**
 * Password validation schema.
 * This should be used for all passwords sent to the backend.
 */
export const zPassword = z
  .string()
  .min(8, {
    message: "Your password should be at least 8 characters in length",
  })
  .max(128, {
    message: "Your password must not be longer than 128 characters in length",
  })
  .refine(
    (password) =>
      isStrongPassword(password, {
        minLength: 8,
        minLowercase: 1,
        minUppercase: 1,
        minNumbers: 1,
        minSymbols: 0,
        returnScore: false,
      }),
    {
      message:
        "Your password must contain at least 1 upper case, 1 lower case and 1 number",
    }
  );
