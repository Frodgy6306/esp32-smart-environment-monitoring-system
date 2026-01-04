
import React, { useState } from 'react';
import { Plus, Trash2, MapPin, ExternalLink, ShieldCheck, AlertCircle, Lock, Rocket, Globe, Server, Smartphone } from 'lucide-react';
import { RoomConfig } from '../types';

interface SensorsConfigProps {
  rooms: RoomConfig[];
  onAddRoom: (room: RoomConfig) => void;
  onDeleteRoom: (id: string) => void;
  isLocked: boolean;
}

const SensorsConfig: React.FC<SensorsConfigProps> = ({ rooms, onAddRoom, onDeleteRoom, isLocked }) => {
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [desc, setDesc] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isLocked) return;
    setError('');

    if (!name || !url) {
      setError('Name and URL are required.');
      return;
    }

    if (!url.includes('docs.google.com') || !url.includes('csv')) {
      setError('Please provide a valid Google Sheets CSV Publish URL.');
      return;
    }

    const newRoom: RoomConfig = {
      id: `room-${Date.now()}`,
      name,
      csvUrl: url,
      description: desc || 'Custom ESP32 Node'
    };

    onAddRoom(newRoom);
    setName('');
    setUrl('');
    setDesc('');
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <ShieldCheck className="text-indigo-400" />
          Node Management
        </h2>
        <p className="text-slate-400 text-sm">Register and monitor your distributed ESP32 sensor network.</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Form Section */}
        <div className="xl:col-span-1">
          {isLocked ? (
            <div className="bg-slate-900/50 border border-slate-800 p-8 rounded-2xl flex flex-col items-center justify-center text-center space-y-4 h-full min-h-[300px]">
              <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center border border-emerald-500/30">
                <Lock className="text-emerald-500" size={32} />
              </div>
              <div>
                <h3 className="font-bold text-lg">Production Lock Active</h3>
                <p className="text-slate-500 text-xs mt-1 leading-relaxed">Room registration is disabled to prevent configuration drift. Unlock in the sidebar to add new nodes.</p>
              </div>
            </div>
          ) : (
            <form 
              onSubmit={handleSubmit}
              className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4 sticky top-24"
            >
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-2">Register New Node</h3>
              
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Room Name</label>
                <input 
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Master Bedroom"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase">CSV Publish URL</label>
                <input 
                  type="text" 
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="Google Sheets CSV URL..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Description (Optional)</label>
                <textarea 
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                  placeholder="Where is it located?"
                  rows={2}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500 transition-colors resize-none"
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 text-xs text-red-400 bg-red-500/10 p-3 rounded-lg border border-red-500/20">
                  <AlertCircle size={14} />
                  {error}
                </div>
              )}

              <button 
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-600/20 active:scale-95"
              >
                <Plus size={18} />
                Register Room
              </button>
            </form>
          )}
        </div>

        {/* List Section */}
        <div className="xl:col-span-2 space-y-8">
          <div className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 px-2">Active Monitor Nodes ({rooms.length})</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {rooms.map((room) => (
                <div 
                  key={room.id}
                  className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex flex-col justify-between group hover:border-slate-700 transition-all"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="p-2.5 bg-indigo-600/10 rounded-xl border border-indigo-500/20">
                      <MapPin className="text-indigo-400" size={20} />
                    </div>
                    {!isLocked && (
                      <button 
                        onClick={() => onDeleteRoom(room.id)}
                        className="p-2 text-slate-600 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                        title="Remove Room"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                  
                  <div>
                    <h4 className="font-bold text-lg">{room.name}</h4>
                    <p className="text-xs text-slate-500 mb-4 line-clamp-1">{room.description}</p>
                  </div>

                  <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
                    <span className="text-[9px] font-mono text-slate-600 truncate max-w-[150px]">
                      ID: {room.id}
                    </span>
                    {!isLocked && (
                      <a 
                        href={room.csvUrl} 
                        target="_blank" 
                        rel="noreferrer"
                        className="text-[10px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-bold"
                      >
                        SOURCE <ExternalLink size={10} />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* New Production Guide Section */}
          {!isLocked && (
            <div className="bg-indigo-600/5 border border-indigo-500/10 rounded-3xl p-8 space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center">
                  <Rocket className="text-white" size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-lg">Production Manual</h3>
                  <p className="text-xs text-slate-500 uppercase tracking-widest font-bold">Go Live Strategy</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs uppercase">
                    <Globe size={14} /> 1. Pick a Host
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Upload these files to <strong>Vercel</strong> or <strong>Netlify</strong>. This creates a clean URL (e.g. <code>ecoguard.app</code>) and hides your source code from users.
                  </p>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase">
                    <Server size={14} /> 2. Secure API Key
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    In your host's dashboard, add an <strong>Environment Variable</strong> named <code>API_KEY</code>. This keeps your Gemini credentials private.
                  </p>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase">
                    <Smartphone size={14} /> 3. PWA Install
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Once live, click "Add to Home Screen" on your phone. The app will open in full-screen mode without a browser bar.
                  </p>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-slate-400 font-bold text-xs uppercase">
                    <Lock size={14} /> 4. Enable Lock
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Switch to <strong>Production Lock</strong> in the sidebar to hide all "Edit" and "Source" buttons for a polished client-ready look.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SensorsConfig;
