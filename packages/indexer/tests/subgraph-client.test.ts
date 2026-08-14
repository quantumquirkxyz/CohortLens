import { afterEach, describe, expect, it, vi } from 'vitest';
import { createGraphqlSubgraphClient } from '../src/subgraph-client';
import type { SubgraphCapitalFlow } from '../src/types';

afterEach(() => vi.unstubAllGlobals());

describe('createGraphqlSubgraphClient', () => {
  it('queries the per-chain endpoint with the cursor as a variable', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ data: { capitalFlows: [] } }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const client = createGraphqlSubgraphClient({ ethereum: 'http://graph/eth' });
    await client.queryCapitalFlows('ethereum', 123);

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('http://graph/eth');
    const body = JSON.parse(String(init.body)) as { variables: { lastBlock: string } };
    expect(body.variables.lastBlock).toBe('123');
  });

  it('throws when the endpoint for a chain is missing', async () => {
    const client = createGraphqlSubgraphClient({});
    await expect(client.queryCapitalFlows('ethereum', 0)).rejects.toThrow(
      'no subgraph endpoint configured for chain: ethereum',
    );
  });

  it('throws the GraphQL error message on failed queries', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({ errors: [{ message: 'indexing paused' }] }),
      }),
    );
    const client = createGraphqlSubgraphClient({ ethereum: 'http://graph/eth' });
    await expect(client.queryCapitalFlows('ethereum', 0)).rejects.toThrow('indexing paused');
  });

  it('returns the capitalFlows payload', async () => {
    const flows = [{ id: 'x', type: 'DEPOSIT' }] as unknown as SubgraphCapitalFlow[];
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ data: { capitalFlows: flows } }),
      }),
    );
    const client = createGraphqlSubgraphClient({ ethereum: 'http://graph/eth' });
    await expect(client.queryCapitalFlows('ethereum', 0)).resolves.toEqual(flows);
  });
});
