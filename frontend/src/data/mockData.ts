import type {
  Listing,
  FreelancerProfile,
  PriceDistributionBucket,
  ScatterPoint,
  PricingReport,
} from '../types';

export const LISTINGS: Listing[] = [
  { id: 1, name: 'Alex Rivera', role: 'UI/UX Designer', category: 'design', completedJobs: 98, price: 45, rating: 4.9, reviews: 124, location: 'Berlin, DE', tags: ['Figma', 'Prototyping'], color: 'bg-vibrant-coral' },
  { id: 2, name: 'Sarah Chen', role: 'Fullstack Developer', category: 'development', completedJobs: 74, price: 85, rating: 5.0, reviews: 89, location: 'San Francisco, US', tags: ['React', 'Node.js'], color: 'bg-rosy-copper' },
  { id: 3, name: 'Marco Rossi', role: 'Logo Designer', category: 'design', completedJobs: 182, price: 30, rating: 4.7, reviews: 210, location: 'Milan, IT', tags: ['Illustrator', 'Branding'], color: 'bg-white' },
  { id: 4, name: 'Elena Petrova', role: 'Content Strategist', category: 'writing', completedJobs: 49, price: 55, rating: 4.8, reviews: 56, location: 'London, UK', tags: ['SEO', 'Copywriting'], color: 'bg-vibrant-coral' },
  { id: 5, name: 'James Wilson', role: 'Backend Engineer', category: 'development', completedJobs: 120, price: 95, rating: 4.9, reviews: 78, location: 'New York, US', tags: ['Python', 'Django'], color: 'bg-rosy-copper' }
];

// ── Price distribution by category ───────────────────────────────────────────

const DESIGN_DISTRIBUTION: PriceDistributionBucket[] = [
  { range: '$0–30', count: 18, avg: 22 },
  { range: '$30–50', count: 52, avg: 41 },
  { range: '$50–70', count: 38, avg: 61 },
  { range: '$70–90', count: 21, avg: 79 },
  { range: '$90–120', count: 11, avg: 103 },
  { range: '$120+', count: 4, avg: 145 },
];
 
const DEV_DISTRIBUTION: PriceDistributionBucket[] = [
  { range: '$0–40', count: 8, avg: 32 },
  { range: '$40–70', count: 22, avg: 57 },
  { range: '$70–90', count: 34, avg: 82 },
  { range: '$90–110', count: 41, avg: 99 },
  { range: '$110–140', count: 27, avg: 124 },
  { range: '$140+', count: 14, avg: 163 },
];
 
const WRITING_DISTRIBUTION: PriceDistributionBucket[] = [
  { range: '$0–25', count: 24, avg: 18 },
  { range: '$25–45', count: 47, avg: 36 },
  { range: '$45–65', count: 31, avg: 54 },
  { range: '$65–85', count: 16, avg: 73 },
  { range: '$85–110', count: 9, avg: 95 },
  { range: '$110+', count: 3, avg: 128 },
];

// ── Extended freelancer profiles ─────────────────────────────────────────────
 
