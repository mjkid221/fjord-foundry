import { z } from "zod";

export const exampleRequestSchema = z.object({
  /**
   * The first number to add
   */
  firstNumber: z.coerce.number(),
  /**
   * The second number to add
   */
  secondNumber: z.coerce.number(),
});

export type ExampleRequest = z.infer<typeof exampleRequestSchema>;

export interface ExampleResponse {
  /**
   * The result of adding the two numbers together
   */
  result: number;
}
