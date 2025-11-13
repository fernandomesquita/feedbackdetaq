import { eq, and, or, like, gte, lte, desc, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/mysql-core";
import { getDb } from "./db";
import { feedbacks, users, userProfiles, InsertFeedback, comments } from "../drizzle/schema";

export async function createFeedback(feedback: InsertFeedback) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(feedbacks).values(feedback);
  return { insertId: result[0].insertId };
}

export async function getFeedbackById(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select({
      feedback: feedbacks,
      revisor: users,
      revisorProfile: userProfiles,
      taquigrafo: users,
      taquigProfile: userProfiles,
    })
    .from(feedbacks)
    .leftJoin(users, eq(feedbacks.revisorId, users.id))
    .leftJoin(userProfiles, eq(users.id, userProfiles.userId))
    .leftJoin(
      sql`${users} AS taquigrafo`,
      eq(feedbacks.taquigId, sql`taquigrafo.id`)
    )
    .leftJoin(
      sql`${userProfiles} AS taquig_profile`,
      eq(sql`taquigrafo.id`, sql`taquig_profile.userId`)
    )
    .where(eq(feedbacks.id, id))
    .limit(1);

  if (result.length === 0) return undefined;

  return result[0];
}

export async function getFeedbacksByTaquigrafo(taquigId: number, filters?: {
  type?: "CORRETIVO" | "POSITIVO";
  isRead?: boolean;
  startDate?: Date;
  endDate?: Date;
  search?: string;
}) {
  const db = await getDb();
  if (!db) return [];

  const conditions = [eq(feedbacks.taquigId, taquigId)];

  if (filters?.type) {
    conditions.push(eq(feedbacks.type, filters.type));
  }

  if (filters?.isRead !== undefined) {
    conditions.push(eq(feedbacks.isRead, filters.isRead));
  }

  if (filters?.startDate) {
    conditions.push(gte(feedbacks.createdAt, filters.startDate));
  }

  if (filters?.endDate) {
    conditions.push(lte(feedbacks.createdAt, filters.endDate));
  }

  if (filters?.search) {
    conditions.push(
      or(
        like(feedbacks.title, `%${filters.search}%`),
        like(feedbacks.content, `%${filters.search}%`),
        like(feedbacks.sessionNum, `%${filters.search}%`)
      )!
    );
  }

  const result = await db
    .select({
      feedback: feedbacks,
      revisor: users,
      commentCount: sql<number>`CAST(COUNT(DISTINCT ${comments.id}) AS UNSIGNED)`,
    })
    .from(feedbacks)
    .leftJoin(users, eq(feedbacks.revisorId, users.id))
    .leftJoin(comments, eq(feedbacks.id, comments.feedbackId))
    .where(and(...conditions))
    .groupBy(feedbacks.id, users.id)
    .orderBy(desc(feedbacks.createdAt));

  return result;
}

export async function getFeedbacksByRevisor(revisorId: number, filters?: {
  type?: "CORRETIVO" | "POSITIVO";
  isRead?: boolean;
  startDate?: Date;
  endDate?: Date;
  search?: string;
}) {
  const db = await getDb();
  if (!db) return [];

  const conditions = [eq(feedbacks.revisorId, revisorId)];

  if (filters?.type) {
    conditions.push(eq(feedbacks.type, filters.type));
  }

  if (filters?.isRead !== undefined) {
    conditions.push(eq(feedbacks.isRead, filters.isRead));
  }

  if (filters?.startDate) {
    conditions.push(gte(feedbacks.createdAt, filters.startDate));
  }

  if (filters?.endDate) {
    conditions.push(lte(feedbacks.createdAt, filters.endDate));
  }

  if (filters?.search) {
    conditions.push(
      or(
        like(feedbacks.title, `%${filters.search}%`),
        like(feedbacks.content, `%${filters.search}%`),
        like(feedbacks.sessionNum, `%${filters.search}%`)
      )!
    );
  }

  const result = await db
    .select({
      feedback: feedbacks,
      taquigrafo: users,
      commentCount: sql<number>`CAST(COUNT(DISTINCT ${comments.id}) AS UNSIGNED)`,
    })
    .from(feedbacks)
    .leftJoin(users, eq(feedbacks.taquigId, users.id))
    .leftJoin(comments, eq(feedbacks.id, comments.feedbackId))
    .where(and(...conditions))
    .groupBy(feedbacks.id, users.id)
    .orderBy(desc(feedbacks.createdAt));

  return result;
}

export async function getAllFeedbacks(filters?: {
  type?: "CORRETIVO" | "POSITIVO";
  isRead?: boolean;
  startDate?: Date;
  endDate?: Date;
  search?: string;
}) {
  const db = await getDb();
  if (!db) return [];

  const conditions = [];

  if (filters?.type) {
    conditions.push(eq(feedbacks.type, filters.type));
  }

  if (filters?.isRead !== undefined) {
    conditions.push(eq(feedbacks.isRead, filters.isRead));
  }

  if (filters?.startDate) {
    conditions.push(gte(feedbacks.createdAt, filters.startDate));
  }

  if (filters?.endDate) {
    conditions.push(lte(feedbacks.createdAt, filters.endDate));
  }

  if (filters?.search) {
    conditions.push(
      or(
        like(feedbacks.title, `%${filters.search}%`),
        like(feedbacks.content, `%${filters.search}%`),
        like(feedbacks.sessionNum, `%${filters.search}%`)
      )!
    );
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  // Criar aliases para as tabelas
  const taquigrafoTable = alias(users, 'taquigrafo');
  
  const result = await db
    .select({
      feedback: feedbacks,
      revisor: users,
      taquigrafo: taquigrafoTable,
      commentCount: sql<number>`CAST(COUNT(DISTINCT ${comments.id}) AS UNSIGNED)`,
    })
    .from(feedbacks)
    .leftJoin(users, eq(feedbacks.revisorId, users.id))
    .leftJoin(taquigrafoTable, eq(feedbacks.taquigId, taquigrafoTable.id))
    .leftJoin(comments, eq(feedbacks.id, comments.feedbackId))
    .where(whereClause)
    .groupBy(feedbacks.id, users.id, taquigrafoTable.id)
    .orderBy(desc(feedbacks.createdAt));

  return result;
}

export async function updateFeedback(id: number, data: Partial<InsertFeedback>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(feedbacks).set(data).where(eq(feedbacks.id, id));
}

export async function markFeedbackAsRead(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(feedbacks)
    .set({
      isRead: true,
      readAt: new Date(),
    })
    .where(eq(feedbacks.id, id));
}

export async function deleteFeedback(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(feedbacks).where(eq(feedbacks.id, id));
}
