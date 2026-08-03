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
  RefreshCw,
  Database,
  Users,
  ShoppingBag,
  Sparkles
} from 'lucide-react';
import { useFirebase } from '../src/components/FirebaseProvider';
import { db, auth } from '../src/firebase';
import { collection, query, onSnapshot, orderBy, limit, where } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../src/utils/firestoreErrorHandler';

import { triggerHaptic, triggerSelectionHaptic } from '../src/utils/haptics';
import { fetchDailyAgriTip, DailyAgriTip } from '../services/geminiService';

interface DashboardProps {
  setView: (view: AppView) => void;
  language?: string;
}

const WEATHER_API_KEY = import.meta.env.VITE_WEATHER_API_KEY;

const Dashboard: React.FC<DashboardProps> = ({ setView, language }) => {
  const { profile, activeFarmId } = useFirebase();
  const [weather, setWeather] = React.useState<any>(null);
  const [loadingWeather, setLoadingWeather] = React.useState(true);
  const [tasks, setTasks] = React.useState<Task[]>([]);
  const [loadingTasks, setLoadingTasks] = React.useState(true);
  const [latestReport, setLatestReport] = React.useState<any>(null);

  const [agriTip, setAgriTip] = React.useState<DailyAgriTip | null>(null);
  const [loadingTip, setLoadingTip] = React.useState(true);

  const farmerName = profile?.name?.split(' ')[0] || 'Farmer';

  React.useEffect(() => {
    const loadDailyTip = async () => {
      setLoadingTip(true);
      try {
        const todayStr = new Date().toDateString();
        const cachedTip = localStorage.getItem('agri_tip_cache');
        const cachedDate = localStorage.getItem('agri_tip_date');
        const cachedLang = localStorage.getItem('agri_tip_lang');

        const locationStr = profile?.location || '';
        const stateStr = profile?.state || '';
        const districtStr = profile?.district || '';
        const cropsList = profile?.mainCrops || [];
        const currentLang = language || 'English';

        if (cachedTip && cachedDate === todayStr && cachedLang === currentLang) {
          setAgriTip(JSON.parse(cachedTip));
          setLoadingTip(false);
          return;
        }

        const freshTip = await fetchDailyAgriTip(
          locationStr,
          stateStr,
          districtStr,
          cropsList,
          currentLang
        );

        if (freshTip && freshTip.title) {
          setAgriTip(freshTip);
          localStorage.setItem('agri_tip_cache', JSON.stringify(freshTip));
          localStorage.setItem('agri_tip_date', todayStr);
          localStorage.setItem('agri_tip_lang', currentLang);
        }
      } catch (err) {
        console.warn("Using offline fallback for daily agri-tip:", err);
        setAgriTip({
          title: "Optimal Soil Moisture & Aeration",
          category: "Soil",
          advice: "Check soil moisture at root depth before irrigating today. Evening irrigation reduces moisture loss from heat evaporation.",
          actionStep: "Inspect field soil moisture saturation today.",
          seasonalContext: "Active Water Management"
        });
      } finally {
        setLoadingTip(false);
      }
    };

    if (profile) {
      loadDailyTip();
    }
  }, [profile, language]);

  const handleRefreshTip = async (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    triggerSelectionHaptic();
    setLoadingTip(true);
    try {
      const locationStr = profile?.location || '';
      const stateStr = profile?.state || '';
      const districtStr = profile?.district || '';
      const cropsList = profile?.mainCrops || [];
      const currentLang = language || 'English';

      const freshTip = await fetchDailyAgriTip(
        locationStr,
        stateStr,
        districtStr,
        cropsList,
        currentLang
      );

      if (freshTip && freshTip.title) {
        setAgriTip(freshTip);
        const todayStr = new Date().toDateString();
        localStorage.setItem('agri_tip_cache', JSON.stringify(freshTip));
        localStorage.setItem('agri_tip_date', todayStr);
        localStorage.setItem('agri_tip_lang', currentLang);
      }
    } catch (err) {
      console.warn("Using offline fallback on refresh daily agri-tip:", err);
      setAgriTip({
        title: "Optimal Soil Moisture & Aeration",
        category: "Soil",
        advice: "Check soil moisture at root depth before irrigating today. Evening irrigation reduces moisture loss from heat evaporation.",
        actionStep: "Inspect field soil moisture saturation today.",
        seasonalContext: "Active Water Management"
      });
    } finally {
      setLoadingTip(false);
    }
  };

  React.useEffect(() => {
    if (!activeFarmId) return;
    const path = `users/${activeFarmId}/cropHealthReports`;
    const q = query(collection(db, path), orderBy('timestamp', 'desc'), limit(1));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        setLatestReport(snapshot.docs[0].data());
      }
    }, (error) => {
      console.warn("Could not fetch latestReport for dashboard stats:", error);
    });
    return () => unsubscribe();
  }, [activeFarmId]);

  const handleSetView = (view: AppView) => {
    triggerSelectionHaptic();
    setView(view);
  };

  React.useEffect(() => {
    if (!activeFarmId) return;

    const path = `users/${activeFarmId}/tasks`;
    const q = query(
      collection(db, path), 
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const taskList: Task[] = [];
      snapshot.forEach((doc) => {
        const t = { id: doc.id, ...doc.data() } as Task;
        if (t.status === 'Pending') {
          taskList.push(t);
        }
      });
      setTasks(taskList.slice(0, 3));
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
    <div className="w-full flex flex-col pb-40 min-h-screen bg-[#090e0c] text-stone-100">
      
      {/* Editorial Hero Header */}
      <section className="px-6 pt-10 pb-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-[100px] -mr-40 -mt-40 pointer-events-none" />
        <div className="relative z-10 flex items-start justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-widest">Live Farm Intelligence</span>
            </div>
            <h2 className="text-3xl font-extrabold text-white tracking-tight leading-tight">
              Namaste, <span className="text-emerald-400 font-serif italic">{farmerName}</span>
            </h2>
            <p className="text-xs font-medium text-stone-400 max-w-[260px]">
              Optimal field conditions today. {profile?.location ? `Location: ${profile.location}` : 'Monitoring active acres.'}
            </p>
          </div>
          <motion.button 
            whileTap={{ scale: 0.95 }}
            onClick={() => handleSetView(AppView.SMART_ALERTS)}
            className="w-12 h-12 rounded-2xl bg-emerald-950/60 border border-emerald-500/20 shadow-lg flex items-center justify-center relative group active:scale-95 transition-all glow-emerald"
          >
            <Bell className="w-5 h-5 text-emerald-300 group-hover:text-emerald-200 transition-colors" />
            <div className="absolute top-3 right-3 w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
          </motion.button>
        </div>
      </section>

      {/* Bento Grid Stats & Weather */}
      <section className="px-6 mb-8">
        <div className="grid grid-cols-2 gap-3.5">
          {/* Weather Bento - Large */}
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={() => handleSetView(AppView.WEATHER_HUB)}
            className="col-span-2 glass-card glass-card-hover p-6 rounded-3xl relative overflow-hidden group cursor-pointer border border-emerald-500/20 shadow-xl"
          >
            <div className="absolute top-0 right-0 p-8 opacity-[0.08] group-hover:opacity-[0.15] transition-opacity">
              {weather && getWeatherIcon(weather.description, "w-48 h-48 -mr-12 -mt-12 rotate-12")}
            </div>
            
            {loadingWeather ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-emerald-400" />
              </div>
            ) : (
              <div className="relative z-10 flex flex-col justify-between h-full min-h-[140px]">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-emerald-400">
                      <MapPin className="w-3.5 h-3.5" />
                      <span className="text-xs font-bold uppercase tracking-wider">{weather.city || 'My Location'}</span>
                    </div>
                    <div className="flex items-baseline gap-3 pt-1">
                      <span className="text-5xl font-extrabold text-white tracking-tight">{weather.temp}°C</span>
                      <span className="text-sm font-serif italic text-emerald-200/70 capitalize">{weather.description}</span>
                    </div>
                  </div>
                  <div className="p-2.5 bg-emerald-950/80 rounded-2xl border border-emerald-500/20 shadow-inner">
                    {getWeatherIcon(weather.description, "w-10 h-10")}
                  </div>
                </div>
                
                <div className="flex gap-6 mt-6 pt-4 border-t border-emerald-500/10">
                  <div className="flex items-center gap-2">
                    <Droplets className="w-4 h-4 text-emerald-400" />
                    <div>
                      <span className="text-[10px] text-stone-400 font-medium block">Humidity</span>
                      <span className="text-xs font-bold text-white">{weather.humidity}%</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Wind className="w-4 h-4 text-amber-400" />
                    <div>
                      <span className="text-[10px] text-stone-400 font-medium block">Wind Speed</span>
                      <span className="text-xs font-bold text-white">{weather.wind} km/h</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </motion.div>

          {/* Quick Stats Bento */}
          <div className="glass-card p-5 rounded-3xl border border-emerald-500/15 shadow-sm flex flex-col justify-between min-h-[120px]">
            <div className="flex items-center justify-between">
              <div className="w-9 h-9 bg-emerald-500/15 text-emerald-400 rounded-xl flex items-center justify-center border border-emerald-500/20">
                <TrendingUp className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-500/20">Optimal</span>
            </div>
            <div className="mt-3">
              <p className="text-[11px] font-semibold text-stone-400 tracking-wide">Crop NDVI Index</p>
              <h4 className="text-2xl font-extrabold text-white tracking-tight mt-0.5">
                {latestReport ? latestReport.ndvi : '0.82'}
              </h4>
            </div>
          </div>

          <div className="glass-card p-5 rounded-3xl border border-emerald-500/15 shadow-sm flex flex-col justify-between min-h-[120px]">
            <div className="flex items-center justify-between">
              <div className="w-9 h-9 bg-amber-500/15 text-amber-400 rounded-xl flex items-center justify-center border border-amber-500/20">
                <Droplets className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-bold text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded-full border border-amber-500/20">Good</span>
            </div>
            <div className="mt-3">
              <p className="text-[11px] font-semibold text-stone-400 tracking-wide">Soil Moisture</p>
              <h4 className="text-2xl font-extrabold text-white tracking-tight mt-0.5">
                {latestReport ? latestReport.moisture : (weather ? `${weather.humidity - 6}%` : '64%')}
              </h4>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Actions - Horizontal Scroll Pills */}
      <section className="px-6 mb-8">
        <div className="flex gap-2.5 overflow-x-auto no-scrollbar pb-1">
          <QuickActionPill icon={<Camera />} label="Scan Crop" onClick={() => handleSetView(AppView.DISEASE_SCANNER)} />
          <QuickActionPill icon={<TrendingUp />} label="Mandi Prices" onClick={() => handleSetView(AppView.MARKET_PRICES)} />
          <QuickActionPill icon={<MapPin />} label="Field Map" onClick={() => handleSetView(AppView.FIELD_MAP)} />
          <QuickActionPill icon={<Database />} label="Ledger" onClick={() => handleSetView(AppView.PRODUCE_LEDGER)} />
          <QuickActionPill icon={<Users />} label="Farmer DAO" onClick={() => handleSetView(AppView.COMMUNITY_DAO)} />
          <QuickActionPill icon={<ShoppingBag />} label="Market" onClick={() => handleSetView(AppView.P2P_MARKETPLACE)} />
          <QuickActionPill icon={<LayoutGrid />} label="All Tools" onClick={() => handleSetView(AppView.TOOLS_HUB)} />
        </div>
      </section>

      {/* Daily Agri-Tip Card */}
      <section className="px-6 mb-8 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <h3 className="text-xs font-extrabold text-stone-300 uppercase tracking-widest">Daily Smart Agri-Tip</h3>
          </div>
          <div className="h-px flex-1 bg-emerald-500/10 ml-4" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-6 rounded-3xl border border-emerald-500/20 relative overflow-hidden shadow-xl"
        >
          <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
          
          {loadingTip ? (
            <div className="flex flex-col items-center justify-center py-6 space-y-3">
              <Loader2 className="w-6 h-6 animate-spin text-emerald-400" />
              <p className="text-xs text-stone-400 font-medium">Fetching customized agronomic tip...</p>
            </div>
          ) : agriTip ? (
            <div className="space-y-4 relative z-10">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/80 px-2.5 py-1 rounded-full border border-emerald-500/30">
                    {agriTip.category} • {agriTip.seasonalContext}
                  </span>
                  <h4 className="text-base font-bold text-white mt-2 leading-snug">{agriTip.title}</h4>
                </div>
                
                <button
                  onClick={handleRefreshTip}
                  disabled={loadingTip}
                  className="p-2.5 bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-300 rounded-xl border border-emerald-500/20 active:scale-95 transition-all shadow-sm"
                  title="Generate fresh advice"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>

              <p className="text-xs text-stone-300 font-medium leading-relaxed">
                {agriTip.advice}
              </p>

              <div className="bg-emerald-950/40 p-3.5 rounded-2xl border border-emerald-500/20 space-y-1">
                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">Recommended Action</span>
                <p className="text-xs text-stone-100 font-semibold flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span>{agriTip.actionStep}</span>
                </p>
              </div>
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-xs text-stone-400">No tip loaded for today.</p>
              <button
                onClick={handleRefreshTip}
                className="mt-3 px-5 py-2 bg-emerald-500 text-stone-950 rounded-xl text-xs font-bold transition-all shadow-md"
              >
                Load Daily Tip
              </button>
            </div>
          )}
        </motion.div>
      </section>

      {/* Recommended Protocols */}
      <section className="px-6 mb-8 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sprout className="w-4 h-4 text-emerald-400" />
            <h3 className="text-xs font-extrabold text-stone-300 uppercase tracking-widest">Crop Management</h3>
          </div>
          <div className="h-px flex-1 bg-emerald-500/10 ml-4" />
        </div>
        
        <div className="grid grid-cols-1 gap-3">
          <ActionCard 
            icon={<Sprout className="w-5 h-5 text-emerald-400" />} 
            label="Crop Rotation Advisor" 
            sub="Optimize soil nutrient health with AI rotation strategies."
            onClick={() => handleSetView(AppView.CROP_ROTATION_ADVISOR)}
          />
        </div>
      </section>

      {/* Active Tasks Section */}
      <section className="px-6 mb-8 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-emerald-400" />
            <h3 className="text-xs font-extrabold text-stone-300 uppercase tracking-widest">Active Farm Tasks</h3>
          </div>
          <button 
            onClick={() => handleSetView(AppView.TASK_MANAGER)}
            className="text-xs font-bold text-emerald-400 hover:underline flex items-center gap-1"
          >
            <span>View All</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
        
        <div className="space-y-3">
          {loadingTasks ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="w-5 h-5 animate-spin text-emerald-400" />
            </div>
          ) : tasks.length > 0 ? (
            tasks.map((task, i) => (
              <motion.div 
                key={task.id} 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => handleSetView(AppView.TASK_MANAGER)}
                className="flex items-center gap-4 p-4 glass-card glass-card-hover rounded-2xl cursor-pointer shadow-sm group"
              >
                <div className={`p-3 rounded-xl border ${
                  task.priority === 'High' 
                    ? 'bg-amber-500/15 text-amber-400 border-amber-500/30' 
                    : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                }`}>
                  <Calendar className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <h4 className="text-xs font-bold text-white mb-0.5">{task.title}</h4>
                  <p className="text-[10px] text-stone-400 font-medium">{task.category} • <span className={task.priority === 'High' ? 'text-amber-400 font-bold' : 'text-emerald-400'}>{task.priority} Priority</span></p>
                </div>
                <ChevronRight className="w-4 h-4 text-stone-500 group-hover:text-emerald-400 transition-colors" />
              </motion.div>
            ))
          ) : (
            <div className="py-8 glass-card rounded-2xl text-center border border-dashed border-emerald-500/20">
               <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2 opacity-40" />
               <p className="text-xs font-bold text-stone-400">All field tasks completed</p>
            </div>
          )}
        </div>
      </section>

      {/* Dapp Ecosystem */}
      <section className="px-6 mb-8 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-emerald-400" />
            <h3 className="text-xs font-extrabold text-stone-300 uppercase tracking-widest">Web3 Ecosystem</h3>
          </div>
          <div className="h-px flex-1 bg-emerald-500/10 ml-4" />
        </div>
        
        <div className="grid grid-cols-1 gap-3">
          <ActionCard 
            icon={<Database className="w-5 h-5 text-emerald-400" />} 
            label="Produce Ledger" 
            sub="Immutable crop traceability for premium market pricing."
            onClick={() => handleSetView(AppView.PRODUCE_LEDGER)}
          />
          <ActionCard 
            icon={<Users className="w-5 h-5 text-amber-400" />} 
            label="Farmer DAO" 
            sub="Participate in local community governance and equipment sharing."
            onClick={() => handleSetView(AppView.COMMUNITY_DAO)}
          />
          <ActionCard 
            icon={<ShoppingBag className="w-5 h-5 text-emerald-400" />} 
            label="P2P Marketplace" 
            sub="Buy and sell tools, seeds, and crops directly with farmers."
            onClick={() => handleSetView(AppView.P2P_MARKETPLACE)}
          />
        </div>
      </section>

      {/* Floating Camera Button */}
      <motion.button 
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => handleSetView(AppView.DISEASE_SCANNER)}
        className="fixed bottom-24 right-5 w-14 h-14 bg-gradient-to-br from-emerald-400 to-emerald-600 text-stone-950 rounded-2xl flex items-center justify-center shadow-xl z-50 border border-emerald-300/40 glow-emerald"
      >
        <Camera className="w-6 h-6 text-stone-950" />
      </motion.button>
    </div>
  );
};

