import { useState } from 'react';
import { X, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import {
  BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import { PriceScatterPlot } from './PriceScatterPlot';
import { cn } from '../lib/utils';
import type { PricingReport, Listing } from '../types/index';

interface PricingReportModalProps {
  report: PricingReport;
  listing: Listing;
  onClose: () => void;
}

export const PricingReportModal = ({ report, listing, onClose }: PricingReportModalProps) => {
  const [activeRange, setActiveRange] = useState<string | null>(null);

  const diff = listing.price - report.marketAvg;
  const diffPct = Math.round(Math.abs(diff / report.marketAvg) * 100);
  const isAbove = diff > 0;
  const isAt = diff === 0;

  // Position marker as % across the min→max range
  const rangeSpan = report.marketMax - report.marketMin;
  const freelancerPct  = Math.min(100, Math.max(0, ((listing.price   - report.marketMin) / rangeSpan) * 100));
  const avgPct         = Math.min(100, Math.max(0, ((report.marketAvg    - report.marketMin) / rangeSpan) * 100));
  const medianPct      = Math.min(100, Math.max(0, ((report.marketMedian - report.marketMin) / rangeSpan) * 100));

  return (
    <AnimatePresence>
      {/* Backdrop */}
      <motion.div
        key="backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 bg-black/70 z-50 flex items-start justify-center overflow-y-auto py-8 px-4"
        onClick={onClose}
      >
        {/* Modal panel */}
        <motion.div
          key="panel"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 24 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="relative w-full max-w-3xl bg-bone border-4 border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] my-auto"
          onClick={e => e.stopPropagation()}
        >
          {/* ── Header ───────────────────────────────────────────── */}
          <div className="flex items-start justify-between p-8 border-b-4 border-black bg-shadow-grey text-white">
            <div>
              <div className="font-mono text-[10px] uppercase tracking-widest opacity-60 mb-1">
                Market Comparator · {report.category}
              </div>
              <h2 className="font-display uppercase text-3xl tracking-tighter leading-none">
                Pricing Report
              </h2>
              <p className="font-mono text-xs uppercase opacity-60 mt-2">
                Based on {report.sampleSize} anonymized transactions
              </p>
            </div>
            <button
              onClick={onClose}
              aria-label="Close"
              className="w-10 h-10 border-2 border-white/30 flex items-center justify-center hover:bg-white/10 transition-colors shrink-0 mt-1"
            >
              <X size={18} />
            </button>
          </div>

          <div className="p-8 space-y-10">

            {/* ── Market Position Callout ───────────────────────── */}
            <section>
              <div className="font-mono text-[10px] uppercase tracking-widest opacity-60 mb-4">
                Market Position
              </div>

              {/* Big stat row */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                {[
                  { label: 'Market Min',  value: `$${report.marketMin}` },
                  { label: 'Market Avg',  value: `$${report.marketAvg}`, accent: true },
                  { label: 'Median',      value: `$${report.marketMedian}` },
                  { label: 'Market Max',  value: `$${report.marketMax}` },
                ].map(({ label, value, accent }) => (
                  <div key={label} className={cn(
                    'border-2 border-black p-4',
                    accent ? 'bg-vibrant-coral text-white' : 'bg-white'
                  )}>
                    <div className="font-mono text-[10px] uppercase opacity-60 mb-1">{label}</div>
                    <div className="font-display text-2xl tracking-tighter">{value}/hr</div>
                  </div>
                ))}
              </div>

              {/* Price ruler */}
              <div className="relative mb-6">
                <div className="h-3 bg-black/10 border-2 border-black relative">
                  {/* Avg marker */}
                  <div
                    className="absolute top-0 h-full w-0.5 bg-black/40"
                    style={{ left: `${avgPct}%` }}
                  />
                  {/* Median marker */}
                  <div
                    className="absolute top-0 h-full w-0.5 bg-black/40 border-dashed"
                    style={{ left: `${medianPct}%` }}
                  />
                  {/* Freelancer marker */}
                  <div
                    className="absolute -top-2 -translate-x-1/2"
                    style={{ left: `${freelancerPct}%` }}
                  >
                    <div className="w-3 h-7 bg-vibrant-coral border-2 border-black" />
                  </div>
                </div>
                <div className="flex justify-between font-mono text-[9px] uppercase opacity-50 mt-1">
                  <span>${report.marketMin}</span>
                  <span>${report.marketMax}</span>
                </div>
              </div>

              {/* Verdict banner */}
              <div className={cn(
                'flex items-center gap-4 p-5 border-4 border-black',
                isAt ? 'bg-white' : isAbove ? 'bg-rosy-copper text-white' : 'bg-vibrant-coral text-white'
              )}>
                <div className="text-4xl shrink-0">
                  {isAt  ? <Minus size={36} /> :
                   isAbove ? <TrendingUp size={36} /> :
                             <TrendingDown size={36} />}
                </div>
                <div>
                  <div className="font-display uppercase text-xl tracking-tighter leading-tight">
                    {listing.name.split(' ')[0]} charges{' '}
                    {isAt
                      ? 'exactly the market average'
                      : `${diffPct}% ${isAbove ? 'above' : 'below'} the market average`}
                  </div>
                  <div className="font-mono text-xs uppercase opacity-80 mt-1">
                    ${listing.price}/hr · {report.percentile}th percentile out of {report.sampleSize} freelancers
                  </div>
                </div>
                <div className="ml-auto text-right shrink-0">
                  <div className="font-mono text-[10px] uppercase opacity-70">Percentile</div>
                  <div className="font-display text-4xl tracking-tighter">{report.percentile}</div>
                </div>
              </div>
            </section>

            {/* ── Price Distribution Bar Chart ─────────────────── */}
            <section>
              <div className="font-mono text-[10px] uppercase tracking-widest opacity-60 mb-4">
                Price Distribution (USD/hr)
              </div>

              <div className="bg-white border-4 border-black p-6">
                <div className="h-40">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={report.priceDistribution} barCategoryGap="20%">
                      <Tooltip
                        cursor={{ fill: 'transparent' }}
                        content={({ active, payload }) => {
                          if (active && payload?.length) {
                            return (
                              <div className="bg-shadow-grey text-white p-2 border-2 border-black text-xs font-mono">
                                {payload[0].payload.range}: {payload[0].value} freelancers
                                <br />
                                avg ${payload[0].payload.avg}/hr
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Bar dataKey="count" radius={0}>
                        {report.priceDistribution.map((entry, i) => (
                          <Cell
                            key={`cell-${i}`}
                            fill={entry.range === activeRange ? '#FF6F59' : '#231F20'}
                          />
                        ))}
                      </Bar>
                      <XAxis
                        dataKey="range"
                        tick={{ fontSize: 9, fontFamily: 'monospace', fill: '#73726c' }}
                        axisLine={false}
                        tickLine={false}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Range filter pills */}
                <div className="flex flex-wrap gap-2 mt-4">
                  {report.priceDistribution.map(p => (
                    <button
                      key={p.range}
                      onClick={() => setActiveRange(activeRange === p.range ? null : p.range)}
                      className={cn(
                        'px-3 py-1.5 border-2 border-black font-mono text-[9px] uppercase transition-all',
                        activeRange === p.range
                          ? 'bg-vibrant-coral text-white shadow-none translate-x-0.5 translate-y-0.5'
                          : 'bg-white shadow-brutal-sm hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none'
                      )}
                    >
                      {p.range} ({p.count})
                    </button>
                  ))}
                </div>
              </div>
            </section>

            {/* ── Scatter Plot ─────────────────────────────────── */}
            <section>
              <div className="font-mono text-[10px] uppercase tracking-widest opacity-60 mb-4">
                Price vs. Rating — Full Market
              </div>
              <div className="bg-white border-4 border-black p-6">
                <PriceScatterPlot data={report.scatterData} marketAvg={report.marketAvg} />
              </div>
            </section>

          </div>

          {/* ── Footer ───────────────────────────────────────────── */}
          <div className="px-8 py-5 border-t-4 border-black bg-white flex items-center justify-between">
            <p className="font-mono text-[10px] uppercase opacity-40">
              Data is anonymized · Updated weekly
            </p>
            <button
              onClick={onClose}
              className="px-6 py-2 bg-shadow-grey text-white font-display uppercase text-sm border-2 border-black shadow-brutal-sm hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all"
            >
              Close Report
            </button>
          </div>

        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
