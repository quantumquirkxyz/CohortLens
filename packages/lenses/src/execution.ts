import type { LensDefinition, LensResult } from '@cohortlens/shared';
import type { GraphPort } from './graph-port';
import type { LensRegistry } from './registry';

export interface LensExecutionContext {
  params: Record<string, unknown>;
  graph: GraphPort;
}

/** A Lens with its executor attached (the registry stores these). */
export type RegisteredLens = LensDefinition & {
  execute(ctx: LensExecutionContext): Promise<LensResult>;
};

export class LensNotFoundError extends Error {
  constructor(id: string) {
    super(`lens not found: ${id}`);
    this.name = 'LensNotFoundError';
  }
}

export class LensExecutionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'LensExecutionError';
  }
}

export interface LensEngine {
  execute(
    id: string,
    params: Record<string, unknown>,
    graph: GraphPort,
  ): Promise<LensResult>;
}

export function createEngine(registry: LensRegistry): LensEngine {
  return {
    async execute(id, params, graph) {
      const lens = registry.get(id) as RegisteredLens | undefined;
      if (!lens) throw new LensNotFoundError(id);
      if (!lens.active) {
        throw new LensExecutionError(`lens is not active: ${id}`);
      }
      if (typeof lens.execute !== 'function') {
        throw new LensExecutionError(`no executor registered for lens: ${id}`);
      }
      return lens.execute({ params, graph });
    },
  };
}
