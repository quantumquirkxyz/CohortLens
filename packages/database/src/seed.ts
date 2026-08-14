import type { Db } from './client';
import {
  assets,
  capitalFlows,
  chains,
  pools,
  positions,
  protocols,
  wallets,
} from './schema';
import {
  seedAssets,
  seedChains,
  seedFlows,
  seedPools,
  seedPositions,
  seedProtocols,
  seedWallets,
} from './seed-data';

export interface SeedSummary {
  chains: number;
  protocols: number;
  wallets: number;
  assets: number;
  pools: number;
  positions: number;
  flows: number;
}

/** Insert the sample graph. Idempotent: existing rows (by pk/unique) are kept. */
export async function seedDatabase(db: Db): Promise<SeedSummary> {
  await db.insert(chains).values(seedChains).onConflictDoNothing();
  await db.insert(protocols).values(seedProtocols).onConflictDoNothing();
  await db.insert(wallets).values(seedWallets).onConflictDoNothing();
  await db.insert(assets).values(seedAssets).onConflictDoNothing();
  await db.insert(pools).values(seedPools).onConflictDoNothing();
  await db.insert(positions).values(seedPositions).onConflictDoNothing();
  await db
    .insert(capitalFlows)
    .values(
      seedFlows.map(({ id, ...rest }) => ({
        id,
        ...rest,
      })),
    )
    .onConflictDoNothing();

  return {
    chains: seedChains.length,
    protocols: seedProtocols.length,
    wallets: seedWallets.length,
    assets: seedAssets.length,
    pools: seedPools.length,
    positions: seedPositions.length,
    flows: seedFlows.length,
  };
}
