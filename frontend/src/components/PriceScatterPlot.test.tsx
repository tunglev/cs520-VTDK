import { describe, it, expect, vi, beforeAll } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PriceScatterPlot } from './PriceScatterPlot';
import type { ScatterPoint } from '../types';

// Recharts uses ResizeObserver internally; jsdom does not implement it
class MockResizeObserver {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
}

beforeAll(() => {
  vi.stubGlobal('ResizeObserver', MockResizeObserver);
});

const SAMPLE_DATA: ScatterPoint[] = [
  { name: 'Alice', price: 50, rating: 4.8, reviews: 20, isCurrent: true },
  { name: 'Bob', price: 70, rating: 4.5, reviews: 35 },
  { name: 'Carol', price: 40, rating: 4.2, reviews: 12 },
  { name: 'Dave', price: 90, rating: 5.0, reviews: 60 },
];

describe('PriceScatterPlot', () => {
  it('renders without crashing', () => {
    const { container } = render(<PriceScatterPlot data={SAMPLE_DATA} marketAvg={62} />);
    expect(container.firstChild).toBeTruthy();
  });

  it('shows the "This freelancer" legend item', () => {
    render(<PriceScatterPlot data={SAMPLE_DATA} marketAvg={62} />);
    expect(screen.getByText(/this freelancer/i)).toBeInTheDocument();
  });

  it('shows the "Market" legend item', () => {
    render(<PriceScatterPlot data={SAMPLE_DATA} marketAvg={62} />);
    expect(screen.getByText('Market')).toBeInTheDocument();
  });

  it('displays the market average in the legend', () => {
    render(<PriceScatterPlot data={SAMPLE_DATA} marketAvg={62} />);
    expect(screen.getByText(/avg \$62\/hr/i)).toBeInTheDocument();
  });

  it('shows the total freelancer count in the caption', () => {
    render(<PriceScatterPlot data={SAMPLE_DATA} marketAvg={62} />);
    expect(screen.getByText(/4 freelancers in this category/i)).toBeInTheDocument();
  });
});
