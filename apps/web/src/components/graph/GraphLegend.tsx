import type { NodeType } from '@cohortlens/shared';
import { NODE_COLORS } from '../../lib/graph';

const LABELS: Record<NodeType, string> = {
  chain: 'Chain',
  protocol: 'Protocol',
  asset: 'Asset',
  pool: 'Pool',
  wallet: 'Wallet',
  position: 'Position',
};

export function GraphLegend() {
  return (
    <div className="flex flex-wrap gap-3 text-xs text-slate-400">
      {(Object.keys(NODE_COLORS) as NodeType[]).map((type) => (
        <span key={type} className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: NODE_COLORS[type] }} />
          {LABELS[type]}
        </span>
      ))}
    </div>
  );
}
