import {
  pgTable,
  serial,
  text,
  boolean,
  timestamp,
  integer,
  date,
  uniqueIndex
} from 'drizzle-orm/pg-core';

export const reflections = pgTable('reflections', {
  id: serial('id').primaryKey(),
  /** Ordered content sections; the public app renders them as slides. */
  sections: text('sections').array().notNull(),
  source: text('source'),
  attribution: text('attribution'),
  copyright: text('copyright'),
  isPublished: boolean('is_published').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
});

/** Editable public pages, addressed by uri; content is markdown-lite. */
export const pages = pgTable('pages', {
  uri: text('uri').primaryKey(),
  content: text('content').notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date())
});

/** Admin-editable themes feeding the public picker. */
export const themes = pgTable('themes', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  bg: text('bg').notNull(),
  accent: text('accent').notNull(),
  ink: text('ink').notNull(),
  sort: integer('sort').notNull().default(0)
});

/**
 * Anonymous push-delivery infrastructure — the ONLY user-adjacent data the
 * server holds (see the design spec's privacy principles). No identity, no
 * linkage; rows are deleted on explicit opt-out and self-pruned when the
 * push service reports the endpoint gone (410/404).
 */
export const pushSubscriptions = pgTable(
  'push_subscriptions',
  {
    id: serial('id').primaryKey(),
    endpoint: text('endpoint').notNull(),
    p256dh: text('p256dh').notNull(),
    auth: text('auth').notNull(),
    /** Minute-of-day in UTC (0-1439) when the reminder should arrive. */
    reminderMinute: integer('reminder_minute').notNull(),
    /** UTC date ('YYYY-MM-DD') of the last successful send — restart-safe once-a-day guard. */
    lastSentOn: date('last_sent_on'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
  },
  (t) => [uniqueIndex('push_subscriptions_endpoint_idx').on(t.endpoint)]
);

/**
 * Operator accounts (the site owner), NOT app users — the "server stores no
 * personal user data" principle is about visitors, and remains intact.
 */
export const admins = pgTable(
  'admins',
  {
    id: serial('id').primaryKey(),
    email: text('email').notNull(),
    passwordHash: text('password_hash').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
  },
  (t) => [uniqueIndex('admins_email_idx').on(t.email)]
);

/** Lucia-pattern sessions: id = SHA-256 of the bearer token (token never stored). */
export const sessions = pgTable('sessions', {
  id: text('id').primaryKey(),
  adminId: integer('admin_id')
    .notNull()
    .references(() => admins.id, { onDelete: 'cascade' }),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull()
});

export type Reflection = typeof reflections.$inferSelect;
export type Page = typeof pages.$inferSelect;
export type ThemeRow = typeof themes.$inferSelect;
export type PushSubscription = typeof pushSubscriptions.$inferSelect;
export type Admin = typeof admins.$inferSelect;
export type Session = typeof sessions.$inferSelect;
