
import React from 'react';
import { 
  Droplets, 
  CloudRain, 
  Sun, 
  Wind, 
  Loader2, 
  AlertCircle, 
  RefreshCw, 
  Zap, 
  Plus, 
  Trash2, 
  ChevronRight, 
  Sprout, 
  Layers,
  Settings2,
  CheckCircle2,
  Activity
} from 'lucide-react';
import { getAIClient } from '../services/geminiService';

interface IrrigationZone {
  id: string;
  name: string;
  cropType: string;
  soilType: string;
  lastWatered?: string;
}

const WEATHER_API_KEY = "42d5aa17c7f2866670e62b4c77cb3d32";

// Fixed error: Added IrrigationHubProps and used language from props
interface IrrigationHubProps {
  language: string;
}

const IrrigationHub: React.FC<IrrigationHubProps> = ({ language }) => {
  const [loading, setLoading] = React.useState(true);
  const [weather, setWeather] = React.useState<any>(null);
  const [zones, setZones] = React.useState<IrrigationZone[]>(() => {
    const saved = localStorage.getItem('agri_irrigation_zones');
    if (saved) return JSON.parse(saved);
    
    const mainCrops = JSON.parse(localStorage.getItem('agri_main_crops') || '[]');
    const soilType = localStorage.getItem('agri_soil_type') || 'Loamy';
    
    if (mainCrops.length > 0) {
      return mainCrops.map((crop: string, i: number) => ({
        id: (i + 1).toString(),
        name: `${crop} Field`,
        cropType: crop,
        soilType: soilType
      }));
    }
    
    return [
      { id: '1', name: 'Primary Field', cropType: 'Paddy', soilType: 'Loamy' }
    ];
  });
  const [recommendations, setRecommendations] = React.useState<Record<string, string>>({});
  const [activeZone, setActiveZone] = React.useState<IrrigationZone | null>(null);
  const [analyzing, setAnalyzing] = React.useState<string | null>(null);

  React.useEffect(() => {
    localStorage.setItem('agri_irrigation_zones', JSON.stringify(zones));
  }, [zones]);

  React.useEffect(() => {
    navigator.geolocation.getCurrentPosition(async (pos) => {
      try {
        const res = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&appid=${WEATHER_API_KEY}&units=metric`);
        const data = await res.json();
        setWeather(data);
      } finally {
        setLoading(false);
      }
    });
  }, []);

  const getAiRecommendation = async (zone: IrrigationZone) => {
    if (!weather) return;
    setAnalyzing(zone.id);
    try {
      const ai = getAIClient();
      // Added language requirement to prompt
      const prompt = `Provide a precise irrigation recommendation for a zone named "${zone.name}" with "${zone.cropType}" crops and "${zone.soilType}" soil. 
      Local Weather: ${weather.main.temp}°C, Humidity ${weather.main.humidity}%, Condition: ${weather.weather[0].description}. 
      Return a single brief, expert instruction (max 20 words) in ${language}.`;
      
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt
      });
      
      setRecommendations(prev => ({ ...prev, [zone.id]: response.text || "Watering needed." }));
    } catch (err) {
      console.error(err);
    } finally {
      setAnalyzing(null);
    }
  };

  const addZone = () => {
    const soilType = localStorage.getItem('agri_soil_type') || 'Loamy';
    const newZone: IrrigationZone = {
      id: Date.now().toString(),
      name: 'New Zone',
      cropType: 'Corn',
      soilType: soilType
    };
    setZones([...zones, newZone]);
    setActiveZone(newZone);
  };

  const removeZone = (id: string) => {
    if (zones.length <= 1) return;
    setZones(zones.filter(z => z.id !== id));
    if (activeZone?.id === id) setActiveZone(null);
  };

  const updateZone = (updated: IrrigationZone) => {
    setZones(zones.map(z => z.id === updated.id ? updated : z));
    setActiveZone(updated);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="bg-white rounded-[3rem] p-8 shadow-sm border border-stone-200">
        <div className="flex items-center justify-between mb-10">
          <div>
            <h2 className="text-2xl font-black flex items-center gap-3 text-stone-900">
              <Droplets className="text-blue-600 w-6 h-6" />
              Zone Management
            </h2>
            <p className="text-stone-500 text-xs font-bold uppercase tracking-widest mt-1">Multi-Sector Irrigation Control</p>
          </div>
          <button 
            onClick={addZone}
            className="p-3 bg-blue-50 text-blue-600 rounded-2xl border border-blue-100 active:scale-95 transition-all"
          >
            <Plus className="w-6 h-6" />
          </button>
        </div>

        {/* Weather Banner */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-[2rem] p-6 text-white mb-8 flex items-center justify-between relative overflow-hidden shadow-xl shadow-blue-900/10">
           {loading ? <Loader2 className="animate-spin" /> : (
             <>
               <div className="relative z-10">
                 <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Field Conditions</p>
                 <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-black">{Math.round(weather.main.temp)}°C</span>
                    <span className="text-sm font-bold opacity-80">{weather.weather[0].main}</span>
                 </div>
                 <div className="flex gap-4 mt-2">
                    <div className="flex items-center gap-1 text-[10px] font-bold"><Droplets className="w-3 h-3" /> {weather.main.humidity}%</div>
                    <div className="flex items-center gap-1 text-[10px] font-bold"><Wind className="w-3 h-3" /> {Math.round(weather.wind.speed * 3.6)}k</div>
                 </div>
               </div>
               <CloudRain className="w-20 h-20 opacity-10 absolute -right-4 -top-4" />
             </>
           )}
        </div>

        {/* Zones Grid */}
        <div className="space-y-4">
           {zones.map(zone => (
             <div 
               key={zone.id}
               className={`rounded-[2rem] p-6 border transition-all ${activeZone?.id === zone.id ? 'bg-blue-50 border-blue-200 shadow-md ring-2 ring-blue-100' : 'bg-stone-50 border-stone-100'}`}
             >
                <div className="flex items-center justify-between mb-4">
                   <div className="flex items-center gap-4 cursor-pointer" onClick={() => setActiveZone(zone)}>
                      <div className={`p-3 rounded-2xl ${activeZone?.id === zone.id ? 'bg-blue-600 text-white' : 'bg-white text-stone-400 shadow-sm'}`}>
                         <Activity className="w-5 h-5" />
                      </div>
                      <div>
                         <h3 className="font-black text-stone-900 text-sm leading-none">{zone.name}</h3>
                         <div className="flex gap-2 mt-1.5">
                            <span className="text-[8px] font-black uppercase bg-white/60 px-2 py-0.5 rounded text-stone-500 border border-stone-200">{zone.cropType}</span>
                            <span className="text-[8px] font-black uppercase bg-white/60 px-2 py-0.5 rounded text-stone-500 border border-stone-200">{zone.soilType}</span>
                         </div>
                      </div>
                   </div>
                   <div className="flex items-center gap-2">
                      <button 
                        onClick={() => getAiRecommendation(zone)}
                        disabled={analyzing === zone.id}
                        className={`p-2 rounded-xl transition-all ${analyzing === zone.id ? 'bg-white' : 'bg-white text-blue-600 shadow-sm border border-blue-100 hover:bg-blue-600 hover:text-white'}`}
                      >
                         {analyzing === zone.id ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                      </button>
                      <button 
                        onClick={() => removeZone(zone.id)}
                        className="p-2 text-stone-300 hover:text-rose-500 transition-colors"
                      >
                         <Trash2 className="w-4 h-4" />
                      </button>
                   </div>
                </div>

                {recommendations[zone.id] && (
                  <div className="mt-4 bg-white/80 backdrop-blur-md p-4 rounded-2xl border border-blue-100 animate-in slide-in-from-top-2">
                     <p className="text-[9px] font-black text-blue-500 uppercase tracking-widest mb-1 flex items-center gap-2">
                        <CheckCircle2 className="w-3 h-3" /> Gemini Instruction
                     </p>
                     <p className="text-xs font-bold text-blue-900 leading-relaxed italic">
                        "{recommendations[zone.id]}"
                     </p>
                  </div>
                )}
             </div>
           ))}
        </div>
      </div>

      {/* Editor Modal/Drawer */}
      {activeZone && (
        <div className="fixed inset-0 z-[110] bg-black/60 backdrop-blur-sm flex items-end animate-in fade-in duration-300">
           <div className="w-full max-w-md mx-auto bg-white rounded-t-[3rem] p-8 animate-in slide-in-from-bottom-full duration-500 max-h-[85vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-8">
                 <h3 className="text-xl font-black text-stone-900 flex items-center gap-3">
                    <Settings2 className="w-5 h-5 text-blue-600" /> Configure Zone
                 </h3>
                 <button onClick={() => setActiveZone(null)} className="p-2 bg-stone-50 rounded-full">
                    <Trash2 className="w-5 h-5 text-stone-400" />
                 </button>
              </div>

              <div className="space-y-6">
                <div className="space-y-1">
                   <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-2">Zone Name</label>
                   <input 
                    value={activeZone.name}
                    onChange={e => updateZone({...activeZone, name: e.target.value})}
                    className="w-full bg-stone-50 border border-stone-100 p-4 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 font-bold text-sm"
                   />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                     <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-2">Crop Type</label>
                     <div className="relative">
                       <input 
                        value={activeZone.cropType}
                        onChange={e => updateZone({...activeZone, cropType: e.target.value})}
                        className="w-full bg-stone-50 border border-stone-100 p-4 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 font-bold text-xs"
                       />
                       <Sprout className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-300 w-4 h-4" />
                     </div>
                  </div>
                  <div className="space-y-1">
                     <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-2">Soil Matrix</label>
                     <div className="relative">
                       <select 
                        value={activeZone.soilType}
                        onChange={e => updateZone({...activeZone, soilType: e.target.value})}
                        className="w-full bg-stone-50 border border-stone-100 p-4 rounded-2xl outline-none appearance-none font-bold text-xs"
                       >
                          <option>Loamy</option>
                          <option>Clay</option>
                          <option>Sandy</option>
                          <option>Peat</option>
                       </select>
                       <Layers className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-300 w-4 h-4 pointer-events-none" />
                     </div>
                  </div>
                </div>

                <div className="bg-blue-50 p-6 rounded-[2rem] border border-blue-100">
                   <h4 className="text-[9px] font-black text-blue-600 uppercase tracking-widest mb-3">Hydration Summary</h4>
                   <div className="flex items-center justify-between mb-4">
                      <span className="text-xs font-bold text-stone-500">Target Saturation</span>
                      <span className="text-xs font-black text-blue-700">65-70%</span>
                   </div>
                   <div className="h-1.5 w-full bg-blue-100 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-600 w-[68%]" />
                   </div>
                </div>

                <button 
                  onClick={() => setActiveZone(null)}
                  className="w-full bg-stone-900 text-white font-black py-5 rounded-[1.5rem] shadow-xl active:scale-95 transition-all"
                >
                   Finalize Configuration
                </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default IrrigationHub;
