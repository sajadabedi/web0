import { pgTable, text, timestamp, varchar } from 'drizzle-orm/pg-core'

export const publishedSites = pgTable('published_sites', {
  id: varchar('id', { length: 256 }).primaryKey(),
  html: text('html').notNull(),
  css: text('css').notNull(),
  version: varchar('version', { length: 256 }),
  publishedAt: timestamp('published_at').defaultNow().notNull(),
})
