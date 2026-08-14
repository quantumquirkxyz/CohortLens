import { useMemo } from 'react';
import type { Node, NodeMouseHandler } from '@xyflow/react';
import { CapitalFlowGraph } from '../components/graph/CapitalFlowGraph';
import { GraphLegend } from '../components/graph/GraphLegend';
import { NodePanel } from '../components/graph/NodePanel';
import { Card } from '../components/ui/Card';
import { useGraphFlows, useGraphNodes } from '../hooks/useGraphData';
import { flowsToGraph, type GraphNodeData } from '../lib/graph';
import { useGraphStore } from '../stores/graphStore';

export function GraphExplorer() {
  const nodesQuery = useGraphNodes();
  const flowsQuery = useGraphFlows(500);
  const selectNode = useGraphStore((s) => s.selectNode);

  const labels = useMemo(() => {
    const map: Record<string, string> = {};
    for (const node of nodesQuery.data ?? []) map[node.id] = node.label;
    return map;
  }, [nodesQuery.data]);

  const { nodes, edges } = useMemo(
    () => flowsToGraph(flowsQuery.data?.flows ?? [], labels),
    [flowsQuery.data, labels],
  );

  const handleNodeClick: NodeMouseHandler<Node<GraphNodeData>> = (_event, node) => selectNode(node.id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Capital Flow Graph</h1>
        <p className="mt-1 text-sm text-slate-400">
          {flowsQuery.isLoading
            ? 'Loading graph…'
            : `${nodes.length} nodes · ${edges.length} flows — click a node to inspect it.`}
        </p>
      </div>

      <GraphLegend />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-4">
        <div className="xl:col-span-3">
          {flowsQuery.isLoading ? (
            <Card title="Graph">
              <p className="text-sm text-slate-500">Loading graph…</p>
            </Card>
          ) : flowsQuery.data ? (
            <CapitalFlowGraph nodes={nodes} edges={edges} onNodeClick={handleNodeClick} />
          ) : (
            <Card title="Graph">
              <p className="text-sm text-slate-500">
                Failed to load the graph (
                {flowsQuery.error instanceof Error ? flowsQuery.error.message : 'unknown error'}).
              </p>
            </Card>
          )}
        </div>

        <NodePanel />
      </div>
    </div>
  );
}
