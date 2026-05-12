import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Footer } from './Footer';

describe('Footer', () => {
  it('renders the Fairlance brand name', () => {
    render(<Footer />);
    expect(screen.getByText('Fairlance')).toBeInTheDocument();
  });

  it('renders the tagline description', () => {
    render(<Footer />);
    expect(screen.getByText(/transparent freelancing platform/i)).toBeInTheDocument();
  });

  it('renders the Platform section with expected links', () => {
    render(<Footer />);
    expect(screen.getByText('Platform')).toBeInTheDocument();
    expect(screen.getByText(/browse categories/i)).toBeInTheDocument();
    expect(screen.getByText(/price index/i)).toBeInTheDocument();
    expect(screen.getByText(/market reports/i)).toBeInTheDocument();
  });

  it('renders the Company section with expected links', () => {
    render(<Footer />);
    expect(screen.getByText('Company')).toBeInTheDocument();
    expect(screen.getByText(/about us/i)).toBeInTheDocument();
    expect(screen.getByText(/contact/i)).toBeInTheDocument();
    expect(screen.getByText(/privacy policy/i)).toBeInTheDocument();
  });

  it('renders the copyright notice', () => {
    render(<Footer />);
    expect(screen.getByText(/fairlance inc/i)).toBeInTheDocument();
  });

  it('renders social media links', () => {
    render(<Footer />);
    expect(screen.getByText(/twitter/i)).toBeInTheDocument();
    expect(screen.getByText(/linkedin/i)).toBeInTheDocument();
    expect(screen.getByText(/instagram/i)).toBeInTheDocument();
  });
});
