CREATE TABLE `aviso_views` (
	`id` int AUTO_INCREMENT NOT NULL,
	`avisoId` int NOT NULL,
	`userId` int NOT NULL,
	`viewedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `aviso_views_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `padronizacao_reads` (
	`id` int AUTO_INCREMENT NOT NULL,
	`padronizacaoId` int NOT NULL,
	`userId` int NOT NULL,
	`readAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `padronizacao_reads_id` PRIMARY KEY(`id`),
	CONSTRAINT `padronizacao_user_unique` UNIQUE(`padronizacaoId`,`userId`)
);
--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `role` enum('user','admin') NOT NULL DEFAULT 'user';--> statement-breakpoint
ALTER TABLE `padronizacao` ADD `userId` int NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `password` varchar(255);--> statement-breakpoint
CREATE INDEX `aviso_idx` ON `aviso_views` (`avisoId`);--> statement-breakpoint
CREATE INDEX `user_idx` ON `aviso_views` (`userId`);--> statement-breakpoint
CREATE INDEX `viewed_at_idx` ON `aviso_views` (`viewedAt`);--> statement-breakpoint
CREATE INDEX `padronizacao_idx` ON `padronizacao_reads` (`padronizacaoId`);--> statement-breakpoint
CREATE INDEX `user_idx` ON `padronizacao_reads` (`userId`);--> statement-breakpoint
ALTER TABLE `padronizacao` DROP COLUMN `createdBy`;