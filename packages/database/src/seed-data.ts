import type { FlowType, NodeType } from '@cohortlens/shared';
import { FLOW_TYPES } from '@cohortlens/shared';

export interface SeedCapitalFlow {
  id: string;
  fromNodeId: string;
  fromNodeType: NodeType;
  toNodeId: string;
  toNodeType: NodeType;
  type: FlowType;
  amount: string;
  assetId: string;
  chainId: string;
  timestamp: Date;
  metadata: Record<string, unknown> | null;
}

export const seedChains = [
  { id: 'ethereum', name: 'Ethereum', rpcUrl: 'https://eth.llamarpc.com' },
  { id: 'polygon', name: 'Polygon', rpcUrl: 'https://polygon-rpc.com' },
  { id: 'arbitrum', name: 'Arbitrum', rpcUrl: 'https://arb1.arbitrum.io/rpc' },
];

export const seedProtocols = [
  { id: 'aave-v3', name: 'Aave V3', chainId: 'ethereum' },
  { id: 'uniswap-v3', name: 'Uniswap V3', chainId: 'ethereum' },
  { id: 'compound-v3', name: 'Compound V3', chainId: 'ethereum' },
  { id: 'curve', name: 'Curve', chainId: 'ethereum' },
  { id: 'balancer', name: 'Balancer', chainId: 'ethereum' },
];

export const seedWallets = [
  { id: 'wallet-1', address: '0x1111111111111111111111111111111111111111', label: 'Algo Fund' },
  { id: 'wallet-2', address: '0x2222222222222222222222222222222222222222', label: 'Stable Whale' },
  { id: 'wallet-3', address: '0x3333333333333333333333333333333333333333', label: 'Yield Farmer' },
  { id: 'wallet-4', address: '0x4444444444444444444444444444444444444444', label: null },
  { id: 'wallet-5', address: '0x5555555555555555555555555555555555555555', label: 'Arb Bot' },
  { id: 'wallet-6', address: '0x6666666666666666666666666666666666666666', label: null },
  { id: 'wallet-7', address: '0x7777777777777777777777777777777777777777', label: 'Liquidity Provider' },
  { id: 'wallet-8', address: '0x8888888888888888888888888888888888888888', label: null },
];

export const seedAssets = [
  { id: 'usdc', symbol: 'USDC', name: 'USD Coin', chainId: 'ethereum', decimals: 6 },
  { id: 'usdt', symbol: 'USDT', name: 'Tether USD', chainId: 'ethereum', decimals: 6 },
  { id: 'dai', symbol: 'DAI', name: 'Dai Stablecoin', chainId: 'ethereum', decimals: 18 },
  { id: 'weth', symbol: 'WETH', name: 'Wrapped Ether', chainId: 'ethereum', decimals: 18 },
  { id: 'wbtc', symbol: 'WBTC', name: 'Wrapped Bitcoin', chainId: 'ethereum', decimals: 8 },
  { id: 'aave', symbol: 'AAVE', name: 'Aave', chainId: 'ethereum', decimals: 18 },
  { id: 'uni', symbol: 'UNI', name: 'Uniswap', chainId: 'ethereum', decimals: 18 },
  { id: 'crv', symbol: 'CRV', name: 'Curve DAO', chainId: 'ethereum', decimals: 18 },
  { id: 'matic', symbol: 'MATIC', name: 'Polygon', chainId: 'polygon', decimals: 18 },
  { id: 'arb', symbol: 'ARB', name: 'Arbitrum', chainId: 'arbitrum', decimals: 18 },
];

