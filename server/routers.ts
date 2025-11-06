import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import { feedbackRoleEnum, feedbackTypeEnum, sessionTypeEnum } from "../drizzle/schema";

export const appRouter = router({
  system: systemRouter,
  
  auth: router({
    me: publicProcedure.query(async ({ ctx }) => {
      if (!ctx.user) return null;
      
      // Buscar perfil do usuário
      const profile = await db.getUserProfile(ctx.user.id);
      
      return {
        ...ctx.user,
        feedbackRole: profile?.feedbackRole || null,
      };
    }),
    
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),

    updateProfile: protectedProcedure
      .input(z.object({
        feedbackRole: z.enum(feedbackRoleEnum),
      }))
      .mutation(async ({ ctx, input }) => {
        await db.upsertUserProfile({
          userId: ctx.user.id,
          feedbackRole: input.feedbackRole,
        });

        return { success: true };
      }),
  }),

  // Placeholder para futuros routers de funcionalidades
  feedbacks: router({
    create: protectedProcedure
      .input(z.object({
        type: z.enum(feedbackTypeEnum),
        title: z.string().optional(),
        content: z.string().min(1),
        imageUrl: z.string().optional(),
        rating: z.number().min(0).max(5).optional(),
        sessionType: z.enum(sessionTypeEnum).optional(),
        sessionNum: z.string().optional(),
        categories: z.array(z.string()).optional(),
        taquigId: z.number(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { createFeedback } = await import("./db-feedbacks");
        const result = await createFeedback({
          ...input,
          revisorId: ctx.user.id,
        });
        return result;
      }),

    list: protectedProcedure
      .input(z.object({
        type: z.enum(feedbackTypeEnum).optional(),
        isRead: z.boolean().optional(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
        search: z.string().optional(),
      }).optional())
      .query(async ({ ctx, input }) => {
        const { getFeedbacksByTaquigrafo, getFeedbacksByRevisor, getAllFeedbacks } = await import("./db-feedbacks");
        const profile = await db.getUserProfile(ctx.user.id);
        
        if (profile?.feedbackRole === "TAQUIGRAFO") {
          return getFeedbacksByTaquigrafo(ctx.user.id, input);
        } else if (profile?.feedbackRole === "REVISOR") {
          return getFeedbacksByRevisor(ctx.user.id, input);
        } else {
          return getAllFeedbacks(input);
        }
      }),

    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const { getFeedbackById } = await import("./db-feedbacks");
        return getFeedbackById(input.id);
      }),

    markAsRead: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const { markFeedbackAsRead } = await import("./db-feedbacks");
        await markFeedbackAsRead(input.id);
        return { success: true };
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        data: z.object({
          title: z.string().optional(),
          content: z.string().optional(),
          rating: z.number().min(0).max(5).optional(),
          categories: z.array(z.string()).optional(),
        }),
      }))
      .mutation(async ({ input }) => {
        const { updateFeedback } = await import("./db-feedbacks");
        await updateFeedback(input.id, input.data);
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const { deleteFeedback } = await import("./db-feedbacks");
        await deleteFeedback(input.id);
        return { success: true };
      }),
  }),

  users: router({
    listByRole: protectedProcedure
      .input(z.object({ role: z.enum(feedbackRoleEnum) }))
      .query(async ({ input }) => {
        const profiles = await db.getUserProfilesByRole(input.role);
        return profiles;
      }),
  }),

  comments: router({
    // TODO: implementar rotas de comentários
  }),

  reactions: router({
    // TODO: implementar rotas de reações
  }),

  avisos: router({
    // TODO: implementar rotas de avisos
  }),

  padronizacao: router({
    // TODO: implementar rotas de padronização
  }),

  statistics: router({
    // TODO: implementar rotas de estatísticas
  }),


});

export type AppRouter = typeof appRouter;
