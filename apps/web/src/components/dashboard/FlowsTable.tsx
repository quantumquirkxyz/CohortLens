import type { CapitalFlow } from '@cohortlens/shared';
import { Link } from 'react-router-dom';
import { Card } from '../ui/Card';

export function FlowsTable({ flows }: { flows: CapitalFlow[] }) {
  return (
    <Card title={`Recent flows (${flows.length})`}>
      {flows.length === 0 ? (
        <div className="rounded-md border border-dashed border-slate-700 bg-slate-950/40 px-4 py-8 text-center">
          <p className="text-sm font-medium text-slate-300">No capital flows are available yet.</p>
          <p className="mt-1 text-xs text-slate-500">Inspect the graph once indexed flow data arrives.</p>
          <Link to="/app/graph" className="mt-4 inline-flex rounded-md border border-sky-500/50 bg-sky-500/10 px-3 py-1.5 text-xs font-medium text-sky-300 hover:bg-sky-500/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500">
            Inspect graph
          </Link>
        </div>
      ) : (
      <div className="overflow-x-auto" tabIndex={0} aria-label="Recent capital flows">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-800 text-slate-500">
              <th className="pb-2 pr-3 font-medium">From</th>
              <th className="pb-2 pr-3 font-medium">To</th>
              <th className="pb-2 pr-3 font-medium">Type</th>
              <th className="pb-2 pr-3 font-medium">Amount</th>
              <th className="pb-2 pr-3 font-medium">Asset</th>
              <th className="pb-2 font-medium">Chain</th>
            </tr>
          </thead>
          <tbody>
            {flows.map((flow) => (
              <tr key={flow.id} className="border-b border-slate-900 text-slate-300">
                <td className="py-1.5 pr-3 font-mono">{flow.from.id}</td>
                <td className="py-1.5 pr-3 font-mono">{flow.to.id}</td>
                <td className="py-1.5 pr-3">
                  <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] text-slate-300">
                    {flow.type}
                  </span>
                </td>
                <td className="py-1.5 pr-3">{flow.amount}</td>
                <td className="py-1.5 pr-3">{flow.asset}</td>
                <td className="py-1.5">{flow.chain}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      )}
    </Card>
  );
}
