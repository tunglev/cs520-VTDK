import { useState, useMemo, useEffect, useRef } from 'react';
import { Search, SlidersHorizontal, X, ChevronDown, ArrowUpDown } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { ListingCard } from '../components/ListingCard';
import { supabase } from '../lib/supabaseClient';
import type { Listing } from '../types';

type SortKey = 'relevance' | 'price_asc' | 'price_desc' | 'rating' | 'reviews';

const SORT_LABELS: Record<SortKey, string> = {
  relevance: 'Relevance',
  price_asc: 'Price: Low → High',
  price_desc: 'Price: High → Low',
  rating: 'Highest Rated',
  reviews: 'Most Reviews',
};

const PRICE_RANGES = [
  { label: 'Any price', min: 0, max: Infinity },
  { label: 'Under $40', min: 0, max: 40 },
  { label: '$40–$80', min: 40, max: 80 },
  { label: '$80–$120', min: 80, max: 120 },
  { label: '$120+', min: 120, max: Infinity },
];

export const FindTalentPage = () => {
  const [query, setQuery] = useState('');
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [activePriceRange, setActivePriceRange] = useState(0);
  const [sort, setSort] = useState<SortKey>('relevance');
  const [sortOpen, setSortOpen] = useState(false);
  const sortRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    searchRef.current?.focus();
  }, []);

  useEffect(() => {
    const fetchListings = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase.functions.invoke('get-listings', { method: 'GET' });
        if (error) throw error;
        if (data && Array.isArray(data)) {
          const colors = ['bg-vibrant-coral', 'bg-rosy-copper', 'bg-white'];
          setListings(data.map((item: any) => ({
            id: item.id,
            name: item.users?.full_name || item.users?.business_name || item.title || 'Unknown Talent',
            role: item.title || item.categories?.name || 'Freelancer',
            category: (item.categories?.name || 'general').toLowerCase(),
            price: item.pricing_models?.[0]?.base_price || 0,
            rating: 5.0,
            reviews: 0,
            location: item.users?.service_area || item.users?.zip_code || 'Remote',
            tags: item.categories?.name ? [item.categories.name] : [],
            color: colors[Math.floor(Math.random() * colors.length)],
            completedJobs: 0,
            freelancerUserId: item.freelancer_id,
          })));
        }
      } catch {
        setListings([]);
      } finally {
        setLoading(false);
      }
    };
    fetchListings();
  }, []);

  // Close sort dropdown on outside click
  useEffect(() => {
    const handle = (e: MouseEvent) => {
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) setSortOpen(false);
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, []);

  const categories = useMemo(() => {
    const seen = new Set<string>();
    listings.forEach(l => { if (l.category) seen.add(l.category); });
    return Array.from(seen).sort();
  }, [listings]);

  const priceRange = PRICE_RANGES[activePriceRange];
  const activeFilterCount = (activeCategory ? 1 : 0) + (activePriceRange > 0 ? 1 : 0);

  const filtered = useMemo(() => {
    let results = listings.filter(l => {
      const q = query.toLowerCase();
      const matchesQuery =
        !q ||
        l.name.toLowerCase().includes(q) ||
        l.role.toLowerCase().includes(q) ||
        l.category.toLowerCase().includes(q) ||
        l.tags.some(t => t.toLowerCase().includes(q));
      const matchesCategory = !activeCategory || l.category === activeCategory;
      const matchesPrice = l.price >= priceRange.min && l.price <= priceRange.max;
      return matchesQuery && matchesCategory && matchesPrice;
    });

    switch (sort) {
      case 'price_asc':  results = [...results].sort((a, b) => a.price - b.price); break;
      case 'price_desc': results = [...results].sort((a, b) => b.price - a.price); break;
      case 'rating':     results = [...results].sort((a, b) => b.rating - a.rating); break;
      case 'reviews':    results = [...results].sort((a, b) => b.reviews - a.reviews); break;
    }
    return results;
  }, [listings, query, activeCategory, activePriceRange, sort, priceRange]);

  const clearAll = () => {
    setActiveCategory(null);
    setActivePriceRange(0);
    setSort('relevance');
  };

  return (
    <main className="flex-1 max-w-7xl mx-auto w-full px-8 py-12">

      {/* ── Search bar ── */}
      <div className="mb-8">
        <div className="relative group">
          <div className="absolute -inset-2 bg-black opacity-10 group-focus-within:opacity-20 transition-opacity" />
          <div className="relative flex items-center border-4 border-black bg-white shadow-brutal">
            <div className="pl-6 text-shadow-grey">
              <Search size={28} strokeWidth={3} />
            </div>
            <input
              ref={searchRef}
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="SKILL, ROLE, OR NAME…"
              className="w-full px-6 py-6 text-2xl md:text-3xl font-display uppercase placeholder:text-shadow-grey/20 focus:outline-none"
            />
            {query && (
              <button
                onClick={() => { setQuery(''); searchRef.current?.focus(); }}
                className="pr-6 text-shadow-grey hover:text-black transition-colors"
              >
                <X size={22} strokeWidth={2.5} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Filters row ── */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        {/* Category pills */}
        <div className="flex items-center gap-2 font-mono text-[10px] uppercase opacity-50">
          <SlidersHorizontal size={12} /> Category
        </div>
        <button
          onClick={() => setActiveCategory(null)}
          className={cn(
            'px-4 py-2 border-2 border-black font-mono text-[10px] uppercase transition-all',
            !activeCategory
              ? 'bg-black text-white shadow-none translate-x-0.5 translate-y-0.5'
              : 'bg-white shadow-brutal-sm hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none'
          )}
        >
          All
        </button>
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(activeCategory === cat ? null : cat)}
            className={cn(
              'px-4 py-2 border-2 border-black font-mono text-[10px] uppercase capitalize whitespace-nowrap transition-all',
              activeCategory === cat
                ? 'bg-vibrant-coral text-white shadow-none translate-x-0.5 translate-y-0.5'
                : 'bg-white shadow-brutal-sm hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none'
            )}
          >
            {cat}
          </button>
        ))}

        {/* Divider */}
        <div className="hidden md:block h-6 w-px bg-black/20 mx-1" />

        {/* Price range pills */}
        <div className="flex items-center gap-2 font-mono text-[10px] uppercase opacity-50">
          Price
        </div>
        {PRICE_RANGES.slice(1).map((range, i) => (
          <button
            key={range.label}
            onClick={() => setActivePriceRange(activePriceRange === i + 1 ? 0 : i + 1)}
            className={cn(
              'px-4 py-2 border-2 border-black font-mono text-[10px] uppercase whitespace-nowrap transition-all',
              activePriceRange === i + 1
                ? 'bg-vibrant-coral text-white shadow-none translate-x-0.5 translate-y-0.5'
                : 'bg-white shadow-brutal-sm hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none'
            )}
          >
            {range.label}
          </button>
        ))}
      </div>

      {/* ── Results bar ── */}
      <div className="flex items-center justify-between border-b-4 border-black pb-4 mb-10">
        <div className="flex items-center gap-4">
          <h2 className="text-3xl font-display uppercase tracking-tighter">
            {loading ? (
              <span className="opacity-30">Loading…</span>
            ) : (
              <>{filtered.length} <span className="opacity-40">Freelancer{filtered.length !== 1 ? 's' : ''}</span></>
            )}
          </h2>
          {activeFilterCount > 0 && (
            <button
              onClick={clearAll}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-black text-white font-mono text-[10px] uppercase border-2 border-black hover:bg-vibrant-coral transition-colors"
            >
              <X size={10} /> Clear {activeFilterCount} filter{activeFilterCount > 1 ? 's' : ''}
            </button>
          )}
        </div>

        {/* Sort dropdown */}
        <div className="relative" ref={sortRef}>
          <button
            onClick={() => setSortOpen(o => !o)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 border-2 border-black font-mono text-[10px] uppercase transition-all',
              sortOpen
                ? 'bg-black text-white shadow-none'
                : 'bg-white shadow-brutal-sm hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none'
            )}
          >
            <ArrowUpDown size={11} />
            {SORT_LABELS[sort]}
            <ChevronDown size={11} className={cn('transition-transform', sortOpen && 'rotate-180')} />
          </button>
          <AnimatePresence>
            {sortOpen && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.12 }}
                className="absolute right-0 top-full mt-2 w-52 bg-white border-4 border-black shadow-brutal z-20"
              >
                {(Object.keys(SORT_LABELS) as SortKey[]).map(key => (
                  <button
                    key={key}
                    onClick={() => { setSort(key); setSortOpen(false); }}
                    className={cn(
                      'w-full text-left px-4 py-3 font-mono text-[10px] uppercase border-b-2 last:border-b-0 border-black/10 hover:bg-vibrant-coral hover:text-white transition-colors',
                      sort === key && 'bg-black text-white'
                    )}
                  >
                    {SORT_LABELS[key]}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ── Results grid ── */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-64 border-4 border-black bg-black/5 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          <AnimatePresence mode="popLayout">
            {filtered.map(listing => (
              <motion.div
                layout
                key={listing.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.18 }}
              >
                <ListingCard listing={listing} />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* ── Empty state ── */}
      {!loading && filtered.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="py-24 text-center border-4 border-dashed border-black/20"
        >
          <div className="font-display uppercase text-5xl opacity-10 mb-4">0</div>
          <p className="font-display uppercase text-2xl opacity-40 mb-2">
            No freelancers found
          </p>
          <p className="font-mono text-xs uppercase opacity-30">
            {query ? `Nothing matched "${query}"` : 'Try adjusting your filters'}
          </p>
          {(query || activeFilterCount > 0) && (
            <button
              onClick={() => { setQuery(''); clearAll(); searchRef.current?.focus(); }}
              className="mt-8 px-6 py-3 bg-black text-white font-display uppercase text-sm border-2 border-black hover:bg-vibrant-coral transition-colors"
            >
              Clear Search
            </button>
          )}
        </motion.div>
      )}

    </main>
  );
};
