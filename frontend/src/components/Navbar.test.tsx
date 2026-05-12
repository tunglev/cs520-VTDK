import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { Navbar } from './Navbar';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

function renderNavbar(user?: { name: string; role: string } | null) {
  return render(
    <MemoryRouter>
      <Navbar user={user} />
    </MemoryRouter>
  );
}

describe('Navbar', () => {
  it('renders the Fairlance brand link', () => {
    renderNavbar();
    const brand = screen.getByRole('link', { name: /fairlance/i });
    expect(brand).toBeInTheDocument();
    expect(brand).toHaveAttribute('href', '/');
  });

  it('renders the main navigation links', () => {
    renderNavbar();
    expect(screen.getByRole('link', { name: /find talent/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /how it works/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /pricing/i })).toBeInTheDocument();
  });

  it('shows a Login button when no user is provided', () => {
    renderNavbar(null);
    expect(screen.getByRole('link', { name: /login/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /login/i })).toHaveAttribute('href', '/auth');
  });

  it('does not show the Login button when a user is logged in', () => {
    renderNavbar({ name: 'Alice', role: 'freelancer' });
    expect(screen.queryByRole('link', { name: /login/i })).not.toBeInTheDocument();
  });

  it('shows the user name and role when logged in', () => {
    renderNavbar({ name: 'Alice', role: 'freelancer' });
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('freelancer')).toBeInTheDocument();
  });

  it('renders the user avatar with the first letter of their name', () => {
    renderNavbar({ name: 'Bob Smith', role: 'customer' });
    expect(screen.getByText('B')).toBeInTheDocument();
  });

  it('shows the Transactions link when the user is logged in', () => {
    renderNavbar({ name: 'Alice', role: 'freelancer' });
    expect(screen.getByRole('link', { name: /transactions/i })).toBeInTheDocument();
  });

  it('navigates to /dashboard when a freelancer clicks their avatar', async () => {
    renderNavbar({ name: 'Alice', role: 'freelancer' });
    const avatar = screen.getByText('A').parentElement!;
    await userEvent.click(avatar);
    expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
  });

  it('navigates to /profile when a customer clicks their avatar', async () => {
    renderNavbar({ name: 'Carol', role: 'customer' });
    const avatar = screen.getByText('C').parentElement!;
    await userEvent.click(avatar);
    expect(mockNavigate).toHaveBeenCalledWith('/profile');
  });
});
