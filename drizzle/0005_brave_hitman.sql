ALTER TABLE `players` ADD `username` text;--> statement-breakpoint
CREATE UNIQUE INDEX `players_username_unique` ON `players` (`username`);