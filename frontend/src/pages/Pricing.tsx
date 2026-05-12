import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Clock, Package, Zap, ArrowRight, Check } from 'lucide-react';

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.35, delay },
});

const PRICING_TYPES = [
  {
    type: 'Hourly',
    icon: Clock,
    tagline: 'Pay for time.',
    color: 'bg-vibrant-coral',
    textColor: 'text-white',
    accentBg: 'bg-white',
    accentText: 'text-vibrant-coral',
    description:
      'You agree on an hourly rate upfront. The freelancer logs hours as they work and you pay for exactly the time spent. Best for evolving work where scope is hard to define in advance.',
    whenToUse: [
      'Ongoing maintenance or support retainers',
      'Exploratory R&D with uncertain scope',
      'Long-term collaboration with a trusted partner',
      'Work that involves frequent back-and-forth iteration',
    ],
    example: {
      label: 'Example',
      value: '$75 / hr',
      note: 'UI/UX Designer — billed weekly',
    },
    marketRange: '$20 – $200+/hr depending on category',
  },
  {
    type: 'Fixed',
    icon: Zap,
    tagline: 'One price. One deliverable.',
    color: 'bg-black',
    textColor: 'text-white',
    accentBg: 'bg-vibrant-coral',
    accentText: 'text-white',
    description:
      'A single flat rate for a clearly scoped deliverable. You know exactly what you\'re paying before work begins. No surprises, no hour-tracking. Great for discrete, well-defined tasks.',
    whenToUse: [
      'A single logo, landing page, or article',
      'Code reviews or security audits',
      'Defined creative assets (banner, icon set, copy)',
      'Any task with a clear "done" state',
    ],
    example: {
      label: 'Example',
      value: '$300 flat',
      note: 'Full brand logo package + source files',
    },
    marketRange: '$25 – $5,000+ depending on deliverable',
  },
  {
    type: 'Project',
    icon: Package,
    tagline: 'Scope it. Ship it.',
    color: 'bg-white',
    textColor: 'text-black',
    accentBg: 'bg-black',
    accentText: 'text-white',
    description:
      'A fixed price for a larger, multi-step engagement. Both parties agree on the full scope — milestones, deliverables, and timeline — before work starts. Escrow releases at each milestone.',
    whenToUse: [
      'Full product or feature builds (e.g. MVP)',
      'Multi-week design sprints',
      'End-to-end content strategies or SEO campaigns',
      'Any project with defined phases and sign-offs',
    ],
    example: {
      label: 'Example',
      value: '$2,400 total',
      note: 'MVP build over 4 weeks, 2 milestone releases',
    },
    marketRange: '$500 – $25,000+ depending on scope',
  },
];

const PLATFORM_FEES = [
  { label: 'Client service fee', value: '0%', note: 'What you see is what you pay' },
  { label: 'Freelancer cut', value: '0%', note: 'Keep every dollar you earn' },
  { label: 'Escrow holding fee', value: '0%', note: 'Funds held at no extra cost' },
  { label: 'Withdrawal fee', value: '0%', note: 'Cash out whenever you want' },
];

const COMPARISON = [
  { feature: 'Platform service fee', fairlance: '0%', others: 'Up to 20%' },
  { feature: 'Transparent market pricing', fairlance: true, others: false },
  { feature: 'Escrow protection', fairlance: true, others: 'Varies' },
  { feature: 'Hourly pricing', fairlance: true, others: true },
  { feature: 'Fixed-rate pricing', fairlance: true, others: true },
  { feature: 'Milestone-based project pricing', fairlance: true, others: 'Varies' },
  { feature: 'Live price index / market data', fairlance: true, others: false },
  { feature: 'Algorithmic promotion / paid placement', fairlance: false, others: true },
];

const FAQ = [
  {
    q: 'Who decides the pricing type?',
    a: 'The freelancer sets their pricing model when they create a listing. A freelancer can offer multiple models — for example, an hourly rate for ongoing work and a flat rate for a single deliverable. You choose the model that suits your project.',
  },
  {
    q: 'How does escrow work?',
    a: 'When you hire a freelancer, the agreed amount is deposited into escrow. For hourly and project work, funds are released at agreed checkpoints. For fixed-rate work, funds release when you mark the deliverable as accepted. Neither party can touch the escrow funds until both sides confirm completion.',
  },
  {
    q: 'What if scope changes mid-project?',
    a: 'Both parties can propose a change order. The new scope and any additional payment are agreed before work continues. This keeps things fair for everyone — no surprise invoices, no unpaid extras.',
  },
  {
    q: 'How does Fairlance make money if fees are 0%?',
    a: 'Fairlance is currently in early access. Our goal is to prove that transparent, fee-free freelancing works at scale. Future revenue models will be announced openly — we will never introduce hidden fees.',
  },
];

