import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Radar, 
  MapPin, 
  AlertTriangle, 
  Zap, 
  Users, 
  ShieldAlert,
  ChevronRight,
  TrendingUp,
  History,
  Info,
  Medal,
  ShieldCheck,
  Crosshair,
  MessageSquare,
  Thermometer,
  Wind,
  Droplets,
  ArrowRightLeft
} from 'lucide-react';
import { useDialogs } from '../src/components/DialogProvider';

interface Outbreak {
  id: string;
  type: 'Pest' | 'Disease' | 'Virus';
  name: string;
  distance: string;
  severity: 'Critical' | 'Moderate' | 'Low';
  reports: number;
  lastReported: string;
  coords: { x: number, y: number };
  mitigation: string[];
  forecast: string;
}

const OutbreakRadar: React.FC = () => {
  const { alert, confirm } = useDialogs();
  const [filter, setFilter] = React.useState<Outbreak['type'] | 'All'>('All');
  const [activeThreat, setActiveThreat] = React.useState<Outbreak | null>(null);
  const [outbreaks] = React.useState<Outbreak[]>([
    { 
      id: '1', 
      type: 'Pest', 
      name: 'Fall Armyworm', 
      distance: '2.4 km', 
      severity: 'Critical', 
      reports: 124, 
      lastReported: '10 mins ago', 
      coords: { x: 30, y: 40 },
      mitigation: ['Deep Plowing', 'Pheromone Traps', 'Systemic Insecticide'],
      forecast: 'Moving North-East (5km/day)'
    },
    { 
      id: '2', 
      type: 'Disease', 
      name: 'Rice Blast', 
      distance: '5.1 km', 
      severity: 'Moderate', 
      reports: 45, 
      lastReported: '2 hours ago', 
      coords: { x: 70, y: 20 },
      mitigation: ['Fungicide Application', 'Nitrogen Management', 'Flood Irrigation'],
      forecast: 'Stable (High Humidity)'
    },
    { 
      id: '3', 
      type: 'Virus', 
      name: 'Tomato Mosaic', 
      distance: '8.7 km', 
      severity: 'Low', 
      reports: 12, 
      lastReported: '1 day ago', 
      coords: { x: 50, y: 80 },
      mitigation: ['Removal of Infected Plants', 'Hygiene Protocols', 'Aphid Control'],
      forecast: 'Declining'
    }
  ]);

  const filteredOutbreaks = filter === 'All' ? outbreaks : outbreaks.filter(o => o.type === filter);

  const reportOutbreak = () => {
    confirm({
      title: 'Submit Report',
      message: 'Are you sure you want to report an outbreak at your current location? Community verification will follow.',
      onConfirm: () => alert({ title: 'Report Submitted', message: 'Your report is now under verification by the community nodes.' })
    });
  };

  return (
    <div className="space-y-8 pb-32 animate-in fade-in duration-700 bg-[var(--m3-background)] min-h-screen">
       <section className="px-6 pt-16 pb-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-rose-500/5 rounded-full blur-[100px] -mr-32 -mt-32" />
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex flex-col gap-8 relative z-10"
        >
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
              <span className="text-[10px] font-mono text-rose-500 font-bold uppercase tracking-[0.4em]">Early Warning System.</span>
            </div>
            <h2 className="text-5xl font-black text-white tracking-tighter font-sans uppercase leading-none">
               Outbreak <span className="text-rose-500">Radar.</span>
            </h2>
            <p className="text-[10px] font-mono text-white/30 uppercase tracking-[0.2em]">Community Intelligence Network</p>
          </div>
        </motion.div>
      </section>

      <div className="px-6 space-y-8">
        {/* Type Filters */}
        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
          {(['All', 'Pest', 'Disease', 'Virus'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setFilter(t)}
              className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border ${
                filter === t 
                  ? 'bg-rose-500 border-rose-500 text-black shadow-lg shadow-rose-500/20' 
                  : 'bg-white/5 border-white/10 text-white/40 hover:text-white'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Radar Viewport */}
        <div className="relative aspect-square w-full bg-[#0a0a0a] rounded-[3rem] border border-white/5 overflow-hidden shadow-2xl">
          {/* Radar Circles */}
          <div className="absolute inset-0 flex items-center justify-center">
             <div className="w-[80%] h-[80%] border border-white/5 rounded-full" />
             <div className="w-[60%] h-[60%] border border-white/5 rounded-full" />
             <div className="w-[40%] h-[40%] border border-white/5 rounded-full" />
             <div className="w-[20%] h-[20%] border border-white/5 rounded-full" />
             {/* Center Pin */}
             <div className="w-4 h-4 bg-rose-500 rounded-full shadow-[0_0_20px_rgba(244,63,94,0.6)] animate-pulse relative z-20" />
          </div>

          {/* Radar Sweep */}
          <div className="absolute inset-0 origin-center animate-[radar-sweep_4s_linear_infinite] bg-gradient-to-tr from-rose-500/20 to-transparent pointer-events-none" />

          {/* Outbreak Pins */}
          {filteredOutbreaks.map(o => (
            <motion.div 
               key={o.id}
               initial={{ scale: 0, opacity: 0 }}
               animate={{ scale: 1, opacity: 1 }}
               className="absolute z-10 group cursor-pointer"
               style={{ left: `${o.coords.x}%`, top: `${o.coords.y}%` }}
               onClick={() => setActiveThreat(o)}
            >
              <div className={`p-2 rounded-full animate-bounce ${
                o.severity === 'Critical' ? 'bg-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.4)]' :
                o.severity === 'Moderate' ? 'bg-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.4)]' :
                'bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.4)]'
              } ${activeThreat?.id === o.id ? 'ring-4 ring-white shadow-[0_0_30px_white]' : ''}`}>
                <AlertTriangle className="w-4 h-4 text-black" />
              </div>
              <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-3 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap bg-black/80 backdrop-blur-xl border border-white/10 p-4 rounded-2xl pointer-events-none z-30">
                <p className="text-[10px] font-black text-white uppercase tracking-widest leading-none mb-1">{o.name}</p>
                <p className="text-[8px] font-mono text-white/40 uppercase tracking-widest">{o.distance} away</p>
              </div>
            </motion.div>
          ))}

          {/* Radar Overlay Labels */}
          <div className="absolute top-8 left-8 p-4 bg-black/40 backdrop-blur border border-white/5 rounded-2xl">
            <div className="flex items-center gap-3">
              <Users className="w-4 h-4 text-rose-500" />
              <span className="text-[9px] font-mono text-white/60 uppercase tracking-widest">1,248 Nodes Online</span>
            </div>
          </div>
        </div>

        {/* Active Threat Detail Panel */}
        <AnimatePresence mode="wait">
          {activeThreat && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="bg-rose-500/5 border border-rose-500/20 rounded-[2.5rem] p-8 space-y-8 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-4">
                <button 
                  onClick={() => setActiveThreat(null)}
                  className="text-white/20 hover:text-white uppercase text-[8px] font-black tracking-widest"
                >
                  [Dismiss]
                </button>
              </div>

              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-3 py-1 bg-rose-500 text-black text-[8px] font-black uppercase tracking-widest rounded-full">
                      {activeThreat.severity} Threat
                    </span>
                    <span className="text-[9px] font-mono text-rose-500/60 uppercase tracking-widest">AI Forecast Active</span>
                  </div>
                  <h3 className="text-3xl font-black text-white tracking-tighter uppercase leading-none">{activeThreat.name}</h3>
                </div>
                <div className="p-4 bg-rose-500/10 rounded-2xl border border-rose-500/20">
                  <Crosshair className="w-6 h-6 text-rose-500" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-500" />
                    <span className="text-[10px] font-black text-white uppercase tracking-widest">Mitigation Protocol</span>
                  </div>
                  <ul className="space-y-2">
                    {activeThreat.mitigation.map((m, i) => (
                      <li key={i} className="flex items-center gap-3 text-[9px] font-mono text-white/40 uppercase tracking-widest bg-white/5 p-3 rounded-xl">
                        <div className="w-1 h-1 bg-rose-500 rounded-full" />
                        {m}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Wind className="w-4 h-4 text-blue-400" />
                    <span className="text-[10px] font-black text-white uppercase tracking-widest">Movement Vector</span>
                  </div>
                  <div className="bg-black/40 border border-white/5 p-4 rounded-2xl relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-transparent translate-x-[-100%] animate-[shimmer_2s_infinite]" />
                    <p className="text-[10px] font-mono text-blue-400 font-bold uppercase tracking-widest mb-1">{activeThreat.forecast}</p>
                    <p className="text-[8px] font-mono text-white/20 uppercase tracking-widest">Velocity: 5.2 km/day</p>
                  </div>
                </div>
              </div>

              <button className="w-full py-4 bg-white text-black text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-rose-500 hover:text-white transition-all flex items-center justify-center gap-2">
                <MessageSquare className="w-4 h-4" />
                Join Community War-Room
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Action Button */}
        <button 
          onClick={reportOutbreak}
          className="w-full py-6 bg-rose-600 rounded-[2rem] flex items-center justify-center gap-4 active:scale-95 transition-all shadow-xl shadow-rose-900/20 group"
        >
          <div className="p-3 bg-white/20 rounded-xl group-hover:bg-white/30 transition-colors">
             <ShieldAlert className="w-5 h-5 text-white" />
          </div>
          <span className="text-sm font-black text-white uppercase tracking-[0.2em]">Report Local Incident</span>
        </button>

        {/* Nearby Threats List */}
        <section className="space-y-6">
          <div className="flex items-center gap-3 ml-2">
            <div className="w-1 h-3 bg-rose-500 rounded-full" />
            <h3 className="text-[11px] font-black text-white uppercase tracking-[0.3em]">Nearby Criticalities</h3>
          </div>

          <div className="space-y-4">
            {filteredOutbreaks.map(o => (
              <div 
                key={o.id} 
                onClick={() => setActiveThreat(o)}
                className={`bg-[var(--m3-surface-container-low)] p-6 rounded-[2rem] border transition-all cursor-pointer ${
                  activeThreat?.id === o.id ? 'border-rose-500/50 bg-rose-500/5' : 'border-white/5 hover:border-white/20'
                } flex items-center justify-between group`}
              >
                <div className="flex items-center gap-6">
                  <div className={`p-4 rounded-2xl border ${
                    o.severity === 'Critical' ? 'bg-rose-500/10 border-rose-500/20 text-rose-500' :
                    o.severity === 'Moderate' ? 'bg-amber-500/10 border-amber-500/20 text-amber-500' :
                    'bg-blue-500/10 border-blue-500/20 text-blue-500'
                  }`}>
                    <Zap className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-white uppercase tracking-widest leading-none mb-1">{o.name}</h4>
                    <div className="flex items-center gap-3">
                      <span className="text-[9px] font-mono text-white/30 uppercase tracking-widest">{o.distance} • {o.type}</span>
                      <div className="w-1 h-1 rounded-full bg-white/10" />
                      <span className="text-[9px] font-mono text-rose-500/60 uppercase tracking-widest font-bold">{o.reports} Reports</span>
                    </div>
                  </div>
                </div>
                <div className="p-4 bg-white/[0.03] border border-white/10 rounded-2xl text-white/20 group-hover:text-white transition-all">
                  <ChevronRight className="w-5 h-5" />
                </div>
              </div>
            ))}
            {filteredOutbreaks.length === 0 && (
              <div className="py-20 text-center border border-dashed border-white/10 rounded-[2rem]">
                <Radar className="w-12 h-12 text-white/5 mx-auto mb-4" />
                <p className="text-[10px] font-mono text-white/20 uppercase tracking-widest text-center">No active {filter.toLowerCase()}s in range</p>
              </div>
            )}
          </div>
        </section>

        {/* Global Stats */}
        <div className="grid grid-cols-2 gap-4">
           <div className="bg-white/[0.02] border border-white/5 p-6 rounded-[2rem] space-y-3">
              <History className="w-5 h-5 text-white/20" />
              <div>
                <p className="text-xl font-black text-white">48</p>
                <p className="text-[9px] font-mono text-white/30 uppercase tracking-widest">Resolved (24h)</p>
              </div>
           </div>
           <div className="bg-white/[0.02] border border-white/5 p-6 rounded-[2rem] space-y-3">
              <TrendingUp className="w-5 h-5 text-rose-500/40" />
              <div>
                <p className="text-xl font-black text-white">+12%</p>
                <p className="text-[9px] font-mono text-white/30 uppercase tracking-widest">Infection Velocity</p>
              </div>
           </div>
        </div>

        {/* Community Leaderboard */}
        <section className="bg-gradient-to-br from-amber-500/10 to-amber-500/5 border border-amber-500/20 rounded-[3rem] p-8 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-amber-500/20 rounded-2xl flex items-center justify-center border border-amber-500/20">
                <Medal className="w-6 h-6 text-amber-500" />
              </div>
              <div>
                <h3 className="text-xl font-black text-white uppercase tracking-tighter leading-none mb-1">Top Verifiers</h3>
                <p className="text-[9px] font-mono text-amber-500/60 uppercase tracking-widest">Regional Node Reputation</p>
              </div>
            </div>
          </div>
          
          <div className="space-y-3">
            {[
              { name: 'K. Sharma', location: 'Punjab North', verified: 156, points: 2450 },
              { name: 'M. Reddy', location: 'Andhra Central', verified: 142, points: 2120 },
              { name: 'P. Patil', location: 'Maharashtra West', verified: 98, points: 1890 }
            ].map((node, i) => (
              <div key={i} className="bg-black/40 border border-white/5 p-4 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-4">
                   <span className="text-xs font-black text-white/20">#{i + 1}</span>
                   <div>
                     <p className="text-[10px] font-black text-white uppercase tracking-widest leading-none mb-1">{node.name}</p>
                     <p className="text-[8px] font-mono text-white/30 uppercase tracking-widest">{node.location}</p>
                   </div>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-1">{node.points} PTS</p>
                  <p className="text-[8px] font-mono text-white/20 uppercase tracking-widest">{node.verified} Verified</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes radar-sweep {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}} />
    </div>
  );
};

export default OutbreakRadar;
