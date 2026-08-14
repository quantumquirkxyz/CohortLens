import 'dotenv/config';
import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

/** The Drizzle client (NodePgDatabase plus the underlying pg Pool). */
export type Db = NodePgDatabase<typeof schema> & { $client: Pool };

const DEFAULT_DATABASE_URL =
  'postgres://cohortlens:cohortlens@localhost:5432/cohortlens';

/** Create a Drizzle client backed by a pg connection pool. */
export function createDb(
  url: string = process.env.DATABASE_URL ?? DEFAULT_DATABASE_URL,
): Db {
  const pool = new Pool({ connectionString: url });
  return drizzle(pool, { schema });
}
