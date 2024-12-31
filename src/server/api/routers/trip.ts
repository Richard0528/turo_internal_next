import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";

export const tripRouter = createTRPCRouter({
  getUserTrips: protectedProcedure
    .input(
      z.object({
        year: z.number(),
        month: z.number().optional(),
        ownerId: z.string().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const vehicles = await ctx.db.vehicle.findMany({
        where: {
          ownerId: input.ownerId || ctx.session.user.id,
        },
        include: {
          trips: {
            where: {
              AND: [
                { tripEnd: { gte: new Date(input.year, 0, 1) } },
                { tripEnd: { lt: new Date(input.year + 1, 0, 1) } },
                input.month !== undefined
                  ? {
                    tripEnd: {
                        gte: new Date(input.year, input.month - 1, 1),
                        lt: new Date(input.year, input.month, 1),
                      },
                    }
                  : {},
              ],
            },
            orderBy: {
              tripEnd: "asc"
            }
          },
        },
      });

      return vehicles;
    }),
});