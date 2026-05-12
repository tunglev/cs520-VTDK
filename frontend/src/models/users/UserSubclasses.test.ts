import { describe, it, expect } from 'vitest';
import { FreelancerUser, CustomerUser, AdminUser } from './UserSubclasses';
import { BaseUser } from './BaseUser';

const baseRow = {
  id: 'user-1',
  email: 'test@example.com',
  role: 'freelancer',
  created_at: '2024-01-01T00:00:00Z',
  is_banned: false,
  banned_at: null,
  ban_reason: null,
};

describe('FreelancerUser', () => {
  const row = {
    ...baseRow,
    business_name: 'Alex Design Studio',
    summary: 'UI/UX designer',
    service_area: 'Berlin, DE',
    zip_code: '10115',
    avatar_url: 'https://example.com/avatar.jpg',
  };

  it('hydrates from a database row via fromRow', () => {
    const data = FreelancerUser.fromRow(row);
    const user = new FreelancerUser(data);
    expect(user).toBeInstanceOf(FreelancerUser);
    expect(user).toBeInstanceOf(BaseUser);
    expect(user.businessName).toBe('Alex Design Studio');
    expect(user.summary).toBe('UI/UX designer');
    expect(user.serviceArea).toBe('Berlin, DE');
    expect(user.zipCode).toBe('10115');
    expect(user.avatarUrl).toBe('https://example.com/avatar.jpg');
    expect(user.role).toBe('freelancer');
  });

  it('handles null optional fields', () => {
    const data = FreelancerUser.fromRow(baseRow);
    const user = new FreelancerUser(data);
    expect(user.businessName).toBeNull();
    expect(user.summary).toBeNull();
    expect(user.serviceArea).toBeNull();
    expect(user.zipCode).toBeNull();
    expect(user.avatarUrl).toBeNull();
  });
});

describe('CustomerUser', () => {
  const row = { ...baseRow, role: 'customer', zip_code: '02101' };

  it('hydrates from a database row', () => {
    const data = CustomerUser.fromRow(row);
    const user = new CustomerUser(data);
    expect(user).toBeInstanceOf(CustomerUser);
    expect(user).toBeInstanceOf(BaseUser);
    expect(user.location).toBe('02101');
    expect(user.searchHistory).toEqual([]);
    expect(user.role).toBe('customer');
  });

  it('location is null when zip_code is missing', () => {
    const data = CustomerUser.fromRow({ ...baseRow, role: 'customer' });
    const user = new CustomerUser(data);
    expect(user.location).toBeNull();
  });
});

describe('AdminUser', () => {
  it('extends BaseUser', () => {
    const user = new AdminUser({
      id: 'admin-1',
      email: 'admin@vtdk.com',
      role: 'admin',
      createdAt: '2024-01-01T00:00:00Z',
      isBanned: false,
      bannedAt: null,
      banReason: null,
    });
    expect(user).toBeInstanceOf(AdminUser);
    expect(user).toBeInstanceOf(BaseUser);
    expect(user.role).toBe('admin');
  });
});
