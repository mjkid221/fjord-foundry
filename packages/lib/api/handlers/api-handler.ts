import { NextApiRequest, NextApiResponse } from "next/types";
import nc from "next-connect";
import { ZodError } from "zod";

import { InternalServerError, logError } from "../errors";

/**
 * Generic next API handler with error catching
 */
export const apiHandler = () =>
  nc<NextApiRequest, NextApiResponse>({
    onError: async (err, req, res) => {
      if (err instanceof ZodError) {
        logError(req, err, "400 (Zod Error)");
        res.status(400).json({ message: err.message });
        return;
      }

      logError(req, err);
      res
        .status(err.status ?? InternalServerError.statusCode)
        .end(
          err.status !== 500
            ? err.message ?? err.response.body ?? InternalServerError.message
            : InternalServerError.message
        );
    },
    onNoMatch: (req, res) => {
      res.status(404).end("Not Found");
    },
  });
