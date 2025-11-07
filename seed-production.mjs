import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import bcrypt from "bcryptjs";

// Conectar ao banco de produção
const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("❌ DATABASE_URL não configurada");
  process.exit(1);
}

console.log("🔌 Conectando ao banco de dados de produção...");
const connection = await mysql.createConnection(DATABASE_URL);
const db = drizzle(connection);

console.log("✅ Conectado ao banco de produção");

// Hash de senha padrão: abccbaabc
const passwordHash = await bcrypt.hash("abccbaabc", 10);

console.log("\n📝 Inserindo usuários...");

// Inserir Diretores
const diretores = [
  { email: "diretor1@test.com", name: "Carlos Silva", openId: `dir1_${Date.now()}` },
  { email: "diretor2@test.com", name: "Ana Santos", openId: `dir2_${Date.now()}` },
  { email: "diretor3@test.com", name: "Roberto Lima", openId: `dir3_${Date.now()}` },
];

for (const diretor of diretores) {
  await connection.execute(
    `INSERT INTO users (openId, name, email, password, loginMethod, createdAt, updatedAt, lastSignedIn) 
     VALUES (?, ?, ?, ?, 'local', NOW(), NOW(), NOW())
     ON DUPLICATE KEY UPDATE name = VALUES(name), password = VALUES(password)`,
    [diretor.openId, diretor.name, diretor.email, passwordHash]
  );
  
  const [userResult] = await connection.execute(
    `SELECT id FROM users WHERE openId = ?`,
    [diretor.openId]
  );
  const userId = userResult[0].id;
  
  await connection.execute(
    `INSERT INTO user_profiles (userId, feedbackRole, createdAt, updatedAt)
     VALUES (?, 'DIRETOR', NOW(), NOW())
     ON DUPLICATE KEY UPDATE feedbackRole = 'DIRETOR'`,
    [userId]
  );
  
  console.log(`  ✓ Diretor: ${diretor.name} (${diretor.email})`);
}

// Inserir Revisores
const revisores = [
  { email: "revisor1@test.com", name: "Mariana Costa", openId: `rev1_${Date.now()}` },
  { email: "revisor2@test.com", name: "Pedro Oliveira", openId: `rev2_${Date.now()}` },
  { email: "revisor3@test.com", name: "Julia Ferreira", openId: `rev3_${Date.now()}` },
];

const revisorIds = [];
for (const revisor of revisores) {
  await connection.execute(
    `INSERT INTO users (openId, name, email, password, loginMethod, createdAt, updatedAt, lastSignedIn) 
     VALUES (?, ?, ?, ?, 'local', NOW(), NOW(), NOW())
     ON DUPLICATE KEY UPDATE name = VALUES(name), password = VALUES(password)`,
    [revisor.openId, revisor.name, revisor.email, passwordHash]
  );
  
  const [userResult] = await connection.execute(
    `SELECT id FROM users WHERE openId = ?`,
    [revisor.openId]
  );
  const userId = userResult[0].id;
  revisorIds.push(userId);
  
  await connection.execute(
    `INSERT INTO user_profiles (userId, feedbackRole, createdAt, updatedAt)
     VALUES (?, 'REVISOR', NOW(), NOW())
     ON DUPLICATE KEY UPDATE feedbackRole = 'REVISOR'`,
    [userId]
  );
  
  console.log(`  ✓ Revisor: ${revisor.name} (${revisor.email})`);
}

// Inserir Taquígrafos
const taquigrafos = [
  { email: "taquigrafo1@test.com", name: "Lucas Almeida", openId: `taq1_${Date.now()}` },
  { email: "taquigrafo2@test.com", name: "Beatriz Rocha", openId: `taq2_${Date.now()}` },
  { email: "taquigrafo3@test.com", name: "Rafael Mendes", openId: `taq3_${Date.now()}` },
];

const taquigrafoIds = [];
for (const taquigrafo of taquigrafos) {
  await connection.execute(
    `INSERT INTO users (openId, name, email, password, loginMethod, createdAt, updatedAt, lastSignedIn) 
     VALUES (?, ?, ?, ?, 'local', NOW(), NOW(), NOW())
     ON DUPLICATE KEY UPDATE name = VALUES(name), password = VALUES(password)`,
    [taquigrafo.openId, taquigrafo.name, taquigrafo.email, passwordHash]
  );
  
  const [userResult] = await connection.execute(
    `SELECT id FROM users WHERE openId = ?`,
    [taquigrafo.openId]
  );
  const userId = userResult[0].id;
  taquigrafoIds.push(userId);
  
  await connection.execute(
    `INSERT INTO user_profiles (userId, feedbackRole, createdAt, updatedAt)
     VALUES (?, 'TAQUIGRAFO', NOW(), NOW())
     ON DUPLICATE KEY UPDATE feedbackRole = 'TAQUIGRAFO'`,
    [userId]
  );
  
  console.log(`  ✓ Taquígrafo: ${taquigrafo.name} (${taquigrafo.email})`);
}

