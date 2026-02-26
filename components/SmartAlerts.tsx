import React from 'react';
import { 
  Bell, 
  Droplets, 
  CloudRain, 
  TrendingDown, 
  ChevronRight, 
  Settings2, 
  Zap, 
  Clock, 
  AlertCircle,
  CheckCircle2,
  X,
  Plus,
  Calendar,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Alert {
  id: string;
  type: 'Spray' | 'Weather' | 'Market';
  title: string;
  desc: string;
  time: string;
  active: boolean;
  priority: 'High' | 'Medium' | 'Low';
}

const INITIAL_ALERTS: Alert[] = [
  {
    id: '1',
    type: 'Weather',
    title: 'Rain Alert',
    desc: 'Heavy rainfall expected in 4 hours. Protect harvested crops.',
    time: 'Today, 2:30 PM',
    active: true,
    priority: 'High'
  },
  {
    id: '2',
    type: 'Spray',
    title: 'Spray Reminder',
    desc: 'Scheduled pesticide application for North Ridge (Basmati Rice).',
    time: 'Tomorrow, 6:00 AM',
    active: true,
    priority: 'Medium'
  },
  {
    id: '3',
    type: 'Market',
    title: 'Low Price Alert',
    desc: 'Wheat prices dropped by 5% in local Mandi. Hold stock if possible.',
    time: '2 hours ago',
    active: true,
    priority: 'Medium'
  }
];

const SmartAlerts: React.FC = () => {
  const [alerts, setAlerts] = React.useState<Alert[]>(INITIAL_ALERTS);

  const toggleAlert = (id: string) => {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, active: !a.active } : a));
  };

  const deleteAlert = (id: string) => {
    setAlerts(prev => prev.filter(a => a.id !== id));
  };

  return (
    <div className="space-y-8 pb-32 animate-in fade-in slide-in-from-bottom-6 duration-700 bg-stone-50 min-h-screen">
      {/* Dynamic Header */}
      <section className="px-6 pt-10 pb-6">
        <div className="flex flex-col gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse"></div>
              <span className="text-[9px] font-black text-stone-400 uppercase tracking-[0.3em]">System Intelligence</span>
            </div>
            <h2 className="text-4xl font-black text-stone-950 tracking-tighter uppercase leading-none">
              Smart<br /><span className="text-amber-600 italic">Alerts.</span>
            </h2>
          </div>
          
          <div className="bg-stone-950 rounded-[2.5rem] p-6 text-white shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-6 opacity-10">
              <Zap className="w-32 h-32 -mr-8 -mt-8 rotate-12" />
            </div>
            <div className="relative z-10 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black text-amber-400 uppercase tracking-widest mb-1">Active Monitors</p>
                <h3 className="text-2xl font-black tracking-tight">{alerts.filter(a => a.active).length} Protocols Live</h3>
              </div>
              <button className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10 hover:bg-white/20 transition-colors">
                <Settings2 className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Alert Feed */}
      <section className="px-6 space-y-6">
        <div className="flex items-center justify-between px-2">
          <h3 className="text-[10px] font-black text-stone-400 uppercase tracking-[0.4em]">Intelligence Feed</h3>
          <div className="h-px flex-1 bg-stone-200 mx-4" />
        </div>

        <AnimatePresence mode="popLayout">
          {alerts.map((alert) => {
            const isWeather = alert.type === 'Weather';
            const isSpray = alert.type === 'Spray';
            const isMarket = alert.type === 'Market';
            
            return (
              <motion.div 
                key={alert.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className={`group relative bg-white rounded-[2.5rem] border transition-all ${
                  alert.active 
                    ? 'border-stone-100 shadow-xl hover:shadow-2xl' 
                    : 'border-stone-50 opacity-40 grayscale'
                }`}
              >
                {/* Priority Badge */}
                {alert.priority === 'High' && alert.active && (
                  <div className="absolute -top-2 -right-2 z-10 bg-rose-500 text-white text-[8px] font-black uppercase px-3 py-1 rounded-full shadow-lg border-2 border-white">
                    Critical
                  </div>
                )}

                <div className="p-8 space-y-6">
                  <div className="flex gap-5">
                    <div className={`w-16 h-16 rounded-3xl flex items-center justify-center shrink-0 shadow-inner ${
                      isWeather ? 'bg-blue-50 text-blue-600' :
                      isSpray ? 'bg-rose-50 text-rose-600' :
                      'bg-amber-50 text-amber-600'
                    }`}>
                      {isWeather && <CloudRain className="w-8 h-8" />}
                      {isSpray && <Droplets className="w-8 h-8" />}
                      {isMarket && <TrendingDown className="w-8 h-8" />}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <h4 className="text-xl font-black text-stone-950 uppercase tracking-tight leading-none truncate pr-4">
                          {alert.title}
                        </h4>
                        <button 
                          onClick={() => deleteAlert(alert.id)}
                          className="p-2 text-stone-200 hover:text-rose-500 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <Clock className="w-3 h-3 text-stone-300" />
                        <span className="text-[9px] font-black text-stone-400 uppercase tracking-widest">{alert.time}</span>
                      </div>
                    </div>
                  </div>

                  <p className="text-sm font-medium text-stone-600 leading-relaxed">
                    {alert.desc}
                  </p>

                  <div className="flex gap-3 pt-2">
                    <button className={`flex-1 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-lg active:scale-95 ${
                      isWeather ? 'bg-blue-600 text-white shadow-blue-200' :
                      isSpray ? 'bg-rose-600 text-white shadow-rose-200' :
                      'bg-amber-600 text-white shadow-amber-200'
                    }`}>
                      {isWeather ? 'View Radar' : isSpray ? 'Open Map' : 'Market Trends'}
                    </button>
                    <button 
                      onClick={() => toggleAlert(alert.id)}
                      className="px-6 py-4 bg-stone-100 text-stone-900 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-stone-200 transition-colors"
                    >
                      {alert.active ? 'Mute' : 'Resume'}
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {alerts.length === 0 && (
          <div className="py-24 text-center opacity-20 flex flex-col items-center gap-6">
            <Bell className="w-20 h-20 text-stone-300" />
            <div className="space-y-1">
              <p className="text-sm font-black uppercase tracking-widest text-stone-500">Silence is Golden</p>
              <p className="text-xs font-medium text-stone-400">No active intelligence protocols found.</p>
            </div>
          </div>
        )}
      </section>

      {/* Protocol Setup */}
      <section className="px-6 space-y-6">
        <div className="flex items-center justify-between px-2">
          <h3 className="text-[10px] font-black text-stone-400 uppercase tracking-[0.4em]">Protocol Setup</h3>
          <div className="h-px flex-1 bg-stone-200 mx-4" />
        </div>

        <div className="grid grid-cols-1 gap-4">
          <SetupCard 
            icon={<Droplets />} 
            label="Spray Reminder" 
            desc="Schedule chemical application cycles"
            color="bg-rose-500"
          />
          <SetupCard 
            icon={<CloudRain />} 
            label="Weather Guard" 
            desc="Precipitation & wind speed thresholds"
            color="bg-blue-500"
          />
          <SetupCard 
            icon={<TrendingDown />} 
            label="Market Watch" 
            desc="Price drop alerts for specific crops"
            color="bg-amber-500"
          />
        </div>
      </section>

      {/* Floating Action Button */}
      <div className="fixed bottom-24 right-6 z-50">
        <motion.button 
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className="w-16 h-16 bg-stone-950 text-white rounded-3xl shadow-2xl flex items-center justify-center border-4 border-white"
        >
          <Plus className="w-7 h-7" />
        </motion.button>
      </div>
    </div>
  );
};

const SetupCard: React.FC<{ icon: React.ReactNode, label: string, desc: string, color: string }> = ({ icon, label, desc, color }) => (
  <button className="bg-white border border-stone-100 p-5 rounded-[2rem] flex items-center gap-4 text-left hover:border-amber-200 transition-all group shadow-sm">
    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg ${color} group-hover:scale-110 transition-transform`}>
      {React.cloneElement(icon as React.ReactElement, { className: 'w-6 h-6' } as any)}
    </div>
    <div className="flex-1">
      <h4 className="text-sm font-black text-stone-950 uppercase tracking-tight leading-none mb-1">{label}</h4>
      <p className="text-[10px] font-medium text-stone-400 leading-tight">{desc}</p>
    </div>
    <ChevronRight className="w-4 h-4 text-stone-300 group-hover:text-amber-500 transition-colors" />
  </button>
);

export default SmartAlerts;
