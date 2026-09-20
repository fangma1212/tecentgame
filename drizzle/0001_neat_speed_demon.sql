CREATE TABLE `moment_audio` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`artist` text NOT NULL,
	`duration` integer NOT NULL,
	`source_start` integer NOT NULL,
	`digest` text NOT NULL,
	`created_at` integer NOT NULL
);
