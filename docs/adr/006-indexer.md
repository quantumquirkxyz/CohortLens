# ADR 006: The Graph Indexer for Capital Flow Graph

## Status

Accepted

## Context

CohortLens needs to index on-chain DeFi events from multiple protocols and chains to populate the Capital Flow Graph in PostgreSQL.

**Event types**: Deposit, Borrow, Repay, Withdraw, Swap, Transfer
**Chains**: Polygon, Ethereum
**Protocols**: Aave v3, Compound v3, Uniswap v3, etc.

## Decision

Use **The Graph** with subgraphs for each chain, aggregating into PostgreSQL via a sync service.

### Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Ethereum      │     │    Polygon      │     │    Other Chains  │
│   Subgraph      │     │    Subgraph     │     │    Subgraph      │
└────────┬────────┘     └────────┬────────┘     └────────┬────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                                 ▼
                    ┌─────────────────────────┐
                    │   Sync Service (Hono)   │
                    │   - Polls subgraphs     │
                    │   - Transforms data     │
                    │   - Writes to PostgreSQL│
                    └─────────────────────────┘
                                 │
                                 ▼
                    ┌─────────────────────────┐
                    │   PostgreSQL            │
                    │   Capital Flow Graph    │
                    └─────────────────────────┘
```

### Subgraph Schema (schema.graphql)

```graphql
type Chain @entity {
  id: Bytes!
  name: String!
  protocols: [Protocol!]! @derivedFrom(field: "chain")
}

type Protocol @entity {
  id: Bytes!
  name: String!
  chain: Chain!
  pools: [Pool!]! @derivedFrom(field: "protocol")
}

type Pool @entity {
  id: Bytes!
  protocol: Protocol!
  asset: Asset!
  address: Bytes
  totalSupply: BigDecimal!
  totalBorrow: BigDecimal!
}

type Asset @entity {
  id: Bytes!
  symbol: String!
  name: String!
  chain: Chain!
  decimals: Int!
}

type Wallet @entity {
  id: Bytes!
  address: Bytes!
  positions: [Position!]! @derivedFrom(field: "wallet")
}

type Position @entity {
  id: Bytes!
  wallet: Wallet!
  pool: Pool!
  amount: BigDecimal!
  type: String!  # "deposit" | "borrow"
}

type CapitalFlow @entity {
  id: Bytes!
  type: FlowType!
  fromWallet: Wallet!
  toWallet: Wallet!
  pool: Pool
  amount: BigDecimal!
  weight: BigDecimal!
  timestamp: BigInt!
  blockNumber: BigInt!
  transactionHash: Bytes!
}

enum FlowType {
  DEPOSIT
  BORROW
  REPAY
  WITHDRAW
  SWAP
  TRANSFER
}
```

### Mapping Handlers (mapping.ts)

```typescript
import { BigInt, BigDecimal, Bytes } from "@graphprotocol/graph-ts";
import {
  CapitalFlow,
  Wallet,
  Pool,
  Asset,
  Position,
  Chain,
  Protocol
} from "../generated/schema";
import { FlowType } from "../generated/schema";

export function handleDeposit(event: DepositEvent): void {
  let fromWallet = getOrCreateWallet(event.params.from);
  let toWallet = getOrCreateWallet(event.params.to);
  let pool = Pool.load(event.params.pool.toHexString());

  let flow = new CapitalFlow(createFlowId(event));
  flow.type = FlowType.DEPOSIT;
  flow.fromWallet = fromWallet.id;
  flow.toWallet = toWallet.id;
  flow.pool = pool ? pool.id : null;
  flow.amount = event.params.amount.toBigDecimal();
  flow.weight = calculateWeight(event.params.amount);
  flow.timestamp = event.block.timestamp;
  flow.blockNumber = event.block.number;
  flow.transactionHash = event.transaction.hash;
  flow.save();
}

export function handleBorrow(event: BorrowEvent): void {
  // Similar to handleDeposit but with FlowType.BORROW
}

export function handleRepay(event: RepayEvent): void {
  // Similar to handleDeposit but with FlowType.REPAY
}

export function handleWithdraw(event: WithdrawEvent): void {
  // Similar to handleDeposit but with FlowType.WITHDRAW
}

