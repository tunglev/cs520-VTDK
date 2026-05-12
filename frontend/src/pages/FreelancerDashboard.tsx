import { useState, useEffect, type ElementType, type FormEvent } from 'react';
import { Plus, ToggleLeft, ToggleRight, CheckCircle, XCircle, Clock, DollarSign, Briefcase, TrendingUp, Eye, Trash2, Pencil } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { ServiceListing, Offer } from '../models/marketplace/Marketplace';
import { ConfirmDeleteModal } from '../components/ConfirmDeleteModal';
import { cn } from '../lib/utils';

interface FreelancerDashboardProps {
  user: { id?: string; name: string; email: string };
  onLogout: () => void;
  onSwitchToClient: () => void;
}

// ── Stat Card ─────────────────────────────────────────────────
const StatCard = ({ icon: Icon, label, value, accent }: {
  icon: ElementType;
  label: string;
  value: string | number;
  accent?: boolean;
}) => (
  <div className={cn(
    'border-4 border-black p-6 flex flex-col gap-2',
    accent ? 'bg-vibrant-coral text-white' : 'bg-white'
  )}>
    <Icon size={20} className="opacity-60" />
    <div className="font-mono text-[10px] uppercase tracking-widest opacity-60">{label}</div>
    <div className="font-display text-3xl tracking-tighter">{value}</div>
  </div>
);

// ── Listing Card ──────────────────────────────────────────────
const ListingCard = ({
  listing,
  onToggle,
  onView,
  onEdit,
  onDelete,
}: {
  listing: ServiceListing;
  onToggle: (l: ServiceListing) => void | Promise<void>;
  onView: (l: ServiceListing) => void;
  onEdit: (l: ServiceListing) => void;
  onDelete: (l: ServiceListing) => void;
}) => (
  <motion.div
    layout
    className={cn(
      'border-4 border-black p-5 bg-white shadow-brutal-sm',
      !listing.isActive && 'opacity-50'
    )}
  >
    <div className="flex items-start justify-between gap-4">
      <div className="flex-1 min-w-0">
        <div className="font-display uppercase text-lg tracking-tighter leading-tight truncate">
          {listing.title}
        </div>
        <div className="font-mono text-[10px] uppercase opacity-50 mt-1">
          {listing.isActive ? 'Active' : 'Inactive'} · Created {new Date(listing.createdAt).toLocaleDateString()}
        </div>
        <p className="text-sm opacity-70 mt-2 line-clamp-2">{listing.description}</p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={() => onView(listing)}
          className="text-black/60 hover:text-black transition-colors"
          title="Preview listing"
        >
          <Eye size={20} />
        </button>
        <button
          onClick={() => onEdit(listing)}
          className="text-black/60 hover:text-black transition-colors"
          title="Edit listing"
        >
          <Pencil size={20} />
        </button>
        <button
          onClick={() => onDelete(listing)}
          className="text-rosy-copper/60 hover:text-rosy-copper transition-colors"
          title="Delete listing"
        >
          <Trash2 size={20} />
        </button>
        <button
          onClick={() => onToggle(listing)}
          className="text-black/60 hover:text-black transition-colors"
          title={listing.isActive ? 'Deactivate' : 'Activate'}
        >
          {listing.isActive
            ? <ToggleRight size={32} className="text-vibrant-coral" />
            : <ToggleLeft size={32} />}
        </button>
      </div>
    </div>
  </motion.div>
);

// ── Offer Card ────────────────────────────────────────────────
const OfferCard = ({
  offer,
  onAccept,
  onReject,
}: {
  offer: Offer;
  onAccept: (o: Offer) => void | Promise<void>;
  onReject: (o: Offer) => void | Promise<void>;
}) => (
  <motion.div layout className="border-4 border-black p-5 bg-white shadow-brutal-sm">
    <div className="flex items-center justify-between gap-4 flex-wrap">
      <div>
        <div className="font-display uppercase text-xl tracking-tighter">${offer.amount}</div>
        <div className="font-mono text-[10px] uppercase opacity-50 mt-1">
          {offer.scope ?? 'No scope provided'} · {new Date(offer.createdAt).toLocaleDateString()}
        </div>
        {offer.expiresAt && (
          <div className="font-mono text-[10px] uppercase text-vibrant-coral mt-1">
            Expires {new Date(offer.expiresAt).toLocaleDateString()}
          </div>
        )}
      </div>
      <div className="flex gap-2">
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
    </div>
  </motion.div>
);

