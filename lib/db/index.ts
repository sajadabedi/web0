import { sql } from '@vercel/postgres'
import { drizzle } from 'drizzle-orm/vercel-postgres'
import { publishedSites } from './schema'

export const db = drizzle(sql)

export async function createTables() {
  await sql.query(`
    CREATE TABLE IF NOT EXISTS published_sites (
      id VARCHAR(256) PRIMARY KEY,
      html TEXT NOT NULL,
      css TEXT NOT NULL,
      version VARCHAR(256),
      published_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
    );
  `)
}
