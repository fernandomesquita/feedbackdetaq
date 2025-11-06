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
