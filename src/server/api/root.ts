import {  fileRouter } from "@/server/api/routers/file";
import { createCallerFactory, createTRPCRouter } from "@/server/api/trpc";
import { userRouter } from "./routers/user";
import { vehicleRouter } from "./routers/vehicle";
import { tripRouter } from "./routers/trip";
import { partnerShareRouter } from "./routers/partnerShare";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  file: fileRouter,
  user: userRouter,
  vehicle: vehicleRouter,
  trip: tripRouter,
  partnerShare: partnerShareRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;

/**
 * Create a server-side caller for the tRPC API.
 * @example
 * const trpc = createCaller(createContext);
 * const res = await trpc.post.all();
 *       ^? Post[]
 */
export const createCaller = createCallerFactory(appRouter);