export const FREELANCER_PROFILES: Record<number, FreelancerProfile> = {
  1: {
    ...LISTINGS[0],
    bio: "I'm a product designer with 6 years of experience helping startups and agencies craft interfaces that are both beautiful and usable. I specialize in end-to-end design systems, from wireframes to high-fidelity prototypes that developers actually love working with.",
    pricingModels: [
      { type: 'hourly', price: 45, unit: 'per hour', description: 'Ongoing design support & iterations' },
      { type: 'project', price: 800, unit: 'per project', description: 'Full UI audit + redesign (up to 10 screens)' },
      { type: 'fixed', price: 200, unit: 'flat rate', description: 'Single screen design + handoff file' },
    ],
    responseTime: '< 2 hours',
    memberSince: 'Jan 2024',
    portfolioItems: [
      { title: 'FinTech Dashboard', description: 'End-to-end redesign for a budgeting app', emoji: '📊' },
      { title: 'E-commerce Mobile', description: 'iOS shopping experience, 40% conversion lift', emoji: '🛍️' },
      { title: 'SaaS Onboarding', description: 'Reduced drop-off by 28% through UX research', emoji: '🚀' },
    ],
  },
  2: {
    ...LISTINGS[1],
    bio: "Full-stack engineer with a focus on React and Node.js. I build fast, accessible, and maintainable web applications. Previously at two Y Combinator startups. I like working with founders who have strong opinions about product.",
    pricingModels: [
      { type: 'hourly', price: 85, unit: 'per hour', description: 'Feature development & bug fixes' },
      { type: 'project', price: 2400, unit: 'per project', description: 'MVP build (up to 4 weeks, defined scope)' },
    ],
    responseTime: '< 4 hours',
    memberSince: 'Mar 2023',
    portfolioItems: [
      { title: 'Real-time Collab Tool', description: 'WebSocket-based document editor', emoji: '🖊️' },
      { title: 'Stripe Integration', description: 'Full billing & subscription system', emoji: '💳' },
      { title: 'Auth System', description: 'OAuth2 + RBAC from scratch', emoji: '🔐' },
    ],
  },
  3: {
    ...LISTINGS[2],
    bio: "Brand identity designer with a love for clean, memorable logos. I've worked with over 200 clients across food, tech, and retail. My process is transparent: one brief, three concepts, two rounds of revisions.",
    pricingModels: [
      { type: 'fixed', price: 30, unit: 'per logo concept', description: 'Single logo concept + source files' },
      { type: 'project', price: 250, unit: 'per project', description: 'Full brand kit: logo, palette, typography' },
    ],
    responseTime: '< 1 hour',
    memberSince: 'Sep 2022',
    portfolioItems: [
      { title: 'Café Branding', description: 'Complete identity for a local coffee chain', emoji: '☕' },
      { title: 'Tech Startup Logo', description: 'Minimal wordmark for a B2B SaaS', emoji: '⚡' },
      { title: 'Non-profit Rebrand', description: 'Accessible, warm identity for an NGO', emoji: '🌿' },
    ],
  },
  4: {
    ...LISTINGS[3],
    bio: "Content strategist and SEO specialist. I help brands find their voice and rank for the terms that matter. Former journalist turned digital marketer with a background in long-form storytelling and keyword strategy.",
    pricingModels: [
      { type: 'hourly', price: 55, unit: 'per hour', description: 'Strategy sessions & content audits' },
      { type: 'fixed', price: 150, unit: 'per article', description: 'SEO-optimized long-form article (1500–2500 words)' },
    ],
    responseTime: '< 3 hours',
    memberSince: 'Jun 2023',
    portfolioItems: [
      { title: 'B2B Content Strategy', description: '12-month editorial calendar & pillar pages', emoji: '📅' },
      { title: 'Technical SEO Audit', description: 'Full site crawl + remediation roadmap', emoji: '🔍' },
      { title: 'Brand Voice Guide', description: 'Tone, style, and messaging framework', emoji: '✍️' },
    ],
  },
  5: {
    ...LISTINGS[4],
    bio: "Backend engineer specializing in Go and PostgreSQL. I build reliable, high-performance APIs and data pipelines. Comfortable with distributed systems and cloud infrastructure. I write code that's easy to hand off.",
    pricingModels: [
      { type: 'hourly', price: 95, unit: 'per hour', description: 'API development & architecture review' },
      { type: 'project', price: 3200, unit: 'per project', description: 'Microservice build with CI/CD pipeline' },
    ],
    responseTime: '< 6 hours',
    memberSince: 'Nov 2022',
    portfolioItems: [
      { title: 'High-throughput API', description: '10k req/s Go service with Redis caching', emoji: '⚙️' },
      { title: 'Data Pipeline', description: 'ETL pipeline processing 50M rows/day', emoji: '🔄' },
      { title: 'Postgres Optimization', description: '8x query speedup via indexing strategy', emoji: '🗄️' },
    ],
  },
  6: {
    ...LISTINGS[5],
    bio: "Motion designer and 3D generalist. I create animations, explainer videos, and visual effects for brands and agencies. Fluent in After Effects, Cinema 4D, and Lottie for web. Every frame is intentional.",
    pricingModels: [
      { type: 'hourly', price: 70, unit: 'per hour', description: 'Animation & motion graphics work' },
      { type: 'project', price: 1200, unit: 'per project', description: '60-second explainer video (script to final render)' },
      { type: 'fixed', price: 300, unit: 'flat rate', description: 'Lottie animation for web (up to 10 seconds)' },
    ],
    responseTime: '< 2 hours',
    memberSince: 'Apr 2024',
    portfolioItems: [
      { title: 'App Launch Video', description: '30s product reveal animation for iOS launch', emoji: '🎬' },
      { title: '3D Product Visualization', description: 'Photorealistic renders for e-commerce', emoji: '📦' },
      { title: 'Brand Motion Guide', description: 'Logo animations + transition system', emoji: '🎨' },
    ],
  },
};

// ── Scatter data by category ─────────────────────────────────────────────────
 
