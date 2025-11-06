import { drizzle } from "drizzle-orm/mysql2";
import * as schema from "../drizzle/schema";
const db = drizzle(process.env.DATABASE_URL!, { schema, mode: "default" });

async function main() {
  console.log("🌱 Iniciando seed do banco de dados...\n");

  try {
    // Criar usuários de exemplo
    console.log("📝 Criando usuários...");
    
    const [master] = await db.insert(schema.users).values({
      openId: "master-openid-001",
      name: "Administrador Master",
      email: "master@camara.leg.br",
      role: "MASTER",
    }).$returningId();

    const [diretor] = await db.insert(schema.users).values({
      openId: "diretor-openid-001",
      name: "João Silva - Diretor",
      email: "diretor@camara.leg.br",
      role: "DIRETOR",

    }).$returningId();

    const [revisor1] = await db.insert(schema.users).values({
      openId: "revisor-openid-001",
      name: "Maria Santos - Revisora",
      email: "maria.revisor@camara.leg.br",
      role: "REVISOR",

    }).$returningId();

    const [revisor2] = await db.insert(schema.users).values({
      openId: "revisor-openid-002",
      name: "Carlos Oliveira - Revisor",
      email: "carlos.revisor@camara.leg.br",
      role: "REVISOR",

    }).$returningId();

    const [taquig1] = await db.insert(schema.users).values({
      openId: "taquig-openid-001",
      name: "Ana Paula - Taquígrafa",
      email: "ana.taquig@camara.leg.br",
      role: "TAQUIGRAFO",

    }).$returningId();

    const [taquig2] = await db.insert(schema.users).values({
      openId: "taquig-openid-002",
      name: "Pedro Costa - Taquígrafo",
      email: "pedro.taquig@camara.leg.br",
      role: "TAQUIGRAFO",

    }).$returningId();

    const [taquig3] = await db.insert(schema.users).values({
      openId: "taquig-openid-003",
      name: "Juliana Lima - Taquígrafa",
      email: "juliana.taquig@camara.leg.br",
      role: "TAQUIGRAFO",

    }).$returningId();

    console.log("✅ Usuários criados com sucesso!");
    console.log(`   - Master: master@camara.leg.br`);
    console.log(`   - Diretor: diretor@camara.leg.br`);
    console.log(`   - Revisores: maria.revisor@camara.leg.br`);
    console.log(`   - Taquígrafos: ana.taquig@camara.leg.br\n`);

    // Criar feedbacks de exemplo
    console.log("📝 Criando feedbacks de exemplo...");
    
    const [feedback1] = await db.insert(schema.feedbacks).values({
      type: "CORRETIVO",
      title: "Atenção à pontuação",
      content: "Observei que em alguns trechos da sessão você esqueceu de adicionar vírgulas em orações intercaladas. Lembre-se de revisar a pontuação antes de finalizar.",
      rating: 3.5,
      sessionType: "PLENARIO",
      sessionNum: "045.2.55.O",
      categories: ["Pontuação", "Revisão"],
      revisorId: revisor1.id,
      taquigId: taquig1.id,
      isRead: false,
    }).$returningId();

    const [feedback2] = await db.insert(schema.feedbacks).values({
      type: "POSITIVO",
      title: "Excelente trabalho!",
      content: "Parabéns pelo capricho na transcrição da sessão de hoje. A formatação estava impecável e não identifiquei nenhum erro. Continue assim!",
      rating: 5.0,
      sessionType: "COMISSAO",
      sessionNum: "1234/24",
      categories: ["Formatação", "Qualidade"],
      revisorId: revisor2.id,
      taquigId: taquig2.id,
      isRead: true,
      readAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 horas atrás
    }).$returningId();

    const [feedback3] = await db.insert(schema.feedbacks).values({
      type: "CORRETIVO",
      title: "Siglas e abreviaturas",
      content: "Verifiquei que algumas siglas não foram expandidas na primeira menção. Lembre-se: sempre escrever por extenso na primeira vez, seguido da sigla entre parênteses.",
      rating: 3.0,
      sessionType: "PLENARIO",
      sessionNum: "046.2.55.O",
      categories: ["Padronização", "Siglas"],
      revisorId: revisor1.id,
      taquigId: taquig3.id,
      isRead: false,
    }).$returningId();

    console.log("✅ Feedbacks criados com sucesso!\n");

    // Criar comentários
    console.log("📝 Criando comentários...");
    
    await db.insert(schema.comments).values({
      content: "Obrigada pelo feedback! Vou prestar mais atenção nas vírgulas.",
      userId: taquig1.id,
      feedbackId: feedback1.id,
    });

    await db.insert(schema.comments).values({
      content: "Muito obrigado! Fico feliz que tenha gostado do trabalho.",
      userId: taquig2.id,
      feedbackId: feedback2.id,
    });

    console.log("✅ Comentários criados com sucesso!\n");

    // Criar reações
    console.log("📝 Criando reações...");
    
    await db.insert(schema.reactions).values({
      type: "ENTENDI",
      userId: taquig1.id,
      feedbackId: feedback1.id,
    });

    await db.insert(schema.reactions).values({
      type: "OBRIGADO",
      userId: taquig2.id,
      feedbackId: feedback2.id,
    });

    await db.insert(schema.reactions).values({
      type: "VOU_MELHORAR",
      userId: taquig3.id,
      feedbackId: feedback3.id,
    });

    console.log("✅ Reações criadas com sucesso!\n");

    // Criar avisos
    console.log("📝 Criando avisos...");
    
    await db.insert(schema.avisos).values({
      title: "Nova padronização de siglas",
      content: "A partir de hoje, todas as siglas devem seguir o novo padrão estabelecido pela coordenação. Consulte a área de padronização para mais detalhes.",
      type: "URGENTE",
      targets: ["TAQUIGRAFO", "REVISOR"],
      publishAt: new Date(),

      userId: diretor.id,
    });

    await db.insert(schema.avisos).values({
      title: "Lembrete: Prazo de entrega",
      content: "Lembramos que o prazo para entrega das transcrições da semana é toda sexta-feira até às 18h.",
      type: "RECORRENTE",
      targets: ["TAQUIGRAFO"],
      publishAt: new Date(),

      userId: revisor1.id,
    });

    await db.insert(schema.avisos).values({
      title: "Reunião de equipe",
      content: "Haverá reunião de equipe na próxima segunda-feira às 10h para discutir melhorias no processo.",
      type: "COTIDIANO",
      targets: ["MASTER", "DIRETOR", "REVISOR", "TAQUIGRAFO"],
      publishAt: new Date(),

      userId: diretor.id,
    });

    console.log("✅ Avisos criados com sucesso!\n");

    // Criar termos de padronização
    console.log("📝 Criando termos de padronização...");
    
    await db.insert(schema.padronizacao).values({
      term: "PL",
      definition: "Projeto de Lei - sempre escrever por extenso na primeira menção: Projeto de Lei (PL)",
      createdBy: diretor.id,
    });

    await db.insert(schema.padronizacao).values({
      term: "art.",
      definition: "Artigo - abreviatura padrão para referências a artigos de lei",
      createdBy: revisor1.id,
    });

    await db.insert(schema.padronizacao).values({
      term: "Sr./Sra.",
      definition: "Senhor/Senhora - usar sempre com ponto abreviativo",
      createdBy: revisor2.id,
    });

    await db.insert(schema.padronizacao).values({
      term: "V. Exa.",
      definition: "Vossa Excelência - tratamento protocolar para deputados",
      createdBy: diretor.id,
    });

    console.log("✅ Termos de padronização criados com sucesso!\n");

    // Criar templates
    console.log("📝 Criando templates...");
    
    await db.insert(schema.templates).values({
      title: "Feedback de pontuação",
      content: "Observei alguns problemas de pontuação na sessão [NÚMERO]. Especificamente: [DETALHAR PROBLEMAS]. Por favor, revise esses pontos.",
      userId: revisor1.id,
    });

    await db.insert(schema.templates).values({
      title: "Feedback positivo padrão",
      content: "Parabéns pelo excelente trabalho na sessão [NÚMERO]! A transcrição estava clara, bem formatada e sem erros. Continue assim!",
      userId: revisor2.id,
    });

    console.log("✅ Templates criados com sucesso!\n");

    // Criar logs de auditoria
    console.log("📝 Criando logs de auditoria...");
    
    await db.insert(schema.auditLogs).values({
      action: "CREATE_FEEDBACK",
      entityType: "FEEDBACK",
      entityId: feedback1.id.toString(),
      details: { type: "CORRETIVO" },
      ipAddress: "192.168.1.100",
      userAgent: "Mozilla/5.0",
      userId: revisor1.id,
    });

    await db.insert(schema.auditLogs).values({
      action: "READ_FEEDBACK",
      entityType: "FEEDBACK",
      entityId: feedback2.id.toString(),
      details: null,
      ipAddress: "192.168.1.101",
      userAgent: "Mozilla/5.0",
      userId: taquig2.id,
    });

    console.log("✅ Logs de auditoria criados com sucesso!\n");

    console.log("🎉 Seed concluído com sucesso!");
    console.log("\n📊 Resumo:");
    console.log("   - 7 usuários");
    console.log("   - 3 feedbacks");
    console.log("   - 2 comentários");
    console.log("   - 3 reações");
    console.log("   - 3 avisos");
    console.log("   - 4 termos de padronização");
    console.log("   - 2 templates");
    console.log("   - 2 logs de auditoria");
    console.log("\n✅ Banco de dados populado e pronto para uso!");

  } catch (error) {
    console.error("❌ Erro ao executar seed:", error);
    throw error;
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => {
    process.exit(0);
  });
