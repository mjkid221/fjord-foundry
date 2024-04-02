import { MockMemoryServer } from "../mocks";

/**
 * Runs before all of the test to start the in-memory database and connect to it
 * (this runs ONCE before all tests, not once before each test)
 */
before(async () => {
  await MockMemoryServer.start();
  await MockMemoryServer.connect();
});

/**
 * Runs after all of the tests to safely close the in-memory database connection
 * (this runs ONCE after all tests, not once after each test)
 */
after(async () => {
  await MockMemoryServer.stop();
});
