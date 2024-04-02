import { sampleRouter } from "./sample";
import { sessionRouter } from "./session";

import { router } from "@/server/trpc";

export const appRouter = router({
  sample: sampleRouter,
  session: sessionRouter,
});

export type AppRouter = typeof appRouter;
