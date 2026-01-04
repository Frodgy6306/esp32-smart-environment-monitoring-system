import React from 'react';

interface StatCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  trend: 'high' | 'normal';
  color: string;
  unit?: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, trend, color, unit }) => {
  return (
    <div className={`bg-slate-900/50 border ${color} p-5 rounded-2xl relative overflow-hidden group hover:bg-slate-800/80 transition-all duration-300`}>
      <div className="flex justify-between items-start mb-4">
        <div className="p-2 bg-slate-950 rounded-lg border border-slate-800">
          {icon}
        </div>
        {trend === 'high' && (
          <span className="bg-red-500/10 text-red-500 text-[10px] font-bold px-2 py-1 rounded-full border border-red-500/20">
            HIGH
          </span>
        )}
      </div>
      <div>
        <p className="text-slate-400 text-xs font-medium uppercase tracking-wider mb-1">{title}</p>
        <div className="flex items-baseline gap-2">
          <h4 className="text-2xl font-bold tracking-tight">{value}</h4>
          {unit && <span className="text-xs text-slate-500 font-medium">{unit}</span>}
        </div>
      </div>
      <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity">
        {/* Cast icon to ReactElement with expected size prop to satisfy TS */}
        {React.isValidElement(icon) && React.cloneElement(icon as React.ReactElement<{ size?: number }>, { size: 80 })}
      </div>
    </div>
  );
};

export default StatCard;