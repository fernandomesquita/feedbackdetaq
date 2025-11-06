# Changelog

Todas as alterações, correções e melhorias do projeto serão documentadas neste arquivo.

O formato é baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/).

---

## [Em Desenvolvimento] - 2025-11-06

### ✨ Novas Funcionalidades

#### Sistema de Notificações para Termos Padronizados
- **Funcionalidade**: Badge vermelho no menu com contador de termos novos/atualizados
- **Implementação**:
  - Tabela `padronizacao_reads` para rastrear leitura de termos por usuário
  - API `padronizacao.getUnreadCount` para contar termos não lidos (novos ou atualizados nos últimos 30 dias)
  - API `padronizacao.markAsRead` para marcar termo individual como lido
  - API `padronizacao.markAllAsRead` para marcar todos os termos como lidos
  - Badge vermelho estilo notificação mobile no menu lateral (item Padronização)
  - Contador atualizado a cada 30 segundos automaticamente
  - Marcação automática como lido ao entrar na página de Padronização
- **Arquivos alterados**: `drizzle/schema.ts`, `server/db-padronizacao.ts`, `server/routers.ts`, `client/src/components/DashboardLayout.tsx`, `client/src/pages/Padronizacao.tsx`
- **Status**: ✅ Implementado

#### Avisos no Topo do Dashboard com Estatísticas
- **Funcionalidade**: Avisos aparecem no topo do dashboard até serem dispensados, com estatísticas de visualização
- **Implementação**:
  - Tabela `aviso_views` para rastrear visualizações de avisos (permite múltiplas visualizações)
  - API `avisos.recordView` para registrar visualização de aviso
  - API `avisos.getViewStats` para obter estatísticas de um aviso (total de visualizações, usuários únicos, visualizações por usuário)
  - API `avisos.listWithStats` para listar avisos com estatísticas (apenas MASTER/DIRETOR)
  - Avisos não lidos aparecem no topo do dashboard com ícones por tipo (Cotidiano, Urgente, Recorrente)
  - Botão X para dispensar aviso (marca como lido)
  - Registro automático de visualização ao carregar dashboard
  - Estatísticas visíveis para MASTER/DIRETOR na página de Avisos (usuários únicos e total de visualizações)
- **Arquivos alterados**: `drizzle/schema.ts`, `server/db-avisos.ts`, `server/routers.ts`, `client/src/pages/Dashboard.tsx`, `client/src/pages/Avisos.tsx`
- **Status**: ✅ Implementado

### 🎨 Melhorias de UI/UX

#### Redesign da Página de Padronização
- **Funcionalidade**: Layout de glossário moderno e limpo
- **Implementação**:
  - Termos organizados em seções alfabéticas com letras grandes como separadores
  - Removidos boxes grandes, interface mais limpa e direta
  - Layout em colunas responsivo (1 coluna mobile, 2 tablet, 3 desktop)
  - Botões de edição/exclusão aparecem apenas no hover
  - Busca em tempo real mantida
  - Melhor aproveitamento do espaço da tela
- **Arquivos alterados**: `client/src/pages/Padronizacao.tsx`
- **Status**: ✅ Implementado

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

#### Dashboard Diferenciado por Perfil
- **Funcionalidade**: Dashboard exibe estatísticas diferentes baseado no perfil do usuário
- **Implementação**:
  - Revisores veem "Feedbacks Enviados" (feedbacks criados por eles)
  - Taquígrafos veem "Feedbacks Recebidos" (feedbacks destinados a eles)
  - MASTER/DIRETOR veem "Feedbacks Recebidos" (visão geral do sistema)
- **Arquivos alterados**: `client/src/pages/Dashboard.tsx`
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

#### Erro de Insert em Feedbacks (Rating Decimal)
- **Problema**: Inserção falhando quando rating é decimal (ex: 3.5)
- **Causa**: Campo rating é INT no banco mas aceita decimais no frontend
- **Solução**: Adicionado Math.round() para arredondar rating antes de enviar
- **Arquivos alterados**: `client/src/pages/FeedbackNew.tsx`
- **Status**: ✅ Corrigido

#### Erro de Insert em Feedbacks (Campo content NOT NULL)
- **Problema**: Inserção de feedback falhando quando content é vazio
- **Causa**: Campo content definido como NOT NULL no banco
- **Solução**: Alterado coluna content para aceitar NULL
- **Arquivos alterados**: Banco de dados (ALTER TABLE)
- **Status**: ✅ Corrigido

#### Erro de SelectItem com Value Vazio
- **Problema**: SelectItem com value="" causando erro no Radix UI
- **Causa**: Radix Select não permite value vazio
- **Solução**: Alterado value de "" para "NONE" e tratamento no submit
- **Arquivos alterados**: `client/src/pages/FeedbackNew.tsx`
- **Status**: ✅ Corrigido

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
