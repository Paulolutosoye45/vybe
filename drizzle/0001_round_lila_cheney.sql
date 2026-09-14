CREATE TABLE `level_progress` (
	`id` text PRIMARY KEY NOT NULL,
	`player_id` text NOT NULL,
	`level` integer NOT NULL,
	`stars` integer DEFAULT 0 NOT NULL,
	`best_distance_m` integer DEFAULT 0 NOT NULL,
	`reached_at` text DEFAULT (current_timestamp) NOT NULL,
	`updated_at` text DEFAULT (current_timestamp) NOT NULL
);
