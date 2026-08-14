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
