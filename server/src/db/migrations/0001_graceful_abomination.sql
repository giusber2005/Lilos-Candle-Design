CREATE TABLE `comments` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text DEFAULT 'Cliente' NOT NULL,
	`message` text NOT NULL,
	`created_at` integer NOT NULL
);
