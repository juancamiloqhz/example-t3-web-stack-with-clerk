import type { User } from "@clerk/nextjs/dist/api";
import { clerkClient } from "@clerk/nextjs/server";
import { TRPCError } from "@trpc/server";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
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

    // console.log(users);

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
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const authorId = ctx.userId;

      // Create a new ratelimiter, that allows 3 requests per 1 minute
      const ratelimit = new Ratelimit({
        redis: Redis.fromEnv(),
        limiter: Ratelimit.slidingWindow(3, "1 m"),
        analytics: true,
        /**
         * Optional prefix for the keys used in redis. This is useful if you want to share a redis
         * instance with other applications and want to avoid key collisions. The default prefix is
         * "@upstash/ratelimit"
         */
        // prefix: "@upstash/ratelimit",
      });
      const { success } = await ratelimit.limit(authorId);
      if (!success) {
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
          message: "You are posting too fast",
        });
      }
      const plan = await ctx.prisma.plan.create({
        data: {
          content: input.content,
          authorId,
        },
      });
      return plan;
    }),
});