export const seedPools = [
  { id: 'aave-v3-usdc-ethereum', protocolId: 'aave-v3', assetId: 'usdc', chainId: 'ethereum' },
  { id: 'aave-v3-weth-ethereum', protocolId: 'aave-v3', assetId: 'weth', chainId: 'ethereum' },
  { id: 'aave-v3-dai-polygon', protocolId: 'aave-v3', assetId: 'dai', chainId: 'polygon' },
  { id: 'aave-v3-matic-polygon', protocolId: 'aave-v3', assetId: 'matic', chainId: 'polygon' },
  { id: 'aave-v3-wbtc-arbitrum', protocolId: 'aave-v3', assetId: 'wbtc', chainId: 'arbitrum' },
  { id: 'uniswap-v3-usdc-ethereum', protocolId: 'uniswap-v3', assetId: 'usdc', chainId: 'ethereum' },
  { id: 'uniswap-v3-weth-ethereum', protocolId: 'uniswap-v3', assetId: 'weth', chainId: 'ethereum' },
  { id: 'compound-v3-usdc-ethereum', protocolId: 'compound-v3', assetId: 'usdc', chainId: 'ethereum' },
  { id: 'curve-usdc-ethereum', protocolId: 'curve', assetId: 'usdc', chainId: 'ethereum' },
  { id: 'balancer-weth-ethereum', protocolId: 'balancer', assetId: 'weth', chainId: 'ethereum' },
];

export const seedPositions: Array<{
  id: string;
  walletId: string;
  poolId: string;
  amount: string;
  type: 'deposit' | 'borrow';
}> = [
  { id: 'pos-1', walletId: 'wallet-1', poolId: 'aave-v3-usdc-ethereum', amount: '250000', type: 'deposit' },
  { id: 'pos-2', walletId: 'wallet-2', poolId: 'aave-v3-usdc-ethereum', amount: '1000000', type: 'deposit' },
  { id: 'pos-3', walletId: 'wallet-3', poolId: 'aave-v3-weth-ethereum', amount: '80', type: 'deposit' },
  { id: 'pos-4', walletId: 'wallet-4', poolId: 'compound-v3-usdc-ethereum', amount: '50000', type: 'deposit' },
  { id: 'pos-5', walletId: 'wallet-5', poolId: 'curve-usdc-ethereum', amount: '120000', type: 'deposit' },
  { id: 'pos-6', walletId: 'wallet-6', poolId: 'aave-v3-dai-polygon', amount: '30000', type: 'borrow' },
  { id: 'pos-7', walletId: 'wallet-7', poolId: 'uniswap-v3-usdc-ethereum', amount: '75000', type: 'deposit' },
  { id: 'pos-8', walletId: 'wallet-8', poolId: 'aave-v3-wbtc-arbitrum', amount: '2.5', type: 'deposit' },
];

function fakeTxHash(i: number): string {
  return `0x${(i * 7919).toString(16).padStart(64, '0')}`;
}

/** 50 deterministic sample capital flows spread over the last ~25 days. */
export const seedFlows: SeedCapitalFlow[] = Array.from({ length: 50 }, (_, i) => {
  const type = FLOW_TYPES[i % FLOW_TYPES.length];
  const wallet = seedWallets[i % seedWallets.length];
  const pool = seedPools[i % seedPools.length];
  const nextWallet = seedWallets[(i + 1) % seedWallets.length];

  let fromNodeId: string;
  let fromNodeType: NodeType;
  let toNodeId: string;
  let toNodeType: NodeType;

  if (type === 'Transfer') {
    // wallet → wallet transfer
    fromNodeId = wallet.id;
    fromNodeType = 'wallet';
    toNodeId = nextWallet.id;
    toNodeType = 'wallet';
  } else if (type === 'Deposit' || type === 'Borrow') {
    // wallet → pool
    fromNodeId = wallet.id;
    fromNodeType = 'wallet';
    toNodeId = pool.id;
    toNodeType = 'pool';
  } else {
    // Repay / Withdraw / Swap: pool → wallet
    fromNodeId = pool.id;
    fromNodeType = 'pool';
    toNodeId = wallet.id;
    toNodeType = 'wallet';
  }

  return {
    id: `flow-${i + 1}`,
    fromNodeId,
    fromNodeType,
    toNodeId,
    toNodeType,
    type,
    amount: (50 + i * 13.37).toFixed(4),
    assetId: pool.assetId,
    chainId: pool.chainId,
    timestamp: new Date(Date.now() - i * 12 * 36e5),
    metadata: { txHash: fakeTxHash(i + 1) },
  };
});
