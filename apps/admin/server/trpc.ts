import { initTRPC } from "@trpc/server";
import SuperJSON from "superjson";
import { TRPCPanelMeta } from "trpc-panel";

// Avoid exporting the entire t-object
// since it's not very descriptive.
// For instance, the use of a t variable
// is common in i18n libraries.
const t = initTRPC.meta<TRPCPanelMeta>().create({
  transformer: SuperJSON,
});
// Base router and procedure helpers
export const { router } = t;
export const publicProcedure = t.procedure;
