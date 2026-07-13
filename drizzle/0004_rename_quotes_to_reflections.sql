-- Hand-authored (drizzle-kit generate needs a TTY to resolve renames, as with
-- 0003). Data-preserving: the quotes table becomes reflections verbatim; the
-- sequence and primary-key constraint are renamed to match what a fresh
-- schema would create.

ALTER TABLE "quotes" RENAME TO "reflections";--> statement-breakpoint
ALTER SEQUENCE "quotes_id_seq" RENAME TO "reflections_id_seq";--> statement-breakpoint
ALTER TABLE "reflections" RENAME CONSTRAINT "quotes_pkey" TO "reflections_pkey";
