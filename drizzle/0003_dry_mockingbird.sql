CREATE TABLE `video_watches` (
	`id` text PRIMARY KEY NOT NULL,
	`player_id` text NOT NULL,
	`video_id` text NOT NULL,
	`watched_at` text DEFAULT (current_timestamp) NOT NULL
);
--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_players` (
	`id` text PRIMARY KEY NOT NULL,
	`first_name` text NOT NULL,
	`last_name` text NOT NULL,
	`email` text NOT NULL,
	`phone` text NOT NULL,
	`state` text NOT NULL,
	`created_at` text DEFAULT (current_timestamp) NOT NULL,
	`consent_marketing` integer DEFAULT false NOT NULL,
	`consent_version` text DEFAULT 'pending-legal-v0' NOT NULL,
	`consent_timestamp` text DEFAULT (current_timestamp) NOT NULL,
	`queue_position` integer NOT NULL,
	`streak` integer DEFAULT 0 NOT NULL,
	`last_visit_date` text NOT NULL,
	`last_play_date` text,
	`daily_challenge_date` text,
	`referral_code_id` text NOT NULL,
	`referred_by_code_id` text
);
--> statement-breakpoint
INSERT INTO `__new_players`("id", "first_name", "last_name", "email", "phone", "state", "created_at", "consent_marketing", "consent_version", "consent_timestamp", "queue_position", "streak", "last_visit_date", "daily_challenge_date", "referral_code_id", "referred_by_code_id") SELECT "id", "first_name", "last_name", "email", "phone", "state", "created_at", "consent_marketing", "consent_version", "consent_timestamp", "queue_position", "streak", "last_visit_date", "daily_challenge_date", "referral_code_id", "referred_by_code_id" FROM `players`;--> statement-breakpoint
DROP TABLE `players`;--> statement-breakpoint
ALTER TABLE `__new_players` RENAME TO `players`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `players_email_unique` ON `players` (`email`);--> statement-breakpoint
CREATE UNIQUE INDEX `players_referral_code_id_unique` ON `players` (`referral_code_id`);