
import React from 'react';
import { fetchSeasonalPlanning, suggestCropsForSeason, getCropRotationAdvice, fetchSeasonalCalendar, SeasonalEvent } from '../services/geminiService';
import { 
  CloudSun, 
  TrendingUp, 
  MapPin, 
  Navigation, 
  Loader2, 
  CheckCircle2, 
  AlertTriangle, 
  AlertCircle,
  Sparkles, 
  ExternalLink,
  ChevronRight,
  Info,
  Calendar,
  Languages as LangIcon,
  Zap,
  Sprout,
  Waves,
  Clock,
  ArrowRight,
  Target,
  ArrowRightLeft,
  Users,
  Layers as LayersIcon,
  RefreshCw,
  ChevronLeft,
  Droplets,
  Beaker,
  Eye,
  Thermometer,
  Wind
} from 'lucide-react';
import Markdown from 'react-markdown';
import { motion, AnimatePresence } from 'motion/react';

const WEATHER_API_KEY = import.meta.env.VITE_WEATHER_API_KEY;

const LANGUAGES = [
  { name: "English", label: "English" },
  { name: "Hindi", label: "Hindi (हिंदी)" },
  { name: "Bengali", label: "Bengali (বাংলা)" },
  { name: "Telugu", label: "Telugu (తెలుగు)" },
  { name: "Marathi", label: "Marathi (ମරාઠી)" },
  { name: "Tamil", label: "Tamil (தமிழ்)" },
  { name: "Gujarati", label: "Gujarati (ଗୁଜୁරාଟୀ)" },
  { name: "Kannada", label: "Kannada (କନ୍ନଡ)" },
  { name: "Punjabi", label: "Punjabi (ਪੰਜਾਬੀ)" }
];

interface RecommendedCrop {
  name: string;
  reasoning: string;
  suitability: 'High' | 'Moderate';
}

interface SeasonalPlannerProps {
  language: string;
}

