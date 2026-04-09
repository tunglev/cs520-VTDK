import { Star, MapPin, ArrowRight } from 'lucide-react';
import { cn } from '../lib/utils';
import { LISTINGS } from '../data/mockData';

interface ListingCardProps {
  listing: typeof LISTINGS[0];
  onSelect: (listing: typeof LISTINGS[0]) => void;
}

export const ListingCard = ({ listing, onSelect }: ListingCardProps) => (
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

    <button
      onClick={() => onSelect(listing)}
      className="w-full py-3 bg-shadow-grey text-white font-display uppercase text-sm border-2 border-black flex items-center justify-center gap-2 group-hover:bg-vibrant-coral transition-colors mt-auto"
    >
      View Profile <ArrowRight size={16} />
    </button>
  </div>
);