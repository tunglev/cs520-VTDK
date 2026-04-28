import { useState, useMemo } from 'react';
import { Search, Filter } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { LISTINGS, PRICE_DISTRIBUTION } from '../data/mockData';
import { PriceChart } from '../components/PriceChart';
import { ListingCard } from '../components/ListingCard';

export const HomePage = () => {
  const [search, setSearch] = useState('');
  const [activeRange, setActiveRange] = useState<string | null>(null);

  const filteredListings = useMemo(() => {
    return LISTINGS.filter(l =>
      l.name.toLowerCase().includes(search.toLowerCase()) ||
      l.role.toLowerCase().includes(search.toLowerCase()) ||
      l.tags.some(t => t.toLowerCase().includes(search.toLowerCase()))
    );
  }, [search]);

  return (
    <main className="flex-1 max-w-7xl mx-auto w-full px-8 py-20">
      {/* Hero Section */}
      <div className="max-w-4xl mb-20">
        <motion.h1
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="text-7xl md:text-9xl font-display uppercase leading-none tracking-tighter mb-12"
        >
          Get <span className="text-vibrant-coral">Transparent</span> <br />
          Pricing.
        </motion.h1>

        <div className="relative group">
          <div className="absolute -inset-2 bg-black opacity-10 group-focus-within:opacity-20 transition-opacity" />
          <div className="relative flex items-center border-4 border-black bg-white shadow-brutal">
            <div className="pl-6 text-shadow-grey">
              <Search size={32} strokeWidth={3} />
            </div>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="WHAT ARE YOU LOOKING FOR?"
              className="w-full p-8 text-2xl md:text-4xl font-display uppercase placeholder:text-shadow-grey/20 focus:outline-none"
            />
            <button className="h-full px-8 bg-vibrant-coral border-l-4 border-black font-display uppercase text-xl hover:bg-rosy-copper transition-colors">
              Search
            </button>
          </div>
        </div>

        <PriceChart activeRange={activeRange} />

        <div className="mt-4 flex gap-4 overflow-x-auto pb-4">
          {PRICE_DISTRIBUTION.map(p => (
            <button
              key={p.range}
              onClick={() => setActiveRange(activeRange === p.range ? null : p.range)}
              className={cn(
                "px-4 py-2 border-2 border-black font-mono text-[10px] uppercase whitespace-nowrap transition-all",
                activeRange === p.range ? "bg-vibrant-coral text-white shadow-none translate-x-1 translate-y-1" : "bg-white shadow-brutal-sm hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none"
              )}
            >
              {p.range} ({p.count})
            </button>
          ))}
        </div>
      </div>

      {/* Listings Grid */}
      <div className="space-y-12">
        <div className="flex justify-between items-end border-b-4 border-black pb-4">
          <h2 className="text-4xl font-display uppercase tracking-tighter">
            {filteredListings.length} Available Talent
          </h2>
          <div className="flex items-center gap-2 font-mono text-xs uppercase cursor-pointer hover:text-vibrant-coral transition-colors">
            <Filter size={14} /> Sort by: Price
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
          <AnimatePresence mode="popLayout">
            {filteredListings.map(listing => (
              <motion.div
                layout
                key={listing.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.2 }}
              >
                <ListingCard listing={listing} />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {filteredListings.length === 0 && (
          <div className="py-20 text-center border-4 border-dashed border-black/20">
            <p className="font-display uppercase text-2xl opacity-40">No talent found for "{search}"</p>
          </div>
        )}
      </div>
    </main>
  );
};
