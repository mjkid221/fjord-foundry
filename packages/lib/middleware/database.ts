import { NextApiRequest, NextApiResponse } from "next/types";
import { NextHandler } from "next-connect";

import { connect } from "../database/utils/connect";

/**
 * Handle database connection to Mongo DB Cluster
 */
export const database = async (
  req: NextApiRequest,
  res: NextApiResponse,
  next: NextHandler
) => {
  await connect();
  next();
};
