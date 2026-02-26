
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
  Eye
} from 'lucide-react';
import Markdown from 'react-markdown';
import { motion, AnimatePresence } from 'motion/react';

const WEATHER_API_KEY = "42d5aa17c7f2866670e62b4c77cb3d32";

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
      <div className="bg-white border border-stone-200 rounded-[2.5rem] overflow-hidden shadow-sm">
        <div className="bg-stone-900 p-6 flex items-center justify-between text-white">
          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5 text-amber-400" />
            <h3 className="font-black uppercase tracking-widest text-sm">{monthName} {year}</h3>
          </div>
          <div className="flex gap-2">
            <button onClick={prevMonth} className="p-2 hover:bg-white/10 rounded-xl transition-colors"><ChevronLeft className="w-5 h-5" /></button>
            <button onClick={nextMonth} className="p-2 hover:bg-white/10 rounded-xl transition-colors"><ChevronRight className="w-5 h-5" /></button>
          </div>
        </div>
        
        <div className="grid grid-cols-7 border-b border-stone-100">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
            <div key={d} className="py-3 text-center text-[10px] font-black text-stone-400 uppercase tracking-widest border-r border-stone-100 last:border-0">
              {d}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7">
          {blanks.map(b => <div key={`blank-${b}`} className="aspect-square border-r border-b border-stone-50 bg-stone-50/30" />)}
          {days.map(d => {
            const dayEvents = getEventsForDay(d);
            const isToday = new Date().toDateString() === new Date(currentMonth.getFullYear(), currentMonth.getMonth(), d).toDateString();
            
            return (
              <div key={d} className={`aspect-square border-r border-b border-stone-100 p-2 relative group hover:bg-stone-50 transition-colors ${isToday ? 'bg-amber-50/30' : ''}`}>
                <span className={`text-[10px] font-black ${isToday ? 'text-amber-600' : 'text-stone-400'}`}>{d}</span>
                <div className="mt-1 flex flex-wrap gap-1">
                  {dayEvents.map((e, i) => (
                    <div key={i} className={`w-1.5 h-1.5 rounded-full ${getTypeColor(e.type)}`} title={e.title} />
                  ))}
                </div>
                
                {dayEvents.length > 0 && (
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-stone-900 text-white p-3 rounded-2xl shadow-2xl opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
                    {dayEvents.map((e, i) => (
                      <div key={i} className="mb-2 last:mb-0">
                        <div className="flex items-center gap-2 mb-1">
                          <div className={`p-1 rounded-md ${getTypeColor(e.type)}`}>{getTypeIcon(e.type)}</div>
                          <span className="text-[10px] font-black uppercase tracking-widest">{e.type}</span>
                        </div>
                        <p className="text-[11px] font-bold leading-tight">{e.title}</p>
                        <p className="text-[9px] text-stone-400 mt-1 leading-tight">{e.description}</p>
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
        getCropRotationAdvice(searchLoc, crops, language),
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
    <div className="space-y-8 pb-24 animate-in fade-in slide-in-from-bottom-6 duration-700">
      {/* Current Cropping Season Banner */}
      <div className="bg-white rounded-[2.5rem] p-6 shadow-sm border border-stone-200 flex items-center justify-between">
         <div className="flex items-center gap-4">
            <div className="bg-stone-50 p-4 rounded-2xl border border-stone-100 shadow-inner">
               {currentSeason.icon}
            </div>
            <div>
               <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Active Indian Season</p>
               <h3 className="text-xl font-black text-stone-900">{currentSeason.name}</h3>
            </div>
         </div>
         <div className="bg-emerald-50 px-4 py-2 rounded-xl border border-emerald-100">
            <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest flex items-center gap-2">
              <CheckCircle2 className="w-3 h-3" /> {currentSeason.status}
            </span>
         </div>
      </div>

      <div className="bg-white rounded-[3rem] p-8 shadow-sm border border-stone-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
          <div>
            <h2 className="text-3xl font-black text-stone-900 flex items-center gap-3 tracking-tighter">
              <div className="bg-[#ffddb3] p-2.5 rounded-2xl">
                <Sparkles className="text-[#825500] w-6 h-6" />
              </div>
              Climate Strategy
            </h2>
            <p className="text-stone-500 text-sm font-medium mt-2 leading-relaxed">
              Synthesizing IMD predictions and long-term trends into actionable field tactics.
            </p>
          </div>
          
          <div className="flex items-center gap-3 bg-stone-50 p-3 rounded-2xl border border-stone-100">
            <LangIcon className="w-4 h-4 text-[#825500]" />
            <select 
              value={language}
              onChange={(e) => { setLanguage(e.target.value); localStorage.setItem('agri_language', e.target.value); }}
              className="bg-transparent text-xs font-black text-stone-700 outline-none appearance-none cursor-pointer"
            >
               {LANGUAGES.map(l => <option key={l.name} value={l.name}>{l.label}</option>)}
            </select>
          </div>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); handlePlanning(); }} className="space-y-6 mb-12">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-stone-400 ml-5 uppercase tracking-widest">District</label>
              <div className="relative">
                <input 
                  placeholder="Primary Farming District..." 
                  className="w-full bg-stone-50 border border-stone-100 p-5 pl-14 rounded-[2rem] outline-none focus:ring-2 focus:ring-[#825500] transition-all font-black text-sm shadow-inner"
                  value={location}
                  onChange={e => setLocation(e.target.value)}
                />
                <MapPin className="absolute left-5 top-1/2 -translate-y-1/2 text-[#825500] w-6 h-6" />
                <button 
                  type="button"
                  onClick={detectLocation}
                  disabled={detecting}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-2 hover:bg-stone-200 rounded-xl transition-colors text-stone-400"
                >
                  {detecting ? <Loader2 className="w-4 h-4 animate-spin text-[#825500]" /> : <Navigation className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black text-stone-400 ml-5 uppercase tracking-widest">Planting Window</label>
              <div className="relative">
                <input 
                  type="date"
                  className="w-full bg-stone-50 border border-stone-100 p-5 pl-14 rounded-[2rem] outline-none focus:ring-2 focus:ring-[#825500] transition-all font-black text-sm shadow-inner"
                  value={plantingDate}
                  onChange={e => setPlantingDate(e.target.value)}
                />
                <Clock className="absolute left-5 top-1/2 -translate-y-1/2 text-[#825500] w-6 h-6" />
              </div>
            </div>
          </div>

          <button 
            type="submit"
            disabled={loading || detecting}
            className="w-full bg-stone-900 text-white font-black py-5 rounded-[2rem] flex items-center justify-center gap-3 shadow-xl active:scale-[0.98] transition-all disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin w-5 h-5" /> : <Zap className="w-5 h-5 text-amber-400" />}
            Refresh Climate Strategy
          </button>
        </form>

        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center space-y-6">
             <div className="relative">
                <div className="w-24 h-24 border-8 border-amber-50 rounded-full shadow-inner opacity-20"></div>
                <div className="absolute inset-0 w-24 h-24 border-8 border-[#825500] border-t-transparent rounded-full animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <Waves className="w-8 h-8 text-[#825500] animate-pulse" />
                </div>
            </div>
            <div className="text-center">
               <p className="font-black uppercase tracking-[0.4em] text-[10px] text-[#825500] animate-pulse">Modeling Weather Patterns...</p>
               <p className="text-[9px] text-stone-400 font-bold mt-2 uppercase tracking-widest">Grounding in regional 6-month outlooks</p>
            </div>
          </div>
        ) : report ? (
          <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Recommended Crops Section */}
            {cropRecommendations.length > 0 && (
              <div className="space-y-4">
                 <h3 className="text-[10px] font-black text-stone-400 uppercase tracking-[0.25em] px-2 flex items-center gap-2">
                    <Target className="w-4 h-4 text-[#825500]" /> AI Recommended Crops
                 </h3>
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {cropRecommendations.map((crop, i) => (
                      <div key={i} className="bg-stone-50 border border-stone-100 p-5 rounded-[1.75rem] flex items-start gap-4 shadow-sm hover:border-[#825500]/20 transition-all group">
                         <div className={`p-3 rounded-2xl shrink-0 ${crop.suitability === 'High' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                            <Sprout className="w-5 h-5" />
                         </div>
                         <div>
                            <div className="flex items-center justify-between mb-1">
                               <h4 className="font-black text-stone-900 text-sm">{crop.name}</h4>
                               <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-md ${crop.suitability === 'High' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                 {crop.suitability}
                               </span>
                            </div>
                            <p className="text-[11px] text-stone-500 leading-relaxed font-medium italic">
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
              <div className="space-y-4">
                <h3 className="text-[10px] font-black text-stone-400 uppercase tracking-[0.25em] px-2 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-[#825500]" /> Seasonal Field Calendar
                </h3>
                <SeasonalCalendarView events={calendarEvents} />
                <div className="flex flex-wrap gap-4 px-4">
                  {[
                    { label: 'Planting', color: 'bg-emerald-500' },
                    { label: 'Harvest', color: 'bg-amber-500' },
                    { label: 'Irrigation', color: 'bg-blue-500' },
                    { label: 'Fertilizer', color: 'bg-purple-500' },
                    { label: 'Observation', color: 'bg-rose-500' }
                  ].map(legend => (
                    <div key={legend.label} className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${legend.color}`} />
                      <span className="text-[9px] font-black text-stone-400 uppercase tracking-widest">{legend.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Symbiotic Cultivation Section (Rotation & Intercropping) */}
            {rotationAdvice && (
              <div className="space-y-6">
                <h3 className="text-[10px] font-black text-stone-400 uppercase tracking-[0.25em] px-2 flex items-center gap-2">
                  <ArrowRightLeft className="w-4 h-4 text-[#825500]" /> Symbiotic Cultivation Plan
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-emerald-50 border border-emerald-100 p-6 rounded-[2rem] shadow-sm relative overflow-hidden group">
                     <ArrowRightLeft className="absolute -right-4 -bottom-4 w-20 h-20 text-emerald-600/10 group-hover:scale-110 transition-transform" />
                     <div className="relative z-10">
                        <div className="bg-white p-2 rounded-xl w-fit mb-4 shadow-sm text-emerald-600"><ArrowRightLeft className="w-4 h-4" /></div>
                        <h4 className="text-[10px] font-black text-emerald-800 uppercase tracking-widest mb-1">Crop Rotation</h4>
                        <p className="text-xs font-bold text-emerald-900 leading-tight">Soil Vitality Protocols</p>
                     </div>
                  </div>
                  <div className="bg-blue-50 border border-blue-100 p-6 rounded-[2rem] shadow-sm relative overflow-hidden group">
                     <Users className="absolute -right-4 -bottom-4 w-20 h-20 text-blue-600/10 group-hover:scale-110 transition-transform" />
                     <div className="relative z-10">
                        <div className="bg-white p-2 rounded-xl w-fit mb-4 shadow-sm text-blue-600"><Users className="w-4 h-4" /></div>
                        <h4 className="text-[10px] font-black text-blue-800 uppercase tracking-widest mb-1">Companion Planting</h4>
                        <p className="text-xs font-bold text-blue-900 leading-tight">Natural Synergies</p>
                     </div>
                  </div>
                  <div className="bg-amber-50 border border-amber-100 p-6 rounded-[2rem] shadow-sm relative overflow-hidden group">
                     <LayersIcon className="absolute -right-4 -bottom-4 w-20 h-20 text-amber-600/10 group-hover:scale-110 transition-transform" />
                     <div className="relative z-10">
                        <div className="bg-white p-2 rounded-xl w-fit mb-4 shadow-sm text-amber-600"><LayersIcon className="w-4 h-4" /></div>
                        <h4 className="text-[10px] font-black text-amber-800 uppercase tracking-widest mb-1">Intercropping</h4>
                        <p className="text-xs font-bold text-amber-900 leading-tight">Spatial Optimization</p>
                     </div>
                  </div>
                </div>

                <div className="bg-stone-900 p-8 rounded-[3rem] text-white shadow-2xl relative overflow-hidden">
                   <div className="absolute top-0 right-0 p-8 opacity-5">
                      <RefreshCw className="w-48 h-48" />
                   </div>
                   <div className="relative z-10">
                      <div className="flex items-center gap-2 text-emerald-400 font-black text-[10px] uppercase tracking-[0.2em] mb-8 bg-white/5 w-fit px-4 py-1.5 rounded-full border border-white/10">
                        <Zap className="w-4 h-4 text-amber-400" /> Strategic Rotation Intel
                      </div>
                      <div className="prose prose-invert max-w-none text-sm font-medium text-stone-300 leading-relaxed italic">
                        <Markdown>{rotationAdvice}</Markdown>
                      </div>
                   </div>
                </div>
              </div>
            )}

            <div className="bg-[#fffcf9] border-2 border-[#ffddb3]/30 p-8 rounded-[3rem] shadow-inner relative overflow-hidden">
               <div className="absolute top-0 right-0 p-8 opacity-5">
                  <TrendingUp className="w-48 h-48" />
               </div>
               <div className="relative z-10">
                  <div className="flex items-center gap-2 text-[#825500] font-black text-[10px] uppercase tracking-[0.2em] mb-8 bg-white/60 w-fit px-4 py-1.5 rounded-full border border-white/40 shadow-sm">
                    <CheckCircle2 className="w-4 h-4" /> Synthesized Seasonal Directives
                  </div>
                  <div className="prose prose-stone max-w-none text-sm font-medium text-stone-700 leading-relaxed italic">
                    <Markdown>{report.text || ''}</Markdown>
                  </div>
               </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-[10px] font-black text-stone-400 uppercase tracking-[0.2em] px-2 flex items-center gap-2">
                <Calendar className="w-4 h-4" /> Strategic Sources
              </h3>
              <div className="grid grid-cols-1 gap-3">
                {report.sources.map((src, i) => src.web && (
                  <a 
                    key={i} 
                    href={src.web.uri} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center justify-between bg-white border border-stone-100 p-5 rounded-[1.5rem] hover:border-[#825500] hover:shadow-lg transition-all group"
                  >
                    <div className="flex-1 min-w-0 pr-4">
                      <div className="font-black text-xs text-stone-800 truncate mb-1">{src.web.title}</div>
                      <div className="text-[9px] font-bold text-stone-400 uppercase tracking-widest truncate">
                        {new URL(src.web.uri).hostname}
                      </div>
                    </div>
                    <ExternalLink className="w-4 h-4 text-stone-300 group-hover:text-[#825500] transition-colors" />
                  </a>
                ))}
              </div>
            </div>

            <div className="bg-rose-50 border border-rose-100 p-6 rounded-[2.25rem] flex gap-4 items-start shadow-sm">
               <div className="bg-white p-3 rounded-2xl text-rose-600 shadow-inner">
                  <AlertCircle className="w-6 h-6" />
               </div>
               <div>
                  <h4 className="text-sm font-black text-rose-900 uppercase tracking-widest mb-1">Mitigation Advisory</h4>
                  <p className="text-[11px] text-rose-700 font-bold leading-relaxed">
                     Seasonal planning is based on probabilistic climate models. Always monitor daily bulletins for sudden changes in monsoon speed or localized storm warnings.
                  </p>
               </div>
            </div>
          </div>
        ) : (
          <div className="py-24 text-center text-stone-300 opacity-20 flex flex-col items-center">
            <CloudSun className="w-20 h-20 mb-6" />
            <p className="font-black text-xs uppercase tracking-[0.3em] leading-relaxed max-w-[240px]">
              Awaiting Regional Coordinates for Seasonal Synthesis
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SeasonalPlanner;
