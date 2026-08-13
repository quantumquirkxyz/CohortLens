# Capital automation is intelligence-first

"Automatizar flujos de capital" is scoped as decision intelligence, not execution: CohortLens maps, predicts, and recommends — routes, opportunities, and risks — while the decision to move capital stays with an operator or human. On-chain execution (arbitrage bots, vaults, strategy automation) is out of the initial scope.

## Status

accepted

## Considered options

- **Intelligence-first (chosen)**: no execution engine in the initial model; the substrate (indexers, ML, risk) supports analysis, not capital movement. Lower compliance and engineering surface; consistent with a platform whose output is "rendimiento superior y gestión predictiva de riesgos".
- **Including an execution layer**: vaults/strategies/arbitrage as a roadmap phase after intelligence. Rejected for now — see the ADR body; the vision's "automatizar" currently means automating the *analysis* pipeline, not moving funds.
- **Execution now**: rejected — the substrate has no execution engine and the risk surface (custody, slashing, MEV) is not what the initial platform is.
