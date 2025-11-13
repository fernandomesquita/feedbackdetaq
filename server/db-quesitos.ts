import { getDb } from "./db";
import { quesitos, type Quesito, type InsertQuesito } from "../drizzle/schema";
import { eq, and, desc } from "drizzle-orm";

/**
 * Busca todos os quesitos
 */
export async function getQuesitos(filters?: { isActive?: boolean }): Promise<Quesito[]> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const conditions = [];

  if (filters?.isActive !== undefined) {
    conditions.push(eq(quesitos.isActive, filters.isActive));
  }

  if (conditions.length > 0) {
    return await db
      .select()
      .from(quesitos)
      .where(and(...conditions))
      .orderBy(quesitos.ordem, quesitos.createdAt);
  }

  return await db
    .select()
    .from(quesitos)
    .orderBy(quesitos.ordem, quesitos.createdAt);
}

/**
 * Busca um quesito por ID
 */
export async function getQuesitoById(id: number): Promise<Quesito | undefined> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db
    .select()
    .from(quesitos)
    .where(eq(quesitos.id, id))
    .limit(1);

  return result[0];
}

/**
 * Cria um novo quesito
 */
export async function createQuesito(data: InsertQuesito): Promise<Quesito> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(quesitos).values(data);
  const insertedId = result[0].insertId;

  const quesito = await getQuesitoById(insertedId);
  if (!quesito) {
    throw new Error("Erro ao criar quesito");
  }

  return quesito;
}

/**
 * Atualiza um quesito existente
 */
export async function updateQuesito(
  id: number,
  data: Partial<InsertQuesito>
): Promise<Quesito> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(quesitos)
    .set(data)
    .where(eq(quesitos.id, id));

  const quesito = await getQuesitoById(id);
  if (!quesito) {
    throw new Error("Quesito não encontrado");
  }

  return quesito;
}

/**
 * Deleta um quesito
 */
export async function deleteQuesito(id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(quesitos).where(eq(quesitos.id, id));
}

/**
 * Conta o total de quesitos
 */
export async function countQuesitos(filters?: { isActive?: boolean }): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const conditions = [];

  if (filters?.isActive !== undefined) {
    conditions.push(eq(quesitos.isActive, filters.isActive));
  }

  const result = await db
    .select()
    .from(quesitos)
    .where(conditions.length > 0 ? and(...conditions) : undefined);

  return result.length;
}

/**
 * Reordena quesitos
 */
export async function reorderQuesitos(
  updates: Array<{ id: number; ordem: number }>
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Atualiza a ordem de cada quesito
  await Promise.all(
    updates.map(({ id, ordem }) =>
      db.update(quesitos).set({ ordem }).where(eq(quesitos.id, id))
    )
  );
}
