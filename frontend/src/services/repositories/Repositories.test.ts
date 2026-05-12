import { describe, it, expect } from 'vitest';
import { UserRepository } from './Repositories';
import { FreelancerUser, CustomerUser } from '../../models/users/UserSubclasses';
import { BaseUser } from '../../models/users/BaseUser';

describe('UserRepository.hydrateUser', () => {
  const baseRow = {
    id: 'user-1',
    email: 'test@example.com',
    created_at: '2024-01-01T00:00:00Z',
    is_banned: false,
    banned_at: null,
    ban_reason: null,
  };

  it('returns FreelancerUser for freelancer role', () => {
    const user = UserRepository.hydrateUser({
      ...baseRow,
      role: 'freelancer',
      business_name: 'Studio',
      summary: null,
      service_area: null,
      zip_code: null,
      avatar_url: null,
    });
    expect(user).toBeInstanceOf(FreelancerUser);
    expect((user as FreelancerUser).businessName).toBe('Studio');
  });

  it('returns CustomerUser for customer role', () => {
    const user = UserRepository.hydrateUser({
      ...baseRow,
      role: 'customer',
      zip_code: '02101',
    });
    expect(user).toBeInstanceOf(CustomerUser);
    expect((user as CustomerUser).location).toBe('02101');
  });

  it('returns BaseUser for unknown roles', () => {
    const user = UserRepository.hydrateUser({
      ...baseRow,
      role: 'admin',
    });
    expect(user).toBeInstanceOf(BaseUser);
  });
});
