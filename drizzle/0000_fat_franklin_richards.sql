CREATE TABLE `game_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`player_id` text NOT NULL,
	`game` text NOT NULL,
	`distance_m` integer DEFAULT 0 NOT NULL,
	`stamps` integer DEFAULT 0 NOT NULL,
	`reached_gate` integer DEFAULT false NOT NULL,
	`points_earned` integer DEFAULT 0 NOT NULL,
	`created_at` text DEFAULT (current_timestamp) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `global_aggregate` (
	`id` text PRIMARY KEY DEFAULT 'singleton' NOT NULL,
	`total_signups` integer DEFAULT 0 NOT NULL,
	`total_distance_run_m` integer DEFAULT 0 NOT NULL,
	`total_runs` integer DEFAULT 0 NOT NULL,
	`total_spins` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `players` (
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
	`streak` integer DEFAULT 1 NOT NULL,
	`last_visit_date` text NOT NULL,
	`referral_code_id` text NOT NULL,
	`referred_by_code_id` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `players_email_unique` ON `players` (`email`);--> statement-breakpoint
CREATE UNIQUE INDEX `players_referral_code_id_unique` ON `players` (`referral_code_id`);--> statement-breakpoint
CREATE TABLE `points_ledger` (
	`id` text PRIMARY KEY NOT NULL,
	`player_id` text NOT NULL,
	`source` text NOT NULL,
	`amount` integer NOT NULL,
	`meta` text,
	`created_at` text DEFAULT (current_timestamp) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `referral_codes` (
	`id` text PRIMARY KEY NOT NULL,
	`code` text NOT NULL,
	`created_at` text DEFAULT (current_timestamp) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `referral_codes_code_unique` ON `referral_codes` (`code`);--> statement-breakpoint
CREATE TABLE `referral_events` (
	`id` text PRIMARY KEY NOT NULL,
	`referral_code_id` text NOT NULL,
	`new_player_id` text NOT NULL,
	`spots_awarded` integer NOT NULL,
	`created_at` text DEFAULT (current_timestamp) NOT NULL,
	`flagged` integer DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE `state_aggregate` (
	`state` text PRIMARY KEY NOT NULL,
	`total_distance_m` integer DEFAULT 0 NOT NULL,
	`total_runs` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `wheel_spins` (
	`id` text PRIMARY KEY NOT NULL,
	`player_id` text NOT NULL,
	`segment_label` text NOT NULL,
	`points_won` integer NOT NULL,
	`created_at` text DEFAULT (current_timestamp) NOT NULL
);
