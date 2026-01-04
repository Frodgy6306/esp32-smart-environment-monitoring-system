
import React, { useState, useEffect } from 'react';
import { RefreshCw, Clock, MapPin, WifiOff, Activity, ShieldCheck, Link, Check } from 'lucide-react';

interface HeaderProps {
  lastUpdate: Date;
  lastDataTimestamp: Date;
  onRefresh: () => void;
  isLoading: boolean;
  roomName: string;
  isSystemDown?: boolean;
  isLocked?: boolean;
}

const Header: React.FC<HeaderProps> = ({ lastUpdate, lastDataTimestamp, onRefresh, isLoading, roomName, isSystemDown, isLocked }) => {
  const [ageSeconds, setAgeSeconds] = useState(0);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const diff = Math.floor((now.getTime() - lastDataTimestamp.getTime()) / 1000);
      setAgeSeconds(Math.max(0, diff));
    }, 1000);
    return () => clearInterval(timer);
  }, [lastDataTimestamp]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatAge = (totalSeconds: number) => {
    if (lastDataTimestamp.getTime() === 0) return "--:--";
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m}m ${s}s`;
  };

  const isStale = ageSeconds > 30;

  return (
    <header className="h-20 bg-slate-950/50 backdrop-blur-md border-b border-slate-800 px-6 flex items-center justify-between sticky top-0 z-10">
      <div className="flex flex-col">
        <div className="flex items-center gap-2">
          <MapPin size={18} className={isSystemDown ? "text-red-500" : "text-indigo-400"} />
          <h2 className="text-xl font-bold">{roomName} Monitor</h2>
          {isLocked && (
            <div className="flex items-center gap-1 bg-emerald-500/10 text-emerald-500 text-[10px] font-black px-2 py-0.5 rounded border border-emerald-500/20 uppercase tracking-tighter">
              <ShieldCheck size={10} />
              Production
            </div>
          )}
        </div>
        <div className="flex items-center gap-4 mt-1">
          <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
            <Activity size={10} className={isStale ? "text-slate-600" : "text-emerald-500"} />
            <span>Data Age: <span className={ageSeconds > 60 ? "text-amber-500" : isSystemDown ? "text-red-500" : "text-slate-200"}>{formatAge(ageSeconds)}</span></span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={handleCopyLink}
          className="flex items-center gap-2 px-3 py-2 bg-slate-800/50 hover:bg-slate-700 border border-slate-700 rounded-lg text-xs font-bold transition-all text-slate-300"
          title="Copy App URL"
        >
          {copied ? <Check size={14} className="text-emerald-500" /> : <Link size={14} />}
          {copied ? 'Copied!' : 'Copy App Link'}
        </button>

        <button
          onClick={onRefresh}
          disabled={isLoading}
          className={`flex items-center gap-2 px-4 py-2 transition-all border rounded-lg text-sm font-medium ${
            isSystemDown 
              ? 'bg-red-500 text-white border-red-400 shadow-lg shadow-red-500/20' 
              : 'bg-indigo-600/10 hover:bg-indigo-600 border-indigo-500/30 text-indigo-400 hover:text-white'
          } disabled:opacity-50`}
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          {isSystemDown ? 'Emergency Resync' : 'Sync Pulse'}
        </button>
        
        <div className="flex items-center gap-3 pl-4 border-l border-slate-800">
          <div className="text-right hidden lg:block">
            <p className="text-sm font-bold">Node Pulse</p>
            <p className={`text-[10px] font-bold uppercase ${isSystemDown ? 'text-red-500' : isStale ? 'text-amber-500' : 'text-emerald-500'}`}>
              {isSystemDown ? 'STASIS' : isStale ? 'LAGGING' : 'LIVE'}
            </p>
          </div>
          <div className={`w-10 h-10 rounded-full bg-slate-800 border flex items-center justify-center overflow-hidden transition-colors ${
            isSystemDown ? 'border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.2)]' : isStale ? 'border-amber-500/30' : 'border-emerald-500/30'
          }`}>
            {isSystemDown ? (
              <WifiOff className="text-red-500 w-5 h-5 animate-pulse" />
            ) : (
              <Activity className={`${isStale ? 'text-amber-500 opacity-50' : 'text-emerald-500'} w-5 h-5`} />
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
