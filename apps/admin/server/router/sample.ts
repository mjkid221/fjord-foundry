import { z } from "zod";

import { publicProcedure, router } from "@/server/trpc";

export const sampleRouter = router({
  hello: publicProcedure
    .meta({
      description: `A simple hello world procedure`,
    })
    .input(
      z.object({
        text: z.string(),
      })
    )
    .query((opts) => ({
      greeting: `hello ${opts.input.text}`,
    })),
});
