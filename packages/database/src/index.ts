/**
 * @cohortlens/database — PostgreSQL access for CohortLens.
 *
 * Drizzle ORM schema for the Capital Flow Graph (see ADR 004, updated to
 * Drizzle when implementing issue #8), a lazy client factory, and graph
 * repository functions used by the API.
 */
export * from './schema';
export { createDb, type Db } from './client';
export {
  createFlow,
  getFlow,
  getNeighborhood,
  getStats,
  listFlows,
  listNodes,
  type CreateCapitalFlowInput,
  type GraphStats,
  type NodeNeighborhood,
} from './graph';
