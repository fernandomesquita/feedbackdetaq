import { eq, and, desc, sql, lte } from "drizzle-orm";
import { getDb } from "./db";
import { avisos, avisoReads, users } from "../drizzle/schema";

/**
 * AVISOS
 */

export async function createAviso(data: {
  title: string;
  content: string;
  type: "COTIDIANO" | "URGENTE" | "RECORRENTE";
  targets: any[];
  publishAt?: Date;
  userId: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(avisos).values({
    ...data,
    publishAt: data.publishAt || new Date(),
  });
  return result;
}

export async function getAllAvisos() {
  const db = await getDb();
  if (!db) return [];

  const result = await db
    .select({
      id: avisos.id,
      title: avisos.title,
      content: avisos.content,
      type: avisos.type,
      isActive: avisos.isActive,
      publishAt: avisos.publishAt,
      createdAt: avisos.createdAt,
      userId: avisos.userId,
      creatorName: users.name,
    })
    .from(avisos)
    .leftJoin(users, eq(avisos.userId, users.id))
    .where(and(eq(avisos.isActive, true), lte(avisos.publishAt, new Date())))
    .orderBy(desc(avisos.createdAt));

  return result;
}

export async function getAvisoById(id: number) {
  const db = await getDb();
  if (!db) return null;

  const result = await db
    .select({
      id: avisos.id,
      title: avisos.title,
      content: avisos.content,
      type: avisos.type,
      isActive: avisos.isActive,
      publishAt: avisos.publishAt,
      targets: avisos.targets,
      createdAt: avisos.createdAt,
      updatedAt: avisos.updatedAt,
      userId: avisos.userId,
      creatorName: users.name,
    })
    .from(avisos)
    .leftJoin(users, eq(avisos.userId, users.id))
    .where(eq(avisos.id, id))
    .limit(1);

  return result.length > 0 ? result[0] : null;
}

export async function updateAviso(id: number, data: {
  title?: string;
  content?: string;
  type?: "COTIDIANO" | "URGENTE" | "RECORRENTE";
  isActive?: boolean;
  targets?: any[];
  publishAt?: Date;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(avisos).set(data).where(eq(avisos.id, id));
}

export async function deleteAviso(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Deletar registros de leitura primeiro
  await db.delete(avisoReads).where(eq(avisoReads.avisoId, id));
  
  // Deletar aviso
  await db.delete(avisos).where(eq(avisos.id, id));
}

export async function getAvisosByType(type: "COTIDIANO" | "URGENTE" | "RECORRENTE") {
  const db = await getDb();
  if (!db) return [];

  const result = await db
    .select({
      id: avisos.id,
      title: avisos.title,
      content: avisos.content,
      type: avisos.type,
      isActive: avisos.isActive,
      publishAt: avisos.publishAt,
      createdAt: avisos.createdAt,
      userId: avisos.userId,
      creatorName: users.name,
    })
    .from(avisos)
    .leftJoin(users, eq(avisos.userId, users.id))
    .where(and(eq(avisos.type, type), eq(avisos.isActive, true), lte(avisos.publishAt, new Date())))
    .orderBy(desc(avisos.createdAt));

  return result;
}

/**
 * LEITURAS DE AVISOS
 */

export async function markAvisoAsRead(avisoId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Verificar se já foi lido
  const existing = await db
    .select()
    .from(avisoReads)
    .where(and(eq(avisoReads.avisoId, avisoId), eq(avisoReads.userId, userId)))
    .limit(1);

  if (existing.length === 0) {
    await db.insert(avisoReads).values({ avisoId, userId });
  }
}

export async function isAvisoReadByUser(avisoId: number, userId: number) {
  const db = await getDb();
  if (!db) return false;

  const result = await db
    .select()
    .from(avisoReads)
    .where(and(eq(avisoReads.avisoId, avisoId), eq(avisoReads.userId, userId)))
    .limit(1);

  return result.length > 0;
}

export async function getUnreadAvisosCount(userId: number) {
  const db = await getDb();
  if (!db) return 0;

  const activeAvisos = await db
    .select({ id: avisos.id })
    .from(avisos)
    .where(and(eq(avisos.isActive, true), lte(avisos.publishAt, new Date())));

  const readAvisos = await db
    .select({ avisoId: avisoReads.avisoId })
    .from(avisoReads)
    .where(eq(avisoReads.userId, userId));

  const readIds = new Set(readAvisos.map((r) => r.avisoId));
  const unreadCount = activeAvisos.filter((a) => !readIds.has(a.id)).length;

  return unreadCount;
}

export async function getAvisosWithReadStatus(userId: number) {
  const db = await getDb();
  if (!db) return [];

  const result = await db
    .select({
      id: avisos.id,
      title: avisos.title,
      content: avisos.content,
      type: avisos.type,
      isActive: avisos.isActive,
      publishAt: avisos.publishAt,
      createdAt: avisos.createdAt,
      userId: avisos.userId,
      creatorName: users.name,
      isRead: sql<boolean>`CASE WHEN ${avisoReads.id} IS NOT NULL THEN 1 ELSE 0 END`,
    })
    .from(avisos)
    .leftJoin(users, eq(avisos.userId, users.id))
    .leftJoin(
      avisoReads,
      and(eq(avisoReads.avisoId, avisos.id), eq(avisoReads.userId, userId))
    )
    .where(and(eq(avisos.isActive, true), lte(avisos.publishAt, new Date())))
    .orderBy(desc(avisos.createdAt));

  return result;
}


/**
 * VISUALIZAÇÕES DE AVISOS (para estatísticas)
 */

import { avisoViews } from "../drizzle/schema";
import { count, inArray } from "drizzle-orm";

export async function recordAvisoView(avisoId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Registrar visualização (pode haver múltiplas visualizações do mesmo usuário)
  await db.insert(avisoViews).values({ avisoId, userId });
}

export async function getAvisoViewStats(avisoId: number) {
  const db = await getDb();
  if (!db) return { totalViews: 0, uniqueUsers: 0, viewsByUser: [] };

  // Total de visualizações
  const totalResult = await db
    .select({ count: count() })
    .from(avisoViews)
    .where(eq(avisoViews.avisoId, avisoId));

  // Usuários únicos
  const uniqueResult = await db
    .select({ userId: avisoViews.userId })
    .from(avisoViews)
    .where(eq(avisoViews.avisoId, avisoId))
    .groupBy(avisoViews.userId);

  // Visualizações por usuário com nomes
  const viewsByUserResult = await db
    .select({
      userId: avisoViews.userId,
      userName: users.name,
      viewCount: count(),
      lastViewedAt: sql<Date>`MAX(${avisoViews.viewedAt})`,
    })
    .from(avisoViews)
    .leftJoin(users, eq(avisoViews.userId, users.id))
    .where(eq(avisoViews.avisoId, avisoId))
    .groupBy(avisoViews.userId, users.name);

  return {
    totalViews: totalResult[0]?.count || 0,
    uniqueUsers: uniqueResult.length,
    viewsByUser: viewsByUserResult,
  };
}

export async function getActiveAvisosWithStats() {
  const db = await getDb();
  if (!db) return [];

  // Pegar todos os avisos ativos
  const activeAvisos = await db
    .select({
      id: avisos.id,
      title: avisos.title,
      content: avisos.content,
      type: avisos.type,
      publishAt: avisos.publishAt,
      createdAt: avisos.createdAt,
      userId: avisos.userId,
      creatorName: users.name,
    })
    .from(avisos)
    .leftJoin(users, eq(avisos.userId, users.id))
    .where(and(eq(avisos.isActive, true), lte(avisos.publishAt, new Date())))
    .orderBy(desc(avisos.createdAt));

  // Para cada aviso, pegar estatísticas
  const avisosWithStats = await Promise.all(
    activeAvisos.map(async (aviso) => {
      const stats = await getAvisoViewStats(aviso.id);
      return { ...aviso, ...stats };
    })
  );

  return avisosWithStats;
}
