import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import type { Listing } from '../types';

export function useListings() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchListings = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data, error } = await supabase.functions.invoke('get-listings', {
          method: 'GET',
        });
        
        if (error) throw error;
        
        if (data && Array.isArray(data)) {
          // Fetch ratings mapping
          const freelancerIds = [...new Set(data.map((item: any) => item.freelancer_id).filter(Boolean))];
          const { data: ratingsData } = await supabase
            .from('freelancer_rating_aggregates')
            .select('freelancer_id, avg_overall, review_count')
            .in('freelancer_id', freelancerIds);

          const ratingsMap = new Map(
            (ratingsData ?? []).map((r: any) => [r.freelancer_id, r])
          );

          const colors = ['bg-vibrant-coral', 'bg-rosy-copper', 'bg-white'];
          
          const mappedListings: Listing[] = data.map((item: any) => {
            const ratings = ratingsMap.get(item.freelancer_id);
            return {
              id: item.id,
              name: item.title || item.categories?.name || 'Untitled Service',
              freelancerName: item.users?.full_name || item.users?.business_name || 'Unknown Talent',
              role: item.categories?.name || 'Freelancer',
              category: (item.categories?.name || item.category_id || 'general').toLowerCase(),
              price: item.pricing_models?.[0]?.base_price || 0,
              rating: ratings?.avg_overall ?? 5.0,
              reviews: ratings?.review_count ?? 0,
              location: item.users?.service_area || item.users?.zip_code || 'Remote',
              tags: item.categories?.name ? [item.categories.name] : [],
              color: colors[Math.floor(Math.random() * colors.length)],
              completedJobs: 0,
              freelancerUserId: item.freelancer_id,
            };
          });
          
          setListings(mappedListings);
        }
      } catch (err: any) {
        console.error('Error fetching listings:', err);
        setError(err.message);
        setListings([]);
      } finally {
        setLoading(false);
      }
    };

    fetchListings();
  }, []);

  return { listings, loading, error };
}
