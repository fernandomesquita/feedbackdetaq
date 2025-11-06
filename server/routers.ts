import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import { feedbackRoleEnum, feedbackTypeEnum, sessionTypeEnum, reactionTypeEnum, avisoTypeEnum } from "../drizzle/schema";
import * as dbComments from "./db-comments";
import * as dbAvisos from "./db-avisos";
import * as dbPadronizacao from "./db-padronizacao";
import * as dbStatistics from "./db-statistics";

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
    create: protectedProcedure
      .input(z.object({
        feedbackId: z.number(),
        content: z.string().min(1),
      }))
      .mutation(async ({ input, ctx }) => {
        await dbComments.createComment({
          feedbackId: input.feedbackId,
          userId: ctx.user.id,
          content: input.content,
        });
        return { success: true };
      }),

    listByFeedback: protectedProcedure
      .input(z.object({ feedbackId: z.number() }))
      .query(async ({ input }) => {
        const comments = await dbComments.getCommentsByFeedback(input.feedbackId);
        return comments;
      }),

    delete: protectedProcedure
      .input(z.object({ commentId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        await dbComments.deleteComment(input.commentId, ctx.user.id);
        return { success: true };
      }),
  }),

  reactions: router({
    toggle: protectedProcedure
      .input(z.object({
        feedbackId: z.number(),
        type: z.enum(reactionTypeEnum),
      }))
      .mutation(async ({ input, ctx }) => {
        const result = await dbComments.createReaction({
          feedbackId: input.feedbackId,
          userId: ctx.user.id,
          type: input.type,
        });
        return result;
      }),

    listByFeedback: protectedProcedure
      .input(z.object({ feedbackId: z.number() }))
      .query(async ({ input }) => {
        const reactions = await dbComments.getReactionsByFeedback(input.feedbackId);
        const counts = await dbComments.getReactionCounts(input.feedbackId);
        return { reactions, counts };
      }),
  }),

  avisos: router({
    create: protectedProcedure
      .input(z.object({
        title: z.string().min(1),
        content: z.string().min(1),
        type: z.enum(avisoTypeEnum),
        targets: z.array(z.string()).optional(),
        publishAt: z.date().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        await dbAvisos.createAviso({
          ...input,
          targets: input.targets || [],
          userId: ctx.user.id,
        });
        return { success: true };
      }),

    list: protectedProcedure
      .query(async ({ ctx }) => {
        const avisos = await dbAvisos.getAvisosWithReadStatus(ctx.user.id);
        return avisos;
      }),

    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const aviso = await dbAvisos.getAvisoById(input.id);
        return aviso;
      }),

    markAsRead: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        await dbAvisos.markAvisoAsRead(input.id, ctx.user.id);
        return { success: true };
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        title: z.string().optional(),
        content: z.string().optional(),
        type: z.enum(avisoTypeEnum).optional(),
        isActive: z.boolean().optional(),
        targets: z.array(z.string()).optional(),
        publishAt: z.date().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await dbAvisos.updateAviso(id, data);
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await dbAvisos.deleteAviso(input.id);
        return { success: true };
      }),

    getUnreadCount: protectedProcedure
      .query(async ({ ctx }) => {
        const count = await dbAvisos.getUnreadAvisosCount(ctx.user.id);
        return count;
      }),
  }),

  padronizacao: router({
    create: protectedProcedure
      .input(z.object({
        term: z.string().min(1),
        definition: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        await dbPadronizacao.createPadronizacao({
          ...input,
          createdBy: ctx.user.id,
        });
        return { success: true };
      }),

    list: protectedProcedure
      .query(async () => {
        const terms = await dbPadronizacao.getAllPadronizacao();
        return terms;
      }),

    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const term = await dbPadronizacao.getPadronizacaoById(input.id);
        return term;
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        term: z.string().optional(),
        definition: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await dbPadronizacao.updatePadronizacao(id, data);
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await dbPadronizacao.deletePadronizacao(input.id);
        return { success: true };
      }),

    search: protectedProcedure
      .input(z.object({ query: z.string() }))
      .query(async ({ input }) => {
        const results = await dbPadronizacao.searchPadronizacao(input.query);
        return results;
      }),
  }),

  statistics: router({
    general: protectedProcedure
      .query(async () => {
        const stats = await dbStatistics.getGeneralStats();
        return stats;
      }),

    feedbacks: protectedProcedure
      .query(async () => {
        const stats = await dbStatistics.getFeedbackStats();
        return stats;
      }),

    byTaquigrafo: protectedProcedure
      .input(z.object({ taquigId: z.number() }))
      .query(async ({ input }) => {
        const stats = await dbStatistics.getStatsByTaquigrafo(input.taquigId);
        return stats;
      }),

    byRevisor: protectedProcedure
      .input(z.object({ revisorId: z.number() }))
      .query(async ({ input }) => {
        const stats = await dbStatistics.getStatsByRevisor(input.revisorId);
        return stats;
      }),

    topTaquigrafos: protectedProcedure
      .input(z.object({ limit: z.number().optional() }))
      .query(async ({ input }) => {
        const stats = await dbStatistics.getTopTaquigrafos(input.limit);
        return stats;
      }),

    topRevisores: protectedProcedure
      .input(z.object({ limit: z.number().optional() }))
      .query(async ({ input }) => {
        const stats = await dbStatistics.getTopRevisores(input.limit);
        return stats;
      }),

    reactions: protectedProcedure
      .query(async () => {
        const stats = await dbStatistics.getReactionStats();
        return stats;
      }),

    averageRating: protectedProcedure
      .query(async () => {
        const stats = await dbStatistics.getAverageRating();
        return stats;
      }),
  }),


});

export type AppRouter = typeof appRouter;
