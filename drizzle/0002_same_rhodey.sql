ALTER TABLE "pages" ADD COLUMN "title" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "pages" ADD COLUMN "link_location" text DEFAULT 'none' NOT NULL;
