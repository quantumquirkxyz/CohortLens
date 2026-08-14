import type { CreateCapitalFlowInput } from '@cohortlens/database';
import type { FlowType } from '@cohortlens/shared';
import type {
  EnsureAssetInput,
  EnsureChainInput,
  EnsurePoolInput,
  EnsureProtocolInput,
  EnsureWalletInput,
} from '@cohortlens/database';
import type { SubgraphCapitalFlow } from './types';

const FLOW_TYPE_MAP: Record<SubgraphCapitalFlow['type'], FlowType> = {
  DEPOSIT: 'Deposit',
  BORROW: 'Borrow',
  REPAY: 'Repay',
  WITHDRAW: 'Withdraw',
  SWAP: 'Swap',
  TRANSFER: 'Transfer',
};

export interface SyncNodes {
  chains: EnsureChainInput[];
  wallets: EnsureWalletInput[];
  assets: EnsureAssetInput[];
  protocols: EnsureProtocolInput[];
  pools: EnsurePoolInput[];
}

export interface SyncBatch {
  nodes: SyncNodes;
  flows: CreateCapitalFlowInput[];
}

function pushUnique<T extends { id: string }>(list: T[], item: T): void {
  if (!list.some((existing) => existing.id === item.id)) list.push(item);
}

/**
 * Map a batch of subgraph CapitalFlow entities onto CFG node upserts and
 * capital flow inserts. Pool events (Deposit/Borrow/Repay/Withdraw/Swap)
 * target the pool node; plain Transfers connect two wallet nodes.
 */
export function transformFlows(flows: SubgraphCapitalFlow[]): SyncBatch {
  const nodes: SyncNodes = { chains: [], wallets: [], assets: [], protocols: [], pools: [] };
  const flowInputs: CreateCapitalFlowInput[] = [];

  for (const flow of flows) {
    pushUnique(nodes.chains, { id: flow.chain.id, name: flow.chain.name });
    pushUnique(nodes.wallets, { id: flow.fromWallet.id, address: flow.fromWallet.address });
    pushUnique(nodes.wallets, { id: flow.toWallet.id, address: flow.toWallet.address });
    pushUnique(nodes.assets, {
      id: flow.asset.id,
      symbol: flow.asset.symbol,
      name: flow.asset.name,
      chainId: flow.chain.id,
      decimals: flow.asset.decimals,
    });

    let toNodeId = flow.toWallet.id;
    if (flow.pool) {
      pushUnique(nodes.protocols, {
        id: flow.pool.protocol.id,
        name: flow.pool.protocol.name,
        chainId: flow.pool.protocol.chain.id,
      });
      pushUnique(nodes.pools, {
        id: flow.pool.id,
        address: flow.pool.address ?? null,
        protocolId: flow.pool.protocol.id,
        assetId: flow.asset.id,
      });
      toNodeId = flow.pool.id;
    }

    flowInputs.push({
      fromNodeId: flow.fromWallet.id,
      fromNodeType: 'wallet',
      toNodeId,
      toNodeType: flow.pool ? 'pool' : 'wallet',
      type: FLOW_TYPE_MAP[flow.type],
      amount: flow.amount,
      assetId: flow.asset.id,
      chainId: flow.chain.id,
      timestamp: new Date(Number(flow.timestamp) * 1000),
      metadata: {
        txHash: flow.transactionHash,
        blockNumber: Number(flow.blockNumber),
      },
      // Subgraph entity id (txHash-logIndex): the unique business key that
      // makes a re-sync idempotent (createFlow dedupes on it).
      subgraphId: flow.id,
    });
  }

  return { nodes, flows: flowInputs };
}
