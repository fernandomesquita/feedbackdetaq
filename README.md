# Sistema de Gestão de Feedbacks para Taquígrafos

Sistema web desenvolvido para facilitar a comunicação entre revisores e taquígrafos da Câmara dos Deputados através de feedbacks estruturados, avisos e padronização de termos.

## 📋 Funcionalidades

### 🔐 Autenticação e Autorização
- Login via OAuth (Manus)
- 4 perfis de usuário: **MASTER**, **DIRETOR**, **REVISOR**, **TAQUIGRAFO**
- Controle de acesso baseado em perfis (RBAC)

### 💬 Sistema de Feedbacks
- **Tipos**: Corretivo e Positivo
- **Campos**: Título, conteúdo, tipo de sessão, categorias, imagem
- Criação restrita a REVISOR, DIRETOR e MASTER
- Visualização adaptada por perfil
- Marcação automática como lido
- Filtros por tipo, status e busca
- Comentários e reações (Entendi, Obrigado, Vou Melhorar)

### 📢 Sistema de Avisos
- **Tipos**: Cotidiano, Urgente, Recorrente
- Criação restrita a MASTER e DIRETOR
- Controle de leitura por usuário
- Filtros e separação lidos/não lidos

### 📚 Área de Padronização
- Glossário de termos padronizados
- CRUD completo (MASTER, DIRETOR, REVISOR)
- Busca em tempo real
- Exibição alfabética

### 📊 Estatísticas e Relatórios
- Dashboard com métricas gerais
- Gráficos interativos (recharts)
- Análise por tipo, status, período
- Rankings de top usuários (MASTER/DIRETOR)
- Índice de qualidade

### 👥 Gestão de Usuários
- Listagem completa (MASTER)
- Edição de perfis
- Exclusão com validações
- Estatísticas por perfil

## 🛠️ Stack Tecnológica

### Backend
- **Runtime**: Node.js 22
- **Framework**: Express 4
- **API**: tRPC 11 (type-safe)
- **ORM**: Drizzle ORM
- **Banco de Dados**: MySQL/TiDB
- **Autenticação**: Manus OAuth + JWT
- **Upload**: Multer + S3
- **Validação**: Zod

### Frontend
- **Framework**: React 19
- **Build Tool**: Vite 7
- **Routing**: Wouter
- **Styling**: Tailwind CSS 4
- **UI Components**: shadcn/ui
- **Data Fetching**: tRPC + React Query
- **Forms**: React Hook Form
- **Charts**: Recharts
- **Date**: date-fns

## 📁 Estrutura do Projeto

```
sistema-feedback-taquigrafia/
├── client/                    # Frontend React
│   ├── public/               # Assets estáticos
│   └── src/
│       ├── components/       # Componentes reutilizáveis
│       │   ├── ui/          # shadcn/ui components
│       │   ├── DashboardLayout.tsx
│       │   ├── FeedbackComments.tsx
│       │   ├── FeedbackReactions.tsx
│       │   └── ImageUpload.tsx
│       ├── contexts/        # React contexts
│       ├── hooks/           # Custom hooks
│       │   └── useAuthWithProfile.ts
│       ├── lib/
│       │   └── trpc.ts      # tRPC client
│       ├── pages/           # Páginas
│       │   ├── Dashboard.tsx
│       │   ├── Feedbacks.tsx
│       │   ├── FeedbackDetail.tsx
│       │   ├── FeedbackNew.tsx
│       │   ├── Avisos.tsx
│       │   ├── AvisoNew.tsx
│       │   ├── Padronizacao.tsx
│       │   ├── Estatisticas.tsx
│       │   └── Usuarios.tsx
│       ├── App.tsx          # Rotas
│       └── main.tsx         # Entry point
├── server/                   # Backend Express + tRPC
│   ├── _core/               # Framework core
│   ├── db.ts                # Database helpers
│   ├── db-feedbacks.ts      # Feedbacks helpers
│   ├── db-comments.ts       # Comments/Reactions helpers
│   ├── db-avisos.ts         # Avisos helpers
│   ├── db-padronizacao.ts   # Padronização helpers
│   ├── db-statistics.ts     # Statistics helpers
│   ├── routers.ts           # tRPC routers
│   ├── upload.ts            # Upload handler
│   └── storage.ts           # S3 storage
├── drizzle/                  # Database
│   └── schema.ts            # Database schema
├── shared/                   # Shared code
├── storage/                  # S3 helpers
├── scripts/                  # Utility scripts
│   └── seed.ts              # Database seed
├── OTIMIZACOES.md           # Performance docs
├── PLANO_DE_TRABALHO.md     # Development plan
└── todo.md                  # Task tracking
```

