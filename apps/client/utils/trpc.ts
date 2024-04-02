import { getBaseUrl } from "@scope/lib/utils";
import { httpBatchLink } from "@trpc/client";
import { createTRPCNext } from "@trpc/next";
import SuperJSON from "superjson";

import type { AppRouter } from "@/server/router/_app";

export const trpc = createTRPCNext<AppRouter>({
  config(/* opts */) {
    return {
      transformer: SuperJSON,
      links: [
        httpBatchLink({
          url: `${getBaseUrl()}/api/trpc`,
        }),
      ],
    };
  },
  overrides: {
    useMutation: {
      /**
       * This function is called whenever a `.useMutation` succeeds
       */
      async onSuccess(opts) {
        /**
         * @note that order here matters:
         * The order here allows route changes in `onSuccess` without
         * having a flash of content change whilst redirecting.
         */
        // Calls the `onSuccess` defined in the `useQuery()`-options:
        await opts.originalFn();
        // Invalidate all queries in the react-query cache:
        await opts.queryClient.invalidateQueries();
      },
    },
  },
});
