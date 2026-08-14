import { sql } from 'drizzle-orm';
import {
  bigint,
  index,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  unique,
} from 'drizzle-orm/pg-core';

/** Default id: caller-supplied slug in seed data, random uuid otherwise. */
const defaultId = sql`gen_random_uuid()::text`;
import { FLOW_TYPES, NODE_TYPES } from '@cohortlens/shared';

export const nodeTypeEnum = pgEnum('node_type', NODE_TYPES);
export const flowTypeEnum = pgEnum('flow_type', FLOW_TYPES);
export const positionTypeEnum = pgEnum('position_type', ['deposit', 'borrow']);

// === NODES ===

export const chains = pgTable('chains', {
  id: text('id').primaryKey().default(defaultId),
  name: text('name').notNull().unique(),
  rpcUrl: text('rpc_url'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const protocols = pgTable(
  'protocols',
  {
    id: text('id').primaryKey().default(defaultId),
    name: text('name').notNull(),
    chainId: text('chain_id')
      .notNull()
      .references(() => chains.id),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('protocols_chain_idx').on(t.chainId)],
);

export const wallets = pgTable('wallets', {
  id: text('id').primaryKey().default(defaultId),
  address: text('address').notNull().unique(),
  label: text('label'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const assets = pgTable(
  'assets',
  {
    id: text('id').primaryKey().default(defaultId),
    symbol: text('symbol').notNull(),
    name: text('name').notNull(),
    chainId: text('chain_id')
      .notNull()
      .references(() => chains.id),
    decimals: integer('decimals').notNull().default(18),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('assets_chain_idx').on(t.chainId),
    unique('assets_symbol_chain_uq').on(t.symbol, t.chainId),
  ],
);

export const pools = pgTable(
  'pools',
  {
    id: text('id').primaryKey().default(defaultId),
    protocolId: text('protocol_id')
      .notNull()
      .references(() => protocols.id),
    assetId: text('asset_id')
      .notNull()
      .references(() => assets.id),
    address: text('address'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('pools_protocol_idx').on(t.protocolId), index('pools_asset_idx').on(t.assetId)],
);

export const positions = pgTable(
  'positions',
  {
    id: text('id').primaryKey().default(defaultId),
    walletId: text('wallet_id')
      .notNull()
      .references(() => wallets.id),
    poolId: text('pool_id')
      .notNull()
      .references(() => pools.id),
    amount: numeric('amount', { precision: 36, scale: 18 }).notNull(),
    /** The wallet's exposure on the pool: 'deposit' | 'borrow'. */
    type: positionTypeEnum('type').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    unique('positions_wallet_pool_type_uq').on(t.walletId, t.poolId, t.type),
    index('positions_wallet_idx').on(t.walletId),
  ],
);

// === EDGES (Capital Flows) ===
// Adjacency list with typed node references: from/to point at any node table
// via (id, type). Referential integrity for the node tables themselves is
// enforced by each table's own primary key; the polymorphic edge is checked
// by the application layer (issue #8 scope).

export const capitalFlows = pgTable(
  'capital_flows',
  {
    id: text('id').primaryKey().default(defaultId),
    fromNodeId: text('from_node_id').notNull(),
    fromNodeType: nodeTypeEnum('from_node_type').notNull(),
    toNodeId: text('to_node_id').notNull(),
    toNodeType: nodeTypeEnum('to_node_type').notNull(),
    type: flowTypeEnum('type').notNull(),
    amount: numeric('amount', { precision: 36, scale: 18 }).notNull(),
    assetId: text('asset_id')
      .notNull()
      .references(() => assets.id),
    chainId: text('chain_id')
      .notNull()
      .references(() => chains.id),
    timestamp: timestamp('timestamp', { withTimezone: true }).notNull(),
    metadata: jsonb('metadata').$type<Record<string, unknown> | null>(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('capital_flows_from_idx').on(t.fromNodeId),
    index('capital_flows_to_idx').on(t.toNodeId),
    index('capital_flows_type_idx').on(t.type),
    index('capital_flows_timestamp_idx').on(t.timestamp),
    index('capital_flows_path_idx').on(t.fromNodeId, t.toNodeId, t.timestamp),
  ],
);

// === INDEXER STATE ===
// Per-chain ingestion cursor for the Fase 6 sync service (subgraph → CFG).

export const syncState = pgTable('sync_state', {
  chainId: text('chain_id').primaryKey(),
  lastBlock: bigint('last_block', { mode: 'number' }).notNull().default(0),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// === ANALYTICS TABLES ===
// Lightweight stand-ins for the materialized views the topological analysis
// (Fase 3) will compute; seeded empty by the seed script.

export const cohortMetrics = pgTable('cohort_metrics', {
  id: text('id').primaryKey().default(defaultId),
  name: text('name').notNull(),
  walletIds: jsonb('wallet_ids').notNull().$type<string[]>(),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const protocolMetrics = pgTable(
  'protocol_metrics',
  {
    id: text('id').primaryKey().default(defaultId),
    protocolId: text('protocol_id')
      .notNull()
      .references(() => protocols.id),
    metric: text('metric').notNull(),
    value: numeric('value', { precision: 36, scale: 18 }).notNull(),
    measuredAt: timestamp('measured_at', { withTimezone: true }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('protocol_metrics_protocol_idx').on(t.protocolId)],
);
