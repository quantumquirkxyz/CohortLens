import { createDb, type Db } from '@cohortlens/database';

let db: Db | undefined;

/** Return the shared Drizzle client, created lazily from DATABASE_URL. */
export function getDb(): Db {
  db ??= createDb();
  return db;
}
