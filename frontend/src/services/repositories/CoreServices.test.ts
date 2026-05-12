import { describe, it, expect } from 'vitest';
import { ReportFactory } from './CoreServices';

describe('ReportFactory.createReport', () => {
  const aggregate = {
    category_id: 'cat-1',
    transaction_count: 50,
    price_min: 20,
    price_max: 200,
    price_avg: 85,
    price_median: 80,
  };

  const prediction = { minPrice: 60, maxPrice: 120, suggestedPrice: 90 };
  const anomalies = { outlierIndices: [3], scores: [0.1, 0.2, 0.15, 0.95] };

  it('creates a customer report', () => {
    const report = ReportFactory.createReport('customer', { aggregate, prediction, anomalies });
    expect(report.type).toBe('customer');
    expect(report.categoryId).toBe('cat-1');
    expect(report.marketMin).toBe(20);
    expect(report.marketMax).toBe(200);
    expect(report.marketAvg).toBe(85);
    expect(report.marketMedian).toBe(80);
    expect(report.transactionCount).toBe(50);
    expect(report.prediction).toEqual(prediction);
    expect(report.anomalies).toEqual(anomalies);
    expect('ownPrices' in report).toBe(false);
  });

  it('creates a freelancer report with ownPrices', () => {
    const ownPrices = [75, 80, 90];
    const report = ReportFactory.createReport('freelancer', { aggregate, prediction, anomalies, ownPrices });
    expect(report.type).toBe('freelancer');
    if (report.type === 'freelancer') {
      expect(report.ownPrices).toEqual([75, 80, 90]);
    }
  });

  it('defaults ownPrices to empty array for freelancer', () => {
    const report = ReportFactory.createReport('freelancer', { aggregate, prediction, anomalies });
    if (report.type === 'freelancer') {
      expect(report.ownPrices).toEqual([]);
    }
  });
});
