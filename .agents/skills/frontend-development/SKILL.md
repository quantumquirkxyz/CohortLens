---
name: frontend-development
description: Build or fix React frontend features in CohortLens. Use when the user wants a page, dashboard widget, component, visualisation, form, interaction, or UI behaviour in apps/web; touches React Query hooks, zustand stores, routing, Tailwind styling, or frontend tests.
version: 2
capabilities:
  - react-ui-development
  - frontend-design
  - frontend-testing
  - accessibility-review
inputs:
  - feature or bug request scoped to apps/web
outputs:
  - working, responsive UI change with behaviour tests
dependencies:
  - implement
  - tdd
  - codebase-design
sideEffects:
  - modifies apps/web source
  - adds or updates vitest tests
stopCondition: The UI is correct at the data seam, useful in loading/error/empty states, usable by keyboard on a narrow viewport, and verified by passing tests, type-check, lint, and a visual run when practical.
risk: low
---

CohortLens frontend lives in `apps/web`: React 19, Vite 8, Tailwind CSS 4, TanStack Query, zustand, react-router-dom v7, Recharts, and `@xyflow/react`. It is a dark data dashboard for the Capital Flow Graph. Build inside the existing product language; do not treat every request as permission to redesign the application.

The governing rule is **a page earns attention by making a capital-flow decision easier**. A component that only decorates data, repeats it, or hides its next useful action does not belong.

## Product and visual direction

Before writing JSX, name three things privately: the operator using the surface, the single question they need answered, and the next action or conclusion the surface enables. Ground labels in `CONTEXT.md`; a Lens, Route, Cohort, and Signal have precise meanings and must not be renamed generically.

The established visual system is intentionally restrained:

- dark slate surfaces (`bg-slate-950`, `bg-slate-900/60`), slate borders, sky-blue selection and primary actions;
- dense but readable analytical information, with `font-mono` for identifiers, amounts, and graph values;
- `Card` from `src/components/ui/Card.tsx` for bounded dashboard panels;
- `rounded-md` / `rounded-lg`, small labels, and clear hierarchy rather than decorative gradients, unrelated palettes, or excessive badges.

For a new page or a substantial visual surface, pick **one signature** that communicates the question: a graph neighbourhood, a comparative chart, an unusually useful summary, or a clearly structured data table. Keep the rest quiet. Do not add ornamental animation, a new font, a new colour system, or a new UI library unless the request explicitly changes the product design.

## The web shape

Every change belongs to one or more of these layers. Locate its seam before changing code.

1. **`src/lib/`** holds pure client logic. `api.ts` is the only HTTP boundary; `graph.ts` holds graph presentation helpers. No React and no duplicated wire types.
2. **`src/hooks/`** holds TanStack Query hooks. They wrap `api.ts`, define stable query keys, and expose server state to UI.
3. **`src/stores/`** holds zustand state that is local to the interface, such as graph selection or panel visibility. It is not a cache for API responses.
4. **`src/components/` and `src/pages/`** hold presentation. Put a reusable primitive in `components/ui`, a feature component near its feature (`dashboard`, `graph`, `wallet`), and a routed view in `pages`.
5. **`src/App.tsx`** is the single route map. **`components/layout/AppLayout.tsx`** owns global navigation and the shell.

Data flows one way: **component/page -> hook -> `api.ts`**. Never call `fetch` outside `api.ts`; never put server data in zustand; never duplicate `@cohortlens/shared` types locally. If the backend does not expose the data a UI needs, inspect `packages/shared` and `apps/api/src` first, then make the API change through the backend workflow rather than inventing frontend-only data.

## Build workflow

Work through each gate in order. Do not skip from an idea straight to styling.

### 1. Frame the slice

Read the nearest page, sibling components, its hook, and the relevant shared type. State the user question, the owning layer, the API endpoint or local state involved, and the smallest visible slice that proves the feature.

For a new route, name the path, page, navigation label, empty state, and first useful action. For a change to a graph or chart, name the selection model, data cardinality, and what a click or keyboard action does.

**Done when:** the data source, component boundary, and observable result are concrete. If any is unknown, investigate before coding.

### 2. Establish the data seam

Add or extend the typed method in `src/lib/api.ts`, normalising wire values there when necessary (for example, ISO timestamps become `Date`). Use a shared domain type whenever it exists.

For server state, add a focused TanStack Query hook following `useGraphData.ts`:

- query keys include every request input and are stable;
- conditional requests use `enabled`, not a cast that calls an endpoint with missing input;
- mutations invalidate or update the exact affected query keys;
- components receive loading, error, and data state from the hook rather than reimplementing requests.

Use zustand only for interface state that remains meaningful without a request. Keep selectors narrow so a graph interaction does not rerender unrelated dashboard panels.

**Done when:** the UI can get fully typed data through one hook or one local store seam, with no direct HTTP or `any` in the presentation layer.

