import { FlowsTable } from '../components/dashboard/FlowsTable';
import { MetricsPanel } from '../components/dashboard/MetricsPanel';
import { Card } from '../components/ui/Card';
import { useGraphFlows, useGraphStats } from '../hooks/useGraphData';

export function Overview() {
  const stats = useGraphStats();
  const flows = useGraphFlows(10);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Overview</h1>
        <p className="mt-1 text-sm text-slate-400">
          Live Capital Flow Graph across chains, protocols, pools and wallets.
        </p>
      </div>

      {stats.isLoading ? (
        <p className="text-sm text-slate-500">Loading metrics…</p>
      ) : stats.data ? (
        <MetricsPanel stats={stats.data} />
      ) : (
        <Card title="Metrics">
          <p className="text-sm text-slate-500">
            Failed to load graph stats ({stats.error instanceof Error ? stats.error.message : 'unknown error'}).
          </p>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2">
          {flows.isLoading ? (
            <p className="text-sm text-slate-500">Loading flows…</p>
          ) : flows.data ? (
            <FlowsTable flows={flows.data.flows} />
          ) : (
            <Card title="Recent flows">
              <p className="text-sm text-slate-500">
                Failed to load flows ({flows.error instanceof Error ? flows.error.message : 'unknown error'}).
              </p>
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
