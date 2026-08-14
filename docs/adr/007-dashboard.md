# ADR 007: Dashboard for Capital Flow Graph Visualization

## Status

Accepted

## Context

CohortLens needs a frontend dashboard to visualize the Capital Flow Graph, signals, cohorts, and routes. The frontend uses React with Vite.

## Decision

Use **React** with **Vite**, **React Flow** for graph visualization, and **Tailwind CSS** for styling.

### Tech Stack

- **Framework**: React 18+ with Vite
- **Graph Visualization**: React Flow (for node/edge diagrams)
- **Charts**: Recharts (for metrics and signals)
- **Styling**: Tailwind CSS
- **State Management**: Zustand (lightweight)
- **Data Fetching**: TanStack Query (React Query)
- **Wallet Connection**: wagmi + viem

### Directory Structure

```
apps/web/
├── src/
│   ├── components/
│   │   ├── graph/
│   │   │   ├── CapitalFlowGraph.tsx    # Main graph component
│   │   │   ├── GraphControls.tsx       # Zoom, pan, filters
│   │   │   ├── GraphLegend.tsx         # Node/edge type legend
│   │   │   └── GraphTooltip.tsx        # Hover tooltips
│   │   ├── dashboard/
│   │   │   ├── MetricsPanel.tsx        # Key metrics display
│   │   │   ├── SignalsList.tsx         # Risk/liquidity signals
│   │   │   ├── CohortsList.tsx         # Wallet cohorts
│   │   │   └── RoutesList.tsx          # Arbitrage routes
│   │   ├── layout/
│   │   │   ├── Sidebar.tsx
│   │   │   ├── Header.tsx
│   │   │   └── Footer.tsx
│   │   └── ui/                         # Shared UI components
│   ├── hooks/
│   │   ├── useCapitalFlowGraph.ts      # Graph data fetching
│   │   ├── useSignals.ts               # Signals data
│   │   └── useWallet.ts                # Wallet connection
│   ├── stores/
│   │   └── graphStore.ts               # Graph state management
│   ├── pages/
│   │   ├── Dashboard.tsx               # Main dashboard
│   │   ├── GraphExplorer.tsx           # Graph exploration
│   │   ├── Signals.tsx                 # Signals view
│   │   └── Settings.tsx                # User settings
│   ├── lib/
│   │   ├── api.ts                      # API client
│   │   └── utils.ts                    # Utility functions
│   ├── App.tsx
│   └── main.tsx
├── index.html
├── vite.config.ts
├── tailwind.config.js
├── tsconfig.json
└── package.json
```

### Graph Visualization Component

```tsx
// src/components/graph/CapitalFlowGraph.tsx
import React, { useCallback } from "react";
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
} from "reactflow";
import "reactflow/dist/style.css";

interface CapitalFlowGraphProps {
  nodes: Node[];
  edges: Edge[];
  onNodeClick?: (node: Node) => void;
  onEdgeClick?: (edge: Edge) => void;
}

export function CapitalFlowGraph({
  nodes: initialNodes,
  edges: initialEdges,
  onNodeClick,
  onEdgeClick,
}: CapitalFlowGraphProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const handleNodeClick = useCallback(
    (event: React.MouseEvent, node: Node) => {
      onNodeClick?.(node);
    },
    [onNodeClick]
  );

  const handleEdgeClick = useCallback(
    (event: React.MouseEvent, edge: Edge) => {
      onEdgeClick?.(edge);
    },
    [onEdgeClick]
  );

  return (
    <div className="w-full h-[600px] border rounded-lg">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={handleNodeClick}
        onEdgeClick={handleEdgeClick}
        fitView
      >
        <Controls />
        <Background gap={16} />
      </ReactFlow>
    </div>
  );
}
```

### Dashboard Page

```tsx
// src/pages/Dashboard.tsx
import { useCapitalFlowGraph } from "../hooks/useCapitalFlowGraph";
import { useSignals } from "../hooks/useSignals";
import { CapitalFlowGraph } from "../components/graph/CapitalFlowGraph";
import { MetricsPanel } from "../components/dashboard/MetricsPanel";
import { SignalsList } from "../components/dashboard/SignalsList";

export function Dashboard() {
  const { nodes, edges, isLoading: graphLoading } = useCapitalFlowGraph();
  const { signals, isLoading: signalsLoading } = useSignals();

  if (graphLoading || signalsLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">CohortLens Dashboard</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <CapitalFlowGraph nodes={nodes} edges={edges} />
        </div>

        <div className="space-y-4">
          <MetricsPanel />
          <SignalsList signals={signals} />
        </div>
      </div>
    </div>
  );
}
```

### Graph Data Hook

```tsx
// src/hooks/useCapitalFlowGraph.ts
import { useQuery } from "@tanstack/react-query";
import { Node, Edge } from "reactflow";
import { api } from "../lib/api";

export function useCapitalFlowGraph() {
  return useQuery({
    queryKey: ["capitalFlowGraph"],
    queryFn: async () => {
      const data = await api.getCapitalFlowGraph();

      // Transform to React Flow format
      const nodes: Node[] = data.nodes.map((node) => ({
        id: node.id,
        type: node.type.toLowerCase(),
        position: { x: node.x, y: node.y },
        data: { label: node.label, ...node.properties },
      }));

      const edges: Edge[] = data.edges.map((edge) => ({
        id: edge.id,
        source: edge.from,
        target: edge.to,
        label: edge.type,
        animated: true,
        style: { strokeWidth: edge.weight * 2 },
      }));

      return { nodes, edges };
    },
  });
}
```

## Alternatives Considered

### D3.js
- **Pros**: Full control, powerful
- **Cons**: Steep learning curve, verbose

### vis.js
- **Pros**: Easy to use, good performance
- **Cons**: Less customizable

### Sigma.js
- **Pros**: WebGL rendering, fast
- **Cons**: Less React integration

### React Flow (Chosen)
- **Pros**: React-native, easy to use, good docs
- **Cons**: Limited to 2D graphs

## Consequences

### Positive
- React-native development
- Easy graph visualization
- Good performance for medium graphs
- Rich ecosystem of plugins

### Negative
- Limited to 2D graphs
- Need to handle large graphs carefully
- Custom node types require work

## References

- [React Flow docs](https://reactflow.dev/)
- [Recharts docs](https://recharts.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [wagmi](https://wagmi.sh/)
