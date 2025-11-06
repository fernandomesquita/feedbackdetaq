import bcrypt from 'bcryptjs';
import { drizzle } from 'drizzle-orm/mysql2';
import { users, userProfiles } from '../drizzle/schema';

const PASSWORD = 'abccbaabc';

const testUsers = [
  { name: 'Master Admin', email: 'master@test.com', role: 'MASTER' },
  { name: 'Diretor Silva', email: 'diretor@test.com', role: 'DIRETOR' },
  { name: 'Revisor Santos', email: 'revisor@test.com', role: 'REVISOR' },
  { name: 'Taquígrafo João', email: 'taquigrafo@test.com', role: 'TAQUIGRAFO' },
];

async function seed() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL not found');
    process.exit(1);
  }

  const db = drizzle(process.env.DATABASE_URL);
  const hashedPassword = await bcrypt.hash(PASSWORD, 10);

  console.log('🌱 Criando usuários de teste...');

  for (const userData of testUsers) {
    try {
      // Criar usuário
      const [user] = await db.insert(users).values({
        openId: `test_${userData.email}`,
        name: userData.name,
        email: userData.email,
        password: hashedPassword,
        role: userData.role === 'MASTER' ? 'admin' : 'user',
        loginMethod: 'local',
      }).$returningId();

      // Criar perfil
      await db.insert(userProfiles).values({
        userId: user.id,
        feedbackRole: userData.role as any,
      });

      console.log(`✅ Criado: ${userData.name} (${userData.email}) - ${userData.role}`);
    } catch (error: any) {
      if (error.message?.includes('Duplicate entry')) {
        console.log(`⏭️  Já existe: ${userData.email}`);
      } else {
        console.error(`❌ Erro ao criar ${userData.email}:`, error.message);
      }
    }
  }

  console.log('\n✨ Seed concluído!');
  console.log(`\n📝 Credenciais de teste:`);
  console.log(`   Senha para todos: ${PASSWORD}\n`);
  testUsers.forEach(u => {
    console.log(`   ${u.role.padEnd(12)} - ${u.email}`);
  });

  process.exit(0);
}

seed();
