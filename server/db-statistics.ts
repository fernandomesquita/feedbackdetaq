import { eq, and, gte, lte, sql, count, desc } from "drizzle-orm";
import { getDb } from "./db";
import { feedbacks, comments, reactions, avisos, padronizacao, users, userProfiles } from "../drizzle/schema";

/**
 * ESTATÍSTICAS GERAIS
 */

export async function getGeneralStats() {
  const db = await getDb();
  if (!db) return null;

  const [feedbackCount] = await db.select({ count: count() }).from(feedbacks);
  const [commentCount] = await db.select({ count: count() }).from(comments);
  const [reactionCount] = await db.select({ count: count() }).from(reactions);
  const [avisoCount] = await db.select({ count: count() }).from(avisos);
  const [termCount] = await db.select({ count: count() }).from(padronizacao);
  const [userCount] = await db.select({ count: count() }).from(users);

  return {
    totalFeedbacks: feedbackCount.count,
    totalComments: commentCount.count,
    totalReactions: reactionCount.count,
    totalAvisos: avisoCount.count,
    totalTerms: termCount.count,
    totalUsers: userCount.count,
  };
}

/**
 * ESTATÍSTICAS DE FEEDBACKS
 */

export async function getFeedbackStats() {
  const db = await getDb();
  if (!db) return null;

  try {
    // Total por tipo
    const byType = await db
      .select({
        type: feedbacks.type,
        count: sql<number>`COUNT(*)`,
      })
      .from(feedbacks)
      .groupBy(feedbacks.type);

    // Total lidos vs não lidos
    const byReadStatus = await db
      .select({
        isRead: feedbacks.isRead,
        count: sql<number>`COUNT(*)`,
      })
      .from(feedbacks)
      .groupBy(feedbacks.isRead);

    // Feedbacks por mês (últimos 6 meses)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const byMonth = await db
      .select({
        month: sql<string>`DATE_FORMAT(${feedbacks.createdAt}, '%Y-%m')`,
        count: sql<number>`COUNT(*)`
      })
      .from(feedbacks)
      .where(gte(feedbacks.createdAt, sixMonthsAgo))
      .groupBy(sql`DATE_FORMAT(${feedbacks.createdAt}, '%Y-%m')`)
      .orderBy(sql`DATE_FORMAT(${feedbacks.createdAt}, '%Y-%m')`);

    // Converter count de string para number
    const byMonthFormatted = byMonth.map(item => ({
      month: item.month,
      count: typeof item.count === 'string' ? parseInt(item.count, 10) : item.count
    }));

    return {
      byType,
      byReadStatus,
      byMonth: byMonthFormatted,
    };
  } catch (error) {
    console.error('Error fetching feedback stats:', error);
    return {
      byType: [],
      byReadStatus: [],
      byMonth: [],
    };
  }
}

/**
 * ESTATÍSTICAS POR TAQUÍGRAFO
 */

export async function getStatsByTaquigrafo(taquigId: number) {
  const db = await getDb();
  if (!db) return null;

  const [totalFeedbacks] = await db
    .select({ count: count() })
    .from(feedbacks)
    .where(eq(feedbacks.taquigId, taquigId));

  const [totalRead] = await db
    .select({ count: count() })
    .from(feedbacks)
    .where(and(eq(feedbacks.taquigId, taquigId), eq(feedbacks.isRead, true)));

  const [totalUnread] = await db
    .select({ count: count() })
    .from(feedbacks)
    .where(and(eq(feedbacks.taquigId, taquigId), eq(feedbacks.isRead, false)));

  const byType = await db
    .select({
      type: feedbacks.type,
      count: count(),
    })
    .from(feedbacks)
    .where(eq(feedbacks.taquigId, taquigId))
    .groupBy(feedbacks.type);

  return {
    totalFeedbacks: totalFeedbacks.count,
    totalRead: totalRead.count,
    totalUnread: totalUnread.count,
    byType,
  };
}

/**
 * ESTATÍSTICAS POR REVISOR
 */

export async function getStatsByRevisor(revisorId: number) {
  const db = await getDb();
  if (!db) return null;

  const [totalFeedbacks] = await db
    .select({ count: count() })
    .from(feedbacks)
    .where(eq(feedbacks.revisorId, revisorId));

  const byType = await db
    .select({
      type: feedbacks.type,
      count: count(),
    })
    .from(feedbacks)
    .where(eq(feedbacks.revisorId, revisorId))
    .groupBy(feedbacks.type);

  return {
    totalFeedbacks: totalFeedbacks.count,
    byType,
  };
}

/**
 * TOP TAQUÍGRAFOS (mais feedbacks recebidos)
 */

export async function getTopTaquigrafos(limit: number = 10) {
  const db = await getDb();
  if (!db) return [];

  const result = await db
    .select({
      taquigId: feedbacks.taquigId,
      taquigrafoName: users.name,
      feedbackCount: count(),
    })
    .from(feedbacks)
    .leftJoin(users, eq(feedbacks.taquigId, users.id))
    .groupBy(feedbacks.taquigId, users.name)
    .orderBy(desc(count()))
    .limit(limit);

  return result;
}

/**
 * TOP REVISORES (mais feedbacks criados)
 */

export async function getTopRevisores(limit: number = 10) {
  const db = await getDb();
  if (!db) return [];

  const result = await db
    .select({
      revisorId: feedbacks.revisorId,
      revisorName: users.name,
      feedbackCount: count(),
    })
    .from(feedbacks)
    .leftJoin(users, eq(feedbacks.revisorId, users.id))
    .groupBy(feedbacks.revisorId, users.name)
    .orderBy(desc(count()))
    .limit(limit);

  return result;
}

/**
 * ESTATÍSTICAS DE REAÇÕES
 */

export async function getReactionStats() {
  const db = await getDb();
  if (!db) return [];

  const result = await db
    .select({
      type: reactions.type,
      count: count(),
    })
    .from(reactions)
    .groupBy(reactions.type);

  return result;
}

/**
 * MÉDIA DE AVALIAÇÃO (baseado em feedbacks positivos vs corretivos)
 */

export async function getAverageRating() {
  const db = await getDb();
  if (!db) return null;

  const [positivos] = await db
    .select({ count: count() })
    .from(feedbacks)
    .where(eq(feedbacks.type, "POSITIVO"));

  const [corretivos] = await db
    .select({ count: count() })
    .from(feedbacks)
    .where(eq(feedbacks.type, "CORRETIVO"));

  const total = positivos.count + corretivos.count;
  const rating = total > 0 ? (positivos.count / total) * 5 : 0;

  return {
    positivos: positivos.count,
    corretivos: corretivos.count,
    total,
    rating: rating.toFixed(2),
  };
}
