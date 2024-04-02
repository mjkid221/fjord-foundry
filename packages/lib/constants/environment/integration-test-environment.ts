/**
 * This is a hardcoded object that will be returned when the application is in integration test mode.
 * This is to prevent runnings test against a real deployed environment.
 */
export const integrationTestEnvironment: Record<string, string> = {
  /**
   * mongo-db-memory-server will generate its own URI for the in-memory database so this is not needed
   */
  MONGODB_URI: "test-mongo-db-uri",
  INTEGRATION_TEST_MODE: "true",
  THIRDWEB_AUTH_PRIVATE_KEY:
    "d68c113c13c731e5fc34e1a7d0ea087895c2926bea29d95e8d2f09ccc086d34c",
};
