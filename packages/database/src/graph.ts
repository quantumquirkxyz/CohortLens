import { desc, eq, or, sql } from 'drizzle-orm';
import {
  FLOW_TYPES,
  type CapitalFlow,
  type FlowType,
  type GraphNode,
  type NodeType,
} from '@cohortlens/shared';
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

/** Input accepted when creating a capital flow (indexer webhook). */
export interface CreateCapitalFlowInput {
  fromNodeId: string;
  fromNodeType: NodeType;
  toNodeId: string;
  toNodeType: NodeType;
  type: FlowType;
  /** Numeric-as-string (PostgreSQL NUMERIC precision). */
  amount: string;
  assetId: string;
  chainId: string;
  timestamp?: Date;
  metadata?: Record<string, unknown> | null;
}

export interface GraphStats {
  nodes: Record<NodeType, number>;
  flows: number;
  flowsByType: Record<FlowType, number>;
}

export interface NodeNeighborhood {
  node: GraphNode;
  flows: CapitalFlow[];
}

/** Base query: capital flows joined with their asset symbol and chain name. */
function flowQuery(db: Db) {
  return db
    .select({
      id: capitalFlows.id,
      fromNodeId: capitalFlows.fromNodeId,
      fromNodeType: capitalFlows.fromNodeType,
      toNodeId: capitalFlows.toNodeId,
      toNodeType: capitalFlows.toNodeType,
      type: capitalFlows.type,
      amount: capitalFlows.amount,
      asset: assets.symbol,
      chain: chains.name,
      timestamp: capitalFlows.timestamp,
      metadata: capitalFlows.metadata,
    })
    .from(capitalFlows)
    // assetId/chainId are NOT NULL foreign keys, so an inner join cannot drop rows.
    .innerJoin(assets, eq(capitalFlows.assetId, assets.id))
    .innerJoin(chains, eq(capitalFlows.chainId, chains.id));
}

type FlowRow = Awaited<ReturnType<typeof flowQuery>>[number];

/** NUMERIC(36,18) round-trips as e.g. '42.500000000000000000'; trim to '42.5'. */
function normalizeAmount(value: string): string {
  if (!value.includes('.')) return value;
  return value.replace(/\.?0+$/, '');
}

function toCapitalFlow(row: FlowRow): CapitalFlow {
  return {
    id: row.id,
    from: { id: row.fromNodeId, type: row.fromNodeType },
    to: { id: row.toNodeId, type: row.toNodeType },
    type: row.type,
    amount: normalizeAmount(row.amount),
    asset: row.asset,
    chain: row.chain,
    timestamp: row.timestamp,
    metadata: row.metadata,
  };
}

export async function listNodes(db: Db): Promise<GraphNode[]> {
  const [chainRows, protocolRows, walletRows, assetRows, poolRows, positionRows] =
    await Promise.all([
      db.select().from(chains),
      db.select().from(protocols),
      db.select().from(wallets),
      db.select().from(assets),
      db.select().from(pools),
      db.select().from(positions),
    ]);

  return [
    ...chainRows.map((r) => ({ type: 'chain' as const, id: r.id, label: r.name })),
    ...protocolRows.map((r) => ({
      type: 'protocol' as const,
      id: r.id,
      label: r.name,
    })),
    ...walletRows.map((r) => ({
      type: 'wallet' as const,
      id: r.id,
      label: r.label ?? r.address,
    })),
    ...assetRows.map((r) => ({ type: 'asset' as const, id: r.id, label: r.symbol })),
    ...poolRows.map((r) => ({ type: 'pool' as const, id: r.id, label: r.id })),
    ...positionRows.map((r) => ({
      type: 'position' as const,
      id: r.id,
      label: r.id,
    })),
  ];
}

export async function listFlows(db: Db, limit = 100): Promise<CapitalFlow[]> {
  const rows = await flowQuery(db)
    .orderBy(desc(capitalFlows.timestamp))
    .limit(limit);
  return rows.map(toCapitalFlow);
}

export async function getFlow(db: Db, id: string): Promise<CapitalFlow | null> {
  const rows = await flowQuery(db).where(eq(capitalFlows.id, id)).limit(1);
  return rows[0] ? toCapitalFlow(rows[0]) : null;
}

