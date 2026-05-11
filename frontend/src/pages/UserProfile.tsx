interface UserProfileProps {
  user: any;
  onLogout: () => void;
  onGoToDashboard: () => void;
  onRoleChange: (role: string, updates?: Record<string, unknown>) => void;
}

import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Offer, Transaction } from '../models/marketplace/Marketplace';
import { cn } from '../lib/utils';
import { OfferCard } from '../components/OfferCard';

export const UserProfile = ({ user, onLogout, onGoToDashboard, onRoleChange }: UserProfileProps) => {
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [enrollLoading, setEnrollLoading] = useState(false);
  const [error, setError] = useState('');
  const [hourlyRate, setHourlyRate] = useState(user.hourlyRate || '');
  const [skills, setSkills] = useState(user.skills ? user.skills.join(', ') : '');

  const isFreelancer = user.role?.toLowerCase() === 'freelancer';
  const hasFreelancerProfile = user.hourlyRate != null && user.skills?.length > 0;
  const hasFreelancerEnrollment = Boolean(user.freelancerEnrolled) || hasFreelancerProfile;
  const [offerHistory, setOfferHistory] = useState<Offer[]>([]);
  const [transactionHistory, setTransactionHistory] = useState<Transaction[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState('');

  useEffect(() => {
    const loadHistory = async () => {
      if (!user.id || isFreelancer) {
        setOfferHistory([]);
        setTransactionHistory([]);
        setHistoryError('');
        setHistoryLoading(false);
        return;
      }

      setHistoryLoading(true);
      setHistoryError('');

      try {
        const [{ data: offerRows, error: offerError }, { data: transactionRows, error: transactionError }] = await Promise.all([
          supabase
            .from('offers')
            .select('*, listings(title)')
            .eq('customer_id', user.id)
            .order('created_at', { ascending: false }),
          supabase
            .from('transactions')
            .select('*')
            .eq('customer_id', user.id)
            .order('completed_at', { ascending: false }),
        ]);

        if (offerError) throw offerError;
        if (transactionError) throw transactionError;

        setOfferHistory((offerRows ?? []).map((row: Record<string, unknown>) => Offer.fromRow(row)));
        setTransactionHistory((transactionRows ?? []).map((row: Record<string, unknown>) => Transaction.fromRow(row)));
      } catch (err: any) {
        setHistoryError(err.message ?? 'Failed to load your offer history');
      } finally {
        setHistoryLoading(false);
      }
    };

    loadHistory();
  }, [user.id, isFreelancer]);

  const pendingOfferCount = offerHistory.filter(offer => offer.status === 'pending').length;
  const completedTransactionCount = transactionHistory.length;

  const handleAccept = async (offer: Offer) => {
    try {
      await offer.accept();
      // Remove from pending offers since it's now active/completed
      setOfferHistory(prev => prev.filter(o => o.id !== offer.id));
    } catch (e: any) { 
      console.error(e); 
      setError(e.message || 'Failed to accept offer');
    }
  };

  const handleReject = async (offer: Offer) => {
    try {
      await offer.reject();
      // Remove from pending offers
      setOfferHistory(prev => prev.filter(o => o.id !== offer.id));
    } catch (e: any) { 
      console.error(e); 
      setError(e.message || 'Failed to reject offer');
    }
  };

  const handleCounter = async (offer: Offer, newAmount: number) => {
    try {
      await offer.counter(newAmount);
      // Wait for Supabase Realtime to update the record automatically, 
      // or optionally re-fetch local state
    } catch (e) {
      console.error(e);
      throw e;
    }
  };

  const handleRoleSwitch = async (newRole: 'customer' | 'freelancer') => {
    if (newRole === 'freelancer' && !hasFreelancerEnrollment && !isEnrolling) {
      setIsEnrolling(true);
      return;
    }

    setEnrollLoading(true);
    setError('');
    
    const parsedSkills = skills
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

    const authPayload: Record<string, unknown> = {
      role: newRole,
      freelancer_enrolled: hasFreelancerEnrollment || newRole === 'freelancer',
      hourly_rate: hourlyRate ? Number(hourlyRate) : user.hourlyRate ?? null,
      skills: parsedSkills.length ? parsedSkills : user.skills ?? [],
    };

    // Update Auth meta data
    const { error: authError } = await supabase.auth.updateUser({ data: authPayload });

    if (authError) {
      setError(authError.message);
      setEnrollLoading(false);
      return;
    }

    // Update public.users table
    let updateData: any = { role: newRole };

    // Fake update user metadata or other fields if desired
    // In a real app, you would save hourlyRate and skills to DB here.

    const { error: dbError } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', user.id);
      
    if (dbError) {
      setError(dbError.message);
      setEnrollLoading(false);
      return;
    }

    onRoleChange(newRole, {
      freelancerEnrolled: authPayload.freelancer_enrolled,
      hourlyRate: authPayload.hourly_rate,
      skills: authPayload.skills,
    });
    setEnrollLoading(false);
    setIsEnrolling(false);
    if (newRole === 'freelancer') {
      onGoToDashboard();
    }
  };

  return (
    <main className="flex-1 max-w-5xl mx-auto w-full px-8 py-20">
      <div className="bg-white border-4 border-black p-8 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]">
        <div className="flex justify-between items-start mb-12">
          <div className="flex gap-8 items-center">
            <div className="w-24 h-24 bg-vibrant-coral border-4 border-black flex items-center justify-center text-5xl font-display text-white">
              {user.name.charAt(0)}
            </div>
            <div>
              <h1 className="text-5xl font-display uppercase tracking-tighter mb-2">{user.name}</h1>
              <p className="font-mono text-sm uppercase opacity-70 mb-2">{user.email}</p>
              <div className="inline-block px-3 py-1 bg-shadow-grey text-white font-mono text-[10px] uppercase border-2 border-black">
                {user.role}
              </div>
              {user.location && (
                <div className="mt-2 font-mono text-xs uppercase">📍 {user.location}</div>
              )}
            </div>
          </div>
          <button 
            onClick={onLogout}
            className="px-6 py-2 bg-white text-black font-display uppercase text-sm border-2 border-black shadow-brutal-sm hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all"
          >
            Logout
          </button>
        </div>

        {user.bio && (
          <div className="mb-8 p-6 border-4 border-black bg-[#FFF0ed]">
            <h2 className="font-display uppercase text-sm tracking-widest mb-4">About Me</h2>
            <p className="font-serif text-sm opacity-80 leading-relaxed">{user.bio}</p>
          </div>
        )}

        {user.skills && user.skills.length > 0 && (
          <div className="mb-8">
            <h2 className="font-display uppercase text-sm tracking-widest mb-4">Skills</h2>
            <div className="flex flex-wrap gap-2">
              {user.skills.map((skill: string) => (
                <span key={skill} className="px-3 py-1 bg-white border-2 border-black font-mono text-[10px] uppercase">
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="border-4 border-black p-6 bg-rosy-copper text-white flex flex-col justify-between">
            <h2 className="font-display uppercase text-sm tracking-widest mb-4">Account Balance</h2>
            <div className="text-6xl font-display tracking-tighter">${user.balance || '0.00'}</div>
          </div>
          
          <div className="border-4 border-black p-6 bg-white flex flex-col justify-between">
            <h2 className="font-display uppercase text-sm tracking-widest mb-4">
              {isFreelancer ? 'Hourly Rate' : 'Current Projects'}
            </h2>
            {isFreelancer ? (
              <div className="text-6xl font-display tracking-tighter text-vibrant-coral">${user.hourlyRate || '0'}<span className="text-xl text-black">/hr</span></div>
            ) : (
              <div className="font-mono text-sm uppercase opacity-50 py-8 text-center border-2 border-dashed border-black/20">
                No active projects
              </div>
            )}
          </div>
        </div>

        {!isFreelancer && (
          <div className="border-4 border-black p-6 bg-white shadow-brutal-sm">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6">
              <div>
                <h2 className="font-display uppercase text-2xl tracking-tighter">Offer History</h2>
                <p className="font-mono text-xs uppercase opacity-60 mt-2">
                  Counter offers appear here as new pending offers.
                </p>
              </div>
              <div className="flex gap-4 font-mono text-[10px] uppercase tracking-widest">
                <div className="border-2 border-black px-3 py-2">
                  Pending {pendingOfferCount}
                </div>
                <div className="border-2 border-black px-3 py-2">
                  Completed {completedTransactionCount}
                </div>
              </div>
            </div>

            {historyLoading ? (
              <div className="font-mono text-sm uppercase opacity-40 animate-pulse">Loading history...</div>
            ) : historyError ? (
              <div className="font-mono text-xs uppercase text-vibrant-coral border-2 border-vibrant-coral px-4 py-3">
                {historyError}
              </div>
            ) : (
              <div className="grid gap-6 lg:grid-cols-2">
                <div className="space-y-3">
                  <h3 className="font-mono text-[10px] uppercase tracking-widest opacity-60">Offers</h3>
                  {offerHistory.length === 0 ? (
                    <div className="border-2 border-dashed border-black/20 p-6 text-center font-mono text-xs uppercase opacity-50">
                      No offers yet
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {offerHistory.map((offer) => (
                        <OfferCard
                          key={offer.id}
                          offer={offer}
                          userRole="customer"
                          onAccept={handleAccept}
                          onReject={handleReject}
                          onCounter={handleCounter}
                        />
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <h3 className="font-mono text-[10px] uppercase tracking-widest opacity-60">Complete</h3>
                  {transactionHistory.length === 0 ? (
                    <div className="border-2 border-dashed border-black/20 p-6 text-center font-mono text-xs uppercase opacity-50">
                      No completed transactions yet
                    </div>
                  ) : (
                    transactionHistory.map((transaction) => (
                      <div key={transaction.id} className="border-2 border-black p-4 bg-white">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="font-display uppercase text-lg tracking-tighter">${transaction.finalPrice}</div>
                            <div className="font-mono text-[10px] uppercase opacity-50 mt-1">
                              Completed {transaction.completedAt ? new Date(transaction.completedAt).toLocaleDateString() : 'Recently'}
                            </div>
                            <div className="font-mono text-[10px] uppercase opacity-60 mt-2">
                              Offer {transaction.offerId.slice(0, 8)}
                            </div>
                          </div>
                          <span className="px-2 py-1 border border-black font-mono text-[10px] uppercase bg-bone">
                            complete
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="mt-8 border-4 border-black p-6 bg-shadow-grey text-white">
          <h2 className="font-display uppercase text-lg tracking-widest mb-4">Mode Switch</h2>
          {error && <p className="text-vibrant-coral font-mono text-sm mb-4">{error}</p>}
          {isEnrolling ? (
            <div className="mt-4">
              <h3 className="font-display uppercase tracking-widest mb-4 text-vibrant-coral">Enroll as Freelancer</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="space-y-2">
                  <label className="font-display uppercase text-[10px] tracking-widest block">Hourly Rate (USD) *</label>
                  <input 
                    type="number" 
                    value={hourlyRate}
                    onChange={(e) => setHourlyRate(e.target.value)}
                    className="w-full p-4 border-2 border-black bg-white text-black focus:outline-none focus:border-vibrant-coral transition-colors font-mono text-sm"
                    placeholder="75"
                  />
                </div>
                <div className="space-y-2">
                  <label className="font-display uppercase text-[10px] tracking-widest block">Skills (comma separated) *</label>
                  <input 
                    type="text" 
                    value={skills}
                    onChange={(e) => setSkills(e.target.value)}
                    className="w-full p-4 border-2 border-black bg-white text-black focus:outline-none focus:border-vibrant-coral transition-colors font-mono text-sm"
                    placeholder="REACT, NODEJS, FIGMA"
                  />
                </div>
              </div>
              <div className="flex gap-4">
                <button 
                  onClick={() => handleRoleSwitch('freelancer')}
                  disabled={enrollLoading || !hourlyRate || !skills}
                  className="px-6 py-3 bg-vibrant-coral text-white font-display uppercase border-2 border-black shadow-none hover:-translate-x-1 hover:-translate-y-1 hover:shadow-brutal-sm transition-all disabled:opacity-50"
                >
                  {enrollLoading ? 'Enrolling...' : 'Complete Enrollment'}
                </button>
                <button 
                  onClick={() => setIsEnrolling(false)}
                  disabled={enrollLoading}
                  className="px-6 py-3 bg-white text-black font-display uppercase border-2 border-black shadow-none hover:-translate-x-1 hover:-translate-y-1 hover:shadow-brutal-sm transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : isFreelancer ? (
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <p className="font-mono uppercase text-sm opacity-80">You are currently in Freelancer mode.</p>
              <div className="flex gap-4">
                <button 
                  onClick={() => handleRoleSwitch('customer')}
                  disabled={enrollLoading}
                  className="px-6 py-3 bg-white text-black font-display uppercase border-2 border-black shadow-none hover:-translate-x-1 hover:-translate-y-1 hover:shadow-brutal-sm transition-all disabled:opacity-50"
                >
                  {enrollLoading ? 'Switching...' : 'Switch to Client'}
                </button>
                <button 
                  onClick={onGoToDashboard}
                  className="px-6 py-3 bg-vibrant-coral text-white font-display uppercase border-2 border-black shadow-none hover:-translate-x-1 hover:-translate-y-1 hover:shadow-brutal-sm transition-all"
                >
                  Go to Dashboard
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <p className="font-mono uppercase text-sm opacity-80">Looking to offer your services or switch back? Switch to freelancer mode.</p>
              <button 
                onClick={() => handleRoleSwitch('freelancer')}
                disabled={enrollLoading}
                className="px-6 py-3 bg-vibrant-coral text-white font-display uppercase border-2 border-black shadow-none hover:-translate-x-1 hover:-translate-y-1 hover:shadow-brutal-sm transition-all disabled:opacity-50"
              >
                {enrollLoading ? 'Switching...' : 'Switch to Freelancer'}
              </button>
            </div>
          )}
        </div>
      </div>
    </main>
  );
};
