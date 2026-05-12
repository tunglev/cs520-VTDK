import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Search, BarChart2, ShieldCheck, Zap, DollarSign, Users, Star, ArrowRight } from 'lucide-react';

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.4, delay },
});

const STEPS = [
  {
    number: '01',
    title: 'Browse the Market',
    body: 'Search for the skill you need. Every listing shows the freelancer\'s rate upfront — no hidden service fees added at checkout.',
    icon: Search,
  },
  {
    number: '02',
    title: 'See Real Price Data',
    body: 'The live Price Index shows what the market actually charges for each category, so you always negotiate from a position of knowledge.',
    icon: BarChart2,
  },
  {
    number: '03',
    title: 'Hire with Confidence',
    body: 'Pick a freelancer, agree on scope, and fund the project. Funds are held securely until you approve the completed work.',
    icon: ShieldCheck,
  },
];

const PROBLEMS = [
  {
    platform: 'Other Platforms',
    points: [
      'Service fees up to 20% hidden at checkout',
      'Algorithms decide who gets seen',
      'Opaque pricing with no market benchmarks',
      'Race-to-the-bottom bidding wars',
    ],
    highlight: false,
  },
  {
    platform: 'Fairlance',
    points: [
      'Zero platform service fees — ever',
      'Every freelancer is equally discoverable',
      'Live Price Index shows true market rates',
      'Fair, transparent negotiations',
    ],
    highlight: true,
  },
];

const FEATURES = [
  {
    icon: BarChart2,
    title: 'Live Price Index',
    body: 'A real-time distribution of what clients pay across every category. Know the floor, median, and ceiling before you post a job or set your rate.',
  },
  {
    icon: DollarSign,
    title: 'No Hidden Fees',
    body: 'The price you see is the price you pay. Fairlance does not add a percentage on top of client payments or shave a cut from freelancer earnings.',
  },
  {
    icon: Zap,
    title: 'Instant Matching',
    body: 'Search by skill, category, or price range. Results are ranked by relevance — not by who paid for promotion.',
  },
  {
    icon: ShieldCheck,
    title: 'Escrow Protection',
    body: 'Funds are held in escrow until both parties confirm the work is done. Neither side can be ghosted or stiffed.',
  },
  {
    icon: Users,
    title: 'Dual-Role Accounts',
    body: 'Switch between client and freelancer in one account. Hire someone today, take on work tomorrow.',
  },
  {
    icon: Star,
    title: 'Verified Reviews',
    body: 'Only clients who completed a transaction can leave a review. Every star reflects real work, not manufactured reputation.',
  },
];

const FOR_WHOM = [
  {
    role: 'Clients',
    tagline: 'Hire smarter.',
    points: [
      'Know exactly what a fair rate is before you post',
      'Compare talent without algorithmic interference',
      'Pay only for delivered work via escrow',
      'No surprise fees on checkout',
    ],
    cta: 'Find Talent',
    to: '/',
    bg: 'bg-vibrant-coral',
    textColor: 'text-white',
  },
  {
    role: 'Freelancers',
    tagline: 'Earn fairly.',
    points: [
      'Set rates informed by live market data',
      'Get discovered without paying for placement',
      'Guaranteed payment through escrow',
      'Build a verified track record from day one',
    ],
    cta: 'Start Freelancing',
    to: '/auth',
    bg: 'bg-white',
    textColor: 'text-black',
  },
];

