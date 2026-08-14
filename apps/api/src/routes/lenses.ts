import { Hono } from 'hono';
import type { LensDefinition, LensType } from '@cohortlens/shared';
import { LENS_TYPES } from '@cohortlens/shared';
import {
  ExecutionStore,
  LensExecutionError,
  LensNotFoundError,
  LensRegistry,
  type GraphPort,
  type LensEngine,
} from '@cohortlens/lenses';

export interface LensRoutesDeps {
  registry: LensRegistry;
  engine: LensEngine;
  store: ExecutionStore;
  graph: GraphPort;
}

export function createLensRoutes(deps: LensRoutesDeps): Hono {
  const app = new Hono();

  app.get('/', (c) => c.json({ lenses: deps.registry.list() }));

  app.get('/:id', (c) => {
    const lens = deps.registry.get(c.req.param('id'));
    if (!lens) return c.json({ error: 'lens not found' }, 404);
    return c.json(lens);
  });

  // Register a Lens (metadata-only; an executor can be attached later).
  app.post('/', async (c) => {
    const body = await c.req.json().catch(() => null);
    const lens = parseLensDefinition(body);
    if (!lens) return c.json({ error: 'invalid lens definition' }, 400);
    try {
      deps.registry.register(lens);
      return c.json(lens, 201);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'registration failed';
      return c.json({ error: message }, 409);
    }
  });

  app.post('/:id/publish', (c) => {
    const lens = deps.registry.setActive(c.req.param('id'), true);
    if (!lens) return c.json({ error: 'lens not found' }, 404);
    return c.json(lens);
  });

  app.post('/:id/execute', async (c) => {
    const body = await c.req.json().catch(() => null);
    const rawParams = body && typeof body === 'object' ? (body as Record<string, unknown>).params : undefined;
    const params = isRecord(rawParams) ? rawParams : {};

    try {
      const result = await deps.engine.execute(c.req.param('id'), params, deps.graph);
      deps.store.save(result);
      return c.json({ result });
    } catch (err) {
      if (err instanceof LensNotFoundError) return c.json({ error: err.message }, 404);
      if (err instanceof LensExecutionError) return c.json({ error: err.message }, 400);
      const message = err instanceof Error ? err.message : 'execution failed';
      return c.json({ error: message }, 500);
    }
  });

  app.get('/:id/results', (c) => {
    const result = deps.store.latest(c.req.param('id'));
    if (!result) return c.json({ error: 'no execution results for lens' }, 404);
    return c.json({ result });
  });

  return app;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function parseLensDefinition(body: unknown): LensDefinition | null {
  if (!isRecord(body)) return null;
  const { id, name, type, description, inputSchema, price, active } = body;

  if (typeof id !== 'string' || id.length === 0) return null;
  if (typeof name !== 'string' || name.length === 0) return null;
  if (typeof type !== 'string' || !(LENS_TYPES as readonly string[]).includes(type)) {
    return null;
  }
  if (typeof description !== 'string') return null;
  if (price !== undefined && typeof price !== 'string') return null;

  return {
    id,
    name,
    type: type as LensType,
    description,
    inputSchema: isRecord(inputSchema) ? inputSchema : {},
    price: price ?? '0',
    active: active === undefined ? false : Boolean(active),
  };
}