// ── New Listing Modal ─────────────────────────────────────────
const NewListingModal = ({
  freelancerId,
  onCreated,
  onClose,
}: {
  freelancerId: string;
  onCreated: () => void;
  onClose: () => void;
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [basePrice, setBasePrice] = useState('');
  const [strategyType, setStrategyType] = useState<'fixed' | 'hourly' | 'project'>('hourly');
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    supabase.from('categories').select('id, name').order('name').then(({ data }) => {
      if (data) setCategories(data);
    });
  }, []);

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim()) { setError('Title is required'); return; }
    if (!categoryId) { setError('Please select a category'); return; }
    setLoading(true);
    setError('');
    try {
      const body: Record<string, unknown> = {
        category_id: categoryId,
        title: title.trim(),
        description: description.trim(),
      };
      if (basePrice) {
        body.pricing_models = [{ strategy_type: strategyType, base_price: Number(basePrice) }];
      }
      const { error: err } = await supabase.functions.invoke('manage-listing', { body });
      if (err) throw err;
      onCreated();
      onClose();
    } catch (err: any) {
      setError(err.message ?? 'Failed to create listing');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.form
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-bone border-4 border-black shadow-brutal w-full max-w-md p-8"
        onClick={e => e.stopPropagation()}
        onSubmit={handleCreate}
      >
        <div className="font-mono text-[10px] uppercase tracking-widest opacity-60 mb-1">New Listing</div>
        <h2 className="font-display uppercase text-2xl tracking-tighter mb-6">Create Service</h2>

        <div className="space-y-4">
          <div>
            <label className="font-display uppercase text-[10px] tracking-widest block mb-1">Title *</label>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Logo Design"
              className="w-full border-2 border-black bg-white px-4 py-3 font-mono text-sm focus:outline-none focus:border-vibrant-coral"
            />
          </div>
          <div>
            <label className="font-display uppercase text-[10px] tracking-widest block mb-1">Category *</label>
            <select
              value={categoryId}
              onChange={e => setCategoryId(e.target.value)}
              className="w-full border-2 border-black bg-white px-4 py-3 font-mono text-sm focus:outline-none focus:border-vibrant-coral"
            >
              <option value="">Select a category...</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="font-display uppercase text-[10px] tracking-widest block mb-1">Description</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={3}
              placeholder="Describe what you offer..."
              className="w-full border-2 border-black bg-white px-4 py-3 font-mono text-sm focus:outline-none focus:border-vibrant-coral resize-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-display uppercase text-[10px] tracking-widest block mb-1">Pricing Type</label>
              <select value={strategyType} onChange={e => setStrategyType(e.target.value as any)}
                className="w-full border-2 border-black bg-white px-3 py-3 font-mono text-sm focus:outline-none focus:border-vibrant-coral">
                <option value="hourly">Hourly</option>
                <option value="fixed">Fixed</option>
                <option value="project">Project</option>
              </select>
            </div>
            <div>
              <label className="font-display uppercase text-[10px] tracking-widest block mb-1">Base Price ($)</label>
              <input type="number" value={basePrice} onChange={e => setBasePrice(e.target.value)}
                placeholder="e.g. 50"
                className="w-full border-2 border-black bg-white px-3 py-3 font-mono text-sm focus:outline-none focus:border-vibrant-coral"
              />
            </div>
          </div>
        </div>

        {error && (
          <div className="mt-4 font-mono text-xs text-vibrant-coral border-2 border-vibrant-coral px-3 py-2">
            {error}
          </div>
        )}

        <div className="flex gap-3 mt-6">
          <button type="button" onClick={onClose}
            className="flex-1 py-3 border-2 border-black font-display uppercase text-sm hover:bg-black hover:text-white transition-colors">
            Cancel
          </button>
          <button type="submit" disabled={loading}
            className="flex-1 py-3 bg-shadow-grey text-white border-2 border-black font-display uppercase text-sm shadow-brutal-sm hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all disabled:opacity-50">
            {loading ? 'Creating...' : 'Create'}
          </button>
        </div>
      </motion.form>
    </motion.div>
  );
};


// ── Edit Listing Modal ────────────────────────────────────────
type PricingModelRow = { strategy_type: 'fixed' | 'hourly' | 'project'; base_price: number };

