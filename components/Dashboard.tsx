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
  ArrowUpRight
} from 'lucide-react';

interface DashboardProps {
  setView: (view: AppView) => void;
}

const WEATHER_API_KEY = "42d5aa17c7f2866670e62b4c77cb3d32";

const Dashboard: React.FC<DashboardProps> = ({ setView }) => {
  const [weather, setWeather] = React.useState<any>(null);
  const [loadingWeather, setLoadingWeather] = React.useState(true);
  const [tasks] = React.useState<Task[]>(() => {
    const saved = localStorage.getItem('agri_tasks');
    return saved ? JSON.parse(saved) : [];
  });

  const pendingTasks = tasks.filter(t => t.status === 'Pending').slice(0, 4);

  React.useEffect(() => {
    const fetchWeather = async (lat: number, lon: number) => {
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

    navigator.geolocation.getCurrentPosition(
      (pos) => fetchWeather(pos.coords.latitude, pos.coords.longitude),
      () => fetchWeather(28.6139, 77.2090)
    );
  }, []);

  const getWeatherIcon = (description: string, size: string = "w-10 h-10") => {
    const desc = description.toLowerCase();
    if (desc.includes('rain')) return <CloudRain className={`${size} text-blue-500`} />;
    if (desc.includes('cloud')) return <Cloud className={`${size} text-gray-400`} />;
    if (desc.includes('clear')) return <Sun className={`${size} text-amber-500`} />;
    if (desc.includes('storm')) return <CloudLightning className={`${size} text-purple-500`} />;
    return <CloudSun className={`${size} text-amber-400`} />;
  };

  return (
    <div className="w-full flex flex-col pb-32 bg-stone-50/50 min-h-full">
      
      {/* Native App Header */}
      <section className="px-6 pt-6 pb-4">
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[9px] font-black text-amber-600 uppercase tracking-[0.2em] mb-0.5">Welcome back,</span>
            <h2 className="text-2xl font-black text-stone-950 tracking-tight leading-none">
              {localStorage.getItem('agri_farmer_name')?.split(' ')[0] || 'Farmer'}
            </h2>
          </div>
          <motion.button 
            whileTap={{ scale: 0.9 }}
            onClick={() => setView(AppView.SMART_ALERTS)}
            className="w-10 h-10 bg-white rounded-xl shadow-sm border border-stone-100 flex items-center justify-center relative"
          >
            <Bell className="w-4 h-4 text-stone-400" />
            <div className="absolute top-3 right-3 w-1.5 h-1.5 bg-amber-500 rounded-full border-2 border-white"></div>
          </motion.button>
        </div>
      </section>

      {/* Weather Widget - Native Style */}
      <section className="px-6 mb-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={() => setView(AppView.WEATHER_HUB)}
          className="bg-gradient-to-br from-amber-500 via-orange-500 to-rose-500 rounded-3xl p-6 border border-white/10 shadow-2xl shadow-orange-200/20 relative overflow-hidden group active:scale-[0.98] transition-all text-white"
        >
          {loadingWeather ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="w-6 h-6 animate-spin text-white/20" />
            </div>
          ) : (
            <div className="flex justify-between items-center relative z-10">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-white/60">
                  <MapPin className="w-3 h-3" />
                  <span className="text-[10px] font-black uppercase tracking-widest">{weather.city}</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-black tracking-tighter text-white">{weather.temp}°</span>
                  <span className="text-base font-bold text-white/80 uppercase">{weather.description}</span>
                </div>
                <div className="flex gap-4 pt-1">
                  <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-md px-2.5 py-1 rounded-xl border border-white/10">
                    <Droplets className="w-3 h-3 text-white" />
                    <span className="text-[9px] font-black text-white">{weather.humidity}%</span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-md px-2.5 py-1 rounded-xl border border-white/10">
                    <Wind className="w-3 h-3 text-white" />
                    <span className="text-[9px] font-black text-white">{weather.wind} km/h</span>
                  </div>
                </div>
              </div>
              <div className="opacity-40">
                {getWeatherIcon(weather.description, "w-16 h-16 text-white")}
              </div>
            </div>
          )}
        </motion.div>
      </section>

      {/* Main Action Grid */}
      <section className="px-6 mb-10">
        <div className="grid grid-cols-2 gap-4">
          <ActionCard 
            icon={<Camera className="w-5 h-5" />} 
            label="Disease Scan" 
            sub="AI Diagnosis"
            color="bg-rose-500"
            onClick={() => setView(AppView.DISEASE_SCANNER)}
          />
          <ActionCard 
            icon={<MapPin className="w-5 h-5" />} 
            label="Field Map" 
            sub="Plot Intel"
            color="bg-amber-500"
            onClick={() => setView(AppView.FIELD_MAP)}
          />
          <ActionCard 
            icon={<TrendingUp className="w-5 h-5" />} 
            label="Market" 
            sub="Live Prices"
            color="bg-orange-500"
            onClick={() => setView(AppView.MARKET_PRICES)}
          />
          <ActionCard 
            icon={<LayoutGrid className="w-5 h-5" />} 
            label="Arsenal" 
            sub="Smart Tools"
            color="bg-stone-900"
            onClick={() => setView(AppView.TOOLS_HUB)}
          />
        </div>
      </section>

      {/* Mandi Ticker - Compact */}
      <section className="w-full overflow-hidden bg-stone-950 py-3 mb-10">
        <div className="flex whitespace-nowrap animate-marquee">
          {[1, 2].map((i) => (
            <div key={i} className="flex items-center gap-12 px-6">
              <TickerItem label="WHEAT" value="₹2,450" change="+1.2%" up />
              <TickerItem label="COTTON" value="₹7,800" change="-0.4%" />
              <TickerItem label="RICE" value="₹3,100" change="+2.8%" up />
              <TickerItem label="MAIZE" value="₹1,950" change="+0.5%" up />
            </div>
          ))}
        </div>
      </section>

      {/* Operational Agenda */}
      <section className="px-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-[11px] font-black text-stone-400 uppercase tracking-[0.2em]">Operational Agenda</h3>
          <button onClick={() => setView(AppView.TASK_MANAGER)} className="text-[10px] font-black text-amber-600 uppercase tracking-widest">View All</button>
        </div>
        
        <div className="space-y-4">
          {pendingTasks.length > 0 ? (
            pendingTasks.map((task, i) => (
              <motion.div 
                key={task.id} 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                onClick={() => setView(AppView.TASK_MANAGER)}
                className="bg-white p-4 rounded-2xl border border-stone-100 flex items-center gap-4 active:scale-[0.98] transition-all shadow-sm"
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  task.priority === 'High' ? 'bg-rose-50 text-rose-600' : 'bg-stone-50 text-stone-400'
                }`}>
                  <Calendar className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <p className="font-black text-stone-900 text-xs leading-tight">{task.title}</p>
                  <p className="text-[9px] text-stone-400 font-bold uppercase tracking-widest mt-1">{task.category}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-stone-200" />
              </motion.div>
            ))
          ) : (
            <div className="py-10 bg-white rounded-3xl text-center border border-dashed border-stone-200">
               <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
               <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest">No Pending Tasks</p>
            </div>
          )}
        </div>
      </section>

      {/* Marquee CSS */}
      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          animation: marquee 30s linear infinite;
        }
      `}</style>
    </div>
  );
};

const ActionCard: React.FC<{ icon: React.ReactNode, label: string, sub: string, color: string, onClick: () => void }> = ({ icon, label, sub, color, onClick }) => (
  <motion.button 
    whileTap={{ scale: 0.95 }}
    onClick={onClick}
    className="bg-white p-5 rounded-3xl border border-stone-100 text-left shadow-sm active:shadow-inner transition-all flex flex-col gap-3"
  >
    <div className={`w-10 h-10 ${color} rounded-xl flex items-center justify-center text-white shadow-lg`}>
      {icon}
    </div>
    <div>
      <p className="font-black text-stone-950 text-xs leading-none mb-1">{label}</p>
      <p className="text-[8px] font-bold text-stone-400 uppercase tracking-widest">{sub}</p>
    </div>
  </motion.button>
);

const TickerItem: React.FC<{ label: string, value: string, change: string, up?: boolean }> = ({ label, value, change, up }) => (
  <div className="flex items-center gap-3">
    <span className="text-[10px] font-black text-stone-500 tracking-widest">{label}</span>
    <span className="text-sm font-black text-white">{value}</span>
    <span className={`text-[10px] font-black ${up ? 'text-emerald-400' : 'text-rose-400'}`}>{change}</span>
  </div>
);

export default Dashboard;
