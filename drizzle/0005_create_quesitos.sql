CREATE TABLE `quesitos` (
	`id` int AUTO_INCREMENT NOT NULL,
	`titulo` varchar(255) NOT NULL,
	`descricao` text,
	`ordem` int NOT NULL DEFAULT 0,
	`isActive` boolean NOT NULL DEFAULT true,
	`userId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `quesitos_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `user_idx` ON `quesitos` (`userId`);--> statement-breakpoint
CREATE INDEX `ordem_idx` ON `quesitos` (`ordem`);--> statement-breakpoint
CREATE INDEX `is_active_idx` ON `quesitos` (`isActive`);
