import { describe, it, expect } from 'vitest';
import { getPricingReport, LISTINGS } from './mockData';
import type { ScatterPoint } from '../types/index';

describe('getPricingReport', () => {
  it('returns a report for a design-category listing', () => {
    const listing = LISTINGS[0]; // Alex Rivera, design, $45
    const report = getPricingReport(listing);
    expect(report.category).toBe(listing.role);
    expect(report.marketAvg).toBe(58);
    expect(report.marketMedian).toBe(55);
    expect(report.sampleSize).toBe(144);
    expect(report.priceDistribution.length).toBeGreaterThan(0);
    expect(report.scatterData.length).toBeGreaterThan(0);
    expect(report.percentile).toBeGreaterThanOrEqual(0);
    expect(report.percentile).toBeLessThanOrEqual(100);
  });

  it('returns a report for a development-category listing', () => {
    const listing = LISTINGS[1]; // Sarah Chen, development, $85
    const report = getPricingReport(listing);
    expect(report.marketAvg).toBe(92);
    expect(report.sampleSize).toBe(146);
  });

  it('marks the current freelancer in scatter data when name matches', () => {
    // Marco Rossi appears by name in DESIGN_SCATTER
    const listing = LISTINGS[2];
    const report = getPricingReport(listing);
    const current = report.scatterData.find((p: ScatterPoint) => p.isCurrent);
    expect(current).toBeDefined();
    expect(current!.name).toBe('Marco Rossi');
  });

  it('does not mark anyone when no name matches in scatter data', () => {
    const listing = LISTINGS[0]; // Alex Rivera — not in scatter data by name
    const report = getPricingReport(listing);
    const current = report.scatterData.find((p: ScatterPoint) => p.isCurrent);
    expect(current).toBeUndefined();
  });

  it('falls back to design data for unknown categories', () => {
    const fakeListing = { ...LISTINGS[0], category: 'nonexistent' };
    const report = getPricingReport(fakeListing);
    expect(report.marketAvg).toBe(58);
  });
});