const DESIGN_SCATTER: ScatterPoint[] = [
  { name: 'Designer A', price: 25, rating: 4.2, reviews: 43 },
  { name: 'Designer B', price: 30, rating: 4.5, reviews: 88 },
  { name: 'Designer C', price: 35, rating: 4.6, reviews: 61 },
  { name: 'Designer D', price: 40, rating: 4.7, reviews: 102 },
  { name: 'Designer E', price: 42, rating: 4.3, reviews: 29 },
  { name: 'Marco Rossi', price: 30, rating: 4.7, reviews: 210 },
  { name: 'Designer G', price: 55, rating: 4.8, reviews: 74 },
  { name: 'Designer H', price: 62, rating: 4.9, reviews: 55 },
  { name: 'Designer I', price: 65, rating: 4.4, reviews: 38 },
  { name: 'Designer J', price: 68, rating: 5.0, reviews: 19 },
  { name: 'Yuki Tanaka', price: 70, rating: 5.0, reviews: 34 },
  { name: 'Designer L', price: 75, rating: 4.6, reviews: 47 },
  { name: 'Designer M', price: 85, rating: 4.8, reviews: 31 },
  { name: 'Designer N', price: 95, rating: 4.9, reviews: 22 },
  { name: 'Designer O', price: 110, rating: 4.7, reviews: 18 },
  { name: 'Designer P', price: 130, rating: 5.0, reviews: 9 },
];
 
const DEV_SCATTER: ScatterPoint[] = [
  { name: 'Dev A', price: 40, rating: 4.1, reviews: 28 },
  { name: 'Dev B', price: 55, rating: 4.4, reviews: 52 },
  { name: 'Dev C', price: 65, rating: 4.5, reviews: 44 },
  { name: 'Dev D', price: 70, rating: 4.6, reviews: 67 },
  { name: 'Dev E', price: 75, rating: 4.7, reviews: 83 },
  { name: 'Sarah Chen', price: 85, rating: 5.0, reviews: 89 },
  { name: 'Dev G', price: 88, rating: 4.8, reviews: 71 },
  { name: 'Dev H', price: 90, rating: 4.6, reviews: 38 },
  { name: 'Dev I', price: 95, rating: 4.9, reviews: 55 },
  { name: 'James Wilson', price: 95, rating: 4.9, reviews: 142 },
  { name: 'Dev K', price: 105, rating: 4.7, reviews: 29 },
  { name: 'Dev L', price: 115, rating: 4.8, reviews: 41 },
  { name: 'Dev M', price: 130, rating: 4.9, reviews: 22 },
  { name: 'Dev N', price: 150, rating: 5.0, reviews: 14 },
];
 
const WRITING_SCATTER: ScatterPoint[] = [
  { name: 'Writer A', price: 20, rating: 4.0, reviews: 61 },
  { name: 'Writer B', price: 28, rating: 4.3, reviews: 44 },
  { name: 'Writer C', price: 35, rating: 4.5, reviews: 38 },
  { name: 'Writer D', price: 40, rating: 4.6, reviews: 52 },
  { name: 'Elena Petrova', price: 55, rating: 4.8, reviews: 56 },
  { name: 'Writer F', price: 58, rating: 4.4, reviews: 29 },
  { name: 'Writer G', price: 65, rating: 4.7, reviews: 33 },
  { name: 'Writer H', price: 72, rating: 4.9, reviews: 18 },
  { name: 'Writer I', price: 85, rating: 4.8, reviews: 24 },
  { name: 'Writer J', price: 100, rating: 5.0, reviews: 11 },
];

// ── Pricing report builder ───────────────────────────────────────────────────
 
const CATEGORY_DATA: Record<string, {
  distribution: PriceDistributionBucket[];
  scatter: ScatterPoint[];
  avg: number;
  median: number;
  min: number;
  max: number;
  sampleSize: number;
}> = {
  design: {
    distribution: DESIGN_DISTRIBUTION,
    scatter: DESIGN_SCATTER,
    avg: 58,
    median: 55,
    min: 15,
    max: 175,
    sampleSize: 144,
  },
  development: {
    distribution: DEV_DISTRIBUTION,
    scatter: DEV_SCATTER,
    avg: 92,
    median: 88,
    min: 35,
    max: 200,
    sampleSize: 146,
  },
  writing: {
    distribution: WRITING_DISTRIBUTION,
    scatter: WRITING_SCATTER,
    avg: 46,
    median: 42,
    min: 12,
    max: 135,
    sampleSize: 130,
  },
};
 
export function getPricingReport(listing: Listing): PricingReport {
  const data = CATEGORY_DATA[listing.category] ?? CATEGORY_DATA.design;
 
  // Calculate what percentile this freelancer is at
  const allPrices = data.scatter.map(p => p.price).sort((a, b) => a - b);
  const below = allPrices.filter(p => p < listing.price).length;
  const percentile = Math.round((below / allPrices.length) * 100);
 
  // Mark the current freelancer in scatter data
  const scatterWithCurrent: ScatterPoint[] = data.scatter.map(p =>
    p.name === listing.name ? { ...p, isCurrent: true } : p
  );
 
  return {
    category: listing.role,
    marketAvg: data.avg,
    marketMedian: data.median,
    marketMin: data.min,
    marketMax: data.max,
    sampleSize: data.sampleSize,
    percentile,
    priceDistribution: data.distribution,
    scatterData: scatterWithCurrent,
  };
}
 
// Re-export original price distribution for home page chart
export const PRICE_DISTRIBUTION = DESIGN_DISTRIBUTION;