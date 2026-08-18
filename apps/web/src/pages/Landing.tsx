import { useState } from 'react';
import { Link } from 'react-router-dom';
import { LandingGraph } from '../components/landing/LandingGraph';

const NAV_LINKS = [
  { label: 'How it works', to: '/#how-it-works' },
  { label: 'Graph', to: '/app/graph' },
  { label: 'Lenses', to: '/app/lenses' },
];

const CAPABILITIES = [
  {
    code: 'MAP',
    title: 'Map capital topology',
    body: 'Protocols, pools, wallets and chains resolved into one Capital Flow Graph.',
    link: '/app/graph',
    linkLabel: 'Open graph',
  },
  {
    code: 'PRED',
    title: 'Read movement pressure',
    body: 'Cohorts and signals expose where capital is likely to rotate next.',
    link: '/app/lenses',
    linkLabel: 'View lenses',
  },
  {
    code: 'ROUTE',
    title: 'Find lower-friction paths',
    body: 'Route recommendations compare graph distance, liquidity and execution friction.',
    link: '/app/routes',
    linkLabel: 'Find routes',
  },
];

const PIPELINE = [
  { step: '01', name: 'Ingest', detail: 'Indexed on-chain flow events.' },
  { step: '02', name: 'Model', detail: 'Typed Capital Flow Graph edges.' },
  { step: '03', name: 'Analyze', detail: 'Cohorts, signals and route pressure.' },
  { step: '04', name: 'Act', detail: 'Operator decisions inside the dashboard.' },
];

const METRICS = [
  { value: '4.2k', label: 'flows' },
  { value: '12', label: 'chains' },
  { value: '380', label: 'wallets' },
];

const focusRing =
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300';

