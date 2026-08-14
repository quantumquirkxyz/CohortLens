import { useNeighborhood } from '../../hooks/useGraphData';
import { useGraphStore } from '../../stores/graphStore';
import { Card } from '../ui/Card';

export function NodePanel() {
  const selectedNodeId = useGraphStore((s) => s.selectedNodeId);
  const selectNode = useGraphStore((s) => s.selectNode);
  const { data, isLoading, isError } = useNeighborhood(selectedNodeId);

  if (!selectedNodeId) {
    return (
      <Card title="Node details">
        <p className="text-sm text-slate-500">Click a node in the graph to inspect its neighborhood.</p>
      </Card>
    );
  }

  return (
    <Card
      title={`Node: ${selectedNodeId}`}
      className="flex flex-col gap-3"
    >
      <div className="flex items-center justify-between">
        <span className="text-xs text-slate-400">
          {isLoading ? 'Loading…' : isError ? 'Failed to load' : `${data?.flows.length ?? 0} flows`}
        </span>
        <button
          type="button"
          onClick={() => selectNode(null)}
          className="text-xs text-slate-500 hover:text-slate-300"
        >
          Clear
        </button>
      </div>

      <ul className="max-h-72 space-y-2 overflow-y-auto">
        {(data?.flows ?? []).map((flow) => (
          <li key={flow.id} className="rounded-md border border-slate-800 bg-slate-950/60 p-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-medium text-slate-200">
                {flow.from.id} <span className="text-slate-500">→</span> {flow.to.id}
              </span>
              <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] text-slate-300">{flow.type}</span>
            </div>
            <div className="mt-1 text-slate-400">
              {flow.amount} {flow.asset} · {flow.chain} · {flow.timestamp.toLocaleString()}
            </div>
          </li>
        ))}
        {!isLoading && !isError && (data?.flows.length ?? 0) === 0 ? (
          <li className="text-xs text-slate-500">No flows touch this node.</li>
        ) : null}
      </ul>
    </Card>
  );
}