export const PricingPage = () => (
  <main className="flex-1 w-full">

    {/* ── Hero ── */}
    <section className="max-w-7xl mx-auto px-8 py-24">
      <motion.p {...fadeUp(0)} className="font-mono text-xs uppercase tracking-widest opacity-50 mb-6">
        Pricing
      </motion.p>
      <motion.h1
        {...fadeUp(0.04)}
        className="text-7xl md:text-9xl font-display uppercase leading-none tracking-tighter mb-10"
      >
        No fees.<br />
        <span className="text-vibrant-coral">Ever.</span>
      </motion.h1>
      <motion.p
        {...fadeUp(0.08)}
        className="font-mono text-sm uppercase max-w-2xl opacity-60 leading-relaxed mb-12"
      >
        Fairlance supports three pricing models — hourly, fixed, and project-based — so you can
        match the structure to the work. Every model comes with escrow protection and zero
        platform fees on either side.
      </motion.p>
      <motion.div {...fadeUp(0.12)} className="flex flex-wrap gap-4">
        <Link
          to="/find-talent"
          className="px-8 py-4 bg-vibrant-coral text-white font-display uppercase border-2 border-black shadow-brutal hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all flex items-center gap-2"
        >
          Find Talent <ArrowRight size={16} strokeWidth={3} />
        </Link>
        <Link
          to="/auth"
          className="px-8 py-4 bg-white font-display uppercase border-2 border-black shadow-brutal-sm hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all"
        >
          Join as Freelancer
        </Link>
      </motion.div>
    </section>

    {/* ── Three Pricing Types ── */}
    <section className="border-t-4 border-black">
      <div className="max-w-7xl mx-auto px-8 py-24">
        <motion.h2 {...fadeUp()} className="text-5xl font-display uppercase tracking-tighter mb-4">
          Pricing Models
        </motion.h2>
        <motion.p {...fadeUp(0.04)} className="font-mono text-xs uppercase opacity-50 mb-16 max-w-xl">
          Every listing on Fairlance uses one of three models. Freelancers pick what fits their
          work — you pick the listing that fits your budget.
        </motion.p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-0 border-4 border-black">
          {PRICING_TYPES.map((model, i) => {
            const Icon = model.icon;
            return (
              <motion.div
                key={model.type}
                {...fadeUp(i * 0.08)}
                className={`${model.color} ${model.textColor} p-10 flex flex-col gap-8 ${
                  i < PRICING_TYPES.length - 1 ? 'border-b-4 lg:border-b-0 lg:border-r-4 border-black' : ''
                }`}
              >
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div>
                    <div className={`font-mono text-[10px] uppercase tracking-widest mb-2 opacity-60`}>
                      Model {String(i + 1).padStart(2, '0')}
                    </div>
                    <div className="font-display uppercase text-4xl tracking-tighter leading-none">
                      {model.type}
                    </div>
                  </div>
                  <div className={`w-12 h-12 ${model.accentBg} border-2 border-black flex items-center justify-center shadow-brutal-sm shrink-0`}>
                    <Icon size={20} strokeWidth={2.5} className={model.accentText} />
                  </div>
                </div>

                {/* Tagline */}
                <div className="font-display uppercase text-xl opacity-70">{model.tagline}</div>

                {/* Description */}
                <p className="font-mono text-xs uppercase leading-relaxed opacity-70">
                  {model.description}
                </p>

                {/* When to use */}
                <div>
                  <div className="font-mono text-[10px] uppercase tracking-widest opacity-50 mb-3">
                    When to use
                  </div>
                  <ul className="space-y-2">
                    {model.whenToUse.map(pt => (
                      <li key={pt} className="flex items-start gap-2 font-mono text-[10px] uppercase">
                        <Check size={11} className="mt-0.5 shrink-0" strokeWidth={3} />
                        <span className="opacity-70">{pt}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Example rate */}
                <div className={`mt-auto border-2 border-black/20 p-4 ${model.accentBg} ${model.accentText}`}>
                  <div className="font-mono text-[10px] uppercase opacity-60 mb-1">{model.example.label}</div>
                  <div className="font-display text-2xl tracking-tighter">{model.example.value}</div>
                  <div className="font-mono text-[10px] uppercase opacity-60 mt-1">{model.example.note}</div>
                </div>

                {/* Market range */}
                <div className="font-mono text-[10px] uppercase opacity-40">
                  Market range: {model.marketRange}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>

    {/* ── Platform Fees ── */}
    <section className="border-t-4 border-black bg-black text-white">
      <div className="max-w-7xl mx-auto px-8 py-24">
        <motion.h2 {...fadeUp()} className="text-5xl font-display uppercase tracking-tighter mb-4">
          Our Fee Structure
        </motion.h2>
        <motion.p {...fadeUp(0.04)} className="font-mono text-xs uppercase opacity-50 mb-16 max-w-xl">
          Other platforms take up to 20% off the top. We take nothing.
        </motion.p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-0 border-4 border-white/20">
          {PLATFORM_FEES.map((fee, i) => (
            <motion.div
              key={fee.label}
              {...fadeUp(i * 0.07)}
              className={`p-8 ${i < PLATFORM_FEES.length - 1 ? 'border-b-4 md:border-b-0 md:border-r-4 border-white/10' : ''}`}
            >
              <div className="font-display text-6xl text-vibrant-coral tracking-tighter leading-none mb-4">
                {fee.value}
              </div>
              <div className="font-display uppercase text-sm tracking-tight mb-2">{fee.label}</div>
              <div className="font-mono text-[10px] uppercase opacity-40">{fee.note}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>

    {/* ── Comparison ── */}
    <section className="border-t-4 border-black bg-[#f5f5f5]">
      <div className="max-w-7xl mx-auto px-8 py-24">
        <motion.h2 {...fadeUp()} className="text-5xl font-display uppercase tracking-tighter mb-16">
          Fairlance vs. Other Platforms
        </motion.h2>

        <motion.div {...fadeUp(0.06)} className="border-4 border-black overflow-hidden">
          {/* Header */}
          <div className="grid grid-cols-3 bg-black text-white">
            <div className="p-5 font-mono text-[10px] uppercase opacity-50">Feature</div>
            <div className="p-5 border-l-4 border-white/20 font-display uppercase text-sm text-vibrant-coral">Fairlance</div>
            <div className="p-5 border-l-4 border-white/20 font-mono text-[10px] uppercase opacity-50">Other Platforms</div>
          </div>
          {/* Rows */}
          {COMPARISON.map((row, i) => (
            <div
              key={row.feature}
              className={`grid grid-cols-3 border-t-2 border-black/10 ${i % 2 === 0 ? 'bg-white' : 'bg-[#f5f5f5]'}`}
            >
              <div className="p-5 font-mono text-[10px] uppercase opacity-60">{row.feature}</div>
              <div className="p-5 border-l-4 border-black/10 font-display uppercase text-sm">
                {typeof row.fairlance === 'boolean' ? (
                  row.fairlance
                    ? <span className="text-vibrant-coral">Yes</span>
                    : <span className="opacity-30">No</span>
                ) : (
                  <span className="text-vibrant-coral">{row.fairlance}</span>
                )}
              </div>
              <div className="p-5 border-l-4 border-black/10 font-mono text-[10px] uppercase opacity-50">
                {typeof row.others === 'boolean' ? (
                  row.others ? 'Yes' : 'No'
                ) : row.others}
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>

    {/* ── FAQ ── */}
    <section className="border-t-4 border-black bg-white">
      <div className="max-w-7xl mx-auto px-8 py-24">
        <motion.h2 {...fadeUp()} className="text-5xl font-display uppercase tracking-tighter mb-16">
          Common Questions
        </motion.h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-0 border-4 border-black">
          {FAQ.map((item, i) => (
            <motion.div
              key={item.q}
              {...fadeUp(i * 0.06)}
              className={`p-10 ${
                i % 2 === 0 ? 'md:border-r-4 border-black' : ''
              } ${i < FAQ.length - 2 ? 'border-b-4 border-black' : ''} ${
                i === FAQ.length - 1 && FAQ.length % 2 !== 0 ? 'md:border-t-4' : ''
              }`}
            >
              <div className="font-display uppercase text-xl tracking-tighter mb-4">{item.q}</div>
              <p className="font-mono text-xs uppercase opacity-60 leading-relaxed">{item.a}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>

    {/* ── CTA ── */}
    <section className="border-t-4 border-black bg-vibrant-coral text-white">
      <div className="max-w-7xl mx-auto px-8 py-24 flex flex-col md:flex-row items-center justify-between gap-8">
        <motion.div {...fadeUp()}>
          <div className="font-display uppercase text-5xl md:text-6xl tracking-tighter leading-tight">
            Fair pricing.<br />Fair work.
          </div>
          <p className="font-mono text-xs uppercase opacity-70 mt-4">
            No hidden fees. No surprises. Just transparent freelancing.
          </p>
        </motion.div>
        <motion.div {...fadeUp(0.08)} className="flex flex-col sm:flex-row gap-4 shrink-0">
          <Link
            to="/find-talent"
            className="px-8 py-4 bg-white text-black font-display uppercase border-2 border-white shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all flex items-center gap-2"
          >
            Find Talent <ArrowRight size={16} strokeWidth={3} />
          </Link>
          <Link
            to="/auth"
            className="px-8 py-4 bg-transparent font-display uppercase border-2 border-white/60 hover:border-white transition-all flex items-center gap-2"
          >
            Start Freelancing
          </Link>
        </motion.div>
      </div>
    </section>

  </main>
);
