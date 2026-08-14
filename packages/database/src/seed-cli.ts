import { createDb } from './client';
import { seedDatabase } from './seed';

async function main() {
  const db = createDb();
  const summary = await seedDatabase(db);
  console.log('Seed complete:', summary);
  await db.$client.end();
}

main().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
