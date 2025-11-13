import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean, json, float, index, unique } from "drizzle-orm/mysql-core";
import { relations } from "drizzle-orm";

/**
 * ENUMS
 */

export const userRoleEnum = ["admin", "user"] as const;
export const feedbackRoleEnum = ["MASTER", "DIRETOR", "REVISOR", "TAQUIGRAFO"] as const;
export const feedbackTypeEnum = ["CORRETIVO", "POSITIVO"] as const;
export const sessionTypeEnum = ["PLENARIO", "COMISSAO"] as const;
export const avisoTypeEnum = ["COTIDIANO", "URGENTE", "RECORRENTE"] as const;
export const reactionTypeEnum = ["ENTENDI", "OBRIGADO", "VOU_MELHORAR"] as const;
export const auditActionEnum = [
  "LOGIN", "LOGOUT", "CREATE_USER", "UPDATE_USER", "DELETE_USER",
  "CREATE_FEEDBACK", "READ_FEEDBACK", "UPDATE_FEEDBACK", "DELETE_FEEDBACK",
  "CREATE_COMMENT", "CREATE_REACTION", "CREATE_AVISO", "UPDATE_AVISO", "DELETE_AVISO",
  "CREATE_PADRONIZACAO", "UPDATE_PADRONIZACAO", "DELETE_PADRONIZACAO",
  "EXPORT_REPORT", "UPLOAD_FILE"
] as const;

/**
 * TABELA DE USUÁRIOS
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  password: varchar("password", { length: 255 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  loginMethod: varchar("loginMethod", { length: 64 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
}, (table) => ({
  emailIdx: index("email_idx").on(table.email),
  roleIdx: index("role_idx").on(table.role),
}));

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * TABELA DE PERFIS DE USUÁRIOS (específico do sistema de feedback)
 */
export const userProfiles = mysqlTable("user_profiles", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  feedbackRole: mysqlEnum("feedbackRole", feedbackRoleEnum).notNull().default("TAQUIGRAFO"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  userIdx: index("user_idx").on(table.userId),
}));

export type UserProfile = typeof userProfiles.$inferSelect;
export type InsertUserProfile = typeof userProfiles.$inferInsert;

/**
 * TABELA DE FEEDBACKS
 */
export const feedbacks = mysqlTable("feedbacks", {
  id: int("id").autoincrement().primaryKey(),
  type: mysqlEnum("type", feedbackTypeEnum).notNull().default("CORRETIVO"),
  title: varchar("title", { length: 255 }),
  content: text("content").notNull(),
  imageUrl: varchar("imageUrl", { length: 500 }),
  rating: float("rating"),
  sessionType: mysqlEnum("sessionType", sessionTypeEnum),
  sessionNum: varchar("sessionNum", { length: 50 }),
  categories: json("categories").$type<string[]>(),
  isRead: boolean("isRead").notNull().default(false),
  readAt: timestamp("readAt"),
  revisorId: int("revisorId").notNull(),
  taquigId: int("taquigId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  revisorIdx: index("revisor_idx").on(table.revisorId),
  taquigIdx: index("taquig_idx").on(table.taquigId),
  typeIdx: index("type_idx").on(table.type),
  isReadIdx: index("is_read_idx").on(table.isRead),
  createdAtIdx: index("created_at_idx").on(table.createdAt),
}));

export type Feedback = typeof feedbacks.$inferSelect;
export type InsertFeedback = typeof feedbacks.$inferInsert;

/**
 * TABELA DE COMENTÁRIOS
 */
export const comments = mysqlTable("comments", {
  id: int("id").autoincrement().primaryKey(),
  content: text("content").notNull(),
  userId: int("userId").notNull(),
  feedbackId: int("feedbackId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  feedbackIdx: index("feedback_idx").on(table.feedbackId),
  userIdx: index("user_idx").on(table.userId),
  createdAtIdx: index("created_at_idx").on(table.createdAt),
}));

export type Comment = typeof comments.$inferSelect;
export type InsertComment = typeof comments.$inferInsert;

/**
 * TABELA DE REAÇÕES
 */
export const reactions = mysqlTable("reactions", {
  id: int("id").autoincrement().primaryKey(),
  type: mysqlEnum("type", reactionTypeEnum).notNull(),
  userId: int("userId").notNull(),
  feedbackId: int("feedbackId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  feedbackIdx: index("feedback_idx").on(table.feedbackId),
  userFeedbackTypeUnique: unique("user_feedback_type_unique").on(table.userId, table.feedbackId, table.type),
}));

