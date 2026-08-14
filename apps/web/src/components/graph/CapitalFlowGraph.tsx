import {
  Background,
  BackgroundVariant,
  Controls,
  ReactFlow,
  type Edge,
  type Node,
  type NodeMouseHandler,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import type { GraphNodeData } from '../../lib/graph';

interface CapitalFlowGraphProps {
  nodes: Node<GraphNodeData>[];
  edges: Edge[];
  onNodeClick: NodeMouseHandler<Node<GraphNodeData>>;
}

export function CapitalFlowGraph({ nodes, edges, onNodeClick }: CapitalFlowGraphProps) {
  const handleNodeClick: NodeMouseHandler<Node<GraphNodeData>> = (_event, node) =>
    onNodeClick(_event, node);

  return (
    <div className="h-[560px] w-full rounded-lg border border-slate-800 bg-slate-900/40" data-testid="capital-flow-graph">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodeClick={handleNodeClick}
        fitView
        proOptions={{ hideAttribution: true }}
      >
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#334155" />
        <Controls />
      </ReactFlow>
    </div>
  );
}