### 3. Design information before decoration

Decide the hierarchy in this order: decision or headline, current status, primary evidence, controls, supporting detail. A dashboard should lead with the conclusion, not a wall of equal cards.

- Use a table for many comparable, scan-oriented rows; put semantic columns first and use `font-mono` only for identifiers/numbers.
- Use a chart or graph only when position, distribution, trend, or topology reveals something a table cannot. Give it a text summary or legend so its conclusion is not colour-only.
- Show a concrete empty state with the next action; show errors as what failed and what can be retried or changed. Do not render a blank Card.
- Give loading a stable footprint that resembles its eventual content; avoid layout jumps and indefinite spinners for every small request.
- Make destructive or expensive actions explicit. An action button says the outcome: `Publish Lens`, `Optimize route`, `Retry graph data`, never `Submit`.

**Done when:** the page answers its named question in the first scan, including with no data or a failed request.

### 4. Implement the UI in the existing system

Use functional components with explicit, small prop types. Prefer composition over boolean-prop matrices and keep page orchestration in the page rather than turning generic UI primitives into feature-aware components.

Use Tailwind classes next to the markup. Do not create one-off CSS files. Preserve the slate/sky system; status colours carry meaning consistently (`sky` active/informational, `rose` failure/risk, `slate` secondary). New visual tokens require a deliberate product reason, not novelty.

Build mobile-first: start at one column, make overflow intentional, then add breakpoints where the information needs more room. Tables must remain usable on a narrow viewport (horizontal containment, purposeful summarisation, or an alternate row layout); never rely on accidental clipping. The current sidebar shell is desktop-first, so a change that adds navigation or dense UI must explicitly check narrow widths.

For interactions:

- use native `button`, `a`, `input`, `select`, `table`, and heading elements before ARIA roles;
- every form input has a visible label, an error associated with it, and a keyboard path through the form;
- use buttons for actions and links for navigation; disabled controls explain their prerequisite when that is not obvious;
- preserve visible keyboard focus with Tailwind `focus:` styles and do not encode a state with colour alone;
- respect `prefers-reduced-motion` whenever adding motion. Use `startTransition` or `useDeferredValue` only when a real expensive filter, graph redraw, or route-state update would otherwise block input.

**Done when:** the component fits its parent, works at narrow and desktop widths, and its semantics expose the same actions that sighted mouse users see.

### 5. Wire pages and navigation deliberately

For a routed feature, add the route in `src/App.tsx`, then add a navigation item to `NAV_ITEMS` in `AppLayout.tsx` only when operators should discover it globally. Keep route names short and domain-specific. Do not add a nav item for a detail drill-down that is reached from a parent surface.

**Done when:** a user can reach the surface by the intended route, return without losing their place unnecessarily, and navigation does not expose unfinished or duplicate destinations.

### 6. Prove behaviour at the public seam

Place `*.test.tsx` beside the page/component and test with Vitest + Testing Library. Follow `Overview.test.tsx`: mock `../lib/api`, provide a `QueryClientProvider` whose queries do not retry, and assert what the user can observe.

Cover the decision branch, not implementation trivia:

- successful data renders its meaningful conclusion or action;
- an error explains the failed resource or exposes retry behaviour;
- an empty collection exposes its next action when applicable;
- user interaction changes visible state or triggers the intended request;
- an added route or form is reachable and labelled correctly.

Prefer `getByRole`, `getByLabelText`, and visible text. Avoid snapshots for whole pages, tests that only assert class strings, and tests that mock the component under test. Add a hook test only when its query key, conditional execution, or transformation has non-trivial behaviour; otherwise test through the rendered page.

**Done when:** the test would fail if the user-visible behaviour regressed.

### 7. Run the quality loop

Run the narrowest relevant test while iterating, then finish with:

```bash
pnpm --filter @cohortlens/web test
pnpm --filter @cohortlens/web type-check
pnpm lint
```

When practical, run `pnpm --filter @cohortlens/web dev` and inspect the changed route at a desktop and narrow viewport. Check the loaded, loading, error, and empty states; keyboard-tab through new controls. Treat a visual check as evidence, not a replacement for tests.

**Done when:** every command passes and the visual review reveals no overflow, inaccessible control, unreadable contrast, or state gap.

## Completion checklist

- The feature answers one concrete Capital Flow Graph question and uses the vocabulary in `CONTEXT.md` precisely.
- HTTP is isolated in `api.ts`; server data flows through a typed Query hook; zustand contains only local UI state.
- The component has an intentional information hierarchy and handles loaded, loading, error, and empty states where the data can have them.
- The UI preserves the existing dark slate/sky language, is usable at narrow widths, and has native semantics, labels, visible focus, and non-colour status cues.
- A colocated test asserts the changed behaviour through the rendered UI.
- `pnpm --filter @cohortlens/web test`, `pnpm --filter @cohortlens/web type-check`, and `pnpm lint` pass.
