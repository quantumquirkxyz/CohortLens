import type { CapitalFlow, Cohort } from '../index';

function link(adj: Map<string, Map<string, number>>, a: string, b: string, weight: number) {
  const from = adj.get(a) ?? new Map<string, number>();
  from.set(b, (from.get(b) ?? 0) + weight);
  adj.set(a, from);
  const to = adj.get(b) ?? new Map<string, number>();
  to.set(a, (to.get(a) ?? 0) + weight);
  adj.set(b, to);
}

/**
 * Detect Cohorts of Wallets by label propagation over a wallet similarity
 * graph. Two wallets are linked when they interact with the same pool, with
 * edge weight = number of shared pools (+1 per direct wallet-to-wallet
 * transfer). Deterministic tie-breaking (smallest label) keeps the result
 * stable for the same input. Prototype of the Louvain/label-propagation
 * family the implementation plan points at.
 */
export function detectCommunities(flows: CapitalFlow[]): Cohort[] {
  // Wallet -> set of shared-interaction keys (pool ids and transfer ids).
  const walletKeys = new Map<string, Set<string>>();
  const addKey = (wallet: string, key: string) => {
    const keys = walletKeys.get(wallet) ?? new Set<string>();
    keys.add(key);
    walletKeys.set(wallet, keys);
  };
  for (const flow of flows) {
    if (flow.from.type === 'wallet' && flow.to.type === 'wallet') {
      // A direct transfer links both wallets (via the transfer itself).
      const key = `transfer:${flow.id}`;
      addKey(flow.from.id, key);
      addKey(flow.to.id, key);
    } else if (flow.from.type === 'wallet' && flow.to.type === 'pool') {
      addKey(flow.from.id, `pool:${flow.to.id}`);
    } else if (flow.from.type === 'pool' && flow.to.type === 'wallet') {
      addKey(flow.to.id, `pool:${flow.from.id}`);
    }
  }

  const wallets = [...walletKeys.keys()];
  const adjacency = new Map<string, Map<string, number>>();
  for (let i = 0; i < wallets.length; i++) {
    for (let j = i + 1; j < wallets.length; j++) {
      const a = wallets[i]!;
      const b = wallets[j]!;
      const shared = countShared(walletKeys.get(a)!, walletKeys.get(b)!);
      if (shared > 0) link(adjacency, a, b, shared);
    }
  }

  // Label propagation with deterministic tie-breaking.
  const labels = new Map<string, string>(wallets.map((w) => [w, w]));
  let converged = false;
  let iterations = 0;
  while (!converged && iterations < 100) {
    converged = true;
    iterations += 1;
    for (const node of wallets) {
      const neighbors = adjacency.get(node);
      if (!neighbors || neighbors.size === 0) continue;

      const labelWeights = new Map<string, number>();
      for (const [neighbor, weight] of neighbors) {
        const label = labels.get(neighbor)!;
        labelWeights.set(label, (labelWeights.get(label) ?? 0) + weight);
      }
      const best = [...labelWeights.entries()].sort((x, y) => {
        if (y[1] !== x[1]) return y[1] - x[1];
        return x[0] < y[0] ? -1 : x[0] > y[0] ? 1 : 0;
      })[0]![0];

      if (labels.get(node) !== best) {
        labels.set(node, best);
        converged = false;
      }
    }
  }

  const groups = new Map<string, string[]>();
  for (const wallet of wallets) {
    const label = labels.get(wallet)!;
    const group = groups.get(label) ?? [];
    group.push(wallet);
    groups.set(label, group);
  }

  return [...groups.entries()]
    .map(([label, group]) => ({
      id: `cohort-${label}`,
      label,
      wallets: [...group].sort(),
    }))
    .sort((a, b) => b.wallets.length - a.wallets.length);
}

function countShared(a: Set<string>, b: Set<string>): number {
  let count = 0;
  for (const key of a) {
    if (b.has(key)) count += 1;
  }
  return count;
}
