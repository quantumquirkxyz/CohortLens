import type { SubgraphCapitalFlow, SubgraphClient } from './types';

const CAPITAL_FLOWS_QUERY = `
  query CapitalFlows($lastBlock: BigInt!) {
    capitalFlows(
      where: { blockNumber_gt: $lastBlock }
      orderBy: blockNumber
      orderDirection: asc
      first: 1000
    ) {
      id
      type
      fromWallet { id address }
      toWallet { id address }
      pool { id address protocol { id name chain { id name } } }
      asset { id symbol name decimals }
      chain { id name }
      amount
      timestamp
      blockNumber
      transactionHash
    }
  }
`;

interface GraphQlResponse {
  data?: { capitalFlows?: SubgraphCapitalFlow[] };
  errors?: Array<{ message?: string }>;
}

/** Build a subgraph client over per-chain GraphQL endpoints (env-driven). */
export function createGraphqlSubgraphClient(
  endpoints: Record<string, string>,
  fetchImpl: typeof fetch = fetch,
): SubgraphClient {
  return {
    async queryCapitalFlows(chain, lastBlock) {
      const url = endpoints[chain];
      if (!url) {
        throw new Error(`no subgraph endpoint configured for chain: ${chain}`);
      }

      const res = await fetchImpl(url, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          query: CAPITAL_FLOWS_QUERY,
          variables: { lastBlock: String(lastBlock) },
        }),
      });

      const json = (await res.json().catch(() => ({}))) as GraphQlResponse;
      if (!res.ok || json.errors?.length) {
        const message = json.errors?.[0]?.message ?? `subgraph request failed (${res.status})`;
        throw new Error(message);
      }
      return json.data?.capitalFlows ?? [];
    },
  };
}
