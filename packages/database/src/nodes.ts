import { and, eq, sql } from 'drizzle-orm';
import { assets, chains, pools, protocols, syncState, wallets } from './schema';
import type { Db } from './client';

/**
 * Upsert helpers for CFG nodes, used by the indexer sync service (Fase 6) to
 * create/refresh the node rows referenced by ingested capital flows. Node ids
 * are caller-supplied slugs (subgraph entity ids), consistent with the seed
 * data convention.
 */

export interface EnsureChainInput {
  id: string;
  name: string;
  rpcUrl?: string | null;
}

export interface EnsureWalletInput {
  /** Lowercased address (used as the node id slug). */
  id: string;
  address: string;
  label?: string | null;
}

export interface EnsureAssetInput {
  id: string;
  symbol: string;
  name: string;
  chainId: string;
  decimals?: number;
}

export interface EnsureProtocolInput {
  id: string;
  name: string;
  chainId: string;
}

export interface EnsurePoolInput {
  id: string;
  address?: string | null;
  protocolId: string;
  assetId: string;
}

/** Resolve the existing wallet id for an address, if any. */
export async function findWalletId(db: Db, address: string): Promise<string | null> {
  const [row] = await db
    .select({ id: wallets.id })
    .from(wallets)
    .where(eq(wallets.address, address))
    .limit(1);
  return row?.id ?? null;
}

/** Resolve the existing asset id for a (symbol, chain) pair, if any. */
export async function findAssetId(
  db: Db,
  symbol: string,
  chainId: string,
): Promise<string | null> {
  const [row] = await db
    .select({ id: assets.id })
    .from(assets)
    .where(and(eq(assets.symbol, symbol), eq(assets.chainId, chainId)))
    .limit(1);
  return row?.id ?? null;
}

export async function ensureChain(db: Db, input: EnsureChainInput): Promise<void> {
  await db
    .insert(chains)
    .values({ id: input.id, name: input.name, rpcUrl: input.rpcUrl ?? null })
    .onConflictDoUpdate({ target: chains.id, set: { name: input.name } });
}

export async function ensureWallet(db: Db, input: EnsureWalletInput): Promise<void> {
  await db
    .insert(wallets)
    .values({ id: input.id, address: input.address, label: input.label ?? null })
    .onConflictDoUpdate({ target: wallets.id, set: { address: input.address } });
}

export async function ensureAsset(db: Db, input: EnsureAssetInput): Promise<void> {
  await db
    .insert(assets)
    .values({
      id: input.id,
      symbol: input.symbol,
      name: input.name,
      chainId: input.chainId,
      decimals: input.decimals ?? 18,
    })
    .onConflictDoUpdate({
      target: assets.id,
      set: { symbol: input.symbol, name: input.name, chainId: input.chainId },
    });
}

export async function ensureProtocol(db: Db, input: EnsureProtocolInput): Promise<void> {
  await db
    .insert(protocols)
    .values({ id: input.id, name: input.name, chainId: input.chainId })
    .onConflictDoUpdate({ target: protocols.id, set: { name: input.name, chainId: input.chainId } });
}

export async function ensurePool(db: Db, input: EnsurePoolInput): Promise<void> {
  await db
    .insert(pools)
    .values({
      id: input.id,
      protocolId: input.protocolId,
      assetId: input.assetId,
      address: input.address ?? null,
    })
    .onConflictDoUpdate({
      target: pools.id,
      set: { protocolId: input.protocolId, assetId: input.assetId },
    });
}

// === Sync cursor (sync_state table) ===

export async function getSyncCursor(db: Db, chainId: string): Promise<number> {
  const [row] = await db
    .select({ lastBlock: syncState.lastBlock })
    .from(syncState)
    .where(eq(syncState.chainId, chainId));
  return row?.lastBlock ?? 0;
}

export async function setSyncCursor(db: Db, chainId: string, lastBlock: number): Promise<void> {
  await db
    .insert(syncState)
    .values({ chainId, lastBlock })
    .onConflictDoUpdate({
      target: syncState.chainId,
      set: { lastBlock, updatedAt: sql`now()` },
    });
}
