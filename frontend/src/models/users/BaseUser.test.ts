import { describe, it, expect } from 'vitest';
import { BaseUser } from './BaseUser';

describe('BaseUser', () => {
  const row = {
    id: 'user-1',
    email: 'test@example.com',
    role: 'customer',
    created_at: '2024-01-01T00:00:00Z',
    is_banned: false,
    banned_at: null,
    ban_reason: null,
  };

  it('hydrates from a database row', () => {
    const user = BaseUser.fromRow(row);
    expect(user).toBeInstanceOf(BaseUser);
    expect(user.id).toBe('user-1');
    expect(user.email).toBe('test@example.com');
    expect(user.role).toBe('customer');
    expect(user.isBanned).toBe(false);
    expect(user.bannedAt).toBeNull();
    expect(user.banReason).toBeNull();
  });

  it('handles banned user fields', () => {
    const banned = BaseUser.fromRow({
      ...row,
      is_banned: true,
      banned_at: '2024-03-15T00:00:00Z',
      ban_reason: 'spam',
    });
    expect(banned.isBanned).toBe(true);
    expect(banned.bannedAt).toBe('2024-03-15T00:00:00Z');
    expect(banned.banReason).toBe('spam');
  });

  it('can be constructed directly', () => {
    const user = new BaseUser({
      id: 'u-2',
      email: 'admin@test.com',
      role: 'admin',
      createdAt: '2024-01-01T00:00:00Z',
      isBanned: false,
      bannedAt: null,
      banReason: null,
    });
    expect(user.role).toBe('admin');
  });
});
