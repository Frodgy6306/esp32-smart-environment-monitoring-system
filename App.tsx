
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
import { AlertCircle, Wind, Thermometer, Droplets, Activity, MapPin, WifiOff, Clock, Lock, Unlock } from 'lucide-react';

const DATA_FETCH_INTERVAL = 30000; 
const AI_ANALYZE_INTERVAL = 300000;
const STALE_THRESHOLD_MINUTES = 5;

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
  const [isLocked, setIsLocked] = useState<boolean>(() => {
    return localStorage.getItem('ecoguard_locked') === 'true';
  });
  
  const lastAiUpdateTimes = useRef<Record<string, number>>({});
  const isInitialMount = useRef(true);

  const toggleLock = () => {
    const newState = !isLocked;
    setIsLocked(newState);
    localStorage.setItem('ecoguard_locked', String(newState));
  };

  const handleAddRoom = useCallback((room: RoomConfig) => {
    if (isLocked) return;
    setRooms(prev => {
      const updated = [...prev, room];
      saveRooms(updated);
      return updated;
    });
    if (rooms.length === 0) {
      setActiveRoomId(room.id);
    }
  }, [isLocked, rooms.length]);

  const handleDeleteRoom = useCallback((id: string) => {
    if (isLocked) return;
    setRooms(prev => {
      const updated = prev.filter(r => r.id !== id);
      saveRooms(updated);
      return updated;
    });
    if (activeRoomId === id) {
      const remaining = rooms.filter(r => r.id !== id);
      setActiveRoomId(remaining[0]?.id || '');
    }
  }, [activeRoomId, isLocked, rooms]);

  const activeRoom = useMemo(() => 
    rooms.find(r => r.id === activeRoomId) || rooms[0], 
  [activeRoomId, rooms]);

  const refreshAllRooms = useCallback(async (forceAi = false) => {
    if (rooms.length === 0) {
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    const newData: Record<string, SensorData[]> = { ...allData };
    const newInsights: Record<string, AIInsight | null> = { ...allInsights };
    const now = Date.now();

    for (const room of rooms) {
      const roomData = await fetchRoomData(room);
      newData[room.id] = roomData;

      const lastReading = roomData[roomData.length - 1];
      const ageMinutes = lastReading ? (now - lastReading.date.getTime()) / 60000 : 999;
      const isStale = ageMinutes >= STALE_THRESHOLD_MINUTES || lastReading?.isMock === true;

      const lastAi = lastAiUpdateTimes.current[room.id] || 0;
      const isDue = (now - lastAi) >= AI_ANALYZE_INTERVAL;
      
      const currentlyToldDown = allInsights[room.id]?.thoughtProcess?.toLowerCase().includes("reached") || 
                                allInsights[room.id]?.prediction?.toLowerCase().includes("down");

      const shouldRunAi = (forceAi && room.id === activeRoomId) || 
                         (isDue && roomData.length > 5) || 
                         (isStale && !currentlyToldDown);

      if (shouldRunAi && !isAiLoading) {
        setIsAiLoading(true);
        try {
          const result = await analyzeTrends(roomData.slice(-10), isStale, Math.round(ageMinutes));
          newInsights[room.id] = result;
          lastAiUpdateTimes.current[room.id] = now;
        } catch (e) {
          console.error(`AI failed for ${room.name}`, e);
        }
        setIsAiLoading(false);
      }
    }

    setAllData(newData);
    setAllInsights(newInsights);
    setLastUpdate(new Date());
    setIsLoading(false);
  }, [activeRoomId, allData, allInsights, isAiLoading, rooms]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (isInitialMount.current) {
      refreshAllRooms(true);
      isInitialMount.current = false;
    }
    const interval = setInterval(() => refreshAllRooms(false), DATA_FETCH_INTERVAL);
    return () => clearInterval(interval);
  }, [refreshAllRooms]);

  const activeData = useMemo(() => {
    return allData[activeRoomId] || [];
  }, [allData, activeRoomId]);

  const chartData = useMemo(() => activeData.slice(-40), [activeData]);

  const current: SensorData = activeData[activeData.length - 1] || { 
    timestamp: '--:--:--',
    date: new Date(0),
    temp: 0, 
    humidity: 0, 
    toxicGas: 0, 
    co2: 0, 
    roomId: activeRoomId 
  };

  const ageSeconds = Math.floor((currentTime.getTime() - current.date.getTime()) / 1000);
  const isSystemDown = (current.date.getTime() === 0 || ageSeconds / 60 >= STALE_THRESHOLD_MINUTES) || current.isMock;
  const insight = allInsights[activeRoomId] || null;

  const nextUpdateRemaining = useMemo(() => {
    const last = lastAiUpdateTimes.current[activeRoomId] || Date.now() - AI_ANALYZE_INTERVAL;
    return Math.max(0, Math.ceil((AI_ANALYZE_INTERVAL - (Date.now() - last)) / 1000));
  }, [activeRoomId, currentTime]);

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
        toggleLock={toggleLock}
      />
      <main className="flex-1 flex flex-col overflow-y-auto">
        <Header 
          lastUpdate={lastUpdate} 
          lastDataTimestamp={current.date}
          onRefresh={() => refreshAllRooms(true)} 
          isLoading={isLoading || isAiLoading}
          roomName={activeRoom?.name || 'No Room Selected'}
          isSystemDown={isSystemDown}
          isLocked={isLocked}
        />
        <div className="p-6 max-w-7xl mx-auto w-full">
          {activeTab === 'dashboard' && rooms.length > 0 && isSystemDown && (
            <div className="mb-6 bg-red-950/40 border-2 border-red-500 p-8 rounded-3xl flex flex-col md:flex-row items-center gap-8 animate-pulse shadow-2xl shadow-red-500/20 relative overflow-hidden">
               <div className="absolute top-0 right-0 p-4 opacity-10">
                 <Clock size={120} />
               </div>
              <div className="w-20 h-20 bg-red-600 rounded-full flex items-center justify-center shrink-0 border-4 border-red-400/50">
                <WifiOff className="text-white" size={40} />
              </div>
              <div className="flex-1 text-center md:text-left">
                <div className="flex flex-col md:flex-row items-center gap-3 mb-2">
                  <span className="bg-white text-red-600 text-[12px] font-black px-3 py-1 rounded tracking-tighter uppercase">Heartbeat Lost</span>
                  <h3 className="text-2xl font-black text-white">System Stasis: {Math.floor(ageSeconds / 60)}m {ageSeconds % 60}s Silence</h3>
                </div>
                <p className="text-red-100 text-lg leading-relaxed max-w-2xl">
                  {current.isMock 
                    ? `FATAL: The ESP32 data stream for ${activeRoom.name} has vanished. My internal clock has surpassed the 5-minute safety threshold. Please check the hardware immediately.`
                    : `CRITICAL: Communication severed. The node was last seen at ${current.timestamp}. AI diagnostic core is now locked onto this failure event.`
                  }
                </p>
                <div className="mt-4 flex gap-4 justify-center md:justify-start">
                   <button onClick={() => refreshAllRooms(true)} className="bg-white text-red-600 px-6 py-2 rounded-xl font-bold hover:bg-red-50 transition-colors">Force Resync</button>
                   <button onClick={() => setActiveTab('config')} className="bg-red-800/50 text-white border border-red-400/30 px-6 py-2 rounded-xl font-bold">Check Node Config</button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'alerts' && <AlertHistory data={activeData} />}
          {activeTab === 'config' && (
            <SensorsConfig 
              rooms={rooms} 
              onAddRoom={handleAddRoom} 
              onDeleteRoom={handleDeleteRoom} 
              isLocked={isLocked}
            />
          )}
          {activeTab === 'analytics' && <AnalyticsView data={activeData} insight={insight} />}
          
          {activeTab === 'dashboard' && (
            rooms.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-center space-y-4">
                <div className="w-16 h-16 bg-slate-900 rounded-full flex items-center justify-center">
                  <MapPin size={32} className="text-slate-600" />
                </div>
                <h2 className="text-xl font-bold">No Rooms Monitor Registered</h2>
                <p className="text-slate-500 max-w-md">Head over to the Config tab to register your first ESP32 node and start monitoring.</p>
                <button onClick={() => setActiveTab('config')} className="bg-indigo-600 px-6 py-2 rounded-lg font-bold">Configure Nodes</button>
              </div>
            ) : (
              <div className="space-y-6">
                {!isSystemDown && (insight?.status === 'DANGER' || current.toxicGas > 400 || current.co2 > 1000) && (
                  <div className="bg-red-500/10 border border-red-500/50 p-4 rounded-xl flex items-center gap-4 animate-in slide-in-from-top duration-300">
                    <AlertCircle className="text-red-500 h-8 w-8" />
                    <div>
                      <h3 className="font-bold text-red-500">Hazard in {activeRoom.name}</h3>
                      <p className="text-red-400/80 text-sm">{insight?.prediction || 'Threshold exceeded'}</p>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <StatCard title="Temp" value={isSystemDown ? '--' : `${current.temp.toFixed(1)}°C`} icon={<Thermometer className="text-orange-400" />} trend={current.temp > 32 ? 'high' : 'normal'} color={isSystemDown ? "border-slate-800" : "border-orange-500/30"} />
                  <StatCard title="Humidity" value={isSystemDown ? '--' : `${current.humidity.toFixed(1)}%`} icon={<Droplets className="text-blue-400" />} trend={current.humidity > 70 ? 'high' : 'normal'} color={isSystemDown ? "border-slate-800" : "border-blue-500/30"} />
                  <StatCard title="Gas (MQ2)" value={isSystemDown ? '--' : current.toxicGas.toFixed(0)} icon={<Wind className="text-emerald-400" />} trend={current.toxicGas > 300 ? 'high' : 'normal'} color={isSystemDown ? "border-slate-800" : "border-emerald-500/30"} unit={isSystemDown ? "" : "ppm"} />
                  <StatCard title="CO2 (MG811)" value={isSystemDown ? '--' : current.co2.toFixed(0)} icon={<Activity className="text-purple-400" />} trend={current.co2 > 1000 ? 'high' : 'normal'} color={isSystemDown ? "border-slate-800" : "border-purple-500/30"} unit={isSystemDown ? "" : "ppm"} />
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
                  <div className="xl:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <ChartCard title="Temperature" icon={<Thermometer size={14} />}><EnvironmentalChart data={chartData} types={['temp']} /></ChartCard>
                    <ChartCard title="Humidity" icon={<Droplets size={14} />}><EnvironmentalChart data={chartData} types={['humidity']} /></ChartCard>
                    <ChartCard title="Toxic Gas" icon={<Wind size={14} />}><EnvironmentalChart data={chartData} types={['toxicGas']} /></ChartCard>
                    <ChartCard title="CO2 Level" icon={<Activity size={14} />}><EnvironmentalChart data={chartData} types={['co2']} /></ChartCard>
                  </div>
                  <div className="xl:col-span-1">
                    <AIInsightsPanel insight={insight} currentData={current} nextUpdateIn={nextUpdateRemaining} isSystemDown={isSystemDown} />
                  </div>
                </div>
              </div>
            )
          )}
        </div>
      </main>
    </div>
  );
};

const ChartCard: React.FC<{ title: string; icon: React.ReactNode; children: React.ReactNode }> = ({ title, icon, children }) => (
  <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-5 flex flex-col min-h-[250px]">
    <h3 className="text-[10px] font-bold mb-4 flex items-center gap-2 text-slate-500 uppercase tracking-widest">{icon}{title}</h3>
    <div className="flex-1">{children}</div>
    <div className="mt-2 text-[9px] text-slate-600 text-right uppercase font-bold tracking-tighter">Window: Last 40 Pulses</div>
  </div>
);

export default App;