export async function createFlow(
  db: Db,
  input: CreateCapitalFlowInput,
): Promise<CapitalFlow> {
  const [row] = await db
    .insert(capitalFlows)
    .values({
      fromNodeId: input.fromNodeId,
      fromNodeType: input.fromNodeType,
      toNodeId: input.toNodeId,
      toNodeType: input.toNodeType,
      type: input.type,
      amount: input.amount,
      assetId: input.assetId,
      chainId: input.chainId,
      timestamp: input.timestamp ?? new Date(),
      metadata: input.metadata ?? null,
    })
    .returning();
  const flow = await getFlow(db, row.id);
  if (!flow) throw new Error('created capital flow could not be re-read');
  return flow;
}

export async function getStats(db: Db): Promise<GraphStats> {
  const [chainCount, protocolCount, walletCount, assetCount, poolCount, positionCount] =
    await Promise.all([
      db.select({ count: sql<number>`count(*)::int` }).from(chains),
      db.select({ count: sql<number>`count(*)::int` }).from(protocols),
      db.select({ count: sql<number>`count(*)::int` }).from(wallets),
      db.select({ count: sql<number>`count(*)::int` }).from(assets),
      db.select({ count: sql<number>`count(*)::int` }).from(pools),
      db.select({ count: sql<number>`count(*)::int` }).from(positions),
    ]);

  const [flowRows, byTypeRows] = await Promise.all([
    db.select({ count: sql<number>`count(*)::int` }).from(capitalFlows),
    db
      .select({ type: capitalFlows.type, count: sql<number>`count(*)::int` })
      .from(capitalFlows)
      .groupBy(capitalFlows.type),
  ]);

  const flowsByType = Object.fromEntries(FLOW_TYPES.map((t) => [t, 0])) as Record<
    FlowType,
    number
  >;
  for (const row of byTypeRows) {
    flowsByType[row.type] = row.count;
  }

  return {
    nodes: {
      chain: chainCount[0]?.count ?? 0,
      protocol: protocolCount[0]?.count ?? 0,
      wallet: walletCount[0]?.count ?? 0,
      asset: assetCount[0]?.count ?? 0,
      pool: poolCount[0]?.count ?? 0,
      position: positionCount[0]?.count ?? 0,
    },
    flows: flowRows[0]?.count ?? 0,
    flowsByType,
  };
}

export async function getNeighborhood(
  db: Db,
  id: string,
): Promise<NodeNeighborhood | null> {
  const node = await findNode(db, id);
  if (!node) return null;

  const rows = await flowQuery(db)
    .where(or(eq(capitalFlows.fromNodeId, id), eq(capitalFlows.toNodeId, id)))
    .orderBy(desc(capitalFlows.timestamp));

  return { node, flows: rows.map(toCapitalFlow) };
}

async function findNode(db: Db, id: string): Promise<GraphNode | null> {
  const [chainRow] = await db.select().from(chains).where(eq(chains.id, id)).limit(1);
  if (chainRow) return { type: 'chain', id: chainRow.id, label: chainRow.name };

  const [protocolRow] = await db
    .select()
    .from(protocols)
    .where(eq(protocols.id, id))
    .limit(1);
  if (protocolRow) return { type: 'protocol', id: protocolRow.id, label: protocolRow.name };

  const [walletRow] = await db.select().from(wallets).where(eq(wallets.id, id)).limit(1);
  if (walletRow) {
    return { type: 'wallet', id: walletRow.id, label: walletRow.label ?? walletRow.address };
  }

  const [assetRow] = await db.select().from(assets).where(eq(assets.id, id)).limit(1);
  if (assetRow) return { type: 'asset', id: assetRow.id, label: assetRow.symbol };

  const [poolRow] = await db.select().from(pools).where(eq(pools.id, id)).limit(1);
  if (poolRow) return { type: 'pool', id: poolRow.id, label: poolRow.id };

  const [positionRow] = await db
    .select()
    .from(positions)
    .where(eq(positions.id, id))
    .limit(1);
  if (positionRow) return { type: 'position', id: positionRow.id, label: positionRow.id };

  return null;
}
