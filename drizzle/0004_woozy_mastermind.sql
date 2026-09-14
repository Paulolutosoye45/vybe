CREATE TABLE `trivia_attempts` (
	`id` text PRIMARY KEY NOT NULL,
	`player_id` text NOT NULL,
	`date` text NOT NULL,
	`correct_count` integer DEFAULT 0 NOT NULL,
	`points_earned` integer DEFAULT 0 NOT NULL,
	`created_at` text DEFAULT (current_timestamp) NOT NULL
);
--> statement-breakpoint
ALTER TABLE `players` ADD `streak_freezes` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `players` ADD `longest_streak` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `players` ADD `bluutv_series_completed` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `players` ADD `referral_tier` integer DEFAULT 0 NOT NULL;