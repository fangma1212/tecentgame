ALTER TABLE `moment_cards` ADD `parent_card_id` text REFERENCES moment_cards(id);--> statement-breakpoint
ALTER TABLE `moment_cards` ADD `thread_id` text REFERENCES moment_cards(id);--> statement-breakpoint
CREATE INDEX `idx_cards_thread_time` ON `moment_cards` (`thread_id`,`created_at`,`id`);--> statement-breakpoint
PRAGMA optimize;
