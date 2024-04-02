import { AuthContext, UnauthorizedError } from "@scope/lib";
import { initTRPC } from "@trpc/server";
import SuperJSON from "superjson";

// Avoid exporting the entire t-object
// since it's not very descriptive.
// For instance, the use of a t variable
// is common in i18n libraries.
const t = initTRPC.context<AuthContext>().create({
  transformer: SuperJSON,
});

const requireAuth = t.middleware((opts) => {
  const { ctx } = opts;
  if (!ctx.session) throw UnauthorizedError();

  return opts.next(opts);
});

export const { router, middleware } = t;
export const publicProcedure = t.procedure;
export const protectedProcedure = t.procedure.use(requireAuth);
