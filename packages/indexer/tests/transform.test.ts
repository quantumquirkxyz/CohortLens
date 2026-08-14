import { describe, expect, it } from 'vitest';
import { transformFlows } from '../src/transform';
import type { SubgraphCapitalFlow } from '../src/types';

function flow(overrides: Partial<SubgraphCapitalFlow> = {}): SubgraphCapitalFlow {
  return {
    id: '0xabc-1',
    type: 'DEPOSIT',
    fromWallet: { id: '0x1111', address: '0x1111' },
    toWallet: { id: '0x2222', address: '0x2222' },
    pool: {
      id: '0xpool',
      address: '0xpool',
      protocol: { id: 'aave', name: 'Aave V3', chain: { id: 'ethereum', name: 'Ethereum' } },
    },
    asset: { id: '0xtoken', symbol: 'USDC', name: 'USD Coin', decimals: 6 },
    chain: { id: 'ethereum', name: 'Ethereum' },
    amount: '1000.5',
    timestamp: '1700000000',
    blockNumber: '200',
    transactionHash: '0xabc',
    ...overrides,
  };
}

describe('transformFlows', () => {
  it('maps a pool event to wallet→pool flow with unique nodes', () => {
    const batch = transformFlows([flow()]);

    expect(batch.flows).toHaveLength(1);
    const [f] = batch.flows;
    expect(f).toMatchObject({
      fromNodeId: '0x1111',
      fromNodeType: 'wallet',
      toNodeId: '0xpool',
      toNodeType: 'pool',
      type: 'Deposit',
      amount: '1000.5',
      assetId: '0xtoken',
      chainId: 'ethereum',
    });
    expect(f.timestamp).toEqual(new Date(1_700_000_000_000));
    expect(f.metadata).toEqual({ txHash: '0xabc', blockNumber: 200 });

    expect(batch.nodes.chains).toEqual([{ id: 'ethereum', name: 'Ethereum' }]);
    expect(batch.nodes.wallets).toEqual([
      { id: '0x1111', address: '0x1111' },
      { id: '0x2222', address: '0x2222' },
    ]);
    expect(batch.nodes.pools).toEqual([
      { id: '0xpool', address: '0xpool', protocolId: 'aave', assetId: '0xtoken' },
    ]);
    expect(batch.nodes.protocols).toEqual([
      { id: 'aave', name: 'Aave V3', chainId: 'ethereum' },
    ]);
  });

  it('maps a transfer to a wallet→wallet flow without pool', () => {
    const batch = transformFlows([
      flow({
        type: 'TRANSFER',
        pool: null,
        fromWallet: { id: '0xaaa', address: '0xaaa' },
        toWallet: { id: '0xbbb', address: '0xbbb' },
      }),
    ]);

    expect(batch.flows[0]).toMatchObject({
      fromNodeId: '0xaaa',
      toNodeId: '0xbbb',
      toNodeType: 'wallet',
      type: 'Transfer',
    });
    expect(batch.nodes.pools).toHaveLength(0);
  });

  it('maps every flow type', () => {
    const types: SubgraphCapitalFlow['type'][] = [
      'DEPOSIT',
      'BORROW',
      'REPAY',
      'WITHDRAW',
      'SWAP',
      'TRANSFER',
    ];
    const batch = transformFlows(types.map((type) => flow({ type })));
    expect(batch.flows.map((f) => f.type)).toEqual([
      'Deposit',
      'Borrow',
      'Repay',
      'Withdraw',
      'Swap',
      'Transfer',
    ]);
  });

  it('deduplicates shared nodes across flows', () => {
    const batch = transformFlows([
      flow({ id: 'f1', fromWallet: { id: '0x1111', address: '0x1111' } }),
      flow({ id: 'f2', fromWallet: { id: '0x1111', address: '0x1111' }, blockNumber: '201' }),
    ]);

    expect(batch.nodes.wallets).toHaveLength(2); // 0x1111 + pool counterpart + ... deduped
    expect(batch.flows).toHaveLength(2);
    // chain + asset + protocol + pool each appear once.
    expect(batch.nodes.chains).toHaveLength(1);
    expect(batch.nodes.assets).toHaveLength(1);
    expect(batch.nodes.protocols).toHaveLength(1);
    expect(batch.nodes.pools).toHaveLength(1);
  });
});
