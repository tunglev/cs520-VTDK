import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Star, MapPin, Clock, Briefcase, BarChart2, CheckCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';
import { FREELANCER_PROFILES, getPricingReport } from '../data/mockData';
import { LISTINGS } from '../data/mockData';
import { PricingReportModal } from '../components/PricingReportModal';

export const FreelancerProfile = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [reportOpen, setReportOpen] = useState(false);

  const listing = LISTINGS.find(l => l.id === Number(id));
  if (!listing) return null;

  const profile = FREELANCER_PROFILES[listing.id];
  const report = getPricingReport(listing);

  if (!profile) return null;

  return (
    <main className="flex-1 max-w-7xl mx-auto w-full px-8 py-20">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
      >
        {/* Back nav */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 font-mono text-xs uppercase mb-10 hover:text-vibrant-coral transition-colors group"
        >
          <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
          Back to search
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">

          {/* ── Left column ─────────────────────────────────────── */}
          <div className="lg:col-span-2 space-y-10">

            {/* Identity */}
            <div className="flex items-start gap-6">
              <div className={cn(
                "w-24 h-24 border-4 border-black shadow-brutal flex items-center justify-center text-4xl font-display shrink-0",
                listing.color
              )}>
                {listing.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-5xl font-display uppercase tracking-tighter leading-none mb-2">
                  {listing.name}
                </h1>
                <p className="font-mono text-sm uppercase opacity-70 mb-4">{listing.role}</p>
                <div className="flex flex-wrap items-center gap-4 text-xs font-mono uppercase">
                  <div className="flex items-center gap-1">
                    <Star size={12} className="fill-current" />
                    <span className="font-bold">{listing.rating}</span>
                    <span className="opacity-60">({listing.reviews} reviews)</span>
                  </div>
                  <div className="flex items-center gap-1 opacity-70">
                    <MapPin size={12} /> {listing.location}
                  </div>
                  <div className="flex items-center gap-1 opacity-70">
                    <Clock size={12} /> Responds {profile.responseTime}
                  </div>
                  <div className="flex items-center gap-1 opacity-70">
                    <Briefcase size={12} /> {listing.completedJobs} jobs completed
                  </div>
                </div>
              </div>
            </div>

            {/* Bio */}
            <div className="border-t-4 border-black pt-8">
              <h2 className="font-mono text-[10px] uppercase tracking-widest mb-4 opacity-60">About</h2>
              <p className="font-mono text-sm leading-relaxed">{profile.bio}</p>
            </div>

            {/* Skills */}
            <div>
              <h2 className="font-mono text-[10px] uppercase tracking-widest mb-4 opacity-60">Skills</h2>
              <div className="flex flex-wrap gap-3">
                {listing.tags.map(tag => (
                  <span
                    key={tag}
                    className="px-3 py-2 bg-white border-2 border-black text-[11px] font-mono uppercase shadow-brutal-sm"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Portfolio */}
            <div>
              <h2 className="font-mono text-[10px] uppercase tracking-widest mb-4 opacity-60">Recent Work</h2>
              <div className="space-y-3">
                {profile.portfolioItems.map((item) => (
                  <div
                    key={item.title}
                    className="flex items-start gap-4 p-4 bg-white border-2 border-black shadow-brutal-sm"
                  >
                    <div className="text-2xl shrink-0">{item.emoji}</div>
                    <div>
                      <div className="font-display uppercase text-sm">{item.title}</div>
                      <div className="font-mono text-xs opacity-60 mt-1">{item.description}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Right column ─────────────────────────────────────── */}
          <div className="space-y-6">

            {/* Pricing report CTA */}
            <div className="bg-shadow-grey text-white border-4 border-black shadow-brutal p-6">
              <div className="font-mono text-[10px] uppercase opacity-60 mb-2">Market Comparator</div>
              <div className="font-display text-xl uppercase tracking-tighter mb-3">
                Is ${listing.price}/hr a fair rate?
              </div>
              <p className="font-mono text-xs opacity-70 mb-6 leading-relaxed">
                See how {listing.name.split(' ')[0]}'s pricing stacks up against {report.sampleSize} completed
                transactions in the {listing.role} market.
              </p>
              <div className="flex items-center justify-between text-xs font-mono uppercase mb-6">
                <div>
                  <div className="opacity-60">Market Avg</div>
                  <div className="font-bold text-vibrant-coral">${report.marketAvg}/hr</div>
                </div>
                <div className="text-center">
                  <div className="opacity-60">Median</div>
                  <div className="font-bold">${report.marketMedian}/hr</div>
                </div>
                <div className="text-right">
                  <div className="opacity-60">This Freelancer</div>
                  <div className="font-bold">${listing.price}/hr</div>
                </div>
              </div>
              <button
                onClick={() => setReportOpen(true)}
                className="w-full py-4 bg-vibrant-coral text-white font-display uppercase text-sm border-2 border-white/30 flex items-center justify-center gap-3 hover:bg-rosy-copper transition-colors"
              >
                <BarChart2 size={16} />
                View Full Pricing Report
              </button>
            </div>

            {/* Pricing models */}
            <div className="border-4 border-black bg-white shadow-brutal p-6">
              <h2 className="font-mono text-[10px] uppercase tracking-widest mb-5 opacity-60">Service Options</h2>
              <div className="space-y-4">
                {profile.pricingModels.map((model, i) => (
                  <div key={i} className="border-2 border-black p-4">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="font-display uppercase text-base tracking-tight leading-tight">
                        ${model.price}
                        <span className="text-xs opacity-60 ml-1">{model.unit}</span>
                      </div>
                      <span className={cn(
                        "px-2 py-0.5 text-[9px] font-mono uppercase border border-black shrink-0",
                        model.type === 'fixed' && 'bg-vibrant-coral text-white',
                        model.type === 'hourly' && 'bg-shadow-grey text-white',
                        model.type === 'project' && 'bg-bone',
                      )}>
                        {model.type}
                      </span>
                    </div>
                    <p className="font-mono text-[11px] opacity-60 leading-snug">{model.description}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Trust signals */}
            <div className="border-2 border-black/20 p-5 space-y-3">
              {[
                `Member since ${profile.memberSince}`,
                `${listing.completedJobs} jobs completed`,
                'Identity verified',
                'Anonymized pricing data',
              ].map(item => (
                <div key={item} className="flex items-center gap-3 font-mono text-xs uppercase opacity-70">
                  <CheckCircle size={14} className="text-vibrant-coral shrink-0" />
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      {reportOpen && (
        <PricingReportModal
          report={report}
          listing={listing}
          onClose={() => setReportOpen(false)}
        />
      )}
    </main>
  );
};
