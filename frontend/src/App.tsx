import { useState, useMemo } from 'react';
import { Search, MapPin, Star, ArrowRight, Filter, Info } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './lib/utils';

// --- Mock Data ---
const LISTINGS = [
  { id: 1, name: 'Alex Rivera', role: 'UI/UX Designer', price: 45, rating: 4.9, reviews: 124, location: 'Berlin, DE', tags: ['Figma', 'Prototyping'], color: 'bg-vibrant-coral' },
  { id: 2, name: 'Sarah Chen', role: 'Fullstack Developer', price: 85, rating: 5.0, reviews: 89, location: 'San Francisco, US', tags: ['React', 'Node.js'], color: 'bg-rosy-copper' },
  { id: 3, name: 'Marco Rossi', role: 'Logo Designer', price: 30, rating: 4.7, reviews: 210, location: 'Milan, IT', tags: ['Illustrator', 'Branding'], color: 'bg-white' },
  { id: 4, name: 'Elena Petrova', role: 'Content Strategist', price: 55, rating: 4.8, reviews: 56, location: 'London, UK', tags: ['SEO', 'Copywriting'], color: 'bg-vibrant-coral' },
  { id: 5, name: 'James Wilson', role: 'Backend Engineer', price: 95, rating: 4.9, reviews: 142, location: 'Austin, US', tags: ['Go', 'PostgreSQL'], color: 'bg-rosy-copper' },
  { id: 6, name: 'Yuki Tanaka', role: 'Motion Designer', price: 70, rating: 5.0, reviews: 34, location: 'Tokyo, JP', tags: ['After Effects', '3D'], color: 'bg-white' },
];

const PRICE_DISTRIBUTION = [
  { range: '$0-30', count: 12, avg: 25 },
  { range: '$30-50', count: 45, avg: 42 },
  { range: '$50-70', count: 32, avg: 61 },
  { range: '$70-90', count: 18, avg: 82 },
  { range: '$90-120', count: 10, avg: 105 },
  { range: '$120+', count: 5, avg: 140 },
];

// --- Components ---

const Navbar = () => (
  <nav className="flex justify-between items-center px-8 py-6 border-b-4 border-black bg-white">
    <div className="text-3xl font-display uppercase tracking-tighter flex items-center gap-2">
      <div className="w-8 h-8 bg-vibrant-coral border-2 border-black rounded-sm" />
      VTDK
    </div>
    <div className="hidden md:flex gap-8 font-display uppercase text-sm tracking-widest">
      <a href="#" className="hover:text-vibrant-coral transition-colors">Find Talent</a>
      <a href="#" className="hover:text-vibrant-coral transition-colors">How it works</a>
      <a href="#" className="hover:text-vibrant-coral transition-colors">Pricing</a>
    </div>
    <button className="px-6 py-2 bg-shadow-grey text-white font-display uppercase text-sm border-2 border-black shadow-brutal-sm hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all">
      Login
    </button>
  </nav>
);

const PriceChart = ({ activeRange }: { activeRange: string | null }) => {
  return (
    <div className="w-full h-48 mt-8 bg-white border-4 border-black p-6 shadow-brutal">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-display uppercase text-xs tracking-widest flex items-center gap-2">
          <Info size={14} /> Price Distribution (USD/hr)
        </h3>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-vibrant-coral border border-black" />
            <span className="text-[10px] font-mono uppercase">Market Avg: $58/hr</span>
          </div>
          <span className="text-[10px] font-mono opacity-50 uppercase">Based on 122 results</span>
        </div>
      </div>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={PRICE_DISTRIBUTION}>
          <Tooltip 
            cursor={{ fill: 'transparent' }}
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                return (
                  <div className="bg-shadow-grey text-white p-2 border-2 border-black text-xs font-mono">
                    {payload[0].payload.range}: {payload[0].value} freelancers
                  </div>
                );
              }
              return null;
            }}
          />
          <Bar dataKey="count">
            {PRICE_DISTRIBUTION.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={entry.range === activeRange ? '#FF6F59' : '#231F20'} 
                className="transition-all duration-300"
              />
            ))}
          </Bar>
          <XAxis dataKey="range" hide />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

