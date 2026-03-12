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

  const farmerName = localStorage.getItem('agri_farmer_name')?.split(' ')[0] || 'Farmer';
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
    if (desc.includes('rain')) return <CloudRain className={`${size} text-blue-600`} />;
    if (desc.includes('cloud')) return <Cloud className={`${size} text-stone-400`} />;
    if (desc.includes('clear')) return <Sun className={`${size} text-amber-600`} />;
    if (desc.includes('storm')) return <CloudLightning className={`${size} text-purple-600`} />;
    return <CloudSun className={`${size} text-amber-500`} />;
  };

  return (
    <div className="w-full flex flex-col pb-32 bg-transparent min-h-full">
      
      {/* Welcome Header */}
      <section className="px-6 pt-10 pb-6">
        <div className="flex items-center justify-between border-b border-stone-200 pb-8">
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-[0.3em] mb-2">Daily Overview</span>
            <h2 className="text-4xl font-bold text-stone-900 tracking-tight font-serif">
              Namaste, <span className="text-emerald-700">{farmerName}.</span>
            </h2>
          </div>
          <div className="flex gap-2">
            <motion.button 
              whileTap={{ scale: 0.9 }}
              onClick={() => setView(AppView.SMART_ALERTS)}
              className="w-12 h-12 bg-white rounded-2xl border border-stone-200 flex items-center justify-center relative shadow-sm hover:border-emerald-600/50 transition-all"
            >
              <Bell className="w-5 h-5 text-stone-400" />
              <div className="absolute top-3.5 right-3.5 w-2.5 h-2.5 bg-emerald-600 rounded-full border-2 border-white shadow-sm"></div>
            </motion.button>
          </div>
        </div>
      </section>

      {/* Quick Actions Grid */}
      <section className="px-6 mb-10">
        <div className="grid grid-cols-4 gap-4">
          <QuickAction 
            icon={<Camera />} 
            label="Scan" 
            color="bg-emerald-50 text-emerald-700" 
            onClick={() => setView(AppView.DISEASE_SCANNER)} 
          />
          <QuickAction 
            icon={<TrendingUp />} 
            label="Prices" 
            color="bg-amber-50 text-amber-700" 
            onClick={() => setView(AppView.MARKET_PRICES)} 
          />
          <QuickAction 
            icon={<MapPin />} 
            label="Map" 
            color="bg-blue-50 text-blue-700" 
            onClick={() => setView(AppView.FIELD_MAP)} 
          />
          <QuickAction 
            icon={<LayoutGrid />} 
            label="Tools" 
            color="bg-stone-100 text-stone-700" 
            onClick={() => setView(AppView.TOOLS_HUB)} 
          />
        </div>
      </section>

      {/* Weather Card */}
      <section className="px-6 mb-10">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={() => setView(AppView.WEATHER_HUB)}
          className="bg-white rounded-[2.5rem] p-8 border border-stone-200 relative overflow-hidden group cursor-pointer hover:border-emerald-600/30 transition-all shadow-xl shadow-stone-200/50"
        >
          <div className="absolute top-0 right-0 p-12 opacity-[0.05] group-hover:opacity-[0.1] transition-opacity">
            {weather && getWeatherIcon(weather.description, "w-64 h-64 rotate-12")}
          </div>
          
          {loadingWeather ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-600/30" />
            </div>
          ) : (
            <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-8">
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-emerald-600 shadow-sm" />
                  <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-[0.2em]">{weather.city} Weather</span>
                </div>
                <div className="flex items-baseline gap-4">
                  <span className="text-7xl font-bold font-serif tracking-tighter text-stone-900">{weather.temp}°</span>
                  <div className="flex flex-col">
                    <span className="text-xl font-bold text-emerald-800 capitalize leading-none mb-1">{weather.description}</span>
                    <span className="text-[10px] font-medium text-stone-400 uppercase tracking-widest">Current Conditions</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:flex sm:flex-col">
                <div className="bg-stone-50 border border-stone-100 p-4 rounded-2xl flex items-center gap-4 min-w-[140px]">
                  <div className="p-2 bg-emerald-100 rounded-lg"><Droplets className="w-4 h-4 text-emerald-700" /></div>
                  <div className="flex flex-col">
                    <span className="text-[8px] font-bold text-stone-400 uppercase">Humidity</span>
                    <span className="text-sm font-bold text-stone-800">{weather.humidity}%</span>
                  </div>
                </div>
                <div className="bg-stone-50 border border-stone-100 p-4 rounded-2xl flex items-center gap-4 min-w-[140px]">
                  <div className="p-2 bg-emerald-100 rounded-lg"><Wind className="w-4 h-4 text-emerald-700" /></div>
                  <div className="flex flex-col">
                    <span className="text-[8px] font-bold text-stone-400 uppercase">Wind</span>
                    <span className="text-sm font-bold text-stone-800">{weather.wind} <span className="text-[10px] opacity-60">km/h</span></span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </section>

      {/* Quick Actions */}
      <section className="px-6 mb-12">
        <div className="grid grid-cols-2 gap-4">
          <ActionCard 
            icon={<Camera className="w-5 h-5" />} 
            label="Disease Scan" 
            sub="AI Diagnosis"
            color="bg-rose-50 text-rose-600 border-rose-100"
            onClick={() => setView(AppView.DISEASE_SCANNER)}
          />
          <ActionCard 
            icon={<MapPin className="w-5 h-5" />} 
            label="Field Map" 
            sub="Land Tracking"
            color="bg-blue-50 text-blue-600 border-blue-100"
            onClick={() => setView(AppView.FIELD_MAP)}
          />
          <ActionCard 
            icon={<TrendingUp className="w-5 h-5" />} 
            label="Market" 
            sub="Live Prices"
            color="bg-emerald-50 text-emerald-700 border-emerald-100"
            onClick={() => setView(AppView.MARKET_PRICES)}
          />
          <ActionCard 
            icon={<LayoutGrid className="w-5 h-5" />} 
            label="Tools Hub" 
            sub="All Services"
            color="bg-stone-50 text-stone-600 border-stone-100"
            onClick={() => setView(AppView.TOOLS_HUB)}
          />
        </div>
      </section>

      {/* Ticker */}
      <section className="w-full overflow-hidden bg-emerald-50/50 border-y border-emerald-100 py-5 mb-12">
        <div className="flex whitespace-nowrap animate-marquee">
          {[1, 2].map((i) => (
            <div key={i} className="flex items-center gap-16 px-8">
              <TickerItem label="WHEAT/INR" value="2,450" change="+1.2%" up />
              <TickerItem label="COTTON/INR" value="7,800" change="-0.4%" />
              <TickerItem label="RICE/INR" value="3,100" change="+2.8%" up />
              <TickerItem label="MAIZE/INR" value="1,950" change="+0.5%" up />
              <TickerItem label="SOY/INR" value="4,200" change="+1.1%" up />
            </div>
          ))}
        </div>
      </section>

      {/* Recommendations */}
      <section className="px-6 mb-12">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-5 bg-emerald-600 rounded-full" />
            <h3 className="text-[10px] font-bold text-stone-400 uppercase tracking-[0.3em]">Smart Suggestions</h3>
          </div>
        </div>
        <div className="bg-white border border-stone-200 rounded-[2.5rem] p-8 flex items-center justify-between group active:scale-[0.98] transition-all cursor-pointer hover:border-emerald-600/50 hover:shadow-lg shadow-stone-200/30" onClick={() => setView(AppView.CROP_ROTATION_ADVISOR)}>
          <div className="flex items-center gap-8">
            <div className="w-20 h-20 rounded-[1.5rem] bg-emerald-50 flex items-center justify-center border border-emerald-100 text-emerald-700 group-hover:bg-emerald-600 group-hover:text-white transition-all">
              <Sprout className="w-10 h-10" />
            </div>
            <div>
              <p className="font-bold text-stone-900 text-2xl tracking-tight leading-none mb-2 font-serif">Crop Rotation Advisor</p>
              <div className="flex items-center gap-3">
                <span className="text-[10px] text-stone-400 font-bold uppercase tracking-widest">Status: Ready</span>
                <div className="w-1 h-1 rounded-full bg-stone-200" />
                <span className="text-[10px] text-emerald-700 font-bold uppercase tracking-widest">Optimized for {localStorage.getItem('agri_soil_type') || 'Soil'}</span>
              </div>
            </div>
          </div>
          <div className="w-14 h-14 bg-stone-50 rounded-2xl flex items-center justify-center text-stone-300 group-hover:text-emerald-600 group-hover:bg-emerald-50 transition-all border border-stone-100 group-hover:border-emerald-200">
            <ArrowUpRight className="w-8 h-8" />
          </div>
        </div>
      </section>

      {/* Tasks */}
      <section className="px-6">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-5 bg-emerald-600 rounded-full" />
            <h3 className="text-[10px] font-bold text-stone-400 uppercase tracking-[0.3em]">Your Tasks</h3>
          </div>
          <button onClick={() => setView(AppView.TASK_MANAGER)} className="text-[10px] font-bold text-emerald-700 hover:text-emerald-800 uppercase tracking-widest bg-emerald-50 px-5 py-2.5 rounded-full transition-all border border-emerald-100">View All</button>
        </div>
        
        <div className="space-y-4">
          {pendingTasks.length > 0 ? (
            pendingTasks.map((task, i) => (
              <motion.div 
                key={task.id} 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => setView(AppView.TASK_MANAGER)}
                className="bg-white p-6 rounded-[2rem] flex items-center gap-6 group active:scale-[0.98] transition-all border border-stone-200 hover:border-emerald-600/30 hover:shadow-md shadow-stone-200/20"
              >
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all border ${
                  task.priority === 'High' ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-stone-50 text-stone-400 border-stone-100'
                }`}>
                  <Calendar className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <p className="text-lg font-bold text-stone-900 leading-tight mb-1 font-serif">{task.title}</p>
                  <div className="flex items-center gap-3">
                    <span className="text-[9px] font-bold text-stone-400 uppercase tracking-widest">{task.category}</span>
                    <div className="w-1 h-1 rounded-full bg-stone-200" />
                    <span className={`text-[9px] font-bold uppercase tracking-widest ${task.priority === 'High' ? 'text-rose-600' : 'text-stone-400'}`}>{task.priority} Priority</span>
                  </div>
                </div>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-stone-300 group-hover:text-emerald-600 transition-all">
                  <ChevronRight className="w-6 h-6" />
                </div>
              </motion.div>
            ))
          ) : (
            <div className="py-16 bg-white rounded-[2.5rem] text-center border border-dashed border-stone-200">
               <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto mb-4 opacity-20" />
               <p className="text-[10px] font-bold text-stone-400 uppercase tracking-[0.3em]">All caught up!</p>
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <section className="px-6 mt-20 mb-10 text-center">
        <div className="flex items-center justify-center gap-4 mb-4 opacity-30">
          <div className="h-px w-12 bg-stone-300" />
          <span className="text-[8px] font-bold uppercase tracking-[0.5em] text-stone-400">Bharat Kisan</span>
          <div className="h-px w-12 bg-stone-300" />
        </div>
        <p className="text-[8px] font-bold text-stone-300 uppercase tracking-[0.3em]">
          © {new Date().getFullYear()} BHARAT-KISAN-SYSTEMS
        </p>
        <p className="text-[8px] font-bold text-stone-400 uppercase tracking-[0.2em] mt-3 opacity-60">
          App Designed and Developed by Nexus Creative Studio
        </p>
      </section>
    </div>
  );
};

const ActionCard: React.FC<{ icon: React.ReactNode, label: string, sub: string, color: string, onClick: () => void }> = ({ icon, label, sub, color, onClick }) => (
  <motion.button 
    whileTap={{ scale: 0.95 }}
    onClick={onClick}
    className="bg-white p-5 rounded-[2rem] border border-stone-200 text-left shadow-sm hover:shadow-md hover:border-emerald-600/20 transition-all flex flex-col gap-4"
  >
    <div className={`w-12 h-12 ${color} rounded-2xl flex items-center justify-center border shadow-sm`}>
      {icon}
    </div>
    <div>
      <p className="font-bold text-stone-900 text-sm leading-none mb-1 font-serif">{label}</p>
      <p className="text-[9px] font-bold text-stone-400 uppercase tracking-[0.1em]">{sub}</p>
    </div>
  </motion.button>
);

const TickerItem: React.FC<{ label: string, value: string, change: string, up?: boolean }> = ({ label, value, change, up }) => (
  <div className="flex items-center gap-3">
    <span className="text-[10px] font-bold text-stone-400 tracking-wider">{label}</span>
    <span className="text-sm font-bold text-stone-800">{value}</span>
    <span className={`text-[10px] font-bold ${up ? 'text-emerald-700' : 'text-rose-600'}`}>{change}</span>
  </div>
);

const QuickAction: React.FC<{ icon: any, label: string, color: string, onClick: () => void }> = ({ icon, label, color, onClick }) => (
  <motion.button
    whileTap={{ scale: 0.9 }}
    onClick={onClick}
    className="flex flex-col items-center gap-2"
  >
    <div className={`w-14 h-14 ${color} rounded-2xl flex items-center justify-center shadow-sm border border-black/5`}>
      {React.cloneElement(icon as React.ReactElement<any>, { className: "w-6 h-6" })}
    </div>
    <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">{label}</span>
  </motion.button>
);

export default Dashboard;
