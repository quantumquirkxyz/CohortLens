import { NavLink, Outlet } from 'react-router-dom';
import { WalletButton } from '../wallet/WalletButton';

const NAV_ITEMS = [
  { to: '/', label: 'Overview', end: true },
  { to: '/graph', label: 'Graph' },
  { to: '/lenses', label: 'Lenses' },
  { to: '/cohorts', label: 'Cohorts' },
  { to: '/routes', label: 'Routes' },
  { to: '/protocols', label: 'Protocols' },
  { to: '/settings', label: 'Settings' },
];

export function AppLayout() {
  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100">
      <aside className="w-56 shrink-0 border-r border-slate-800 p-4">
        <div className="mb-6">
          <h1 className="text-lg font-bold text-sky-400">CohortLens</h1>
          <p className="text-xs text-slate-500">Capital Flow Graph</p>
        </div>
        <nav className="flex flex-col gap-1">
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
        <header className="flex items-center justify-between border-b border-slate-800 px-6 py-3">
          <span className="text-sm text-slate-400">Prototype dashboard</span>
          <WalletButton />
        </header>
        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
