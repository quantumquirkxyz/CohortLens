import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { sql } from 'drizzle-orm';
import {
  createDb,
  ensureAsset,
  ensureChain,
  ensurePool,
  ensureProtocol,
  ensureWallet,
  findAssetId,
  findWalletId,
  getSyncCursor,
  setSyncCursor,
  type Db,
} from '../src/index';
import { capitalFlows, pools, protocols, syncState } from '../src/schema';

const TEST_URL =
  process.env.TEST_DATABASE_URL ??
  'postgres://cohortlens:cohortlens@localhost:5432/cohortlens_test';

let db: Db;

beforeAll(() => {
  db = createDb(TEST_URL);
});

afterAll(async () => {
  // Leave the shared test DB at its seeded state: drop only the rows these
  // tests created (FK order: pools → protocols → assets → wallets → cursor).
  await db.delete(capitalFlows).where(sql`asset_id = 'sync-asset'`);
  await db.delete(pools).where(sql`id = 'sync-pool'`);
  await db.delete(protocols).where(sql`id = 'sync-protocol'`);
  await db.delete(syncState).where(sql`chain_id = 'sync-chain'`);
  await db.execute(sql`DELETE FROM assets WHERE id = 'sync-asset'`);
  await db.execute(sql`DELETE FROM wallets WHERE id = 'sync-wallet'`);
  await db.execute(sql`DELETE FROM chains WHERE id = 'sync-chain'`);
  await db.$client.end();
});

describe('node upsert helpers (indexer sync)', () => {
  it('creates a chain idempotently', async () => {
    await ensureChain(db, { id: 'sync-chain', name: 'Sync Test Chain' });
    await expect(ensureChain(db, { id: 'sync-chain', name: 'Sync Test Chain' })).resolves
      .toBeUndefined();
  });

  it('creates and resolves wallets by address', async () => {
    const address = '0xabababababababababababababababababababab';
    await ensureWallet(db, { id: 'sync-wallet', address, label: 'Sync Wallet' });
    await expect(findWalletId(db, address)).resolves.toBe('sync-wallet');
    // Unknown address resolves to null.
    await expect(findWalletId(db, '0x00000000000000000000000000000000000000ff')).resolves.toBeNull();
  });

  it('resolves the seed wallet by its address (seed slugs)', async () => {
    await expect(findWalletId(db, '0x1111111111111111111111111111111111111111')).resolves.toBe(
      'wallet-1',
    );
  });

  it('creates and resolves assets by (symbol, chain)', async () => {
    await ensureChain(db, { id: 'sync-chain', name: 'Sync Test Chain' });
    await ensureAsset(db, {
      id: 'sync-asset',
      symbol: 'SYNC',
      name: 'Sync Token',
      chainId: 'sync-chain',
      decimals: 6,
    });
    await expect(findAssetId(db, 'SYNC', 'sync-chain')).resolves.toBe('sync-asset');
    // A different chain is a different asset.
    await expect(findAssetId(db, 'SYNC', 'polygon')).resolves.toBeNull();
  });

  it('resolves the seed asset by (symbol, chain)', async () => {
    await expect(findAssetId(db, 'USDC', 'ethereum')).resolves.toBe('usdc');
  });

  it('creates a protocol and a pool referencing the resolved asset', async () => {
    await ensureChain(db, { id: 'sync-chain', name: 'Sync Test Chain' });
    await ensureAsset(db, {
      id: 'sync-asset',
      symbol: 'SYNC',
      name: 'Sync Token',
      chainId: 'sync-chain',
      decimals: 6,
    });
    await ensureProtocol(db, { id: 'sync-protocol', name: 'Sync Protocol', chainId: 'sync-chain' });
    await ensurePool(db, {
      id: 'sync-pool',
      address: '0xpool',
      protocolId: 'sync-protocol',
      assetId: 'sync-asset',
    });
    // Idempotent re-upsert.
    await expect(
      ensurePool(db, {
        id: 'sync-pool',
        address: '0xpool',
        protocolId: 'sync-protocol',
        assetId: 'sync-asset',
      }),
    ).resolves.toBeUndefined();
  });

  it('reads and advances the per-chain sync cursor', async () => {
    // Use a dedicated chain id so the test is independent of other runs.
    const original = await getSyncCursor(db, 'sync-chain');
    await setSyncCursor(db, 'sync-chain', 1002);
    await expect(getSyncCursor(db, 'sync-chain')).resolves.toBe(1002);
    // Advancing again updates in place (single row per chain).
    await setSyncCursor(db, 'sync-chain', 1005);
    await expect(getSyncCursor(db, 'sync-chain')).resolves.toBe(1005);
    // Restore so re-runs stay green.
    if (original === 0) {
      await db.delete(syncState).where(sql`chain_id = 'sync-chain'`);
    } else {
      await setSyncCursor(db, 'sync-chain', original);
    }
  });
});
