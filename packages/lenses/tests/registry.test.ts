import { describe, expect, it } from 'vitest';
import { LensRegistry } from '../src/registry';
import { highRiskWallets } from '../src/lenses/high-risk-wallets';

describe('LensRegistry', () => {
  it('registers and lists lenses', () => {
    const registry = new LensRegistry();
    registry.register(highRiskWallets);
    expect(registry.list()).toHaveLength(1);
    expect(registry.get('high-risk-wallets')).toBe(highRiskWallets);
  });

  it('rejects duplicate lens ids', () => {
    const registry = new LensRegistry();
    registry.register(highRiskWallets);
    expect(() => registry.register(highRiskWallets)).toThrow(/already registered/);
  });

  it('returns undefined for an unknown lens', () => {
    const registry = new LensRegistry();
    expect(registry.get('nope')).toBeUndefined();
  });

  it('toggles the active flag without mutating the original', () => {
    const registry = new LensRegistry();
    registry.register(highRiskWallets);
    const updated = registry.setActive('high-risk-wallets', false);
    expect(updated).toBeDefined();
    expect(updated!.active).toBe(false);
    expect(registry.get('high-risk-wallets')!.active).toBe(false);
    expect(highRiskWallets.active).toBe(true);
  });

  it('returns undefined when toggling an unknown lens', () => {
    const registry = new LensRegistry();
    expect(registry.setActive('nope', true)).toBeUndefined();
  });
});
