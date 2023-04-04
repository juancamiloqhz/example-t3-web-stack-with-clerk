import type { User } from "@clerk/nextjs/dist/api";
import { clerkClient } from "@clerk/nextjs/server";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

import {
  createTRPCRouter,
  privateProcedure,
  publicProcedure,
} from "~/server/api/trpc";

const filterUserForClient = (user: User) => {
  return {
    id: user.id,
    username: user.username,
    profileImageUrl: user.profileImageUrl,
  };
};

export const planRouter = createTRPCRouter({
  getAll: publicProcedure.query(async ({ ctx }) => {
    const plans = await ctx.prisma.plan.findMany({
      take: 100,
      orderBy: {
        createdAt: "desc",
      },
    });

    const users = (
      await clerkClient.users.getUserList({
        limit: 100,
        userId: plans.map((plan) => plan.authorId),
      })
    ).map(filterUserForClient);

    console.log(users);

    return plans.map((plan) => {
      const author = users.find((user) => user.id === plan.authorId);
      if (!author)
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Author for plan not found",
        });

      return {
        plan,
        author,
      };
    });
  }),
  create: privateProcedure
    .input(
      z.object({
        content: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const authorId = ctx.userId;
      const plan = await ctx.prisma.plan.create({
        data: {
          content: input.content,
          authorId,
        },
      });
      return plan;
    }),
});
