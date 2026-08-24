# CohortLens

## Agent skills

Use the shared skills bundle, but keep routing anchored to CohortLens' DeFi graph intelligence domain.

### Issue tracker

Issues, PRDs, and triage notes for CohortLens live as GitHub issues. Use the `gh` CLI for tracker operations. See `docs/agents/issue-tracker.md`.

### Triage labels

Use the repo's GitHub labels as-is: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: root `CONTEXT.md` is the source of truth for domain vocabulary, with ADRs under `docs/adr/`. See `docs/agents/domain.md`.

### Routing

- Bugs, data issues, or regressions in graph pipelines, recommendations, or risk outputs -> `diagnosing-bugs`.
- Test-first changes to lenses, graph analysis, or platform behavior -> `tdd`.
- New graph, routing, or risk feature after discussion -> `to-spec`, then `implement`.
- Multi-session planning for graph analytics or protocol coverage -> `wayfinder`.
- Graph architecture, module boundaries, or interfaces -> `codebase-design`.
- Domain language, invariants, and ADRs for Capital Flow Graph terms -> `domain-modeling`.
- Research into DeFi protocol behavior or market structure -> `research`.
- Review requests -> `code-review` or `review-pr`.
- Dirty PR review that should be driven to clean -> `review-fix-loop`.
- Review-fixed PR that should be merged, closed, and synced with tracker metadata -> `ship-review-fix-loop`.
