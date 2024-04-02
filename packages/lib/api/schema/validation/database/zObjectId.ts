/**
 * `zObjectId` is a validation schema using the zod library for validating MongoDB ObjectIds.
 * It ensures the id is a string and validates it using "Types.ObjectId.isValid" function from the "mongoose" library.
 * @typedef {z.ZodString} zObjectId - a zod validation schema for MongoDB ObjectIds.
 * @throws {z.ZodError} Throws an error if the input is not a valid ObjectId.
 * @example
 * const validId = '60e3f9f4cb9f38259c2134ed';
 * const invalidId = '123abc';
 *
 * try {
 *   zObjectId.parse(validId); // returns the validId
 * } catch (error) {
 *   console.error(error);
 * }
 *
 * try {
 *   zObjectId.parse(invalidId); // Throws a z.ZodError
 * } catch (error) {
 *   console.error(error);
 * }
 */
import { Types } from "mongoose";
import { z } from "zod";

export const zObjectId = z
  .string()
  .refine(
    (idValue: string) => Types.ObjectId.isValid(idValue),
    "Invalid document ID"
  );
