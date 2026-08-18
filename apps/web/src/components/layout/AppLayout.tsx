import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { WalletButton } from '../wallet/WalletButton';

const NAV_ITEMS = [
  { to: '/app', label: 'Overview', end: true },
  { to: '/app/graph', label: 'Graph' },
  { to: '/app/lenses', label: 'Lenses' },
  { to: '/app/cohorts', label: 'Cohorts' },
  { to: '/app/routes', label: 'Routes' },
  { to: '/app/protocols', label: 'Protocols' },
  { to: '/app/settings', label: 'Settings' },
];

export function AppLayout() {
  const [mobileNavigationOpen, setMobileNavigationOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100">
      <aside className="hidden w-56 shrink-0 border-r border-slate-800 bg-slate-950/80 p-4 md:block">
        <div className="mb-6">
          <h1 className="text-lg font-bold text-sky-400">CohortLens</h1>
          <p className="text-xs text-slate-500">Capital Flow Graph</p>
        </div>
        <nav aria-label="Primary navigation" className="flex flex-col gap-1">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `rounded-md px-3 py-2 text-sm ${
                  isActive
                    ? 'bg-sky-500/15 font-medium text-sky-300'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex min-h-16 items-center justify-between gap-3 border-b border-slate-800 px-4 py-3 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileNavigationOpen((open) => !open)}
              aria-expanded={mobileNavigationOpen}
              aria-controls="mobile-navigation"
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-slate-700 text-slate-300 hover:bg-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500 md:hidden"
            >
              <span className="sr-only">{mobileNavigationOpen ? 'Close navigation' : 'Open navigation'}</span>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4" aria-hidden="true">
                {mobileNavigationOpen ? <path d="M18 6 6 18M6 6l12 12" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
              </svg>
            </button>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-slate-200">Capital flow console</p>
              <p className="hidden text-xs text-slate-500 sm:block">Analysis only · operator-directed</p>
            </div>
          </div>
          <WalletButton />
        </header>
        {mobileNavigationOpen ? (
          <nav id="mobile-navigation" aria-label="Primary navigation" className="border-b border-slate-800 bg-slate-900 p-3 md:hidden">
            <div className="grid grid-cols-2 gap-1">
              {NAV_ITEMS.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  onClick={() => setMobileNavigationOpen(false)}
                  className={({ isActive }) => `rounded-md px-3 py-2 text-sm ${isActive ? 'bg-sky-500/15 font-medium text-sky-300' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}
                >
                  {item.label}
                </NavLink>
              ))}
            </div>
          </nav>
        ) : null}
        <main className="flex-1 overflow-auto p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