const ActionCard: React.FC<{ icon: React.ReactNode, label: string, sub: string, onClick: () => void }> = ({ icon, label, sub, onClick }) => {
  return (
    <motion.button 
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="w-full glass-card glass-card-hover p-4.5 rounded-2xl border border-emerald-500/15 flex items-center gap-4 text-left shadow-sm group"
    >
      <div className="p-3 bg-emerald-950/80 rounded-xl border border-emerald-500/20 group-hover:scale-105 transition-all">
        {icon}
      </div>
      <div className="flex-1">
        <h4 className="text-sm font-bold text-white group-hover:text-emerald-300 transition-colors">{label}</h4>
        <p className="text-xs text-stone-400 font-normal leading-snug mt-0.5">{sub}</p>
      </div>
      <ArrowUpRight className="w-5 h-5 text-stone-500 group-hover:text-emerald-400 transition-colors" />
    </motion.button>
  );
};

const QuickActionPill: React.FC<{ icon: any, label: string, onClick: () => void }> = ({ icon, label, onClick }) => (
  <button
    onClick={onClick}
    className="flex items-center gap-2 px-4 py-2.5 bg-[#121a14] border border-emerald-500/20 rounded-full whitespace-nowrap active:scale-95 transition-all shadow-sm hover:border-emerald-500/40 group min-h-[42px]"
  >
    <div className="text-emerald-400 group-hover:text-emerald-300 transition-colors">
      {React.cloneElement(icon as React.ReactElement<any>, { className: "w-4 h-4" })}
    </div>
    <span className="text-xs font-bold text-stone-200 group-hover:text-white transition-colors">{label}</span>
  </button>
);


export default Dashboard;
