import {
  createFlow,
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
} from '@cohortlens/database';
import type { SyncBatch } from './transform';

export interface SyncStore {
  getCursor(chainId: string): Promise<number>;
  setCursor(chainId: string, lastBlock: number): Promise<void>;
  /** Upsert nodes then insert flows; returns the number of flows ingested. */
  ingest(batch: SyncBatch): Promise<number>;
}

/**
 * Asset identity is (symbol, chain) in the CFG (enforced by a unique
 * constraint), while subgraphs key assets by token address. Resolve each
 * subgraph asset to the existing row when possible, so the same token never
 * materializes twice.
 */
async function resolveAssetIds(
  db: Db,
  assets: SyncBatch['nodes']['assets'],
): Promise<Map<string, string>> {
  const resolved = new Map<string, string>();
  for (const asset of assets) {
    const existing = await findAssetId(db, asset.symbol, asset.chainId);
    if (existing) {
      resolved.set(asset.id, existing);
    } else {
      await ensureAsset(db, asset);
      resolved.set(asset.id, asset.id);
    }
  }
  return resolved;
}

/**
 * Wallet identity is the address in the CFG (enforced by a unique
 * constraint), while subgraph wallets are keyed by the same address but the
 * seed data uses slug ids (wallet-1…). Resolve each subgraph wallet to the
 * existing row by address so the same wallet never materializes twice.
 */
async function resolveWalletIds(
  db: Db,
  wallets: SyncBatch['nodes']['wallets'],
): Promise<Map<string, string>> {
  const resolved = new Map<string, string>();
  for (const wallet of wallets) {
    const existing = await findWalletId(db, wallet.address);
    if (existing) {
      resolved.set(wallet.id, existing);
    } else {
      await ensureWallet(db, wallet);
      resolved.set(wallet.id, wallet.id);
    }
  }
  return resolved;
}

/** Store backed by the CohortLens PostgreSQL database. */
export function createDbSyncStore(db: Db): SyncStore {
  return {
    getCursor: (chainId) => getSyncCursor(db, chainId),
    setCursor: (chainId, lastBlock) => setSyncCursor(db, chainId, lastBlock),

    async ingest(batch) {
      // FK order: chains → protocols/assets → wallets → pools → flows.
      for (const chain of batch.nodes.chains) await ensureChain(db, chain);
      for (const protocol of batch.nodes.protocols) await ensureProtocol(db, protocol);

      const assetIds = await resolveAssetIds(db, batch.nodes.assets);
      const assetId = (id: string): string => assetIds.get(id) ?? id;

      const walletIds = await resolveWalletIds(db, batch.nodes.wallets);
      const walletId = (id: string): string => walletIds.get(id) ?? id;

      for (const pool of batch.nodes.pools) {
        await ensurePool(db, { ...pool, assetId: assetId(pool.assetId) });
      }
      // createFlow dedupes on the subgraph entity id, so a re-sync that
      // replays an already-ingested batch inserts nothing new.
      let inserted = 0;
      for (const flow of batch.flows) {
        const created = await createFlow(db, {
          ...flow,
          fromNodeId: walletId(flow.fromNodeId),
          toNodeId: walletId(flow.toNodeId),
          assetId: assetId(flow.assetId),
        });
        if (created) inserted += 1;
      }
      return inserted;
    },
  };
}
