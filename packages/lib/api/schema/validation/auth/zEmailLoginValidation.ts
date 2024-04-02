/**
 * `zEmailLoginValidation` is a Zod validation schema for validating email login credentials.
 *
 * @typedef {Object} zEmailLoginValidation
 * @property {z.ZodString} emailAddress - A Zod validation schema for email addresses.
 * @property {z.ZodString} password - A Zod validation schema for passwords.
 * * @example
 * const validCredentials = {
 *   emailAddress: 'test@example.com',
 *   password: 'password123',
 * };
 *
 * const invalidCredentials = {
 *   emailAddress: 'invalid-email',
 *   password: 'short',
 * };
 *
 * try {
 *   zEmailLoginValidation.parse(validCredentials); // returns validCredentials
 * } catch (error) {
 *   console.error(error);
 * }
 *
 * try {
 *   zEmailLoginValidation.parse(invalidCredentials); // throws a ZodError
 * } catch (error) {
 *   console.error(error);
 * }
 */
import { z } from "zod";

import { zEmail } from "./zEmail";
import { zPassword } from "./zPassword";

export const zEmailLoginValidation = z.object({
  emailAddress: zEmail,
  password: zPassword,
});
