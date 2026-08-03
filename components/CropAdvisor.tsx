import React, { useState, useEffect, useRef } from 'react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import html2canvas from 'html2canvas';
import { getCropAdvice, getFertilizerAdvice } from '../services/geminiService';
import { FertilizerPlan } from '../types';
import { 
  Lightbulb, 
  Loader2, 
  MapPin, 
  Database, 
  Beaker, 
  CheckCircle2, 
  Zap, 
  Leaf, 
  Droplets, 
  FlaskConical, 
  Sprout, 
  Clock, 
  CalendarCheck, 
  Download, 
  Languages as LangIcon, 
  Archive, 
  Trash2, 
  ChevronRight, 
  History, 
  FileText, 
  Target, 
  Atom, 
  Navigation,
  Sparkles,
  ShieldCheck,
  TrendingUp,
  ClipboardList,
  AlertCircle,
  Sun,
  Wind,
  MessageCircle,
  Info,
  ArrowLeft,
  Compass,
  Bookmark,
  Share2,
  Check,
  RefreshCw
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';

import { useFirebase } from '../src/components/FirebaseProvider';
import { useDialogs } from '../src/components/DialogProvider';
import { db } from '../src/firebase';
import { collection, query, onSnapshot, addDoc, deleteDoc, doc, orderBy } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../src/utils/firestoreErrorHandler';
import { showToast } from '../src/utils/toast';

const WEATHER_API_KEY = import.meta.env.VITE_WEATHER_API_KEY;

const INDIAN_CROPS = [
  { name: 'Paddy (Rice)', emoji: '🌾' },
  { name: 'Wheat', emoji: '🌾' },
  { name: 'Sugarcane', emoji: '🎋' },
  { name: 'Cotton', emoji: '☁️' },
  { name: 'Mustard', emoji: '🌼' },
  { name: 'Bajra', emoji: '🌾' },
  { name: 'Moong Dal', emoji: '🌱' },
  { name: 'Tomato', emoji: '🍅' },
  { name: 'Onion', emoji: '🧅' },
  { name: 'Potato', emoji: '🥔' },
  { name: 'Maize', emoji: '🌽' },
  { name: 'Soybean', emoji: '🫘' }
];

const SOIL_TYPES = [
  { id: 'Alluvial', name: 'Alluvial Soil', desc: 'High fertility, indoor plains' },
  { id: 'Black Cotton', name: 'Black Cotton', desc: 'Clay rich, retains moisture' },
  { id: 'Red/Yellow', name: 'Red / Yellow Soil', desc: 'Iron rich, porous loam' },
  { id: 'Laterite', name: 'Laterite Soil', desc: 'Weathered acidic soil' },
  { id: 'Desert/Sandy', name: 'Desert / Sandy', desc: 'Light texture loamy' }
];

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
  { name: "Punjabi", label: "Punjabi (ਪੰਜਾਬੀ)" },
  { name: "Odia", label: "Odia (ଓଡ଼ିଆ)" },
  { name: "Assamese", label: "Assamese (ଅସମୀୟା)" },
  { name: "Urdu", label: "Urdu (اردو)" }
];

interface SavedStrategy {
  id: string;
  timestamp: string;
  crop: string;
  location: string;
  soil: string;
  advice: string;
  fertilizerPlan: FertilizerPlan;
}

interface CropAdvisorProps {
  language: string;
  onBack?: () => void;
}

