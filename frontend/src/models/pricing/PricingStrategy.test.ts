import { describe, it, expect } from 'vitest';
import {
  FixedPriceStrategy,
  HourlyStrategy,
  ProjectStrategy,
  strategyFromRow,
} from './PricingStrategy';

describe('FixedPriceStrategy', () => {
  it('returns the fixed price', () => {
    const strategy = new FixedPriceStrategy(250);
    expect(strategy.type).toBe('fixed');
    expect(strategy.calculatePrice()).toBe(250);
  });

  it('handles zero price', () => {
    expect(new FixedPriceStrategy(0).calculatePrice()).toBe(0);
  });
});

describe('HourlyStrategy', () => {
  it('calculates hourly rate × estimated hours', () => {
    const strategy = new HourlyStrategy(85, 10);
    expect(strategy.type).toBe('hourly');
    expect(strategy.calculatePrice()).toBe(850);
  });

  it('returns zero when hours are zero', () => {
    expect(new HourlyStrategy(100, 0).calculatePrice()).toBe(0);
  });
});

describe('ProjectStrategy', () => {
  it('returns the flat project price when no milestones', () => {
    const strategy = new ProjectStrategy(2400);
    expect(strategy.type).toBe('project');
    expect(strategy.calculatePrice()).toBe(2400);
  });

  it('sums milestone amounts when milestones exist', () => {
    const strategy = new ProjectStrategy(2400, [
      { title: 'Design', amount: 800 },
      { title: 'Build', amount: 1200 },
      { title: 'QA', amount: 400 },
    ]);
    expect(strategy.calculatePrice()).toBe(2400);
  });

  it('milestone sum can differ from projectPrice', () => {
    const strategy = new ProjectStrategy(1000, [
      { title: 'Phase 1', amount: 600 },
      { title: 'Phase 2', amount: 900 },
    ]);
    expect(strategy.calculatePrice()).toBe(1500);
  });
});

describe('strategyFromRow', () => {
  it('creates FixedPriceStrategy for fixed type', () => {
    const strategy = strategyFromRow({ strategy_type: 'fixed', base_price: 200 });
    expect(strategy).toBeInstanceOf(FixedPriceStrategy);
    expect(strategy.calculatePrice()).toBe(200);
  });

  it('creates HourlyStrategy with estimatedHours=1 for hourly type', () => {
    const strategy = strategyFromRow({ strategy_type: 'hourly', base_price: 75 });
    expect(strategy).toBeInstanceOf(HourlyStrategy);
    expect(strategy.calculatePrice()).toBe(75);
  });

  it('creates ProjectStrategy for project type', () => {
    const strategy = strategyFromRow({ strategy_type: 'project', base_price: 3000 });
    expect(strategy).toBeInstanceOf(ProjectStrategy);
    expect(strategy.calculatePrice()).toBe(3000);
  });
});
