import { eq, and, gte, lte, sql, count, desc } from "drizzle-orm";
import { getDb } from "./db";
import { feedbacks, comments, reactions, avisos, padronizacao, users, userProfiles } from "../drizzle/schema";

/**
 * ESTATÍSTICAS GERAIS
 */

export async function getGeneralStats(filters?: {
  startDate?: Date;
  endDate?: Date;
}) {
  const db = await getDb();
  if (!db) return null;

  const dateConditions = [];
  if (filters?.startDate) {
    dateConditions.push(gte(feedbacks.createdAt, filters.startDate));
  }
  if (filters?.endDate) {
    dateConditions.push(lte(feedbacks.createdAt, filters.endDate));
  }

  const dateFilter = dateConditions.length > 0 ? and(...dateConditions) : undefined;

  const [feedbackCount] = await db
    .select({ count: count() })
    .from(feedbacks)
    .where(dateFilter);

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

export async function getFeedbackStats(filters?: {
  startDate?: Date;
  endDate?: Date;
}) {
  const db = await getDb();
  if (!db) return null;

  try {
    const dateConditions = [];
    if (filters?.startDate) {
      dateConditions.push(gte(feedbacks.createdAt, filters.startDate));
    }
    if (filters?.endDate) {
      dateConditions.push(lte(feedbacks.createdAt, filters.endDate));
    }

    const dateFilter = dateConditions.length > 0 ? and(...dateConditions) : undefined;

    // Total por tipo
    const byType = await db
      .select({
        type: feedbacks.type,
        count: sql<number>`COUNT(*)`,
      })
      .from(feedbacks)
      .where(dateFilter)
      .groupBy(feedbacks.type);

    // Total lidos vs não lidos
    const byReadStatus = await db
      .select({
        isRead: feedbacks.isRead,
        count: sql<number>`COUNT(*)`,
      })
      .from(feedbacks)
      .where(dateFilter)
      .groupBy(feedbacks.isRead);

    // Converter count para number (pode vir como string do MySQL)
    const byTypeFormatted = byType.map(item => ({
      type: item.type,
      count: typeof item.count === 'string' ? parseInt(item.count, 10) : item.count
    }));

    const byReadStatusFormatted = byReadStatus.map(item => ({
      isRead: item.isRead,
      count: typeof item.count === 'string' ? parseInt(item.count, 10) : item.count
    }));

    // Feedbacks por mês com filtro de data
    const startDate = filters?.startDate || new Date(new Date().setMonth(new Date().getMonth() - 6));
    const endDate = filters?.endDate || new Date();

    const byMonthResult: any = await db.execute(
      sql`SELECT DATE_FORMAT(createdAt, '%Y-%m') as month, COUNT(*) as count
          FROM feedbacks
          WHERE createdAt >= ${startDate} AND createdAt <= ${endDate}
          GROUP BY month
          ORDER BY month`
    );

    const byMonth = byMonthResult[0] || [];

    // Converter count de string para number
    const byMonthFormatted = byMonth.map((item: any) => ({
      month: item.month,
      count: typeof item.count === 'string' ? parseInt(item.count, 10) : item.count
    }));

    const result = {
      byType: byTypeFormatted,
      byReadStatus: byReadStatusFormatted,
      byMonth: byMonthFormatted,
    };

    return result;
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

export async function getStatsByTaquigrafo(taquigId: number, filters?: {
  startDate?: Date;
  endDate?: Date;
}) {
  const db = await getDb();
  if (!db) return null;

  const dateConditions = [eq(feedbacks.taquigId, taquigId)];
  if (filters?.startDate) {
    dateConditions.push(gte(feedbacks.createdAt, filters.startDate));
  }
  if (filters?.endDate) {
    dateConditions.push(lte(feedbacks.createdAt, filters.endDate));
  }

  const dateFilter = and(...dateConditions);

  const [totalFeedbacks] = await db
    .select({ count: count() })
    .from(feedbacks)
    .where(dateFilter);

  const [totalRead] = await db
    .select({ count: count() })
    .from(feedbacks)
    .where(and(dateFilter, eq(feedbacks.isRead, true)));

  const [totalUnread] = await db
    .select({ count: count() })
    .from(feedbacks)
    .where(and(dateFilter, eq(feedbacks.isRead, false)));

  const byType = await db
    .select({
      type: feedbacks.type,
      count: count(),
    })
    .from(feedbacks)
    .where(dateFilter)
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

export async function getStatsByRevisor(revisorId: number, filters?: {
  startDate?: Date;
  endDate?: Date;
}) {
  const db = await getDb();
  if (!db) return null;

  const dateConditions = [eq(feedbacks.revisorId, revisorId)];
  if (filters?.startDate) {
    dateConditions.push(gte(feedbacks.createdAt, filters.startDate));
  }
  if (filters?.endDate) {
    dateConditions.push(lte(feedbacks.createdAt, filters.endDate));
  }

  const dateFilter = and(...dateConditions);

  const [totalFeedbacks] = await db
    .select({ count: count() })
    .from(feedbacks)
    .where(dateFilter);

  const byType = await db
    .select({
      type: feedbacks.type,
      count: count(),
    })
    .from(feedbacks)
    .where(dateFilter)
    .groupBy(feedbacks.type);

  return {
    totalFeedbacks: totalFeedbacks.count,
    byType,
  };
}

/**
 * TOP TAQUÍGRAFOS (mais feedbacks recebidos)
 */

export async function getTopTaquigrafos(limit: number = 10, filters?: {
  startDate?: Date;
  endDate?: Date;
}) {
  const db = await getDb();
  if (!db) return [];

  const dateConditions = [];
  if (filters?.startDate) {
    dateConditions.push(gte(feedbacks.createdAt, filters.startDate));
  }
  if (filters?.endDate) {
    dateConditions.push(lte(feedbacks.createdAt, filters.endDate));
  }

  const dateFilter = dateConditions.length > 0 ? and(...dateConditions) : undefined;

  // Query para obter top taquígrafos com média de avaliação
  const result: any = await db.execute(
    sql`SELECT
      f.taquigId,
      u.name,
      COUNT(*) as feedbackCount,
      AVG(f.rating) as avgRating
    FROM feedbacks f
    LEFT JOIN users u ON f.taquigId = u.id
    ${dateFilter ? sql`WHERE ${dateFilter}` : sql``}
    GROUP BY f.taquigId, u.name
    ORDER BY feedbackCount DESC
    LIMIT ${limit}`
  );

  const rows = result[0] || [];
  return rows.map((row: any) => ({
    taquigId: row.taquigId,
    name: row.name,
    feedbackCount: Number(row.feedbackCount),
    avgRating: row.avgRating ? Number(row.avgRating) : null,
  }));
}

/**
 * TOP REVISORES (mais feedbacks criados)
 */

export async function getTopRevisores(limit: number = 10, filters?: {
  startDate?: Date;
  endDate?: Date;
}) {
  const db = await getDb();
  if (!db) return [];

  const dateConditions = [];
  if (filters?.startDate) {
    dateConditions.push(gte(feedbacks.createdAt, filters.startDate));
  }
  if (filters?.endDate) {
    dateConditions.push(lte(feedbacks.createdAt, filters.endDate));
  }

  const dateFilter = dateConditions.length > 0 ? and(...dateConditions) : undefined;

  const result = await db
    .select({
      revisorId: feedbacks.revisorId,
      revisorName: users.name,
      feedbackCount: count(),
    })
    .from(feedbacks)
    .leftJoin(users, eq(feedbacks.revisorId, users.id))
    .where(dateFilter)
    .groupBy(feedbacks.revisorId, users.name)
    .orderBy(desc(count()))
    .limit(limit);

  return result.map((row: any) => ({
    revisorId: row.revisorId,
    name: row.revisorName,
    feedbackCount: Number(row.feedbackCount),
  }));
}

/**
 * ESTATÍSTICAS DE REAÇÕES
 */

export async function getReactionStats(filters?: {
  startDate?: Date;
  endDate?: Date;
}) {
  const db = await getDb();
  if (!db) return [];

  // Precisamos filtrar reações baseadas nas datas dos feedbacks
  if (filters?.startDate || filters?.endDate) {
    const dateConditions = [];
    if (filters?.startDate) {
      dateConditions.push(gte(feedbacks.createdAt, filters.startDate));
    }
    if (filters?.endDate) {
      dateConditions.push(lte(feedbacks.createdAt, filters.endDate));
    }

    const result: any = await db.execute(
      sql`SELECT
        r.type,
        COUNT(*) as count
      FROM reactions r
      INNER JOIN feedbacks f ON r.feedbackId = f.id
      WHERE ${and(...dateConditions)}
      GROUP BY r.type`
    );

    const rows = result[0] || [];
    return rows.map((row: any) => ({
      type: row.type,
      count: Number(row.count),
    }));
  }

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

export async function getAverageRating(filters?: {
  startDate?: Date;
  endDate?: Date;
}) {
  const db = await getDb();
  if (!db) return null;

  const dateConditions = [];
  if (filters?.startDate) {
    dateConditions.push(gte(feedbacks.createdAt, filters.startDate));
  }
  if (filters?.endDate) {
    dateConditions.push(lte(feedbacks.createdAt, filters.endDate));
  }

  const dateFilter = dateConditions.length > 0 ? and(...dateConditions) : undefined;

  const [positivos] = await db
    .select({ count: count() })
    .from(feedbacks)
    .where(dateFilter ? and(dateFilter, eq(feedbacks.type, "POSITIVO")) : eq(feedbacks.type, "POSITIVO"));

  const [corretivos] = await db
    .select({ count: count() })
    .from(feedbacks)
    .where(dateFilter ? and(dateFilter, eq(feedbacks.type, "CORRETIVO")) : eq(feedbacks.type, "CORRETIVO"));

  const total = positivos.count + corretivos.count;
  const rating = total > 0 ? (positivos.count / total) * 5 : 0;

  return rating;
}
