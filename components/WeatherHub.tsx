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
  X
} from 'lucide-react';
import { getWeatherAdvisory } from '../services/geminiService';
import Markdown from 'react-markdown';

const WEATHER_API_KEY = import.meta.env.VITE_WEATHER_API_KEY;

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
  const [locationSource, setLocationSource] = React.useState<'GPS' | 'IP' | 'Default' | 'Manual' | 'Cached' | null>(null);
  const [isDetecting, setIsDetecting] = React.useState(false);
  const [searchInput, setSearchInput] = React.useState('');
  const [isSearching, setIsSearching] = React.useState(false);

  const saveLocationToCache = (name: string, lat: number, lon: number, source: any) => {
    localStorage.setItem('agri_last_known_loc_name', name);
    localStorage.setItem('agri_last_known_lat', lat.toString());
    localStorage.setItem('agri_last_known_lon', lon.toString());
    localStorage.setItem('agri_last_known_source', source);
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
        alert("Location not found. Please try another city or region.");
        setLoading(false);
      }
    } catch (err) {
      console.error("Manual search failed", err);
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
      <div className="h-full flex flex-col items-center justify-center space-y-8 py-40 bg-transparent">
        <div className="relative">
          <div className="w-24 h-24 border-8 border-stone-100 rounded-full opacity-50"></div>
          <div className="absolute inset-0 w-24 h-24 border-8 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
             <Navigation className="w-8 h-8 text-emerald-600 animate-pulse" />
          </div>
        </div>
        <div className="text-center space-y-2 px-10">
          <p className="text-sm font-bold text-stone-800 animate-pulse">Checking Local Weather...</p>
          <p className="text-[10px] font-medium text-stone-400 uppercase tracking-widest">
            Locating your farm for precise forecast
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-12 pb-40 animate-in fade-in slide-in-from-bottom-6 duration-700">
      {/* Search & Language Bar */}
      <div className="flex flex-col gap-6 px-2">
        <form onSubmit={handleSearch} className="relative group">
          <input 
            type="text"
            placeholder="Search city or district..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full bg-white rounded-3xl p-5 pl-14 pr-32 border border-stone-200 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/5 font-medium text-sm text-stone-900 transition-all shadow-sm placeholder:text-stone-300"
          />
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-300 group-focus-within:text-emerald-500 transition-colors" />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
            {searchInput && (
              <button 
                type="button" 
                onClick={() => setSearchInput('')}
                className="p-2 text-stone-300 hover:text-stone-500 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            <button 
              type="submit"
              disabled={isSearching}
              className="bg-emerald-600 text-white px-5 py-2.5 rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:bg-emerald-700 active:scale-95 transition-all disabled:opacity-50 shadow-sm"
            >
              {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Search'}
            </button>
          </div>
        </form>

        <div className="soft-panel rounded-3xl p-5 border border-stone-200 bg-white flex items-center gap-5 shadow-sm">
            <div className="p-3 bg-stone-50 rounded-2xl border border-stone-100 text-emerald-600">
               <LangIcon className="w-5 h-5" />
            </div>
            <div className="flex-1">
               <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1">Language</p>
               <select 
                value={language}
                onChange={(e) => onLanguageChange(e.target.value)}
                className="bg-transparent w-full text-sm font-bold text-stone-800 outline-none appearance-none cursor-pointer"
               >
                  {LANGUAGES.map(l => <option key={l.name} value={l.name}>{l.label}</option>)}
               </select>
            </div>
            <ChevronRight className="w-4 h-4 text-stone-300" />
        </div>

        <div className="flex items-center justify-between px-4">
           <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${
                locationSource === 'GPS' ? 'bg-emerald-500 shadow-sm' : 
                locationSource === 'IP' ? 'bg-blue-500' : 
                locationSource === 'Manual' ? 'bg-orange-500' : 
                locationSource === 'Cached' ? 'bg-stone-300' : 'bg-rose-500 animate-pulse'}`} 
              />
              <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">
                Source: {locationSource === 'Cached' ? 'Last Saved' : locationSource || 'Detecting...'}
              </span>
           </div>
           <button 
            onClick={detectLocationTiered}
            disabled={isDetecting}
            className="flex items-center gap-2 text-[10px] font-bold text-emerald-600 uppercase tracking-widest bg-emerald-50 px-4 py-2 rounded-xl border border-emerald-100 hover:bg-emerald-100 transition-all active:scale-95 disabled:opacity-50"
           >
              {isDetecting ? <Loader2 className="w-3 h-3 animate-spin" /> : <LocateFixed className="w-3 h-3" />}
              Use GPS
           </button>
        </div>
      </div>

      {/* Header Hub Card */}
      <div className="soft-panel rounded-[2.5rem] p-8 md:p-12 border border-stone-200 bg-white relative overflow-hidden group shadow-sm">
        <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-15 transition-opacity">
          {getWeatherIcon(current.weather[0].icon, "w-48 h-48 -mr-12 -mt-12")}
        </div>
        
        <div className="relative z-10 space-y-10">
           <div className="flex justify-between items-start">
              <div className="flex items-start gap-5">
                <div className="p-4 bg-stone-50 rounded-2xl border border-stone-100 shadow-sm group-hover:bg-emerald-50 group-hover:border-emerald-100 transition-colors">
                  <MapPin className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                  <h2 className="text-4xl font-serif font-bold text-stone-900 tracking-tight mb-1">{current.name}</h2>
                  <div className="text-[10px] font-bold text-stone-400 uppercase tracking-widest flex items-center gap-2">
                    {current.sys?.country && <span>{current.sys.country}</span>} 
                    <div className="w-1 h-1 bg-stone-200 rounded-full" />
                    {locationSource === 'GPS' ? 'GPS Precision' : 
                     locationSource === 'Manual' ? 'Manual' : 
                     locationSource === 'IP' ? 'Network' : 'Saved'}
                  </div>
                </div>
              </div>
              <div className="bg-emerald-50 px-4 py-2 rounded-full border border-emerald-100">
                 <span className="text-[10px] font-bold uppercase text-emerald-700 tracking-widest flex items-center gap-2">
                   <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" /> Live
                 </span>
              </div>
           </div>

           <div className="flex items-center gap-10">
              <span className="text-7xl font-serif font-bold text-stone-900 tracking-tight">{Math.round(current.main.temp)}°</span>
              <div className="space-y-1">
                 <p className="text-2xl font-serif font-bold text-stone-800 capitalize">{current.weather[0].description}</p>
                 <div className="flex items-center gap-2 text-stone-400">
                    <TrendingUp className="w-4 h-4 text-emerald-500" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Range: {Math.round(current.main.temp_min)}° - {Math.round(current.main.temp_max)}°</span>
                 </div>
              </div>
           </div>

           <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <AtmosphericMetric icon={<Droplets className="w-5 h-5" />} label="Humidity" value={`${current.main.humidity}%`} color="text-sky-500" />
              <AtmosphericMetric icon={<Wind className="w-5 h-5" />} label="Wind" value={`${Math.round(current.wind.speed * 3.6)} km/h`} color="text-emerald-600" />
              <AtmosphericMetric icon={<Eye className="w-5 h-5" />} label="Visibility" value={`${(current.visibility/1000).toFixed(1)} km`} color="text-stone-500" />
              <AtmosphericMetric icon={<Waves className="w-5 h-5" />} label="Pressure" value={`${current.main.pressure} hPa`} color="text-stone-500" />
           </div>
        </div>
      </div>

      {/* AI Agricultural Directive */}
      <div className="soft-panel rounded-[2.5rem] p-8 md:p-10 border border-emerald-100 bg-emerald-50/30 relative overflow-hidden group shadow-sm">
         <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
            <Sparkles className="w-48 h-48 text-emerald-600 -mr-8 -mt-8" />
         </div>
         
         <div className="relative z-10 space-y-6">
            <div className="flex items-center justify-between">
               <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-emerald-100 rounded-xl border border-emerald-200">
                     <ShieldAlert className="w-5 h-5 text-emerald-700" />
                  </div>
                  <h3 className="text-xs font-bold text-emerald-800 uppercase tracking-widest">
                     Farmer's Advisory
                  </h3>
               </div>
               {advisoryLoading && <Loader2 className="w-4 h-4 animate-spin text-emerald-300" />}
            </div>
            
            <div className="bg-white/60 backdrop-blur-sm rounded-3xl p-6 border border-emerald-100 shadow-sm">
               {advisoryLoading ? (
                 <div className="py-12 text-center space-y-4">
                    <div className="relative inline-block">
                       <div className="w-12 h-12 border-4 border-emerald-100 rounded-full"></div>
                       <div className="absolute inset-0 w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                    <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest animate-pulse">
                       Preparing your advice...
                    </p>
                 </div>
               ) : (
                 <div className="prose prose-stone max-w-none">
                    <div className="text-stone-700 font-medium text-sm leading-relaxed italic">
                      <Markdown>{advisory}</Markdown>
                    </div>
                 </div>
               )}
            </div>

            <div className="flex items-center gap-2 px-2">
               <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
               <p className="text-[9px] font-bold text-emerald-600/60 uppercase tracking-widest">
                  Personalized for your crops
               </p>
            </div>
         </div>
      </div>

      {/* 24h Hourly Forecast */}
      <div className="px-2 space-y-6">
        <div className="flex items-center gap-3 ml-2">
          <div className="w-1 h-4 bg-emerald-500 rounded-full" />
          <h3 className="text-xs font-bold text-stone-400 uppercase tracking-widest">Next 24 Hours</h3>
        </div>
        <div className="flex gap-4 overflow-x-auto pb-6 no-scrollbar -mx-2 px-2">
           {forecast.slice(0, 8).map((hour, i) => (
             <div key={i} className="shrink-0 bg-white border border-stone-200 p-6 rounded-3xl flex flex-col items-center gap-4 shadow-sm min-w-[110px] hover:border-emerald-200 transition-all group">
                <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">{new Date(hour.dt * 1000).getHours()}:00</span>
                <div className="bg-stone-50 p-3 rounded-2xl border border-stone-100 group-hover:scale-110 transition-transform">
                  {getWeatherIcon(hour.weather[0].icon, "w-6 h-6")}
                </div>
                <span className="text-2xl font-serif font-bold text-stone-900 tracking-tight">{Math.round(hour.main.temp)}°</span>
                <div className="flex items-center gap-1.5 text-sky-600 bg-sky-50 px-2.5 py-1 rounded-full border border-sky-100">
                   <Droplets className="w-3 h-3" />
                   <span className="text-[9px] font-bold">{Math.round(hour.pop * 100)}%</span>
                </div>
             </div>
           ))}
        </div>
      </div>

      {/* Sun & Traditional Cycles */}
      <div className="grid grid-cols-2 gap-6 px-2">
         <div className="bg-orange-50 border border-orange-100 p-6 rounded-3xl shadow-sm relative overflow-hidden group hover:bg-orange-100/50 transition-all">
            <Sunrise className="w-5 h-5 text-orange-600 mb-4 group-hover:scale-110 transition-transform" />
            <p className="text-[10px] font-bold text-orange-600/60 uppercase tracking-widest mb-1">Sunrise</p>
            <p className="text-2xl font-serif font-bold text-stone-900 tracking-tight">{new Date(current.sys.sunrise * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
            <Sun className="absolute -bottom-4 -right-4 w-20 h-20 text-orange-500/5 group-hover:rotate-12 transition-transform" />
         </div>
         <div className="bg-indigo-50 border border-indigo-100 p-6 rounded-3xl shadow-sm relative overflow-hidden group hover:bg-indigo-100/50 transition-all">
            <Sunset className="w-5 h-5 text-indigo-600 mb-4 group-hover:scale-110 transition-transform" />
            <p className="text-[10px] font-bold text-indigo-600/60 uppercase tracking-widest mb-1">Sunset</p>
            <p className="text-2xl font-serif font-bold text-stone-900 tracking-tight">{new Date(current.sys.sunset * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
            <Moon className="absolute -bottom-4 -right-4 w-20 h-20 text-indigo-500/5 group-hover:rotate-12 transition-transform" />
         </div>
      </div>

      {/* 5-Day Outlook */}
      <div className="px-2">
         <div className="soft-panel rounded-3xl border border-stone-200 bg-white shadow-sm overflow-hidden">
            <div className="p-6 border-b border-stone-100 flex items-center justify-between bg-stone-50/50">
               <div className="flex items-center gap-3">
                 <div className="w-1 h-4 bg-emerald-500 rounded-full" />
                 <h3 className="text-xs font-bold text-stone-500 uppercase tracking-widest">7-Day Outlook</h3>
               </div>
               <Info className="w-4 h-4 text-stone-300" />
            </div>
            <div className="divide-y divide-stone-100">
               {forecast.filter((_, i) => i % 8 === 0).map((day, i) => (
                 <div key={i} className="flex items-center justify-between p-6 group hover:bg-stone-50 transition-colors">
                    <div className="flex items-center gap-4 w-24">
                       <span className="text-sm font-bold text-stone-800">
                          {i === 0 ? 'Today' : new Date(day.dt * 1000).toLocaleDateString([], { weekday: 'short' })}
                       </span>
                    </div>
                    <div className="flex items-center gap-5 flex-1 justify-center">
                       <div className="p-2.5 bg-stone-50 rounded-xl border border-stone-100 group-hover:scale-110 transition-transform">
                        {getWeatherIcon(day.weather[0].icon, "w-5 h-5")}
                       </div>
                       <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest truncate max-w-[100px]">{day.weather[0].main}</span>
                    </div>
                    <div className="flex items-center gap-5 w-24 justify-end">
                       <span className="text-lg font-serif font-bold text-stone-900">{Math.round(day.main.temp_max)}°</span>
                       <span className="text-lg font-serif font-bold text-stone-300">{Math.round(day.main.temp_min)}°</span>
                    </div>
                 </div>
               ))}
            </div>
         </div>
      </div>

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
    </div>
  );
};

const AtmosphericMetric: React.FC<{ icon: React.ReactNode, label: string, value: string, color: string }> = ({ icon, label, value, color }) => (
  <div className="bg-stone-50 border border-stone-100 rounded-2xl p-4 flex flex-col items-center gap-1.5 group hover:bg-white hover:border-emerald-100 transition-all shadow-sm">
     <div className={`${color} mb-1 group-hover:scale-110 transition-transform`}>{icon}</div>
     <span className="text-[8px] font-bold text-stone-400 uppercase tracking-widest">{label}</span>
     <span className="text-sm font-bold text-stone-800 leading-none">{value}</span>
  </div>
);

export default WeatherHub;
