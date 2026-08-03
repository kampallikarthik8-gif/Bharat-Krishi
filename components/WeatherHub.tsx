import React from 'react';
import { 
  CloudSun, 
  Droplets, 
  Wind, 
  Thermometer, 
  Sunrise, 
  Sunset, 
  Loader2, 
  Zap, 
  AlertTriangle, 
  CloudRain, 
  Sun, 
  Moon, 
  Navigation, 
  ChevronRight,
  ShieldAlert,
  Waves,
  Eye,
  ArrowRight,
  TrendingUp,
  CloudLightning,
  Sparkles,
  Info,
  Languages as LangIcon,
  RefreshCw,
  LocateFixed,
  MapPin,
  Search,
  X,
  AlertCircle,
  Share2,
  CheckCircle2,
  Play,
  Pause,
  Flame,
  ShieldCheck,
  Compass,
  Layers,
  Activity,
  CheckSquare,
  Square,
  Calendar,
  Sprout,
  Umbrella,
  Check,
  Copy
} from 'lucide-react';
import { getWeatherAdvisory } from '../services/geminiService';
import Markdown from 'react-markdown';
import { motion, AnimatePresence } from 'motion/react';

const WEATHER_API_KEY = import.meta.env.VITE_WEATHER_API_KEY;

// Agronomic Calculation Helpers
const getMoonPhase = (date: Date = new Date()) => {
  const year = date.getFullYear();
  let month = date.getMonth() + 1;
  const day = date.getDate();
  let c = 0, e = 0, jd = 0, b = 0;
  if (month < 3) {
    c = 365.25 * (year - 1);
    e = 30.6 * (month + 13);
  } else {
    c = 365.25 * year;
    e = 30.6 * (month + 1);
  }
  jd = c + e + day - 694039.09;
  jd /= 29.5305882;
  b = Math.floor(jd);
  jd -= b;
  const age = Math.round(jd * 29.53);
  
  if (age === 0 || age === 29) return { phase: "New Moon (Amavasya)", icon: "🌑", description: "Ideal for soil tilling, root pruning, and applying organic manure." };
  if (age < 7) return { phase: "Waxing Crescent", icon: "🌒", description: "Rising plant sap. High germination rate for grain & vegetable seeds." };
  if (age < 9) return { phase: "First Quarter", icon: "🌓", description: "Favorable window for planting above-ground leafy & flowering crops." };
  if (age < 15) return { phase: "Waxing Gibbous", icon: "🌔", description: "High moisture uptake in plants. Ideal for transplanting paddy & nursery seedlings." };
  if (age === 15) return { phase: "Full Moon (Purnima)", icon: "🌕", description: "Peak plant sap activity & hydration. Prime time for foliar bio-fertilizer application." };
  if (age < 22) return { phase: "Waning Gibbous", icon: "🌖", description: "Energy shifts to roots. Great for tuber & root crops (Potato, Onion, Carrot, Radish)." };
  if (age < 24) return { phase: "Last Quarter", icon: "🌗", description: "Favorable period for harvesting, timber cutting, and weed control." };
  return { phase: "Waning Crescent", icon: "🌘", description: "Decreasing moisture activity. Ideal for field sanitation, composting, and land prep." };
};

const calculateUVIndex = (temp: number, cloudiness: number) => {
  const hour = new Date().getHours();
  if (hour < 6 || hour > 18) return { uv: 0, level: "Low (Night)", color: "text-stone-400", recommendation: "Safe for all field operations." };
  const hourFactor = Math.sin(((hour - 6) / 12) * Math.PI);
  const cloudFactor = 1 - (cloudiness / 100) * 0.5;
  const baseUv = Math.min(11, Math.max(1, Math.round(9 * hourFactor * cloudFactor * (temp > 32 ? 1.15 : 1.0))));
  if (baseUv <= 2) return { uv: baseUv, level: "Low Risk", color: "text-emerald-400", recommendation: "Safe for all outdoor farm work." };
  if (baseUv <= 5) return { uv: baseUv, level: "Moderate Risk", color: "text-amber-400", recommendation: "Wear cotton headgear/gamcha during field labor." };
  if (baseUv <= 7) return { uv: baseUv, level: "High UV Exposure", color: "text-orange-400", recommendation: "Schedule heavy labor before 11:00 AM or after 3:30 PM." };
  if (baseUv <= 10) return { uv: baseUv, level: "Very High Heat & UV", color: "text-rose-400", recommendation: "Avoid direct sun mid-day. Provide clean shade for cattle." };
  return { uv: baseUv, level: "Extreme Solar Stress", color: "text-purple-400", recommendation: "Critical solar heat! Rest workers and hydrate cattle frequently." };
};

