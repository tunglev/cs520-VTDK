// ── Listing (card on home page) ─────────────────────────────────────────────

export interface Listing {
  id: string | number;
  name: string;
  role: string;
  category: string;
  price: number;
  rating: number;
  reviews: number;
  location: string;
  tags: string[];
  color: string;
  completedJobs: number;
  freelancerUserId?: string; // actual user id of the freelancer (for chat)
}

// ── Extended freelancer profile ──────────────────────────────────────────────

export interface PricingModel {
  type: 'fixed' | 'hourly' | 'project';
  price: number;
  unit: string;
  description: string;
}

export interface FreelancerProfile extends Listing {
  bio: string;
  pricingModels: PricingModel[];
  responseTime: string;
  memberSince: string;
  portfolioItems: PortfolioItem[];
}

export interface PortfolioItem {
  title: string;
  description: string;
  emoji: string;
}

// ── Pricing report data ──────────────────────────────────────────────────────

export interface PriceDistributionBucket {
  range: string;
  count: number;
  avg: number;
}

export interface ScatterPoint {
  name: string;
  price: number;
  rating: number;
  reviews: number;
  isCurrent?: boolean;
}

export interface PricingReport {
  category: string;
  marketAvg: number;
  marketMedian: number;
  marketMin: number;
  marketMax: number;
  sampleSize: number;
  percentile: number;           // where the selected freelancer sits (0–100)
  priceDistribution: PriceDistributionBucket[];
  scatterData: ScatterPoint[];
}