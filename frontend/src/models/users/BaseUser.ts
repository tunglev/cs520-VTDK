import { supabase } from '../../lib/supabaseClient';

export type UserRole = 'customer' | 'freelancer' | 'admin';

export interface BaseUserData {
  id: string;
  email: string;
  role: UserRole;
  createdAt: string;
  isBanned: boolean;
  bannedAt: string | null;
  banReason: string | null;
}

export class BaseUser {
  id: string;
  email: string;
  role: UserRole;
  createdAt: string;
  isBanned: boolean;
  bannedAt: string | null;
  banReason: string | null;

  constructor(data: BaseUserData) {
    this.id = data.id;
    this.email = data.email;
    this.role = data.role;
    this.createdAt = data.createdAt;
    this.isBanned = data.isBanned;
    this.bannedAt = data.bannedAt;
    this.banReason = data.banReason;
  }

  // Signs in with email + password and refreshes the Supabase session.
  static async authenticate(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data.session;
  }

  // Signs the current user out and clears the local session.
  async logout() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }

  // Converts a raw Supabase `users` row into a plain data object.
  static fromRow(row: Record<string, unknown>): BaseUserData {
    return {
      id:        row.id as string,
      email:     row.email as string,
      role:      row.role as UserRole,
      createdAt: row.created_at as string,
      isBanned:  row.is_banned as boolean,
      bannedAt:  (row.banned_at as string) ?? null,
      banReason: (row.ban_reason as string) ?? null,
    };
  }
}