import { Session, UnauthorizedError } from "@scope/lib";

import { protectedProcedure, router } from "@/server/trpc";

export const sessionRouter = router({
  userSession: protectedProcedure.query(async ({ ctx }): Promise<Session> => {
    const { session } = ctx;

    if (!session) throw UnauthorizedError;

    return session;
  }),
});
