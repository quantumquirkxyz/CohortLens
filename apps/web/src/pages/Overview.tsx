import { Link } from 'react-router-dom';
import { FlowsTable } from '../components/dashboard/FlowsTable';
import { MetricsPanel } from '../components/dashboard/MetricsPanel';
import { Card } from '../components/ui/Card';
import { useGraphFlows, useGraphStats } from '../hooks/useGraphData';

export function Overview() {
  const stats = useGraphStats();
  const flows = useGraphFlows(10);

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 border-b border-slate-800 pb-6 sm:flex-row sm:items-end">
        <div>
          <p className="font-mono text-xs font-medium tracking-wide text-sky-400">NETWORK OVERVIEW</p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight">Capital flow console</h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-400">
            {stats.data
              ? `${stats.data.flows} indexed capital flows are ready to inspect across the Capital Flow Graph.`
              : 'Inspect the live state of capital across chains, protocols, pools and wallets.'}
          </p>
        </div>
        <Link to="/app/graph" className="inline-flex shrink-0 items-center justify-center rounded-md bg-sky-600 px-3.5 py-2 text-sm font-medium text-white transition-colors hover:bg-sky-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500">
          Inspect graph
        </Link>
      </div>

      {stats.isLoading ? (
        <Card title="Capital Flow Graph inventory">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3" aria-label="Loading graph inventory">
            {Array.from({ length: 6 }, (_, index) => <div key={index} className="h-20 animate-pulse rounded-lg border border-slate-800 bg-slate-950/70" />)}
          </div>
        </Card>
      ) : stats.data ? (
        <MetricsPanel stats={stats.data} />
      ) : (
        <Card title="Metrics">
          <p className="text-sm text-slate-500">
            Failed to load graph stats ({stats.error instanceof Error ? stats.error.message : 'unknown error'}).
          </p>
          <button type="button" onClick={() => void stats.refetch()} className="mt-3 rounded-md border border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500">
            Retry graph stats
          </button>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2">
          {flows.isLoading ? (
            <Card title="Recent flows"><div className="h-56 animate-pulse rounded-md bg-slate-950/70" aria-label="Loading recent flows" /></Card>
          ) : flows.data ? (
            <FlowsTable flows={flows.data.flows} />
          ) : (
            <Card title="Recent flows">
              <p className="text-sm text-slate-500">
                Failed to load flows ({flows.error instanceof Error ? flows.error.message : 'unknown error'}).
              </p>
              <button type="button" onClick={() => void flows.refetch()} className="mt-3 rounded-md border border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500">
                Retry recent flows
              </button>
            </Card>
          )}
        </div>

        {stats.data ? (
          <Card title="Flows by type">
            <ul className="space-y-2">
              {Object.entries(stats.data.flowsByType).map(([type, count]) => (
                <li key={type} className="flex items-center justify-between text-sm">
                  <span className="text-slate-300">{type}</span>
                  <span className="rounded bg-slate-800 px-2 py-0.5 text-xs text-slate-300">{count}</span>
                </li>
              ))}
            </ul>
          </Card>
        ) : null}
      </div>
    </div>
  );
}
