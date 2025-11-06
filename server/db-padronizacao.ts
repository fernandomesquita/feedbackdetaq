import { eq, like, or } from "drizzle-orm";
import { getDb } from "./db";
import { padronizacao, users } from "../drizzle/schema";

/**
 * PADRONIZAÇÃO (Glossário)
 */

export async function createPadronizacao(data: {
  term: string;
  definition?: string;
  userId: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(padronizacao).values(data);
  return result;
}

export async function getAllPadronizacao() {
  const db = await getDb();
  if (!db) return [];

  const result = await db
    .select({
      id: padronizacao.id,
      term: padronizacao.term,
      definition: padronizacao.definition,
      createdAt: padronizacao.createdAt,
      updatedAt: padronizacao.updatedAt,
      userId: padronizacao.userId,
      creatorName: users.name,
    })
    .from(padronizacao)
    .leftJoin(users, eq(padronizacao.userId, users.id))
    .orderBy(padronizacao.term);

  return result;
}

export async function getPadronizacaoById(id: number) {
  const db = await getDb();
  if (!db) return null;

  const result = await db
    .select({
      id: padronizacao.id,
      term: padronizacao.term,
      definition: padronizacao.definition,
      createdAt: padronizacao.createdAt,
      updatedAt: padronizacao.updatedAt,
      userId: padronizacao.userId,
      creatorName: users.name,
    })
    .from(padronizacao)
    .leftJoin(users, eq(padronizacao.userId, users.id))
    .where(eq(padronizacao.id, id))
    .limit(1);

  return result.length > 0 ? result[0] : null;
}

export async function updatePadronizacao(id: number, data: {
  term?: string;
  definition?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(padronizacao).set(data).where(eq(padronizacao.id, id));
}

export async function deletePadronizacao(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(padronizacao).where(eq(padronizacao.id, id));
}

export async function searchPadronizacao(query: string) {
  const db = await getDb();
  if (!db) return [];

  const searchPattern = `%${query}%`;

  const result = await db
    .select({
      id: padronizacao.id,
      term: padronizacao.term,
      definition: padronizacao.definition,
      createdAt: padronizacao.createdAt,
      userId: padronizacao.userId,
      creatorName: users.name,
    })
    .from(padronizacao)
    .leftJoin(users, eq(padronizacao.userId, users.id))
    .where(
      or(
        like(padronizacao.term, searchPattern),
        like(padronizacao.definition, searchPattern)
      )
    )
    .orderBy(padronizacao.term);

  return result;
}

/**
 * RASTREAMENTO DE LEITURA DE PADRONIZAÇÃO
 */

import { padronizacaoReads } from "../drizzle/schema";
import { and, count, sql, gt } from "drizzle-orm";

export async function markPadronizacaoAsRead(padronizacaoId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Inserir ou ignorar se já existe (devido ao UNIQUE constraint)
  await db
    .insert(padronizacaoReads)
    .values({ padronizacaoId, userId })
    .onDuplicateKeyUpdate({ set: { readAt: sql`NOW()` } });
}

export async function getUnreadPadronizacaoCount(userId: number, since?: Date) {
  const db = await getDb();
  if (!db) return 0;

  // Contar termos criados/atualizados desde uma data que o usuário ainda não leu
  const sinceDate = since || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 dias atrás por padrão

  const result = await db
    .select({ count: count() })
    .from(padronizacao)
    .leftJoin(
      padronizacaoReads,
      and(
        eq(padronizacaoReads.padronizacaoId, padronizacao.id),
        eq(padronizacaoReads.userId, userId)
      )
    )
    .where(
      and(
        gt(padronizacao.updatedAt, sinceDate),
        eq(padronizacaoReads.id, sql`NULL`) // Não lido
      )
    );

  return result[0]?.count || 0;
}

export async function markAllPadronizacaoAsRead(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Pegar todos os termos
  const allTerms = await db.select({ id: padronizacao.id }).from(padronizacao);

  // Marcar todos como lidos
  for (const term of allTerms) {
    await markPadronizacaoAsRead(term.id, userId);
  }
}
