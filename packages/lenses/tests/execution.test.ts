import { describe, expect, it, vi } from 'vitest';
import type { LensDefinition, LensResult } from '@cohortlens/shared';
import {
  createEngine,
  LensExecutionError,
  LensNotFoundError,
  type RegisteredLens,
} from '../src/execution';
import type { GraphPort } from '../src/graph-port';
import { LensRegistry } from '../src/registry';

const noopGraph: GraphPort = {
  listNodes: async () => [],
  listFlows: async () => [],
  getStats: async () => ({ nodes: {}, flows: 0 }),
};

const execLens: RegisteredLens = {
  id: 'exec-lens',
  name: 'Exec Lens',
  type: 'graph_query',
  description: 'test lens',
  inputSchema: {},
  price: '1',
  active: true,
  execute: vi.fn(async (): Promise<LensResult> => ({
    lensId: 'exec-lens',
    signal: 'recommendation',
    generatedAt: new Date(),
    findings: [],
    summary: 'done',
  })),
};

const metadataOnly: LensDefinition = {
  id: 'metadata-only',
  name: 'Metadata Only',
  type: 'ml_model',
  description: 'registered without an executor',
  inputSchema: {},
  price: '2',
  active: true,
};

describe('LensEngine', () => {
  it('executes a registered lens with params and the graph port', async () => {
    const registry = new LensRegistry();
    registry.register(execLens);
    const engine = createEngine(registry);

    const result = await engine.execute('exec-lens', { a: 1 }, noopGraph);
    expect(result.lensId).toBe('exec-lens');
    expect(execLens.execute).toHaveBeenCalledWith({ params: { a: 1 }, graph: noopGraph });
  });

  it('throws LensNotFoundError for an unknown lens', async () => {
    const engine = createEngine(new LensRegistry());
    await expect(engine.execute('nope', {}, noopGraph)).rejects.toBeInstanceOf(
      LensNotFoundError,
    );
  });

  it('rejects execution of an inactive lens', async () => {
    const registry = new LensRegistry();
    registry.register({ ...execLens, active: false });
    const engine = createEngine(registry);
    await expect(engine.execute('exec-lens', {}, noopGraph)).rejects.toThrow(
      LensExecutionError,
    );
  });

  it('rejects execution of a lens with no executor', async () => {
    const registry = new LensRegistry();
    registry.register(metadataOnly);
    const engine = createEngine(registry);
    await expect(engine.execute('metadata-only', {}, noopGraph)).rejects.toThrow(
      /no executor/,
    );
  });
});
