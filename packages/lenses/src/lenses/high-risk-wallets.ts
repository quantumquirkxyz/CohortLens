import type { CapitalFlow, LensFinding, LensResult } from '@cohortlens/shared';
import type { LensExecutionContext, RegisteredLens } from '../execution';

interface WalletAggregate {
  inflow: number;
  outflow: number;
  count: number;
  hasBorrowOrWithdraw: boolean;
}

function toNumber(value: unknown, fallback: number): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() !== '' && Number.isFinite(Number(value))) {
    return Number(value);
  }
  return fallback;
}

const round2 = (n: number) => Math.round(n * 100) / 100;

function aggregate(walletId: string, flows: CapitalFlow[]): WalletAggregate {
  let inflow = 0;
  let outflow = 0;
  let count = 0;
  let hasBorrowOrWithdraw = false;

  for (const flow of flows) {
    if (flow.from.type !== 'wallet' && flow.to.type !== 'wallet') continue;
    if (flow.from.id !== walletId && flow.to.id !== walletId) continue;

    const amount = Number(flow.amount) || 0;
    if (flow.to.id === walletId) inflow += amount;
    if (flow.from.id === walletId) outflow += amount;
    count += 1;
    if (flow.type === 'Borrow' || flow.type === 'Withdraw') {
      hasBorrowOrWithdraw = true;
    }
  }
  return { inflow, outflow, count, hasBorrowOrWithdraw };
}

/**
 * Mock Lens (issue #9): flags wallets with elevated counterparty risk based on
 * flow activity, volume, and borrow/withdraw exposure in the Capital Flow
 * Graph. Heuristic only — the real scoring model lands with topological
 * analysis (Fase 3).
 */
export const highRiskWallets: RegisteredLens = {
  id: 'high-risk-wallets',
  name: 'High-Risk Wallets',
  type: 'risk_signal',
  description:
    'Flags wallets with elevated counterparty risk from flow count, volume, and borrow/withdraw exposure.',
  inputSchema: {
    limit: 'number (default 5) — max findings to return',
    minScore: 'number (default 0.5) — minimum risk score (0..1)',
  },
  price: '5',
  active: true,
  async execute(ctx: LensExecutionContext): Promise<LensResult> {
    const limit = Math.max(1, Math.min(Math.floor(toNumber(ctx.params.limit, 5)), 50));
    const minScore = Math.min(Math.max(toNumber(ctx.params.minScore, 0.5), 0), 1);

    const flows = await ctx.graph.listFlows({ limit: 1000 });
    const walletIds = new Set<string>();
    for (const flow of flows) {
      if (flow.from.type === 'wallet') walletIds.add(flow.from.id);
      if (flow.to.type === 'wallet') walletIds.add(flow.to.id);
    }

    const aggregates = [...walletIds].map((id) => ({ walletId: id, ...aggregate(id, flows) }));
    const maxCount = Math.max(...aggregates.map((a) => a.count), 1);
    const maxVolume = Math.max(
      ...aggregates.map((a) => a.inflow + a.outflow),
      1,
    );

    const findings: LensFinding[] = aggregates
      .map((a) => {
        const activity = a.count / maxCount;
        const volume = (a.inflow + a.outflow) / maxVolume;
        const exposure = a.hasBorrowOrWithdraw ? 0.2 : 0;
        const score = Math.min(activity * 0.5 + volume * 0.3 + exposure, 1);

        const reasons: string[] = [];
        if (a.count > 0) reasons.push(`${a.count} flow(s)`);
        if (a.inflow + a.outflow > 0) {
          reasons.push(`volume ${Math.round(a.inflow + a.outflow)}`);
        }
        if (a.hasBorrowOrWithdraw) reasons.push('borrow/withdraw exposure');

        return { walletId: a.walletId, score: round2(score), reasons };
      })
      .filter((f) => f.score >= minScore)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    return {
      lensId: highRiskWallets.id,
      signal: 'risk',
      generatedAt: new Date(),
      findings,
      summary: `${findings.length} wallet(s) flagged with score >= ${minScore}`,
    };
  },
};
