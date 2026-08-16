---
name: frontend-development
description: Build or fix React frontend features in CohortLens. Use when the user wants to add a page, component, dashboard widget, or UI behaviour in apps/web; touches React Query hooks, zustand stores, routing, or Tailwind styling.
version: 1
capabilities:
  - react-ui-development
  - frontend-testing
inputs:
  - feature or bug request scoped to apps/web
outputs:
  - working UI change with tests
dependencies:
  - implement
  - tdd
  - codebase-design
sideEffects:
  - modifies apps/web source
  - adds or updates vitest tests
stopCondition: The UI change is implemented, typed, styled, and covered by a passing test at the seam the change warrants.
risk: low
---

CohortLens frontend lives in `apps/web`. It is a React 19 SPA built with Vite 8, Tailwind CSS 4, TanStack Query for server state, zustand for client state, and react-router-dom v7 for routing. The API client (`src/lib/api.ts`) is the only thing that talks to the backend. This skill builds features inside that shape — it does not redesign it.

## The shape of apps/web

Every feature sits in one of four layers. Know which layer the work belongs to before writing code:

1. **`src/lib/`** — pure client logic: `api.ts` (the typed API client), `graph.ts` (node colors, graph helpers), `wagmi.ts`. No React.
2. **`src/hooks/`** — TanStack Query hooks wrapping `api` (e.g. `useGraphData.ts`). Data access for pages/components.
3. **`src/stores/`** — zustand client state (e.g. `graphStore.ts`) for UI-only state that should not hit the API.
4. **`src/components/` + `src/pages/`** — UI. Reusable pieces in `components/ui/` (see `Card.tsx`), feature pieces in `components/dashboard/`, `components/graph/`, pages in `pages/`. Routing is declared once in `pages/Routes.tsx` and mounted by `App.tsx`.

Data flows **one way**: page/component → hook → `api.ts`. Never call `fetch` directly outside `api.ts`, and never read server state from a zustand store.

## Build steps

Work top-down through the layers — client type, hook, UI — then test. Each step ends when its criterion is met; do not start the next layer until the current one is done.

1. **Locate the seam.** Decide which layer owns the change: a new API-backed panel is a hook + component; a pure UI tweak touches only the component; a reusable piece belongs in `components/ui/`. If the work needs data the API does not expose, stop and check `apps/api/src` and `packages/shared` for the type — the API client is typed from `@cohortlens/shared`. *Done when: the layer, the shared types involved, and the API endpoint (if any) are named.*
2. **Write the hook or store first.** Add a TanStack Query hook in `src/hooks/` mirroring `useGraphData.ts` (queryKey + queryFn from `api`), or a zustand slice in `src/stores/` for client state. Use `@cohortlens/shared` types; never `any`. *Done when: the hook returns typed data and, if server-backed, is covered by a test that mocks `../lib/api`.*
3. **Build the component.** Write the React component following the repo's patterns: functional components, typed props, Tailwind utility classes in the slate/sky palette seen across the app, `Card` from `components/ui/Card` for panels. Keep styling inline with Tailwind classes — no new CSS files for one-off styling. *Done when: the component renders with the repo's data flow and matches the visual language of neighbouring components.*
4. **Wire routing.** Add the route in `pages/Routes.tsx` (and the nav entry in `components/layout/AppLayout.tsx`) only if the work is a new page. *Done when: the page is reachable at its path.*
5. **Test at the seam.** Add a vitest + Testing Library test in the same directory as the code (repo convention: `Overview.test.tsx` sits next to `Overview.tsx`). Mock `../lib/api` with `vi.mock`, wrap in `QueryClientProvider` with `retry: false` (see `Overview.test.tsx`). *Done when: the test asserts the behaviour through the rendered output, not implementation details.*
6. **Verify the loop.** Run `pnpm --filter @cohortlens/web test` for the touched files, then `pnpm --filter @cohortlens/web type-check` and `pnpm lint`. Fix anything red before finishing. *Done when: touched tests pass, type-check is clean, and lint is clean.*

## Completeness criteria

- The change follows the four-layer shape: no `fetch` outside `api.ts`, no server state in zustand.
- Types come from `@cohortlens/shared` — no `any`, no duplicated inline types.
- Styling matches the repo's Tailwind slate/sky visual language.
- A test covers the seam the change warrants (hook or component), mocking `api` like the existing tests.
- `test`, `type-check`, and `lint` pass for `apps/web`.

## Domain vocabulary

Keep UI labels in the repo's domain language (see `CONTEXT.md`): a **Lens** is a priced capability that answers a question about the Capital Flow Graph; a **Route** is a proposed sequence of capital-flow edges (recommended, never executed); a **Cohort** is a set of Wallets sharing behavioural patterns; a **Signal** is a typed computed observation. Use these terms in the UI rather than generic substitutes — "route optimizer", not "path finder"; "Lens", not "model".