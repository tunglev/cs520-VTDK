import { useEffect, useState } from 'react';
import { type Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabaseClient';
import { UserRepository } from '../services/repositories/Repositories';
import { BaseUser } from '../models/users/BaseUser';
import { FreelancerUser, CustomerUser, AdminUser } from '../models/users/UserSubclasses';

export type HydratedUser = FreelancerUser | CustomerUser | AdminUser | BaseUser | null;

const userRepo = new UserRepository();

/**
 * useAuth — provides the current Supabase session and a fully-typed
 * application user object (FreelancerUser, CustomerUser, or AdminUser).
 *
 * Usage:
 *   const { user, session, loading } = useAuth();
 */
export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser]       = useState<HydratedUser>(null);
  const [loading, setLoading] = useState(true);

  async function hydrateUser(session: Session | null) {
    if (!session) {
      setUser(null);
      setLoading(false);
      return;
    }

    const { data: row, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', session.user.id)
      .single();

    if (error || !row) {
      setUser(null);
    } else {
      setUser(UserRepository.hydrateUser(row));
    }
    setLoading(false);
  }

  useEffect(() => {
    // Load the current session on mount.
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      hydrateUser(session);
    });

    // Subscribe to auth state changes (login, logout, token refresh).
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      hydrateUser(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  return { user, session, loading };
}

/**
 * signUp — creates a new Supabase Auth user and sets the role in user metadata.
 * The handle_new_auth_user trigger then inserts a row into public.users.
 */
export async function signUp(email: string, password: string, role: 'customer' | 'freelancer') {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { role } },
  });
  if (error) throw error;
  return data;
}

/**
 * signIn — email + password login.
 */
export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

/**
 * signOut — clears the local session.
 */
export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}