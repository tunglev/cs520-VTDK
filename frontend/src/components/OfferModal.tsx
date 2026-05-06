import React, { useState } from 'react';
import { CustomerUser } from '../models/users/UserSubclasses';
import { getPricingReport } from '../data/mockData';
import { X, Check } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface OfferModalProps {
  listing: any;
  user: any; // Ideally CustomerUser, but type checks will be fine
  onClose: () => void;
}

export function OfferModal({ listing, user, onClose }: OfferModalProps) {
  const [amount, setAmount] = useState<string>('');
  const [scope, setScope] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Market comparator data
  const report = getPricingReport(listing);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount) return;

    if (user && user instanceof CustomerUser) {
      try {
        setLoading(true);
        await user.placeOffer({
          listingId: listing.id.toString(), // The mock is returning number for listing.id, but placeOffer takes string. Wait, we should use listing.id.toString() or stringify. Let's see later.
          amount: parseFloat(amount),
          scope: scope,
        });
        setSuccess(true);
      } catch (err) {
        console.error(err);
        alert('Failed to place offer');
      } finally {
        setLoading(false);
      }
    } else {
      alert('You must be logged in as a customer to place an offer.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white border-4 border-black shadow-brutal w-full max-w-2xl max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between p-6 border-b-4 border-black bg-vibrant-coral">
          <h2 className="text-2xl font-display text-white uppercase tracking-tighter">Make an Offer</h2>
          <button onClick={onClose} className="p-2 hover:bg-black/10 text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="p-8">
          {success ? (
            <div className="text-center py-12 space-y-6">
              <div className="w-20 h-20 bg-vibrant-coral text-white border-4 border-black shadow-brutal mx-auto flex items-center justify-center">
                <Check size={40} />
              </div>
              <div>
                <h3 className="text-3xl font-display uppercase tracking-tighter mb-2">Offer Sent!</h3>
                <p className="font-mono text-sm opacity-60">
                  Your offer has been sent to {listing.name}. They will review it shortly.
                </p>
              </div>
              <button
                onClick={onClose}
                className="px-8 py-3 bg-white border-2 border-black font-display uppercase text-sm shadow-brutal-sm hover:translate-y-0.5 hover:shadow-none transition-all"
              >
                Close
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block font-mono text-xs uppercase mb-2">Offer Amount ($/hr or flat)</label>
                  <input
                    type="number"
                    required
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full p-3 border-2 border-black font-mono text-lg focus:outline-none focus:ring-2 focus:ring-vibrant-coral/20"
                    placeholder="e.g. 150"
                  />
                </div>
                <div>
                  <label className="block font-mono text-xs uppercase mb-2">Scope of Work (Optional)</label>
                  <textarea
                    value={scope}
                    onChange={(e) => setScope(e.target.value)}
                    rows={4}
                    className="w-full p-3 border-2 border-black font-mono text-sm focus:outline-none focus:ring-2 focus:ring-vibrant-coral/20 resize-none"
                    placeholder="Describe the project scope..."
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 bg-vibrant-coral text-white font-display uppercase text-lg border-4 border-black shadow-brutal hover:translate-y-1 hover:shadow-none transition-all disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-brutal"
                >
                  {loading ? 'Sending...' : 'Submit Offer'}
                </button>
              </form>

              <div className="bg-shadow-grey text-white border-4 border-black p-6 flex flex-col justify-center">
                <div className="font-mono text-[10px] uppercase opacity-60 mb-2">Market Comparator</div>
                <div className="font-display text-xl uppercase tracking-tighter mb-4">
                  Market Context
                </div>
                <div className="space-y-4 text-sm font-mono uppercase">
                  <div className="flex justify-between items-center border-b border-white/20 pb-2">
                    <span className="opacity-70">Market Avg</span>
                    <span className="font-bold text-vibrant-coral">${report.marketAvg}</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-white/20 pb-2">
                    <span className="opacity-70">Market Median</span>
                    <span className="font-bold">${report.marketMedian}</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-white/20 pb-2">
                    <span className="opacity-70">This Freelancer</span>
                    <span className="font-bold">${listing.price}</span>
                  </div>
                </div>
                <p className="font-mono text-[10px] opacity-60 mt-6 leading-relaxed">
                  Based on {report.sampleSize} recent transactions in the {listing.role} category.
                </p>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
