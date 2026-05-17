import { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Star, MapPin, Clock, Briefcase, BarChart2, CheckCircle, Eye, Trash2, MessageSquare } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';
import { getPricingReport } from '../data/mockData';
import { PricingReportModal } from '../components/PricingReportModal';
import { OfferModal } from '../components/OfferModal';
import { ConfirmDeleteModal } from '../components/ConfirmDeleteModal';
import { useAuth } from '../hooks/useAuth';
import { CustomerUser } from '../models/users/UserSubclasses';
import { supabase } from '../lib/supabaseClient';
import type { Listing, PricingModel, PricingReport } from '../types';
import { AnimatePresence } from 'motion/react';

interface ProfileDetails {
  bio: string;
  pricingModels: PricingModel[];
  responseTime: string;
  memberSince: string;
  portfolioItems: Array<{ emoji: string; title: string; description: string }>;
}

export const FreelancerProfile = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isPreview = searchParams.get('preview') === 'true';
  const { user } = useAuth();
  const [reportOpen, setReportOpen] = useState(false);
  const [offerOpen, setOfferOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [listing, setListing] = useState<Listing | null>(null);
  const [profile, setProfile] = useState<ProfileDetails | null>(null);
  const [report, setReport] = useState<PricingReport | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchListing = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const { data, error } = await supabase.functions.invoke(`get-listings?id=${encodeURIComponent(id)}`, {
          method: 'GET',
        });
        if (error) throw error;
        const item = data ?? null;

        if (!item) {
          setListing(null);
          setProfile(null);
          return;
        }

        const freelancerId = item.freelancer_id;

        const { data: ratingData } = await supabase
          .from('freelancer_rating_aggregates')
          .select('avg_overall, review_count')
          .eq('freelancer_id', freelancerId)
          .single();

        const colors = ['bg-vibrant-coral', 'bg-rosy-copper', 'bg-white'];
        const mappedListing: Listing = {
          id: item.id,
          name: item.users?.full_name || item.users?.business_name || item.title || 'Unknown Talent',
          role: item.title || item.categories?.name || 'Freelancer',
          category: item.categories?.name || item.category_id || 'general',
          price: item.pricing_models?.[0]?.base_price || 0,
          rating: ratingData?.avg_overall ?? 0,
          reviews: ratingData?.review_count ?? 0,
          location: item.users?.service_area || item.users?.zip_code || 'Remote',
          tags: item.categories?.name ? [item.categories.name] : [],
          color: colors[Math.floor(Math.random() * colors.length)],
          completedJobs: 0,
          freelancerUserId: freelancerId,
        };

        const pricingModels: PricingModel[] = (item.pricing_models ?? []).map((model: any) => ({
          type: model.strategy_type,
          price: model.base_price,
          unit: model.unit || (model.strategy_type === 'hourly' ? '/hr' : ''),
          description: model.strategy_type === 'hourly'
            ? 'Flexible hourly engagement for iterative work.'
            : model.strategy_type === 'project'
            ? 'Project-based pricing for clear deliverables.'
            : 'Fixed pricing for defined scope.'
        }));

        const createdAt = item.users?.created_at ? new Date(item.users.created_at) : null;
        const profileDetails: ProfileDetails = {
          bio: item.users?.summary || item.description || 'Freelancer profile details coming soon.',
          pricingModels,
          responseTime: 'within 24 hours',
          memberSince: createdAt ? createdAt.getFullYear().toString() : '2024',
          portfolioItems: [
            {
              emoji: '📌',
              title: 'Project Highlights',
              description: item.description || 'Project details will be shared after first contact.',
            },
          ],
        };

        setListing(mappedListing);
        setProfile(profileDetails);

        const mockReport = getPricingReport(mappedListing);

        try {
          const { data: reportData, error: reportError } = await supabase.functions.invoke('generate-pricing-report', {
            method: 'POST',
            body: {
              category_id: item.category_id,
              location: item.users?.service_area || '',
              rating: ratingData?.avg_overall ?? 4.5,
            },
          });

          if (reportData && !reportData.error) {
            const scatterBase = (reportData.scatterData?.length > 0 ? reportData.scatterData : mockReport.scatterData)
              .map((p: any) => p.name === mappedListing.role ? { ...p, isCurrent: true } : p);
            const hasCurrentFreelancer = scatterBase.some((p: any) => p.isCurrent);
            if (!hasCurrentFreelancer) {
              scatterBase.push({
                name: mappedListing.name,
                price: mappedListing.price,
                rating: mappedListing.rating,
                reviews: mappedListing.reviews,
                isCurrent: true,
              });
            }
            const scatterWithCurrent = scatterBase;

            const allPrices = scatterWithCurrent.map((p: any) => p.price).sort((a: number, b: number) => a - b);
            const below = allPrices.filter((p: number) => p < mappedListing.price).length;
            const percentile = allPrices.length > 0 ? Math.round((below / allPrices.length) * 100) : mockReport.percentile;

            setReport({
              ...mockReport,
              marketAvg: reportData.marketAvg ?? mockReport.marketAvg,
              marketMedian: reportData.marketMedian ?? mockReport.marketMedian,
              marketMin: reportData.marketMin ?? mockReport.marketMin,
              marketMax: reportData.marketMax ?? mockReport.marketMax,
              sampleSize: reportData.transactionCount ?? mockReport.sampleSize,
              priceDistribution: reportData.priceDistribution?.length > 0 ? reportData.priceDistribution : mockReport.priceDistribution,
              scatterData: scatterWithCurrent,
              percentile,
            });
          } else {
            setReport(mockReport);
          }
        } catch {
          setReport(mockReport);
        }
      } catch (err) {
        console.error('Error loading freelancer listing:', err);
        setListing(null);
        setProfile(null);
      } finally {
        setLoading(false);
      }
    };

    fetchListing();
  }, [id]);

  const handleDeleteConfirm = async () => {
    if (!id) return;
    setDeleting(true);
    try {
      const { error } = await supabase.from('listings').delete().eq('id', id);
      if (error) throw error;
      navigate('/dashboard');
    } catch (e) { console.error(e); } finally {
      setDeleting(false);
      setDeleteOpen(false);
    }
  };

  if (loading) return null;
  if (!listing || !profile) return null;

  return (
    <>
      {isPreview && (
        <div className="w-full bg-shadow-grey text-white border-b-4 border-black px-8 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-widest">
            <Eye size={14} />
            Preview — This is how customers see your listing
          </div>
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-widest hover:text-vibrant-coral transition-colors group"
          >
            <ArrowLeft size={12} className="group-hover:-translate-x-1 transition-transform" />
            Back to Dashboard
          </button>
        </div>
      )}
    <main className="flex-1 max-w-7xl mx-auto w-full px-8 py-20">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
      >
        {/* Back nav */}
        <button
          onClick={() => isPreview ? navigate('/dashboard') : navigate(-1)}
          className="flex items-center gap-2 font-mono text-xs uppercase mb-10 hover:text-vibrant-coral transition-colors group"
        >
          <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
          {isPreview ? 'Back to Dashboard' : 'Back to search'}
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

            {/* Delete Listing CTA (preview mode only) */}
            {isPreview && (
              <div className="border-4 border-black bg-white shadow-brutal p-6">
                <h2 className="font-display text-xl uppercase tracking-tighter mb-2">Manage Listing</h2>
                <p className="font-mono text-xs opacity-70 mb-5 leading-relaxed">
                  Permanently remove this listing. This action cannot be undone.
                </p>
                <button
                  onClick={() => setDeleteOpen(true)}
                  className="w-full py-3 bg-rosy-copper text-white border-2 border-black font-display uppercase text-sm flex items-center justify-center gap-2 shadow-brutal-sm hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all"
                >
                  <Trash2 size={14} /> Delete Listing
                </button>
              </div>
            )}

            {/* Make an Offer + Message CTA */}
            {user instanceof CustomerUser && (
              <div className="border-4 border-black bg-white shadow-brutal p-6 space-y-3">
                <h2 className="font-display text-2xl uppercase tracking-tighter mb-2">Ready to work?</h2>
                <p className="font-mono text-xs opacity-70 mb-4 leading-relaxed">
                  Propose a custom rate and scope, or message the freelancer first with questions.
                </p>
                <button
                  onClick={() => setOfferOpen(true)}
                  className="w-full py-4 bg-vibrant-coral text-white font-display uppercase text-lg border-2 border-black hover:translate-y-1 hover:shadow-none transition-all shadow-brutal-sm"
                >
                  Make an Offer
                </button>
                <button
                  id="message-freelancer-btn"
                  onClick={() => navigate(`/messages?with=${listing.freelancerUserId ?? id}`)}
                  className="w-full py-3 bg-white border-2 border-black font-display uppercase text-sm flex items-center justify-center gap-2 shadow-brutal-sm hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all"
                >
                  <MessageSquare size={14} /> Message
                </button>
              </div>
            )}

            {/* Pricing report CTA */}
            <div className="bg-shadow-grey text-white border-4 border-black shadow-brutal p-6">
              <div className="font-mono text-[10px] uppercase opacity-60 mb-2">Market Comparator</div>
              <div className="font-display text-xl uppercase tracking-tighter mb-3">
                Is ${listing.price}/hr a fair rate?
              </div>
              <p className="font-mono text-xs opacity-70 mb-6 leading-relaxed">
                See how {listing.name.split(' ')[0]}'s pricing stacks up against {report?.sampleSize ?? 0} completed
                transactions in the {listing.role} market.
              </p>
              <div className="flex items-center justify-between text-xs font-mono uppercase mb-6">
                <div>
                  <div className="opacity-60">Market Avg</div>
                  <div className="font-bold text-vibrant-coral">${report?.marketAvg ?? 0}/hr</div>
                </div>
                <div className="text-center">
                  <div className="opacity-60">Median</div>
                  <div className="font-bold">${report?.marketMedian ?? 0}/hr</div>
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

      {reportOpen && report && (
        <PricingReportModal
          report={report}
          listing={listing}
          onClose={() => setReportOpen(false)}
        />
      )}

      {offerOpen && (
        <OfferModal
          listing={listing}
          user={user}
          onClose={() => setOfferOpen(false)}
        />
      )}

      <AnimatePresence>
        {deleteOpen && (
          <ConfirmDeleteModal
            title="Delete Listing"
            message={`Are you sure you want to delete "${listing.name}"? This cannot be undone.`}
            onConfirm={handleDeleteConfirm}
            onCancel={() => setDeleteOpen(false)}
            loading={deleting}
          />
        )}
      </AnimatePresence>
    </main>
    </>
  );
};
