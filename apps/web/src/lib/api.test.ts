import { afterEach, describe, expect, it, vi } from 'vitest';
import { api } from './api';

function mockFetchOnce(data: unknown, status = 200) {
  const fn = vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: async () => data,
  });
  vi.stubGlobal('fetch', fn);
  return fn;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('api client', () => {
  it('getStats hits the right path and parses', async () => {
    const fetchMock = mockFetchOnce({
      nodes: { chain: 3, protocol: 5, wallet: 8, asset: 10, pool: 10, position: 8 },
      flows: 51,
      flowsByType: { Deposit: 9 },
    });

    const stats = await api.getStats();

    expect(stats.flows).toBe(51);
    expect(fetchMock).toHaveBeenCalledWith('/api/graph/stats', expect.any(Object));
  });

  it('throws the server error message on non-ok responses', async () => {
    mockFetchOnce({ error: 'invalid capital flow payload' }, 400);

    await expect(api.getFlows()).rejects.toThrow('invalid capital flow payload');
  });

  it('getNeighborhood encodes the node id', async () => {
    const fetchMock = mockFetchOnce({ node: { id: 'wallet-1', type: 'wallet', label: 'w1' }, flows: [] });

    await api.getNeighborhood('wallet 1');

    expect(fetchMock).toHaveBeenCalledWith('/api/graph/neighborhood/wallet%201', expect.any(Object));
  });

  it('executeLens posts params and unwraps the result', async () => {
    const fetchMock = mockFetchOnce({
      result: {
        lensId: 'high-risk-wallets',
        signal: 'risk',
        generatedAt: '2026-08-14T00:00:00.000Z',
        findings: [],
        summary: '5 findings',
      },
    });

    const result = await api.executeLens('high-risk-wallets', { limit: 5 });

    expect(result.lensId).toBe('high-risk-wallets');
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(init.method).toBe('POST');
    expect(JSON.parse(String(init.body))).toEqual({ params: { limit: 5 } });
  });

  it('findPath builds the query string', async () => {
    const fetchMock = mockFetchOnce({
      route: { source: 'wallet-1', target: 'wallet-5', nodes: [], steps: [], totalCost: 0 },
    });

    await api.findPath('wallet-1', 'wallet-5');

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/analysis/path?source=wallet-1&target=wallet-5',
      expect.any(Object),
    );
  });
});