const ListingCard = ({ listing }: { listing: typeof LISTINGS[0] }) => (
  <div 
    className={cn(
      "group relative p-6 border-4 border-black shadow-brutal hover:-translate-x-1 hover:-translate-y-1 hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] transition-all h-full flex flex-col",
      listing.color
    )}
  >
    <div className="flex justify-between items-start mb-6">
      <div className="w-16 h-16 bg-white border-2 border-black flex items-center justify-center text-2xl font-display shrink-0">
        {listing.name.charAt(0)}
      </div>
      <div className="text-right">
        <div className="text-3xl font-display tracking-tighter leading-none">${listing.price}</div>
        <div className="text-[10px] font-mono uppercase opacity-60 mt-1">per hour</div>
      </div>
    </div>

    <h3 className="text-xl font-display uppercase mb-1">{listing.name}</h3>
    <p className="text-sm font-mono uppercase opacity-70 mb-4">{listing.role}</p>

    <div className="flex items-center gap-4 mb-6 text-xs font-mono uppercase">
      <div className="flex items-center gap-1">
        <Star size={12} className="fill-current" /> {listing.rating}
      </div>
      <div className="flex items-center gap-1">
        <MapPin size={12} /> {listing.location}
      </div>
    </div>

    <div className="flex flex-wrap gap-2 mb-8 flex-1">
      {listing.tags.map(tag => (
        <span key={tag} className="px-2 py-1 bg-white border-2 border-black text-[10px] font-mono uppercase h-fit">
          {tag}
        </span>
      ))}
    </div>

    <button className="w-full py-3 bg-shadow-grey text-white font-display uppercase text-sm border-2 border-black flex items-center justify-center gap-2 group-hover:bg-vibrant-coral transition-colors mt-auto">
      View Profile <ArrowRight size={16} />
    </button>
  </div>
);

export default function App() {
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
    <div className="min-h-screen flex flex-col selection:bg-vibrant-coral selection:text-white">
      <Navbar />

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

      <footer className="mt-40 border-t-4 border-black bg-white p-12">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="col-span-2">
            <div className="text-4xl font-display uppercase tracking-tighter mb-6">VTDK</div>
            <p className="font-mono text-sm uppercase max-w-md opacity-60">
              The world's first transparent freelancing platform. No hidden fees. No algorithmic bias. Just fair prices for great work.
            </p>
          </div>
          <div className="space-y-4">
            <div className="font-display uppercase text-xs tracking-widest">Platform</div>
            <ul className="font-mono text-xs uppercase space-y-2 opacity-60">
              <li><a href="#" className="hover:text-vibrant-coral">Browse Categories</a></li>
              <li><a href="#" className="hover:text-vibrant-coral">Price Index</a></li>
              <li><a href="#" className="hover:text-vibrant-coral">Market Reports</a></li>
            </ul>
          </div>
          <div className="space-y-4">
            <div className="font-display uppercase text-xs tracking-widest">Company</div>
            <ul className="font-mono text-xs uppercase space-y-2 opacity-60">
              <li><a href="#" className="hover:text-vibrant-coral">About Us</a></li>
              <li><a href="#" className="hover:text-vibrant-coral">Contact</a></li>
              <li><a href="#" className="hover:text-vibrant-coral">Privacy Policy</a></li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-20 pt-8 border-t-2 border-black/10 flex justify-between items-center font-mono text-[10px] uppercase opacity-40">
          <div>© 2026 VTDK Freelance Inc.</div>
          <div className="flex gap-8">
            <a href="#">Twitter</a>
            <a href="#">LinkedIn</a>
            <a href="#">Instagram</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
