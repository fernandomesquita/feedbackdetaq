import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import { feedbackRoleEnum } from "../drizzle/schema";

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
    // TODO: implementar rotas de feedbacks
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

  users: router({
    // TODO: implementar rotas de gestão de usuários
  }),
});

export type AppRouter = typeof appRouter;
