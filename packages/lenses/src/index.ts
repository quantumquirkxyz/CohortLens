/**
 * @cohortlens/lenses — Lens framework for CohortLens.
 *
 * Registry + execution engine for Lenses (CONTEXT.md — Lens), plus built-in
 * prototype Lenses. The engine is pure; Lenses reach the Capital Flow Graph
 * through the injected GraphPort, which the API wires to the database.
 */
export { LensRegistry } from './registry';
export {
  createEngine,
  LensExecutionError,
  LensNotFoundError,
  type LensEngine,
  type LensExecutionContext,
  type RegisteredLens,
} from './execution';
export { ExecutionStore } from './execution-store';
export { type GraphPort, type GraphStats, type ListFlowsOptions } from './graph-port';
export { highRiskWallets } from './lenses/high-risk-wallets';
