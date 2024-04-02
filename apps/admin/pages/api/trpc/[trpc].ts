import { apiHandler } from "@scope/lib/api";
import { createNextApiHandler } from "@trpc/server/adapters/next";

import { appRouter } from "@/server/router/_app";

export default apiHandler().all(
  createNextApiHandler({
    router: appRouter,
    createContext: () => ({}),
  })
);
