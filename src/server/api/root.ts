import { createTRPCRouter } from "~/server/api/trpc";
import { planRouter } from "./routers/plan";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  plans: planRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
