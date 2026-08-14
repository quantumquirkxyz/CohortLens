import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Overview } from './Overview';
import { api } from '../lib/api';

vi.mock('../lib/api', () => ({
  api: {
    getStats: vi.fn(),
    getFlows: vi.fn(),
  },
}));

function renderOverview() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <Overview />
    </QueryClientProvider>,
  );
}

describe('Overview page', () => {
  it('renders metrics and recent flows from the API', async () => {
    vi.mocked(api.getStats).mockResolvedValue({
      nodes: { chain: 3, protocol: 5, wallet: 8, asset: 10, pool: 10, position: 8 },
      flows: 51,
      flowsByType: { Deposit: 9, Borrow: 9, Repay: 0, Withdraw: 0, Swap: 0, Transfer: 0 },
    });
    vi.mocked(api.getFlows).mockResolvedValue({
      page: 1,
      limit: 10,
      flows: [
        {
          id: 'flow-1',
          from: { id: 'wallet-1', type: 'wallet' },
          to: { id: 'aave-v3-usdc-ethereum', type: 'pool' },
          type: 'Deposit',
          amount: '100',
          asset: 'USDC',
          chain: 'Ethereum',
          timestamp: new Date('2026-01-01T00:00:00Z'),
        },
      ],
    });

    renderOverview();

    expect(await screen.findByText('51')).toBeInTheDocument();
    expect(screen.getByText('Recent flows (1)')).toBeInTheDocument();
    expect(screen.getByText('wallet-1')).toBeInTheDocument();
    expect(screen.getByText('aave-v3-usdc-ethereum')).toBeInTheDocument();
    expect(screen.getAllByText('Deposit').length).toBeGreaterThan(0);
  });

  it('shows an error card when stats fail to load', async () => {
    vi.mocked(api.getStats).mockRejectedValue(new Error('boom'));
    vi.mocked(api.getFlows).mockResolvedValue({ page: 1, limit: 10, flows: [] });

    renderOverview();

    expect(await screen.findByText(/Failed to load graph stats/)).toBeInTheDocument();
  });
});
