import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";

export const planRouter = createTRPCRouter({
  getAll: publicProcedure.query(({ ctx }) => {
    return ctx.prisma.plan.findMany();
  }),
});
