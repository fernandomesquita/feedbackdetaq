import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';
import { getDb } from './db';
import { users } from '../drizzle/schema';

export async function authenticateLocal(email: string, password: string) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  // Buscar usuário por email
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (!user) {
    return null;
  }

  // Verificar senha
  if (!user.password) {
    return null; // Usuário sem senha (OAuth only)
  }

  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) {
    return null;
  }

  return user;
}
