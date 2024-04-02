/**
 * `zEmail` is an email address validation schema using the zod library.
 * It validates that the email is a string, is in the correct format, and is lowercased.
 *
 * @typedef {z.ZodString} zEmail - a zod validation schema for email addresses.
 * @throws {z.ZodError} Throws an error if the email is not valid, detailing the specific issue.
 *
 * @example
 * const validEmail = 'TestUser@example.com';
 * const invalidEmail = 'example';
 *
 * try {
 *   zEmail.parse(validEmail); // returns the lowercased validEmail: 'testuser@example.com'
 * } catch (error) {
 *   console.error(error);
 * }
 *
 * try {
 *   zEmail.parse(invalidEmail); // Throws a z.ZodError
 * } catch (error) {
 *   console.error(error);
 * }
 *
 * @example
 * const emailSignUpValidation = z.object({
 *   emailAddress: zEmail,
 *   password: zPassword,
 *   passwordConfirmation: zPassword,
 * });
 */
import { z } from "zod";

/**
 * Email address validation schema.
 * This should be used for all email addresses sent to the backend.
 */
export const zEmail = z
  .string({
    required_error: "Email address required",
    invalid_type_error: "Invalid email address",
  })
  .email("Invalid email address")
  .toLowerCase();
