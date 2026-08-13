# CohortLens

A DeFi platform powered by Graph Engineering: it maps, predicts, and recommends on complex capital flows between multiple protocols and blockchains, using graph theory and network analysis to optimize liquidity and mitigate risk. Capital automation is intelligence-first — the platform analyses and recommends; the decision to move capital stays with an operator.

## Core graph

**Capital Flow Graph**:
The central artifact: a directed, temporal, weighted property graph of value movement in DeFi. Nodes are typed participants; edges are typed capital-flow events carrying amount and timestamp.
_Avoid_: on-chain graph, transaction graph, interaction graph (when meaning this artifact)

**Knowledge Graph**:
Not a separate artifact — the semantic layer over the Capital Flow Graph: node/edge types, attributes, and derived labels (asset taxonomy, "stablecoin", risk attributes).
_Avoid_: ontology (when meaning the semantic layer)

**Topological analysis**:
The set of graph-theoretic algorithms run on the Capital Flow Graph — community detection, cheapest/shortest paths, centrality, co-movement — which yield cohorts, arbitrage routes, and risk correlations.
_Avoid_: network analysis (when meaning the algorithm set)

## Derived concepts

**Signal**:
A typed, computed observation about the Capital Flow Graph — a risk signal, a liquidity signal — produced by a Lens or by topological analysis.
_Avoid_: score (when meaning a Signal), indicator

**Prediction**:
The output of a Lens forecasting a future state of the Capital Flow Graph (a capital flow, a risk event, a liquidity condition).
_Avoid_: forecast (when meaning a Prediction output)

**Cohort**:
A set of Wallets that share behavioral patterns in the Capital Flow Graph, detected by topological analysis (community detection and/or feature clustering). A detection algorithm produces a Cohort; it is not what a Cohort is.
_Avoid_: cluster (when meaning the concept), user group

**Route**:
A proposed sequence of capital-flow edges connecting two nodes in the Capital Flow Graph, found by graph algorithms as the cheapest or lowest-cost path. Recommended, never executed by the platform. A Lens can produce a Route as its answer.
_Avoid_: path (generic), transaction sequence

**Arbitrage Route**:
A Route whose expected net value after fees and slippage is positive — a detected price discrepancy across pools or chains.
_Avoid_: arbitrage opportunity (when meaning the Route), opportunity

## Liquidity

**Liquidity**:
A property of a Pool, or of the aggregate across Pools: available depth, utilization, efficiency of capital. "Optimizing" liquidity means analyzing the Capital Flow Graph to detect where liquidity is scarce, fragmented, or inefficient and recommending rebalancing or relocation — a recommendation, not an execution. Liquidity crunches are one kind of Risk signal.
_Avoid_: depth (when meaning the whole property), rebalancing (when meaning the analysis)

## Risk

**Risk**:
An estimate of exposure to loss for a Wallet, Cohort, Position, Pool, or Protocol, derived from the Capital Flow Graph and its semantic attributes. Materialized as typed signals: systemic/correlation, credit, counterparty, protocol. AML screening is one counterparty risk signal, not the definition of Risk.
_Avoid_: risk score (when meaning the concept), AML (when meaning Risk)

## Intelligence products

**Lens**:
A registered, priced capability that answers a question about the Capital Flow Graph — an ML model, a graph query/analytics, or a risk signal. Published via the Registry, paid for in LENS per query through the Oracle. An ML model is one kind of Lens, not the definition.
_Avoid_: LENS (when meaning the ERC20 token), model (when meaning the product category)

## Nodes

**Wallet**:
A participant that holds assets and transacts across protocols and chains. The same actor across chains is one Wallet.
_Avoid_: user (as a node type), address (as a node type), account
_Open edge case_: resolving one Wallet across chains is unambiguous for a single EOA on multiple chains, but contested for wallets reached through bridge or proxy patterns — identity resolution is not yet pinned down.

**Protocol**:
A DeFi application deployed on one or more chains that offers pools for capital.
_Avoid_: dApp, platform (when meaning Protocol)

**Chain**:
A settlement network (e.g. Polygon, Ethereum) on which protocols and assets live.

**Asset**:
A token or tokenized position tradable across protocols and chains.
_Avoid_: token (when meaning the node), reserve (when meaning the node)

**Pool**:
An isolated liquidity venue inside a Protocol — e.g. the Aave v3 reserve for USDC on Polygon. The unit the analysis "transcends" by looking across pools.
_Avoid_: reserve (when meaning Pool), isolated pool

**Position**:
A Wallet's exposure on a Pool (a deposit or a borrow). The atomic unit where risk lives.
_Avoid_: vault (when meaning Position), loan

## Edges

**Capital flow**:
An edge in the Capital Flow Graph: value moving between nodes. Canonical types: `Deposit`, `Borrow`, `Repay`, `Withdraw`, `Swap`, `Transfer`.
_Avoid_: transaction (when meaning the flow edge)
