import { sampleRouter } from "./sample";

import { router } from "@/server/trpc";

export const appRouter = router({
  sample: sampleRouter,
});
// export type definition of API
export type AppRouter = typeof appRouter;
