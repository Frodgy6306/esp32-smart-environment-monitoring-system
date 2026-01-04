
import React from 'react';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip,
  ReferenceArea
} from 'recharts';
import { SensorData } from '../types';

interface EnvironmentalChartProps {
  data: SensorData[];
  types: ('temp' | 'humidity' | 'toxicGas' | 'co2')[];
}

const EnvironmentalChart: React.FC<EnvironmentalChartProps> = ({ data, types }) => {
  const colorMap = {
    temp: '#fb923c',
    humidity: '#60a5fa',
    toxicGas: '#10b981',
    co2: '#a855f7'
  };

  const labelMap = {
    temp: '°C',
    humidity: '%',
    toxicGas: 'ppm',
    co2: 'ppm'
  };

  const lastPoint = data[data.length - 1];
  const isStale = lastPoint?.isStale;

  return (
    <div className="relative w-100 h-full">
      {isStale && (
        <div className="absolute top-1 right-2 z-20 flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-slate-950/80 border border-slate-800 backdrop-blur-sm">
          <div className="w-1.5 h-1.5 rounded-full bg-slate-500 animate-pulse" />
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">No Recording</span>
        </div>
      )}
      
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
          <defs>
            {types.map(type => (
              <filter key={`glow-${type}`} id={`glow-${type}`} x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            ))}
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
          <XAxis 
            dataKey="timestamp" 
            stroke="#475569" 
            fontSize={9} 
            tickLine={false} 
            axisLine={false}
            tick={{ fill: '#64748b' }}
            minTickGap={30}
          />
          <YAxis 
            stroke="#475569" 
            fontSize={9} 
            tickLine={false} 
            axisLine={false}
            tick={{ fill: '#64748b' }}
            domain={['auto', 'auto']}
            padding={{ top: 10, bottom: 10 }}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: '#0f172a', 
              border: '1px solid #334155',
              borderRadius: '12px',
              fontSize: '11px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)'
            }}
            formatter={(value: any, name: string, props: any) => {
              const isPointStale = props.payload.isStale;
              const val = isPointStale ? "No Recording" : `${value} ${labelMap[name as keyof typeof labelMap]}`;
              return [val, name.toUpperCase()];
            }}
            itemStyle={{ fontWeight: '600' }}
            cursor={{ stroke: '#334155', strokeWidth: 1 }}
          />
          
          {types.map(type => (
            <Line
              key={type}
              type="monotone"
              dataKey={type}
              stroke={colorMap[type]}
              strokeWidth={3}
              dot={false}
              activeDot={{ r: 5, strokeWidth: 0, fill: colorMap[type] }}
              animationDuration={800}
              filter={`url(#glow-${type})`}
              // Dashed line if it's the synthetic "No Recording" extension
              strokeDasharray={isStale ? "5 5" : "0"}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default EnvironmentalChart;