export type Reaction = typeof reactions.$inferSelect;
export type InsertReaction = typeof reactions.$inferInsert;

/**
 * TABELA DE AVISOS
 */
export const avisos = mysqlTable("avisos", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content").notNull(),
  type: mysqlEnum("type", avisoTypeEnum).notNull().default("COTIDIANO"),
  targets: json("targets").$type<typeof userRoleEnum[number][]>().notNull(),
  publishAt: timestamp("publishAt").notNull(),
  isActive: boolean("isActive").notNull().default(true),
  userId: int("userId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  typeIdx: index("type_idx").on(table.type),
  publishAtIdx: index("publish_at_idx").on(table.publishAt),
  userIdx: index("user_idx").on(table.userId),
}));

export type Aviso = typeof avisos.$inferSelect;
export type InsertAviso = typeof avisos.$inferInsert;

/**
 * TABELA DE LEITURA DE AVISOS
 */
export const avisoReads = mysqlTable("aviso_reads", {
  id: int("id").autoincrement().primaryKey(),
  avisoId: int("avisoId").notNull(),
  userId: int("userId").notNull(),
  readAt: timestamp("readAt").defaultNow().notNull(),
}, (table) => ({
  avisoUserUnique: unique("aviso_user_unique").on(table.avisoId, table.userId),
}));

export type AvisoRead = typeof avisoReads.$inferSelect;
export type InsertAvisoRead = typeof avisoReads.$inferInsert;

/**
 * TABELA DE VISUALIZAÇÕES DE AVISOS (para estatísticas)
 */
export const avisoViews = mysqlTable("aviso_views", {
  id: int("id").autoincrement().primaryKey(),
  avisoId: int("avisoId").notNull(),
  userId: int("userId").notNull(),
  viewedAt: timestamp("viewedAt").defaultNow().notNull(),
}, (table) => ({
  avisoIdx: index("aviso_idx").on(table.avisoId),
  userIdx: index("user_idx").on(table.userId),
  viewedAtIdx: index("viewed_at_idx").on(table.viewedAt),
}));

export type AvisoView = typeof avisoViews.$inferSelect;
export type InsertAvisoView = typeof avisoViews.$inferInsert;

/**
 * TABELA DE PADRONIZAÇÃO
 */
export const padronizacao = mysqlTable("padronizacao", {
  id: int("id").autoincrement().primaryKey(),
  term: varchar("term", { length: 255 }).notNull().unique(),
  definition: text("definition"),
  userId: int("userId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  termIdx: index("term_idx").on(table.term),
}));

export type Padronizacao = typeof padronizacao.$inferSelect;
export type InsertPadronizacao = typeof padronizacao.$inferInsert;

/**
 * TABELA DE LEITURA DE PADRONIZAÇÃO
 */
export const padronizacaoReads = mysqlTable("padronizacao_reads", {
  id: int("id").autoincrement().primaryKey(),
  padronizacaoId: int("padronizacaoId").notNull(),
  userId: int("userId").notNull(),
  readAt: timestamp("readAt").defaultNow().notNull(),
}, (table) => ({
  padronizacaoUserUnique: unique("padronizacao_user_unique").on(table.padronizacaoId, table.userId),
  padronizacaoIdx: index("padronizacao_idx").on(table.padronizacaoId),
  userIdx: index("user_idx").on(table.userId),
}));

export type PadronizacaoRead = typeof padronizacaoReads.$inferSelect;
export type InsertPadronizacaoRead = typeof padronizacaoReads.$inferInsert;

/**
 * TABELA DE TEMPLATES
 */
export const templates = mysqlTable("templates", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content").notNull(),
  userId: int("userId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  userIdx: index("user_idx").on(table.userId),
}));

export type Template = typeof templates.$inferSelect;
export type InsertTemplate = typeof templates.$inferInsert;

/**
 * TABELA DE QUESITOS DE FEEDBACK
 */
export const quesitos = mysqlTable("quesitos", {
  id: int("id").autoincrement().primaryKey(),
  titulo: varchar("titulo", { length: 255 }).notNull(),
  descricao: text("descricao"),
  ordem: int("ordem").notNull().default(0),
  isActive: boolean("isActive").notNull().default(true),
  userId: int("userId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  userIdx: index("user_idx").on(table.userId),
  ordemIdx: index("ordem_idx").on(table.ordem),
  isActiveIdx: index("is_active_idx").on(table.isActive),
}));

