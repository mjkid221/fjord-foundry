import { apiHandler } from "@scope/lib";

export default apiHandler()
  /**
   * This is an example of a request that should throw an error to Sentry
   *
   * @route GET /api/v1/example/sentry
   */
  .get(async () => {
    throw new Error("This is an example error");
  });