console.log("\n📋 Inserindo feedbacks...");

// Criar feedbacks de exemplo
const feedbacks = [
  {
    revisorId: revisorIds[0],
    taquigId: taquigrafoIds[0],
    type: "CORRETIVO",
    title: "Atenção aos termos técnicos",
    content: "Observei alguns termos técnicos que precisam ser padronizados conforme o glossário. Por favor, consulte a seção de Padronização.",
    sessionNum: 78123,
    rating: 3,
    isRead: false
  },
  {
    revisorId: revisorIds[1],
    taquigId: taquigrafoIds[1],
    type: "POSITIVO",
    title: "Excelente trabalho na sessão 78124",
    content: "Parabéns pelo trabalho impecável! A transcrição estava clara e sem erros.",
    sessionNum: 78124,
    rating: 5,
    isRead: true
  },
  {
    revisorId: revisorIds[0],
    taquigId: taquigrafoIds[2],
    type: "CORRETIVO",
    title: "Pontuação precisa ser revisada",
    content: "Notei alguns problemas de pontuação que afetam a clareza do texto. Vamos revisar juntos?",
    sessionNum: 78125,
    rating: 3,
    isRead: false
  },
  {
    revisorId: revisorIds[2],
    taquigId: taquigrafoIds[0],
    type: "POSITIVO",
    title: "Melhora significativa",
    content: "Percebi uma melhora significativa na qualidade das transcrições. Continue assim!",
    sessionNum: 78126,
    rating: 4,
    isRead: true
  },
  {
    revisorId: revisorIds[1],
    taquigId: taquigrafoIds[2],
    type: "CORRETIVO",
    title: "Abreviações não padronizadas",
    content: "Algumas abreviações utilizadas não estão de acordo com o padrão. Por favor, consulte o glossário.",
    sessionNum: 78127,
    rating: 3,
    isRead: false
  },
];

