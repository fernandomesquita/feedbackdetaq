import { eq, and, desc } from "drizzle-orm";
import { getDb } from "./db";
import { comments, reactions, users } from "../drizzle/schema";

/**
 * COMENTÁRIOS
 */

export async function createComment(data: {
  feedbackId: number;
  userId: number;
  content: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(comments).values(data);
  return result;
}

export async function getCommentsByFeedback(feedbackId: number) {
  const db = await getDb();
  if (!db) return [];

  const result = await db
    .select({
      id: comments.id,
      content: comments.content,
      createdAt: comments.createdAt,
      updatedAt: comments.updatedAt,
      userId: comments.userId,
      userName: users.name,
      userEmail: users.email,
    })
    .from(comments)
    .leftJoin(users, eq(comments.userId, users.id))
    .where(eq(comments.feedbackId, feedbackId))
    .orderBy(desc(comments.createdAt));

  return result;
}

export async function deleteComment(commentId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .delete(comments)
    .where(and(eq(comments.id, commentId), eq(comments.userId, userId)));
}

/**
 * REAÇÕES
 */

export async function createReaction(data: {
  feedbackId: number;
  userId: number;
  type: "ENTENDI" | "OBRIGADO" | "VOU_MELHORAR";
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Verificar se já existe uma reação do mesmo tipo do mesmo usuário
  const existing = await db
    .select()
    .from(reactions)
    .where(
      and(
        eq(reactions.feedbackId, data.feedbackId),
        eq(reactions.userId, data.userId),
        eq(reactions.type, data.type)
      )
    )
    .limit(1);

  if (existing.length > 0) {
    // Se já existe, remove (toggle)
    await db
      .delete(reactions)
      .where(
        and(
          eq(reactions.feedbackId, data.feedbackId),
          eq(reactions.userId, data.userId),
          eq(reactions.type, data.type)
        )
      );
    return { action: "removed" };
  } else {
    // Se não existe, adiciona
    await db.insert(reactions).values(data);
    return { action: "added" };
  }
}

export async function getReactionsByFeedback(feedbackId: number) {
  const db = await getDb();
  if (!db) return [];

  const result = await db
    .select({
      id: reactions.id,
      type: reactions.type,
      userId: reactions.userId,
      userName: users.name,
      createdAt: reactions.createdAt,
    })
    .from(reactions)
    .leftJoin(users, eq(reactions.userId, users.id))
    .where(eq(reactions.feedbackId, feedbackId))
    .orderBy(desc(reactions.createdAt));

  return result;
}

export async function getReactionCounts(feedbackId: number) {
  const db = await getDb();
  if (!db) return { ENTENDI: 0, OBRIGADO: 0, VOU_MELHORAR: 0 };

  const result = await db
    .select()
    .from(reactions)
    .where(eq(reactions.feedbackId, feedbackId));

  const counts = {
    ENTENDI: 0,
    OBRIGADO: 0,
    VOU_MELHORAR: 0,
  };

  result.forEach((r) => {
    if (r.type in counts) {
      counts[r.type as keyof typeof counts]++;
    }
  });

  return counts;
}