export type Quesito = typeof quesitos.$inferSelect;
export type InsertQuesito = typeof quesitos.$inferInsert;

/**
 * TABELA DE LOGS DE AUDITORIA
 */
export const auditLogs = mysqlTable("audit_logs", {
  id: int("id").autoincrement().primaryKey(),
  action: mysqlEnum("action", auditActionEnum).notNull(),
  entityType: varchar("entityType", { length: 100 }),
  entityId: varchar("entityId", { length: 100 }),
  details: json("details"),
  ipAddress: varchar("ipAddress", { length: 45 }),
  userAgent: text("userAgent"),
  userId: int("userId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  userIdx: index("user_idx").on(table.userId),
  actionIdx: index("action_idx").on(table.action),
  createdAtIdx: index("created_at_idx").on(table.createdAt),
}));

export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = typeof auditLogs.$inferInsert;

/**
 * RELAÇÕES
 */

export const usersRelations = relations(users, ({ one, many }) => ({
  profile: one(userProfiles, {
    fields: [users.id],
    references: [userProfiles.userId],
  }),
  feedbacksSent: many(feedbacks, { relationName: "feedbacksEnviados" }),
  feedbacksReceived: many(feedbacks, { relationName: "feedbacksRecebidos" }),
  comments: many(comments),
  reactions: many(reactions),
  avisos: many(avisos),
  templates: many(templates),
  padronizacoes: many(padronizacao),
  quesitos: many(quesitos),
  auditLogs: many(auditLogs),
}));

export const userProfilesRelations = relations(userProfiles, ({ one }) => ({
  user: one(users, {
    fields: [userProfiles.userId],
    references: [users.id],
  }),
}));

export const feedbacksRelations = relations(feedbacks, ({ one, many }) => ({
  revisor: one(users, {
    fields: [feedbacks.revisorId],
    references: [users.id],
    relationName: "feedbacksEnviados",
  }),
  taquig: one(users, {
    fields: [feedbacks.taquigId],
    references: [users.id],
    relationName: "feedbacksRecebidos",
  }),
  comments: many(comments),
  reactions: many(reactions),
}));

export const commentsRelations = relations(comments, ({ one }) => ({
  user: one(users, {
    fields: [comments.userId],
    references: [users.id],
  }),
  feedback: one(feedbacks, {
    fields: [comments.feedbackId],
    references: [feedbacks.id],
  }),
}));

export const reactionsRelations = relations(reactions, ({ one }) => ({
  user: one(users, {
    fields: [reactions.userId],
    references: [users.id],
  }),
  feedback: one(feedbacks, {
    fields: [reactions.feedbackId],
    references: [feedbacks.id],
  }),
}));

export const avisosRelations = relations(avisos, ({ one, many }) => ({
  user: one(users, {
    fields: [avisos.userId],
    references: [users.id],
  }),
  readBy: many(avisoReads),
  views: many(avisoViews),
}));

export const avisoReadsRelations = relations(avisoReads, ({ one }) => ({
  aviso: one(avisos, {
    fields: [avisoReads.avisoId],
    references: [avisos.id],
  }),
  user: one(users, {
    fields: [avisoReads.userId],
    references: [users.id],
  }),
}));

export const avisoViewsRelations = relations(avisoViews, ({ one }) => ({
  aviso: one(avisos, {
    fields: [avisoViews.avisoId],
    references: [avisos.id],
  }),
  user: one(users, {
    fields: [avisoViews.userId],
    references: [users.id],
  }),
}));

export const padronizacaoRelations = relations(padronizacao, ({ one, many }) => ({
  creator: one(users, {
    fields: [padronizacao.userId],
    references: [users.id],
  }),
  readBy: many(padronizacaoReads),
}));

export const padronizacaoReadsRelations = relations(padronizacaoReads, ({ one }) => ({
  padronizacao: one(padronizacao, {
    fields: [padronizacaoReads.padronizacaoId],
    references: [padronizacao.id],
  }),
  user: one(users, {
    fields: [padronizacaoReads.userId],
    references: [users.id],
  }),
}));

export const templatesRelations = relations(templates, ({ one }) => ({
  user: one(users, {
    fields: [templates.userId],
    references: [users.id],
  }),
}));

export const quesitosRelations = relations(quesitos, ({ one }) => ({
  creator: one(users, {
    fields: [quesitos.userId],
    references: [users.id],
  }),
}));

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  user: one(users, {
    fields: [auditLogs.userId],
    references: [users.id],
  }),
}));
