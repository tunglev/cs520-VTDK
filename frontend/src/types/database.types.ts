/**
 * database.types.ts
 *
 * Typed schema for all Supabase tables, views, and RPCs.
 * Regenerate after schema changes:
 *   npx supabase gen types typescript --project-id YOUR_REF > src/types/database.types.ts
 *
 * Import in components:
 *   import type { Database } from '../types/database.types';
 *   const supabase = createClient<Database>(url, key);
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      categories: {
        Row: {
          id:   string;
          name: string;
          slug: string;
        };
        Insert: {
          id?:  string;
          name: string;
          slug: string;
        };
        Update: {
          id?:   string;
          name?: string;
          slug?: string;
        };
      };

      users: {
        Row: {
          id:            string;
          email:         string;
          role:          'customer' | 'freelancer' | 'admin';
          is_banned:     boolean;
          banned_at:     string | null;
          ban_reason:    string | null;
          business_name: string | null;
          summary:       string | null;
          service_area:  string | null;
          zip_code:      string | null;
          avatar_url:    string | null;
          created_at:    string;
        };
        Insert: {
          id:             string;
          email:          string;
          role?:          'customer' | 'freelancer' | 'admin';
          is_banned?:     boolean;
          banned_at?:     string | null;
          ban_reason?:    string | null;
          business_name?: string | null;
          summary?:       string | null;
          service_area?:  string | null;
          zip_code?:      string | null;
          avatar_url?:    string | null;
          created_at?:    string;
        };
        Update: {
          email?:         string;
          role?:          'customer' | 'freelancer' | 'admin';
          is_banned?:     boolean;
          banned_at?:     string | null;
          ban_reason?:    string | null;
          business_name?: string | null;
          summary?:       string | null;
          service_area?:  string | null;
          zip_code?:      string | null;
          avatar_url?:    string | null;
        };
      };

      listings: {
        Row: {
          id:            string;
          freelancer_id: string;
          category_id:   string;
          title:         string;
          description:   string;
          is_active:     boolean;
          created_at:    string;
        };
        Insert: {
          id?:           string;
          freelancer_id: string;
          category_id:   string;
          title:         string;
          description:   string;
          is_active?:    boolean;
          created_at?:   string;
        };
        Update: {
          title?:       string;
          description?: string;
          is_active?:   boolean;
        };
      };

      pricing_models: {
        Row: {
          id:            string;
          listing_id:    string;
          strategy_type: 'fixed' | 'hourly' | 'project';
          base_price:    number;
          unit:          string | null;
        };
        Insert: {
          id?:           string;
          listing_id:    string;
          strategy_type: 'fixed' | 'hourly' | 'project';
          base_price:    number;
          unit?:         string | null;
        };
        Update: {
          strategy_type?: 'fixed' | 'hourly' | 'project';
          base_price?:    number;
          unit?:          string | null;
        };
      };

      offers: {
        Row: {
          id:            string;
          customer_id:   string;
          freelancer_id: string;
          listing_id:    string;
          amount:        number;
          scope:         string | null;
          status:        'pending' | 'active' | 'rejected' | 'expired';
          expires_at:    string | null;
          created_at:    string;
        };
        Insert: {
          id?:           string;
          customer_id:   string;
          freelancer_id?: string; // set by trigger
          listing_id:    string;
          amount:        number;
          scope?:        string | null;
          status?:       'pending' | 'active' | 'rejected' | 'expired';
          expires_at?:   string | null;
          created_at?:   string;
        };
        Update: {
          amount?:     number;
          scope?:      string | null;
          status?:     'pending' | 'active' | 'rejected' | 'expired';
          expires_at?: string | null;
        };
      };

      transactions: {
        Row: {
          id:            string;
          offer_id:      string;
          customer_id:   string;
          freelancer_id: string;
          listing_id:    string;
          category_id:   string;
          final_price:   number;
          completed_at:  string | null;
        };
        Insert: {
          id?:           string;
          offer_id:      string;
          customer_id?:  string; // set by trigger
          freelancer_id?: string;
          listing_id?:   string;
          category_id?:  string;
          final_price?:  number;
          completed_at?: string | null;
        };
        Update: {
          final_price?:  number;
          completed_at?: string | null;
        };
      };

      reviews: {
        Row: {
          id:             string;
          transaction_id: string;
          customer_id:    string;
          freelancer_id:  string;
          ratings:        Json;
          body:           string;
          created_at:     string;
        };
        Insert: {
          id?:            string;
          transaction_id: string;
          customer_id?:   string; // set by trigger
          freelancer_id?: string;
          ratings:        Json;
          body:           string;
          created_at?:    string;
        };
        Update: never; // reviews are immutable
      };

      review_responses: {
        Row: {
          id:            string;
          review_id:     string;
          freelancer_id: string;
          body:          string;
          created_at:    string;
        };
        Insert: {
          id?:           string;
          review_id:     string;
          freelancer_id: string;
          body:          string;
          created_at?:   string;
        };
        Update: {
          body?: string;
        };
      };

      conversations: {
        Row: {
          id:            string;
          customer_id:   string;
          freelancer_id: string;
          created_at:    string;
        };
        Insert: {
          id?:           string;
          customer_id:   string;
          freelancer_id: string;
          created_at?:   string;
        };
        Update: never;
      };

      messages: {
        Row: {
          id:              string;
          conversation_id: string;
          sender_id:       string;
          body:            string;
          created_at:      string;
        };
        Insert: {
          id?:             string;
          conversation_id: string;
          sender_id:       string;
          body:            string;
          created_at?:     string;
        };
        Update: never; // messages are immutable
      };
    };

    Views: {
      pricing_report_aggregates: {
        Row: {
          category_id:       string;
          transaction_count: number;
          price_min:         number;
          price_max:         number;
          price_avg:         number;
          price_p25:         number;
          price_median:      number;
          price_p75:         number;
        };
      };

      freelancer_rating_aggregates: {
        Row: {
          freelancer_id:     string;
          review_count:      number;
          avg_communication: number;
          avg_quality:       number;
          avg_speed:         number;
          avg_overall:       number;
        };
      };
    };

    Functions: {
      admin_cascade_on_ban: {
        Args: { p_user_id: string; p_reason: string };
        Returns: void;
      };
      admin_cascade_on_unban: {
        Args: { p_user_id: string };
        Returns: void;
      };
      admin_cascade_on_delete: {
        Args: { p_user_id: string };
        Returns: void;
      };
      expire_stale_offers: {
        Args: Record<string, never>;
        Returns: number;
      };
    };

    Enums: {
      user_role:              'customer' | 'freelancer' | 'admin';
      offer_status:           'pending' | 'active' | 'rejected' | 'expired';
      pricing_strategy_type:  'fixed' | 'hourly' | 'project';
    };
  };
};