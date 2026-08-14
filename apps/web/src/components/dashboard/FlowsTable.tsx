import type { CapitalFlow } from '@cohortlens/shared';
import { Card } from '../ui/Card';

export function FlowsTable({ flows }: { flows: CapitalFlow[] }) {
  return (
    <Card title={`Recent flows (${flows.length})`}>
      <div className="overflow-x-auto">
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
    </Card>
  );
}
