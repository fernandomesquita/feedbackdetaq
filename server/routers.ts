import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { sdk } from "./_core/sdk";
import { z } from "zod";
import * as db from "./db";
import { feedbackRoleEnum, feedbackTypeEnum, sessionTypeEnum, reactionTypeEnum, avisoTypeEnum } from "../drizzle/schema";
import * as dbComments from "./db-comments";
import * as dbAvisos from "./db-avisos";
import * as dbPadronizacao from "./db-padronizacao";
import * as dbStatistics from "./db-statistics";
import * as dbQuesitos from "./db-quesitos";

export const appRouter = router({
  system: systemRouter,
  
  auth: router({
    me: publicProcedure.query(async ({ ctx }) => {
      if (!ctx.user) return null;
      
      // Buscar perfil do usuário
      const profile = await db.getUserProfile(ctx.user.id);
      
      return {
        ...ctx.user,
        feedbackRole: profile?.feedbackRole || null
      };
    }),
    loginLocal: publicProcedure
      .input(z.object({ email: z.string().email(), password: z.string() }))
      .mutation(async ({ ctx, input }) => {
        const { authenticateLocal } = await import('./local-auth');
        const user = await authenticateLocal(input.email, input.password);
        
        if (!user) {
          throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Email ou senha inválidos' });
        }

        // Atualizar lastSignedIn
        await db.upsertUser({
          openId: user.openId,
          name: user.name,
          email: user.email,
          loginMethod: 'local',
          lastSignedIn: new Date(),
        });

        // Criar sessão
        const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000;
        const sessionToken = await sdk.createSessionToken(user.openId, {
          name: user.name || "",
          expiresInMs: ONE_YEAR_MS,
        });
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

        return { success: true, user };
      }),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
    updateProfile: protectedProcedure
      .input(z.object({ feedbackRole: z.enum(["MASTER", "DIRETOR", "REVISOR", "TAQUIGRAFO"]) }))
      .mutation(async ({ ctx, input }) => {
        await db.updateUserProfile(ctx.user.id, { feedbackRole: input.feedbackRole });
        return { success: true };
      }),
  }),  // Placeholder para futuros routers de funcionalidades
  feedbacks: router({
    count: protectedProcedure.query(async ({ ctx }) => {
      const profile = await db.getUserProfile(ctx.user.id);
      if (!profile) return 0;
      
      const type = profile.feedbackRole === 'REVISOR' ? 'sent' : 'received';
      return await db.countFeedbacksByUser(ctx.user.id, type);
    }),
    create: protectedProcedure
      .input(z.object({
        type: z.enum(feedbackTypeEnum),
        title: z.string().optional(),
        content: z.string().optional(),
        imageUrl: z.string().optional(),
        rating: z.number().min(0).max(5).optional(),
        sessionType: z.enum(sessionTypeEnum).optional(),
        sessionNum: z.string().optional(),
        categories: z.array(z.string()).optional(),
        taquigId: z.number(),
        quesitos: z.array(z.object({
          quesitoId: z.number(),
          textoOriginal: z.string().min(1),
          textoRevisado: z.string().min(1),
          ordem: z.number(),
        })).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { createFeedback } = await import("./db-feedbacks");
        const { createFeedbackQuesitos } = await import("./db-feedback-quesitos");

        const { quesitos, ...feedbackData } = input;

        // Criar feedback
        const result = await createFeedback({
          ...feedbackData,
          content: feedbackData.content || "", // Default vazio se não vier
          revisorId: ctx.user.id,
        });

        // Criar quesitos se fornecidos
        if (quesitos && quesitos.length > 0) {
          await createFeedbackQuesitos(
            quesitos.map(q => ({
              feedbackId: result.insertId,
              quesitoId: q.quesitoId,
              textoOriginal: q.textoOriginal,
              textoRevisado: q.textoRevisado,
              ordem: q.ordem,
            }))
          );
        }

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
        const { getFeedbackQuesitos } = await import("./db-feedback-quesitos");
        const profile = await db.getUserProfile(ctx.user.id);

        let feedbacksList;
        if (profile?.feedbackRole === "TAQUIGRAFO") {
          feedbacksList = await getFeedbacksByTaquigrafo(ctx.user.id, input);
        } else if (profile?.feedbackRole === "REVISOR") {
          feedbacksList = await getFeedbacksByRevisor(ctx.user.id, input);
        } else {
          feedbacksList = await getAllFeedbacks(input);
        }

        // Adicionar quesitos a cada feedback
        const feedbacksWithQuesitos = await Promise.all(
          feedbacksList.map(async (item: any) => {
            const quesitos = await getFeedbackQuesitos(item.feedback.id);
            return {
              ...item,
              quesitos: quesitos.map((q: any) => ({
                id: q.id,
                quesitoTitulo: q.quesito?.titulo,
              })),
            };
          })
        );

        return feedbacksWithQuesitos;
      }),

    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const { getFeedbackById } = await import("./db-feedbacks");
        const { getFeedbackQuesitos } = await import("./db-feedback-quesitos");

        const feedback = await getFeedbackById(input.id);
        if (!feedback) return undefined;

        const quesitos = await getFeedbackQuesitos(input.id);

        return {
          ...feedback,
          quesitos,
        };
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
      .input(z.object({ role: z.enum(["MASTER", "DIRETOR", "REVISOR", "TAQUIGRAFO"]) }))
      .query(async ({ input }) => {
        const users = await db.getUserProfilesByRole(input.role);
        return users;
      }),

    list: protectedProcedure
      .query(async () => {
        const users = await db.getAllUsersWithProfiles();
        return users;
      }),

    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const user = await db.getUserWithProfile(input.id);
        return user;
      }),

    create: protectedProcedure
      .input(z.object({
        name: z.string().min(1),
        email: z.string().email(),
        feedbackRole: z.enum(["MASTER", "DIRETOR", "REVISOR", "TAQUIGRAFO"]),
      }))
      .mutation(async ({ input, ctx }) => {
        // Apenas MASTER pode criar usuários
        const currentUserProfile = await db.getUserProfile(ctx.user.id);
        if (currentUserProfile?.feedbackRole !== "MASTER") {
          throw new Error("Apenas Master pode criar usuários");
        }

        // Criar usuário com openId gerado (simulação - em produção viria do OAuth)
        const openId = `manual_${Date.now()}_${Math.random().toString(36).substring(7)}`;
        const userId = await db.createUserWithProfile({
          openId,
          name: input.name,
          email: input.email,
          feedbackRole: input.feedbackRole,
        });
        
        return { success: true, userId };
      }),

    updateProfile: protectedProcedure
      .input(z.object({
        userId: z.number(),
        feedbackRole: z.enum(["MASTER", "DIRETOR", "REVISOR", "TAQUIGRAFO"]),
      }))
      .mutation(async ({ input, ctx }) => {
        // Apenas MASTER pode alterar perfis
        const currentUserProfile = await db.getUserProfile(ctx.user.id);
        if (currentUserProfile?.feedbackRole !== "MASTER") {
          throw new Error("Apenas Master pode alterar perfis de usuários");
        }

        await db.updateUserProfile(input.userId, { feedbackRole: input.feedbackRole });
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        // Apenas MASTER pode deletar usuários
        const currentUserProfile = await db.getUserProfile(ctx.user.id);
        if (currentUserProfile?.feedbackRole !== "MASTER") {
          throw new Error("Apenas Master pode deletar usuários");
        }

        // Não pode deletar a si mesmo
        if (input.id === ctx.user.id) {
          throw new Error("Você não pode deletar seu próprio usuário");
        }

        await db.deleteUser(input.id);
        return { success: true };
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

    recordView: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        await dbAvisos.recordAvisoView(input.id, ctx.user.id);
        return { success: true };
      }),

    getViewStats: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const stats = await dbAvisos.getAvisoViewStats(input.id);
        return stats;
      }),

    listWithStats: protectedProcedure
      .query(async () => {
        const avisos = await dbAvisos.getActiveAvisosWithStats();
        return avisos;
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
          userId: ctx.user.id,
        });
        return { success: true };
      }),

    list: protectedProcedure
      .query(async () => {
        const terms = await dbPadronizacao.getAllPadronizacao();
        return terms;
      }),

    count: protectedProcedure
      .query(async () => {
        const terms = await dbPadronizacao.getAllPadronizacao();
        return terms.length;
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

    getUnreadCount: protectedProcedure
      .query(async ({ ctx }) => {
        const count = await dbPadronizacao.getUnreadPadronizacaoCount(ctx.user.id);
        return count;
      }),

    markAsRead: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        await dbPadronizacao.markPadronizacaoAsRead(input.id, ctx.user.id);
        return { success: true };
      }),

    markAllAsRead: protectedProcedure
      .mutation(async ({ ctx }) => {
        await dbPadronizacao.markAllPadronizacaoAsRead(ctx.user.id);
        return { success: true };
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

    quesitosGlobal: protectedProcedure
      .query(async () => {
        const { getGlobalQuesitoStats } = await import("./db-feedback-quesitos");
        const stats = await getGlobalQuesitoStats();
        return stats;
      }),
  }),

  quesitos: router({
    list: protectedProcedure
      .input(z.object({
        isActive: z.boolean().optional(),
      }).optional())
      .query(async ({ input }) => {
        const quesitos = await dbQuesitos.getQuesitos(input);
        return quesitos;
      }),

    count: protectedProcedure
      .input(z.object({
        isActive: z.boolean().optional(),
      }).optional())
      .query(async ({ input }) => {
        const count = await dbQuesitos.countQuesitos(input);
        return count;
      }),

    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const quesito = await dbQuesitos.getQuesitoById(input.id);
        return quesito;
      }),

    create: protectedProcedure
      .input(z.object({
        titulo: z.string().min(1),
        descricao: z.string().optional(),
        ordem: z.number().optional(),
        isActive: z.boolean().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        // Verificar se usuário é MASTER ou DIRETOR
        const profile = await db.getUserProfile(ctx.user.id);
        if (!profile || !["MASTER", "DIRETOR"].includes(profile.feedbackRole)) {
          throw new Error("Apenas Master ou Diretor podem criar quesitos");
        }

        const quesito = await dbQuesitos.createQuesito({
          ...input,
          userId: ctx.user.id,
        });
        return quesito;
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        titulo: z.string().optional(),
        descricao: z.string().optional(),
        ordem: z.number().optional(),
        isActive: z.boolean().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        // Verificar se usuário é MASTER ou DIRETOR
        const profile = await db.getUserProfile(ctx.user.id);
        if (!profile || !["MASTER", "DIRETOR"].includes(profile.feedbackRole)) {
          throw new Error("Apenas Master ou Diretor podem atualizar quesitos");
        }

        const { id, ...data } = input;
        const quesito = await dbQuesitos.updateQuesito(id, data);
        return quesito;
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        // Verificar se usuário é MASTER ou DIRETOR
        const profile = await db.getUserProfile(ctx.user.id);
        if (!profile || !["MASTER", "DIRETOR"].includes(profile.feedbackRole)) {
          throw new Error("Apenas Master ou Diretor podem deletar quesitos");
        }

        await dbQuesitos.deleteQuesito(input.id);
        return { success: true };
      }),

    reorder: protectedProcedure
      .input(z.object({
        updates: z.array(z.object({
          id: z.number(),
          ordem: z.number(),
        })),
      }))
      .mutation(async ({ input, ctx }) => {
        // Verificar se usuário é MASTER ou DIRETOR
        const profile = await db.getUserProfile(ctx.user.id);
        if (!profile || !["MASTER", "DIRETOR"].includes(profile.feedbackRole)) {
          throw new Error("Apenas Master ou Diretor podem reordenar quesitos");
        }

        await dbQuesitos.reorderQuesitos(input.updates);
        return { success: true };
      }),
  }),

});

export type AppRouter = typeof appRouter;
