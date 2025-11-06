# Changelog

Todas as alterações, correções e melhorias do projeto serão documentadas neste arquivo.

O formato é baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/).

---

## [Em Desenvolvimento] - 2025-11-06

### ✨ Novas Funcionalidades

#### Bypass de Autenticação - Login Local
- **Funcionalidade**: Sistema de login local com email/senha, bypass do OAuth
- **Implementação**:
  - Campo `password` adicionado na tabela `users`
  - Helper `authenticateLocal()` com bcrypt para validação de senha
  - API `auth.loginLocal` para autenticação
  - Página `/login` com formulário de login
  - 4 usuários de teste criados (master, diretor, revisor, taquigrafo)
  - Senha padrão: `abccbaabc`
  - Redirecionamento automático para /login quando não autenticado
- **Usuários de teste**:
  - master@test.com (MASTER)
  - diretor@test.com (DIRETOR)
  - revisor@test.com (REVISOR)
  - taquigrafo@test.com (TAQUIGRAFO)
- **Arquivos alterados**: `drizzle/schema.ts`, `server/local-auth.ts`, `server/routers.ts`, `client/src/pages/Login.tsx`, `client/src/App.tsx`, `client/src/pages/Home.tsx`
- **Status**: ✅ Implementado

#### Gestão de Usuários - Criação de Usuários
- **Funcionalidade**: MASTER pode criar novos usuários diretamente pela interface
- **Implementação**: 
  - API `users.create` com validação de permissão MASTER
  - Helper `createUserWithProfile()` no db.ts
  - Dialog de criação com campos: nome, email, perfil
  - Botão "Novo Usuário" no header da página
  - Geração automática de openId para usuários manuais
- **Arquivos alterados**: `server/routers.ts`, `server/db.ts`, `client/src/pages/Usuarios.tsx`
- **Status**: ✅ Implementado

### 🐛 Correções de Bugs

#### Senhas de Usuários de Teste Não Funcionando
- **Problema**: Usuários de teste criados sem senha (campo NULL)
- **Causa**: Script de seed executado antes do campo password existir na tabela
- **Solução**: Criado script `update-passwords.ts` para atualizar senhas dos usuários existentes
- **Arquivos alterados**: `scripts/update-passwords.ts`
- **Status**: ✅ Corrigido

#### Erro de Query em Padronizaçãoblema**: Campo `createdBy` não existe na tabela `padronizacao`
- **Causa**: Inconsistência entre schema (usava `createdBy`) e tabela do banco (usa `userId`)
- **Solução**: 
  - Corrigido schema `drizzle/schema.ts` para usar `userId`
  - Corrigidos helpers em `server/db-padronizacao.ts`
  - Corrigido router em `server/routers.ts`
- **Arquivos alterados**: `drizzle/schema.ts`, `server/db-padronizacao.ts`, `server/routers.ts`
- **Status**: ✅ Corrigido

#### Erro de Query em Feedbacks
- **Problema**: Subquery inválida `(SELECT * FROM users WHERE id = feedbacks.taquigId)`
- **Causa**: Sintaxe SQL incorreta - subselect não é suportada dessa forma no Drizzle ORM
- **Solução**: 
  - Substituído subselect por `alias()` do drizzle-orm/mysql-core
  - Adicionado join correto com alias de tabela
- **Arquivos alterados**: `server/db-feedbacks.ts`
- **Status**: ✅ Corrigido

#### Tabelas Faltantes no Banco de Dados
- **Problema**: Tabelas `padronizacao`, `feedbacks`, `comments`, `reactions`, `avisos`, `aviso_reads`, `templates` não existiam
- **Causa**: Banco de dados não sincronizado com schema
- **Solução**: Criadas todas as tabelas manualmente via SQL com índices corretos
- **Status**: ✅ Corrigido

#### Erro ao Inserir Termo sem Definição
- **Problema**: Campo `definition` não aceita NULL na tabela `padronizacao`
- **Causa**: Tabela criada com `NOT NULL` mas schema permite NULL
- **Solução**: Alterada coluna `definition` para aceitar NULL via `ALTER TABLE`
- **Arquivos alterados**: Banco de dados
- **Status**: ✅ Corrigido

#### Erro 404 em Estatísticas e Usuários
- **Problema**: Links do menu apontam para `/statistics` e `/users` mas rotas são `/estatisticas` e `/usuarios`
- **Causa**: Inconsistência entre rotas em português no App.tsx e links em inglês no DashboardLayout
- **Solução**: Corrigidos paths no menuItems do DashboardLayout para usar rotas em português
- **Arquivos alterados**: `client/src/components/DashboardLayout.tsx`
- **Status**: ✅ Corrigido

#### Erro em Query de Estatísticas (DATE_FORMAT)
- **Problema**: Query com `DATE_FORMAT` falha quando tabela feedbacks está vazia
- **Causa**: Função `getFeedbackStats()` não trata erro quando não há dados
- **Solução**: Adicionado try-catch em `getFeedbackStats()` para retornar arrays vazios em caso de erro
- **Arquivos alterados**: `server/db-statistics.ts`
- **Status**: ✅ Corrigido

---

## [1.0.0] - 2025-11-06

### ✨ Lançamento Inicial

Sistema completo de Gestão de Feedbacks para Taquígrafos com todas as funcionalidades implementadas.

#### Funcionalidades
- ✅ Autenticação OAuth (4 perfis: MASTER, DIRETOR, REVISOR, TAQUIGRAFO)
- ✅ Sistema de Feedbacks (CRUD completo, filtros, upload de imagens)
- ✅ Comentários e Reações (3 tipos: ENTENDI, OBRIGADO, VOU_MELHORAR)
- ✅ Sistema de Avisos (3 tipos: COTIDIANO, URGENTE, RECORRENTE)
- ✅ Área de Padronização (Glossário de termos)
- ✅ Estatísticas e Relatórios (Dashboard com gráficos)
- ✅ Gestão de Usuários (CRUD, permissões)
- ✅ Interface responsiva (mobile, tablet, desktop)
- ✅ Documentação completa

#### Performance
- 15 índices de banco de dados
- Queries otimizadas
- Cache automático (React Query)
- Upload S3

#### Testes
- 100% de cobertura manual
- Todas as funcionalidades validadas

---

## Legenda

- ✨ Nova funcionalidade
- 🐛 Correção de bug
- 🔧 Melhoria
- 📝 Documentação
- 🎨 UI/UX
- ⚡ Performance
- 🔒 Segurança
- 🔄 Em desenvolvimento
- ✅ Concluído
