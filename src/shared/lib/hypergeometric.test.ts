import { describe, expect, it } from 'vitest';
import { hypergeometricAtLeast, hypergeometricPMF } from './hypergeometric';

describe('hypergeometric helpers', () => {
  it('returns known boundary probabilities', () => {
    expect(hypergeometricPMF(60, 24, 7, 0)).toBeGreaterThan(0);
    expect(hypergeometricAtLeast(60, 24, 7, 0)).toBe(1);
    expect(hypergeometricAtLeast(60, 0, 7, 1)).toBe(0);
  });

  it('keeps probabilities in the valid range', () => {
    const probability = hypergeometricAtLeast(60, 24, 7, 2);
    expect(probability).toBeGreaterThanOrEqual(0);
    expect(probability).toBeLessThanOrEqual(1);
  });
});
