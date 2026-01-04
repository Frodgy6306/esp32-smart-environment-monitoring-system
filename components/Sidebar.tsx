
import React from 'react';
import { LayoutDashboard, ShieldCheck, Settings, Bell, Info, MapPin, Lock, Unlock } from 'lucide-react';
import { AppView, AIInsight, RoomConfig } from '../types';

interface SidebarProps {
  status: 'SAFE' | 'WARNING' | 'DANGER';
  activeTab: AppView;
  onTabChange: (tab: AppView) => void;
  activeRoomId: string;
  onRoomChange: (id: string) => void;
  roomInsights: Record<string, AIInsight | null>;
  rooms: RoomConfig[];
  isLocked: boolean;
  toggleLock: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  status, 
  activeTab, 
  onTabChange, 
  activeRoomId, 
  onRoomChange,
  roomInsights,
  rooms,
  isLocked,
  toggleLock
}) => {
  const statusConfig = {
    SAFE: { color: 'bg-emerald-500', text: 'Healthy' },
    WARNING: { color: 'bg-amber-500', text: 'Warning' },
    DANGER: { color: 'bg-red-500', text: 'Danger' }
  };

  const menuItems: { icon: any; label: string; value: AppView }[] = [
    { icon: LayoutDashboard, label: 'Dashboard', value: 'dashboard' },
    { icon: Bell, label: 'Alert History', value: 'alerts' },
    { icon: Info, label: 'Analytics', value: 'analytics' },
    { icon: Settings, label: 'Config', value: 'config' }
  ];

  return (
    <div className="w-64 bg-slate-900 border-r border-slate-800 hidden md:flex flex-col p-6 relative">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
          <ShieldCheck className="text-white h-6 w-6" />
        </div>
        <div>
          <h1 className="font-bold text-lg tracking-tight">EcoGuard</h1>
          <p className="text-[10px] uppercase text-slate-500 font-bold tracking-widest">v1.0.0 Production</p>
        </div>
      </div>

      <div className="mb-8">
        <h3 className="text-[10px] uppercase text-slate-500 font-bold tracking-widest mb-4 px-2">Rooms</h3>
        <div className="space-y-1">
          {rooms.map(room => {
            const roomInsight = roomInsights[room.id];
            const roomStatus = roomInsight?.status || 'SAFE';
            return (
              <button
                key={room.id}
                onClick={() => {
                  onRoomChange(room.id);
                  onTabChange('dashboard');
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-all text-sm font-medium ${
                  activeRoomId === room.id 
                    ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/20' 
                    : 'text-slate-400 hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-2">
                  <MapPin size={14} className={activeRoomId === room.id ? 'text-indigo-400' : 'text-slate-600'} />
                  <span className="truncate max-w-[120px]">{room.name}</span>
                </div>
                <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${statusConfig[roomStatus].color} ${roomStatus !== 'SAFE' ? 'animate-pulse' : ''}`} />
              </button>
            );
          })}
        </div>
      </div>

      <nav className="flex-1 space-y-1">
        <h3 className="text-[10px] uppercase text-slate-500 font-bold tracking-widest mb-4 px-2">Navigation</h3>
        {menuItems.map((item) => (
          <button
            key={item.value}
            onClick={() => onTabChange(item.value)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all group ${
              activeTab === item.value 
                ? 'bg-slate-800 text-slate-100' 
                : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800'
            }`}
          >
            <item.icon size={16} className={activeTab === item.value ? 'text-indigo-400' : ''} />
            <span className="text-sm">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="mt-auto space-y-3 pt-6 border-t border-slate-800">
        <button 
          onClick={toggleLock}
          className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${
            isLocked ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-slate-800 text-slate-400'
          }`}
        >
          <div className="flex items-center gap-2">
            {isLocked ? <Lock size={12} /> : <Unlock size={12} />}
            {isLocked ? 'Prod Locked' : 'Editing Mode'}
          </div>
          <div className={`w-2 h-2 rounded-full ${isLocked ? 'bg-emerald-500' : 'bg-amber-500'}`} />
        </button>

        <div className="p-4 rounded-xl border border-white/5 bg-white/5">
          <div className="flex items-center gap-2 mb-1">
            <div className={`w-2 h-2 rounded-full ${statusConfig[status].color} animate-pulse`} />
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Node Status</span>
          </div>
          <p className="font-bold text-xs">{statusConfig[status].text}</p>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
