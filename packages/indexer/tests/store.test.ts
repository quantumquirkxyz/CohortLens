import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createDbSyncStore } from '../src/store';
import type { SyncBatch } from '../src/transform';

const db = {} as never;

const mocks = vi.hoisted(() => ({
  ensureChain: vi.fn(),
  ensureProtocol: vi.fn(),
  ensureWallet: vi.fn(),
  ensurePool: vi.fn(),
  findWalletId: vi.fn(),
  findAssetId: vi.fn(),
  ensureAsset: vi.fn(),
  createFlow: vi.fn(),
  getSyncCursor: vi.fn(),
  setSyncCursor: vi.fn(),
}));

vi.mock('@cohortlens/database', () => mocks);

function makeBatch(): SyncBatch {
  return {
    nodes: {
      chains: [{ id: 'ethereum', name: 'Ethereum' }],
      wallets: [
        { id: '0x1111', address: '0x1111' },
        { id: '0x2222', address: '0x2222' },
      ],
      assets: [
        { id: '0xtoken', symbol: 'USDC', name: 'USD Coin', chainId: 'ethereum', decimals: 6 },
      ],
      protocols: [{ id: 'aave', name: 'Aave V3', chainId: 'ethereum' }],
      pools: [{ id: '0xpool', address: '0xpool', protocolId: 'aave', assetId: '0xtoken' }],
    },
    flows: [
      {
        fromNodeId: '0x1111',
        fromNodeType: 'wallet',
        toNodeId: '0xpool',
        toNodeType: 'pool',
        type: 'Deposit',
        amount: '100',
        assetId: '0xtoken',
        chainId: 'ethereum',
        timestamp: new Date(0),
      },
    ],
  };
}

describe('db sync store', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.findWalletId.mockResolvedValue(null);
    mocks.findAssetId.mockResolvedValue(null);
    mocks.createFlow.mockResolvedValue({ id: 'flow-1' });
  });

  it('upserts nodes in FK order and inserts flows', async () => {
    const store = createDbSyncStore(db);
    const n = await store.ingest(makeBatch());

    expect(n).toBe(1);
    expect(mocks.ensureChain).toHaveBeenCalledTimes(1);
    // wallets/assets resolved to their own ids when nothing exists yet
    expect(mocks.ensureWallet).toHaveBeenCalledTimes(2);
    expect(mocks.ensureAsset).toHaveBeenCalledTimes(1);
    expect(mocks.ensurePool).toHaveBeenCalledWith(expect.anything(), {
      id: '0xpool',
      address: '0xpool',
      protocolId: 'aave',
      assetId: '0xtoken',
    });
    expect(mocks.createFlow).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        fromNodeId: '0x1111',
        toNodeId: '0xpool',
        assetId: '0xtoken',
      }),
    );
  });

  it('remaps wallets to the existing row by address (seed slugs)', async () => {
    // Seed already has wallet-1 under address 0x1111 — the sync must reuse it.
    mocks.findWalletId.mockImplementation(async (_db: unknown, address: string) =>
      address === '0x1111' ? 'wallet-1' : null,
    );

    const store = createDbSyncStore(db);
    await store.ingest(makeBatch());

    // Only the unknown wallet gets inserted; the known one is resolved.
    expect(mocks.ensureWallet).toHaveBeenCalledTimes(1);
    expect(mocks.ensureWallet).toHaveBeenCalledWith(expect.anything(), {
      id: '0x2222',
      address: '0x2222',
    });
    expect(mocks.createFlow).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ fromNodeId: 'wallet-1' }),
    );
  });

  it('remaps assets to the existing row by (symbol, chain)', async () => {
    mocks.findAssetId.mockResolvedValue('usdc');

    const store = createDbSyncStore(db);
    await store.ingest(makeBatch());

    expect(mocks.ensureAsset).not.toHaveBeenCalled();
    expect(mocks.ensurePool).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ assetId: 'usdc' }),
    );
    expect(mocks.createFlow).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ assetId: 'usdc' }),
    );
  });

  it('reads and writes the sync cursor', async () => {
    const store = createDbSyncStore(db);
    mocks.getSyncCursor.mockResolvedValue(77);

    await expect(store.getCursor('ethereum')).resolves.toBe(77);
    await store.setCursor('ethereum', 1002);
    expect(mocks.setSyncCursor).toHaveBeenCalledWith(expect.anything(), 'ethereum', 1002);
  });
});
