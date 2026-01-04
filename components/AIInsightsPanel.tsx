
import React from 'react';
import { AIInsight, SensorData } from '../types';
import { BrainCircuit, TrendingUp, TrendingDown, Minus, ShieldCheck, AlertTriangle, Clock, Activity, ZapOff, Sparkles } from 'lucide-react';

interface AIInsightsPanelProps {
  insight: AIInsight | null;
  currentData: SensorData;
  nextUpdateIn: number;
  isSystemDown?: boolean;
}

const AIInsightsPanel: React.FC<AIInsightsPanelProps> = ({ insight, currentData, nextUpdateIn, isSystemDown }) => {
  const formatCountdown = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const getTrendIcon = () => {
    if (isSystemDown) return <ZapOff className="text-red-400" size={16} />;
    if (!insight) return <Minus className="text-slate-400" size={16} />;
    switch (insight.trend) {
      case 'RISING': return <TrendingUp className="text-red-400" size={16} />;
      case 'FALLING': return <TrendingDown className="text-emerald-400" size={16} />;
      default: return <Minus className="text-slate-400" size={16} />;
    }
  };

  return (
    <div className={`border rounded-2xl p-6 flex flex-col h-full overflow-hidden transition-all duration-500 ${
      isSystemDown 
        ? 'bg-red-500/10 border-red-500/40 shadow-2xl shadow-red-500/10' 
        : 'bg-indigo-600/5 border-indigo-500/20'
    }`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold flex items-center gap-2">
          <BrainCircuit className={isSystemDown ? "text-red-400 animate-pulse" : "text-indigo-400"} size={20} />
          {isSystemDown ? "System Diagnostic" : "AI Intelligence"}
        </h3>
        <div className="flex items-center gap-1.5 px-2 py-1 bg-slate-900 border border-slate-800 rounded text-[9px] font-bold text-slate-400 uppercase">
          <Clock size={10} />
          {isSystemDown ? "URGENT" : `Next: ${formatCountdown(nextUpdateIn)}`}
        </div>
      </div>

      {!insight ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4">
          <div className="w-12 h-12 bg-slate-800 rounded-full flex items-center justify-center animate-pulse">
            <BrainCircuit className="text-slate-600" />
          </div>
          <p className="text-slate-500 text-xs italic">Syncing with remote node...</p>
        </div>
      ) : (
        <div className="flex-1 space-y-6 overflow-y-auto pr-2 custom-scrollbar">
          {/* Internal Monologue Section */}
          <div className={`p-4 rounded-xl border-l-2 italic text-[11px] leading-relaxed relative overflow-hidden ${
            isSystemDown ? 'bg-red-950/20 border-red-500/50 text-red-200/70' : 'bg-slate-900/50 border-indigo-500/50 text-slate-400'
          }`}>
            <Sparkles className="absolute -top-1 -right-1 opacity-20" size={24} />
            <span className="font-bold text-[9px] uppercase tracking-widest block mb-1 opacity-50">Internal Monologue:</span>
            "{insight.thoughtProcess || (isSystemDown ? "Wait, I'm not seeing any new data packets..." : "Scanning data clusters for anomalies...")}"
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 uppercase tracking-widest">
              <span>{isSystemDown ? "Communication Health" : "Primary Trend"}</span>
              <div className="flex items-center gap-1">
                {getTrendIcon()}
                <span className={isSystemDown || insight.trend === 'RISING' ? 'text-red-400' : 'text-slate-300'}>
                  {isSystemDown ? "OFFLINE" : insight.trend}
                </span>
              </div>
            </div>
            <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-1000 ${
                  isSystemDown || insight.status === 'DANGER' ? 'bg-red-500' : insight.status === 'WARNING' ? 'bg-amber-500' : 'bg-emerald-500'
                }`}
                style={{ width: `${isSystemDown ? 100 : insight.confidence * 100}%` }}
              />
            </div>
          </div>

          <div className={`p-4 rounded-xl border animate-in slide-in-from-bottom-2 duration-700 ${
            isSystemDown || insight.status === 'DANGER' ? 'bg-red-500/10 border-red-500/20 shadow-lg' : 
            insight.status === 'WARNING' ? 'bg-amber-500/10 border-amber-500/20' : 
            'bg-emerald-500/10 border-emerald-500/20'
          }`}>
            <div className="flex items-start gap-3">
              {isSystemDown ? (
                <ZapOff className="text-red-500 shrink-0" size={20} />
              ) : insight.status === 'SAFE' ? (
                <ShieldCheck className="text-emerald-500 shrink-0" size={20} />
              ) : (
                <AlertTriangle className={insight.status === 'DANGER' ? 'text-red-500 animate-bounce' : 'text-amber-500'} size={20} />
              )}
              <div className="text-xs leading-relaxed">
                <span className="font-bold block mb-1 text-slate-100 uppercase text-[9px]">
                  {isSystemDown ? "Diagnostic Report:" : "AI Analysis:"}
                </span>
                {insight.prediction}
              </div>
            </div>
          </div>

          <div className="bg-slate-900/40 p-4 rounded-xl border border-slate-800 space-y-2">
            <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">
              {isSystemDown ? "Critical Checklist" : "Actionable Steps"}
            </h4>
            <ul className="text-[10px] space-y-1.5 text-slate-400">
              {isSystemDown ? (
                <>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                    Verify ESP32 Power (USB/Battery).
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                    Confirm Router connection.
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                    Check Google Script triggers.
                  </li>
                </>
              ) : (
                <>
                  <li className="flex items-center gap-2">
                    <div className={`w-1 h-1 rounded-full ${currentData.co2 > 800 ? 'bg-indigo-500' : 'bg-slate-600'}`} />
                    {currentData.co2 > 800 ? 'Open windows for fresh air.' : 'CO2 levels are optimal.'}
                  </li>
                  <li className="flex items-center gap-2">
                    <div className={`w-1 h-1 rounded-full ${insight.trend === 'RISING' ? 'bg-red-500' : 'bg-slate-600'}`} />
                    {insight.trend === 'RISING' ? 'Identify pollution source.' : 'Pollution levels are stable.'}
                  </li>
                </>
              )}
            </ul>
          </div>
        </div>
      )}

      <div className="mt-6 pt-4 border-t border-slate-800 text-[9px] text-slate-600 text-center italic">
        {isSystemDown 
          ? "I am currently in Diagnostic Mode waiting for data restoration."
          : "AI Core active. Monitoring environmental stability."}
      </div>
    </div>
  );
};

export default AIInsightsPanel;
