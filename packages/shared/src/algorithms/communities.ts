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

  // Sparse similarity: group wallets by shared interaction key and link each
  // pair inside a key's set (+1 per key). Equivalent to the pairwise
  // shared-count formulation, but only visits pairs that actually interact,
  // instead of the full O(W²) cross product.
  const walletsByKey = new Map<string, Set<string>>();
  for (const [wallet, keys] of walletKeys) {
    for (const key of keys) {
      const set = walletsByKey.get(key) ?? new Set<string>();
      set.add(wallet);
      walletsByKey.set(key, set);
    }
  }

  const wallets = [...walletKeys.keys()];
  const adjacency = new Map<string, Map<string, number>>();
  for (const group of walletsByKey.values()) {
    const members = [...group];
    for (let i = 0; i < members.length; i++) {
      for (let j = i + 1; j < members.length; j++) {
        link(adjacency, members[i]!, members[j]!, 1);
      }
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
