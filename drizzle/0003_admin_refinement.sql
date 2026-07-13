-- Hand-authored (drizzle-kit generate needs a TTY to resolve the
-- content_blocks->pages rename). Data-preserving: existing quotes and About
-- content survive verbatim.

-- quotes.body -> quotes.sections (one-element array from the old body)
ALTER TABLE "quotes" ADD COLUMN "sections" text[];--> statement-breakpoint
UPDATE "quotes" SET "sections" = ARRAY["body"];--> statement-breakpoint
ALTER TABLE "quotes" ALTER COLUMN "sections" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "quotes" DROP COLUMN "body";--> statement-breakpoint

-- content_blocks -> pages: merge the two About blocks into one markdown-lite doc
CREATE TABLE "pages" (
	"uri" text PRIMARY KEY NOT NULL,
	"content" text NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
INSERT INTO "pages" ("uri", "content")
SELECT 'about',
	'# ' || d.title || E'\n\n' || d.body || E'\n\n' || '## ' || r.title || E'\n\n' || r.body
FROM "content_blocks" d, "content_blocks" r
WHERE d.slug = 'about-definition' AND r.slug = 'about-reflections';--> statement-breakpoint
DROP TABLE "content_blocks";--> statement-breakpoint

-- themes: admin-editable, seeded with the three built-ins
CREATE TABLE "themes" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"bg" text NOT NULL,
	"line" text NOT NULL,
	"ink" text NOT NULL,
	"sort" integer DEFAULT 0 NOT NULL
);--> statement-breakpoint
INSERT INTO "themes" ("name", "bg", "line", "ink", "sort") VALUES
	('Sunset', '#f7a31a', '#f5350b', '#000000', 0),
	('Ocean', '#113757', '#276d8b', '#ffffff', 1),
	('Midnight', '#1f1f1f', '#292929', '#ffffff', 2);
