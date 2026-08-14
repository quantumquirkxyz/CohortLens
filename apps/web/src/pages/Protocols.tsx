import { Card } from '../components/ui/Card';
import { useGraphNodes } from '../hooks/useGraphData';

export function Protocols() {
  const nodes = useGraphNodes();
  const protocols = (nodes.data ?? []).filter((node) => node.type === 'protocol');
  const chains = (nodes.data ?? []).filter((node) => node.type === 'chain');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Protocols</h1>
        <p className="mt-1 text-sm text-slate-400">
          Protocols and chains currently present in the Capital Flow Graph.
        </p>
      </div>

      <Card title={`Protocols (${protocols.length})`}>
        {nodes.isLoading ? (
          <p className="text-sm text-slate-500">Loading protocols…</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-500">
                  <th className="pb-2 pr-3 font-medium">Id</th>
                  <th className="pb-2 pr-3 font-medium">Label</th>
                </tr>
              </thead>
              <tbody>
                {protocols.map((node) => (
                  <tr key={node.id} className="border-b border-slate-900 text-slate-300">
                    <td className="py-1.5 pr-3 font-mono">{node.id}</td>
                    <td className="py-1.5">{node.label}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card title={`Chains (${chains.length})`}>
        <ul className="flex flex-wrap gap-2">
          {chains.map((node) => (
            <li key={node.id} className="rounded bg-slate-800 px-2 py-1 font-mono text-xs text-slate-300">
              {node.label}
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
