import { exampleRequestSchema, ExampleResponse } from "@scope/lib";

import { protectedProcedure, publicProcedure, router } from "@/server/trpc";

/**
 * This is a test sleep function to simulate the API taking some time to respond.
 * Without this, the API would respond instantly and you wouldn't be able to see the loading state.
 *
 * @param ms The number of milliseconds to sleep for
 */ // eslint-disable-next-line no-promise-executor-return -- Sleep for demo purposes
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const sampleRouter = router({
  exampleGet: publicProcedure
    .input(exampleRequestSchema)
    .query(async ({ input }): Promise<ExampleResponse> => {
      const { firstNumber, secondNumber } = input;

      await sleep(1000);

      const result = firstNumber + secondNumber;

      return { result };
    }),

  examplePost: publicProcedure
    .input(exampleRequestSchema)
    .mutation(async ({ input }): Promise<ExampleResponse> => {
      const { firstNumber, secondNumber } = input;

      await sleep(1000);

      const result = firstNumber + secondNumber;

      return { result };
    }),

  protectedExampleGet: protectedProcedure
    .input(exampleRequestSchema)
    .query(async ({ input }): Promise<ExampleResponse> => {
      const { firstNumber, secondNumber } = input;

      await sleep(1000);

      const result = firstNumber + secondNumber;

      return { result };
    }),
});