const calculateSprayingSuitability = (windSpeedKmh: number, humidity: number, pop: number) => {
  if (pop > 0.4) return { status: "Unfavorable", reason: "Rain probability > 40%. Chemical spray will wash off.", badgeColor: "bg-rose-500/20 text-rose-300 border-rose-500/30" };
  if (windSpeedKmh > 20) return { status: "High Drift Danger", reason: `High wind speed (${windSpeedKmh} km/h). Severe chemical drift risk.`, badgeColor: "bg-rose-500/20 text-rose-300 border-rose-500/30" };
  if (windSpeedKmh > 14) return { status: "Moderate Wind Risk", reason: `Wind (${windSpeedKmh} km/h). Use low-drift flat fan nozzles.`, badgeColor: "bg-amber-500/20 text-amber-300 border-amber-500/30" };
  if (humidity > 85) return { status: "Slow Drying", reason: "High humidity delays spray droplet drying time on leaves.", badgeColor: "bg-amber-500/20 text-amber-300 border-amber-500/30" };
  return { status: "Optimal Spray Window", reason: `Calm breeze (${windSpeedKmh} km/h) & low rain risk. Ideal for foliar application.`, badgeColor: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" };
};

const calculateIrrigationAdvice = (temp: number, humidity: number, pop: number) => {
  if (pop >= 0.45) return { advice: "Pause Irrigation", detail: "Significant rain forecasted in next 24 hours. Save fuel and water.", badgeColor: "bg-sky-500/20 text-sky-300 border-sky-500/30" };
  if (temp > 34 && humidity < 45) return { advice: "Evening Irrigation Needed", detail: "High heat & low humidity cause rapid soil evaporation. Irrigate after sunset.", badgeColor: "bg-amber-500/20 text-amber-300 border-amber-500/30" };
  if (humidity > 80) return { advice: "Monitor Root Zone", detail: "High humidity reduces transpiration rate. Soil retains moisture longer.", badgeColor: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" };
  return { advice: "Normal Irrigation Schedule", detail: "Standard crop water requirement today.", badgeColor: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" };
};

const calculateDewPoint = (temp: number, humidity: number) => {
  const a = 17.27;
  const b = 237.7;
  const alpha = ((a * temp) / (b + temp)) + Math.log(humidity / 100);
  const dewPoint = (b * alpha) / (a - alpha);
  const diff = temp - dewPoint;
  let risk = "Low Pathogen Risk";
  let badgeColor = "bg-emerald-500/20 text-emerald-300 border-emerald-500/30";
  let advice = "Leaf canopy dries quickly; low risk of fungal spores.";
  if (diff < 2.5 && humidity > 80) {
    risk = "High Fungal Outbreak Risk";
    badgeColor = "bg-rose-500/20 text-rose-300 border-rose-500/30";
    advice = "Extended leaf wetness expected. Inspect for blast, mildew, or rust.";
  } else if (diff < 5 && humidity > 70) {
    risk = "Moderate Disease Risk";
    badgeColor = "bg-amber-500/20 text-amber-300 border-amber-500/30";
    advice = "Dew condensation on leaves may encourage early fungal spore growth.";
  }
  return { dewPoint: dewPoint.toFixed(1), risk, badgeColor, advice };
};

const LANGUAGES = [
  { name: "English", label: "English" },
  { name: "Hindi", label: "Hindi (हिंदी)" },
  { name: "Bengali", label: "Bengali (বাংলা)" },
  { name: "Telugu", label: "Telugu (తెలుగు)" },
  { name: "Marathi", label: "Marathi (मराठी)" },
  { name: "Tamil", label: "Tamil (தமிழ்)" },
  { name: "Gujarati", label: "Gujarati (ଗୁଜୁରାଟୀ)" },
  { name: "Kannada", label: "Kannada (କନ୍ନଡ)" },
  { name: "Malayalam", label: "Malayalam (ମଲାୟାଲାମ)" },
  { name: "Punjabi", label: "Punjabi (ପୋଞ୍ଜାବି)" },
  { name: "Odia", label: "Odia (ଓଡ଼ିଆ)" },
  { name: "Assamese", label: "Assamese (ଅସମୀୟା)" },
  { name: "Urdu", label: "Urdu (اردو)" }
];

interface WeatherHubProps {
  language: string;
}

const WeatherHub: React.FC<WeatherHubProps> = ({ language: initialLanguage }) => {
  const [current, setCurrent] = React.useState<any>(null);
  const [forecast, setForecast] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [advisory, setAdvisory] = React.useState('');
  const [advisoryLoading, setAdvisoryLoading] = React.useState(false);
  const [language, setLanguage] = React.useState(initialLanguage);
  const [alertDialog, setAlertDialog] = React.useState<{
    isOpen: boolean;
    title: string;
    message: string;
  }>({ isOpen: false, title: '', message: '' });
  const [locationSource, setLocationSource] = React.useState<'GPS' | 'IP' | 'Default' | 'Manual' | 'Cached' | null>(null);
  const [isDetecting, setIsDetecting] = React.useState(false);
  const [searchInput, setSearchInput] = React.useState('');
  const [isSearching, setIsSearching] = React.useState(false);

  const [activeTab, setActiveTab] = React.useState<'overview' | 'indices' | 'lunar' | 'checklist' | 'radar'>('overview');
  const [checkedTasks, setCheckedTasks] = React.useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('agri_weather_checklist_tasks') || '[]');
    } catch {
      return [];
    }
  });
  const [isRadarPlaying, setIsRadarPlaying] = React.useState(true);
  const [radarFrame, setRadarFrame] = React.useState(0);
  const [copiedAdvisory, setCopiedAdvisory] = React.useState(false);
  const [showEmergencyModal, setShowEmergencyModal] = React.useState(false);

  React.useEffect(() => {
    localStorage.setItem('agri_weather_checklist_tasks', JSON.stringify(checkedTasks));
  }, [checkedTasks]);

  React.useEffect(() => {
    if (!isRadarPlaying) return;
    const interval = setInterval(() => {
      setRadarFrame(prev => (prev + 1) % 4);
    }, 1200);
    return () => clearInterval(interval);
  }, [isRadarPlaying]);

  const toggleTask = (taskId: string) => {
    setCheckedTasks(prev => 
      prev.includes(taskId) ? prev.filter(id => id !== taskId) : [...prev, taskId]
    );
  };

  const saveLocationToCache = (name: string, lat: number, lon: number, source: any) => {
    localStorage.setItem('agri_last_known_loc_name', name);
    localStorage.setItem('agri_last_known_lat', lat.toString());
    localStorage.setItem('agri_last_known_lon', lon.toString());
    localStorage.setItem('agri_last_known_source', source);
  };

  const shareToWhatsApp = () => {
    if (!current) return;
    const text = `🌾 *Bharat Kisan Weather & Advisory* (${current.name})\n\n🌡️ Temp: ${Math.round(current.main.temp)}°C | Humidity: ${current.main.humidity}%\n💨 Wind: ${Math.round(current.wind.speed * 3.6)} km/h | Condition: ${current.weather[0].description}\n\n📋 *Farmer Advisory*:\n${advisory.replace(/[*#]/g, '').slice(0, 300)}...\n\n_Shared via Bharat Kisan Smart Farming App_`;
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const fetchWeather = async (lat: number, lon: number, source: 'GPS' | 'IP' | 'Default' | 'Manual' | 'Cached') => {
    setLoading(true);
    setLocationSource(source);
    try {
      const currentRes = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${WEATHER_API_KEY}&units=metric`);
      if (!currentRes.ok) throw new Error(`Weather API error: ${currentRes.status}`);
      const currentData = await currentRes.json();
      
      const forecastRes = await fetch(`https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${WEATHER_API_KEY}&units=metric`);
      if (!forecastRes.ok) throw new Error(`Forecast API error: ${forecastRes.status}`);
      const forecastData = await forecastRes.json();

      setCurrent(currentData);
      const forecastList = forecastData.list.slice(0, 40); // 5 days
      setForecast(forecastList);
      
      saveLocationToCache(currentData.name, lat, lon, source);
      generateAdvisory(forecastList, currentData.name, language);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setIsDetecting(false);
      setIsSearching(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchInput.trim()) return;
    setIsSearching(true);
    setLoading(true);
    try {
      const geoRes = await fetch(`https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(searchInput)}&limit=1&appid=${WEATHER_API_KEY}`);
      const geoData = await geoRes.json();
      if (geoData && geoData.length > 0) {
        const { lat, lon } = geoData[0];
        fetchWeather(lat, lon, 'Manual');
        setSearchInput('');
      } else {
        setAlertDialog({
          isOpen: true,
          title: 'Location Not Found',
          message: 'We couldn’t find the specified location. Please check the spelling or try a more prominent nearby city/district.'
        });
        setLoading(false);
      }
    } catch (err) {
      console.error("Manual search failed", err);
      setAlertDialog({
        isOpen: true,
        title: 'Search Error',
        message: 'Could not connect to meteorological services. Please verify your internet connection and try again.'
      });
      setLoading(false);
    } finally {
      setIsSearching(false);
    }
  };

  const generateAdvisory = async (forecastData: any[], city: string, lang: string) => {
    setAdvisoryLoading(true);
    try {
      const crops = JSON.parse(localStorage.getItem('agri_main_crops') || '["Paddy", "Wheat"]');
      const farmLocation = localStorage.getItem('agri_farm_location') || city;
      const adv = await getWeatherAdvisory(forecastData, crops, farmLocation, lang);
      setAdvisory(adv);
    } catch (err) {
      console.error(err);
      setAdvisory("Could not generate localized advisory.");
    } finally {
      setAdvisoryLoading(false);
    }
  };

  const detectLocationTiered = () => {
    setIsDetecting(true);
    setLoading(true);

    const geoOptions = {
      enableHighAccuracy: true,
      timeout: 8000,
      maximumAge: 0
    };

    // TIER 1: GPS Precision
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        fetchWeather(pos.coords.latitude, pos.coords.longitude, 'GPS');
      },
      (err) => {
        console.warn("GPS failed, trying IP fallback...", err.message);
        
        // TIER 2: IP-based Fallback
        fetch('https://ipapi.co/json/')
          .then(res => res.json())
          .then(data => {
            if (data.latitude && data.longitude) {
              fetchWeather(data.latitude, data.longitude, 'IP');
            } else {
              throw new Error("IP location data incomplete");
            }
          })
          .catch(ipErr => {
            console.warn("IP Fallback failed, using regional default.", ipErr);
            // TIER 3: Default Hardcoded Fallback (Delhi)
            fetchWeather(28.6139, 77.2090, 'Default');
          });
      },
      geoOptions
    );
  };

  const onLanguageChange = (newLang: string) => {
    setLanguage(newLang);
    localStorage.setItem('agri_language', newLang);
    if (current && forecast.length > 0) {
      generateAdvisory(forecast, current.name, newLang);
    }
  };

  React.useEffect(() => {
    const cachedLat = localStorage.getItem('agri_last_known_lat');
    const cachedLon = localStorage.getItem('agri_last_known_lon');
    if (cachedLat && cachedLon) {
      fetchWeather(parseFloat(cachedLat), parseFloat(cachedLon), 'Cached');
    } else {
      detectLocationTiered();
    }
  }, []);

  const getWeatherIcon = (code: string, size: string = "w-8 h-8") => {
    if (code.includes('01')) return <Sun className={`${size} text-amber-500`} />;
    if (code.includes('02') || code.includes('03') || code.includes('04')) return <CloudSun className={`${size} text-stone-400`} />;
    if (code.includes('09') || code.includes('10')) return <CloudRain className={`${size} text-sky-500`} />;
    if (code.includes('11')) return <CloudLightning className={`${size} text-indigo-600`} />;
    return <CloudSun className={`${size} text-amber-600`} />;
  };

  if (loading && !current) {
    return (
      <div className="h-full flex flex-col items-center justify-center space-y-8 py-40 bg-black min-h-screen">
        <div className="relative">
          <div className="w-24 h-24 border-8 border-stone-900 rounded-full opacity-50"></div>
          <div className="absolute inset-0 w-24 h-24 border-8 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
             <Navigation className="w-8 h-8 text-amber-500 animate-pulse" />
          </div>
        </div>
        <div className="text-center space-y-2 px-10">
          <p className="text-sm font-bold text-white animate-pulse">Checking Local Weather...</p>
          <p className="text-[10px] font-medium text-stone-500 uppercase tracking-widest">
            Locating your farm for precise forecast
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-12 pb-40 animate-in fade-in slide-in-from-bottom-6 duration-700 bg-black min-h-screen">
      {/* Search & Language Bar */}
      <div className="flex flex-col gap-6 px-2">
        <form onSubmit={handleSearch} className="relative group">
          <input 
            type="text"
            placeholder="Search city or district..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full bg-stone-900 rounded-3xl p-5 pl-14 pr-32 border border-stone-800 outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-500/5 font-medium text-sm text-white transition-all shadow-sm placeholder:text-stone-700"
          />
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-600 group-focus-within:text-amber-500 transition-colors" />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
            {searchInput && (
              <button 
                type="button" 
                onClick={() => setSearchInput('')}
                className="p-2 text-stone-600 hover:text-stone-400 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            <button 
              type="submit"
              disabled={isSearching}
              className="bg-amber-600 text-black px-5 py-2.5 rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:bg-amber-700 active:scale-95 transition-all disabled:opacity-50 shadow-sm"
            >
              {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Search'}
            </button>
          </div>
        </form>

        <div className="soft-panel rounded-3xl p-5 border border-stone-800 bg-stone-900 flex items-center gap-5 shadow-sm">
            <div className="p-3 bg-black rounded-2xl border border-stone-800 text-amber-500">
               <LangIcon className="w-5 h-5" />
            </div>
            <div className="flex-1">
               <p className="text-[10px] font-bold text-stone-500 uppercase tracking-widest mb-1">Language</p>
               <select 
                value={language}
                onChange={(e) => onLanguageChange(e.target.value)}
                className="bg-transparent w-full text-sm font-bold text-white outline-none appearance-none cursor-pointer"
               >
                  {LANGUAGES.map(l => <option key={l.name} value={l.name} className="bg-stone-900">{l.label}</option>)}
               </select>
            </div>
            <ChevronRight className="w-4 h-4 text-stone-600" />
        </div>

        <div className="flex items-center justify-between px-4">
           <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${
                locationSource === 'GPS' ? 'bg-amber-500 shadow-sm' : 
                locationSource === 'IP' ? 'bg-orange-500' : 
                locationSource === 'Manual' ? 'bg-amber-600' : 
                locationSource === 'Cached' ? 'bg-stone-600' : 'bg-rose-500 animate-pulse'}`} 
              />
              <span className="text-[10px] font-bold text-stone-500 uppercase tracking-widest">
                Source: {locationSource === 'Cached' ? 'Last Saved' : locationSource || 'Detecting...'}
              </span>
           </div>
           <button 
            onClick={detectLocationTiered}
            disabled={isDetecting}
            className="flex items-center gap-2 text-[10px] font-bold text-amber-500 uppercase tracking-widest bg-amber-500/5 px-4 py-2 rounded-xl border border-amber-500/10 hover:bg-amber-500/10 transition-all active:scale-95 disabled:opacity-50"
           >
              {isDetecting ? <Loader2 className="w-3 h-3 animate-spin" /> : <LocateFixed className="w-3 h-3" />}
              Use GPS
           </button>
        </div>
      </div>

      {/* Header Hub Card */}
      <div className="soft-panel rounded-[2.5rem] p-8 md:p-12 border border-stone-800 bg-stone-900 relative overflow-hidden group shadow-sm">
        <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-15 transition-opacity">
          {getWeatherIcon(current.weather[0].icon, "w-48 h-48 -mr-12 -mt-12")}
        </div>
        
        <div className="relative z-10 space-y-10">
           <div className="flex justify-between items-start">
              <div className="flex items-start gap-5">
                <div className="p-4 bg-black rounded-2xl border border-stone-800 shadow-sm group-hover:bg-amber-500/5 group-hover:border-amber-500/10 transition-colors">
                  <MapPin className="w-6 h-6 text-amber-500" />
                </div>
                <div>
                  <h2 className="text-4xl font-serif font-bold text-white tracking-tight mb-1">{current.name}</h2>
                  <div className="text-[10px] font-bold text-stone-500 uppercase tracking-widest flex items-center gap-2">
                    {current.sys?.country && <span>{current.sys.country}</span>} 
                    <div className="w-1 h-1 bg-stone-800 rounded-full" />
                    {locationSource === 'GPS' ? 'GPS Precision' : 
                     locationSource === 'Manual' ? 'Manual' : 
                     locationSource === 'IP' ? 'Network' : 'Saved'}
                  </div>
                </div>
              </div>
              <div className="bg-amber-500/10 px-4 py-2 rounded-full border border-amber-500/20">
                 <span className="text-[10px] font-bold uppercase text-amber-500 tracking-widest flex items-center gap-2">
                   <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" /> Live
                 </span>
              </div>
           </div>

           <div className="flex items-center gap-10">
              <span className="text-7xl font-serif font-bold text-white tracking-tight">{Math.round(current.main.temp)}°</span>
              <div className="space-y-1">
                 <p className="text-2xl font-serif font-bold text-stone-300 capitalize">{current.weather[0].description}</p>
                 <div className="flex items-center gap-2 text-stone-500">
                    <TrendingUp className="w-4 h-4 text-amber-500" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Range: {Math.round(current.main.temp_min)}° - {Math.round(current.main.temp_max)}°</span>
                 </div>
              </div>
           </div>

           <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <AtmosphericMetric icon={<Droplets className="w-5 h-5" />} label="Humidity" value={`${current.main.humidity}%`} color="text-amber-500" />
              <AtmosphericMetric icon={<Wind className="w-5 h-5" />} label="Wind" value={`${Math.round(current.wind.speed * 3.6)} km/h`} color="text-orange-500" />
              <AtmosphericMetric icon={<Eye className="w-5 h-5" />} label="Visibility" value={`${(current.visibility/1000).toFixed(1)} km`} color="text-stone-500" />
              <AtmosphericMetric icon={<Waves className="w-5 h-5" />} label="Pressure" value={`${current.main.pressure} hPa`} color="text-stone-500" />
           </div>

           {/* Quick Actions & WhatsApp Share Bar */}
           <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-stone-800/80">
              <button 
                onClick={shareToWhatsApp}
                className="flex items-center gap-2.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 px-4 py-2.5 rounded-xl text-xs font-bold transition-all active:scale-95 shadow-sm"
              >
                <Share2 className="w-4 h-4 text-emerald-400" />
                Share Weather on WhatsApp
              </button>

              <button 
                onClick={() => setShowEmergencyModal(true)}
                className="flex items-center gap-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 px-4 py-2.5 rounded-xl text-xs font-bold transition-all active:scale-95"
              >
                <ShieldAlert className="w-4 h-4 text-rose-400" />
                Emergency Mitigation Guide
              </button>
           </div>
        </div>
      </div>

      {/* Feature Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar border-b border-stone-800 px-2">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === 'overview'
              ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/10'
              : 'bg-stone-900 text-stone-400 hover:text-white border border-stone-800'
          }`}
        >
          <CloudSun className="w-4 h-4" />
          Overview & Advisory
        </button>

        <button
          onClick={() => setActiveTab('indices')}
          className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === 'indices'
              ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/10'
              : 'bg-stone-900 text-stone-400 hover:text-white border border-stone-800'
          }`}
        >
          <Activity className="w-4 h-4" />
          Agri-Met Operating Indices
        </button>

        <button
          onClick={() => setActiveTab('lunar')}
          className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === 'lunar'
              ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/10'
              : 'bg-stone-900 text-stone-400 hover:text-white border border-stone-800'
          }`}
        >
          <Moon className="w-4 h-4" />
          Lunar & Solar Calendar
        </button>

        <button
          onClick={() => setActiveTab('checklist')}
          className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === 'checklist'
              ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/10'
              : 'bg-stone-900 text-stone-400 hover:text-white border border-stone-800'
          }`}
        >
          <CheckSquare className="w-4 h-4" />
          Daily Field Safety Checklist
        </button>

        <button
          onClick={() => setActiveTab('radar')}
          className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === 'radar'
              ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/10'
              : 'bg-stone-900 text-stone-400 hover:text-white border border-stone-800'
          }`}
        >
          <Compass className="w-4 h-4" />
          Rain Radar Visualizer
        </button>
      </div>

      {/* TAB CONTENT: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-8">
          {/* AI Agricultural Directive */}
          <div className="soft-panel rounded-[2.5rem] p-8 md:p-10 border border-amber-500/10 bg-amber-500/5 relative overflow-hidden group shadow-sm">
             <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                <Sparkles className="w-48 h-48 text-amber-500 -mr-8 -mt-8" />
             </div>
             
             <div className="relative z-10 space-y-6">
                <div className="flex items-center justify-between">
                   <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-amber-500/10 rounded-xl border border-amber-500/20">
                         <ShieldAlert className="w-5 h-5 text-amber-500" />
                      </div>
                      <h3 className="text-xs font-bold text-amber-500 uppercase tracking-widest">
                         Farmer's Advisory
                      </h3>
                   </div>
                   {advisoryLoading && <Loader2 className="w-4 h-4 animate-spin text-amber-300" />}
                </div>
                
                <div className="bg-stone-900/60 backdrop-blur-sm rounded-3xl p-6 border border-stone-800 shadow-sm">
                   {advisoryLoading ? (
                     <div className="py-12 text-center space-y-4">
                        <div className="relative inline-block">
                           <div className="w-12 h-12 border-4 border-stone-800 rounded-full"></div>
                           <div className="absolute inset-0 w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                        <p className="text-[10px] font-bold text-amber-500 uppercase tracking-widest animate-pulse">
                           Preparing your advice...
                        </p>
                     </div>
                   ) : (
                     <div className="prose prose-invert max-w-none">
                        <div className="text-stone-300 font-medium text-sm leading-relaxed italic">
                          <Markdown>{advisory}</Markdown>
                        </div>
                     </div>
                   )}
                </div>

                <div className="flex items-center gap-2 px-2">
                   <div className="w-1.5 h-1.5 bg-amber-500 rounded-full" />
                   <p className="text-[9px] font-bold text-amber-500/60 uppercase tracking-widest">
                      Personalized for your local crops
                   </p>
                </div>
             </div>
          </div>

          {/* 24h Hourly Forecast */}
          <div className="px-2 space-y-6">
            <div className="flex items-center gap-3 ml-2">
              <div className="w-1 h-4 bg-amber-500 rounded-full" />
              <h3 className="text-xs font-bold text-stone-500 uppercase tracking-widest">Next 24 Hours</h3>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-6 no-scrollbar -mx-2 px-2">
               {forecast.slice(0, 8).map((hour, i) => (
                 <div key={i} className="shrink-0 bg-stone-900 border border-stone-800 p-6 rounded-3xl flex flex-col items-center gap-4 shadow-sm min-w-[110px] hover:border-amber-500/20 transition-all group">
                    <span className="text-[10px] font-bold text-stone-500 uppercase tracking-widest">{new Date(hour.dt * 1000).getHours()}:00</span>
                    <div className="bg-black p-3 rounded-2xl border border-stone-800 group-hover:scale-110 transition-transform">
                      {getWeatherIcon(hour.weather[0].icon, "w-6 h-6")}
                    </div>
                    <span className="text-2xl font-serif font-bold text-white tracking-tight">{Math.round(hour.main.temp)}°</span>
                    <div className="flex items-center gap-1.5 text-amber-500 bg-amber-500/5 px-2.5 py-1 rounded-full border border-amber-500/10">
                       <Droplets className="w-3 h-3" />
                       <span className="text-[9px] font-bold">{Math.round(hour.pop * 100)}%</span>
                    </div>
                 </div>
               ))}
            </div>
          </div>

          {/* 7-Day Outlook */}
          <div className="px-2">
             <div className="soft-panel rounded-3xl border border-stone-800 bg-stone-900 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-stone-800 flex items-center justify-between bg-black/20">
                   <div className="flex items-center gap-3">
                     <div className="w-1 h-4 bg-amber-500 rounded-full" />
                     <h3 className="text-xs font-bold text-stone-500 uppercase tracking-widest">7-Day Outlook</h3>
                   </div>
                   <Info className="w-4 h-4 text-stone-600" />
                </div>
                <div className="divide-y divide-stone-800">
                   {forecast.filter((_, i) => i % 8 === 0).map((day, i) => (
                     <div key={i} className="flex items-center justify-between p-6 group hover:bg-black/20 transition-colors">
                        <div className="flex items-center gap-4 w-24">
                           <span className="text-sm font-bold text-stone-300">
                              {i === 0 ? 'Today' : new Date(day.dt * 1000).toLocaleDateString([], { weekday: 'short' })}
                           </span>
                        </div>
                        <div className="flex items-center gap-5 flex-1 justify-center">
                           <div className="p-2.5 bg-black rounded-xl border border-stone-800 group-hover:scale-110 transition-transform">
                            {getWeatherIcon(day.weather[0].icon, "w-5 h-5")}
                           </div>
                           <span className="text-[10px] font-bold text-stone-500 uppercase tracking-widest truncate max-w-[100px]">{day.weather[0].main}</span>
                        </div>
                        <div className="flex items-center gap-5 w-24 justify-end">
                           <span className="text-lg font-serif font-bold text-white">{Math.round(day.main.temp_max)}°</span>
                           <span className="text-lg font-serif font-bold text-stone-600">{Math.round(day.main.temp_min)}°</span>
                        </div>
                     </div>
                   ))}
                </div>
             </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: AGRI-MET OPERATING INDICES */}
      {activeTab === 'indices' && current && (
        <div className="space-y-6">
          {(() => {
            const windSpeedKmh = Math.round(current.wind.speed * 3.6);
            const humidity = current.main.humidity;
            const pop = forecast[0]?.pop || 0;
            const temp = Math.round(current.main.temp);
            const cloudiness = current.clouds?.all || 0;

            const spray = calculateSprayingSuitability(windSpeedKmh, humidity, pop);
            const irrigation = calculateIrrigationAdvice(temp, humidity, pop);
            const dew = calculateDewPoint(temp, humidity);
            const uv = calculateUVIndex(temp, cloudiness);

            return (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Spraying Suitability Index */}
                <div className="soft-panel rounded-3xl p-6 border border-stone-800 bg-stone-900 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-amber-500/10 rounded-2xl border border-amber-500/20 text-amber-500">
                        <Flame className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white">Spraying Suitability</h4>
                        <p className="text-[10px] font-bold text-stone-500 uppercase">Chemical & Bio Spray</p>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${spray.badgeColor}`}>
                      {spray.status}
                    </span>
                  </div>
                  <p className="text-xs text-stone-300 leading-relaxed bg-black/40 p-4 rounded-2xl border border-stone-800">
                    {spray.reason}
                  </p>
                  <div className="flex items-center justify-between text-[10px] text-stone-500 pt-1">
                    <span>Wind: {windSpeedKmh} km/h</span>
                    <span>Rain Pop: {Math.round(pop * 100)}%</span>
                  </div>
                </div>

                {/* Irrigation Demand Calculator */}
                <div className="soft-panel rounded-3xl p-6 border border-stone-800 bg-stone-900 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-sky-500/10 rounded-2xl border border-sky-500/20 text-sky-400">
                        <Droplets className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white">Irrigation Requirement</h4>
                        <p className="text-[10px] font-bold text-stone-500 uppercase">Water Management</p>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${irrigation.badgeColor}`}>
                      {irrigation.advice}
                    </span>
                  </div>
                  <p className="text-xs text-stone-300 leading-relaxed bg-black/40 p-4 rounded-2xl border border-stone-800">
                    {irrigation.detail}
                  </p>
                  <div className="flex items-center justify-between text-[10px] text-stone-500 pt-1">
                    <span>Evapotranspiration Index: {temp > 32 ? 'High' : 'Moderate'}</span>
                    <span>Humidity: {humidity}%</span>
                  </div>
                </div>

                {/* Fungal Outbreak & Dew Point Index */}
                <div className="soft-panel rounded-3xl p-6 border border-stone-800 bg-stone-900 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-rose-500/10 rounded-2xl border border-rose-500/20 text-rose-400">
                        <ShieldCheck className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white">Fungal Pathogen Risk</h4>
                        <p className="text-[10px] font-bold text-stone-500 uppercase">Leaf Wetness & Dew Point</p>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${dew.badgeColor}`}>
                      {dew.risk}
                    </span>
                  </div>
                  <p className="text-xs text-stone-300 leading-relaxed bg-black/40 p-4 rounded-2xl border border-stone-800">
                    {dew.advice}
                  </p>
                  <div className="flex items-center justify-between text-[10px] text-stone-500 pt-1">
                    <span>Dew Point Temp: {dew.dewPoint}°C</span>
                    <span>Air Temp: {temp}°C</span>
                  </div>
                </div>

                {/* UV Index & Field Worker Protection */}
                <div className="soft-panel rounded-3xl p-6 border border-stone-800 bg-stone-900 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-amber-500/10 rounded-2xl border border-amber-500/20 text-amber-400">
                        <Sun className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white">UV Solar Exposure</h4>
                        <p className="text-[10px] font-bold text-stone-500 uppercase">Worker & Cattle Health</p>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border border-stone-800 bg-stone-950 ${uv.color}`}>
                      UV Index: {uv.uv} ({uv.level})
                    </span>
                  </div>
                  <p className="text-xs text-stone-300 leading-relaxed bg-black/40 p-4 rounded-2xl border border-stone-800">
                    {uv.recommendation}
                  </p>
                  <div className="flex items-center justify-between text-[10px] text-stone-500 pt-1">
                    <span>Cloud Cover: {cloudiness}%</span>
                    <span>Peak Heat Hours: 11:30 - 15:30</span>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* TAB CONTENT: LUNAR & SOLAR CALENDAR */}
      {activeTab === 'lunar' && current && (
        <div className="space-y-6">
          {(() => {
            const moon = getMoonPhase();
            return (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Moon Phase Card */}
                <div className="soft-panel rounded-3xl p-8 border border-stone-800 bg-stone-900 space-y-6 relative overflow-hidden">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <span className="text-5xl">{moon.icon}</span>
                      <div>
                        <h4 className="text-xl font-serif font-bold text-white mb-1">{moon.phase}</h4>
                        <p className="text-[10px] font-bold text-amber-500 uppercase tracking-widest">Traditional Farming Calendar</p>
                      </div>
                    </div>
                  </div>
                  <div className="p-5 bg-black/50 rounded-2xl border border-stone-800 space-y-2">
                    <p className="text-xs font-bold text-stone-200 uppercase tracking-wider">Traditional Sowing & Field Guide:</p>
                    <p className="text-xs text-stone-400 leading-relaxed">{moon.description}</p>
                  </div>
                  <p className="text-[10px] text-stone-500">
                    Used across Indian agrarian regions to align planting schedules with natural gravitational water movement.
                  </p>
                </div>

                {/* Daylight & Sun Cycle */}
                <div className="soft-panel rounded-3xl p-8 border border-stone-800 bg-stone-900 space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-amber-500/10 rounded-2xl border border-amber-500/20 text-amber-500">
                      <Sunrise className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-lg font-serif font-bold text-white">Solar Daylight Window</h4>
                      <p className="text-[10px] font-bold text-stone-500 uppercase">Field Hours</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-black/40 rounded-2xl border border-stone-800 text-center">
                      <p className="text-[10px] font-bold text-stone-500 uppercase">Sunrise</p>
                      <p className="text-2xl font-serif font-bold text-amber-400 mt-1">
                        {new Date(current.sys.sunrise * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    <div className="p-4 bg-black/40 rounded-2xl border border-stone-800 text-center">
                      <p className="text-[10px] font-bold text-stone-500 uppercase">Sunset</p>
                      <p className="text-2xl font-serif font-bold text-orange-400 mt-1">
                        {new Date(current.sys.sunset * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>

                  <div className="p-4 bg-amber-500/5 rounded-2xl border border-amber-500/10 flex items-center justify-between text-xs text-stone-300">
                    <span>Daylight Duration:</span>
                    <span className="font-bold text-amber-400">
                      {Math.floor((current.sys.sunset - current.sys.sunrise) / 3600)} Hours {Math.floor(((current.sys.sunset - current.sys.sunrise) % 3600) / 60)} Mins
                    </span>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* TAB CONTENT: DAILY FIELD CHECKLIST */}
      {activeTab === 'checklist' && current && (
        <div className="space-y-6">
          <div className="soft-panel rounded-3xl p-8 border border-stone-800 bg-stone-900 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xl font-serif font-bold text-white">Daily Field Action Checklist</h4>
                <p className="text-xs text-stone-400 mt-1">Check off tasks completed on your farm today based on live weather conditions.</p>
              </div>
              <span className="text-xs font-bold text-amber-500 bg-amber-500/10 px-3 py-1.5 rounded-full border border-amber-500/20">
                {checkedTasks.length} / 5 Done
              </span>
            </div>

            <div className="space-y-3">
              {[
                { id: 'task1', label: 'Inspect field perimeter bunds and drainage outlets for blockage.' },
                { id: 'task2', label: 'Verify spraying wind conditions (<15 km/h) before chemical tank mixing.' },
                { id: 'task3', label: 'Check soil moisture at 5cm depth before turning on irrigation pumps.' },
                { id: 'task4', label: 'Provide fresh shaded drinking water for farm livestock during peak afternoon.' },
                { id: 'task5', label: 'Ensure harvested grains/seeds are stored under elevated dry tarp shelters.' }
              ].map(task => {
                const isDone = checkedTasks.includes(task.id);
                return (
                  <button
                    key={task.id}
                    onClick={() => toggleTask(task.id)}
                    className={`w-full text-left p-4 rounded-2xl border transition-all flex items-center gap-4 ${
                      isDone
                        ? 'bg-amber-500/10 border-amber-500/30 text-amber-200 line-through opacity-80'
                        : 'bg-black/40 border-stone-800 text-stone-200 hover:border-stone-700'
                    }`}
                  >
                    {isDone ? (
                      <CheckSquare className="w-5 h-5 text-amber-500 shrink-0" />
                    ) : (
                      <Square className="w-5 h-5 text-stone-500 shrink-0" />
                    )}
                    <span className="text-sm font-medium">{task.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: RAIN RADAR SIMULATION */}
      {activeTab === 'radar' && current && (
        <div className="space-y-6">
          <div className="soft-panel rounded-3xl p-8 border border-stone-800 bg-stone-900 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xl font-serif font-bold text-white">Live Regional Rain Radar</h4>
                <p className="text-xs text-stone-400 mt-1">Simulated cloud cover density and precipitation intensity vectors for {current.name}.</p>
              </div>
              <button
                onClick={() => setIsRadarPlaying(!isRadarPlaying)}
                className="flex items-center gap-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 px-4 py-2 rounded-xl text-xs font-bold transition-all"
              >
                {isRadarPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                {isRadarPlaying ? 'Pause Radar' : 'Play Radar'}
              </button>
            </div>

            {/* Simulated Radar Canvas Grid */}
            <div className="relative h-64 bg-stone-950 rounded-2xl border border-stone-800 overflow-hidden flex items-center justify-center">
              {/* Grid Lines */}
              <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f2937_1px,transparent_1px),linear-gradient(to_bottom,#1f2937_1px,transparent_1px)] bg-[size:2rem_2rem] opacity-30" />
              
              {/* Radar Sweep Animation */}
              <div
                className={`absolute inset-0 bg-gradient-to-tr from-amber-500/10 via-transparent to-sky-500/20 transition-transform duration-1000 ${
                  isRadarPlaying ? 'animate-pulse' : ''
                }`}
                style={{
                  transform: `scale(${1 + radarFrame * 0.05}) rotate(${radarFrame * 15}deg)`
                }}
              />

              {/* Rain Clouds / Intensity Pulse */}
              <div className="relative z-10 text-center space-y-2 p-6 bg-black/70 backdrop-blur-md rounded-2xl border border-stone-800 max-w-xs">
                <CloudRain className="w-10 h-10 text-sky-400 mx-auto animate-bounce" />
                <p className="text-sm font-bold text-white">Cloud Cover: {current.clouds?.all || 20}%</p>
                <p className="text-xs text-stone-400">Precipitation Chance: {Math.round((forecast[0]?.pop || 0) * 100)}%</p>
                <span className="inline-block mt-2 px-3 py-1 bg-sky-500/20 text-sky-300 text-[10px] font-bold uppercase rounded-full border border-sky-500/30">
                  Radar Sweep Frame #{radarFrame + 1}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* EMERGENCY MITIGATION GUIDE MODAL */}
      <AnimatePresence>
        {showEmergencyModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-stone-900 border border-stone-800 rounded-3xl p-8 max-w-md w-full space-y-6 max-h-[85vh] overflow-y-auto no-scrollbar shadow-2xl"
            >
              <div className="flex items-center justify-between pb-4 border-b border-stone-800">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-rose-500/10 rounded-2xl text-rose-400 border border-rose-500/20">
                    <ShieldAlert className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-serif font-bold text-white">Emergency Crop Protection</h3>
                    <p className="text-[10px] font-bold text-stone-500 uppercase">Extreme Weather Guidelines</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowEmergencyModal(false)}
                  className="p-2 hover:bg-stone-800 rounded-xl text-stone-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4 text-xs text-stone-300 leading-relaxed">
                <div className="p-4 bg-black/40 rounded-2xl border border-stone-800 space-y-1">
                  <p className="font-bold text-amber-400">1. Heavy Rain & Waterlogging:</p>
                  <p className="text-stone-400">Open field perimeter bund drains immediately. Prevent standing water in pulse & onion crops to avoid root rot.</p>
                </div>

                <div className="p-4 bg-black/40 rounded-2xl border border-stone-800 space-y-1">
                  <p className="font-bold text-orange-400">2. High Wind / Squall Warning:</p>
                  <p className="text-stone-400">Postpone all chemical spraying & tall crop fertilization. Earthing-up sugarcane or maize fields prevents lodging.</p>
                </div>

                <div className="p-4 bg-black/40 rounded-2xl border border-stone-800 space-y-1">
                  <p className="font-bold text-rose-400">3. Severe Heatwave / Drought:</p>
                  <p className="text-stone-400">Apply straw or crop residue mulch over vegetable soil beds. Irrigate early morning or after sunset.</p>
                </div>
              </div>

              <button
                onClick={() => setShowEmergencyModal(false)}
                className="w-full py-4 bg-amber-500 text-black rounded-2xl font-bold text-xs uppercase tracking-wider hover:bg-amber-400 transition-all"
              >
                Close Emergency Guide
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <section className="px-6 mt-20 mb-10 text-center">
        <div className="flex items-center justify-center gap-4 mb-4 opacity-20">
          <div className="h-px w-12 bg-stone-300" />
          <span className="text-[10px] font-medium text-stone-400 uppercase tracking-widest">End of Report</span>
          <div className="h-px w-12 bg-stone-300" />
        </div>
        <p className="text-[10px] font-medium text-stone-400 uppercase tracking-widest">
          © {new Date().getFullYear()} BHARAT KISAN SYSTEMS
        </p>
      </section>

      {/* Custom Alert Dialog */}
      <AnimatePresence>
        {alertDialog.isOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-[#12141a] border border-white/10 rounded-[2.5rem] p-10 max-w-sm w-full shadow-2xl"
            >
              <div className="text-center">
                <div className="w-20 h-20 bg-amber-500/10 text-amber-500 rounded-[1.5rem] flex items-center justify-center mb-8 mx-auto border border-amber-500/20">
                  <AlertCircle className="w-10 h-10" />
                </div>
                <h3 className="text-2xl font-black text-white uppercase tracking-tighter mb-3">{alertDialog.title}</h3>
                <p className="text-sm font-medium text-white/40 leading-relaxed mb-10 px-4">{alertDialog.message}</p>
                <button 
                  onClick={() => setAlertDialog({ ...alertDialog, isOpen: false })}
                  className="w-full py-5 bg-amber-600 text-black rounded-2xl font-black text-[12px] uppercase tracking-[0.2em] shadow-xl hover:bg-amber-700 active:scale-95 transition-all"
                >
                  Understood
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const AtmosphericMetric: React.FC<{ icon: React.ReactNode, label: string, value: string, color: string }> = ({ icon, label, value, color }) => (
  <div className="bg-black border border-stone-800 rounded-2xl p-4 flex flex-col items-center gap-1.5 group hover:bg-stone-900 hover:border-amber-500/20 transition-all shadow-sm">
     <div className={`${color} mb-1 group-hover:scale-110 transition-transform`}>{icon}</div>
     <span className="text-[8px] font-bold text-stone-500 uppercase tracking-widest">{label}</span>
     <span className="text-sm font-bold text-white leading-none">{value}</span>
  </div>
);

export default WeatherHub;
