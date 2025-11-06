import { eq, ne, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, userProfiles, InsertUserProfile, feedbacks } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
      name: user.name || "Usuário",
      email: user.email || `${user.openId}@temp.com`,
    };
    const updateSet: Record<string, unknown> = {};

    if (user.name !== undefined) {
      values.name = user.name;
      updateSet.name = user.name;
    }
    if (user.email !== undefined) {
      values.email = user.email;
      updateSet.email = user.email;
    }
    if (user.loginMethod !== undefined) {
      values.loginMethod = user.loginMethod;
      updateSet.loginMethod = user.loginMethod;
    }


    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function getUserById(userId: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.id, userId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function getUserWithProfile(userId: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db
    .select()
    .from(users)
    .leftJoin(userProfiles, eq(users.id, userProfiles.userId))
    .where(eq(users.id, userId))
    .limit(1);

  if (result.length === 0) return undefined;

  return {
    ...result[0].users,
    profile: result[0].user_profiles,
  };
}

export async function upsertUserProfile(profile: InsertUserProfile) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert profile: database not available");
    return;
  }

  try {
    await db.insert(userProfiles).values(profile).onDuplicateKeyUpdate({
      set: {
        feedbackRole: profile.feedbackRole,
        updatedAt: new Date(),
      },
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user profile:", error);
    throw error;
  }
}

export async function getUserProfile(userId: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get profile: database not available");
    return undefined;
  }

  const result = await db
    .select()
    .from(userProfiles)
    .where(eq(userProfiles.userId, userId))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// TODO: add feature queries here as your schema grows.


export async function getUserProfilesByRole(role: string) {
  const db = await getDb();
  if (!db) return [];

  const result = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      feedbackRole: userProfiles.feedbackRole,
    })
    .from(userProfiles)
    .leftJoin(users, eq(userProfiles.userId, users.id))
    .where(eq(userProfiles.feedbackRole, role as any));

  return result;
}

/**
 * GESTÃO DE USUÁRIOS
 */

export async function getAllUsersWithProfiles() {
  const db = await getDb();
  if (!db) return [];

  const result = await db
    .select({
      id: users.id,
      openId: users.openId,
      name: users.name,
      email: users.email,
      role: users.role,
      createdAt: users.createdAt,
      lastSignedIn: users.lastSignedIn,
      feedbackRole: userProfiles.feedbackRole,
      profileId: userProfiles.id,
    })
    .from(users)
    .leftJoin(userProfiles, eq(users.id, userProfiles.userId))
    .where(ne(users.openId, ENV.ownerOpenId)); // Ocultar MASTER da listagem

  return result;
}

export async function updateUserProfile(userId: number, data: { feedbackRole: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Verificar se o perfil existe
  const existingProfile = await getUserProfile(userId);

  if (existingProfile) {
    // Atualizar perfil existente
    await db
      .update(userProfiles)
      .set({ feedbackRole: data.feedbackRole as any })
      .where(eq(userProfiles.userId, userId));
  } else {
    // Criar novo perfil
    await db.insert(userProfiles).values({
      userId,
      feedbackRole: data.feedbackRole as any,
    });
  }
}

export async function deleteUser(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Deletar perfil primeiro (foreign key)
  await db.delete(userProfiles).where(eq(userProfiles.userId, userId));

  // Deletar usuário
  await db.delete(users).where(eq(users.id, userId));
}

export async function createUserWithProfile(data: {
  openId: string;
  name: string;
  email: string;
  feedbackRole: "MASTER" | "DIRETOR" | "REVISOR" | "TAQUIGRAFO";
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Criar usuário
  const [userResult] = await db.insert(users).values({
    openId: data.openId,
    name: data.name,
    email: data.email,
    role: data.feedbackRole === "MASTER" ? "admin" : "user",
  }).$returningId();

  // Criar perfil
  await db.insert(userProfiles).values({
    userId: userResult.id,
    feedbackRole: data.feedbackRole,
  });

  return userResult.id;
}


// Contar feedbacks por usuário
export async function countFeedbacksByUser(userId: number, type: 'sent' | 'received') {
  const db = await getDb();
  if (!db) return 0;

  try {
    console.log('[countFeedbacksByUser] userId:', userId, 'type:', type);
    const result = await db
      .select({ count: sql<number>`count(*)`})
      .from(feedbacks)
      .where(type === 'sent' ? eq(feedbacks.revisorId, userId) : eq(feedbacks.taquigId, userId));
    
    console.log('[countFeedbacksByUser] result:', result);
    return result[0]?.count || 0;
  } catch (error) {
    console.error('[Database] Failed to count feedbacks:', error);
    return 0;
  }
}
