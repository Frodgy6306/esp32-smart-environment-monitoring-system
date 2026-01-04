import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { fetchRoomData, getStoredRooms, saveRooms } from './services/dataService';
import { analyzeTrends } from './services/geminiService';
import { SensorData, AIInsight, AppView, RoomConfig } from './types';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import StatCard from './components/StatCard';
import EnvironmentalChart from './components/EnvironmentalChart';
import AIInsightsPanel from './components/AIInsightsPanel';
import AlertHistory from './components/AlertHistory';
import SensorsConfig from './components/SensorsConfig';
import AnalyticsView from './components/AnalyticsView';
import { AlertCircle, Wind, Thermometer, Droplets, Activity, WifiOff, Clock } from 'lucide-react';

const FETCH_INTERVAL = 30000; 
const AI_INTERVAL = 300000; // 5 minutes
const STALE_MINUTES = 5;

const App: React.FC = () => {
  const [rooms, setRooms] = useState<RoomConfig[]>(getStoredRooms());
  const [activeRoomId, setActiveRoomId] = useState<string>(rooms[0]?.id || '');
  const [allData, setAllData] = useState<Record<string, SensorData[]>>({});
  const [allInsights, setAllInsights] = useState<Record<string, AIInsight | null>>({});
  const [activeTab, setActiveTab] = useState<AppView>('dashboard');
  const [isLoading, setIsLoading] = useState(true);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [isLocked, setIsLocked] = useState<boolean>(() => localStorage.getItem('ecoguard_locked') === 'true');
  
  const lastAiUpdateTimes = useRef<Record<string, number>>({});

  const activeRoom = useMemo(() => rooms.find(r => r.id === activeRoomId) || rooms[0], [activeRoomId, rooms]);

  const refreshData = useCallback(async (forceAi = false) => {
    if (rooms.length === 0) {
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    const newData = { ...allData };
    const newInsights = { ...allInsights };
    const now = Date.now();

    for (const room of rooms) {
      try {
        const roomData = await fetchRoomData(room);
        newData[room.id] = roomData;

        const lastReading = roomData[roomData.length - 1];
        const ageMin = lastReading ? (now - lastReading.date.getTime()) / 60000 : 999;
        const isStale = ageMin >= STALE_MINUTES || lastReading?.isMock;

        const lastAiTime = lastAiUpdateTimes.current[room.id] || 0;
        const isAiDue = (now - lastAiTime) >= AI_INTERVAL;
        
        if ((forceAi && room.id === activeRoomId) || (isAiDue && roomData.length > 0)) {
          setIsAiLoading(true);
          const result = await analyzeTrends(roomData.slice(-15), isStale, Math.round(ageMin));
          newInsights[room.id] = result;
          lastAiUpdateTimes.current[room.id] = now;
          setIsAiLoading(false);
        }
      } catch (err) {
        console.error(`Error processing room ${room.name}:`, err);
      }
    }

    setAllData(newData);
    setAllInsights(newInsights);
    setLastUpdate(new Date());
    setIsLoading(false);
  }, [activeRoomId, allData, allInsights, rooms]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    refreshData(true);
    const dataInterval = setInterval(() => refreshData(false), FETCH_INTERVAL);
    return () => {
      clearInterval(timer);
      clearInterval(dataInterval);
    };
  }, [refreshData]);

  const activeData = allData[activeRoomId] || [];
  const current: SensorData = activeData[activeData.length - 1] || { 
    timestamp: '--:--:--', date: new Date(0), temp: 0, humidity: 0, toxicGas: 0, co2: 0, roomId: activeRoomId 
  };

  const ageSeconds = Math.floor((currentTime.getTime() - current.date.getTime()) / 1000);
  const isSystemDown = ageSeconds / 60 >= STALE_MINUTES || current.isMock;
  const insight = allInsights[activeRoomId] || null;

  return (
    <div className="flex h-screen overflow-hidden bg-slate-950 text-slate-100">
      <Sidebar 
        status={isSystemDown ? 'DANGER' : (insight?.status || 'SAFE')} 
        activeTab={activeTab} 
        onTabChange={setActiveTab}
        activeRoomId={activeRoomId}
        onRoomChange={setActiveRoomId}
        roomInsights={allInsights}
        rooms={rooms}
        isLocked={isLocked}
        toggleLock={() => {
          const s = !isLocked;
          setIsLocked(s);
          localStorage.setItem('ecoguard_locked', String(s));
        }}
      />
      
      <main className="flex-1 flex flex-col overflow-y-auto relative">
        <Header 
          lastUpdate={lastUpdate} 
          lastDataTimestamp={current.date}
          onRefresh={() => refreshData(true)} 
          isLoading={isLoading || isAiLoading}
          roomName={activeRoom?.name || 'Sensors'}
          isSystemDown={isSystemDown}
          isLocked={isLocked}
        />

        <div className="p-4 md:p-8 max-w-7xl mx-auto w-full space-y-6">
          {activeTab === 'dashboard' && isSystemDown && rooms.length > 0 && (
            <div className="bg-red-950/20 border border-red-500/50 p-6 rounded-3xl flex flex-col md:flex-row items-center gap-6 animate-pulse">
              <div className="w-16 h-16 bg-red-600 rounded-2xl flex items-center justify-center shrink-0 shadow-lg shadow-red-500/20">
                <WifiOff className="text-white" size={32} />
              </div>
              <div className="text-center md:text-left space-y-1">
                <h3 className="text-xl font-bold text-white uppercase tracking-tighter">Node Heartbeat Lost</h3>
                <p className="text-red-200/70 text-sm max-w-xl">
                  Communication with <strong>{activeRoom.name}</strong> was interrupted {Math.floor(ageSeconds / 60)}m ago. AI analysis is currently restricted to last-known-state diagnostics.
                </p>
              </div>
              <button 
                onClick={() => refreshData(true)}
                className="ml-auto bg-red-600 hover:bg-red-500 text-white px-6 py-2 rounded-xl font-bold transition-all active:scale-95"
              >
                Sync Link
              </button>
            </div>
          )}

          {activeTab === 'dashboard' && rooms.length > 0 && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard title="Temperature" value={isSystemDown ? '--' : `${current.temp.toFixed(1)}°C`} icon={<Thermometer className="text-orange-400" />} trend={current.temp > 30 ? 'high' : 'normal'} color="border-orange-500/20" />
                <StatCard title="Humidity" value={isSystemDown ? '--' : `${current.humidity.toFixed(1)}%`} icon={<Droplets className="text-blue-400" />} trend={current.humidity > 70 ? 'high' : 'normal'} color="border-blue-500/20" />
                <StatCard title="Gas (MQ2)" value={isSystemDown ? '--' : current.toxicGas.toFixed(0)} icon={<Wind className="text-emerald-400" />} trend={current.toxicGas > 300 ? 'high' : 'normal'} color="border-emerald-500/20" unit="ppm" />
                <StatCard title="CO2 (MG811)" value={isSystemDown ? '--' : current.co2.toFixed(0)} icon={<Activity className="text-purple-400" />} trend={current.co2 > 1000 ? 'high' : 'normal'} color="border-purple-500/20" unit="ppm" />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                  <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-6 h-[400px]">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
                        <Activity size={14} /> Telemetry Stream
                      </h3>
                      <div className="flex gap-2">
                         <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                         <span className="text-[10px] text-slate-400 font-bold uppercase">Real-time</span>
                      </div>
                    </div>
                    <EnvironmentalChart data={activeData.slice(-30)} types={['temp', 'humidity', 'toxicGas', 'co2']} />
                  </div>
                </div>
                <div className="lg:col-span-1">
                  <AIInsightsPanel insight={insight} isSystemDown={isSystemDown} nextUpdateIn={0} currentData={current} />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'alerts' && <AlertHistory data={activeData} />}
          {activeTab === 'config' && (
            <SensorsConfig 
              rooms={rooms} 
              onAddRoom={(r) => {
                const updated = [...rooms, r];
                setRooms(updated);
                saveRooms(updated);
                setActiveRoomId(r.id);
              }} 
              onDeleteRoom={(id) => {
                const updated = rooms.filter(r => r.id !== id);
                setRooms(updated);
                saveRooms(updated);
                if (activeRoomId === id) setActiveRoomId(updated[0]?.id || '');
              }} 
              isLocked={isLocked}
            />
          )}
          {activeTab === 'analytics' && <AnalyticsView data={activeData} insight={insight} />}
          
          {rooms.length === 0 && (
            <div className="flex flex-col items-center justify-center py-32 text-center">
               <div className="w-20 h-20 bg-slate-900 rounded-full flex items-center justify-center mb-6">
                 <Clock size={40} className="text-slate-600" />
               </div>
               <h2 className="text-2xl font-bold mb-2">No Nodes Configured</h2>
               <p className="text-slate-500 max-w-md mb-8">Ready to start monitoring? Register your ESP32 environmental node in the Config section.</p>
               <button onClick={() => setActiveTab('config')} className="bg-indigo-600 hover:bg-indigo-500 px-8 py-3 rounded-2xl font-bold transition-all shadow-xl shadow-indigo-600/20">Go to Configuration</button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default App;