export function handleSwap(event: SwapEvent): void {
  // Handle token swaps
}

export function handleTransfer(event: TransferEvent): void {
  // Handle ERC20 transfers
}

function getOrCreateWallet(address: Bytes): Wallet {
  let wallet = Wallet.load(address.toHexString());
  if (!wallet) {
    wallet = new Wallet(address.toHexString());
    wallet.address = address;
    wallet.save();
  }
  return wallet;
}

function createFlowId(event: ethereum.Event): string {
  return event.transaction.hash.toHexString() + "-" + event.logIndex.toString();
}

function calculateWeight(amount: BigDecimal): BigDecimal {
  // Simple weight calculation based on amount
  return amount.div(BigDecimal.fromString("1000000"));
}
```

### Sync Service (Hono)

```typescript
// packages/indexer/src/sync.ts
import { Hono } from "hono";
import { PrismaClient } from "@cohortlens/database";

const app = new Hono();
const prisma = new PrismaClient();

// GraphQL endpoint for each subgraph
const SUBGRAPHS = {
  ethereum: "https://api.thegraph.com/subgraphs/name/cohortlens/ethereum",
  polygon: "https://api.thegraph.com/subgraphs/name/cohortlens/polygon",
};

// Sync capital flows from subgraph to PostgreSQL
app.post("/sync", async (c) => {
  const { chain, lastBlock } = await c.req.json();

  const query = `
    {
      capitalFlows(
        where: { blockNumber_gt: ${lastBlock} }
        orderBy: blockNumber
        first: 1000
      ) {
        id
        type
        fromWallet { id address }
        toWallet { id address }
        pool { id }
        amount
        weight
        timestamp
        blockNumber
        transactionHash
      }
    }
  `;

  const response = await fetch(SUBGRAPHS[chain as keyof typeof SUBGRAPHS], {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query }),
  });

  const { data } = await response.json();
  const flows = data.capitalFlows;

  // Write to PostgreSQL
  for (const flow of flows) {
    await prisma.capitalFlow.upsert({
      where: { id: flow.id },
      create: {
        id: flow.id,
        type: flow.type,
        fromWallet: flow.fromWallet.address,
        toWallet: flow.toWallet.address,
        poolId: flow.pool?.id,
        amount: flow.amount,
        weight: parseFloat(flow.weight),
        timestamp: new Date(parseInt(flow.timestamp) * 1000),
      },
      update: {
        amount: flow.amount,
        weight: parseFloat(flow.weight),
      },
    });
  }

  return c.json({ synced: flows.length });
});

// Health check
app.get("/health", (c) => {
  return c.json({ status: "ok" });
});

export default app;
```

### Multi-Chain Deployment

```yaml
# deploy.sh
#!/bin/bash

# Deploy Ethereum subgraph
cd subgraphs/ethereum
graph codegen
graph deploy --node https://api.thegraph.com/deploy/ --ipfs https://api.thegraph.com/ipfs/ cohortlens/ethereum

# Deploy Polygon subgraph
cd ../polygon
graph codegen
graph deploy --node https://api.thegraph.com/deploy/ --ipfs https://api.thegraph.com/ipfs/ cohortlens/polygon
```

## Alternatives Considered

### Envio
- **Pros**: TypeScript-first, faster indexing
- **Cons**: Newer, less community support

### Golden
- **Pros**: SQL-like queries, fast
- **Cons**: Centralized, expensive

### Direct RPC Polling
- **Pros**: No external dependencies
- **Cons**: Slower, more infrastructure to manage

### The Graph (Chosen)
- **Pros**: Decentralized, battle-tested, free tier available
- **Cons**: Query limits, deployment complexity

## Consequences

### Positive
- Decentralized indexing
- Free tier for development
- Rich query capabilities
- Multi-chain support

### Negative
- Query rate limits
- Deployment complexity
- Need to manage subgraph versions

## References

- [The Graph docs](https://thegraph.com/docs/)
- [Subgraph Academy](https://thegraph.com/docs/developing/developer-degree/)
- [Aave v3 Subgraph](https://github.com/aave/protocol-v2-subgraph)
