import React, { useState, useEffect } from 'react';
import { fetchSprayingAdvice } from '../services/geminiService';
import { 
  Beaker, 
  ShieldAlert, 
  Wind, 
  Droplets, 
  Loader2, 
  Info, 
  CheckCircle2, 
  AlertTriangle, 
  Sunrise, 
  Sunset, 
  Clock, 
  Zap, 
  Ban, 
  Sun, 
  ArrowLeft, 
  Plus, 
  X, 
  Share2, 
  Save, 
  Trash2, 
  Calculator, 
  Thermometer, 
  ShieldCheck, 
  FileText, 
  Bookmark, 
  Compass, 
  RefreshCw, 
  Navigation, 
  MessageCircle, 
  AlertCircle, 
  Sparkles, 
  ChevronRight,
  ClipboardList
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';

import { useFirebase } from '../src/components/FirebaseProvider';
import { useDialogs } from '../src/components/DialogProvider';
import { db } from '../src/firebase';
import { collection, query, onSnapshot, addDoc, deleteDoc, doc, orderBy } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../src/utils/firestoreErrorHandler';
import { showToast } from '../src/utils/toast';

const WEATHER_API_KEY = import.meta.env.VITE_WEATHER_API_KEY;

const COMMON_CROPS = [
  { name: 'Paddy (Rice)', emoji: '🌾' },
  { name: 'Cotton', emoji: '☁️' },
  { name: 'Wheat', emoji: '🌾' },
  { name: 'Sugarcane', emoji: '🎋' },
  { name: 'Chilli / Pepper', emoji: '🌶️' },
  { name: 'Tomato', emoji: '🍅' },
  { name: 'Soybean', emoji: '🫘' },
  { name: 'Mustard', emoji: '🌼' },
  { name: 'Onion', emoji: '🧅' },
  { name: 'Potato', emoji: '🥔' }
];

const COMMON_PESTS = [
  'Bollworm / Caterpillar',
  'Stem Borer',
  'Aphids & Thrips',
  'Whitefly',
  'Fungal Blight / Rust',
  'Weeds (Broadleaf / Grasses)'
];

const POPULAR_CHEMICALS = [
  'Neem Oil (Organic 10000 PPM)',
  'Chlorpyrifos 20% EC',
  'Imidacloprid 17.8% SL',
  'Mancozeb 75% WP',
  'Glyphosate 41% SL (Herbicide)',
  'Cypermethrin 10% EC'
];

interface SprayLog {
  id: string;
  timestamp: string;
  crop: string;
  pest: string;
  chemical: string;
  area: string;
  unit: string;
  tankSize: string;
  tanksNeeded: number;
  totalChemical: string;
  advice: string;
}

interface SprayingAdvisorProps {
  language: string;
  onBack?: () => void;
}

const SprayingAdvisor: React.FC<SprayingAdvisorProps> = ({ language, onBack }) => {
  const { profile, activeFarmId } = useFirebase();
  const { confirm } = useDialogs();

  const [formData, setFormData] = useState({
    crop: 'Cotton',
    pest: 'Bollworm / Caterpillar',
    chemical: 'Neem Oil (Organic 10000 PPM)',
    area: '1',
    unit: 'Acres',
    tankSize: '15',
    volumePerAcre: '150', // liters water per acre
    doseRate: '2' // ml or g per liter
  });

  const [weather, setWeather] = useState<any>(null);
  const [advice, setAdvice] = useState('');
  const [loading, setLoading] = useState(false);
  const [detecting, setDetecting] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Android Navigation Tabs
  const [activeTab, setActiveTab] = useState<'window' | 'calculator' | 'safety' | 'logs'>('window');

  // Firestore Spray Logs state
  const [sprayLogs, setSprayLogs] = useState<SprayLog[]>([]);

  // Clock ticker
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);

  // Fetch Weather
  const detectWeather = () => {
    setDetecting(true);
    if (!navigator.geolocation) {
      showToast('Geolocation not available');
      setDetecting(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const res = await fetch(
            `https://api.openweathermap.org/data/2.5/weather?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&appid=${WEATHER_API_KEY}&units=metric`
          );
          if (!res.ok) throw new Error('Weather fetch failed');
          const data = await res.json();
          setWeather(data);
          showToast(`Weather updated for ${data.name || 'your region'}`);
        } catch (e) {
          console.error("Spraying weather check failed", e);
          showToast('Could not update weather data');
        } finally {
          setDetecting(false);
        }
      },
      () => {
        showToast('Location permission denied');
        setDetecting(false);
      }
    );
  };

  useEffect(() => {
    detectWeather();
  }, []);

  // Sync spray logs from Firestore if farm active
  useEffect(() => {
    if (!activeFarmId) return;

    const path = `users/${activeFarmId}/sprayLogs`;
    const q = query(collection(db, path), orderBy('timestamp', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const logs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as SprayLog[];
      setSprayLogs(logs);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    });

    return () => unsubscribe();
  }, [activeFarmId]);

  // Weather suitability calculations
  const temp = weather?.main?.temp ?? 28;
  const humidity = weather?.main?.humidity ?? 60;
  const windSpeedKmh = Math.round((weather?.wind?.speed || 0) * 3.6);

  // Delta-T calculation approximation:
  // Delta-T = Dry Bulb Temp - Wet Bulb Temp
  // Approximating Delta-T: (Temp in °C) * (1 - (Humidity / 100)) * 0.8
  const estimatedDeltaT = Math.round((temp * (1 - humidity / 100) * 0.85) * 10) / 10;

  const isWindy = windSpeedKmh > 15;
  const isTooHot = temp > 32;
  const isLowHumidity = humidity < 40;
  const currentHour = currentTime.getHours();
  const isMidday = currentHour >= 11 && currentHour <= 16;

  // Delta-T Suitability Rating
  let deltaTRating = 'Ideal Window';
  let deltaTColor = 'text-emerald-400 bg-emerald-950/80 border-emerald-500/40';
  if (estimatedDeltaT < 2) {
    deltaTRating = 'Low Delta-T (Dew Risk)';
    deltaTColor = 'text-amber-400 bg-amber-950/80 border-amber-500/40';
  } else if (estimatedDeltaT >= 2 && estimatedDeltaT <= 8) {
    deltaTRating = 'Optimal Delta-T (2-8°C)';
    deltaTColor = 'text-emerald-400 bg-emerald-950/80 border-emerald-500/40';
  } else if (estimatedDeltaT > 8 && estimatedDeltaT <= 10) {
    deltaTRating = 'Marginal Delta-T';
    deltaTColor = 'text-amber-400 bg-amber-950/80 border-amber-500/40';
  } else {
    deltaTRating = 'High Delta-T (Evaporation Risk)';
    deltaTColor = 'text-rose-400 bg-rose-950/80 border-rose-500/40';
  }

  const isRestricted = isWindy || isTooHot || isMidday || estimatedDeltaT > 10;

  // Tank mix calculations
  const parsedArea = parseFloat(formData.area) || 1;
  const parsedTankSize = parseFloat(formData.tankSize) || 15;
  const parsedVolPerAcre = parseFloat(formData.volumePerAcre) || 150;
  const parsedDoseRate = parseFloat(formData.doseRate) || 2; // ml/L

  const totalWaterLitres = Math.round(parsedArea * parsedVolPerAcre);
  const tanksNeeded = Math.ceil(totalWaterLitres / parsedTankSize);
  const chemicalPerTankMl = Math.round(parsedTankSize * parsedDoseRate);
  const totalChemicalNeededMl = Math.round(totalWaterLitres * parsedDoseRate);

  const handleGenerateAdvice = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!formData.crop || !formData.pest) {
      showToast('Please specify crop and pest/disease');
      return;
    }

    setLoading(true);
    try {
      const res = await fetchSprayingAdvice({
        crop: formData.crop,
        pest: formData.pest,
        chemical: formData.chemical,
        area: `${formData.area} ${formData.unit}`,
        tankSize: `${formData.tankSize} Liters`,
        windSpeed: windSpeedKmh
      }, language);

      setAdvice(res || '');
      setActiveTab('safety');
      showToast('Spraying Safety Brief Generated!');
    } catch (err) {
      console.error(err);
      showToast('Failed to generate spraying advice');
    } finally {
      setLoading(false);
    }
  };

  const saveLogToCloud = async () => {
    if (!activeFarmId) {
      showToast('Sign in or select farm to save log to cloud');
      return;
    }

    const path = `users/${activeFarmId}/sprayLogs`;
    try {
      await addDoc(collection(db, path), {
        timestamp: new Date().toISOString(),
        crop: formData.crop,
        pest: formData.pest,
        chemical: formData.chemical,
        area: `${formData.area} ${formData.unit}`,
        unit: formData.unit,
        tankSize: `${formData.tankSize} L`,
        tanksNeeded,
        totalChemical: `${totalChemicalNeededMl} ml/g`,
        advice: advice || 'Calculated standard dosage protocol.'
      });
      showToast('Spraying operation logged!');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  };

  const deleteLog = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!activeFarmId) return;

    confirm({
      title: 'Delete Spray Log',
      message: 'Are you sure you want to delete this recorded spray log?',
      type: 'danger',
      onConfirm: async () => {
        const path = `users/${activeFarmId}/sprayLogs/${id}`;
        try {
          await deleteDoc(doc(db, path));
          showToast('Log deleted');
        } catch (error) {
          handleFirestoreError(error, OperationType.DELETE, path);
        }
      }
    });
  };

  const sharePlanOnWhatsApp = () => {
    const message = `💦 *Bharat Kisan - Spraying Advisory*%0A%0A` +
      `🌾 *Crop:* ${formData.crop}%0A` +
      `🐛 *Target Pest:* ${formData.pest}%0A` +
      `🧪 *Chemical:* ${formData.chemical}%0A` +
      `📐 *Field Area:* ${formData.area} ${formData.unit}%0A` +
      `🛢️ *Tanks Needed:* ${tanksNeeded} tanks (${formData.tankSize}L capacity)%0A` +
      `💧 *Total Chemical:* ${totalChemicalNeededMl} ml/g in ${totalWaterLitres}L water%0A%0A` +
      `🌡️ *Delta-T Index:* ${estimatedDeltaT}°C (${deltaTRating})%0A` +
      `⚠️ *Window Status:* ${isRestricted ? 'Restricted / Exercise Caution' : 'Safe Spraying Window'}%0A%0A` +
      `📲 *Smart Precision Agriculture via Bharat Kisan*`;

    window.open(`https://wa.me/?text=${message}`, '_blank');
  };

  return (
    <div className="w-full flex flex-col min-h-screen bg-[#070b09] text-stone-100 pb-32 animate-in fade-in duration-300">
      
      {/* Android Top Header Navigation Bar */}
      <header className="px-4 py-3 bg-[#0c1410]/95 backdrop-blur-xl border-b border-stone-800/80 sticky top-0 z-50 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          {onBack && (
            <button 
              onClick={onBack}
              className="p-2.5 rounded-full bg-stone-900 border border-stone-800 text-stone-300 hover:text-white active:scale-90 transition-all min-w-[44px] min-h-[44px] flex items-center justify-center"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div className="p-2 bg-orange-500/20 rounded-xl border border-orange-500/30 text-orange-400">
            <Beaker className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-black text-white tracking-tight leading-none">Spraying Advisor</h1>
            <p className="text-[10px] text-orange-400 font-mono mt-0.5 flex items-center gap-1">
              <span className={`w-1.5 h-1.5 rounded-full ${isRestricted ? 'bg-rose-500' : 'bg-emerald-400'} animate-pulse inline-block`} />
              {isRestricted ? 'Spraying Restricted' : 'Safe Spray Window'}
            </p>
          </div>
        </div>

        <button
          onClick={detectWeather}
          disabled={detecting}
          className="p-2.5 rounded-xl bg-stone-900 border border-stone-800 text-orange-400 hover:text-white active:scale-90 transition-all min-w-[44px] min-h-[44px] flex items-center justify-center"
          title="Refresh Weather GPS"
        >
          {detecting ? <Loader2 className="w-4 h-4 animate-spin text-orange-400" /> : <RefreshCw className="w-4 h-4" />}
        </button>
      </header>

      {/* Android Top Segmented Navigation Tabs */}
      <div className="px-3 py-2 bg-stone-950/80 border-b border-stone-850 sticky top-[57px] z-40 overflow-x-auto no-scrollbar">
        <div className="flex items-center gap-1.5 min-w-max">
          
          <button
            onClick={() => setActiveTab('window')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 min-h-[44px] ${
              activeTab === 'window'
                ? 'bg-orange-500 text-stone-950 shadow-md shadow-orange-950/50'
                : 'bg-stone-900 text-stone-400 hover:text-stone-200 border border-stone-800'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Delta-T & Weather</span>
          </button>

          <button
            onClick={() => setActiveTab('calculator')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 min-h-[44px] ${
              activeTab === 'calculator'
                ? 'bg-orange-500 text-stone-950 shadow-md shadow-orange-950/50'
                : 'bg-stone-900 text-stone-400 hover:text-stone-200 border border-stone-800'
            }`}
          >
            <Calculator className="w-4 h-4" />
            <span>Tank Mix Calculator</span>
          </button>

          <button
            onClick={() => setActiveTab('safety')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 min-h-[44px] ${
              activeTab === 'safety'
                ? 'bg-orange-500 text-stone-950 shadow-md shadow-orange-950/50'
                : 'bg-stone-900 text-stone-400 hover:text-stone-200 border border-stone-800'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>AI Safety Brief</span>
          </button>

          <button
            onClick={() => setActiveTab('logs')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 min-h-[44px] ${
              activeTab === 'logs'
                ? 'bg-orange-500 text-stone-950 shadow-md shadow-orange-950/50'
                : 'bg-stone-900 text-stone-400 hover:text-stone-200 border border-stone-800'
            }`}
          >
            <ClipboardList className="w-4 h-4" />
            <span>Spray Logs ({sprayLogs.length})</span>
          </button>

        </div>
      </div>

      <main className="px-3.5 sm:px-6 mt-4 space-y-5 max-w-3xl mx-auto w-full">

        {/* TAB 1: DELTA-T & WEATHER SPRAY WINDOW */}
        {activeTab === 'window' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            
            {/* Live Weather Conditions Bar */}
            <div className="bg-stone-900/90 border border-stone-800 rounded-2xl p-4 space-y-3 shadow-xl">
              <div className="flex items-center justify-between border-b border-stone-800 pb-2.5">
                <div className="flex items-center gap-2">
                  <Thermometer className="w-4 h-4 text-orange-400" />
                  <h2 className="text-xs font-black uppercase tracking-wider text-white">Live Field Atmospheric Sensor</h2>
                </div>
                <span className="text-[10px] font-mono text-stone-400">
                  {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="bg-stone-950 p-3 rounded-xl border border-stone-850 text-center">
                  <span className="text-[9px] text-stone-500 font-bold uppercase block">Air Temp</span>
                  <span className={`text-base font-black ${isTooHot ? 'text-rose-400' : 'text-stone-100'}`}>{temp}°C</span>
                </div>

                <div className="bg-stone-950 p-3 rounded-xl border border-stone-850 text-center">
                  <span className="text-[9px] text-stone-500 font-bold uppercase block">Humidity</span>
                  <span className={`text-base font-black ${isLowHumidity ? 'text-amber-400' : 'text-stone-100'}`}>{humidity}%</span>
                </div>

                <div className="bg-stone-950 p-3 rounded-xl border border-stone-850 text-center">
                  <span className="text-[9px] text-stone-500 font-bold uppercase block">Wind Speed</span>
                  <span className={`text-base font-black ${isWindy ? 'text-rose-400' : 'text-emerald-400'}`}>{windSpeedKmh} km/h</span>
                </div>
              </div>

              {/* Delta-T Gauge Card */}
              <div className={`p-3.5 rounded-xl border space-y-1.5 ${deltaTColor}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4" />
                    <span className="text-xs font-extrabold uppercase">Delta-T Index: {estimatedDeltaT}°C</span>
                  </div>
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-black/30">
                    {deltaTRating}
                  </span>
                </div>
                <p className="text-[11px] leading-relaxed opacity-90">
                  {estimatedDeltaT < 2 && 'Dew/High humidity present. Droplets may run off foliage or suspend in air inversion layers.'}
                  {estimatedDeltaT >= 2 && estimatedDeltaT <= 8 && 'Ideal evaporation & droplet retention window. Maximum spray efficiency.'}
                  {estimatedDeltaT > 8 && estimatedDeltaT <= 10 && 'Marginal conditions. Increase droplet size or spray during early morning.'}
                  {estimatedDeltaT > 10 && 'High evaporation risk. Fine spray droplets will dry up before hitting target weeds/pests.'}
                </p>
              </div>
            </div>

            {/* Daily Operational Peak Hours */}
            <div className="bg-stone-900/90 border border-stone-800 rounded-2xl p-4 space-y-3">
              <div className="flex items-center gap-2 border-b border-stone-800 pb-2.5">
                <Clock className="w-4 h-4 text-orange-400" />
                <h3 className="text-xs font-black uppercase tracking-wider text-white">Optimal Daily Application Schedule</h3>
              </div>

              <div className="space-y-2">
                <div className="p-3 bg-stone-950 rounded-xl border border-stone-850 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-lg">
                      <Sunrise className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white">Morning Peak Spray Window</h4>
                      <p className="text-[10px] text-stone-400">05:00 AM - 09:00 AM (Cooler temps, minimal drift)</p>
                    </div>
                  </div>
                  {currentHour >= 5 && currentHour <= 9 && !isWindy && (
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-emerald-500 text-stone-950">Active</span>
                  )}
                </div>

                <div className="p-3 bg-stone-950 rounded-xl border border-stone-850 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-lg">
                      <Sunset className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white">Evening Peak Spray Window</h4>
                      <p className="text-[10px] text-stone-400">05:30 PM - 08:00 PM (Low wind, moderate humidity)</p>
                    </div>
                  </div>
                  {currentHour >= 17 && currentHour <= 20 && !isWindy && (
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-emerald-500 text-stone-950">Active</span>
                  )}
                </div>
              </div>
            </div>

            {/* Restricted "No-Spray" Alerts */}
            <div className="bg-stone-900/90 border border-stone-800 rounded-2xl p-4 space-y-3">
              <div className="flex items-center gap-2 border-b border-stone-800 pb-2.5">
                <AlertTriangle className="w-4 h-4 text-rose-400" />
                <h3 className="text-xs font-black uppercase tracking-wider text-rose-400">Restricted "No-Spray" Risk Factors</h3>
              </div>

              <div className="space-y-2">
                <div className={`p-3 rounded-xl border flex items-center justify-between ${isMidday ? 'bg-rose-950/60 border-rose-500/40 text-rose-200' : 'bg-stone-950 border-stone-850 text-stone-500 opacity-60'}`}>
                  <div className="flex items-center gap-2.5">
                    <Sun className="w-4 h-4 text-amber-400" />
                    <div>
                      <h4 className="text-xs font-bold">Midday Solar Heat (11 AM - 4 PM)</h4>
                      <p className="text-[10px] text-stone-400">Stomatal closure in weeds, rapid chemical degradation</p>
                    </div>
                  </div>
                  {isMidday && <span className="text-[9px] font-black uppercase bg-rose-500 text-white px-2 py-0.5 rounded">RESTRICTED</span>}
                </div>

                <div className={`p-3 rounded-xl border flex items-center justify-between ${isWindy ? 'bg-rose-950/60 border-rose-500/40 text-rose-200' : 'bg-stone-950 border-stone-850 text-stone-500 opacity-60'}`}>
                  <div className="flex items-center gap-2.5">
                    <Wind className="w-4 h-4 text-cyan-400" />
                    <div>
                      <h4 className="text-xs font-bold">High Wind Velocity (&gt;15 km/h)</h4>
                      <p className="text-[10px] text-stone-400">Off-target chemical drift onto neighboring crops/water</p>
                    </div>
                  </div>
                  {isWindy && <span className="text-[9px] font-black uppercase bg-rose-500 text-white px-2 py-0.5 rounded">RESTRICTED</span>}
                </div>

                <div className={`p-3 rounded-xl border flex items-center justify-between ${isTooHot ? 'bg-rose-950/60 border-rose-500/40 text-rose-200' : 'bg-stone-950 border-stone-850 text-stone-500 opacity-60'}`}>
                  <div className="flex items-center gap-2.5">
                    <Thermometer className="w-4 h-4 text-rose-400" />
                    <div>
                      <h4 className="text-xs font-bold">Extreme Air Temperature (&gt;32°C)</h4>
                      <p className="text-[10px] text-stone-400">Causes foliar burn and phytotoxicity on young leaves</p>
                    </div>
                  </div>
                  {isTooHot && <span className="text-[9px] font-black uppercase bg-rose-500 text-white px-2 py-0.5 rounded">RESTRICTED</span>}
                </div>
              </div>
            </div>

            {/* Quick Action to Calculator */}
            <button
              onClick={() => setActiveTab('calculator')}
              className="w-full py-3.5 bg-orange-500 text-stone-950 font-black text-xs rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-orange-950/50 active:scale-98 transition-all min-h-[48px]"
            >
              <Calculator className="w-4 h-4" />
              <span>Proceed to Tank Mix & Chemical Calculator</span>
              <ChevronRight className="w-4 h-4" />
            </button>

          </div>
        )}

        {/* TAB 2: TANK MIX CALCULATOR */}
        {activeTab === 'calculator' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            
            <div className="bg-stone-900/90 border border-stone-800 rounded-2xl p-4 space-y-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-stone-800 pb-2.5">
                <div className="flex items-center gap-2">
                  <Calculator className="w-4 h-4 text-orange-400" />
                  <h2 className="text-xs font-black uppercase tracking-wider text-white">Application Parameters & Dosage</h2>
                </div>
                <span className="text-[10px] font-mono text-orange-400 bg-orange-950/80 px-2 py-0.5 rounded border border-orange-500/30">
                  Precision Calculator
                </span>
              </div>

              {/* Crop & Pest Input */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">Target Crop</label>
                  <input
                    type="text"
                    value={formData.crop}
                    onChange={e => setFormData({ ...formData, crop: e.target.value })}
                    placeholder="e.g. Cotton, Paddy, Chilli..."
                    className="w-full bg-stone-950 border border-stone-800 rounded-xl p-3 text-xs text-white font-bold outline-none focus:border-orange-500"
                  />
                  {/* Quick Crop Chips */}
                  <div className="flex gap-1 overflow-x-auto no-scrollbar pt-1">
                    {COMMON_CROPS.slice(0, 5).map(c => (
                      <button
                        key={c.name}
                        type="button"
                        onClick={() => setFormData({ ...formData, crop: c.name })}
                        className="px-2 py-1 bg-stone-950 text-stone-400 border border-stone-800 rounded text-[10px] font-bold whitespace-nowrap hover:text-white"
                      >
                        {c.name}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">Pest / Weed / Disease</label>
                  <input
                    type="text"
                    value={formData.pest}
                    onChange={e => setFormData({ ...formData, pest: e.target.value })}
                    placeholder="e.g. Bollworm, Aphids..."
                    className="w-full bg-stone-950 border border-stone-800 rounded-xl p-3 text-xs text-white font-bold outline-none focus:border-orange-500"
                  />
                  {/* Quick Pest Chips */}
                  <div className="flex gap-1 overflow-x-auto no-scrollbar pt-1">
                    {COMMON_PESTS.slice(0, 3).map(p => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setFormData({ ...formData, pest: p })}
                        className="px-2 py-1 bg-stone-950 text-stone-400 border border-stone-800 rounded text-[10px] font-bold whitespace-nowrap hover:text-white"
                      >
                        {p.split('/')[0]}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Chemical Choice */}
              <div className="space-y-1.5 pt-2 border-t border-stone-850">
                <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">Chemical / Bio-Pesticide Name</label>
                <input
                  type="text"
                  value={formData.chemical}
                  onChange={e => setFormData({ ...formData, chemical: e.target.value })}
                  placeholder="e.g. Neem Oil, Chlorpyrifos..."
                  className="w-full bg-stone-950 border border-stone-800 rounded-xl p-3 text-xs text-white font-bold outline-none focus:border-orange-500"
                />
                <div className="flex gap-1 overflow-x-auto no-scrollbar pt-1">
                  {POPULAR_CHEMICALS.map(ch => (
                    <button
                      key={ch}
                      type="button"
                      onClick={() => setFormData({ ...formData, chemical: ch })}
                      className="px-2 py-1 bg-stone-950 text-stone-400 border border-stone-800 rounded text-[10px] font-bold whitespace-nowrap hover:text-white"
                    >
                      {ch.split(' ')[0]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Field Area & Knapsack Tank Capacity */}
              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-stone-850">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">Field Area ({formData.unit})</label>
                  <input
                    type="number"
                    value={formData.area}
                    onChange={e => setFormData({ ...formData, area: e.target.value })}
                    className="w-full bg-stone-950 border border-stone-800 rounded-xl p-3 text-xs text-white font-bold outline-none focus:border-orange-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">Tank Capacity (Liters)</label>
                  <input
                    type="number"
                    value={formData.tankSize}
                    onChange={e => setFormData({ ...formData, tankSize: e.target.value })}
                    className="w-full bg-stone-950 border border-stone-800 rounded-xl p-3 text-xs text-white font-bold outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              {/* Advanced Dosage Parameters */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">Water Vol / Acre (Liters)</label>
                  <input
                    type="number"
                    value={formData.volumePerAcre}
                    onChange={e => setFormData({ ...formData, volumePerAcre: e.target.value })}
                    className="w-full bg-stone-950 border border-stone-800 rounded-xl p-3 text-xs text-white font-bold outline-none focus:border-orange-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">Dose Rate (ml or g / Liter)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.doseRate}
                    onChange={e => setFormData({ ...formData, doseRate: e.target.value })}
                    className="w-full bg-stone-950 border border-stone-800 rounded-xl p-3 text-xs text-white font-bold outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              {/* Calculated Results Display Card */}
              <div className="p-4 bg-stone-950 rounded-xl border border-stone-800 space-y-3">
                <h3 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2 border-b border-stone-850 pb-2">
                  <Zap className="w-4 h-4 text-orange-400" />
                  Calculated Batch Recipe
                </h3>

                <div className="grid grid-cols-2 gap-2 text-center">
                  <div className="p-3 bg-stone-900 rounded-xl border border-stone-800">
                    <span className="text-[9px] text-stone-400 font-bold uppercase block">Total Water Needed</span>
                    <span className="text-sm font-black text-white">{totalWaterLitres} Liters</span>
                  </div>

                  <div className="p-3 bg-stone-900 rounded-xl border border-stone-800">
                    <span className="text-[9px] text-stone-400 font-bold uppercase block">Knapsack Tanks</span>
                    <span className="text-sm font-black text-orange-400">{tanksNeeded} Tanks</span>
                  </div>

                  <div className="p-3 bg-stone-900 rounded-xl border border-stone-800">
                    <span className="text-[9px] text-stone-400 font-bold uppercase block">Chemical per Tank</span>
                    <span className="text-sm font-black text-emerald-400">{chemicalPerTankMl} ml / g</span>
                  </div>

                  <div className="p-3 bg-stone-900 rounded-xl border border-stone-800">
                    <span className="text-[9px] text-stone-400 font-bold uppercase block">Total Chemical Volume</span>
                    <span className="text-sm font-black text-cyan-400">{totalChemicalNeededMl} ml / g</span>
                  </div>
                </div>
              </div>

              {/* Buttons: AI Generate & Save to Log */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleGenerateAdvice}
                  disabled={loading}
                  className="w-full py-3.5 bg-orange-500 hover:bg-orange-400 text-stone-950 font-black text-xs rounded-xl flex items-center justify-center gap-2 shadow-lg transition-all active:scale-98 min-h-[48px]"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldAlert className="w-4 h-4" />}
                  <span>{loading ? 'Analyzing Safety...' : 'Generate AI Safety Protocol'}</span>
                </button>

                <button
                  type="button"
                  onClick={saveLogToCloud}
                  className="w-full py-3.5 bg-stone-950 border border-stone-800 text-stone-300 hover:text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all active:scale-98 min-h-[48px]"
                >
                  <Save className="w-4 h-4 text-orange-400" />
                  <span>Log Spraying Event</span>
                </button>
              </div>

            </div>

          </div>
        )}

        {/* TAB 3: AI SAFETY BRIEF & PROTOCOL */}
        {activeTab === 'safety' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            
            {/* Header Action Bar */}
            <div className="flex items-center justify-between bg-stone-900/90 p-3 rounded-2xl border border-stone-800">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-orange-400" />
                <span className="text-xs font-bold text-white uppercase tracking-wider">AI Safety & PPE Brief</span>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={sharePlanOnWhatsApp}
                  className="px-3 py-1.5 bg-[#25D366] hover:bg-[#128C7E] text-stone-950 font-black text-[10px] uppercase rounded-xl flex items-center gap-1 shadow-md active:scale-95 transition-all min-h-[36px]"
                >
                  <MessageCircle className="w-3.5 h-3.5 text-stone-950 fill-current" />
                  <span>Share</span>
                </button>

                <button
                  onClick={saveLogToCloud}
                  className="p-2 bg-stone-950 border border-stone-800 text-orange-400 rounded-xl hover:text-white transition-all active:scale-95 min-h-[36px]"
                  title="Save Log"
                >
                  <Save className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Mandatory PPE Checklist Card */}
            <div className="bg-gradient-to-br from-orange-950/60 to-stone-900 border border-orange-500/30 rounded-2xl p-4 space-y-3 shadow-xl">
              <div className="flex items-center gap-2 border-b border-stone-800 pb-2.5">
                <ShieldAlert className="w-4 h-4 text-orange-400" />
                <h3 className="text-xs font-black text-white uppercase tracking-wider">Mandatory Personal Protective Equipment (PPE)</h3>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs font-bold text-stone-300">
                <div className="p-2.5 bg-stone-950/80 rounded-xl border border-stone-850 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>N95 / Respirator Mask</span>
                </div>
                <div className="p-2.5 bg-stone-950/80 rounded-xl border border-stone-850 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Nitrile Rubber Gloves</span>
                </div>
                <div className="p-2.5 bg-stone-950/80 rounded-xl border border-stone-850 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Eye Goggles / Face Shield</span>
                </div>
                <div className="p-2.5 bg-stone-950/80 rounded-xl border border-stone-850 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Long Sleeve Coveralls</span>
                </div>
              </div>
            </div>

            {/* AI Generated Advice Content */}
            {advice ? (
              <div className="bg-stone-900/90 border border-stone-800 rounded-2xl p-4 space-y-3 shadow-xl">
                <div className="flex items-center gap-2 border-b border-stone-800 pb-2.5">
                  <Sparkles className="w-4 h-4 text-orange-400" />
                  <h3 className="text-xs font-black text-white uppercase tracking-wider">
                    Application Protocol for {formData.chemical || formData.crop}
                  </h3>
                </div>

                <div className="text-xs text-stone-300 leading-relaxed font-sans pt-1">
                  <ReactMarkdown>{advice}</ReactMarkdown>
                </div>
              </div>
            ) : (
              <div className="text-center py-10 px-4 bg-stone-900/80 rounded-2xl border border-stone-800 space-y-3">
                <Beaker className="w-8 h-8 text-orange-500 mx-auto animate-pulse" />
                <h3 className="text-xs font-bold text-stone-200">No AI Safety Brief Generated</h3>
                <p className="text-[11px] text-stone-500 max-w-sm mx-auto">
                  Configure crop and target pest in Tank Mix Calculator tab to generate custom chemical application guidelines.
                </p>
                <button
                  onClick={() => setActiveTab('calculator')}
                  className="px-4 py-2.5 bg-orange-500 text-stone-950 rounded-xl font-bold text-xs uppercase tracking-wider active:scale-95 transition-all shadow-md min-h-[44px]"
                >
                  Configure Parameters
                </button>
              </div>
            )}

            {/* KVK Rain-fastness & Drift Note */}
            <div className="bg-stone-900/90 border border-stone-800 rounded-2xl p-4 space-y-2">
              <div className="flex items-center gap-2 border-b border-stone-800 pb-2">
                <Info className="w-4 h-4 text-cyan-400" />
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">KVK Rain-fastness & Drift Advisory</h4>
              </div>
              <p className="text-[11px] text-stone-400 leading-relaxed">
                Ensure at least 2–4 hours of rain-free window after chemical application. Add a non-ionic silicone sticker/spreader agent (0.5 ml/L) to improve droplet retention on waxy foliage.
              </p>
            </div>

          </div>
        )}

        {/* TAB 4: SPRAY LOGS ARCHIVE */}
        {activeTab === 'logs' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="bg-stone-900/90 border border-stone-800 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-stone-800 pb-2.5">
                <div className="flex items-center gap-2">
                  <ClipboardList className="w-4 h-4 text-orange-400" />
                  <h3 className="text-xs font-extrabold text-white uppercase tracking-wider">Recorded Spraying Events</h3>
                </div>
                <span className="text-[10px] font-mono text-orange-400 bg-orange-950 px-2 py-0.5 rounded border border-orange-500/30">
                  {sprayLogs.length} Logged
                </span>
              </div>

              {sprayLogs.length === 0 ? (
                <div className="text-center py-8 px-4 bg-stone-950 rounded-xl border border-stone-850 space-y-2">
                  <FileText className="w-8 h-8 text-stone-600 mx-auto" />
                  <h4 className="text-xs font-bold text-stone-300">No recorded spray events</h4>
                  <p className="text-[11px] text-stone-500">
                    Use the Tank Mix Calculator and tap Log Spraying Event to record chemical applications.
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {sprayLogs.map(item => (
                    <div
                      key={item.id}
                      className="bg-stone-950 p-3.5 rounded-xl border border-stone-850 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-xs font-bold text-white">🧪 {item.chemical}</h4>
                          <span className="text-[10px] font-mono text-stone-500">{new Date(item.timestamp).toLocaleString()}</span>
                        </div>
                        <button
                          onClick={(e) => deleteLog(item.id, e)}
                          className="p-2 text-stone-500 hover:text-rose-400 transition-colors rounded-lg hover:bg-stone-900"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-[11px] text-stone-400 pt-1 border-t border-stone-900">
                        <div><span className="text-stone-500">Crop:</span> <strong className="text-stone-200">{item.crop}</strong></div>
                        <div><span className="text-stone-500">Pest:</span> <strong className="text-stone-200">{item.pest}</strong></div>
                        <div><span className="text-stone-500">Area:</span> <strong className="text-orange-400">{item.area}</strong></div>
                        <div><span className="text-stone-500">Tanks:</span> <strong className="text-emerald-400">{item.tanksNeeded} tanks</strong></div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

      </main>

    </div>
  );
};

export default SprayingAdvisor;