const EditListingModal = ({
  listing,
  initialPricingModels,
  onSaved,
  onClose,
}: {
  listing: ServiceListing;
  initialPricingModels: PricingModelRow[];
  onSaved: () => void;
  onClose: () => void;
}) => {
  const [title, setTitle] = useState(listing.title);
  const [description, setDescription] = useState(listing.description);
  const [categoryId, setCategoryId] = useState(listing.categoryId);
  const [pricingModels, setPricingModels] = useState<PricingModelRow[]>(
    initialPricingModels.length > 0
      ? initialPricingModels.map(pm => ({ strategy_type: pm.strategy_type, base_price: pm.base_price }))
      : [{ strategy_type: 'hourly', base_price: 0 }]
  );
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    supabase.from('categories').select('id, name').order('name').then(({ data }) => {
      if (data) setCategories(data);
    });
  }, []);

  const addPricingRow = () =>
    setPricingModels(prev => [...prev, { strategy_type: 'hourly', base_price: 0 }]);

  const removePricingRow = (index: number) =>
    setPricingModels(prev => prev.filter((_, i) => i !== index));

  const updatePricingRow = (index: number, field: keyof PricingModelRow, value: string | number) =>
    setPricingModels(prev => prev.map((row, i) => i === index ? { ...row, [field]: value } : row));

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim()) { setError('Title is required'); return; }
    setLoading(true);
    setError('');
    try {
      const body: Record<string, unknown> = {
        id: listing.id,
        title: title.trim(),
        description: description.trim(),
        category_id: categoryId,
        pricing_models: pricingModels.map(pm => ({
          strategy_type: pm.strategy_type,
          base_price: Number(pm.base_price),
        })),
      };
      const { error: err } = await supabase.functions.invoke('manage-listing', { body, method: 'PUT' });
      if (err) throw err;
      onSaved();
      onClose();
    } catch (err: any) {
      setError(err.message ?? 'Failed to save listing');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.form
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-bone border-4 border-black shadow-brutal w-full max-w-md p-8 max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
        onSubmit={handleSave}
      >
        <div className="font-mono text-[10px] uppercase tracking-widest opacity-60 mb-1">Edit Listing</div>
        <h2 className="font-display uppercase text-2xl tracking-tighter mb-6">Update Service</h2>

        <div className="space-y-4">
          <div>
            <label className="font-display uppercase text-[10px] tracking-widest block mb-1">Title *</label>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full border-2 border-black bg-white px-4 py-3 font-mono text-sm focus:outline-none focus:border-vibrant-coral"
            />
          </div>
          <div>
            <label className="font-display uppercase text-[10px] tracking-widest block mb-1">Category</label>
            <select
              value={categoryId}
              onChange={e => setCategoryId(e.target.value)}
              className="w-full border-2 border-black bg-white px-4 py-3 font-mono text-sm focus:outline-none focus:border-vibrant-coral"
            >
              <option value="">Select a category...</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="font-display uppercase text-[10px] tracking-widest block mb-1">Description</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={3}
              className="w-full border-2 border-black bg-white px-4 py-3 font-mono text-sm focus:outline-none focus:border-vibrant-coral resize-none"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="font-display uppercase text-[10px] tracking-widest">Pricing Options</label>
              <button
                type="button"
                onClick={addPricingRow}
                className="font-mono text-[10px] uppercase text-vibrant-coral hover:underline"
              >
                + Add option
              </button>
            </div>
            <div className="space-y-2">
              {pricingModels.map((row, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <select
                    value={row.strategy_type}
                    onChange={e => updatePricingRow(i, 'strategy_type', e.target.value)}
                    className="flex-1 border-2 border-black bg-white px-3 py-2 font-mono text-sm focus:outline-none focus:border-vibrant-coral"
                  >
                    <option value="hourly">Hourly</option>
                    <option value="fixed">Fixed</option>
                    <option value="project">Project</option>
                  </select>
                  <div className="flex items-center border-2 border-black bg-white">
                    <span className="px-2 font-mono text-sm opacity-50">$</span>
                    <input
                      type="number"
                      min="0"
                      value={row.base_price}
                      onChange={e => updatePricingRow(i, 'base_price', e.target.value)}
                      className="w-20 py-2 pr-3 font-mono text-sm focus:outline-none"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removePricingRow(i)}
                    disabled={pricingModels.length === 1}
                    className="text-rosy-copper/60 hover:text-rosy-copper disabled:opacity-20 transition-colors font-mono text-lg leading-none"
                    title="Remove pricing option"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {error && (
          <div className="mt-4 font-mono text-xs text-vibrant-coral border-2 border-vibrant-coral px-3 py-2">
            {error}
          </div>
        )}

        <div className="flex gap-3 mt-6">
          <button type="button" onClick={onClose}
            className="flex-1 py-3 border-2 border-black font-display uppercase text-sm hover:bg-black hover:text-white transition-colors">
            Cancel
          </button>
          <button type="submit" disabled={loading}
            className="flex-1 py-3 bg-shadow-grey text-white border-2 border-black font-display uppercase text-sm shadow-brutal-sm hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all disabled:opacity-50">
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </motion.form>
    </motion.div>
  );
};

// ── Main Dashboard ────────────────────────────────────────────
export const FreelancerDashboard = ({ user, onLogout, onSwitchToClient }: FreelancerDashboardProps) => {
  const [listings, setListings] = useState<ServiceListing[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewListing, setShowNewListing] = useState(false);
  const [activeTab, setActiveTab] = useState<'listings' | 'offers'>('listings');
  const [listingToDelete, setListingToDelete] = useState<ServiceListing | null>(null);
  const [listingToEdit, setListingToEdit] = useState<ServiceListing | null>(null);
  const [pricingModelsMap, setPricingModelsMap] = useState<Record<string, PricingModelRow[]>>({});
  const [deleting, setDeleting] = useState(false);

  const navigate = useNavigate();
  const freelancerId = user.id ?? '';

  const handleViewListing = (l: ServiceListing) => navigate(`/freelancer/${l.id}?preview=true`);

  const fetchData = async () => {
    if (!freelancerId) return;
    setLoading(true);
    try {
      const [{ data: listingRows }, { data: offerRows }] = await Promise.all([
        supabase
          .from('listings')
          .select('*, pricing_models(*)')
          .eq('freelancer_id', freelancerId)
          .order('created_at', { ascending: false }),
        supabase
          .from('offers')
          .select('*')
          .eq('freelancer_id', freelancerId)
          .eq('status', 'pending')
          .order('created_at', { ascending: false }),
      ]);

      const rawMap: Record<string, PricingModelRow[]> = {};
      (listingRows ?? []).forEach(r => {
        rawMap[r.id] = (r.pricing_models ?? []).map((pm: any) => ({
          strategy_type: pm.strategy_type,
          base_price: pm.base_price,
        }));
      });
      setPricingModelsMap(rawMap);
      setListings((listingRows ?? []).map(r =>
        ServiceListing.fromRow(r, r.pricing_models?.[0] ?? null)
      ));
      setOffers((offerRows ?? []).map(r => Offer.fromRow(r)));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [freelancerId]);

  const handleDeleteConfirm = async () => {
    if (!listingToDelete) return;
    setDeleting(true);
    try {
      await listingToDelete.deleteListing();
      setListings(prev => prev.filter(l => l.id !== listingToDelete.id));
      setListingToDelete(null);
    } catch (e) { console.error(e); } finally {
      setDeleting(false);
    }
  };

  const handleToggle = async (listing: ServiceListing) => {
    await listing.updateListing({ isActive: !listing.isActive });
    setListings(prev => prev.map(l => l.id === listing.id ? listing : l));
  };

  const handleAccept = async (offer: Offer) => {
    try {
      await offer.accept();
      setOffers(prev => prev.filter(o => o.id !== offer.id));
    } catch (e) { console.error(e); }
  };

  const handleReject = async (offer: Offer) => {
    try {
      await offer.reject();
      setOffers(prev => prev.filter(o => o.id !== offer.id));
    } catch (e) { console.error(e); }
  };

  const activeListings  = listings.filter(l => l.isActive).length;
  const pendingOffers   = offers.length;

  return (
    <main className="flex-1 bg-bone">
      {/* Header */}
      <div className="border-b-4 border-black bg-shadow-grey text-white px-8 py-10">
        <div className="max-w-5xl mx-auto flex items-end justify-between gap-6 flex-wrap">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-widest opacity-60 mb-2">Freelancer Dashboard</div>
            <h1 className="font-display uppercase text-4xl md:text-5xl tracking-tighter">
              Welcome back, {user.name.split(' ')[0]}
            </h1>
          </div>
          <div className="flex items-center gap-3 mb-2">
            <button
              onClick={onSwitchToClient}
              className="px-5 py-2 border-2 border-white/30 font-display uppercase text-sm hover:bg-white/10 transition-colors"
            >
              Switch to Client
            </button>
            <button
              onClick={onLogout}
              className="px-5 py-2 border-2 border-white/30 font-display uppercase text-sm hover:bg-white/10 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-8 py-10 space-y-10">

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard icon={Briefcase}    label="Total Listings"  value={listings.length} />
          <StatCard icon={ToggleRight}  label="Active"          value={activeListings} accent />
          <StatCard icon={Clock}        label="Pending Offers"  value={pendingOffers} />
          <StatCard icon={TrendingUp}   label="Completed"       value="—" />
        </div>

        {/* Tab switcher */}
        <div className="flex gap-0 border-4 border-black w-fit">
          {(['listings', 'offers'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                'px-6 py-2 font-display uppercase text-sm tracking-tight transition-colors',
                activeTab === tab
                  ? 'bg-shadow-grey text-white'
                  : 'bg-white hover:bg-black/5'
              )}
            >
              {tab === 'listings' ? `Listings (${listings.length})` : `Offers (${pendingOffers})`}
            </button>
          ))}
        </div>

        {/* Listings tab */}
        {activeTab === 'listings' && (
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="font-mono text-[10px] uppercase tracking-widest opacity-60">Your Services</div>
              <button
                onClick={() => setShowNewListing(true)}
                className="flex items-center gap-2 px-4 py-2 bg-vibrant-coral text-white border-2 border-black font-display uppercase text-sm shadow-brutal-sm hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all"
              >
                <Plus size={14} /> New Listing
              </button>
            </div>

            {loading ? (
              <div className="font-mono text-sm uppercase opacity-40 animate-pulse">Loading...</div>
            ) : listings.length === 0 ? (
              <div className="border-4 border-dashed border-black/20 p-10 text-center">
                <div className="font-display uppercase text-xl opacity-30 mb-2">No listings yet</div>
                <button onClick={() => setShowNewListing(true)} className="font-mono text-xs uppercase opacity-50 hover:opacity-100 underline">
                  Create your first listing
                </button>
              </div>
            ) : (
              <motion.div layout className="grid gap-4 md:grid-cols-2">
                {listings.map(listing => (
                  <ListingCard key={listing.id} listing={listing} onToggle={handleToggle} onView={handleViewListing} onEdit={item => setListingToEdit(item)} onDelete={item => setListingToDelete(item)} />
                ))}
              </motion.div>
            )}
          </section>
        )}

        {/* Offers tab */}
        {activeTab === 'offers' && (
          <section className="space-y-4">
            <div className="font-mono text-[10px] uppercase tracking-widest opacity-60">Pending Offers</div>

            {loading ? (
              <div className="font-mono text-sm uppercase opacity-40 animate-pulse">Loading...</div>
            ) : offers.length === 0 ? (
              <div className="border-4 border-dashed border-black/20 p-10 text-center">
                <div className="font-display uppercase text-xl opacity-30">No pending offers</div>
              </div>
            ) : (
              <motion.div layout className="space-y-4">
                {offers.map(o => (
                  <OfferCard key={o.id} offer={o} onAccept={handleAccept} onReject={handleReject} />
                ))}
              </motion.div>
            )}
          </section>
        )}
      </div>

      {/* New Listing Modal */}
      <AnimatePresence>
        {showNewListing && (
          <NewListingModal
            freelancerId={freelancerId}
            onCreated={fetchData}
            onClose={() => setShowNewListing(false)}
          />
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {listingToDelete && (
          <ConfirmDeleteModal
            title="Delete Listing"
            message={`Are you sure you want to delete "${listingToDelete.title}"? This cannot be undone.`}
            onConfirm={handleDeleteConfirm}
            onCancel={() => setListingToDelete(null)}
            loading={deleting}
          />
        )}
      </AnimatePresence>

      {/* Edit Listing Modal */}
      <AnimatePresence>
        {listingToEdit && (
          <EditListingModal
            listing={listingToEdit}
            initialPricingModels={pricingModelsMap[listingToEdit.id] ?? []}
            onSaved={fetchData}
            onClose={() => setListingToEdit(null)}
          />
        )}
      </AnimatePresence>
    </main>
  );
};
