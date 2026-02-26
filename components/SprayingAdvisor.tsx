import React from 'react';
import { fetchSprayingAdvice } from '../services/geminiService';
import { ShieldAlert, Wind, Droplets, Loader2, Beaker, Info, CheckCircle2, AlertTriangle, Sunrise, Sunset, Clock, Zap, Ban, Sun } from 'lucide-react';
import Markdown from 'react-markdown';

const WEATHER_API_KEY = "42d5aa17c7f2866670e62b4c77cb3d32";

interface SprayingAdvisorProps {
  language: string;
}

const SprayingAdvisor: React.FC<SprayingAdvisorProps> = ({ language }) => {
  const [formData, setFormData] = React.useState({
    crop: '',
    pest: '',
    chemical: '',
    area: '1',
    tankSize: '20'
  });
  const [weather, setWeather] = React.useState<any>(null);
  const [advice, setAdvice] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [currentTime, setCurrentTime] = React.useState(new Date());

  React.useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    navigator.geolocation.getCurrentPosition(async (pos) => {
      try {
        const res = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&appid=${WEATHER_API_KEY}&units=metric`);
        const data = await res.json();
        setWeather(data);
      } catch (e) {
        console.error("Spraying weather check failed", e);
      }
    });
    return () => clearInterval(timer);
  }, []);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.crop || !formData.pest) return;
    setLoading(true);
    try {
      const res = await fetchSprayingAdvice({
        ...formData,
        windSpeed: weather?.wind?.speed || 0
      }, language);
      setAdvice(res || '');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const currentHour = currentTime.getHours();
  const isWindy = (weather?.wind?.speed || 0) > 4; // Threshold roughly 14 km/h
  const isTooHot = (weather?.main?.temp || 0) > 32;
  const isNight = currentHour < 5 || currentHour > 20;
  const isMidday = currentHour >= 11 && currentHour <= 16;
  
  const isRestricted = isWindy || isTooHot || isMidday;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="bg-white rounded-[3rem] p-8 md:p-12 shadow-sm border border-stone-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div>
            <h2 className="text-3xl font-black flex items-center gap-4 text-stone-900">
              <div className="bg-orange-100 p-3 rounded-2xl">
                <Beaker className="text-orange-600 w-8 h-8" />
              </div>
              Spraying Pro
            </h2>
            <p className="text-stone-500 font-medium mt-2">Precision application intelligence and safety protocols.</p>
          </div>
          
          {weather && (
            <div className={`inline-flex items-center gap-3 px-6 py-3 rounded-2xl border font-black uppercase tracking-widest text-xs transition-colors ${isRestricted ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`}>
              {isRestricted ? <Ban className="w-4 h-4 animate-pulse" /> : <CheckCircle2 className="w-4 h-4" />}
              {isRestricted ? 'Spraying Restricted' : 'Safe Spraying Window'}
            </div>
          )}
        </div>

        {weather && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
            <div className="bg-stone-50 rounded-[2.25rem] p-6 border border-stone-100">
               <div className="flex items-center justify-between mb-6">
                  <h3 className="text-[10px] font-black text-stone-400 uppercase tracking-widest flex items-center gap-2">
                    <Clock className="w-4 h-4" /> Operations Clock
                  </h3>
                  <span className="text-xs font-black text-[#825500]">{currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
               </div>
               
               <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-white rounded-2xl border border-stone-100 shadow-sm">
                    <div className="flex items-center gap-3">
                       <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg"><Sunrise className="w-4 h-4" /></div>
                       <div>
                          <p className="text-[9px] font-black text-stone-400 uppercase leading-none mb-1">Morning Peak</p>
                          <p className="text-xs font-bold text-stone-700">05:00 AM - 09:00 AM</p>
                       </div>
                    </div>
                    {currentHour >= 5 && currentHour <= 9 && !isWindy && <span className="bg-emerald-500 w-2 h-2 rounded-full animate-ping" />}
                  </div>

                  <div className="flex items-center justify-between p-3 bg-white rounded-2xl border border-stone-100 shadow-sm">
                    <div className="flex items-center gap-3">
                       <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg"><Sunset className="w-4 h-4" /></div>
                       <div>
                          <p className="text-[9px] font-black text-stone-400 uppercase leading-none mb-1">Evening Peak</p>
                          <p className="text-xs font-bold text-stone-700">05:30 PM - 08:00 PM</p>
                       </div>
                    </div>
                    {currentHour >= 17 && currentHour <= 20 && !isWindy && <span className="bg-emerald-500 w-2 h-2 rounded-full animate-ping" />}
                  </div>
               </div>
            </div>

            <div className="bg-rose-50 rounded-[2.25rem] p-6 border border-rose-100">
               <h3 className="text-[10px] font-black text-rose-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                 <AlertTriangle className="w-4 h-4" /> Restricted "No-Spray" Zones
               </h3>
               <div className="space-y-3">
                  <RestrictionBadge active={isMidday} label="Midday Peak Heat" icon={<Sun className="w-3 h-3" />} sub="Avoid 11 AM - 4 PM" />
                  <RestrictionBadge active={isWindy} label="High Drift Risk" icon={<Wind className="w-3 h-3" />} sub="Wind > 15 km/h" />
                  <RestrictionBadge active={isTooHot} label="Evaporation Risk" icon={<Zap className="w-3 h-3" />} sub="Temp > 32°C" />
               </div>
            </div>
          </div>
        )}

        <form onSubmit={handleGenerate} className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          <div className="space-y-1">
            <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-2">Crop</label>
            <input 
              placeholder="e.g. Cotton" 
              className="w-full bg-stone-50 border border-stone-100 p-4 rounded-2xl outline-none focus:ring-2 focus:ring-orange-500 font-bold text-sm"
              onChange={e => setFormData({...formData, crop: e.target.value})}
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-2">Pest / Disease</label>
            <input 
              placeholder="e.g. Bollworm" 
              className="w-full bg-stone-50 border border-stone-100 p-4 rounded-2xl outline-none focus:ring-2 focus:ring-orange-500 font-bold text-sm"
              onChange={e => setFormData({...formData, pest: e.target.value})}
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-2">Chemical (Optional)</label>
            <input 
              placeholder="e.g. Neem Oil" 
              className="w-full bg-stone-50 border border-stone-100 p-4 rounded-2xl outline-none focus:ring-2 focus:ring-orange-500 font-bold text-sm"
              onChange={e => setFormData({...formData, chemical: e.target.value})}
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-2">Area (Hectares)</label>
            <input 
              type="number"
              value={formData.area}
              className="w-full bg-stone-50 border border-stone-100 p-4 rounded-2xl outline-none focus:ring-2 focus:ring-orange-500 font-bold text-sm"
              onChange={e => setFormData({...formData, area: e.target.value})}
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-2">Tank Size (Liters)</label>
            <input 
              type="number"
              value={formData.tankSize}
              className="w-full bg-stone-50 border border-stone-100 p-4 rounded-2xl outline-none focus:ring-2 focus:ring-orange-500 font-bold text-sm"
              onChange={e => setFormData({...formData, tankSize: e.target.value})}
            />
          </div>
          <div className="flex items-end">
            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-stone-900 text-white font-black h-14 rounded-2xl flex items-center justify-center gap-3 hover:bg-black transition-all disabled:opacity-50 shadow-xl active:scale-[0.98]"
            >
              {loading ? <Loader2 className="animate-spin w-5 h-5" /> : <ShieldAlert className="w-5 h-5" />}
              Generate Safety Brief
            </button>
          </div>
        </form>

        {advice ? (
          <div className="grid lg:grid-cols-3 gap-8 animate-in slide-in-from-top-6 duration-700">
            <div className="lg:col-span-2 bg-stone-50 p-8 md:p-12 rounded-[3rem] border border-stone-100 prose prose-stone max-w-none shadow-inner">
              <div className="flex items-center gap-3 text-orange-600 font-black text-[10px] uppercase mb-8 tracking-[0.2em] bg-white w-fit px-4 py-1.5 rounded-full border border-stone-100">
                <CheckCircle2 className="w-4 h-4" /> Application Intelligence ({language})
              </div>
              {/* Fix: Moved className to a wrapping div because ReactMarkdown might not support it directly in this version's types */}
              <div className="font-medium text-stone-700 leading-relaxed text-sm">
                <Markdown>{advice}</Markdown>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-gradient-to-br from-orange-500 to-rose-600 p-8 rounded-[2.5rem] text-white shadow-xl shadow-orange-950/20 relative overflow-hidden">
                <ShieldAlert className="absolute -right-4 -bottom-4 w-24 h-24 opacity-10" />
                <h3 className="font-black text-sm uppercase tracking-widest mb-6 flex items-center gap-2 relative z-10">
                  <ShieldAlert className="w-5 h-5" /> Safety First
                </h3>
                <ul className="space-y-4 relative z-10">
                  <SafetyItem label="Chemical Respirator" />
                  <SafetyItem label="Nitrile Gloves" />
                  <SafetyItem label="Safety Goggles" />
                  <SafetyItem label="Protective Coveralls" />
                </ul>
              </div>

              <div className="bg-white p-8 rounded-[2.5rem] border-2 border-orange-50 shadow-sm">
                <h3 className="text-xs font-black text-stone-400 uppercase tracking-widest mb-4">Field Pulse</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-stone-600">Wind Velocity</span>
                    <span className={`font-black text-sm ${isWindy ? 'text-rose-500' : 'text-stone-900'}`}>{Math.round((weather?.wind?.speed || 0) * 3.6)} km/h</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-stone-600">Air Temp</span>
                    <span className={`font-black text-sm ${isTooHot ? 'text-rose-500' : 'text-stone-900'}`}>{Math.round(weather?.main?.temp || 0)}°C</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-stone-600">Relative Humidity</span>
                    <span className="font-black text-sm text-stone-900">{weather?.main?.humidity}%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="py-24 text-center text-stone-200 opacity-40 flex flex-col items-center">
            <Beaker className="w-24 h-24 mb-6" />
            <p className="font-black text-xl uppercase tracking-tighter">Define Application Parameters</p>
            <p className="text-xs font-bold mt-2">Get timing alerts & safety protocols</p>
          </div>
        )}
      </div>
    </div>
  );
};

const RestrictionBadge: React.FC<{ active: boolean, label: string, icon: React.ReactNode, sub: string }> = ({ active, label, icon, sub }) => (
  <div className={`flex items-center gap-3 p-3 rounded-2xl border transition-all ${active ? 'bg-white border-rose-200 shadow-sm' : 'opacity-40 border-transparent grayscale'}`}>
    <div className={`p-2 rounded-lg ${active ? 'bg-rose-100 text-rose-600' : 'bg-stone-200 text-stone-500'}`}>
       {icon}
    </div>
    <div>
       <p className="text-[10px] font-black uppercase text-stone-800 leading-none mb-0.5">{label}</p>
       <p className="text-[9px] font-bold text-stone-400">{sub}</p>
    </div>
    {active && <span className="ml-auto bg-rose-500 text-white text-[8px] font-black px-2 py-0.5 rounded uppercase">Stop</span>}
  </div>
);

const SafetyItem: React.FC<{ label: string }> = ({ label }) => (
  <li className="flex items-center gap-3 text-sm font-bold">
    <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-[10px]">
      <CheckCircle2 className="w-3 h-3" />
    </div>
    {label}
  </li>
);

export default SprayingAdvisor;