## 🗄️ Modelo de Dados

### Tabelas Principais

1. **users** - Usuários do sistema (OAuth)
2. **user_profiles** - Perfis específicos (MASTER/DIRETOR/REVISOR/TAQUIGRAFO)
3. **feedbacks** - Feedbacks corretivos e positivos
4. **comments** - Comentários em feedbacks
5. **reactions** - Reações (ENTENDI/OBRIGADO/VOU_MELHORAR)
6. **avisos** - Avisos do sistema
7. **aviso_reads** - Controle de leitura de avisos
8. **padronizacao** - Glossário de termos
9. **templates** - Templates de feedback (futuro)
10. **audit_logs** - Logs de auditoria (futuro)

## ⚠️ ALERTAS IMPORTANTES

### 🗄️ Deploy e Atualização de Banco de Dados

**ATENÇÃO**: Este projeto usa **dois bancos de dados diferentes**:

1. **TiDB Local** (desenvolvimento no Manus)
   - URL: Configurada automaticamente no ambiente Manus
   - Uso: Desenvolvimento e testes locais

2. **MySQL Railway** (produção)
   - URL: `$mysql_public_url` (nos segredos do Manus)
   - Uso: Deploy em produção via Railway

**PROCEDIMENTO OBRIGATÓRIO PARA DEPLOY:**

Sempre que fizer alterações no schema (`drizzle/schema.ts`), você DEVE atualizar AMBOS os bancos:

```bash
# 1. Atualizar banco LOCAL (TiDB) - desenvolvimento
pnpm db:push

# 2. Atualizar banco RAILWAY (MySQL) - produção
DATABASE_URL="$mysql_public_url" pnpm db:push
```

**CHECKLIST ANTES DE CADA PUSH PARA GITHUB/RAILWAY:**

- [ ] Schema atualizado no banco LOCAL (TiDB)?
- [ ] Schema atualizado no banco RAILWAY (MySQL)?
- [ ] Testado localmente?
- [ ] Commit e push para GitHub realizado?
- [ ] Variáveis de ambiente configuradas no Railway?

**IMPORTANTE**: Nunca assuma que o banco está sincronizado. Sempre execute os dois comandos acima antes de fazer deploy!

### 🌱 Seed de Produção

**ATENÇÃO**: Para popular o banco de produção (Railway), use a variável `mysql_public_url`:

```bash
# Executar seed no banco de PRODUÇÃO (Railway MySQL)
DATABASE_URL="$mysql_public_url" node seed-production.mjs
```

**NÃO use** `DATABASE_URL` sem especificar, pois ela aponta para o TiDB local!

**Dados inseridos pelo seed:**
- 9 usuários de teste (3 diretores, 3 revisores, 3 taquígrafos)
- 5 feedbacks de exemplo
- 4 comentários
- 5 reações
- 3 avisos
- 10 termos de padronização
- Senha padrão: `abccbaabc`

### 🔄 Commit e Push

Quando mencionado "commit" ou "push", sempre se refere a:
- **GitHub**: `https://github.com/fernandomesquita/feedbackdetaq`
- **Railway**: Deploy automático via GitHub

---

## 🚀 Como Executar

### Pré-requisitos
- Node.js 22+
- MySQL/TiDB
- Conta Manus (para OAuth)

### Instalação

```bash
# Instalar dependências
pnpm install

# Configurar variáveis de ambiente
# (já configuradas automaticamente no ambiente Manus)

# Executar migrations
pnpm db:push

# (Opcional) Popular banco com dados de teste
pnpm tsx scripts/seed.ts

# Iniciar servidor de desenvolvimento
pnpm dev
```

### Produção

```bash
# Build
pnpm build

# Iniciar
pnpm start
```

## 🔑 Perfis de Usuário

### MASTER
- Acesso total ao sistema
- Gerenciar usuários
- Criar/editar/deletar tudo
- Visualizar estatísticas completas

### DIRETOR
- Criar avisos
- Criar feedbacks
- Gerenciar padronização
- Visualizar estatísticas completas

### REVISOR
- Criar feedbacks para taquígrafos
- Gerenciar padronização
- Comentar em feedbacks

### TAQUIGRAFO
- Visualizar feedbacks recebidos
- Comentar e reagir
- Marcar como lido
- Consultar padronização