export const HowItWorksPage = () => (
  <main className="flex-1 w-full">

    {/* ── Hero ── */}
    <section className="max-w-7xl mx-auto px-8 py-24">
      <motion.p
        {...fadeUp(0)}
        className="font-mono text-xs uppercase tracking-widest opacity-50 mb-6"
      >
        How It Works
      </motion.p>
      <motion.h1
        {...fadeUp(0.05)}
        className="text-7xl md:text-9xl font-display uppercase leading-none tracking-tighter mb-10"
      >
        Freelancing,{' '}
        <span className="text-vibrant-coral">Finally</span>{' '}
        Fair.
      </motion.h1>
      <motion.p
        {...fadeUp(0.1)}
        className="font-mono text-sm uppercase max-w-2xl opacity-60 leading-relaxed mb-12"
      >
        Fairlance is the world's first transparent freelance marketplace. We publish live
        market-rate data for every skill category so that clients pay fair prices and
        freelancers earn what they deserve — with zero platform fees on either side.
      </motion.p>
      <motion.div {...fadeUp(0.15)} className="flex flex-wrap gap-4">
        <Link
          to="/auth"
          className="px-8 py-4 bg-vibrant-coral text-white font-display uppercase border-2 border-black shadow-brutal hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all flex items-center gap-2"
        >
          Get Started <ArrowRight size={16} strokeWidth={3} />
        </Link>
        <Link
          to="/"
          className="px-8 py-4 bg-white font-display uppercase border-2 border-black shadow-brutal-sm hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all"
        >
          Browse Talent
        </Link>
      </motion.div>
    </section>

    {/* ── The Problem ── */}
    <section className="border-t-4 border-black bg-[#f5f5f5]">
      <div className="max-w-7xl mx-auto px-8 py-24">
        <motion.h2
          {...fadeUp()}
          className="text-5xl font-display uppercase tracking-tighter mb-4"
        >
          Why Fairlance?
        </motion.h2>
        <motion.p
          {...fadeUp(0.05)}
          className="font-mono text-xs uppercase opacity-50 mb-16 max-w-xl"
        >
          Traditional freelance platforms make money by keeping both sides in the dark. We don't.
        </motion.p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {PROBLEMS.map((col) => (
            <motion.div
              key={col.platform}
              {...fadeUp(0.1)}
              className={`border-4 border-black p-8 ${col.highlight ? 'bg-vibrant-coral text-white shadow-brutal' : 'bg-white'}`}
            >
              <div className={`font-display uppercase text-2xl tracking-tighter mb-6 ${col.highlight ? 'text-white' : 'text-black'}`}>
                {col.platform}
              </div>
              <ul className="space-y-4">
                {col.points.map((pt) => (
                  <li key={pt} className="flex items-start gap-3 font-mono text-xs uppercase">
                    <span className={`mt-0.5 text-lg leading-none ${col.highlight ? 'text-white' : 'text-vibrant-coral'}`}>
                      {col.highlight ? '✓' : '✗'}
                    </span>
                    <span className={col.highlight ? 'text-white' : 'opacity-60'}>{pt}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </div>
    </section>

    {/* ── How It Works Steps ── */}
    <section className="border-t-4 border-black bg-white">
      <div className="max-w-7xl mx-auto px-8 py-24">
        <motion.h2
          {...fadeUp()}
          className="text-5xl font-display uppercase tracking-tighter mb-20"
        >
          Three Steps to Done
        </motion.h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-0 border-4 border-black">
          {STEPS.map((step, i) => {
            const Icon = step.icon;
            return (
              <motion.div
                key={step.number}
                {...fadeUp(i * 0.08)}
                className={`p-10 flex flex-col gap-6 ${i < STEPS.length - 1 ? 'border-b-4 md:border-b-0 md:border-r-4 border-black' : ''}`}
              >
                <div className="flex items-start justify-between">
                  <span className="font-display text-7xl leading-none tracking-tighter opacity-10">
                    {step.number}
                  </span>
                  <div className="w-12 h-12 bg-vibrant-coral border-2 border-black flex items-center justify-center shadow-brutal-sm">
                    <Icon size={20} strokeWidth={2.5} className="text-white" />
                  </div>
                </div>
                <div>
                  <div className="font-display uppercase text-2xl tracking-tighter mb-3">{step.title}</div>
                  <p className="font-mono text-xs uppercase opacity-60 leading-relaxed">{step.body}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>

    {/* ── Features ── */}
    <section className="border-t-4 border-black bg-[#f5f5f5]">
      <div className="max-w-7xl mx-auto px-8 py-24">
        <motion.h2
          {...fadeUp()}
          className="text-5xl font-display uppercase tracking-tighter mb-4"
        >
          Platform Features
        </motion.h2>
        <motion.p
          {...fadeUp(0.05)}
          className="font-mono text-xs uppercase opacity-50 mb-16"
        >
          Everything built to remove friction and information asymmetry.
        </motion.p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {FEATURES.map((feat, i) => {
            const Icon = feat.icon;
            return (
              <motion.div
                key={feat.title}
                {...fadeUp(i * 0.06)}
                className="bg-white border-4 border-black p-8 shadow-brutal-sm hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all"
              >
                <div className="w-10 h-10 bg-black flex items-center justify-center mb-6">
                  <Icon size={18} strokeWidth={2.5} className="text-vibrant-coral" />
                </div>
                <div className="font-display uppercase text-xl tracking-tighter mb-3">{feat.title}</div>
                <p className="font-mono text-xs uppercase opacity-60 leading-relaxed">{feat.body}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>

    {/* ── Who It's For ── */}
    <section className="border-t-4 border-black bg-white">
      <div className="max-w-7xl mx-auto px-8 py-24">
        <motion.h2
          {...fadeUp()}
          className="text-5xl font-display uppercase tracking-tighter mb-20"
        >
          Built for Both Sides
        </motion.h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {FOR_WHOM.map((side, i) => (
            <motion.div
              key={side.role}
              {...fadeUp(i * 0.08)}
              className={`border-4 border-black p-10 shadow-brutal ${side.bg}`}
            >
              <div className={`font-mono text-xs uppercase tracking-widest mb-2 ${side.textColor} opacity-60`}>
                {side.role}
              </div>
              <div className={`font-display uppercase text-4xl tracking-tighter mb-8 ${side.textColor}`}>
                {side.tagline}
              </div>
              <ul className="space-y-3 mb-10">
                {side.points.map((pt) => (
                  <li key={pt} className={`flex items-start gap-3 font-mono text-xs uppercase ${side.textColor}`}>
                    <span className="mt-0.5">→</span>
                    <span className="opacity-80">{pt}</span>
                  </li>
                ))}
              </ul>
              <Link
                to={side.to}
                className={`inline-flex items-center gap-2 px-6 py-3 font-display uppercase text-sm border-2 shadow-brutal-sm hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all
                  ${side.highlight || side.bg === 'bg-vibrant-coral'
                    ? 'bg-white text-black border-white'
                    : 'bg-black text-white border-black'}`}
              >
                {side.cta} <ArrowRight size={14} strokeWidth={3} />
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>

    {/* ── CTA Banner ── */}
    <section className="border-t-4 border-black bg-black text-white">
      <div className="max-w-7xl mx-auto px-8 py-24 flex flex-col md:flex-row items-center justify-between gap-8">
        <motion.div {...fadeUp()}>
          <div className="font-display uppercase text-5xl md:text-6xl tracking-tighter leading-tight">
            Ready to work<br />
            <span className="text-vibrant-coral">fairly?</span>
          </div>
        </motion.div>
        <motion.div {...fadeUp(0.1)} className="flex flex-col sm:flex-row gap-4">
          <Link
            to="/auth"
            className="px-8 py-4 bg-vibrant-coral text-white font-display uppercase border-2 border-vibrant-coral shadow-[4px_4px_0px_0px_rgba(255,255,255,0.3)] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all flex items-center gap-2"
          >
            Create Account <ArrowRight size={16} strokeWidth={3} />
          </Link>
          <Link
            to="/"
            className="px-8 py-4 bg-transparent text-white font-display uppercase border-2 border-white/40 hover:border-white transition-all flex items-center gap-2"
          >
            Explore Listings
          </Link>
        </motion.div>
      </div>
    </section>

  </main>
);
