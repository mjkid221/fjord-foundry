import { NextApiRequest, NextApiResponse } from "next";
import { NextHandler } from "next-connect";

import { Unauthorized } from "../api";
import { NEXT_SERVER_ENV } from "../constants";

const { THIRD_PARTY_SECRET_KEY } = NEXT_SERVER_ENV();

/**
 * Used to verify third party services accessing the API
 * The bearer token `THIRD_PARTY_SECRET_KEY` should be in the auth header to access these routes
 * and in the environment variables for the project as `THIRD_PARTY_SECRET_KEY`
 *
 * A new secret can be generated through a terminal using `openssl rand -hex 32`
 */
export const secretKeyAuth = (
  req: NextApiRequest,
  res: NextApiResponse,
  next: NextHandler
) => {
  if (!THIRD_PARTY_SECRET_KEY) {
    throw Error("Missing THIRD_PARTY_SECRET_KEY environment variable");
  }

  const bearerToken = req.headers.authorization;
  if (bearerToken !== `Bearer ${THIRD_PARTY_SECRET_KEY}`) {
    throw Unauthorized;
  }

  next();
};
