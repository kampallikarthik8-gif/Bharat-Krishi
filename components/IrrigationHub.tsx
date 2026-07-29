
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
import { db, auth } from '../src/firebase';
import { collection, addDoc, deleteDoc, doc, onSnapshot, query, orderBy, updateDoc, serverTimestamp } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../src/utils/firestoreErrorHandler';
import { useFirebase } from '../src/components/FirebaseProvider';

interface IrrigationZone {
  id: string;
  name: string;
  cropType: string;
  soilType: string;
  lastWatered?: string;
  recommendation?: string;
}

const WEATHER_API_KEY = import.meta.env.VITE_WEATHER_API_KEY;

interface IrrigationHubProps {
  language: string;
}

const IrrigationHub: React.FC<IrrigationHubProps> = ({ language }) => {
  const { activeFarmId } = useFirebase();
  const [loading, setLoading] = React.useState(true);
  const [weather, setWeather] = React.useState<any>(null);
  const [zones, setZones] = React.useState<IrrigationZone[]>([]);
  const [activeZone, setActiveZone] = React.useState<IrrigationZone | null>(null);
  const [analyzing, setAnalyzing] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!activeFarmId) return;

    const path = `users/${activeFarmId}/irrigationZones`;
    const q = query(collection(db, path), orderBy('updatedAt', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const zoneData: IrrigationZone[] = [];
      snapshot.forEach((doc) => {
        zoneData.push({ id: doc.id, ...doc.data() } as IrrigationZone);
      });
      setZones(zoneData);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [activeFarmId]);

  React.useEffect(() => {
    navigator.geolocation.getCurrentPosition(async (pos) => {
      try {
        const res = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&appid=${WEATHER_API_KEY}&units=metric`);
        const data = await res.json();
        setWeather(data);
      } catch (err) {
        console.error("Weather fetch failed", err);
      }
    });
  }, []);

  const getAiRecommendation = async (zone: IrrigationZone) => {
    if (!weather || !activeFarmId) return;
    setAnalyzing(zone.id);
    try {
      const ai = getAIClient();
      const prompt = `Provide a precise irrigation recommendation for a zone named "${zone.name}" with "${zone.cropType}" crops and "${zone.soilType}" soil. 
      Local Weather: ${weather.main.temp}°C, Humidity ${weather.main.humidity}%, Condition: ${weather.weather[0].description}. 
      Return a single brief, expert instruction (max 20 words) in ${language}.`;
      
      const response = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: prompt
      });
      
      const recommendation = response.text || "Watering needed.";
      const path = `users/${activeFarmId}/irrigationZones/${zone.id}`;
      await updateDoc(doc(db, path), { 
        recommendation,
        updatedAt: serverTimestamp()
      });
    } catch (err) {
      console.error(err);
    } finally {
      setAnalyzing(null);
    }
  };

  const addZone = async () => {
    if (!activeFarmId) return;
    const soilType = localStorage.getItem('agri_soil_type') || 'Loamy';
    const path = `users/${activeFarmId}/irrigationZones`;
    const newZoneData = {
      name: 'New Zone',
      cropType: 'Corn',
      soilType: soilType,
      updatedAt: serverTimestamp()
    };
    
    try {
      const docRef = await addDoc(collection(db, path), newZoneData);
      setActiveZone({ id: docRef.id, ...newZoneData } as IrrigationZone);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  };

  const removeZone = async (id: string) => {
    if (!activeFarmId) return;
    const path = `users/${activeFarmId}/irrigationZones/${id}`;
    try {
      await deleteDoc(doc(db, path));
      if (activeZone?.id === id) setActiveZone(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  };

  const updateZoneDetails = async (updated: IrrigationZone) => {
    if (!activeFarmId) return;
    const path = `users/${activeFarmId}/irrigationZones/${updated.id}`;
    try {
      const { id, ...data } = updated;
      await updateDoc(doc(db, path), {
        ...data,
        updatedAt: serverTimestamp()
      });
      setActiveZone(updated);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="bg-stone-950 rounded-[3rem] p-8 shadow-sm border border-white/5">
        <div className="flex items-center justify-between mb-10">
          <div>
            <h2 className="text-2xl font-black flex items-center gap-3 text-white">
              <Droplets className="text-amber-500 w-6 h-6" />
              Zone Management
            </h2>
            <p className="text-stone-500 text-xs font-bold uppercase tracking-widest mt-1">Multi-Sector Irrigation Control</p>
          </div>
          <button 
            onClick={addZone}
            className="p-3 bg-amber-500/10 text-amber-500 rounded-2xl border border-amber-500/20 active:scale-95 transition-all"
          >
            <Plus className="w-6 h-6" />
          </button>
        </div>

        {/* Weather Banner */}
        <div className="bg-gradient-to-r from-amber-500 to-amber-700 rounded-[2rem] p-6 text-stone-950 mb-8 flex items-center justify-between relative overflow-hidden shadow-xl shadow-amber-500/10">
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
               className={`rounded-[2rem] p-6 border transition-all ${activeZone?.id === zone.id ? 'bg-amber-500/10 border-amber-500/20 shadow-md ring-2 ring-amber-500/5' : 'bg-stone-900/50 border-white/5'}`}
             >
                <div className="flex items-center justify-between mb-4">
                   <div className="flex items-center gap-4 cursor-pointer" onClick={() => setActiveZone(zone)}>
                      <div className={`p-3 rounded-2xl ${activeZone?.id === zone.id ? 'bg-amber-500 text-stone-950' : 'bg-white/5 text-stone-400 shadow-sm border border-white/5'}`}>
                         <Activity className="w-5 h-5" />
                      </div>
                      <div>
                         <h3 className="font-black text-white text-sm leading-none">{zone.name}</h3>
                         <div className="flex gap-2 mt-1.5">
                            <span className="text-[8px] font-black uppercase bg-white/5 px-2 py-0.5 rounded text-stone-400 border border-white/5">{zone.cropType}</span>
                            <span className="text-[8px] font-black uppercase bg-white/5 px-2 py-0.5 rounded text-stone-400 border border-white/5">{zone.soilType}</span>
                         </div>
                      </div>
                   </div>
                   <div className="flex items-center gap-2">
                      <button 
                        onClick={() => getAiRecommendation(zone)}
                        disabled={analyzing === zone.id}
                        className={`p-2 rounded-xl transition-all ${analyzing === zone.id ? 'bg-white/5' : 'bg-white/5 text-amber-500 shadow-sm border border-white/5 hover:bg-amber-500 hover:text-stone-950'}`}
                      >
                         {analyzing === zone.id ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                      </button>
                      <button 
                        onClick={() => removeZone(zone.id)}
                        className="p-2 text-stone-600 hover:text-rose-500 transition-colors"
                      >
                         <Trash2 className="w-4 h-4" />
                      </button>
                   </div>
                </div>

                {zone.recommendation && (
                  <div className="mt-4 bg-amber-500/5 backdrop-blur-md p-4 rounded-2xl border border-amber-500/10 animate-in slide-in-from-top-2">
                     <p className="text-[9px] font-black text-amber-500 uppercase tracking-widest mb-1 flex items-center gap-2">
                        <CheckCircle2 className="w-3 h-3" /> Gemini Instruction
                     </p>
                     <p className="text-xs font-bold text-amber-100/80 leading-relaxed italic">
                        "{zone.recommendation}"
                     </p>
                  </div>
                )}
             </div>
           ))}
        </div>
      </div>

      {/* Editor Modal/Drawer */}
      {activeZone && (
        <div className="fixed inset-0 z-[110] bg-black/80 backdrop-blur-sm flex items-end animate-in fade-in duration-300">
           <div className="w-full max-w-md mx-auto bg-stone-950 rounded-t-[3rem] p-8 animate-in slide-in-from-bottom-full duration-500 max-h-[85vh] overflow-y-auto border-t border-white/10">
              <div className="flex items-center justify-between mb-8">
                 <h3 className="text-xl font-black text-white flex items-center gap-3">
                    <Settings2 className="w-5 h-5 text-amber-500" /> Configure Zone
                 </h3>
                 <button onClick={() => setActiveZone(null)} className="p-2 bg-white/5 rounded-full">
                    <Trash2 className="w-5 h-5 text-stone-500" />
                 </button>
              </div>

              <div className="space-y-6">
                <div className="space-y-1">
                   <label className="text-[10px] font-black text-stone-500 uppercase tracking-widest ml-2">Zone Name</label>
                   <input 
                    value={activeZone.name}
                    onChange={e => updateZoneDetails({...activeZone, name: e.target.value})}
                    className="w-full bg-black border border-white/10 p-4 rounded-2xl outline-none focus:ring-2 focus:ring-amber-500 font-bold text-sm text-white"
                   />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                     <label className="text-[10px] font-black text-stone-500 uppercase tracking-widest ml-2">Crop Type</label>
                     <div className="relative">
                       <input 
                        value={activeZone.cropType}
                        onChange={e => updateZoneDetails({...activeZone, cropType: e.target.value})}
                        className="w-full bg-black border border-white/10 p-4 rounded-2xl outline-none focus:ring-2 focus:ring-amber-500 font-bold text-xs text-white"
                       />
                       <Sprout className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-600 w-4 h-4" />
                     </div>
                  </div>
                  <div className="space-y-1">
                     <label className="text-[10px] font-black text-stone-500 uppercase tracking-widest ml-2">Soil Matrix</label>
                     <div className="relative">
                       <select 
                        value={activeZone.soilType}
                        onChange={e => updateZoneDetails({...activeZone, soilType: e.target.value})}
                        className="w-full bg-black border border-white/10 p-4 rounded-2xl outline-none appearance-none font-bold text-xs text-white"
                       >
                          <option>Loamy</option>
                          <option>Clay</option>
                          <option>Sandy</option>
                          <option>Peat</option>
                       </select>
                       <Layers className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-600 w-4 h-4 pointer-events-none" />
                     </div>
                  </div>
                </div>

                <div className="bg-amber-500/5 p-6 rounded-[2rem] border border-amber-500/10">
                   <h4 className="text-[9px] font-black text-amber-500 uppercase tracking-widest mb-3">Hydration Summary</h4>
                   <div className="flex items-center justify-between mb-4">
                      <span className="text-xs font-bold text-stone-500">Target Saturation</span>
                      <span className="text-xs font-black text-amber-500">65-70%</span>
                   </div>
                   <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full bg-amber-500 w-[68%]" />
                   </div>
                </div>

                <button 
                  onClick={() => setActiveZone(null)}
                  className="w-full bg-amber-500 text-stone-950 font-black py-5 rounded-[1.5rem] shadow-xl active:scale-95 transition-all shadow-amber-500/20"
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