const feedbackIds = [];
for (const feedback of feedbacks) {
  const [result] = await connection.execute(
    `INSERT INTO feedbacks (revisorId, taquigId, type, title, content, sessionNum, rating, isRead, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
    [feedback.revisorId, feedback.taquigId, feedback.type, feedback.title, feedback.content, feedback.sessionNum, feedback.rating, feedback.isRead]
  );
  feedbackIds.push(result.insertId);
  console.log(`  ✓ Feedback: ${feedback.title} (Sessão ${feedback.sessionNum})`);
}

console.log("\n💬 Inserindo comentários...");

// Adicionar comentários em alguns feedbacks
const comments = [
  { feedbackId: feedbackIds[0], userId: taquigrafoIds[0], content: "Obrigado pelo feedback! Vou consultar o glossário." },
  { feedbackId: feedbackIds[0], userId: revisorIds[0], content: "Ótimo! Qualquer dúvida, estou à disposição." },
  { feedbackId: feedbackIds[1], userId: taquigrafoIds[1], content: "Muito obrigado! Fico feliz com o reconhecimento." },
  { feedbackId: feedbackIds[2], userId: taquigrafoIds[2], content: "Vou prestar mais atenção à pontuação. Quando podemos revisar?" },
];

for (const comment of comments) {
  await connection.execute(
    `INSERT INTO comments (feedbackId, userId, content, createdAt, updatedAt)
     VALUES (?, ?, ?, NOW(), NOW())`,
    [comment.feedbackId, comment.userId, comment.content]
  );
  console.log(`  ✓ Comentário adicionado ao feedback #${comment.feedbackId}`);
}

console.log("\n👍 Inserindo reações...");

// Adicionar reações
const reactions = [
  { feedbackId: feedbackIds[0], userId: taquigrafoIds[0], type: "ENTENDI" },
  { feedbackId: feedbackIds[0], userId: taquigrafoIds[0], type: "VOU_MELHORAR" },
  { feedbackId: feedbackIds[1], userId: taquigrafoIds[1], type: "OBRIGADO" },
  { feedbackId: feedbackIds[2], userId: taquigrafoIds[2], type: "ENTENDI" },
  { feedbackId: feedbackIds[3], userId: taquigrafoIds[0], type: "OBRIGADO" },
];

for (const reaction of reactions) {
  await connection.execute(
    `INSERT INTO reactions (feedbackId, userId, type, createdAt)
     VALUES (?, ?, ?, NOW())
     ON DUPLICATE KEY UPDATE type = VALUES(type)`,
    [reaction.feedbackId, reaction.userId, reaction.type]
  );
  console.log(`  ✓ Reação ${reaction.type} no feedback #${reaction.feedbackId}`);
}

console.log("\n📢 Inserindo avisos...");

// Pegar ID de um diretor para ser o criador dos avisos
const [directorResult] = await connection.execute(
  `SELECT u.id FROM users u 
   INNER JOIN user_profiles up ON u.id = up.userId 
   WHERE up.feedbackRole = 'DIRETOR' LIMIT 1`
);
const directorId = directorResult[0].id;

// Criar avisos
const avisos = [
  {
    title: "Sessão Extraordinária - 10/11/2025",
    content: "Haverá uma sessão extraordinária no dia 10/11/2025 às 14h. Todos os taquígrafos devem estar presentes.",
    type: "URGENTE",
    targets: JSON.stringify(["TAQUIGRAFO"])
  },
  {
    title: "Atualização do Glossário",
    content: "O glossário de padronização foi atualizado com novos termos técnicos. Por favor, consultem a seção de Padronização.",
    type: "COTIDIANO",
    targets: JSON.stringify(["TODOS"])
  },
  {
    title: "Lembrete: Prazo de Revisão",
    content: "Lembramos que o prazo para revisão das transcrições é de 48 horas após a sessão.",
    type: "RECORRENTE",
    targets: JSON.stringify(["REVISOR"])
  },
];

for (const aviso of avisos) {
  await connection.execute(
    `INSERT INTO avisos (title, content, type, targets, publishAt, userId, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, NOW(), ?, NOW(), NOW())`,
    [aviso.title, aviso.content, aviso.type, aviso.targets, directorId]
  );
  console.log(`  ✓ Aviso: ${aviso.title} (${aviso.type})`);
}

console.log("\n📖 Inserindo termos de padronização...");

// Criar termos de padronização
const termos = [
  { term: "Prescrito", definition: "Projeto de lei que perdeu a validade por decurso de prazo." },
  { term: "Plenário", definition: "Local onde ocorrem as sessões deliberativas da Câmara dos Deputados." },
  { term: "Quórum", definition: "Número mínimo de parlamentares presentes necessário para a realização de uma sessão." },
  { term: "Emenda", definition: "Proposta de modificação de um projeto de lei em tramitação." },
  { term: "Relatoria", definition: "Função de analisar e emitir parecer sobre proposições legislativas." },
  { term: "Obstrução", definition: "Estratégia parlamentar para impedir ou retardar votações." },
  { term: "Aparte", definition: "Interrupção breve da fala de um parlamentar por outro, com sua permissão." },
  { term: "Comissão", definition: "Órgão técnico composto por deputados para análise de matérias específicas." },
  { term: "Pauta", definition: "Relação de matérias a serem apreciadas em uma sessão." },
  { term: "Votação Nominal", definition: "Votação em que é registrado o voto de cada parlamentar." },
];

// Usar o mesmo diretor que criou os avisos
for (const termo of termos) {
  const [result] = await connection.execute(
    `INSERT INTO padronizacao (term, definition, userId, createdAt, updatedAt)
     VALUES (?, ?, ?, NOW(), NOW())`,
    [termo.term, termo.definition, directorId]
  );
  console.log(`  ✓ Termo: ${termo.term}`);
}

console.log("\n✅ Seed de produção concluído com sucesso!");
console.log("\n📊 Resumo:");
console.log(`  • 3 Diretores`);
console.log(`  • 3 Revisores`);
console.log(`  • 3 Taquígrafos`);
console.log(`  • ${feedbacks.length} Feedbacks`);
console.log(`  • ${comments.length} Comentários`);
console.log(`  • ${reactions.length} Reações`);
console.log(`  • ${avisos.length} Avisos`);
console.log(`  • ${termos.length} Termos de Padronização`);
console.log("\n🔑 Senha padrão para todos os usuários: abccbaabc");

await connection.end();
