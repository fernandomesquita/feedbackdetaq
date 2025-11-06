# Sistema de Feedback Taquigrafia - TODO

## FASE 1: Setup e Configuração Inicial (2-3 dias)
- [x] Criar projeto Next.js com estrutura full-stack
- [x] Configurar schema do banco de dados (Drizzle ORM)
- [x] Criar seed com usuários de exemplo
- [x] Criar migrations
- [x] Validar conexão com banco de dados
- [x] Configurar estrutura de tipos TypeScript
- [x] Criar tabela user_profiles para perfis específicos

## FASE 2: Autenticação e Segurança (3-4 dias)
- [x] Criar API de login (OAuth já integrado)
- [x] Criar API de logout
- [x] Criar API de verificação de sessão (me)
- [x] Implementar geração e validação de JWT (já integrado)
- [x] Criar middleware de autenticação (protectedProcedure)
- [x] Implementar RBAC (Role-Based Access Control via feedbackRole)
- [x] Criar helpers de autorização (useAuthWithProfile)
- [ ] Implementar rate limiting (postergar para otimização)
- [ ] Criar sistema de auditoria (logAudit) (implementar junto com funcionalidades)
- [ ] Criar API de consulta de logs de auditoria (implementar junto com funcionalidades)
- [x] Criar página de login
- [x] Implementar redirecionamento baseado em role

## FASE 3: Layout e Navegação (2 dias)
- [ ] Criar DashboardLayout com sidebar
- [ ] Criar Header com informações do usuário
- [ ] Criar Sidebar com navegação por role
- [ ] Criar dashboard do Master
- [ ] Criar dashboard do Diretor
- [ ] Criar dashboard do Revisor
- [ ] Criar dashboard do Taquígrafo
- [ ] Criar componentes de loading states
- [ ] Criar error boundaries
- [ ] Implementar toasts de notificação

## FASE 4: Sistema de Feedbacks (4-5 dias)
- [ ] Criar API GET /api/feedbacks (listar com filtros)
- [ ] Criar API POST /api/feedbacks (criar)
- [ ] Criar API GET /api/feedbacks/[id] (detalhes)
- [ ] Criar API PATCH /api/feedbacks/[id] (editar)
- [ ] Criar API DELETE /api/feedbacks/[id] (deletar)
- [ ] Criar API POST /api/feedbacks/[id]/read (marcar como lido)
- [ ] Criar componente FeedbackCard
- [ ] Criar componente FeedbackForm
- [ ] Criar componente FeedbackDetail
- [ ] Criar componente FeedbackFilters
- [ ] Criar página de listagem do revisor
- [ ] Criar página de criação de feedback
- [ ] Criar página de detalhes do feedback
- [ ] Criar página de listagem do taquígrafo
- [ ] Configurar envio de email (Nodemailer)
- [ ] Criar template de email de novo feedback

## FASE 5: Upload de Imagens (1-2 dias)
- [ ] Configurar integração com S3 (storage)
- [ ] Criar API /api/upload
- [ ] Implementar validação de arquivos
- [ ] Criar componente ImageUpload com drag & drop
- [ ] Implementar preview de imagens
- [ ] Adicionar indicador de progresso
- [ ] Integrar upload no formulário de feedbacks
- [ ] Exibir imagem nos detalhes do feedback

## FASE 6: Comentários e Reações (2 dias)
- [ ] Criar API POST /api/comments (criar comentário)
- [ ] Criar API GET /api/feedbacks/[id]/comments (listar)
- [ ] Criar API POST /api/reactions (adicionar reação)
- [ ] Criar API DELETE /api/reactions/[id] (remover reação)
- [ ] Criar componente CommentList
- [ ] Criar componente CommentForm
- [ ] Criar componente ReactionButtons
- [ ] Criar componente ReactionSummary
- [ ] Integrar comentários na página de detalhes
- [ ] Integrar reações na página de detalhes

## FASE 7: Sistema de Avisos (2 dias)
- [ ] Criar API GET /api/avisos (listar)
- [ ] Criar API POST /api/avisos (criar)
- [ ] Criar API PATCH /api/avisos/[id] (editar)
- [ ] Criar API DELETE /api/avisos/[id] (deletar)
- [ ] Criar API POST /api/avisos/[id]/read (marcar como lido)
- [ ] Criar componente AvisoCard
- [ ] Criar componente AvisoForm
- [ ] Criar componente AvisoList
- [ ] Criar componente AvisoBanner (avisos urgentes)
- [ ] Criar página de avisos do usuário
- [ ] Criar página de gerenciamento de avisos

