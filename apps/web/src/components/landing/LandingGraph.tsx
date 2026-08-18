const PASSIVE_EDGES = [
  ['protocol', 'pool-b'],
  ['pool-a', 'chain'],
  ['pool-a', 'wallet-9'],
  ['wallet-4', 'chain'],
  ['wallet-4', 'asset'],
  ['exchange', 'asset'],
  ['exchange', 'signal'],
];

const ACTIVE_EDGES = [
  ['protocol', 'pool-a'],
  ['pool-a', 'wallet-4'],
  ['wallet-4', 'exchange'],
];

const NODES = {
  protocol: { id: 'protocol-1', x: 96, y: 278, active: true },
  poolA: { id: 'pool-a', x: 286, y: 194, active: true },
  wallet4: { id: 'wallet-4', x: 474, y: 284, active: true },
  exchange: { id: 'exchange-2', x: 666, y: 204, active: true },
  chain: { id: 'chain-3', x: 286, y: 384, active: false },
  poolB: { id: 'pool-b', x: 156, y: 420, active: false },
  wallet9: { id: 'wallet-9', x: 474, y: 112, active: false },
  asset: { id: 'asset-usdc', x: 666, y: 402, active: false },
  signal: { id: 'signal-5', x: 666, y: 72, active: false },
} satisfies Record<string, { id: string; x: number; y: number; active: boolean }>;

const EDGE_LOOKUP = {
  protocol: NODES.protocol,
  'pool-a': NODES.poolA,
  'wallet-4': NODES.wallet4,
  exchange: NODES.exchange,
  chain: NODES.chain,
  'pool-b': NODES.poolB,
  'wallet-9': NODES.wallet9,
  asset: NODES.asset,
  signal: NODES.signal,
} as const;

const NODE_LIST = Object.values(NODES);

export function LandingGraph() {
  return (
    <svg
      viewBox="0 0 760 520"
      role="img"
      aria-label="Capital flow graph: protocol-1 to pool-a to wallet-4 to exchange-2"
      className="h-full min-h-[380px] w-full"
    >
      <defs>
        <filter id="cyan-glow" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <g className="stroke-white/10">
        {PASSIVE_EDGES.map(([from, to]) => {
          const start = EDGE_LOOKUP[from as keyof typeof EDGE_LOOKUP];
          const end = EDGE_LOOKUP[to as keyof typeof EDGE_LOOKUP];

          return (
            <line
              key={`${from}-${to}`}
              x1={start.x}
              y1={start.y}
              x2={end.x}
              y2={end.y}
              strokeWidth={1.1}
            />
          );
        })}
      </g>

      <g filter="url(#cyan-glow)">
        {ACTIVE_EDGES.map(([from, to]) => {
          const start = EDGE_LOOKUP[from as keyof typeof EDGE_LOOKUP];
          const end = EDGE_LOOKUP[to as keyof typeof EDGE_LOOKUP];

          return (
            <line
              key={`${from}-${to}`}
              x1={start.x}
              y1={start.y}
              x2={end.x}
              y2={end.y}
              stroke="#67e8f9"
              strokeWidth={2}
              strokeLinecap="round"
              strokeDasharray="9 10"
              className="animate-dashflow motion-reduce:animate-none"
            />
          );
        })}
      </g>

      {NODE_LIST.map((node) => (
        <g key={node.id}>
          <circle
            cx={node.x}
            cy={node.y}
            r={node.active ? 11 : 8}
            fill={node.active ? '#020305' : 'rgba(255,255,255,0.02)'}
            stroke={node.active ? '#67e8f9' : 'rgba(255,255,255,0.28)'}
            strokeWidth={node.active ? 2.2 : 1.4}
          />
          <circle
            cx={node.x}
            cy={node.y}
            r={node.active ? 3.2 : 2.4}
            fill={node.active ? '#67e8f9' : 'rgba(255,255,255,0.4)'}
          />
          <text
            x={node.x}
            y={node.y + (node.active ? 34 : 30)}
            textAnchor="middle"
            fontSize={12}
            className={node.active ? 'fill-white font-mono' : 'fill-white/38 font-mono'}
          >
            {node.id}
          </text>
        </g>
      ))}

      <g className="fill-white/35 font-mono text-[10px]" aria-hidden="true">
        <text x="36" y="42">route: live</text>
        <text x="36" y="60">signal: active</text>
      </g>
    </svg>
  );
}
