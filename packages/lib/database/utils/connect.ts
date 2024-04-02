import mongoose from "mongoose";

import { DatabaseURIMissing } from "../../api";
import { NEXT_SERVER_ENV } from "../../constants";

/**
 * Connect to a specific MongoDB instance
 * We will use the `MONGODB_URI` environment variable to connect to the database.
 * If we are in integration test mode then we will connect to the mongo-db-memory-server.
 * @returns The mongoose connection
 */
export const connect = async () => {
  const { MONGODB_URI, INTEGRATION_TEST_MODE } = NEXT_SERVER_ENV();

  if (INTEGRATION_TEST_MODE) {
    // We will connect to the mongo-db-memory-server in the integration tests. This is handled automatically
    return undefined;
  }

  const uri = MONGODB_URI as string;

  if (!uri) {
    throw DatabaseURIMissing;
  }

  return mongoose.connect(uri);
};
