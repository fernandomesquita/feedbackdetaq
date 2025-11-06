import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/mysql2';
import { users } from '../drizzle/schema';

const db = drizzle(process.env.DATABASE_URL!);

async function updatePasswords() {
  console.log('🔐 Atualizando senhas dos usuários de teste...');
  
  const password = 'abccbaabc';
  const hashedPassword = await bcrypt.hash(password, 10);
  
  const testUsers = [
    'master@test.com',
    'diretor@test.com',
    'revisor@test.com',
    'taquigrafo@test.com'
  ];
  
  for (const email of testUsers) {
    try {
      await db
        .update(users)
        .set({ password: hashedPassword })
        .where(eq(users.email, email));
      console.log(`✅ Senha atualizada: ${email}`);
    } catch (error) {
      console.error(`❌ Erro ao atualizar ${email}:`, error);
    }
  }
  
  console.log('✨ Atualização concluída!');
  console.log('📝 Senha para todos: abccbaabc');
  process.exit(0);
}

updatePasswords();
