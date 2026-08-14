/** A CapitalFlow entity as returned by the subgraph GraphQL API (ADR 006). */
export interface SubgraphCapitalFlow {
  id: string;
  type: 'DEPOSIT' | 'BORROW' | 'REPAY' | 'WITHDRAW' | 'SWAP' | 'TRANSFER';
  fromWallet: { id: string; address: string };
  toWallet: { id: string; address: string };
  pool: {
    id: string;
    address: string | null;
    protocol: { id: string; name: string; chain: { id: string; name: string } };
  } | null;
  asset: { id: string; symbol: string; name: string; decimals: number };
  chain: { id: string; name: string };
  /** BigDecimal as string. */
  amount: string;
  /** Block timestamp in seconds (BigInt as string). */
  timestamp: string;
  blockNumber: string;
  transactionHash: string;
}

export interface SubgraphClient {
  /** Fetch capital flows with blockNumber > lastBlock, ascending, capped. */
  queryCapitalFlows(chain: string, lastBlock: number): Promise<SubgraphCapitalFlow[]>;
}