const CropAdvisor: React.FC<CropAdvisorProps> = ({ language: initialLanguage, onBack }) => {
  const { profile, activeFarmId } = useFirebase();
  const { confirm } = useDialogs();

  const [formData, setFormData] = useState({
    crop: 'Paddy (Rice)',
    location: profile?.location || localStorage.getItem('agri_farm_location') || 'Punjab, India',
    soil: profile?.soilType || localStorage.getItem('agri_soil_type') || 'Alluvial'
  });

  useEffect(() => {
    if (profile) {
      setFormData(prev => ({
        ...prev,
        location: prev.location || profile.location || '',
        soil: prev.soil || profile.soilType || ''
      }));
    }
  }, [profile]);

  const [language, setLanguage] = useState(initialLanguage);
  const [advice, setAdvice] = useState('');
  const [fertilizerPlan, setFertilizerPlan] = useState<FertilizerPlan | null>(null);
  const [weatherData, setWeatherData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [detecting, setDetecting] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved'>('idle');

  // Android Navigation Tabs
  const [activeTab, setActiveTab] = useState<'planner' | 'strategy' | 'nutrients' | 'saved'>('planner');
  
  const [savedStrategies, setSavedStrategies] = useState<SavedStrategy[]>([]);
  const reportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!activeFarmId) return;

    const path = `users/${activeFarmId}/cropStrategies`;
    const q = query(collection(db, path), orderBy('timestamp', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const strategies = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as SavedStrategy[];
      setSavedStrategies(strategies);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    });

    return () => unsubscribe();
  }, [activeFarmId]);

  const detectLocation = () => {
    setDetecting(true);
    if (!navigator.geolocation) {
      showToast('Geolocation not supported');
      setDetecting(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const res = await fetch(
            `https://api.openweathermap.org/data/2.5/weather?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&appid=${WEATHER_API_KEY}&units=metric`
          );
          if (!res.ok) throw new Error('Location fetch failed');
          const data = await res.json();
          const region = data.name ? `${data.name}, ${data.sys?.country || 'India'}` : 'Current Region';
          setFormData(prev => ({ ...prev, location: region }));
          setWeatherData(data);
          showToast(`Location set to ${region}`);
        } catch (err) {
          console.error(err);
          showToast('Could not resolve location');
        } finally {
          setDetecting(false);
        }
      },
      () => {
        showToast('Location access denied');
        setDetecting(false);
      }
    );
  };

  const handleFetchAdvice = async (targetLanguage: string) => {
    if (!formData.crop) {
      showToast('Please select a target crop');
      return;
    }
    setLoading(true);
    setSaveStatus('idle');
    const weatherContext = weatherData ? 
      `${weatherData.main?.temp}°C, Humidity: ${weatherData.main?.humidity}%, ${weatherData.weather?.[0]?.description}` : 
      '';
    try {
      const [adviceRes, fertRes] = await Promise.all([
        getCropAdvice(formData.crop, formData.location, formData.soil, targetLanguage, weatherContext),
        getFertilizerAdvice(formData.crop, formData.location, formData.soil, targetLanguage, weatherContext)
      ]);
      setAdvice(adviceRes || '');
      setFertilizerPlan(fertRes);
      setActiveTab('strategy');
      showToast('Crop Strategy & Fertilizer Plan Ready!');
    } catch (err) {
      console.error(err);
      showToast('Failed to generate crop strategy');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleFetchAdvice(language);
  };

  const onLanguageChange = (newLang: string) => {
    setLanguage(newLang);
    if (advice) {
      handleFetchAdvice(newLang);
    }
  };

  const saveToArchive = async () => {
    if (!advice || !fertilizerPlan || !activeFarmId) {
      showToast('Sign in or select farm to save to cloud');
      return;
    }
    
    const path = `users/${activeFarmId}/cropStrategies`;
    try {
      await addDoc(collection(db, path), {
        timestamp: new Date().toISOString(),
        crop: formData.crop,
        location: formData.location,
        soil: formData.soil,
        advice,
        fertilizerPlan
      });
      setSaveStatus('saved');
      showToast('Strategy archived to farm cloud!');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  };

  const deleteArchived = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!activeFarmId) return;
    
    confirm({
      title: 'Delete Strategy',
      message: 'Are you sure you want to remove this archived strategy?',
      type: 'danger',
      onConfirm: async () => {
        const path = `users/${activeFarmId}/cropStrategies/${id}`;
        try {
          await deleteDoc(doc(db, path));
          showToast('Strategy deleted');
        } catch (error) {
          handleFirestoreError(error, OperationType.DELETE, path);
        }
      }
    });
  };

  const loadArchived = (strategy: SavedStrategy) => {
    setFormData({
      crop: strategy.crop,
      location: strategy.location,
      soil: strategy.soil
    });
    setAdvice(strategy.advice);
    setFertilizerPlan(strategy.fertilizerPlan);
    setActiveTab('strategy');
  };

  const shareOnWhatsApp = () => {
    if (!advice) return;
    
    const farmName = profile?.farmName || localStorage.getItem('agri_farm_name') || 'Bharat Kisan Farm';
    const message = `🌾 *Bharat Kisan - Crop Precision Strategy*%0A%0A` +
      `🏡 *Farm:* ${farmName}%0A` +
      `🌱 *Target Crop:* ${formData.crop}%0A` +
      `📍 *Location:* ${formData.location}%0A` +
      `🧪 *Soil Profile:* ${formData.soil}%0A%0A` +
      `💡 *Agronomy Guidance:*%0A${advice.substring(0, 220)}...%0A%0A` +
      `📲 *Optimized via Bharat Kisan App*`;
    
    window.open(`https://wa.me/?text=${message}`, '_blank');
  };

  const downloadReport = async () => {
    if (!advice || !reportRef.current) return;

    try {
      showToast('Generating PDF Document...');
      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210;
      const pageHeight = 297;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`BharatKisan_CropStrategy_${formData.crop.replace(/\s+/g, '_')}.pdf`);
      showToast('PDF Document Exported!');
    } catch (error) {
      console.error('Error generating PDF:', error);
      showToast('PDF export failed');
    }
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
          <div className="p-2 bg-amber-500/20 rounded-xl border border-amber-500/30 text-amber-400">
            <Lightbulb className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-black text-white tracking-tight leading-none">Crop Advisor</h1>
            <p className="text-[10px] text-amber-400 font-mono mt-0.5 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse inline-block" />
              Agronomy & Fertilizer Protocol
            </p>
          </div>
        </div>

        <button
          onClick={detectLocation}
          disabled={detecting}
          className="p-2.5 rounded-xl bg-stone-900 border border-stone-800 text-amber-400 hover:text-white active:scale-90 transition-all min-w-[44px] min-h-[44px] flex items-center justify-center"
          title="Detect GPS"
        >
          {detecting ? <Loader2 className="w-4 h-4 animate-spin text-amber-400" /> : <Navigation className="w-4 h-4" />}
        </button>
      </header>

      {/* Android Top Segmented Navigation Tabs */}
      <div className="px-3 py-2 bg-stone-950/80 border-b border-stone-850 sticky top-[57px] z-40 overflow-x-auto no-scrollbar">
        <div className="flex items-center gap-1.5 min-w-max">
          
          <button
            onClick={() => setActiveTab('planner')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 min-h-[44px] ${
              activeTab === 'planner'
                ? 'bg-amber-500 text-stone-950 shadow-md shadow-amber-950/50'
                : 'bg-stone-900 text-stone-400 hover:text-stone-200 border border-stone-800'
            }`}
          >
            <Compass className="w-4 h-4" />
            <span>Field Parameters</span>
          </button>

          <button
            onClick={() => setActiveTab('strategy')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 min-h-[44px] ${
              activeTab === 'strategy'
                ? 'bg-amber-500 text-stone-950 shadow-md shadow-amber-950/50'
                : 'bg-stone-900 text-stone-400 hover:text-stone-200 border border-stone-800'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>AI Crop Strategy</span>
          </button>

          <button
            onClick={() => setActiveTab('nutrients')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 min-h-[44px] ${
              activeTab === 'nutrients'
                ? 'bg-amber-500 text-stone-950 shadow-md shadow-amber-950/50'
                : 'bg-stone-900 text-stone-400 hover:text-stone-200 border border-stone-800'
            }`}
          >
            <Beaker className="w-4 h-4" />
            <span>Fertilizers & Schedule</span>
          </button>

          <button
            onClick={() => setActiveTab('saved')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 min-h-[44px] ${
              activeTab === 'saved'
                ? 'bg-amber-500 text-stone-950 shadow-md shadow-amber-950/50'
                : 'bg-stone-900 text-stone-400 hover:text-stone-200 border border-stone-800'
            }`}
          >
            <Bookmark className="w-4 h-4" />
            <span>Archives ({savedStrategies.length})</span>
          </button>

        </div>
      </div>

      <main className="px-3.5 sm:px-6 mt-4 space-y-5 max-w-3xl mx-auto w-full">

        {/* TAB 1: FIELD PARAMETERS FORM */}
        {activeTab === 'planner' && (
          <form onSubmit={handleSubmit} className="space-y-4 animate-in fade-in duration-200">
            
            <div className="bg-stone-900/90 border border-stone-800 rounded-2xl p-4 space-y-4 shadow-xl">
              
              <div className="flex items-center justify-between border-b border-stone-800 pb-2.5">
                <div className="flex items-center gap-2">
                  <Sprout className="w-4 h-4 text-amber-400" />
                  <h2 className="text-xs font-black uppercase tracking-wider text-white">Target Crop & Location</h2>
                </div>
                <span className="text-[10px] font-mono text-amber-400 bg-amber-950/80 px-2 py-0.5 rounded border border-amber-500/30">
                  Precision Engine
                </span>
              </div>

              {/* Crop Input & Fast Selection Chips */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">Target Crop Name</label>
                <div className="relative">
                  <input
                    type="text"
                    value={formData.crop}
                    onChange={e => setFormData({ ...formData, crop: e.target.value })}
                    placeholder="e.g. Paddy, Wheat, Cotton..."
                    className="w-full bg-stone-950 border border-stone-800 rounded-xl p-3 pl-9 text-xs text-white font-bold outline-none focus:border-amber-500"
                  />
                  <Database className="w-4 h-4 text-amber-400 absolute left-3 top-1/2 -translate-y-1/2" />
                </div>

                {/* Popular Crops Quick Chips */}
                <div className="space-y-1.5 pt-1">
                  <span className="text-[10px] text-stone-500 font-bold uppercase tracking-wider block">Quick Choose Crop:</span>
                  <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1">
                    {INDIAN_CROPS.map(c => (
                      <button
                        key={c.name}
                        type="button"
                        onClick={() => setFormData({ ...formData, crop: c.name })}
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1 border ${
                          formData.crop === c.name
                            ? 'bg-amber-500 text-stone-950 border-amber-400 shadow-md'
                            : 'bg-stone-950 text-stone-300 border-stone-800 hover:border-amber-500/40'
                        }`}
                      >
                        <span>{c.emoji}</span>
                        <span>{c.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* District / Location */}
              <div className="space-y-1.5 pt-2 border-t border-stone-850">
                <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">District / State</label>
                <div className="relative flex items-center gap-1.5">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={formData.location}
                      onChange={e => setFormData({ ...formData, location: e.target.value })}
                      placeholder="e.g. Punjab, Indore, Nashik..."
                      className="w-full bg-stone-950 border border-stone-800 rounded-xl p-3 pl-9 text-xs text-white outline-none focus:border-amber-500 font-bold"
                    />
                    <MapPin className="w-4 h-4 text-amber-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  </div>
                  <button
                    type="button"
                    onClick={detectLocation}
                    disabled={detecting}
                    className="p-3 bg-stone-950 border border-stone-800 rounded-xl text-amber-400 active:scale-90 transition-all hover:bg-stone-850 shrink-0 min-w-[44px] min-h-[44px] flex items-center justify-center"
                    title="Detect GPS"
                  >
                    {detecting ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                  </button>
                </div>

                {/* Live Weather Strip */}
                {weatherData && (
                  <div className="flex items-center gap-3 mt-2 px-3 py-2 bg-stone-950 rounded-xl border border-stone-800">
                    <div className="flex items-center gap-1.5 text-amber-400 text-xs font-bold">
                      <Sun className="w-3.5 h-3.5" />
                      <span>{weatherData.main?.temp}°C</span>
                    </div>
                    <span className="text-stone-700">•</span>
                    <div className="flex items-center gap-1.5 text-blue-400 text-xs font-bold">
                      <Droplets className="w-3.5 h-3.5" />
                      <span>{weatherData.main?.humidity}% Humidity</span>
                    </div>
                    <span className="text-stone-700">•</span>
                    <div className="flex items-center gap-1.5 text-stone-400 text-xs font-bold">
                      <Wind className="w-3.5 h-3.5" />
                      <span>{Math.round((weatherData.wind?.speed || 0) * 3.6)} km/h</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Soil Composition Selection */}
              <div className="space-y-2 pt-2 border-t border-stone-850">
                <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">Soil Health Profile</label>
                <div className="grid grid-cols-1 gap-2">
                  {SOIL_TYPES.map(s => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setFormData({ ...formData, soil: s.id })}
                      className={`p-3 rounded-xl border text-left transition-all flex items-center justify-between active:scale-98 min-h-[48px] ${
                        formData.soil === s.id
                          ? 'bg-amber-950/80 border-amber-500 text-white shadow-md'
                          : 'bg-stone-950 border-stone-850 text-stone-400 hover:text-stone-200'
                      }`}
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <FlaskConical className={`w-3.5 h-3.5 ${formData.soil === s.id ? 'text-amber-400' : 'text-stone-500'}`} />
                          <span className="text-xs font-bold">{s.name}</span>
                        </div>
                        <p className="text-[10px] text-stone-400 font-sans">{s.desc}</p>
                      </div>
                      {formData.soil === s.id && <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0 ml-2" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Vernacular Language Choice */}
              <div className="space-y-1.5 pt-2 border-t border-stone-850">
                <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">Response Language</label>
                <div className="relative">
                  <select
                    value={language}
                    onChange={e => onLanguageChange(e.target.value)}
                    className="w-full bg-stone-950 border border-stone-800 rounded-xl p-3 pl-9 text-xs text-white font-bold outline-none focus:border-amber-500 appearance-none"
                  >
                    {LANGUAGES.map(l => (
                      <option key={l.name} value={l.name} className="bg-stone-900">{l.label}</option>
                    ))}
                  </select>
                  <LangIcon className="w-4 h-4 text-amber-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              {/* CTA Button */}
              <button
                type="submit"
                disabled={loading || !formData.crop}
                className="w-full py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-950/50 transition-all active:scale-98 disabled:opacity-50 min-h-[48px]"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4 text-stone-950 fill-current" />}
                <span>{loading ? 'Analyzing Soil & Crop Parameters...' : 'Generate Agronomy Protocol'}</span>
              </button>

            </div>

          </form>
        )}

        {/* LOADING OVERLAY */}
        {loading && (
          <div className="py-12 bg-stone-900/60 rounded-2xl border border-stone-800 text-center space-y-3">
            <div className="relative w-12 h-12 mx-auto">
              <div className="w-12 h-12 border-4 border-stone-800 border-t-amber-500 rounded-full animate-spin" />
              <Lightbulb className="w-5 h-5 text-amber-500 absolute inset-0 m-auto animate-pulse" />
            </div>
            <p className="text-xs font-bold text-stone-200">Calculating NPK Ratio & Fertilizer Deployment Schedule...</p>
            <p className="text-[10px] text-stone-500 font-mono">Tailoring protocol for {formData.crop} in {formData.location}</p>
          </div>
        )}

        {/* TAB 2: AI STRATEGY */}
        {!loading && activeTab === 'strategy' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            {advice ? (
              <div className="space-y-4">
                
                {/* Header Action Bar */}
                <div className="flex items-center justify-between bg-stone-900/90 p-3 rounded-2xl border border-stone-800">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-bold text-white uppercase tracking-wider">{formData.crop} Strategy</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={shareOnWhatsApp}
                      className="px-3 py-1.5 bg-[#25D366] hover:bg-[#128C7E] text-stone-950 font-black text-[10px] uppercase rounded-xl flex items-center gap-1 shadow-md active:scale-95 transition-all min-h-[36px]"
                    >
                      <MessageCircle className="w-3.5 h-3.5 text-stone-950 fill-current" />
                      <span>Share</span>
                    </button>

                    <button
                      onClick={downloadReport}
                      className="p-2 bg-stone-950 border border-stone-800 text-amber-400 rounded-xl hover:text-white transition-all active:scale-95 min-h-[36px]"
                      title="Export PDF"
                    >
                      <Download className="w-4 h-4" />
                    </button>

                    <button
                      onClick={saveToArchive}
                      disabled={saveStatus === 'saved'}
                      className={`p-2 rounded-xl border text-xs font-bold flex items-center gap-1 transition-all active:scale-95 min-h-[36px] ${
                        saveStatus === 'saved'
                          ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                          : 'bg-stone-950 border-stone-800 text-stone-300 hover:text-white'
                      }`}
                      title="Archive Strategy"
                    >
                      <Archive className="w-4 h-4 text-amber-400" />
                    </button>
                  </div>
                </div>

                {/* Strategic Audit Markdown */}
                <div className="bg-gradient-to-br from-stone-900 via-stone-900 to-amber-950/40 border border-amber-500/30 rounded-2xl p-4 space-y-3 shadow-xl">
                  
                  <div className="flex items-center justify-between border-b border-stone-800 pb-2.5">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-amber-400" />
                      <h3 className="text-xs font-black text-white uppercase tracking-wider">Agronomic Guidance</h3>
                    </div>
                    <span className="text-[10px] font-mono text-amber-400 bg-amber-950 px-2 py-0.5 rounded border border-amber-500/30">
                      {formData.soil} Soil
                    </span>
                  </div>

                  <div className="text-xs text-stone-300 leading-relaxed font-sans pt-1">
                    <ReactMarkdown>{advice}</ReactMarkdown>
                  </div>
                </div>

                {/* Quick Button to Switch to Fertilizers Tab */}
                {fertilizerPlan && (
                  <button
                    onClick={() => setActiveTab('nutrients')}
                    className="w-full py-3 bg-stone-900 hover:bg-stone-850 border border-stone-800 text-amber-400 font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all active:scale-98 min-h-[44px]"
                  >
                    <Beaker className="w-4 h-4" />
                    <span>View Fertilizer Plan & Deployment Timeline</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                )}

              </div>
            ) : (
              <div className="text-center py-12 px-4 bg-stone-900/80 rounded-2xl border border-stone-800 space-y-3">
                <Lightbulb className="w-8 h-8 text-amber-500 mx-auto animate-pulse" />
                <h3 className="text-xs font-bold text-stone-200">No Crop Strategy Active</h3>
                <p className="text-[11px] text-stone-500 max-w-sm mx-auto">
                  Select your crop and location under Field Parameters tab to generate an expert agronomic protocol.
                </p>
                <button
                  onClick={() => setActiveTab('planner')}
                  className="px-4 py-2.5 bg-amber-500 text-stone-950 rounded-xl font-bold text-xs uppercase tracking-wider active:scale-95 transition-all shadow-md min-h-[44px]"
                >
                  Configure Parameters
                </button>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: FERTILIZERS & SCHEDULE */}
        {!loading && activeTab === 'nutrients' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            {fertilizerPlan ? (
              <div className="space-y-4">
                
                {/* Requirements & Adjustments Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div className="bg-stone-900 p-3.5 rounded-2xl border border-stone-800 space-y-1">
                    <div className="flex items-center gap-2 text-amber-400">
                      <Target className="w-4 h-4" />
                      <span className="text-[10px] font-bold uppercase tracking-wider">Crop Requirements</span>
                    </div>
                    <p className="text-xs text-stone-200 font-bold leading-snug">{fertilizerPlan.cropRequirements}</p>
                  </div>

                  <div className="bg-stone-900 p-3.5 rounded-2xl border border-stone-800 space-y-1">
                    <div className="flex items-center gap-2 text-stone-400">
                      <Atom className="w-4 h-4" />
                      <span className="text-[10px] font-bold uppercase tracking-wider">Soil Adjustments</span>
                    </div>
                    <p className="text-xs text-stone-300 font-bold leading-snug">{fertilizerPlan.soilAdjustments}</p>
                  </div>
                </div>

                {/* Recommended Fertilizers List */}
                <div className="bg-stone-900/90 border border-stone-800 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center gap-2 border-b border-stone-800 pb-2.5">
                    <Beaker className="w-4 h-4 text-amber-400" />
                    <h3 className="text-xs font-black text-white uppercase tracking-wider">Recommended Fertilizer Inventory</h3>
                  </div>

                  <div className="space-y-2.5">
                    {fertilizerPlan.fertilizers.map((f, i) => (
                      <div key={i} className="bg-stone-950 p-3.5 rounded-xl border border-stone-850 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {f.isOrganic ? <Leaf className="w-4 h-4 text-emerald-400" /> : <Zap className="w-4 h-4 text-amber-400" />}
                            <span className="text-xs font-bold text-white">{f.name}</span>
                          </div>
                          <span className="text-[10px] font-mono font-bold text-amber-400 bg-amber-950 px-2 py-0.5 rounded border border-amber-500/30">
                            NPK {f.npk}
                          </span>
                        </div>
                        <p className="text-[11px] text-stone-400 italic">"{f.description}"</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Deployment Timeline */}
                <div className="bg-stone-900/90 border border-stone-800 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center gap-2 border-b border-stone-800 pb-2.5">
                    <CalendarCheck className="w-4 h-4 text-amber-400" />
                    <h3 className="text-xs font-black text-white uppercase tracking-wider">Application Schedule</h3>
                  </div>

                  <div className="space-y-2.5">
                    {fertilizerPlan.schedule.map((s, i) => (
                      <div key={i} className="bg-stone-950 p-3.5 rounded-xl border border-stone-850 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 font-mono text-[10px] font-black flex items-center justify-center border border-amber-500/30">
                              {i + 1}
                            </span>
                            <span className="text-xs font-bold text-white">{s.stage}</span>
                          </div>
                          <span className="text-[10px] text-stone-400 font-mono">{s.timing}</span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 pt-1 border-t border-stone-900 text-[11px]">
                          <div className="bg-stone-900 p-2 rounded-lg">
                            <span className="text-[9px] text-stone-500 uppercase font-bold block">Dosage</span>
                            <span className="text-stone-200 font-bold">{s.dosage}</span>
                          </div>
                          <div className="bg-stone-900 p-2 rounded-lg">
                            <span className="text-[9px] text-stone-500 uppercase font-bold block">Method</span>
                            <span className="text-stone-200 font-bold">{s.method}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Micronutrients & Expert Directives */}
                {fertilizerPlan.micronutrients && fertilizerPlan.micronutrients.length > 0 && (
                  <div className="bg-stone-900/90 border border-stone-800 rounded-2xl p-4 space-y-2">
                    <div className="flex items-center gap-2 border-b border-stone-800 pb-2">
                      <Sparkles className="w-4 h-4 text-amber-400" />
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider">Essential Micronutrients</h4>
                    </div>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {fertilizerPlan.micronutrients.map((m, i) => (
                        <span key={i} className="px-2.5 py-1 bg-amber-950 text-amber-300 text-xs font-bold rounded-lg border border-amber-500/30">
                          ✨ {m}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

              </div>
            ) : (
              <div className="text-center py-12 px-4 bg-stone-900/80 rounded-2xl border border-stone-800 space-y-3">
                <Beaker className="w-8 h-8 text-amber-500 mx-auto animate-pulse" />
                <h3 className="text-xs font-bold text-stone-200">No Fertilizer Schedule Available</h3>
                <p className="text-[11px] text-stone-500 max-w-sm mx-auto">
                  Run a crop strategy report to view custom fertilizer dosage, NPK ratios, and deployment timing.
                </p>
                <button
                  onClick={() => setActiveTab('planner')}
                  className="px-4 py-2.5 bg-amber-500 text-stone-950 rounded-xl font-bold text-xs uppercase tracking-wider active:scale-95 transition-all shadow-md min-h-[44px]"
                >
                  Configure Parameters
                </button>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: SAVED ARCHIVES */}
        {activeTab === 'saved' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="bg-stone-900/90 border border-stone-800 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-stone-800 pb-2.5">
                <div className="flex items-center gap-2">
                  <Bookmark className="w-4 h-4 text-amber-400" />
                  <h3 className="text-xs font-extrabold text-white uppercase tracking-wider">Cloud Strategy Archives</h3>
                </div>
                <span className="text-[10px] font-mono text-amber-400 bg-amber-950 px-2 py-0.5 rounded border border-amber-500/30">
                  {savedStrategies.length} Archived
                </span>
              </div>

              {savedStrategies.length === 0 ? (
                <div className="text-center py-8 px-4 bg-stone-950 rounded-xl border border-stone-850 space-y-2">
                  <FileText className="w-8 h-8 text-stone-600 mx-auto" />
                  <h4 className="text-xs font-bold text-stone-300">No archived strategies yet</h4>
                  <p className="text-[11px] text-stone-500">
                    Generate an agronomy protocol and tap Archive to store reports securely in your farm account.
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {savedStrategies.map(item => (
                    <div
                      key={item.id}
                      onClick={() => loadArchived(item)}
                      className="bg-stone-950 p-3.5 rounded-xl border border-stone-850 hover:border-amber-500/40 space-y-2 cursor-pointer group transition-all"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-xs font-bold text-white group-hover:text-amber-300">🌱 {item.crop}</h4>
                          <span className="text-[10px] font-mono text-stone-500">{new Date(item.timestamp).toLocaleDateString()}</span>
                        </div>
                        <button
                          onClick={(e) => deleteArchived(item.id, e)}
                          className="p-2 text-stone-500 hover:text-rose-400 transition-colors rounded-lg hover:bg-stone-900"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="flex items-center gap-2 text-[11px] text-stone-400 pt-1 border-t border-stone-900">
                        <span>📍 {item.location}</span>
                        <span>•</span>
                        <span className="text-amber-400 font-bold">{item.soil} Soil</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

      </main>

      {/* Hidden Report Template for PDF Generation */}
      <div 
        ref={reportRef}
        style={{ 
          position: 'absolute', 
          left: '-9999px', 
          top: '-9999px', 
          width: '800px', 
          backgroundColor: 'white',
          padding: '40px',
          color: '#1c1917',
          fontFamily: 'sans-serif'
        }}
      >
        <div style={{ backgroundColor: '#1c1917', padding: '30px', borderRadius: '12px', marginBottom: '30px', color: 'white' }}>
          <h1 style={{ fontSize: '28px', fontWeight: '900', margin: 0, letterSpacing: '-0.02em' }}>BHARAT KISAN - CROP PRECISION REPORT</h1>
          <p style={{ fontSize: '12px', opacity: 0.7, marginTop: '8px' }}>Generated: {new Date().toLocaleString()}</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px', marginBottom: '40px' }}>
          <div>
            <h3 style={{ fontSize: '14px', fontWeight: '900', borderBottom: '1px solid #e7e5e4', paddingBottom: '8px', marginBottom: '12px', color: '#78716c' }}>FARMER INFORMATION</h3>
            <p style={{ fontSize: '14px', margin: '4px 0' }}><strong>Farmer Name:</strong> {profile?.name || 'Valued Farmer'}</p>
            <p style={{ fontSize: '14px', margin: '4px 0' }}><strong>Farm Unit:</strong> {profile?.farmName || 'Bharat Kisan Farm'}</p>
            <p style={{ fontSize: '14px', margin: '4px 0' }}><strong>Language:</strong> {language}</p>
          </div>
          <div>
            <h3 style={{ fontSize: '14px', fontWeight: '900', borderBottom: '1px solid #e7e5e4', paddingBottom: '8px', marginBottom: '12px', color: '#78716c' }}>FIELD PARAMETERS</h3>
            <p style={{ fontSize: '14px', margin: '4px 0' }}><strong>Target Crop:</strong> {formData.crop}</p>
            <p style={{ fontSize: '14px', margin: '4px 0' }}><strong>Location:</strong> {formData.location || 'N/A'}</p>
            <p style={{ fontSize: '14px', margin: '4px 0' }}><strong>Soil Type:</strong> {formData.soil || 'N/A'}</p>
          </div>
        </div>

        <div style={{ marginBottom: '40px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '900', borderBottom: '2px solid #1c1917', paddingBottom: '8px', marginBottom: '20px' }}>[1] STRATEGIC ADVISORY</h3>
          <div style={{ fontSize: '14px', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
            <ReactMarkdown>{advice}</ReactMarkdown>
          </div>
        </div>

        {fertilizerPlan && (
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: '900', borderBottom: '2px solid #1c1917', paddingBottom: '8px', marginBottom: '20px' }}>[2] FERTILIZATION & NUTRIENT PLAN</h3>
            
            <div style={{ marginBottom: '24px' }}>
              <p style={{ fontSize: '14px', marginBottom: '8px' }}><strong>Crop Requirements:</strong> {fertilizerPlan.cropRequirements}</p>
              <p style={{ fontSize: '14px' }}><strong>Soil Adjustments:</strong> {fertilizerPlan.soilAdjustments}</p>
            </div>

            <h4 style={{ fontSize: '14px', fontWeight: '900', marginBottom: '12px', color: '#854d0e' }}>RECOMMENDED FERTILIZERS</h4>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '24px', fontSize: '12px' }}>
              <thead>
                <tr style={{ backgroundColor: '#854d0e', color: 'white' }}>
                  <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #e7e5e4' }}>Name</th>
                  <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #e7e5e4' }}>NPK</th>
                  <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #e7e5e4' }}>Type</th>
                  <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #e7e5e4' }}>Description</th>
                </tr>
              </thead>
              <tbody>
                {fertilizerPlan.fertilizers.map((f, i) => (
                  <tr key={i} style={{ backgroundColor: i % 2 === 0 ? '#fafaf9' : 'white' }}>
                    <td style={{ padding: '10px', border: '1px solid #e7e5e4' }}>{f.name}</td>
                    <td style={{ padding: '10px', border: '1px solid #e7e5e4' }}>{f.npk}</td>
                    <td style={{ padding: '10px', border: '1px solid #e7e5e4' }}>{f.isOrganic ? 'Organic' : 'Synthetic'}</td>
                    <td style={{ padding: '10px', border: '1px solid #e7e5e4' }}>{f.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <h4 style={{ fontSize: '14px', fontWeight: '900', marginBottom: '12px', color: '#059669' }}>APPLICATION SCHEDULE</h4>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '24px', fontSize: '12px' }}>
              <thead>
                <tr style={{ backgroundColor: '#059669', color: 'white' }}>
                  <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #e7e5e4' }}>Stage</th>
                  <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #e7e5e4' }}>Timing</th>
                  <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #e7e5e4' }}>Dosage</th>
                  <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #e7e5e4' }}>Method</th>
                </tr>
              </thead>
              <tbody>
                {fertilizerPlan.schedule.map((s, i) => (
                  <tr key={i} style={{ border: '1px solid #e7e5e4' }}>
                    <td style={{ padding: '10px', border: '1px solid #e7e5e4' }}>{s.stage}</td>
                    <td style={{ padding: '10px', border: '1px solid #e7e5e4' }}>{s.timing}</td>
                    <td style={{ padding: '10px', border: '1px solid #e7e5e4' }}>{s.dosage}</td>
                    <td style={{ padding: '10px', border: '1px solid #e7e5e4' }}>{s.method}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {fertilizerPlan.micronutrients && fertilizerPlan.micronutrients.length > 0 && (
              <div style={{ marginBottom: '24px' }}>
                <h4 style={{ fontSize: '14px', fontWeight: '900', marginBottom: '8px' }}>MICRONUTRIENTS</h4>
                <p style={{ fontSize: '14px' }}>{fertilizerPlan.micronutrients.join(', ')}</p>
              </div>
            )}

            <div>
              <h4 style={{ fontSize: '14px', fontWeight: '900', marginBottom: '8px' }}>EXPERT TIPS</h4>
              <ul style={{ fontSize: '14px', paddingLeft: '20px' }}>
                {fertilizerPlan.tips.map((t, i) => (
                  <li key={i} style={{ marginBottom: '4px' }}>{t}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        <div style={{ marginTop: '60px', borderTop: '1px solid #e7e5e4', paddingTop: '20px', textTransform: 'uppercase', textAlign: 'center', fontSize: '10px', color: '#a8a29e' }}>
          <p>Disclaimer: AI recommendations should be verified with local agricultural officers.</p>
          <p>© 2026 Bharat Kisan Smart Farming Companion</p>
        </div>
      </div>

    </div>
  );
};

export default CropAdvisor;
