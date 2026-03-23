import React from 'react';
import { fetchAgriNews } from '../services/geminiService';
import { Newspaper, MapPin, Search, Loader2, ExternalLink, AlertCircle, Sunrise, Navigation, Radio, Wifi, Globe, Languages as LangIcon, CheckCircle2, Star, Thermometer, Droplets, CloudSun, Wind } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

const WEATHER_API_KEY = import.meta.env.VITE_WEATHER_API_KEY;

const LANGUAGES = [
  { name: "English", label: "English" },
  { name: "Hindi", label: "Hindi (हिंदी)" },
  { name: "Bengali", label: "Bengali (বাংলা)" },
  { name: "Telugu", label: "Telugu (తెలుగు)" },
  { name: "Marathi", label: "Marathi (ମରାઠી)" },
  { name: "Tamil", label: "Tamil (தமிழ்)" },
  { name: "Gujarati", label: "Gujarati (ગુજરાતી)" },
  { name: "Kannada", label: "Kannada (କନ୍ନଡ)" },
  { name: "Malayalam", label: "Malayalam (മലയാളം)" },
  { name: "Punjabi", label: "Punjabi (ਪੰਜਾਬੀ)" },
  { name: "Odia", label: "Odia (ଓଡ଼ିଆ)" },
  { name: "Assamese", label: "Assamese (ଅସମୀୟା)" },
  { name: "Urdu", label: "Urdu (اردو)" },
  { name: "Sanskrit", label: "Sanskrit (संस्कृतମ୍)" },
  { name: "Spanish", label: "Spanish (Español)" },
  { name: "French", label: "French (Français)" }
];

// Added AgriNewsProps interface to define the expected props
interface AgriNewsProps {
  language: string;
}

