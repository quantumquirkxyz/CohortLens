import { useState, type FormEvent } from 'react';
import { Card } from '../components/ui/Card';
import { useGraphNodes } from '../hooks/useGraphData';
import { usePath } from '../hooks/useAnalysis';

export function Routes() {
  const nodes = useGraphNodes();
  const [source, setSource] = useState('');
  const [target, setTarget] = useState('');
  const [submitted, setSubmitted] = useState<{ source: string; target: string } | null>(null);
  const path = usePath(submitted?.source ?? null, submitted?.target ?? null);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (source && target) setSubmitted({ source, target });
  };

  const nodeOptions = nodes.data ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Route optimizer</h1>
        <p className="mt-1 text-sm text-slate-400">
          Cheapest path between two nodes on the Capital Flow Graph (friction cost model).
        </p>
      </div>

      <Card title="Find a path">
        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_1fr_auto]">
          <label className="block">
            <span className="text-xs text-slate-500">Source node</span>
            <input
              required
              list="route-nodes"
              value={source}
              onChange={(e) => setSource(e.target.value)}
              placeholder="wallet-1"
              className="mt-1 w-full rounded-md border border-slate-800 bg-slate-950 px-2 py-1.5 font-mono text-xs text-slate-200 outline-none focus:border-sky-500"
            />
          </label>
          <label className="block">
            <span className="text-xs text-slate-500">Target node</span>
            <input
              required
              list="route-nodes"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              placeholder="wallet-5"
              className="mt-1 w-full rounded-md border border-slate-800 bg-slate-950 px-2 py-1.5 font-mono text-xs text-slate-200 outline-none focus:border-sky-500"
            />
          </label>
          <button
            type="submit"
            disabled={!source || !target}
            className="self-end rounded-md bg-sky-600 px-4 py-1.5 text-xs font-medium text-white hover:bg-sky-500 disabled:opacity-50"
          >
            Optimize
          </button>
          <datalist id="route-nodes">
            {nodeOptions.map((node) => (
              <option key={node.id} value={node.id}>
                {node.label} ({node.type})
              </option>
            ))}
          </datalist>
        </form>
      </Card>

      {path.isError ? (
        <Card title="Result">
          <p className="text-sm text-rose-400">
            {path.error instanceof Error ? path.error.message : 'no path found'}
          </p>
        </Card>
      ) : null}

      {path.isLoading ? (
        <p className="text-sm text-slate-500">Computing cheapest path…</p>
      ) : null}

      {path.data ? (
        <Card title={`Cheapest path — total cost ${path.data.totalCost.toFixed(4)}`}>
          <div className="mb-3 flex flex-wrap items-center gap-1.5 text-xs">
            {path.data.nodes.map((nodeId, index) => (
              <span key={nodeId} className="flex items-center gap-1.5">
                <span className="rounded bg-sky-500/10 px-2 py-0.5 font-mono text-sky-300">{nodeId}</span>
                {index < path.data.nodes.length - 1 ? (
                  <span className="text-slate-600">→</span>
                ) : null}
              </span>
            ))}
          </div>

          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-500">
                <th className="pb-2 pr-3 font-medium">Step</th>
                <th className="pb-2 pr-3 font-medium">From → To</th>
                <th className="pb-2 pr-3 font-medium">Type</th>
                <th className="pb-2 pr-3 font-medium">Amount</th>
                <th className="pb-2 font-medium">Asset</th>
              </tr>
            </thead>
            <tbody>
              {path.data.steps.map((flow) => (
                <tr key={flow.id} className="border-b border-slate-900 text-slate-300">
                  <td className="py-1.5 pr-3 font-mono">{flow.id}</td>
                  <td className="py-1.5 pr-3 font-mono">
                    {flow.from.id} → {flow.to.id}
                  </td>
                  <td className="py-1.5 pr-3">{flow.type}</td>
                  <td className="py-1.5 pr-3">{flow.amount}</td>
                  <td className="py-1.5">{flow.asset}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      ) : null}
    </div>
  );
}
