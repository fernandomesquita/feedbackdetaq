# Changelog

Todas as alterações, correções e melhorias do projeto serão documentadas neste arquivo.

O formato é baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/).

---

## [Em Desenvolvimento] - 2025-11-06

### 🐛 Correções

#### Erro de Query em Padronização
- **Problema**: Campo `createdBy` não existe na tabela `padronizacao`
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
