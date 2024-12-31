import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";

export const userRouter = createTRPCRouter({
  getProfile: protectedProcedure.query(async ({ ctx }) => {
    const user = await ctx.db.user.findUnique({
      where: { id: ctx.session.user.id },
      include: {
        vehiclesOwned: true,
      },
    });
    return user;
  }),

  addVehicleToUser: protectedProcedure
    .input(z.object({ vehicleId: z.string(), ownerId: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.vehicle.update({
        where: { id: input.vehicleId },
        data: {
          ownerId: input.ownerId ?? ctx.session.user.id,
        },
      });
    }),
});
