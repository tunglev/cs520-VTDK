import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ListingCard } from './ListingCard';
import type { Listing } from '../types/index';

const listing: Listing = {
  id: 'lst-1',
  name: 'Alex Rivera',
  role: 'UI/UX Designer',
  category: 'design',
  price: 45,
  rating: 4.9,
  reviews: 124,
  location: 'Berlin, DE',
  tags: ['Figma', 'Prototyping'],
  color: 'bg-vibrant-coral',
  completedJobs: 98,
};

function renderCard() {
  return render(
    <MemoryRouter>
      <ListingCard listing={listing} />
    </MemoryRouter>
  );
}

describe('ListingCard', () => {
  it('renders the freelancer name and role', () => {
    renderCard();
    expect(screen.getByText('Alex Rivera')).toBeInTheDocument();
    expect(screen.getByText('UI/UX Designer')).toBeInTheDocument();
  });

  it('displays the price', () => {
    renderCard();
    expect(screen.getByText('$45')).toBeInTheDocument();
  });

  it('displays tags', () => {
    renderCard();
    expect(screen.getByText('Figma')).toBeInTheDocument();
    expect(screen.getByText('Prototyping')).toBeInTheDocument();
  });

  it('shows the rating', () => {
    renderCard();
    expect(screen.getByText('4.9')).toBeInTheDocument();
  });

  it('shows the location', () => {
    renderCard();
    expect(screen.getByText('Berlin, DE')).toBeInTheDocument();
  });

  it('links to the freelancer profile page', () => {
    renderCard();
    const link = screen.getByRole('link', { name: /view profile/i });
    expect(link).toHaveAttribute('href', '/freelancer/lst-1');
  });

  it('renders the initial letter avatar', () => {
    renderCard();
    expect(screen.getByText('A')).toBeInTheDocument();
  });
});
