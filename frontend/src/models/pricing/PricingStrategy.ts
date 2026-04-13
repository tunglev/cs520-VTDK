// ── PricingStrategy interface ────────────────────────────────
// Strategy pattern: ServiceListing holds one PricingStrategy
// and calls calculatePrice() without knowing the concrete type.

export interface PricingStrategy {
  type: 'fixed' | 'hourly' | 'project';
  calculatePrice(): number;
}

// ── FixedPriceStrategy ───────────────────────────────────────

export class FixedPriceStrategy implements PricingStrategy {
  readonly type = 'fixed' as const;
  price: number;

  constructor(price: number) {
    this.price = price;
  }

  calculatePrice(): number {
    return this.price;
  }
}

// ── HourlyStrategy ───────────────────────────────────────────

export class HourlyStrategy implements PricingStrategy {
  readonly type = 'hourly' as const;
  hourlyRate: number;
  estimatedHours: number;

  constructor(hourlyRate: number, estimatedHours: number) {
    this.hourlyRate     = hourlyRate;
    this.estimatedHours = estimatedHours;
  }

  calculatePrice(): number {
    return this.hourlyRate * this.estimatedHours;
  }
}

// ── ProjectStrategy ──────────────────────────────────────────

export interface Milestone {
  title: string;
  dueDate?: string;
  amount: number;
}

export class ProjectStrategy implements PricingStrategy {
  readonly type = 'project' as const;
  projectPrice: number;
  milestones: Milestone[];

  constructor(projectPrice: number, milestones: Milestone[] = []) {
    this.projectPrice = projectPrice;
    this.milestones   = milestones;
  }

  calculatePrice(): number {
    // If milestones are defined sum them; otherwise return the flat project price.
    if (this.milestones.length > 0) {
      return this.milestones.reduce((sum, m) => sum + m.amount, 0);
    }
    return this.projectPrice;
  }
}

// ── Factory helper ───────────────────────────────────────────
// Reconstructs a strategy from a pricing_models database row.

export function strategyFromRow(row: {
  strategy_type: 'fixed' | 'hourly' | 'project';
  base_price: number;
}): PricingStrategy {
  switch (row.strategy_type) {
    case 'fixed':
      return new FixedPriceStrategy(row.base_price);
    case 'hourly':
      return new HourlyStrategy(row.base_price, 1);
    case 'project':
      return new ProjectStrategy(row.base_price);
  }
}