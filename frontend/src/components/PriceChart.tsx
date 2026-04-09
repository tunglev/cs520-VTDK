import { Info } from 'lucide-react';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { PRICE_DISTRIBUTION } from '../data/mockData';

interface PriceChartProps {
  activeRange: string | null;
}

export const PriceChart = ({ activeRange }: PriceChartProps) => {
  return (
    <div className="w-full h-48 mt-8 bg-white border-4 border-black p-6 shadow-brutal">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-display uppercase text-xs tracking-widest flex items-center gap-2">
          <Info size={14} /> Price Distribution (USD/hr)
        </h3>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-vibrant-coral border border-black" />
            <span className="text-[10px] font-mono uppercase">Market Avg: $58/hr</span>
          </div>
          <span className="text-[10px] font-mono opacity-50 uppercase">Based on 122 results</span>
        </div>
      </div>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={PRICE_DISTRIBUTION}>
          <Tooltip 
            cursor={{ fill: 'transparent' }}
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                return (
                  <div className="bg-shadow-grey text-white p-2 border-2 border-black text-xs font-mono">
                    {payload[0].payload.range}: {payload[0].value} freelancers
                  </div>
                );
              }
              return null;
            }}
          />
          <Bar dataKey="count">
            {PRICE_DISTRIBUTION.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={entry.range === activeRange ? '#FF6F59' : '#231F20'} 
                className="transition-all duration-300"
              />
            ))}
          </Bar>
          <XAxis dataKey="range" hide />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
