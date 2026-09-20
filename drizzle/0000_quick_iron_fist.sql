CREATE TABLE `moment_cards` (
	`id` text PRIMARY KEY NOT NULL,
	`request_key` text NOT NULL,
	`track` text NOT NULL,
	`clip_start` integer NOT NULL,
	`clip_end` integer NOT NULL,
	`message` text NOT NULL,
	`to_name` text NOT NULL,
	`from_name` text NOT NULL,
	`theme` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_cards_request_key` ON `moment_cards` (`request_key`);--> statement-breakpoint
CREATE TABLE `moment_replies` (
	`id` text PRIMARY KEY NOT NULL,
	`card_id` text NOT NULL,
	`request_key` text NOT NULL,
	`name` text NOT NULL,
	`reaction` text NOT NULL,
	`message` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`card_id`) REFERENCES `moment_cards`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_replies_card_time` ON `moment_replies` (`card_id`,`created_at`);--> statement-breakpoint
CREATE UNIQUE INDEX `idx_replies_request_key` ON `moment_replies` (`request_key`);