const SeasonalPlanner: React.FC<SeasonalPlannerProps> = ({ language: initialLanguage }) => {
  const [location, setLocation] = React.useState(localStorage.getItem('agri_farm_location') || '');
  const [plantingDate, setPlantingDate] = React.useState(new Date().toISOString().split('T')[0]);
  const [crops] = React.useState<string[]>(() => JSON.parse(localStorage.getItem('agri_main_crops') || '["Paddy", "Wheat"]'));
  const [language, setLanguage] = React.useState(initialLanguage);
  const [report, setReport] = React.useState<{ text?: string, sources: any[] } | null>(null);
  const [rotationAdvice, setRotationAdvice] = React.useState<string | null>(null);
  const [cropRecommendations, setCropRecommendations] = React.useState<RecommendedCrop[]>([]);
  const [calendarEvents, setCalendarEvents] = React.useState<SeasonalEvent[]>([]);
  const [weather, setWeather] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(false);
  const [detecting, setDetecting] = React.useState(false);

  const getIndianSeason = () => {
    const month = new Date().getMonth();
    if (month >= 5 && month <= 8) return { name: 'Kharif', status: 'In Progress', icon: <Waves className="w-5 h-5 text-emerald-600" /> };
    if (month >= 9 || month <= 2) return { name: 'Rabi', status: 'In Progress', icon: <CloudSun className="w-5 h-5 text-amber-600" /> };
    return { name: 'Zaid', status: 'In Progress', icon: <Sprout className="w-5 h-5 text-orange-600" /> };
  };

  const currentSeason = getIndianSeason();

  const SeasonalCalendarView: React.FC<{ events: SeasonalEvent[] }> = ({ events }) => {
    const [currentMonth, setCurrentMonth] = React.useState(new Date());

    const daysInMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    const firstDayOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay();

    const prevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
    const nextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));

    const monthName = currentMonth.toLocaleString('default', { month: 'long' });
    const year = currentMonth.getFullYear();

    const days = Array.from({ length: daysInMonth(currentMonth) }, (_, i) => i + 1);
    const blanks = Array.from({ length: firstDayOfMonth(currentMonth) }, (_, i) => i);

    const getEventsForDay = (day: number) => {
      const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      return events.filter(e => e.date === dateStr);
    };

    const getTypeColor = (type: string) => {
      switch (type) {
        case 'Planting': return 'bg-emerald-500';
        case 'Harvest': return 'bg-amber-500';
        case 'Irrigation': return 'bg-blue-500';
        case 'Fertilizer': return 'bg-purple-500';
        case 'Observation': return 'bg-rose-500';
        default: return 'bg-stone-500';
      }
    };

    const getTypeIcon = (type: string) => {
      switch (type) {
        case 'Planting': return <Sprout className="w-3 h-3" />;
        case 'Harvest': return <Target className="w-3 h-3" />;
        case 'Irrigation': return <Droplets className="w-3 h-3" />;
        case 'Fertilizer': return <Beaker className="w-3 h-3" />;
        case 'Observation': return <Eye className="w-3 h-3" />;
        default: return <Calendar className="w-3 h-3" />;
      }
    };

    return (
    <div className="bg-[#11141b] border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl glass-panel">
        <div className="bg-black/40 p-6 flex items-center justify-between text-white border-b border-white/5">
          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5 text-emerald-500" />
            <h3 className="font-black uppercase tracking-[0.3em] text-[10px] font-mono text-white/60">{monthName} {year}</h3>
          </div>
          <div className="flex gap-2">
            <button onClick={prevMonth} className="p-2 hover:bg-white/5 rounded-xl transition-colors border border-white/5"><ChevronLeft className="w-5 h-5" /></button>
            <button onClick={nextMonth} className="p-2 hover:bg-white/5 rounded-xl transition-colors border border-white/5"><ChevronRight className="w-5 h-5" /></button>
          </div>
        </div>
        
        <div className="grid grid-cols-7 border-b border-white/5 bg-black/20">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
            <div key={d} className="py-3 text-center text-[8px] font-mono font-black text-white/20 uppercase tracking-widest border-r border-white/5 last:border-0">
              {d}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 bg-black/10">
          {blanks.map(b => <div key={`blank-${b}`} className="aspect-square border-r border-b border-white/5 bg-white/[0.02]" />)}
          {days.map(d => {
            const dayEvents = getEventsForDay(d);
            const isToday = new Date().toDateString() === new Date(currentMonth.getFullYear(), currentMonth.getMonth(), d).toDateString();
            
            return (
              <div key={d} className={`aspect-square border-r border-b border-white/5 p-2 relative group hover:bg-white/[0.05] transition-colors ${isToday ? 'bg-emerald-500/5' : ''}`}>
                <span className={`text-[10px] font-mono font-black ${isToday ? 'text-emerald-500' : 'text-white/20'}`}>{d}</span>
                <div className="mt-1 flex flex-wrap gap-1">
                  {dayEvents.map((e, i) => (
                    <div key={i} className={`w-1.5 h-1.5 rounded-full ${getTypeColor(e.type)} shadow-[0_0_8px_rgba(0,0,0,0.5)]`} title={e.title} />
                  ))}
                </div>
                
                {dayEvents.length > 0 && (
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-[#1a1d25] text-white p-4 rounded-2xl shadow-2xl opacity-0 group-hover:opacity-100 pointer-events-none transition-all border border-white/10 z-50 transform translate-y-2 group-hover:translate-y-0">
                    {dayEvents.map((e, i) => (
                      <div key={i} className="mb-3 last:mb-0">
                        <div className="flex items-center gap-2 mb-1.5">
                          <div className={`p-1 rounded-md ${getTypeColor(e.type)} bg-opacity-20`}>{getTypeIcon(e.type)}</div>
                          <span className="text-[8px] font-mono font-black uppercase tracking-widest text-white/40">{e.type}</span>
                        </div>
                        <p className="text-[11px] font-black leading-tight text-white/90">{e.title}</p>
                        <p className="text-[9px] text-white/40 mt-1 leading-tight font-mono">{e.description}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const handlePlanning = async (loc?: string) => {
    const searchLoc = loc || location;
    if (!searchLoc) return;
    setLoading(true);
    try {
      const [planningData, recommendations, rotation, calendar] = await Promise.all([
        fetchSeasonalPlanning(searchLoc, crops, language, plantingDate),
        suggestCropsForSeason(searchLoc, plantingDate, language),
        getCropRotationAdvice(searchLoc, crops, '', [], language),
        fetchSeasonalCalendar(searchLoc, crops, plantingDate, language)
      ]);
      setReport(planningData);
      setCropRecommendations(recommendations);
      setRotationAdvice(rotation);
      setCalendarEvents(calendar);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const detectLocation = () => {
    setDetecting(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const res = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&appid=${WEATHER_API_KEY}&units=metric`);
          const data = await res.json();
          setWeather(data);
          const cityRegion = data.name && data.sys?.country ? `${data.name}, ${data.sys.country}` : "Unknown Location";
          setLocation(cityRegion);
          handlePlanning(cityRegion);
        } catch (err) { console.error(err); }
        finally { setDetecting(false); }
      },
      () => setDetecting(false)
    );
  };

  React.useEffect(() => {
    if (location) handlePlanning();
    else detectLocation();
  }, []);

  return (
    <div className="space-y-12 pb-40 animate-in fade-in slide-in-from-bottom-6 duration-700">
      {/* Current Cropping Season Banner */}
      <div className="glass-panel rounded-[2.5rem] p-8 border border-white/10 flex items-center justify-between relative overflow-hidden group">
         <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
         <div className="flex items-center gap-6 relative z-10">
            <div className="bg-white/5 p-5 rounded-2xl border border-white/10 shadow-inner group-hover:border-emerald-500/30 transition-colors">
               {React.cloneElement(currentSeason.icon as any, { className: 'w-6 h-6 text-emerald-500' })}
            </div>
            <div>
               <p className="text-[10px] font-mono font-black text-white/30 uppercase tracking-[0.4em] mb-1">Active Operational Season</p>
               <h3 className="text-3xl font-black text-white tracking-tighter uppercase font-display">{currentSeason.name}</h3>
            </div>
         </div>
         <div className="bg-emerald-500/10 px-6 py-3 rounded-2xl border border-emerald-500/20 relative z-10">
            <span className="text-[10px] font-mono font-black text-emerald-500 uppercase tracking-widest flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              {currentSeason.status}
            </span>
         </div>
      </div>

      {/* Weather Pulse Section */}
      {weather && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <WeatherStat 
            icon={<Thermometer className="w-4 h-4" />} 
            label="Current Temp" 
            value={`${Math.round(weather.main.temp)}°C`} 
            sub={weather.weather[0].description}
          />
          <WeatherStat 
            icon={<Droplets className="w-4 h-4" />} 
            label="Humidity" 
            value={`${weather.main.humidity}%`} 
            sub="Relative"
          />
          <WeatherStat 
            icon={<Wind className="w-4 h-4" />} 
            label="Wind Velocity" 
            value={`${Math.round(weather.wind.speed * 3.6)} km/h`} 
            sub="Drift Risk"
          />
        </div>
      )}

      <div className="glass-panel rounded-[3rem] p-10 border border-white/10 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-10 opacity-[0.02] pointer-events-none">
          <Zap className="w-96 h-96 -mr-20 -mt-20 rotate-12" />
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-12 relative z-10">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-[10px] font-mono text-emerald-500 font-bold uppercase tracking-[0.4em]">Strategic Intelligence</span>
            </div>
            <h2 className="text-5xl font-black text-white tracking-tighter font-display uppercase leading-none">
              Climate <span className="text-emerald-500">Strategy.</span>
            </h2>
            <p className="text-white/40 text-sm font-medium leading-relaxed max-w-xl">
              Synthesizing IMD predictions and long-term atmospheric trends into actionable field tactics for high-yield operations.
            </p>
          </div>
          
          <div className="flex items-center gap-4 bg-white/5 p-4 rounded-2xl border border-white/10">
            <LangIcon className="w-4 h-4 text-emerald-500" />
            <select 
              value={language}
              onChange={(e) => { setLanguage(e.target.value); localStorage.setItem('agri_language', e.target.value); }}
              className="bg-transparent text-[10px] font-mono font-black text-white/60 outline-none appearance-none cursor-pointer uppercase tracking-widest"
            >
               {LANGUAGES.map(l => <option key={l.name} value={l.name} className="bg-[#0a0c10]">{l.label}</option>)}
            </select>
          </div>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); handlePlanning(); }} className="space-y-8 mb-16 relative z-10">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <label className="text-[10px] font-mono font-black text-white/20 ml-6 uppercase tracking-[0.3em]">Operational District</label>
              <div className="relative group">
                <input 
                  placeholder="Primary Farming Coordinates..." 
                  className="w-full bg-white/5 border border-white/10 p-6 pl-16 rounded-[2.5rem] outline-none focus:border-emerald-500/50 transition-all font-mono text-sm text-white shadow-inner placeholder:text-white/10"
                  value={location}
                  onChange={e => setLocation(e.target.value)}
                />
                <MapPin className="absolute left-6 top-1/2 -translate-y-1/2 text-emerald-500 w-6 h-6 group-focus-within:scale-110 transition-transform" />
                <button 
                  type="button"
                  onClick={detectLocation}
                  disabled={detecting}
                  className="absolute right-6 top-1/2 -translate-y-1/2 p-3 hover:bg-white/10 rounded-xl transition-all text-white/20 hover:text-emerald-500 border border-transparent hover:border-white/10"
                >
                  {detecting ? <Loader2 className="w-5 h-5 animate-spin text-emerald-500" /> : <Navigation className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-mono font-black text-white/20 ml-6 uppercase tracking-[0.3em]">Deployment Window</label>
              <div className="relative group">
                <input 
                  type="date"
                  className="w-full bg-white/5 border border-white/10 p-6 pl-16 rounded-[2.5rem] outline-none focus:border-emerald-500/50 transition-all font-mono text-sm text-white shadow-inner"
                  value={plantingDate}
                  onChange={e => setPlantingDate(e.target.value)}
                />
                <Clock className="absolute left-6 top-1/2 -translate-y-1/2 text-emerald-500 w-6 h-6 group-focus-within:scale-110 transition-transform" />
              </div>
            </div>
          </div>

          <button 
            type="submit"
            disabled={loading || detecting}
            className="w-full bg-emerald-500 text-black font-black py-6 rounded-[2.5rem] flex items-center justify-center gap-4 shadow-2xl active:scale-[0.98] transition-all disabled:opacity-50 glow-emerald uppercase tracking-[0.2em] text-xs"
          >
            {loading ? <Loader2 className="animate-spin w-5 h-5" /> : <Zap className="w-5 h-5" />}
            Initialize Climate Analysis
          </button>
        </form>

        {loading ? (
          <div className="py-32 flex flex-col items-center justify-center space-y-8 relative z-10">
             <div className="relative">
                <div className="w-32 h-32 border-[12px] border-white/5 rounded-full shadow-inner opacity-20"></div>
                <div className="absolute inset-0 w-32 h-32 border-[12px] border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <Waves className="w-10 h-10 text-emerald-500 animate-pulse" />
                </div>
            </div>
            <div className="text-center space-y-3">
               <p className="font-mono font-black uppercase tracking-[0.5em] text-[10px] text-emerald-500 animate-pulse">Modeling Atmospheric Patterns...</p>
               <p className="text-[9px] text-white/20 font-mono font-bold uppercase tracking-widest">Grounding in regional 6-month outlooks v4.0</p>
            </div>
          </div>
        ) : report ? (
          <div className="space-y-16 animate-in fade-in slide-in-from-bottom-4 duration-500 relative z-10">
            {/* Recommended Crops Section */}
            {cropRecommendations.length > 0 && (
              <div className="space-y-6">
                 <div className="flex items-center gap-4 px-2">
                    <div className="w-1 h-4 bg-emerald-500 rounded-full" />
                    <h3 className="text-[10px] font-mono font-black text-white/40 uppercase tracking-[0.4em]">Neural Crop Recommendations</h3>
                 </div>
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {cropRecommendations.map((crop, i) => (
                      <div key={i} className="bg-white/5 border border-white/10 p-6 rounded-[2rem] flex items-start gap-5 shadow-sm hover:border-emerald-500/30 transition-all group relative overflow-hidden">
                         <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                         <div className={`p-4 rounded-2xl shrink-0 relative z-10 ${crop.suitability === 'High' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'}`}>
                            <Sprout className="w-6 h-6" />
                         </div>
                         <div className="relative z-10 flex-1">
                            <div className="flex items-center justify-between mb-2">
                               <h4 className="font-black text-white text-lg tracking-tight uppercase font-display">{crop.name}</h4>
                               <span className={`text-[8px] font-black uppercase px-2.5 py-1 rounded-full border ${crop.suitability === 'High' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-amber-500/10 text-amber-500 border-amber-500/20'}`}>
                                 {crop.suitability}
                               </span>
                            </div>
                            <p className="text-[11px] text-white/50 leading-relaxed font-medium italic font-mono">
                               {crop.reasoning}
                            </p>
                         </div>
                      </div>
                    ))}
                 </div>
              </div>
            )}

            {/* Seasonal Calendar Section */}
            {calendarEvents.length > 0 && (
              <div className="space-y-6">
                <div className="flex items-center gap-4 px-2">
                  <div className="w-1 h-4 bg-emerald-500 rounded-full" />
                  <h3 className="text-[10px] font-mono font-black text-white/40 uppercase tracking-[0.4em]">Operational Field Calendar</h3>
                </div>
                <SeasonalCalendarView events={calendarEvents} />
                <div className="flex flex-wrap gap-6 px-6 py-4 bg-black/20 rounded-2xl border border-white/5">
                  {[
                    { label: 'Planting', color: 'bg-emerald-500' },
                    { label: 'Harvest', color: 'bg-amber-500' },
                    { label: 'Irrigation', color: 'bg-blue-500' },
                    { label: 'Fertilizer', color: 'bg-purple-500' },
                    { label: 'Observation', color: 'bg-rose-500' }
                  ].map(legend => (
                    <div key={legend.label} className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${legend.color} shadow-[0_0_8px_rgba(0,0,0,0.5)]`} />
                      <span className="text-[9px] font-mono font-black text-white/30 uppercase tracking-widest">{legend.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Symbiotic Cultivation Section (Rotation & Intercropping) */}
            {rotationAdvice && (
              <div className="space-y-8">
                <div className="flex items-center gap-4 px-2">
                  <div className="w-1 h-4 bg-emerald-500 rounded-full" />
                  <h3 className="text-[10px] font-mono font-black text-white/40 uppercase tracking-[0.4em]">Symbiotic Deployment Matrix</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    { icon: ArrowRightLeft, title: 'Crop Rotation', sub: 'Soil Vitality Protocols', color: 'emerald' },
                    { icon: Users, title: 'Companion Planting', sub: 'Natural Synergies', color: 'blue' },
                    { icon: LayersIcon, title: 'Intercropping', sub: 'Spatial Optimization', color: 'amber' }
                  ].map((item, i) => (
                    <div key={i} className={`bg-${item.color}-500/5 border border-${item.color}-500/10 p-8 rounded-[2.5rem] shadow-sm relative overflow-hidden group hover:border-${item.color}-500/30 transition-all`}>
                       <item.icon className={`absolute -right-6 -bottom-6 w-24 h-24 text-${item.color}-500/10 group-hover:scale-110 group-hover:rotate-12 transition-transform`} />
                       <div className="relative z-10">
                          <div className={`bg-${item.color}-500/10 p-3 rounded-2xl w-fit mb-6 border border-${item.color}-500/20 text-${item.color}-500`}><item.icon className="w-5 h-5" /></div>
                          <h4 className={`text-[10px] font-mono font-black text-${item.color}-500/60 uppercase tracking-[0.3em] mb-2`}>{item.title}</h4>
                          <p className="text-lg font-black text-white tracking-tight uppercase font-display">{item.sub}</p>
                       </div>
                    </div>
                  ))}
                </div>

                <div className="bg-[#11141b] p-10 rounded-[3rem] border border-white/10 shadow-2xl relative overflow-hidden group">
                   <div className="absolute top-0 right-0 p-10 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity">
                      <RefreshCw className="w-64 h-64 -mr-10 -mt-10" />
                   </div>
                   <div className="relative z-10 space-y-8">
                      <div className="flex items-center gap-3 text-emerald-500 bg-emerald-500/5 w-fit px-6 py-2 rounded-full border border-emerald-500/20 shadow-sm">
                        <Zap className="w-4 h-4 text-amber-500" /> 
                        <span className="text-[10px] font-mono font-black uppercase tracking-[0.4em]">Strategic Rotation Intelligence</span>
                      </div>
                      <div className="prose prose-invert max-w-none">
                        <div className="text-white/70 font-mono text-sm leading-relaxed italic">
                          <Markdown>{rotationAdvice}</Markdown>
                        </div>
                      </div>
                   </div>
                </div>
              </div>
            )}

            <div className="bg-emerald-500/5 border border-emerald-500/10 p-10 rounded-[3rem] shadow-inner relative overflow-hidden group">
               <div className="absolute top-0 right-0 p-10 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity">
                  <TrendingUp className="w-64 h-64 -mr-10 -mt-10" />
               </div>
               <div className="relative z-10 space-y-8">
                  <div className="flex items-center gap-3 text-emerald-500 bg-emerald-500/5 w-fit px-6 py-2 rounded-full border border-emerald-500/20 shadow-sm">
                    <CheckCircle2 className="w-4 h-4" /> 
                    <span className="text-[10px] font-mono font-black uppercase tracking-[0.4em]">Synthesized Seasonal Directives</span>
                  </div>
                  <div className="prose prose-invert max-w-none">
                    <div className="text-white/70 font-mono text-sm leading-relaxed italic">
                      <Markdown>{report.text || ''}</Markdown>
                    </div>
                  </div>
               </div>
            </div>

            <div className="space-y-6">
              <div className="flex items-center gap-4 px-2">
                <div className="w-1 h-4 bg-emerald-500 rounded-full" />
                <h3 className="text-[10px] font-mono font-black text-white/40 uppercase tracking-[0.4em]">Intelligence Sources</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {report.sources.map((src, i) => src.web && (
                  <a 
                    key={i} 
                    href={src.web.uri} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center justify-between bg-white/5 border border-white/10 p-6 rounded-[2rem] hover:border-emerald-500/30 hover:bg-white/[0.07] transition-all group relative overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="flex-1 min-w-0 pr-6 relative z-10">
                      <div className="font-black text-sm text-white/90 truncate mb-1.5 font-display uppercase tracking-tight">{src.web.title}</div>
                      <div className="text-[9px] font-mono font-bold text-white/20 uppercase tracking-widest truncate">
                        {new URL(src.web.uri).hostname}
                      </div>
                    </div>
                    <ExternalLink className="w-5 h-5 text-white/10 group-hover:text-emerald-500 transition-all relative z-10" />
                  </a>
                ))}
              </div>
            </div>

            <div className="bg-rose-500/5 border border-rose-500/10 p-8 rounded-[2.5rem] flex gap-6 items-start shadow-sm group hover:border-rose-500/30 transition-all">
               <div className="bg-rose-500/10 p-4 rounded-2xl text-rose-500 border border-rose-500/20 shadow-inner group-hover:scale-110 transition-transform">
                  <AlertCircle className="w-7 h-7" />
               </div>
               <div className="space-y-2">
                  <h4 className="text-[10px] font-mono font-black text-rose-500 uppercase tracking-[0.3em]">Operational Mitigation Advisory</h4>
                  <p className="text-[11px] text-white/50 font-medium leading-relaxed font-mono italic">
                     Seasonal planning is based on probabilistic neural climate models. Always monitor real-time telemetry bulletins for sudden anomalies in monsoon velocity or localized atmospheric disturbances.
                  </p>
               </div>
            </div>
          </div>
        ) : (
          <div className="py-32 text-center text-white/5 flex flex-col items-center relative z-10">
            <CloudSun className="w-24 h-24 mb-8 opacity-20" />
            <p className="font-mono font-black text-[10px] uppercase tracking-[0.5em] leading-relaxed max-w-xs opacity-40">
              Awaiting Regional Coordinates for Seasonal Synthesis v4.0
            </p>
          </div>
        )}
      </div>

      {/* Footer */}
      <section className="px-6 mt-20 mb-10 text-center">
        <div className="flex items-center justify-center gap-4 mb-4 opacity-10">
          <div className="h-px w-12 bg-white" />
          <span className="text-[8px] font-mono uppercase tracking-[0.5em]">End of Stream</span>
          <div className="h-px w-12 bg-white" />
        </div>
        <p className="text-[8px] font-mono text-white/20 uppercase tracking-[0.3em]">
          © {new Date().getFullYear()} BHARAT-KRISHI-SYSTEMS
        </p>
      </section>
    </div>
  );
};

const WeatherStat: React.FC<{ icon: React.ReactNode, label: string, value: string, sub: string }> = ({ icon, label, value, sub }) => (
  <div className="bg-white/5 border border-white/10 p-6 rounded-[2rem] flex items-center gap-5 group hover:border-emerald-500/30 transition-all">
    <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-xl border border-emerald-500/20 group-hover:scale-110 transition-transform">
      {icon}
    </div>
    <div>
      <p className="text-[9px] font-mono font-black text-white/30 uppercase tracking-widest mb-1">{label}</p>
      <div className="flex items-baseline gap-2">
        <span className="text-xl font-black text-white uppercase font-display">{value}</span>
        <span className="text-[9px] font-mono font-bold text-white/20 uppercase">{sub}</span>
      </div>
    </div>
  </div>
);

export default SeasonalPlanner;
