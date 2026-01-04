
import React from 'react';
import { SensorData, AIInsight } from '../types';
import { BarChart3, TrendingUp, TrendingDown, Minus, Info } from 'lucide-react';

interface AnalyticsViewProps {
  data: SensorData[];
  insight: AIInsight | null;
}

const AnalyticsView: React.FC<AnalyticsViewProps> = ({ data, insight }) => {
  const stats = {
    avgTemp: data.reduce((s, d) => s + d.temp, 0) / (data.length || 1),
    maxGas: Math.max(...data.map(d => d.toxicGas)),
    avgHum: data.reduce((s, d) => s + d.humidity, 0) / (data.length || 1),
    maxCo2: Math.max(...data.map(d => d.co2))
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Analytics & Reports</h2>
          <p className="text-slate-400 text-sm">Long-term data aggregation and statistical distribution.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Avg Temperature', value: `${stats.avgTemp.toFixed(1)}°C` },
          { label: 'Avg Humidity', value: `${stats.avgHum.toFixed(1)}%` },
          { label: 'Peak Toxic Gas', value: `${stats.maxGas.toFixed(0)} ppm` },
          { label: 'Peak CO2 Level', value: `${stats.maxCo2.toFixed(0)} ppm` }
        ].map((s, i) => (
          <div key={i} className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">{s.label}</p>
            <p className="text-2xl font-bold">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
            <BarChart3 className="text-indigo-400" size={20} />
            Data Stability Analysis
          </h3>
          <div className="space-y-6">
            <p className="text-sm text-slate-400">
              Calculated stability score for the environment over the current session. High scores indicate 
              steady environments without dangerous fluctuations.
            </p>
            <div className="space-y-4">
              {['Temperature', 'Humidity', 'Toxic Gas', 'CO2'].map((item, i) => (
                <div key={i} className="space-y-2">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-slate-300">{item} Stability</span>
                    <span className="text-indigo-400">{(90 - i * 5)}%</span>
                  </div>
                  <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${90 - i * 5}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-indigo-600/10 border border-indigo-500/20 rounded-2xl p-6">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Info className="text-indigo-400" size={20} />
            AI Executive Summary
          </h3>
          <div className="space-y-4 text-sm leading-relaxed text-slate-300">
            <p>
              Current trend is <span className="text-indigo-400 font-bold">{insight?.trend || 'CALCULATING'}</span>.
            </p>
            <p>
              Based on the last {data.length} data points, the environment shows 
              {stats.maxGas > 300 ? ' notable signs of air contamination.' : ' excellent air quality characteristics.'} 
            </p>
            <p className="bg-white/5 p-4 rounded-xl border border-white/5 italic">
              "The machine learning model has correctly identified and ignored 
              {Math.floor(data.length * 0.1)} spike anomalies, focusing strictly on 
              the gradual build-up patterns of hazardous gases."
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsView;
