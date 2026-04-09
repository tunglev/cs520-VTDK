import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import type { ScatterPoint } from '../types';

interface PriceScatterPlotProps {
  data: ScatterPoint[];
  marketAvg: number;
}

const CustomDot = (props: any) => {
  const { cx, cy, payload } = props;

  if (payload.isCurrent) {
    return (
      <g>
        <circle cx={cx} cy={cy} r={12} fill="#FF6F59" stroke="#231F20" strokeWidth={2} />
        <circle cx={cx} cy={cy} r={4} fill="#231F20" />
      </g>
    );
  }

  return (
    <circle
      cx={cx}
      cy={cy}
      r={5}
      fill="#231F20"
      fillOpacity={0.2}
      stroke="#231F20"
      strokeWidth={1}
      strokeOpacity={0.35}
    />
  );
};

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const d: ScatterPoint = payload[0]?.payload;

  return (
    <div className="bg-shadow-grey text-white p-3 border-2 border-black text-xs font-mono">
      <div className="font-display uppercase text-sm mb-1">{d.name}</div>
      <div className="opacity-70">
        ${d.price}/hr · ⭐ {d.rating} · {d.reviews} reviews
      </div>
      {d.isCurrent && (
        <div className="mt-1 text-vibrant-coral uppercase font-bold">← This freelancer</div>
      )}
    </div>
  );
};

export const PriceScatterPlot = ({ data, marketAvg }: PriceScatterPlotProps) => {
  return (
    <div className="w-full">
      {/* Legend */}
      <div className="flex items-center gap-6 mb-4 text-[10px] font-mono uppercase">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-vibrant-coral border-2 border-black" />
          <span>This freelancer</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-shadow-grey opacity-25 border border-black" />
          <span>Market</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 border-t-2 border-dashed border-vibrant-coral" />
          <span>Avg ${marketAvg}/hr</span>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={240}>
        <ScatterChart margin={{ top: 8, right: 16, bottom: 24, left: 0 }}>
          <XAxis
            dataKey="price"
            type="number"
            name="Price"
            domain={['dataMin - 10', 'dataMax + 10']}
            tick={{ fontSize: 10, fontFamily: 'monospace', fill: '#73726c' }}
            tickFormatter={(v) => `$${v}`}
            label={{
              value: 'Hourly Rate (USD)',
              position: 'insideBottom',
              offset: -12,
              fontSize: 10,
              fill: '#73726c',
              fontFamily: 'monospace',
            }}
          />
          <YAxis
            dataKey="rating"
            type="number"
            name="Rating"
            domain={[3.8, 5.1]}
            tick={{ fontSize: 10, fontFamily: 'monospace', fill: '#73726c' }}
            tickFormatter={(v) => v.toFixed(1)}
            label={{
              value: 'Rating',
              angle: -90,
              position: 'insideLeft',
              offset: 12,
              fontSize: 10,
              fill: '#73726c',
              fontFamily: 'monospace',
            }}
          />
          <Tooltip
            content={<CustomTooltip />}
            cursor={{ strokeDasharray: '3 3', stroke: '#73726c' }}
          />
          <ReferenceLine
            x={marketAvg}
            stroke="#FF6F59"
            strokeDasharray="6 3"
            strokeWidth={1.5}
            label={{
              value: `Avg $${marketAvg}`,
              position: 'top',
              fontSize: 9,
              fill: '#FF6F59',
              fontFamily: 'monospace',
            }}
          />
          <Scatter data={data} shape={<CustomDot />} />
        </ScatterChart>
      </ResponsiveContainer>

      <div className="mt-1 text-[10px] font-mono uppercase opacity-50 text-center">
        Price vs. rating · {data.length} freelancers in this category
      </div>
    </div>
  );
};