export function Landing() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#020305] text-white antialiased">
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.16]"
        aria-hidden="true"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.12) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.12) 1px, transparent 1px)',
          backgroundSize: '72px 72px',
          maskImage: 'linear-gradient(to bottom, black, transparent 76%)',
        }}
      />

      <header className="sticky top-0 z-20 border-b border-white/10 bg-black/78 backdrop-blur-xl">
        <div className="mx-auto flex h-20 w-full max-w-7xl items-center justify-between px-5 sm:px-8">
          <Link to="/app" className={`flex items-center gap-4 rounded-md ${focusRing}`}>
            <span className="relative grid h-10 w-10 place-items-center border border-white/20 bg-white/[0.03]">
              <span className="absolute inset-x-2 top-2 h-px bg-white/40" aria-hidden="true" />
              <span className="h-2.5 w-2.5 rounded-full bg-cyan-300 shadow-[0_0_22px_rgba(103,232,249,0.9)]" />
            </span>
            <span className="leading-none">
              <span className="block text-sm font-semibold tracking-[0.18em] text-white uppercase">
                CohortLens
              </span>
              <span className="mt-1 hidden font-mono text-[11px] text-white/45 sm:block">
                Capital Flow Graph
              </span>
            </span>
          </Link>

          <nav className="hidden items-center gap-10 md:flex" aria-label="Primary navigation">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.label}
                to={link.to}
                className={`rounded-md font-mono text-sm text-white/55 transition-colors hover:text-white ${focusRing}`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <Link
              to="/app"
              className={`hidden border border-cyan-300 bg-cyan-300 px-5 py-2.5 text-sm font-semibold text-black transition-colors hover:bg-white sm:inline-flex ${focusRing}`}
            >
              Enter dashboard
            </Link>
            <button
              type="button"
              onClick={() => setMobileMenuOpen((open) => !open)}
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileMenuOpen}
              aria-controls="landing-mobile-menu"
              className={`grid h-10 w-10 place-items-center border border-white/20 bg-white/[0.03] text-white md:hidden ${focusRing}`}
            >
              <span className="sr-only">{mobileMenuOpen ? 'Close menu' : 'Open menu'}</span>
              <span className="flex h-4 w-4 flex-col justify-between" aria-hidden="true">
                <span className="h-px w-full bg-current" />
                <span className="h-px w-full bg-current" />
                <span className="h-px w-full bg-current" />
              </span>
            </button>
          </div>
        </div>

        {mobileMenuOpen ? (
          <nav
            id="landing-mobile-menu"
            className="border-t border-white/10 bg-black px-5 py-5 md:hidden"
            aria-label="Mobile navigation"
          >
            <div className="flex flex-col gap-4">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.label}
                  to={link.to}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`rounded-md font-mono text-sm text-white/70 ${focusRing}`}
                >
                  {link.label}
                </Link>
              ))}
              <Link
                to="/app"
                onClick={() => setMobileMenuOpen(false)}
                className={`border border-cyan-300 bg-cyan-300 px-5 py-3 text-center text-sm font-semibold text-black ${focusRing}`}
              >
                Enter dashboard
              </Link>
            </div>
          </nav>
        ) : null}
      </header>

      <main className="relative z-10">
        <section className="mx-auto grid min-h-[calc(100vh-5rem)] w-full max-w-7xl grid-cols-1 items-center gap-12 px-5 py-16 sm:px-8 lg:grid-cols-[0.92fr_1.08fr] lg:py-20">
          <div className="max-w-3xl">
            <p className="mb-7 inline-flex items-center gap-3 border border-white/15 px-3 py-2 font-mono text-xs text-white/65">
              <span className="h-px w-8 bg-cyan-300 shadow-[0_0_18px_rgba(103,232,249,0.9)]" aria-hidden="true" />
              GRAPH INTELLIGENCE FOR DEFI
            </p>

            <h1 className="max-w-4xl text-5xl font-semibold leading-[0.94] tracking-normal text-white sm:text-7xl lg:text-8xl">
              See capital flow before the market does.
            </h1>

            <p className="mt-7 max-w-2xl text-lg leading-8 text-white/58 sm:text-xl">
              CohortLens maps protocols, pools, wallets and chains into a single Capital
              Flow Graph, then turns topology into route and Lens decisions.
            </p>

            <div className="mt-10 flex flex-col gap-3 sm:flex-row">
              <Link
                to="/app"
                className={`inline-flex h-12 items-center justify-center border border-cyan-300 bg-cyan-300 px-6 text-sm font-semibold text-black transition-colors hover:bg-white ${focusRing}`}
              >
                Enter dashboard
              </Link>
              <Link
                to="/app/graph"
                className={`inline-flex h-12 items-center justify-center border border-white/20 px-6 text-sm font-semibold text-white transition-colors hover:border-white/60 ${focusRing}`}
              >
                Explore graph
              </Link>
            </div>

            <dl className="mt-12 grid max-w-xl grid-cols-3 border-y border-white/10">
              {METRICS.map((metric) => (
                <div key={metric.label} className="border-r border-white/10 py-5 last:border-r-0">
                  <dt className="font-mono text-xs text-white/42">{metric.label}</dt>
                  <dd className="mt-1 font-mono text-2xl font-semibold text-white">{metric.value}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="relative min-h-[380px] overflow-hidden border border-white/12 bg-white/[0.025] lg:min-h-[620px]">
            <div className="absolute inset-x-0 top-0 flex items-center justify-between border-b border-white/10 px-5 py-4">
              <p className="font-mono text-xs text-white/42">capital-flow-graph/live</p>
              <p className="font-mono text-xs text-cyan-300">active route</p>
            </div>
            <div className="absolute inset-0 pt-12">
              <LandingGraph />
            </div>
          </div>
        </section>

        <section className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-px border-y border-white/10 bg-white/10 px-5 sm:px-8 md:grid-cols-3">
          {CAPABILITIES.map((capability) => (
            <article key={capability.title} className="bg-[#020305] px-0 py-10 md:px-8">
              <p className="font-mono text-xs text-cyan-300">{capability.code}</p>
              <h2 className="mt-5 text-xl font-semibold text-white">{capability.title}</h2>
              <p className="mt-4 max-w-sm text-sm leading-7 text-white/52">{capability.body}</p>
              <Link
                to={capability.link}
                className={`mt-7 inline-flex rounded-md font-mono text-sm text-white underline decoration-white/25 underline-offset-4 hover:decoration-cyan-300 ${focusRing}`}
              >
                {capability.linkLabel}
              </Link>
            </article>
          ))}
        </section>

        <section id="how-it-works" className="mx-auto w-full max-w-7xl px-5 py-20 sm:px-8">
          <div className="mb-10 flex items-end justify-between gap-6">
            <div>
              <p className="font-mono text-xs text-cyan-300">HOW IT WORKS</p>
              <h2 className="mt-4 max-w-2xl text-3xl font-semibold tracking-normal text-white sm:text-5xl">
                From raw flow to operator decision.
              </h2>
            </div>
            <div className="hidden h-px flex-1 bg-white/15 sm:block" aria-hidden="true" />
          </div>

          <ol className="grid grid-cols-1 border border-white/10 md:grid-cols-4">
            {PIPELINE.map((item) => (
              <li key={item.step} className="border-b border-white/10 p-6 last:border-b-0 md:border-r md:border-b-0 md:last:border-r-0">
                <p className="font-mono text-xs text-cyan-300">{item.step}</p>
                <h3 className="mt-8 text-lg font-semibold text-white">{item.name}</h3>
                <p className="mt-3 text-sm leading-6 text-white/50">{item.detail}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="mx-auto w-full max-w-7xl px-5 pb-20 sm:px-8">
          <div className="border border-white/10 px-6 py-12 text-center sm:px-10 sm:py-16">
            <h2 className="mx-auto max-w-3xl text-3xl font-semibold tracking-normal text-white sm:text-5xl">
              Start reading the Capital Flow Graph.
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-base leading-7 text-white/54">
              A compact workspace for mapping capital, predicting pressure and choosing lower-friction routes.
            </p>
            <Link
              to="/app"
              className={`mt-8 inline-flex h-12 items-center justify-center border border-cyan-300 bg-cyan-300 px-7 text-sm font-semibold text-black transition-colors hover:bg-white ${focusRing}`}
            >
              Enter dashboard
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
