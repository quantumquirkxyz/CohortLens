import { describe, expect, it } from 'vitest';
import {
  APP_NAME,
  FLOW_TYPES,
  LENS_TYPES,
  NODE_TYPES,
  SIGNAL_KINDS,
  isFlowType,
  isNodeType,
} from './index';

describe('@cohortlens/shared', () => {
  it('exports the app name', () => {
    expect(APP_NAME).toBe('CohortLens');
  });

  it('defines the six graph node types', () => {
    expect(NODE_TYPES).toEqual([
      'wallet',
      'protocol',
      'chain',
      'asset',
      'pool',
      'position',
    ]);
  });

  it('defines the six canonical flow types', () => {
    expect(FLOW_TYPES).toEqual([
      'Deposit',
      'Borrow',
      'Repay',
      'Withdraw',
      'Swap',
      'Transfer',
    ]);
  });

  it('isNodeType guards valid node types only', () => {
    expect(isNodeType('wallet')).toBe(true);
    expect(isNodeType('pool')).toBe(true);
    expect(isNodeType('lens')).toBe(false);
    expect(isNodeType(42)).toBe(false);
    expect(isNodeType(null)).toBe(false);
  });

  it('isFlowType guards valid flow types only', () => {
    expect(isFlowType('Deposit')).toBe(true);
    expect(isFlowType('Swap')).toBe(true);
    expect(isFlowType('Stake')).toBe(false);
    expect(isFlowType(undefined)).toBe(false);
  });

  it('defines the three lens categories', () => {
    expect(LENS_TYPES).toEqual(['ml_model', 'graph_query', 'risk_signal']);
  });

  it('defines the signal kinds a Lens can produce', () => {
    expect(SIGNAL_KINDS).toEqual(['risk', 'liquidity', 'recommendation']);
  });
});