## 📊 APIs Principais

### Autenticação
- `auth.me` - Dados do usuário logado
- `auth.logout` - Logout
- `auth.updateProfile` - Atualizar perfil

### Feedbacks
- `feedbacks.create` - Criar feedback
- `feedbacks.list` - Listar feedbacks (com filtros)
- `feedbacks.getById` - Buscar por ID
- `feedbacks.update` - Atualizar
- `feedbacks.delete` - Deletar
- `feedbacks.markAsRead` - Marcar como lido

### Comentários e Reações
- `comments.create` - Criar comentário
- `comments.list` - Listar comentários
- `comments.delete` - Deletar comentário
- `reactions.toggle` - Adicionar/remover reação
- `reactions.list` - Listar reações

### Avisos
- `avisos.create` - Criar aviso
- `avisos.list` - Listar avisos
- `avisos.markAsRead` - Marcar como lido

### Padronização
- `padronizacao.create` - Criar termo
- `padronizacao.list` - Listar termos
- `padronizacao.update` - Atualizar termo
- `padronizacao.delete` - Deletar termo

### Estatísticas
- `statistics.general` - Métricas gerais
- `statistics.feedbacks` - Análise de feedbacks
- `statistics.byTaquigrafo` - Por taquígrafo
- `statistics.byRevisor` - Por revisor
- `statistics.topTaquigrafos` - Ranking
- `statistics.topRevisores` - Ranking
- `statistics.reactions` - Análise de reações
- `statistics.averageRating` - Índice de qualidade

### Usuários
- `users.list` - Listar usuários
- `users.listByRole` - Por perfil
- `users.getById` - Buscar por ID
- `users.updateProfile` - Atualizar perfil
- `users.delete` - Deletar usuário

## 🎨 Design System

### Cores
- **Primary**: Azul (tema principal)
- **Corretivo**: Vermelho (#ef4444)
- **Positivo**: Verde (#22c55e)
- **Entendi**: Azul (#3b82f6)
- **Obrigado**: Roxo (#8b5cf6)
- **Vou Melhorar**: Laranja (#f59e0b)

### Componentes
- Baseados em shadcn/ui
- Totalmente acessíveis
- Responsivos
- Tema claro/escuro (configurável)

## 📈 Performance

- Queries otimizadas com índices
- Cache automático (React Query)
- Lazy loading de componentes
- Upload otimizado (S3)
- Bundle otimizado (Vite)

Ver [OTIMIZACOES.md](./OTIMIZACOES.md) para detalhes.

## 🔒 Segurança

- Autenticação OAuth
- JWT para sessões
- Validação de dados (Zod)
- RBAC (Role-Based Access Control)
- Proteção contra CSRF
- Sanitização de inputs
- Rate limiting (recomendado para produção)

## 📝 Desenvolvimento

### Adicionar Nova Funcionalidade

1. **Backend**:
   - Adicionar tabela em `drizzle/schema.ts`
   - Executar `pnpm db:push`
   - Criar helpers em `server/db-*.ts`
   - Adicionar rotas em `server/routers.ts`

2. **Frontend**:
   - Criar página em `client/src/pages/`
   - Adicionar rota em `client/src/App.tsx`
   - Usar `trpc.*` hooks para APIs

### Convenções

- **Naming**: camelCase para variáveis, PascalCase para componentes
- **Types**: TypeScript strict mode
- **Commits**: Conventional Commits
- **Code Style**: ESLint + Prettier

## 🐛 Troubleshooting

### Erro de conexão com banco
```bash
# Verificar DATABASE_URL
echo $DATABASE_URL

# Testar conexão
pnpm db:push
```

### Erro de autenticação
```bash
# Verificar variáveis OAuth
echo $OAUTH_SERVER_URL
echo $VITE_APP_ID
```

### Erro de upload
```bash
# Verificar configuração S3
# Variáveis são injetadas automaticamente no ambiente Manus
```

## 📚 Documentação Adicional

- [Plano de Trabalho](./PLANO_DE_TRABALHO.md)
- [Otimizações](./OTIMIZACOES.md)
- [TODO](./todo.md)

## 🤝 Contribuindo

Este é um projeto interno da Câmara dos Deputados. Para contribuir:

1. Faça fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Propriedade da Câmara dos Deputados - Todos os direitos reservados

## 👨‍💻 Desenvolvido por

Sistema desenvolvido com Manus AI - Novembro 2025
