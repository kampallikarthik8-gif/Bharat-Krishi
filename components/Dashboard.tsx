import React from 'react';
import { AppView, Task } from '../types';
import { motion } from 'motion/react';
import { 
  CloudSun, 
  Droplets, 
  Wind,
  Sun,
  Cloud,
  CloudRain,
  CloudLightning,
  CheckCircle2,
  Sprout,
  Loader2,
  TrendingUp,
  MapPin,
  Calendar,
  ChevronRight,
  Bell,
  Camera,
  LayoutGrid,
  Thermometer,
  ArrowUpRight,
  Truck,
  Leaf,
  RefreshCw
} from 'lucide-react';
import { useFirebase } from '../src/components/FirebaseProvider';
import { db, auth } from '../src/firebase';
import { collection, query, onSnapshot, orderBy, limit, where } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../src/utils/firestoreErrorHandler';

import { triggerHaptic, triggerSelectionHaptic } from '../src/utils/haptics';

interface DashboardProps {
  setView: (view: AppView) => void;
}

const WEATHER_API_KEY = import.meta.env.VITE_WEATHER_API_KEY;

const Dashboard: React.FC<DashboardProps> = ({ setView }) => {
  const { profile, activeFarmId } = useFirebase();
  const [weather, setWeather] = React.useState<any>(null);
  const [loadingWeather, setLoadingWeather] = React.useState(true);
  const [tasks, setTasks] = React.useState<Task[]>([]);
  const [loadingTasks, setLoadingTasks] = React.useState(true);

  const farmerName = profile?.name?.split(' ')[0] || 'Farmer';

  const handleSetView = (view: AppView) => {
    triggerSelectionHaptic();
    setView(view);
  };

  React.useEffect(() => {
    if (!activeFarmId) return;

    const path = `users/${activeFarmId}/tasks`;
    const q = query(
      collection(db, path), 
      where('status', '==', 'Pending'),
      orderBy('createdAt', 'desc'),
      limit(3)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const taskList: Task[] = [];
      snapshot.forEach((doc) => {
        taskList.push({ id: doc.id, ...doc.data() } as Task);
      });
      setTasks(taskList);
      setLoadingTasks(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
      setLoadingTasks(false);
    });

    return () => unsubscribe();
  }, [activeFarmId]);

  const fetchWeather = async (lat: number, lon: number) => {
    setLoadingWeather(true);
    try {
      const weatherRes = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${WEATHER_API_KEY}&units=metric`
      );
      if (!weatherRes.ok) throw new Error(`Weather API error: ${weatherRes.status}`);
      const data = await weatherRes.json();
      setWeather({
        temp: Math.round(data.main.temp),
        description: data.weather[0].description,
        humidity: data.main.humidity,
        wind: Math.round(data.wind.speed * 3.6),
        city: data.name,
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingWeather(false);
    }
  };

  const refreshWeather = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    navigator.geolocation.getCurrentPosition(
      (pos) => fetchWeather(pos.coords.latitude, pos.coords.longitude),
      () => fetchWeather(28.6139, 77.2090),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  React.useEffect(() => {
    refreshWeather();
  }, []);

  const getWeatherIcon = (description: string, size: string = "w-10 h-10") => {
    const desc = description.toLowerCase();
    if (desc.includes('rain')) return <CloudRain className={`${size} text-amber-600`} />;
    if (desc.includes('cloud')) return <Cloud className={`${size} text-stone-500`} />;
    if (desc.includes('clear')) return <Sun className={`${size} text-amber-500`} />;
    if (desc.includes('storm')) return <CloudLightning className={`${size} text-orange-500`} />;
    return <CloudSun className={`${size} text-amber-500`} />;
  };

  return (
    <div className="w-full flex flex-col pb-40 bg-black min-h-screen">
      
      {/* Editorial Hero Header */}
      <section className="px-6 pt-12 pb-10 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/5 rounded-full blur-[100px] -mr-40 -mt-40" />
        <div className="relative z-10 flex items-start justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="w-10 h-[1px] bg-amber-900" />
              <span className="text-[10px] font-black text-amber-500/40 uppercase tracking-[0.4em]">Daily Briefing</span>
            </div>
            <h2 className="text-6xl font-black text-white tracking-tighter leading-[0.85]">
              Namaste,<br/>
              <span className="text-amber-500 font-serif italic font-light">{farmerName}.</span>
            </h2>
            <p className="text-[11px] font-bold text-stone-500 uppercase tracking-[0.2em] max-w-[200px] leading-relaxed">
              Your farm is performing <span className="text-amber-400">optimally</span> today.
            </p>
          </div>
          <motion.button 
            whileTap={{ scale: 0.9 }}
            onClick={() => handleSetView(AppView.SMART_ALERTS)}
            className="w-14 h-14 rounded-full bg-stone-950 border border-amber-500/10 shadow-xl shadow-black/40 flex items-center justify-center relative group active:scale-95 transition-all"
          >
            <Bell className="w-6 h-6 text-stone-500 group-hover:text-amber-500 transition-colors" />
            <div className="absolute top-4 right-4 w-2.5 h-2.5 bg-amber-600 rounded-full border-2 border-black animate-pulse"></div>
          </motion.button>
        </div>
      </section>

      {/* Bento Grid Stats & Weather */}
      <section className="px-6 mb-12">
        <div className="grid grid-cols-2 gap-4">
          {/* Weather Bento - Large */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={() => handleSetView(AppView.WEATHER_HUB)}
            className="col-span-2 bg-stone-950 p-8 rounded-[3rem] relative overflow-hidden group shadow-2xl shadow-black/40 border border-amber-500/5"
          >
            <div className="absolute top-0 right-0 p-12 opacity-[0.05] group-hover:opacity-[0.1] transition-opacity">
              {weather && getWeatherIcon(weather.description, "w-64 h-64 -mr-16 -mt-16 rotate-12")}
            </div>
            
            {loadingWeather ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="w-8 h-8 animate-spin text-amber-500/50" />
              </div>
            ) : (
              <div className="relative z-10 flex flex-col justify-between h-full min-h-[160px]">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-amber-400">
                      <MapPin className="w-4 h-4" />
                      <span className="text-[10px] font-black uppercase tracking-widest">{weather.city}</span>
                    </div>
                    <div className="flex items-baseline gap-3">
                      <span className="text-7xl font-black text-white tracking-tighter">{weather.temp}°</span>
                      <span className="text-lg font-serif italic text-white/40 capitalize">{weather.description}</span>
                    </div>
                  </div>
                  {getWeatherIcon(weather.description, "w-16 h-16")}
                </div>
                
                <div className="flex gap-8 mt-8">
                  <div className="flex flex-col">
                    <span className="text-[8px] font-black text-white/20 uppercase tracking-[0.3em] mb-1">Humidity</span>
                    <div className="flex items-center gap-2 text-white/60">
                      <Droplets className="w-4 h-4 text-amber-600" />
                      <span className="text-sm font-bold">{weather.humidity}%</span>
                    </div>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[8px] font-black text-white/20 uppercase tracking-[0.3em] mb-1">Wind Speed</span>
                    <div className="flex items-center gap-2 text-white/60">
                      <Wind className="w-4 h-4 text-amber-400" />
                      <span className="text-sm font-bold">{weather.wind} km/h</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </motion.div>

          {/* Quick Stats Bento */}
          <div className="bg-stone-950 p-6 rounded-[2.5rem] border border-amber-500/5 shadow-sm flex flex-col justify-between min-h-[140px]">
            <div className="w-10 h-10 bg-amber-500/10 text-amber-500 rounded-xl flex items-center justify-center border border-amber-500/20">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[8px] font-black text-stone-500 uppercase tracking-widest mb-1">Market Trend</p>
              <h4 className="text-2xl font-black text-white tracking-tight">+12.4%</h4>
            </div>
          </div>

          <div className="bg-stone-950 p-6 rounded-[2.5rem] border border-amber-500/5 shadow-sm flex flex-col justify-between min-h-[140px]">
            <div className="w-10 h-10 bg-amber-500/10 text-amber-500 rounded-xl flex items-center justify-center border border-amber-500/20">
              <Droplets className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[8px] font-black text-stone-500 uppercase tracking-widest mb-1">Soil Moisture</p>
              <h4 className="text-2xl font-black text-white tracking-tight">64%</h4>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Actions - Pills */}
      <section className="px-6 mb-12 overflow-x-auto no-scrollbar">
        <div className="flex gap-3 pb-2">
          <QuickActionPill icon={<Camera />} label="Scan" onClick={() => handleSetView(AppView.DISEASE_SCANNER)} />
          <QuickActionPill icon={<TrendingUp />} label="Prices" onClick={() => handleSetView(AppView.MARKET_PRICES)} />
          <QuickActionPill icon={<MapPin />} label="Map" onClick={() => handleSetView(AppView.FIELD_MAP)} />
          <QuickActionPill icon={<Truck />} label="Rent" onClick={() => handleSetView(AppView.EQUIPMENT_RENTAL)} />
          <QuickActionPill icon={<LayoutGrid />} label="Tools" onClick={() => handleSetView(AppView.TOOLS_HUB)} />
        </div>
      </section>

      {/* Recommended Intelligence */}
      <section className="px-6 mb-12 space-y-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-2xl font-black text-amber-900 font-mono">01</span>
            <h3 className="text-[11px] font-black text-amber-500/40 uppercase tracking-[0.3em]">Recommended</h3>
          </div>
          <div className="h-px flex-1 bg-amber-500/10 ml-6" />
        </div>
        
        <div className="grid grid-cols-1 gap-4">
          <ActionCard 
            icon={<Sprout className="w-6 h-6" />} 
            label="Crop Rotation Advisor" 
            sub="Optimize soil health with AI-driven rotation protocols."
            onClick={() => handleSetView(AppView.CROP_ROTATION_ADVISOR)}
            theme="amber"
          />
          <ActionCard 
            icon={<Leaf className="w-6 h-6" />} 
            label="Carbon Credit Tracker" 
            sub="Monitor your eco-impact and unlock green revenue streams."
            onClick={() => handleSetView(AppView.CARBON_CREDIT_TRACKER)}
            theme="orange"
          />
        </div>
      </section>

      {/* Tasks Section */}
      <section className="px-6 mb-12 space-y-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-2xl font-black text-amber-900 font-mono">02</span>
            <h3 className="text-[11px] font-black text-amber-500/40 uppercase tracking-[0.3em]">Active Tasks</h3>
          </div>
          <button 
            onClick={() => handleSetView(AppView.TASK_MANAGER)}
            className="text-[10px] font-black text-amber-500 uppercase tracking-widest hover:translate-x-1 transition-transform"
          >
            View All
          </button>
        </div>
        
        <div className="space-y-4">
          {loadingTasks ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="w-6 h-6 animate-spin text-amber-500/50" />
            </div>
          ) : tasks.length > 0 ? (
            tasks.map((task, i) => (
              <motion.div 
                key={task.id} 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                onClick={() => handleSetView(AppView.TASK_MANAGER)}
                className="flex items-center gap-6 p-6 bg-stone-950 border border-amber-500/5 rounded-[2.5rem] active:scale-[0.98] transition-all group shadow-sm hover:shadow-xl hover:shadow-black/40"
              >
                <div className={`p-4 rounded-2xl border transition-all group-hover:scale-110 ${
                  task.priority === 'High' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' : 'bg-stone-900 text-stone-500 border-stone-800'
                }`}>
                  <Calendar className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <h4 className="text-xs font-black text-white uppercase tracking-wider mb-1">{task.title}</h4>
                  <p className="text-[9px] text-stone-500 font-bold uppercase tracking-widest">{task.category} • {task.priority} Priority</p>
                </div>
                <ChevronRight className="w-5 h-5 text-stone-700 group-hover:text-amber-500 transition-colors" />
              </motion.div>
            ))
          ) : (
            <div className="py-16 bg-stone-950/50 rounded-[3rem] text-center border border-dashed border-amber-500/10">
               <CheckCircle2 className="w-12 h-12 text-amber-500 mx-auto mb-4 opacity-20" />
               <p className="text-[10px] font-black text-stone-600 uppercase tracking-[0.3em]">All protocols completed</p>
            </div>
          )}
        </div>
      </section>

      {/* FAB - Quick Scan */}
      <motion.button 
        whileHover={{ scale: 1.1, rotate: 5 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => handleSetView(AppView.DISEASE_SCANNER)}
        className="fixed bottom-28 right-6 w-16 h-16 bg-amber-600 text-black rounded-[1.5rem] flex items-center justify-center shadow-2xl shadow-amber-900/40 z-50 border-t border-white/20"
      >
        <Camera className="w-7 h-7" />
      </motion.button>
    </div>
  );
};

const ActionCard: React.FC<{ icon: React.ReactNode, label: string, sub: string, onClick: () => void, theme: 'amber' | 'orange' }> = ({ icon, label, sub, onClick, theme }) => {
  const themes = {
    amber: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
    orange: 'bg-orange-500/10 text-orange-500 border-orange-500/20'
  };

  return (
    <motion.button 
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="w-full bg-stone-950 p-8 rounded-[3rem] border border-amber-500/5 flex items-center gap-6 text-left active:scale-[0.98] transition-all group shadow-sm hover:shadow-2xl hover:shadow-black/40"
    >
      <div className={`${themes[theme]} p-5 rounded-[1.5rem] border transition-all group-hover:scale-110 group-hover:rotate-6`}>
        {icon}
      </div>
      <div>
        <h4 className="text-sm font-black text-white uppercase tracking-wider mb-1 group-hover:text-amber-500 transition-colors">{label}</h4>
        <p className="text-[10px] text-stone-500 font-bold uppercase tracking-widest leading-relaxed max-w-[200px]">{sub}</p>
      </div>
      <ArrowUpRight className="w-6 h-6 text-stone-700 ml-auto group-hover:text-amber-500 transition-colors" />
    </motion.button>
  );
};

const QuickActionPill: React.FC<{ icon: any, label: string, onClick: () => void }> = ({ icon, label, onClick }) => (
  <button
    onClick={onClick}
    className="flex items-center gap-3 px-6 py-4 bg-stone-950 border border-amber-500/5 rounded-full whitespace-nowrap active:scale-90 transition-all shadow-sm hover:shadow-md hover:border-amber-500/20 group"
  >
    <div className="text-stone-500 group-hover:text-amber-500 transition-colors">
      {React.cloneElement(icon as React.ReactElement<any>, { className: "w-4 h-4" })}
    </div>
    <span className="text-[10px] font-black text-stone-400 uppercase tracking-widest group-hover:text-white transition-colors">{label}</span>
  </button>
);


export default Dashboard;
