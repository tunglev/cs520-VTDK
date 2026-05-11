import { useState, type FormEvent } from 'react';
import { CheckCircle, XCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Offer } from '../models/marketplace/Marketplace';

interface OfferCardProps {
  offer: Offer;
  userRole: 'freelancer' | 'customer';
  onAccept: (o: Offer) => void | Promise<void>;
  onReject: (o: Offer) => void | Promise<void>;
  onCounter: (o: Offer, newAmount: number) => void | Promise<void>;
}

export const OfferCard = ({
  offer,
  userRole,
  onAccept,
  onReject,
  onCounter,
}: OfferCardProps) => {
  const [isCountering, setIsCountering] = useState(false);
  const [counterAmount, setCounterAmount] = useState(String(offer.amount));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  // Only show action buttons if the current user didn't make this offer
  const canTakeAction = offer.proposedBy !== userRole;

  const handleCounterSubmit = async (e: FormEvent) => {
    e.preventDefault();

    const parsedAmount = Number(counterAmount);
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setError('Enter a valid counter amount');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      await onCounter(offer, parsedAmount);
      setSent(true);
      setIsCountering(false);
    } catch (err) {
      console.error(err);
      setError('Failed to send counter');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <motion.div layout className="border-4 border-black p-5 bg-white shadow-brutal-sm">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex-1">
          <div className="font-display uppercase text-xl tracking-tighter">${offer.amount}</div>
          <div className="font-mono text-[10px] uppercase opacity-50 mt-1">
            {offer.scope ?? 'No scope provided'} · {new Date(offer.createdAt).toLocaleDateString()}
          </div>
          <div className="font-mono text-[10px] uppercase opacity-50 mt-1">
            Proposed by: {offer.proposedBy === 'customer' ? 'Customer' : 'Freelancer'}
          </div>
          {offer.expiresAt && (
            <div className="font-mono text-[10px] uppercase text-vibrant-coral mt-1">
              Expires {new Date(offer.expiresAt).toLocaleDateString()}
            </div>
          )}
        </div>

        {canTakeAction ? (
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setIsCountering(prev => !prev)}
              className="px-4 py-2 border-2 border-black font-display uppercase text-sm hover:bg-black hover:text-white transition-colors flex items-center gap-2"
            >
              Counter
            </button>
            <button
              onClick={() => onReject(offer)}
              className="px-4 py-2 border-2 border-black font-display uppercase text-sm hover:bg-black hover:text-white transition-colors flex items-center gap-2"
            >
              <XCircle size={14} /> Reject
            </button>
            <button
              onClick={() => onAccept(offer)}
              className="px-4 py-2 bg-vibrant-coral text-white border-2 border-black font-display uppercase text-sm hover:translate-x-0.5 hover:translate-y-0.5 transition-transform shadow-brutal-sm flex items-center gap-2"
            >
              <CheckCircle size={14} /> Accept
            </button>
          </div>
        ) : (
          <div className="text-sm font-mono uppercase text-opacity-50 text-black">
            (Waiting for Response)
          </div>
        )}
      </div>

      <AnimatePresence>
        {isCountering && canTakeAction && (
          <motion.form
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            onSubmit={handleCounterSubmit}
            className="mt-4 border-2 border-black bg-bone p-4 space-y-3"
          >
            <div className="flex items-center justify-between gap-4">
              <label className="font-mono text-[10px] uppercase tracking-widest opacity-60">
                Counter Amount
              </label>
              <button
                type="button"
                onClick={() => setIsCountering(false)}
                className="font-mono text-[10px] uppercase tracking-widest opacity-50 hover:opacity-100"
              >
                Cancel
              </button>
            </div>
            <input
              type="number"
              min="0"
              step="0.01"
              value={counterAmount}
              onChange={e => setCounterAmount(e.target.value)}
              className="w-full border-2 border-black bg-white px-3 py-2 font-mono text-sm focus:outline-none focus:border-vibrant-coral"
              placeholder="Enter revised amount"
            />
            {error && (
              <div className="font-mono text-[10px] uppercase tracking-widest text-vibrant-coral">
                {error}
              </div>
            )}
            <button
              type="submit"
              disabled={submitting}
              className="w-full px-4 py-2 bg-shadow-grey text-white border-2 border-black font-display uppercase text-sm shadow-brutal-sm hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all disabled:opacity-50"
            >
              {submitting ? 'Sending...' : 'Send Counter'}
            </button>
          </motion.form>
        )}
      </AnimatePresence>

      {sent && !isCountering && (
        <div className="mt-3 font-mono text-[10px] uppercase tracking-widest text-vibrant-coral">
          Counter sent. The offer amount has been updated.
        </div>
      )}
    </motion.div>
  );
};