// Updated component to accept language from props
const AgriNews: React.FC<AgriNewsProps> = ({ language: initialLanguage }) => {
  const [location, setLocation] = React.useState('');
  const [weather, setWeather] = React.useState<any>(null);
  // Initialize local language state from prop
  const [language, setLanguage] = React.useState(initialLanguage);
  const [results, setResults] = React.useState<{ text?: string, sources: any[] } | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [detecting, setDetecting] = React.useState(false);
  const [lastUpdated, setLastUpdated] = React.useState<string | null>(null);
  const [saveStatus, setSaveStatus] = React.useState<'idle' | 'saving' | 'saved'>('idle');

  const handleSearch = async (loc?: string, lang?: string, wContext?: any) => {
    const searchLocation = loc || location;
    const searchLanguage = lang || language;
    const searchWeather = wContext || weather;
    
    if (!searchLocation) return;
    
    setLoading(true);
    try {
      const weatherString = searchWeather 
        ? `${searchWeather.main.temp}°C, ${searchWeather.main.humidity}% Humidity, ${searchWeather.weather[0].description}` 
        : undefined;
        
      const data = await fetchAgriNews(searchLocation, searchLanguage, weatherString);
      setResults(data);
      setLastUpdated(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
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
          const res = await fetch(
            `https://api.openweathermap.org/data/2.5/weather?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&appid=${WEATHER_API_KEY}&units=metric`
          );
          const data = await res.json();
          const cityRegion = data.name && data.sys?.country ? `${data.name}, ${data.sys.country}` : "Unknown Location";
          setLocation(cityRegion);
          setWeather(data);
          // Initial search with detected location and weather context
          handleSearch(cityRegion, language, data);
        } catch (err) {
          console.error("Location detection failed", err);
        } finally {
          setDetecting(false);
        }
      },
      (err) => {
        console.error("Geolocation error", err);
        setDetecting(false);
      },
      { enableHighAccuracy: true }
    );
  };

  const onLanguageSelect = (langName: string) => {
    setLanguage(langName);
    setSaveStatus('idle');
    if (location) {
      handleSearch(location, langName);
    }
  };

  const savePreference = () => {
    setSaveStatus('saving');
    localStorage.setItem('agri_language', language);
    setTimeout(() => {
      setSaveStatus('saved');
    }, 800);
  };

  React.useEffect(() => {
    detectLocation();
  }, []);

  const onFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch();
  };

  const preferredLanguage = localStorage.getItem('agri_language') || 'English';

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-700 bg-black min-h-screen">
      {/* Location & Contextual Hub */}
      <div className="bg-stone-900 rounded-[2.5rem] p-6 shadow-sm border border-stone-800 flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className={`p-3 rounded-2xl ${location ? 'bg-amber-500/10 text-amber-500' : 'bg-stone-800 text-stone-600'}`}>
                {detecting ? <Radio className="w-5 h-5 animate-pulse" /> : <Wifi className="w-5 h-5" />}
              </div>
              {location && <span className="absolute -top-1 -right-1 w-3 h-3 bg-amber-600 border-2 border-black rounded-full"></span>}
            </div>
            <div>
              <p className="text-[10px] font-bold text-stone-500 uppercase tracking-widest">Target Region</p>
              <h3 className="text-sm font-bold text-white truncate max-w-[140px]">
                {detecting ? 'Syncing...' : location || 'Awaiting Signal...'}
              </h3>
            </div>
          </div>
          
          {weather && !detecting && (
             <div className="bg-stone-800 px-4 py-2 rounded-2xl border border-stone-700 flex items-center gap-3 animate-in fade-in slide-in-from-right-4">
                <div className="text-right">
                   <p className="text-[9px] font-bold text-stone-500 uppercase tracking-widest">Context</p>
                   <p className="text-xs font-bold text-white">{Math.round(weather.main.temp)}°C</p>
                </div>
                <div className="bg-stone-900 p-2 rounded-xl shadow-sm border border-stone-800">
                   <CloudSun className="w-4 h-4 text-amber-500" />
                </div>
             </div>
          )}
        </div>

        {/* Mini Weather Brief for Search Grounding */}
        {weather && (
          <div className="grid grid-cols-3 gap-3">
             <WeatherBadge icon={<Thermometer className="w-3 h-3" />} label="Temp" value={`${Math.round(weather.main.temp)}°`} />
             <WeatherBadge icon={<Droplets className="w-3 h-3" />} label="Humidity" value={`${weather.main.humidity}%`} />
             <WeatherBadge icon={<Wind className="w-3 h-3" />} label="Wind" value={`${Math.round(weather.wind.speed * 3.6)}k`} />
          </div>
        )}

        <div className="flex flex-col gap-3 pt-2 border-t border-stone-800">
          <div className="flex items-center gap-3 bg-stone-800 p-4 rounded-3xl border border-stone-700 group">
            <LangIcon className="w-5 h-5 text-amber-500" />
            <div className="flex-1">
               <p className="text-[9px] font-bold text-stone-500 uppercase tracking-widest">Active Dialect</p>
               <select 
                 value={language}
                 onChange={(e) => onLanguageSelect(e.target.value)}
                 className="bg-transparent w-full text-sm font-bold text-amber-400 outline-none appearance-none cursor-pointer"
               >
                 {LANGUAGES.map(l => (
                   <option key={l.name} value={l.name} className="bg-stone-900 text-white">
                     {l.label} {preferredLanguage === l.name ? '(Preferred)' : ''}
                   </option>
                 ))}
               </select>
            </div>
            
            <button 
              onClick={savePreference}
              disabled={saveStatus === 'saved' || language === preferredLanguage}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-[10px] font-bold uppercase tracking-widest transition-all
                ${saveStatus === 'saved' || language === preferredLanguage
                  ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20 cursor-default' 
                  : 'bg-amber-600 text-black hover:bg-amber-500 active:scale-95 shadow-lg shadow-amber-900/40'}
              `}
            >
              {saveStatus === 'saved' || language === preferredLanguage ? (
                <><CheckCircle2 className="w-3.5 h-3.5" /> Saved</>
              ) : (
                <><Star className="w-3.5 h-3.5" /> Save</>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="bg-stone-900 rounded-[2.5rem] p-7 shadow-sm border border-stone-800">
        <div className="flex flex-col gap-6 mb-8">
            <div className="flex justify-between items-start">
                <div>
                    <h2 className="text-2xl font-black flex items-center gap-3 text-white uppercase tracking-tighter">
                      <Newspaper className="text-amber-500 w-6 h-6" />
                      Kisan Samachar
                    </h2>
                    <p className="text-stone-500 text-[10px] font-bold uppercase tracking-widest mt-1 leading-relaxed">
                       Regional intelligence for <span className="text-amber-500">{location || 'your region'}</span>.
                    </p>
                </div>
                {weather && (
                  <div className="bg-amber-500/10 text-amber-500 px-3 py-1 rounded-lg text-[9px] font-bold uppercase tracking-widest border border-amber-500/20">
                    Contextual
                  </div>
                )}
            </div>
        </div>

        <form onSubmit={onFormSubmit} className="flex flex-col gap-3 mb-10">
          <div className="relative">
            <input 
              placeholder="Search specific region..." 
              className="w-full bg-stone-800 border border-stone-700 p-4 pl-12 rounded-[1.5rem] outline-none focus:border-amber-600 transition-all font-bold text-sm text-white placeholder:text-stone-600"
              value={location}
              onChange={e => setLocation(e.target.value)}
            />
            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-amber-500 w-5 h-5" />
            <button 
              type="button"
              onClick={detectLocation}
              disabled={detecting}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-2 hover:bg-stone-700 rounded-xl transition-colors text-stone-500"
            >
              <Navigation className={`w-4 h-4 ${detecting ? 'animate-spin text-amber-500' : ''}`} />
            </button>
          </div>
          <button 
            type="submit"
            disabled={loading || detecting}
            className="bg-amber-600 text-black font-black py-4.5 rounded-[1.5rem] flex items-center justify-center gap-2 hover:bg-amber-500 transition-all disabled:opacity-50 shadow-xl active:scale-[0.98] uppercase tracking-widest"
          >
            {loading ? <Loader2 className="animate-spin w-5 h-5" /> : <Search className="w-5 h-5" />}
            Refresh Regional Intel
          </button>
        </form>

        {loading || detecting ? (
          <div className="py-24 flex flex-col items-center justify-center text-amber-500 space-y-5">
            <div className="relative">
                <div className="w-16 h-16 border-4 border-stone-800 rounded-full"></div>
                <div className="absolute inset-0 w-16 h-16 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <Globe className="w-6 h-6 animate-pulse" />
                </div>
            </div>
            <div className="text-center">
              <p className="font-black uppercase tracking-[0.2em] text-[10px] animate-pulse">
                {detecting ? "Triangulating Region..." : `Synthesizing ${language} Bulletins...`}
              </p>
              <p className="text-[9px] text-stone-600 mt-2 font-bold uppercase tracking-widest">Polling location-specific agricultural hubs</p>
            </div>
          </div>
        ) : results ? (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="prose prose-invert max-w-none bg-stone-800 p-7 rounded-[2rem] border border-stone-700 leading-relaxed shadow-inner">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2 text-amber-500 font-black text-[10px] uppercase tracking-widest">
                  <AlertCircle className="w-3 h-3" /> Grounded Analysis
                </div>
                <div className="text-[10px] font-bold text-stone-500 uppercase tracking-widest">
                  Updated: {lastUpdated}
                </div>
              </div>
              <div className="text-sm font-medium text-stone-300 space-y-4 markdown-body">
                <ReactMarkdown>{results.text || ''}</ReactMarkdown>
              </div>
            </div>
            
            <div className="space-y-4">
              <h3 className="text-[10px] font-black text-stone-500 uppercase tracking-[0.3em] px-2 flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-amber-500 rounded-full"></div>
                Verified News Citations
              </h3>
              <div className="grid grid-cols-1 gap-3">
                {results.sources.map((src, i) => (
                  src.web && (
                    <a 
                      key={i} 
                      href={src.web.uri} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center justify-between bg-stone-900 border border-stone-800 p-4.5 rounded-[1.25rem] hover:border-amber-500/50 hover:shadow-2xl hover:shadow-black/40 transition-all group"
                    >
                      <div className="flex-1 min-w-0 pr-4">
                        <div className="font-black text-xs text-white uppercase tracking-wider truncate mb-1">{src.web.title}</div>
                        <div className="text-[9px] font-bold text-stone-500 uppercase tracking-widest truncate">
                          Source: {new URL(src.web.uri).hostname}
                        </div>
                      </div>
                      <ExternalLink className="w-4 h-4 text-stone-700 group-hover:text-amber-500 transition-colors" />
                    </a>
                  )
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="py-24 text-center text-stone-800">
            <Newspaper className="w-16 h-16 mx-auto mb-5 opacity-20" />
            <p className="font-black text-[10px] uppercase tracking-[0.4em]">Synchronize location for intelligence sync</p>
          </div>
        )}
      </div>
    </div>
  );
};

const WeatherBadge: React.FC<{ icon: React.ReactNode, label: string, value: string }> = ({ icon, label, value }) => (
  <div className="bg-stone-800 border border-stone-700 p-2.5 rounded-2xl flex flex-col items-center">
    <div className="text-amber-500 mb-1">{icon}</div>
    <p className="text-[8px] font-black text-stone-500 uppercase tracking-tighter mb-0.5">{label}</p>
    <p className="text-[10px] font-black text-white leading-none">{value}</p>
  </div>
);

export default AgriNews;