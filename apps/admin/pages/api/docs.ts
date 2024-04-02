import { getBaseUrl } from "@scope/lib/utils";
import type { NextApiRequest, NextApiResponse } from "next";
import { renderTrpcPanel } from "trpc-panel";

import { appRouter } from "@/server/router/_app";

export default async function handler(_: NextApiRequest, res: NextApiResponse) {
  if (process.env.NODE_ENV !== "production") {
    res.status(200).send(
      renderTrpcPanel(appRouter, {
        url: `${getBaseUrl()}/api/trpc`,
        transformer: "superjson",
      })
    );
  } else {
    res.status(404).send("Not found");
  }
}
