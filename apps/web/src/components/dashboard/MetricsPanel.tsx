import type { GraphStats } from '../../lib/api';
import { Card } from '../ui/Card';

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-950/70 p-3.5">
      <div className="font-mono text-2xl font-semibold tracking-tight text-sky-300">{value}</div>
      <div className="mt-1 text-xs font-medium text-slate-500">{label}</div>
    </div>
  );
}

export function MetricsPanel({ stats }: { stats: GraphStats }) {
  const nodeTotal = Object.values(stats.nodes).reduce((sum, n) => sum + n, 0);

  return (
    <Card className="overflow-hidden" title="Capital Flow Graph inventory">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Stat label="Nodes" value={nodeTotal} />
        <Stat label="Flows" value={stats.flows} />
        <Stat label="Wallets" value={stats.nodes.wallet ?? 0} />
        <Stat label="Protocols" value={stats.nodes.protocol ?? 0} />
        <Stat label="Pools" value={stats.nodes.pool ?? 0} />
        <Stat label="Assets" value={stats.nodes.asset ?? 0} />
      </div>
    </Card>
  );
}
