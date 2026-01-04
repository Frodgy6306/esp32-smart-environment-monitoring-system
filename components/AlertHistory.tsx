
import React from 'react';
import { SensorData } from '../types';
import { Bell, AlertTriangle, CheckCircle, Clock } from 'lucide-react';

interface AlertHistoryProps {
  data: SensorData[];
}

const AlertHistory: React.FC<AlertHistoryProps> = ({ data }) => {
  const alerts = data.filter(d => d.toxicGas > 400 || d.co2 > 1000).reverse();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Alert History</h2>
          <p className="text-slate-400 text-sm">Logging all threshold violations for MQ2 and MG811 sensors.</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 px-4 py-2 rounded-lg text-sm font-medium">
          Total Alerts: {alerts.length}
        </div>
      </div>

      <div className="bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden">
        {alerts.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <CheckCircle className="mx-auto text-emerald-500 mb-2" size={40} />
            <p className="text-lg font-semibold text-slate-300">Environment is healthy</p>
            <p className="text-slate-500 text-sm">No historical alerts found in current session data.</p>
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-800/50 text-slate-400 text-[10px] uppercase font-bold tracking-widest border-b border-slate-800">
                <th className="px-6 py-4">Time</th>
                <th className="px-6 py-4">Sensor</th>
                <th className="px-6 py-4">Value</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Action Taken</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {alerts.map((alert, i) => (
                <tr key={i} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-6 py-4 text-sm font-medium flex items-center gap-2">
                    <Clock size={14} className="text-slate-500" />
                    {alert.timestamp}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-300">
                    {alert.toxicGas > 400 ? 'MQ2 (Toxic Gas)' : 'MG811 (CO2)'}
                  </td>
                  <td className="px-6 py-4 text-sm font-mono text-indigo-400">
                    {alert.toxicGas > 400 ? alert.toxicGas.toFixed(0) : alert.co2.toFixed(0)} ppm
                  </td>
                  <td className="px-6 py-4">
                    <span className="flex items-center gap-1.5 text-xs font-bold text-red-500 bg-red-500/10 px-2 py-1 rounded-full w-fit">
                      <AlertTriangle size={10} />
                      DANGER
                    </span>
                  </td>
                  <td className="px-6 py-4 text-xs text-slate-500 italic">
                    AI Notified • User Alerted
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default AlertHistory;
