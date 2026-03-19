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
      limit(4)
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
  }, []);

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
    if (desc.includes('rain')) return <CloudRain className={`${size} text-[var(--m3-primary)]`} />;
    if (desc.includes('cloud')) return <Cloud className={`${size} text-[var(--m3-on-surface-variant)]`} />;
    if (desc.includes('clear')) return <Sun className={`${size} text-amber-600`} />;
    if (desc.includes('storm')) return <CloudLightning className={`${size} text-purple-600`} />;
    return <CloudSun className={`${size} text-amber-500`} />;
  };

  return (
    <div className="w-full flex flex-col pb-32 bg-transparent min-h-full">
      
      {/* Welcome Header */}
      <section className="px-4 pt-4 pb-6">
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <h2 className="text-2xl font-medium text-[var(--m3-on-surface)] m3-headline-large">
              Namaste, <span className="text-[var(--m3-primary)]">{farmerName}</span>
            </h2>
            <p className="text-sm text-[var(--m3-on-surface-variant)] m3-body-medium">
              Here's what's happening on your farm today.
            </p>
          </div>
          <motion.button 
            whileTap={{ scale: 0.9 }}
            onClick={() => handleSetView(AppView.SMART_ALERTS)}
            className="w-12 h-12 rounded-full active:bg-[var(--m3-surface-container-high)] flex items-center justify-center relative transition-all"
          >
            <Bell className="w-6 h-6 text-[var(--m3-on-surface-variant)]" />
            <div className="absolute top-3 right-3 w-2 h-2 bg-[var(--m3-error)] rounded-full border-2 border-[var(--m3-background)]"></div>
          </motion.button>
        </div>
      </section>

      {/* Weather Card (M3 Elevated) */}
      <section className="px-4 mb-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={() => handleSetView(AppView.WEATHER_HUB)}
          className="m3-card-elevated p-6 relative overflow-hidden group cursor-pointer"
        >
          {loadingWeather ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="w-8 h-8 animate-spin text-[var(--m3-primary)] opacity-50" />
            </div>
          ) : (
            <div className="flex justify-between items-center">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-[var(--m3-primary)]">
                  <MapPin className="w-4 h-4" />
                  <span className="text-xs font-medium m3-label-large">{weather.city}</span>
                  <button 
                    onClick={refreshWeather}
                    className="p-1 hover:bg-[var(--m3-primary-container)] rounded-full transition-colors"
                    title="Refresh location"
                  >
                    <RefreshCw className="w-3 h-3" />
                  </button>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-medium text-[var(--m3-on-surface)] m3-display-large">{weather.temp}°</span>
                  <span className="text-lg font-medium text-[var(--m3-on-surface-variant)] capitalize">{weather.description}</span>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                {getWeatherIcon(weather.description, "w-16 h-16")}
                <div className="flex gap-4">
                  <div className="flex items-center gap-1 text-[var(--m3-on-surface-variant)]">
                    <Droplets className="w-4 h-4" />
                    <span className="text-xs font-medium">{weather.humidity}%</span>
                  </div>
                  <div className="flex items-center gap-1 text-[var(--m3-on-surface-variant)]">
                    <Wind className="w-4 h-4" />
                    <span className="text-xs font-medium">{weather.wind} km/h</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </section>

      {/* Quick Actions Grid (M3 Style) */}
      <section className="px-4 mb-8">
        <div className="grid grid-cols-4 gap-2">
          <QuickAction 
            icon={<Camera />} 
            label="Scan" 
            onClick={() => handleSetView(AppView.DISEASE_SCANNER)} 
          />
          <QuickAction 
            icon={<TrendingUp />} 
            label="Prices" 
            onClick={() => handleSetView(AppView.MARKET_PRICES)} 
          />
          <QuickAction 
            icon={<MapPin />} 
            label="Map" 
            onClick={() => handleSetView(AppView.FIELD_MAP)} 
          />
          <QuickAction 
            icon={<Truck />} 
            label="Rent" 
            onClick={() => handleSetView(AppView.EQUIPMENT_RENTAL)} 
          />
        </div>
      </section>

      {/* Main Features (M3 Filled Cards) */}
      <section className="px-4 mb-8">
        <h3 className="text-sm font-medium text-[var(--m3-on-surface-variant)] mb-4 px-2 m3-label-large uppercase tracking-wider">Recommended for you</h3>
        <div className="grid grid-cols-2 gap-4">
          <ActionCard 
            icon={<Sprout className="w-6 h-6" />} 
            label="Crop Rotation" 
            sub="Optimize Soil"
            onClick={() => handleSetView(AppView.CROP_ROTATION_ADVISOR)}
          />
          <ActionCard 
            icon={<Leaf className="w-6 h-6" />} 
            label="Carbon Credits" 
            sub="Green Revenue"
            onClick={() => handleSetView(AppView.CARBON_CREDIT_TRACKER)}
          />
          <ActionCard 
            icon={<Calendar className="w-6 h-6" />} 
            label="Harvest Plan" 
            sub="Schedule Now"
            onClick={() => handleSetView(AppView.HARVEST_SCHEDULER)}
          />
          <ActionCard 
            icon={<LayoutGrid className="w-6 h-6" />} 
            label="Tools Hub" 
            sub="All Services"
            onClick={() => handleSetView(AppView.TOOLS_HUB)}
          />
        </div>
      </section>

      {/* Tasks (M3 Outlined Cards) */}
      <section className="px-4 mb-8">
        <div className="flex items-center justify-between mb-4 px-2">
          <h3 className="text-sm font-medium text-[var(--m3-on-surface-variant)] m3-label-large uppercase tracking-wider">Upcoming Tasks</h3>
          <button 
            onClick={() => handleSetView(AppView.TASK_MANAGER)} 
            className="text-sm font-medium text-[var(--m3-primary)]"
          >
            See all
          </button>
        </div>
        
        <div className="space-y-3">
          {tasks.length > 0 ? (
            tasks.map((task, i) => (
              <motion.div 
                key={task.id} 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => handleSetView(AppView.TASK_MANAGER)}
                className="m3-card-outlined p-4 flex items-center gap-4 active:bg-[var(--m3-surface-container-high)] transition-all"
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  task.priority === 'High' ? 'bg-[var(--m3-error-container)] text-[var(--m3-on-error-container)]' : 'bg-[var(--m3-surface-container-high)] text-[var(--m3-on-surface-variant)]'
                }`}>
                  <Calendar className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <p className="text-base font-medium text-[var(--m3-on-surface)] m3-title-medium">{task.title}</p>
                  <p className="text-xs text-[var(--m3-on-surface-variant)] m3-body-medium">{task.category} • {task.priority} Priority</p>
                </div>
                <ChevronRight className="w-5 h-5 text-[var(--m3-on-surface-variant)]" />
              </motion.div>
            ))
          ) : (
            <div className="py-12 bg-[var(--m3-surface-container-low)] rounded-3xl text-center border border-dashed border-[var(--m3-outline-variant)]">
               <CheckCircle2 className="w-10 h-10 text-[var(--m3-primary)] mx-auto mb-2 opacity-30" />
               <p className="text-sm font-medium text-[var(--m3-on-surface-variant)]">All tasks completed!</p>
            </div>
          )}
        </div>
      </section>

      {/* FAB - Quick Scan */}
      <button 
        onClick={() => handleSetView(AppView.DISEASE_SCANNER)}
        className="m3-fab"
      >
        <Camera className="w-6 h-6" />
      </button>
    </div>
  );
};

const ActionCard: React.FC<{ icon: React.ReactNode, label: string, sub: string, onClick: () => void }> = ({ icon, label, sub, onClick }) => (
  <motion.button 
    whileTap={{ scale: 0.98 }}
    onClick={onClick}
    className="m3-card-filled p-5 text-left flex flex-col gap-3 active:bg-[var(--m3-surface-container-highest)] transition-all"
  >
    <div className="w-10 h-10 bg-[var(--m3-primary-container)] text-[var(--m3-on-primary-container)] rounded-xl flex items-center justify-center">
      {icon}
    </div>
    <div>
      <p className="font-medium text-[var(--m3-on-surface)] m3-title-medium leading-tight">{label}</p>
      <p className="text-xs text-[var(--m3-on-surface-variant)] m3-body-medium">{sub}</p>
    </div>
  </motion.button>
);

const QuickAction: React.FC<{ icon: any, label: string, onClick: () => void }> = ({ icon, label, onClick }) => (
  <button
    onClick={onClick}
    className="flex flex-col items-center gap-2 py-2"
  >
    <div className="w-14 h-14 bg-[var(--m3-secondary-container)] text-[var(--m3-on-secondary-container)] rounded-2xl flex items-center justify-center active:scale-90 transition-transform">
      {React.cloneElement(icon as React.ReactElement<any>, { className: "w-6 h-6" })}
    </div>
    <span className="text-xs font-medium text-[var(--m3-on-surface-variant)] m3-label-medium">{label}</span>
  </button>
);

export default Dashboard;
