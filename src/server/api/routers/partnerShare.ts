import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";

export const partnerShareRouter = createTRPCRouter({
  get: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.partnerShare.findMany({
      where: {
        year: new Date().getFullYear(),
        userId: ctx.session.user.id,
      },
      include: {
        user: true,
      },
    });
  }),

  getAll: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.partnerShare.findMany({
      where: {
        year: new Date().getFullYear(),
      },
      include: {
        user: true,
      },
      orderBy: [
        { year: "desc" },
        { user: { name: "asc" } },
      ],
    });
  }),

  update: protectedProcedure
    .input(z.object({
      userId: z.string(),
      year: z.number(),
      sharePercentage: z.number().min(0).max(100),
    }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.partnerShare.update({
        where: {
          userId_year: {
            userId: input.userId,
            year: input.year,
          },
        },
        data: {
          sharePercentage: input.sharePercentage,
        },
      });
    }),

  addMissingUsers: protectedProcedure
    .mutation(async ({ ctx }) => {
      // Get all users
      const users = await ctx.db.user.findMany();
      const currentYear = new Date().getFullYear();

      // Get existing partner shares for current year
      const existingShares = await ctx.db.partnerShare.findMany({
        where: { year: currentYear },
      });

      // Find users without shares
      const existingUserIds = new Set(existingShares.map(share => share.userId));
      const usersWithoutShares = users.filter(user => !existingUserIds.has(user.id));

      // Create shares for users without them
      if (usersWithoutShares.length > 0) {
        await ctx.db.partnerShare.createMany({
          data: usersWithoutShares.map(user => ({
            userId: user.id,
            year: currentYear,
            sharePercentage: 0.7,
          })),
        });
      }

      return { addedCount: usersWithoutShares.length };
    }),
});