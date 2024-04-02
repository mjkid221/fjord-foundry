import { NextApiRequest } from "next";

import { InternalServerError } from "./errors";

/**
 * Throw a formatted error to the console, extracting useful information
 *
 * @param req The Next API Request
 * @param err The error object
 * @param status (optional) The status code to throw
 */
export const logError = (
  req: NextApiRequest,
  err: any,
  status?: string | number
) => {
  if (process.env.INTEGRATION_TEST_MODE) {
    // Suppress these logs in integration test mode
    // We test errors cases and these will fill up the console even if the tests are passing correctly
    return;
  }

  const formattedError = {
    timestamp: new Date().toISOString(),
    call: req.url,
    method: req.method,
    query: req.query,
    body: JSON.stringify(req.body, null, 2),
    status:
      err.status ?? err.statuscode ?? status ?? InternalServerError.statusCode,
    message: err.message ?? err,
    rawError: JSON.stringify(err, null, 2),
  };

  // eslint-disable-next-line no-console -- ERROR LOGGING
  console.error("Next.js API Error", formattedError);
};