## FASE 8: Área de Padronização (1-2 dias)
- [ ] Criar API GET /api/padronizacao (listar termos)
- [ ] Criar API POST /api/padronizacao (criar termo)
- [ ] Criar API PATCH /api/padronizacao/[id] (editar)
- [ ] Criar API DELETE /api/padronizacao/[id] (deletar)
- [ ] Criar componente PadronizacaoSearch
- [ ] Criar componente PadronizacaoList
- [ ] Criar componente PadronizacaoForm
- [ ] Criar componente TermCard
- [ ] Criar página de padronização

## FASE 9: Estatísticas e Relatórios (3-4 dias)
- [ ] Criar API GET /api/statistics (métricas gerais)
- [ ] Criar API GET /api/statistics/user/[id] (por usuário)
- [ ] Criar API GET /api/statistics/trends (tendências)
- [ ] Criar API GET /api/reports/export (exportar)
- [ ] Criar componente FeedbackChart
- [ ] Criar componente CategoryChart
- [ ] Criar componente RatingChart
- [ ] Criar componente UserRankingTable
- [ ] Criar dashboard de estatísticas
- [ ] Implementar filtros de data
- [ ] Implementar filtros de usuário
- [ ] Implementar exportação de relatórios (PDF/CSV)

## FASE 10: Gestão de Usuários (2 dias)
- [ ] Criar API GET /api/users (listar)
- [ ] Criar API POST /api/users (criar)
- [ ] Criar API PATCH /api/users/[id] (editar)
- [ ] Criar API DELETE /api/users/[id] (desativar)
- [ ] Criar API POST /api/users/[id]/reset-password (resetar senha)
- [ ] Criar componente UserTable
- [ ] Criar componente UserForm
- [ ] Criar componente UserFilters
- [ ] Criar página de gestão de usuários
- [ ] Implementar busca e filtros

## FASE 11: Cache e Performance (1-2 dias)
- [ ] Implementar sistema de cache
- [ ] Criar sistema de invalidação de cache
- [ ] Aplicar cache nas principais queries
- [ ] Adicionar índices no banco
- [ ] Implementar lazy loading de imagens
- [ ] Otimizar queries com includes seletivos
- [ ] Implementar paginação em todas as listagens
- [ ] Adicionar logs de performance

## FASE 12: Testes (3-4 dias)
- [ ] Configurar Vitest
- [ ] Testar funções de autenticação
- [ ] Testar helpers de autorização
- [ ] Testar utils
- [ ] Testar componentes principais
- [ ] Testar formulários
- [ ] Criar testes E2E de login
- [ ] Criar testes E2E de feedbacks
- [ ] Criar testes E2E de comentários
- [ ] Criar testes E2E de avisos

## FASE 13: Deploy e Documentação (2-3 dias)
- [ ] Configurar variáveis de ambiente de produção
- [ ] Executar migrations em produção
- [ ] Executar seed em produção
- [ ] Fazer deploy da aplicação
- [ ] Testar aplicação em produção
- [ ] Criar README.md completo
- [ ] Documentar APIs
- [ ] Criar guia de instalação
- [ ] Criar guia de uso
- [ ] Executar checklist de validação final

## NOTA: Fases 2 e 3 foram concluídas simultaneamente
- Layout e navegação foram implementados junto com autenticação
- DashboardLayout com sidebar responsivo e menu baseado em perfil
- Página Dashboard inicial com cards de estatísticas
- Redirecionamento automático após login

## FASE 4: Sistema de Feedbacks (4-5 dias) - CONCLUÍDA
- [x] Criar API de criação de feedback
- [x] Criar API de listagem de feedbacks
- [x] Criar API de visualização de feedback
- [x] Criar API de edição de feedback
- [x] Criar API de exclusão de feedback
- [x] Criar API de marcação como lido
- [x] Criar helpers de banco de dados para feedbacks
- [x] Criar página de listagem com filtros
- [x] Criar página de visualização detalhada
- [x] Criar formulário de criação de feedback
- [x] Criar API de listagem de usuários por role
- [x] Marcação automática como lido ao visualizar
- [x] Validações de permissões por role

## CORREÇÃO DE ERRO (06/11/2025)
- [x] Criar tabela user_profiles no banco de dados
- [x] Configurar perfil MASTER para usuário owner
- [x] Corrigir erro de query em getUserProfile
