# Re-visioned as a Graph Engineering DeFi platform

CohortLens is re-visioned as a DeFi platform powered by **Graph Engineering**: it maps, predicts, and automates complex capital flows between multiple protocols and blockchains using knowledge graphs and topological network analysis, to optimize liquidity and mitigate risk in real time. The existing codebase (indexers, backend-ai, contracts, frontend, risk) is treated as the substrate — kept and reoriented toward this vision, not discarded.

## Status

accepted

## Considered options

- **Reframe (chosen)**: the existing infra already indexes on-chain interaction graphs (subgraphs) and scores risk; the vision is the coherent framing these were building toward. Cost: gaps remain (liquidity, routing, graph analytics) that the roadmap must build.
- **Greenfield pivot**: build a new product, reuse infra opportunistically. Rejected — throws away the repo's positioning and accumulated domain work.
- **Analytics-only layer**: restrict the vision to map/predict/recommend with no capital automation. Rejected at the framing level, but the *degree* of automation is decided separately (see ADR-0002).
