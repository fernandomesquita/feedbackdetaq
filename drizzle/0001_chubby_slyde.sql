CREATE TABLE `audit_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`action` enum('LOGIN','LOGOUT','CREATE_USER','UPDATE_USER','DELETE_USER','CREATE_FEEDBACK','READ_FEEDBACK','UPDATE_FEEDBACK','DELETE_FEEDBACK','CREATE_COMMENT','CREATE_REACTION','CREATE_AVISO','UPDATE_AVISO','DELETE_AVISO','CREATE_PADRONIZACAO','UPDATE_PADRONIZACAO','DELETE_PADRONIZACAO','EXPORT_REPORT','UPLOAD_FILE') NOT NULL,
	`entityType` varchar(100),
	`entityId` varchar(100),
	`details` json,
	`ipAddress` varchar(45),
	`userAgent` text,
	`userId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `audit_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `aviso_reads` (
	`id` int AUTO_INCREMENT NOT NULL,
	`avisoId` int NOT NULL,
	`userId` int NOT NULL,
	`readAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `aviso_reads_id` PRIMARY KEY(`id`),
	CONSTRAINT `aviso_user_unique` UNIQUE(`avisoId`,`userId`)
);
--> statement-breakpoint
CREATE TABLE `avisos` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(255) NOT NULL,
	`content` text NOT NULL,
	`type` enum('COTIDIANO','URGENTE','RECORRENTE') NOT NULL DEFAULT 'COTIDIANO',
	`targets` json NOT NULL,
	`publishAt` timestamp NOT NULL,
	`isActive` boolean NOT NULL DEFAULT true,
	`userId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `avisos_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `comments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`content` text NOT NULL,
	`userId` int NOT NULL,
	`feedbackId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `comments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `feedbacks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`type` enum('CORRETIVO','POSITIVO') NOT NULL DEFAULT 'CORRETIVO',
	`title` varchar(255),
	`content` text NOT NULL,
	`imageUrl` varchar(500),
	`rating` float,
	`sessionType` enum('PLENARIO','COMISSAO'),
	`sessionNum` varchar(50),
	`categories` json DEFAULT ('[]'),
	`isRead` boolean NOT NULL DEFAULT false,
	`readAt` timestamp,
	`revisorId` int NOT NULL,
	`taquigId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `feedbacks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `padronizacao` (
	`id` int AUTO_INCREMENT NOT NULL,
	`term` varchar(255) NOT NULL,
	`definition` text,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `padronizacao_id` PRIMARY KEY(`id`),
	CONSTRAINT `padronizacao_term_unique` UNIQUE(`term`)
);
--> statement-breakpoint
CREATE TABLE `reactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`type` enum('ENTENDI','OBRIGADO','VOU_MELHORAR') NOT NULL,
	`userId` int NOT NULL,
	`feedbackId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `reactions_id` PRIMARY KEY(`id`),
	CONSTRAINT `user_feedback_type_unique` UNIQUE(`userId`,`feedbackId`,`type`)
);
--> statement-breakpoint
CREATE TABLE `templates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(255) NOT NULL,
	`content` text NOT NULL,
	`userId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `templates_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `name` text NOT NULL;--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `email` varchar(320) NOT NULL;--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `role` enum('MASTER','DIRETOR','REVISOR','TAQUIGRAFO') NOT NULL DEFAULT 'TAQUIGRAFO';--> statement-breakpoint
ALTER TABLE `users` ADD `password` varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `isActive` boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD CONSTRAINT `users_email_unique` UNIQUE(`email`);--> statement-breakpoint
CREATE INDEX `user_idx` ON `audit_logs` (`userId`);--> statement-breakpoint
CREATE INDEX `action_idx` ON `audit_logs` (`action`);--> statement-breakpoint
CREATE INDEX `created_at_idx` ON `audit_logs` (`createdAt`);--> statement-breakpoint
CREATE INDEX `type_idx` ON `avisos` (`type`);--> statement-breakpoint
CREATE INDEX `publish_at_idx` ON `avisos` (`publishAt`);--> statement-breakpoint
CREATE INDEX `user_idx` ON `avisos` (`userId`);--> statement-breakpoint
CREATE INDEX `feedback_idx` ON `comments` (`feedbackId`);--> statement-breakpoint
CREATE INDEX `user_idx` ON `comments` (`userId`);--> statement-breakpoint
CREATE INDEX `created_at_idx` ON `comments` (`createdAt`);--> statement-breakpoint
CREATE INDEX `revisor_idx` ON `feedbacks` (`revisorId`);--> statement-breakpoint
CREATE INDEX `taquig_idx` ON `feedbacks` (`taquigId`);--> statement-breakpoint
CREATE INDEX `type_idx` ON `feedbacks` (`type`);--> statement-breakpoint
CREATE INDEX `is_read_idx` ON `feedbacks` (`isRead`);--> statement-breakpoint
CREATE INDEX `created_at_idx` ON `feedbacks` (`createdAt`);--> statement-breakpoint
CREATE INDEX `term_idx` ON `padronizacao` (`term`);--> statement-breakpoint
CREATE INDEX `feedback_idx` ON `reactions` (`feedbackId`);--> statement-breakpoint
CREATE INDEX `user_idx` ON `templates` (`userId`);--> statement-breakpoint
CREATE INDEX `email_idx` ON `users` (`email`);--> statement-breakpoint
CREATE INDEX `role_idx` ON `users` (`role`);