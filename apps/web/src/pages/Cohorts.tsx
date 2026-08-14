import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Card } from '../components/ui/Card';
import { useCoMovement, useCohorts } from '../hooks/useAnalysis';

const DEFAULT_ASSETS = ['USDC', 'DAI', 'WETH'];

export function Cohorts() {
  const cohorts = useCohorts();
  const coMovement = useCoMovement(DEFAULT_ASSETS);

  const chartData = (coMovement.data?.pairs ?? []).map((pair) => ({
    name: `${pair.assetA} / ${pair.assetB}`,
    correlation: Number(pair.correlation.toFixed(3)),
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Cohorts</h1>
        <p className="mt-1 text-sm text-slate-400">
          Wallet communities detected on the Capital Flow Graph, and asset co-movement.
        </p>
      </div>

      <Card title={`Detected cohorts (${cohorts.data?.length ?? 0})`}>
        {cohorts.isLoading ? (
          <p className="text-sm text-slate-500">Loading cohorts…</p>
        ) : cohorts.data ? (
          <ul className="space-y-3">
            {cohorts.data.map((cohort) => (
              <li key={cohort.id} className="rounded-md border border-slate-800 bg-slate-950/60 p-3">
                <div className="text-sm font-medium text-slate-200">
                  {cohort.label}{' '}
                  <span className="text-xs font-normal text-slate-500">
                    ({cohort.wallets.length} wallets)
                  </span>
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {cohort.wallets.map((wallet) => (
                    <span
                      key={wallet}
                      className="rounded bg-sky-500/10 px-2 py-0.5 font-mono text-[11px] text-sky-300"
                    >
                      {wallet}
                    </span>
                  ))}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-slate-500">
            Failed to load cohorts (
            {cohorts.error instanceof Error ? cohorts.error.message : 'unknown error'}).
          </p>
        )}
      </Card>

      <Card title={`Asset co-movement (${DEFAULT_ASSETS.join(', ')})`}>
        {coMovement.isLoading ? (
          <p className="text-sm text-slate-500">Loading co-movement…</p>
        ) : coMovement.data ? (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
                <YAxis domain={[-1, 1]} stroke="#64748b" fontSize={11} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', fontSize: 12 }}
                />
                <Bar dataKey="correlation" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="text-sm text-slate-500">
            Failed to load co-movement (
            {coMovement.error instanceof Error ? coMovement.error.message : 'unknown error'}).
          </p>
        )}
      </Card>
    </div>
  );
}
