/**
 * Topological analysis (issue #10): graph-theoretic algorithms run on the
 * Capital Flow Graph — community detection, cheapest paths, centrality, and
 * co-movement (CONTEXT.md — Topological analysis). Pure functions over
 * `CapitalFlow[]`; the API loads the graph from the database.
 */
export { detectCommunities } from './communities';
export { findCheapestPath } from './paths';
export { betweennessCentrality, degreeCentrality } from './centrality';
export { detectCoMovement } from './co-movement';
