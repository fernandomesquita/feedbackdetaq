import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';
import { getDb } from './db';
import { users } from '../drizzle/schema';

export async function authenticateLocal(email: string, password: string) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  console.log('[LocalAuth] Attempting login for:', email);

  // Buscar usuário por email
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (!user) {
    console.log('[LocalAuth] User not found:', email);
    return null;
  }

  console.log('[LocalAuth] User found:', user.email, 'has password:', !!user.password);

  // Verificar senha
  if (!user.password) {
    console.log('[LocalAuth] User has no password (OAuth only)');
    return null;
  }

  const isValid = await bcrypt.compare(password, user.password);
  console.log('[LocalAuth] Password valid:', isValid);
  
  if (!isValid) {
    return null;
  }

  return user;
}
