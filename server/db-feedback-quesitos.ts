import { getDb } from "./db";
import { feedbackQuesitos, quesitos, type FeedbackQuesito, type InsertFeedbackQuesito } from "../drizzle/schema";
import { eq, and, sql } from "drizzle-orm";

/**
 * Criar múltiplos quesitos para um feedback
 */
export async function createFeedbackQuesitos(
  items: InsertFeedbackQuesito[]
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  if (items.length === 0) return;

  await db.insert(feedbackQuesitos).values(items);
}

/**
 * Buscar quesitos de um feedback com detalhes do quesito
 */
export async function getFeedbackQuesitos(feedbackId: number) {
  const db = await getDb();
  if (!db) return [];

  const result = await db
    .select({
      id: feedbackQuesitos.id,
      feedbackId: feedbackQuesitos.feedbackId,
      quesitoId: feedbackQuesitos.quesitoId,
      textoOriginal: feedbackQuesitos.textoOriginal,
      textoRevisado: feedbackQuesitos.textoRevisado,
      ordem: feedbackQuesitos.ordem,
      createdAt: feedbackQuesitos.createdAt,
      updatedAt: feedbackQuesitos.updatedAt,
      quesito: {
        id: quesitos.id,
        titulo: quesitos.titulo,
        descricao: quesitos.descricao,
      },
    })
    .from(feedbackQuesitos)
    .leftJoin(quesitos, eq(feedbackQuesitos.quesitoId, quesitos.id))
    .where(eq(feedbackQuesitos.feedbackId, feedbackId))
    .orderBy(feedbackQuesitos.ordem);

  return result;
}

/**
 * Atualizar quesitos de um feedback (remove e recria)
 */
export async function updateFeedbackQuesitos(
  feedbackId: number,
  items: InsertFeedbackQuesito[]
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Deletar quesitos antigos
  await db.delete(feedbackQuesitos).where(eq(feedbackQuesitos.feedbackId, feedbackId));

  // Criar novos quesitos
  if (items.length > 0) {
    await db.insert(feedbackQuesitos).values(items);
  }
}

/**
 * Deletar todos os quesitos de um feedback
 */
export async function deleteFeedbackQuesitos(feedbackId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(feedbackQuesitos).where(eq(feedbackQuesitos.feedbackId, feedbackId));
}

/**
 * Contar feedbacks por quesito (para estatísticas)
 */
export async function countFeedbacksByQuesito(quesitoId: number): Promise<number> {
  const db = await getDb();
  if (!db) return 0;

  const result = await db
    .select()
    .from(feedbackQuesitos)
    .where(eq(feedbackQuesitos.quesitoId, quesitoId));

  return result.length;
}

/**
 * Estatísticas de quesitos por revisor
 */
export async function getQuesitoStatsByRevisor(revisorId: number) {
  const db = await getDb();
  if (!db) return [];

  // Query SQL para agregar dados
  const result = await db.execute(sql`
    SELECT
      q.id as quesitoId,
      q.titulo as quesitoTitulo,
      COUNT(fq.id) as totalUsos,
      COUNT(DISTINCT f.taquigId) as totalTaquigrafos
    FROM feedback_quesitos fq
    INNER JOIN quesitos q ON fq.quesitoId = q.id
    INNER JOIN feedbacks f ON fq.feedbackId = f.id
    WHERE f.revisorId = ${revisorId}
    GROUP BY q.id, q.titulo
    ORDER BY totalUsos DESC
  `);

  // db.execute retorna [rows, fields], pegamos apenas as rows
  const rows = Array.isArray(result) && result.length > 0 ? result[0] : result;
  return rows;
}

/**
 * Estatísticas de quesitos por taquígrafo
 */
export async function getQuesitoStatsByTaquigrafo(taquigId: number) {
  const db = await getDb();
  if (!db) return [];

  // Query SQL para agregar dados
  const result = await db.execute(sql`
    SELECT
      q.id as quesitoId,
      q.titulo as quesitoTitulo,
      COUNT(fq.id) as totalRecebidos,
      COUNT(DISTINCT f.revisorId) as totalRevisores
    FROM feedback_quesitos fq
    INNER JOIN quesitos q ON fq.quesitoId = q.id
    INNER JOIN feedbacks f ON fq.feedbackId = f.id
    WHERE f.taquigId = ${taquigId}
    GROUP BY q.id, q.titulo
    ORDER BY totalRecebidos DESC
  `);

  // db.execute retorna [rows, fields], pegamos apenas as rows
  const rows = Array.isArray(result) && result.length > 0 ? result[0] : result;
  return rows;
}

/**
 * Estatísticas globais de quesitos mais usados
 */
export async function getGlobalQuesitoStats(filters?: {
  startDate?: Date;
  endDate?: Date;
}) {
  const db = await getDb();
  if (!db) return [];

  let query = sql`
    SELECT
      q.id as quesitoId,
      q.titulo as quesitoTitulo,
      q.descricao as quesitoDescricao,
      COUNT(fq.id) as totalUsos,
      COUNT(DISTINCT f.revisorId) as totalRevisores,
      COUNT(DISTINCT f.taquigId) as totalTaquigrafos
    FROM feedback_quesitos fq
    INNER JOIN quesitos q ON fq.quesitoId = q.id
    INNER JOIN feedbacks f ON fq.feedbackId = f.id
    WHERE q.isActive = true
  `;

  // Adicionar filtros de data se fornecidos
  if (filters?.startDate) {
    query = sql`${query} AND f.createdAt >= ${filters.startDate}`;
  }
  if (filters?.endDate) {
    query = sql`${query} AND f.createdAt <= ${filters.endDate}`;
  }

  query = sql`${query}
    GROUP BY q.id, q.titulo, q.descricao
    ORDER BY totalUsos DESC
  `;

  const result = await db.execute(query);

  console.log('[getGlobalQuesitoStats] Raw result:', result);

  // db.execute retorna [rows, fields], pegamos apenas as rows
  const rows = Array.isArray(result) && result.length > 0 ? result[0] : result;
  console.log('[getGlobalQuesitoStats] Rows:', rows);

  return rows;
}
