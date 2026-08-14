/**
 * @cohortlens/database — PostgreSQL access for CohortLens.
 *
 * Drizzle ORM schema for the Capital Flow Graph (see ADR 004, updated to
 * Drizzle when implementing issue #8), a lazy client factory, and graph
 * repository functions used by the API.
 */
export * from './schema';
export { createDb, type Db } from './client';
export { bootstrapTestDatabase } from './test-utils';
export {
  ensureAsset,
  ensureChain,
  ensurePool,
  ensureProtocol,
  ensureWallet,
  findAssetId,
  findWalletId,
  getSyncCursor,
  setSyncCursor,
  type EnsureAssetInput,
  type EnsureChainInput,
  type EnsurePoolInput,
  type EnsureProtocolInput,
  type EnsureWalletInput,
} from './nodes';
export {
  createFlow,
  getFlow,
  getNeighborhood,
  getStats,
  listFlows,
  listNodes,
  type CreateCapitalFlowInput,
  type GraphStats,
  type ListFlowsOptions,
  type NodeNeighborhood,
} from './graph';
