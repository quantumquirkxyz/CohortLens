/**
 * @cohortlens/shared — shared types and utilities for CohortLens.
 *
 * Domain vocabulary follows CONTEXT.md: the Capital Flow Graph has typed
 * nodes (Wallet, Protocol, Chain, Asset, Pool, Position) and typed capital
 * flow edges (Deposit, Borrow, Repay, Withdraw, Swap, Transfer).
 */
export const APP_NAME = 'CohortLens';

/** Node types of the Capital Flow Graph (CONTEXT.md — Nodes). */
export const NODE_TYPES = [
  'wallet',
  'protocol',
  'chain',
  'asset',
  'pool',
  'position',
] as const;

export type NodeType = (typeof NODE_TYPES)[number];

/** Canonical capital flow types (CONTEXT.md — Edges). */
export const FLOW_TYPES = [
  'Deposit',
  'Borrow',
  'Repay',
  'Withdraw',
  'Swap',
  'Transfer',
] as const;

export type FlowType = (typeof FLOW_TYPES)[number];

export function isNodeType(value: unknown): value is NodeType {
  return typeof value === 'string' && (NODE_TYPES as readonly string[]).includes(value);
}

export function isFlowType(value: unknown): value is FlowType {
  return typeof value === 'string' && (FLOW_TYPES as readonly string[]).includes(value);
}

/** A typed reference to a node of the Capital Flow Graph. */
export interface NodeRef {
  id: string;
  type: NodeType;
}

/**
 * A capital flow edge in the graph.
 *
 * `amount` is a numeric-as-string (PostgreSQL NUMERIC precision) and `asset` /
 * `chain` are display identifiers (asset symbol, chain name) resolved from the
 * referenced rows by the data layer.
 */
export interface CapitalFlow {
  id: string;
  from: NodeRef;
  to: NodeRef;
  type: FlowType;
  amount: string;
  asset: string;
  chain: string;
  timestamp: Date;
  metadata?: Record<string, unknown> | null;
}

/** A node as returned by the graph API. */
export interface GraphNode {
  type: NodeType;
  id: string;
  label: string;
}

/** Categories of Lenses (CONTEXT.md — Lens). */
export const LENS_TYPES = ['ml_model', 'graph_query', 'risk_signal'] as const;

export type LensType = (typeof LENS_TYPES)[number];

/**
 * A registered, priced capability that answers a question about the Capital
 * Flow Graph (CONTEXT.md — Lens). `price` is LENS per query, numeric-as-string.
 */
export interface LensDefinition {
  id: string;
  name: string;
  type: LensType;
  description: string;
  /** Loose description of accepted parameters (prototype; JSON Schema later). */
  inputSchema: Record<string, unknown>;
  /** LENS per query, numeric-as-string. */
  price: string;
  active: boolean;
}

/** Whether a value is a plain positive decimal (numeric-as-string). */
export function isNumericString(value: unknown): value is string {
  return typeof value === 'string' && /^\d+(\.\d+)?$/.test(value);
}

/** Whether a value is a non-null, non-array object. */
export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** The kinds of Signals a Lens can produce (CONTEXT.md — Signal). */
export const SIGNAL_KINDS = ['risk', 'liquidity', 'recommendation'] as const;

export type SignalKind = (typeof SIGNAL_KINDS)[number];

/** A single typed observation produced by a Lens. */
export interface LensFinding {
  /** The node the finding refers to (a Wallet, Pool, Protocol, ...). */
  nodeId: string;
  nodeType: NodeType;
  /** Normalized 0..1 heuristic score. */
  score: number;
  reasons: string[];
}

/** The output of a Lens execution (a Signal, Prediction, or Route). */
export interface LensResult {
  lensId: string;
  signal: SignalKind;
  generatedAt: Date;
  findings: LensFinding[];
  summary: string;
}

/** A set of Wallets sharing behavioral patterns (CONTEXT.md — Cohort). */
export interface Cohort {
  id: string;
  label: string;
  wallets: string[];
}

/**
 * A proposed sequence of capital-flow edges between two nodes, found as the
 * cheapest/lowest-cost path (CONTEXT.md — Route). Recommended, never executed.
 */
export interface Route {
  source: string;
  target: string;
  /** Node ids along the path, source first. */
  nodes: string[];
  /** The capital-flow edges traversed, in order. */
  steps: CapitalFlow[];
  totalCost: number;
}

/** Correlation between two assets over the same time buckets. */
export interface CoMovementPair {
  assetA: string;
  assetB: string;
  /** Pearson correlation in [-1, 1]. */
  correlation: number;
  /** Number of shared time buckets used. */
  samples: number;
}

/** Asset co-movement analysis over time-bucketed flow volume (CONTEXT.md — Signal). */
export interface CoMovementResult {
  assets: string[];
  bucket: string;
  pairs: CoMovementPair[];
}

export {
  betweennessCentrality,
  degreeCentrality,
  detectCoMovement,
  detectCommunities,
  findCheapestPath,
} from './algorithms';
