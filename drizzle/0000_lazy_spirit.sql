CREATE TABLE "content_blocks" (
	"slug" text PRIMARY KEY NOT NULL,
	"title" text,
	"body" text NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "quotes" (
	"id" serial PRIMARY KEY NOT NULL,
	"body" text NOT NULL,
	"source" text,
	"attribution" text,
	"copyright" text,
	"is_published" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
