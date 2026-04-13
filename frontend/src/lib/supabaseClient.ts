import { createClient } from '@supabase/supabase-js';

// Ensure these environment variables are set in your .env file
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in environment.');
}

// Singleton — import this everywhere instead of calling createClient() again.
export const supabase = createClient(supabaseUrl, supabaseAnonKey);