import React, { useState, useEffect } from 'react';
import { getCropRotationAdvice } from '../services/geminiService';
import { 
  RotateCcw, 
  Loader2, 
  MapPin, 
  FlaskConical, 
  History, 
  Sparkles, 
  ChevronRight, 
  Trash2, 
  Sprout, 
  ArrowRightLeft, 
  ShieldCheck, 
  TrendingUp, 
  Info, 
  Zap, 
  Save, 
  RefreshCw, 
  ArrowLeft, 
  Plus, 
  X, 
  MessageCircle, 
  Bookmark, 
  BookmarkCheck, 
  Share2, 
  Layers, 
  Compass, 
  CheckCircle2, 
  AlertCircle,
  FileText,
  CalendarDays
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { useDialogs } from '../src/components/DialogProvider';
import { showToast } from '../src/utils/toast';

const WEATHER_API_KEY = import.meta.env.VITE_WEATHER_API_KEY;

const POPULAR_CROPS = [
  { name: 'Paddy (Rice)', emoji: '🌾' },
  { name: 'Wheat', emoji: '🌾' },
  { name: 'Cotton', emoji: '☁️' },
  { name: 'Soybean', emoji: '🫘' },
  { name: 'Mustard', emoji: '🌼' },
  { name: 'Moong Dal', emoji: '🌱' },
  { name: 'Sugarcane', emoji: '🎋' },
  { name: 'Maize / Corn', emoji: '🌽' },
  { name: 'Bajra', emoji: '🌾' },
  { name: 'Tomato', emoji: '🍅' },
  { name: 'Onion', emoji: '🧅' },
  { name: 'Potato', emoji: '🥔' }
];

const SOIL_PRESETS = [
  { id: 'Alluvial', name: 'Alluvial Soil', desc: 'High fertility, common in Indo-Gangetic plains' },
  { id: 'Black Cotton', name: 'Black Cotton Soil', desc: 'Rich in clay, retains moisture, ideal for Cotton/Soybean' },
  { id: 'Red/Yellow', name: 'Red / Yellow Soil', desc: 'Rich in iron, porous & loamy' },
  { id: 'Laterite', name: 'Laterite Soil', desc: 'Weathered acidic soil, rich in iron/aluminum' },
  { id: 'Desert/Sandy', name: 'Desert / Sandy Loam', desc: 'Light texture, requires organic enrichment' }
];

interface SavedRotation {
  id: string;
  timestamp: string;
  currentCrops: string[];
  location: string;
  soil: string;
  history: string[];
  advice: string;
}

interface CropRotationAdvisorProps {
  language?: string;
  onBack?: () => void;
}

const CropRotationAdvisor: React.FC<CropRotationAdvisorProps> = ({ language = 'English', onBack }) => {
  const { confirm } = useDialogs();

  const [formData, setFormData] = useState({
    currentCrops: ['Paddy (Rice)'],
    location: localStorage.getItem('agri_farm_location') || 'Punjab, India',
    soil: localStorage.getItem('agri_soil_type') || 'Alluvial',
    history: ['Wheat']
  });

  const [newCrop, setNewCrop] = useState('');
  const [historyCrop, setHistoryCrop] = useState('');
  const [advice, setAdvice] = useState('');
  const [loading, setLoading] = useState(false);
  const [detecting, setDetecting] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved'>('idle');

  // Mobile Navigation Tab
  const [activeTab, setActiveTab] = useState<'planner' | 'matrix' | 'saved'>('planner');

  const [savedRotations, setSavedRotations] = useState<SavedRotation[]>(() => {
    try {
      const saved = localStorage.getItem('agri_saved_rotations');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Save to localStorage whenever savedRotations update
  useEffect(() => {
    try {
      localStorage.setItem('agri_saved_rotations', JSON.stringify(savedRotations));
    } catch (e) {
      console.error(e);
    }
  }, [savedRotations]);

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
          showToast(`Location set to ${region}`);
        } catch (err) {
          console.error(err);
          showToast('Could not resolve location name');
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

  const handleFetchAdvice = async () => {
    if (formData.currentCrops.length === 0) {
      showToast('Please select at least one current crop');
      return;
    }
    setLoading(true);
    setSaveStatus('idle');
    try {
      const res = await getCropRotationAdvice(
        formData.location,
        formData.currentCrops,
        formData.soil,
        formData.history,
        language
      );
      setAdvice(res || '');
      setActiveTab('matrix');
      showToast('Crop Rotation Plan Generated!');
    } catch (err) {
      console.error(err);
      showToast('Failed to generate rotation plan');
    } finally {
      setLoading(false);
    }
  };

  const addCurrentCrop = (cropName: string) => {
    const trimmed = cropName.trim();
    if (trimmed && !formData.currentCrops.includes(trimmed)) {
      setFormData(prev => ({ ...prev, currentCrops: [...prev.currentCrops, trimmed] }));
      setNewCrop('');
    }
  };

  const removeCurrentCrop = (cropName: string) => {
    setFormData(prev => ({ ...prev, currentCrops: prev.currentCrops.filter(c => c !== cropName) }));
  };

  const addHistoryCrop = (cropName: string) => {
    const trimmed = cropName.trim();
    if (trimmed && !formData.history.includes(trimmed)) {
      setFormData(prev => ({ ...prev, history: [...prev.history, trimmed] }));
      setHistoryCrop('');
    }
  };

  const removeHistoryCrop = (cropName: string) => {
    setFormData(prev => ({ ...prev, history: prev.history.filter(c => c !== cropName) }));
  };

  const saveToArchive = () => {
    if (!advice) return;
    const newRotation: SavedRotation = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      currentCrops: formData.currentCrops,
      location: formData.location,
      soil: formData.soil,
      history: formData.history,
      advice
    };
    setSavedRotations(prev => [newRotation, ...prev]);
    setSaveStatus('saved');
    showToast('Rotation plan saved to Archive!');
  };

  const deleteArchived = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    confirm({
      title: 'Delete Rotation Plan',
      message: 'Are you sure you want to remove this saved rotation plan?',
      type: 'danger',
      onConfirm: () => {
        setSavedRotations(prev => prev.filter(s => s.id !== id));
        showToast('Plan deleted from Archive');
      }
    });
  };

  const loadArchived = (rotation: SavedRotation) => {
    setFormData({
      currentCrops: rotation.currentCrops,
      location: rotation.location,
      soil: rotation.soil,
      history: rotation.history
    });
    setAdvice(rotation.advice);
    setActiveTab('matrix');
  };

  const sharePlanOnWhatsApp = () => {
    if (!advice) return;
    const message = `🌾 *Bharat Kisan - AI Crop Rotation Plan*%0A%0A` +
      `📌 *Location:* ${formData.location}%0A` +
      `🌱 *Current Crops:* ${formData.currentCrops.join(', ')}%0A` +
      `🪵 *Soil Type:* ${formData.soil || 'Not specified'}%0A%0A` +
      `💡 *AI Recommendation:*%0A${advice.substring(0, 220)}...%0A%0A` +
      `📲 *Optimize soil health & yield with Bharat Kisan App*`;
    
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
          <div className="p-2 bg-emerald-500/20 rounded-xl border border-emerald-500/30 text-emerald-400">
            <RotateCcw className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-black text-white tracking-tight leading-none">Crop Rotation</h1>
            <p className="text-[10px] text-emerald-400 font-mono mt-0.5 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block" />
              Soil Health & Yield Engine
            </p>
          </div>
        </div>

        <button
          onClick={detectLocation}
          disabled={detecting}
          className="p-2.5 rounded-xl bg-stone-900 border border-stone-800 text-emerald-400 hover:text-white active:scale-90 transition-all min-w-[44px] min-h-[44px] flex items-center justify-center"
          title="Detect GPS"
        >
          {detecting ? <Loader2 className="w-4 h-4 animate-spin text-emerald-400" /> : <MapPin className="w-4 h-4" />}
        </button>
      </header>

      {/* Android Top Segmented Navigation Tabs */}
      <div className="px-3 py-2 bg-stone-950/80 border-b border-stone-850 sticky top-[57px] z-40 overflow-x-auto no-scrollbar">
        <div className="flex items-center gap-1.5 min-w-max">
          
          <button
            onClick={() => setActiveTab('planner')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 min-h-[44px] ${
              activeTab === 'planner'
                ? 'bg-emerald-500 text-stone-950 shadow-md shadow-emerald-950/50'
                : 'bg-stone-900 text-stone-400 hover:text-stone-200 border border-stone-800'
            }`}
          >
            <Compass className="w-4 h-4" />
            <span>Farm Parameters</span>
          </button>

          <button
            onClick={() => setActiveTab('matrix')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 min-h-[44px] ${
              activeTab === 'matrix'
                ? 'bg-emerald-500 text-stone-950 shadow-md shadow-emerald-950/50'
                : 'bg-stone-900 text-stone-400 hover:text-stone-200 border border-stone-800'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>AI Rotation Plan</span>
          </button>

          <button
            onClick={() => setActiveTab('saved')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 min-h-[44px] ${
              activeTab === 'saved'
                ? 'bg-emerald-500 text-stone-950 shadow-md shadow-emerald-950/50'
                : 'bg-stone-900 text-stone-400 hover:text-stone-200 border border-stone-800'
            }`}
          >
            <Bookmark className="w-4 h-4" />
            <span>Saved Plans ({savedRotations.length})</span>
          </button>

        </div>
      </div>

      <main className="px-3.5 sm:px-6 mt-4 space-y-5 max-w-3xl mx-auto w-full">

        {/* TAB 1: PARAMETERS PLANNER */}
        {activeTab === 'planner' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            
            <div className="bg-stone-900/90 border border-stone-800 rounded-2xl p-4 space-y-4 shadow-xl">
              
              <div className="flex items-center justify-between border-b border-stone-800 pb-2.5">
                <div className="flex items-center gap-2">
                  <Sprout className="w-4 h-4 text-emerald-400" />
                  <h2 className="text-xs font-black uppercase tracking-wider text-white">Current Crop Matrix</h2>
                </div>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-500/30">
                  {formData.currentCrops.length} Selected
                </span>
              </div>

              {/* Current Crops Input */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">Add Present Crops</label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    value={newCrop}
                    onChange={e => setNewCrop(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && addCurrentCrop(newCrop)}
                    placeholder="e.g. Paddy, Cotton, Sugarcane..."
                    className="flex-1 bg-stone-950 border border-stone-800 rounded-xl p-3 text-xs text-white outline-none focus:border-emerald-500 font-bold"
                  />
                  <button
                    onClick={() => addCurrentCrop(newCrop)}
                    className="p-3 bg-emerald-500 text-stone-950 rounded-xl font-bold active:scale-90 transition-all hover:bg-emerald-400 min-w-[44px] min-h-[44px] flex items-center justify-center shrink-0"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                {/* Selected Current Crops Badges */}
                {formData.currentCrops.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {formData.currentCrops.map(c => (
                      <span key={c} className="bg-emerald-950 text-emerald-300 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 border border-emerald-500/30">
                        <span>🌱 {c}</span>
                        <X 
                          className="w-3.5 h-3.5 cursor-pointer text-emerald-400 hover:text-rose-400 transition-colors" 
                          onClick={() => removeCurrentCrop(c)} 
                        />
                      </span>
                    ))}
                  </div>
                )}

                {/* Quick Selection Crop Chips */}
                <div className="space-y-1.5 pt-2 border-t border-stone-850">
                  <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">Tap to Add Common Crops</span>
                  <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1">
                    {POPULAR_CROPS.map(c => (
                      <button
                        key={c.name}
                        onClick={() => addCurrentCrop(c.name)}
                        className="px-2.5 py-1.5 bg-stone-950 text-stone-300 border border-stone-800 hover:border-emerald-500/40 rounded-lg text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1 active:scale-95"
                      >
                        <span>{c.emoji}</span>
                        <span>+ {c.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Location Input */}
              <div className="space-y-1.5 pt-2 border-t border-stone-850">
                <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">Farm Location / Region</label>
                <div className="relative flex items-center gap-1.5">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={formData.location}
                      onChange={e => setFormData({ ...formData, location: e.target.value })}
                      placeholder="e.g. Punjab, Indore, Nashik..."
                      className="w-full bg-stone-950 border border-stone-800 rounded-xl p-3 pl-8 text-xs text-white outline-none focus:border-emerald-500 font-bold"
                    />
                    <MapPin className="w-3.5 h-3.5 text-emerald-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  </div>
                  <button
                    type="button"
                    onClick={detectLocation}
                    disabled={detecting}
                    className="p-3 bg-stone-950 border border-stone-800 rounded-xl text-emerald-400 active:scale-90 transition-all hover:bg-stone-850 shrink-0 min-w-[44px] min-h-[44px] flex items-center justify-center"
                    title="Detect GPS"
                  >
                    {detecting ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Soil Type Selection */}
              <div className="space-y-2 pt-2 border-t border-stone-850">
                <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">Soil Composition</label>
                <div className="grid grid-cols-1 gap-2">
                  {SOIL_PRESETS.map(s => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setFormData({ ...formData, soil: s.id })}
                      className={`p-3 rounded-xl border text-left transition-all flex items-center justify-between active:scale-98 min-h-[48px] ${
                        formData.soil === s.id
                          ? 'bg-emerald-950/80 border-emerald-500 text-white shadow-md'
                          : 'bg-stone-950 border-stone-850 text-stone-400 hover:text-stone-200'
                      }`}
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <FlaskConical className={`w-3.5 h-3.5 ${formData.soil === s.id ? 'text-emerald-400' : 'text-stone-500'}`} />
                          <span className="text-xs font-bold">{s.name}</span>
                        </div>
                        <p className="text-[10px] text-stone-400 font-sans">{s.desc}</p>
                      </div>
                      {formData.soil === s.id && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 ml-2" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Past History Matrix */}
              <div className="space-y-2 pt-2 border-t border-stone-850">
                <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">Crop History (Last 2 Years)</label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    value={historyCrop}
                    onChange={e => setHistoryCrop(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && addHistoryCrop(historyCrop)}
                    placeholder="e.g. Mustard, Wheat, Moong..."
                    className="flex-1 bg-stone-950 border border-stone-800 rounded-xl p-3 text-xs text-white outline-none focus:border-emerald-500 font-bold"
                  />
                  <button
                    onClick={() => addHistoryCrop(historyCrop)}
                    className="p-3 bg-stone-800 text-stone-200 rounded-xl font-bold active:scale-90 transition-all hover:bg-stone-700 min-w-[44px] min-h-[44px] flex items-center justify-center shrink-0"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                {formData.history.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {formData.history.map(c => (
                      <span key={c} className="bg-stone-950 text-stone-300 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 border border-stone-800">
                        <span>📜 {c}</span>
                        <X 
                          className="w-3.5 h-3.5 cursor-pointer text-stone-400 hover:text-rose-400 transition-colors" 
                          onClick={() => removeHistoryCrop(c)} 
                        />
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Generate Plan CTA Button */}
              <button
                onClick={handleFetchAdvice}
                disabled={loading || formData.currentCrops.length === 0}
                className="w-full py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/50 transition-all active:scale-98 disabled:opacity-50 min-h-[48px]"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                <span>{loading ? 'Optimizing Soil & Crop Matrix...' : 'Generate AI Rotation Plan'}</span>
              </button>

            </div>

          </div>
        )}

        {/* LOADING STATE */}
        {loading && (
          <div className="py-12 bg-stone-900/60 rounded-2xl border border-stone-800 text-center space-y-3">
            <div className="relative w-12 h-12 mx-auto">
              <div className="w-12 h-12 border-4 border-stone-800 border-t-emerald-500 rounded-full animate-spin" />
              <RotateCcw className="w-5 h-5 text-emerald-500 absolute inset-0 m-auto animate-pulse" />
            </div>
            <p className="text-xs font-bold text-stone-200">Analyzing Nitrogen Fixation & Disease Cycles...</p>
            <p className="text-[10px] text-stone-500 font-mono">Generating multi-season succession strategy for {formData.location}</p>
          </div>
        )}

        {/* TAB 2: AI ROTATION MATRIX OUTPUT */}
        {!loading && activeTab === 'matrix' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            {advice ? (
              <div className="space-y-4">
                
                {/* Header Action Bar */}
                <div className="flex items-center justify-between bg-stone-900/90 p-3 rounded-2xl border border-stone-800">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-bold text-white uppercase tracking-wider">AI Agronomist Report</span>
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
                      onClick={saveToArchive}
                      disabled={saveStatus === 'saved'}
                      className={`p-2 rounded-xl border text-xs font-bold flex items-center gap-1 transition-all active:scale-95 min-h-[36px] ${
                        saveStatus === 'saved'
                          ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                          : 'bg-stone-950 border-stone-800 text-stone-300 hover:text-white'
                      }`}
                    >
                      <Save className="w-4 h-4 text-emerald-400" />
                    </button>
                  </div>
                </div>

                {/* Main Advice Card */}
                <div className="bg-gradient-to-br from-stone-900 via-stone-900 to-emerald-950/40 border border-emerald-500/30 rounded-2xl p-4 space-y-3 shadow-xl">
                  
                  <div className="flex items-center gap-2 border-b border-stone-800 pb-2.5">
                    <Sparkles className="w-4 h-4 text-emerald-400" />
                    <h3 className="text-xs font-black text-white uppercase tracking-wider">
                      Optimal Crop Succession Sequence
                    </h3>
                  </div>

                  <div className="text-xs text-stone-300 leading-relaxed font-sans pt-1">
                    <ReactMarkdown>{advice}</ReactMarkdown>
                  </div>
                </div>

                {/* Agronomist Advisory Disclaimer */}
                <div className="bg-stone-900/90 border border-stone-800 rounded-2xl p-4 space-y-2">
                  <div className="flex items-center gap-2 border-b border-stone-800 pb-2">
                    <ShieldCheck className="w-4 h-4 text-amber-400" />
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">KVK Advisory Note</h4>
                  </div>
                  <p className="text-[11px] text-stone-400 leading-relaxed">
                    This succession plan considers nitrogen fixation, weed suppression, and water table sustainability. Validate soil moisture and nutrient tests with your nearest Krishi Vigyan Kendra (KVK) officer before sowing.
                  </p>
                </div>

              </div>
            ) : (
              <div className="text-center py-12 px-4 bg-stone-900/80 rounded-2xl border border-stone-800 space-y-3">
                <RotateCcw className="w-8 h-8 text-emerald-500 mx-auto animate-pulse" />
                <h3 className="text-xs font-bold text-stone-200">No Rotation Plan Generated</h3>
                <p className="text-[11px] text-stone-500 max-w-sm mx-auto">
                  Configure your present crops, farm region, and soil type under Farm Parameters tab to calculate the optimal multi-season rotation.
                </p>
                <button
                  onClick={() => setActiveTab('planner')}
                  className="px-4 py-2.5 bg-emerald-500 text-stone-950 rounded-xl font-bold text-xs uppercase tracking-wider active:scale-95 transition-all shadow-md min-h-[44px]"
                >
                  Configure Parameters
                </button>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: SAVED ROTATION ARCHIVE */}
        {activeTab === 'saved' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="bg-stone-900/90 border border-stone-800 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-stone-800 pb-2.5">
                <div className="flex items-center gap-2">
                  <Bookmark className="w-4 h-4 text-emerald-400" />
                  <h3 className="text-xs font-extrabold text-white uppercase tracking-wider">Archived Rotation Plans</h3>
                </div>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-500/30">
                  {savedRotations.length} Saved
                </span>
              </div>

              {savedRotations.length === 0 ? (
                <div className="text-center py-8 px-4 bg-stone-950 rounded-xl border border-stone-850 space-y-2">
                  <FileText className="w-8 h-8 text-stone-600 mx-auto" />
                  <h4 className="text-xs font-bold text-stone-300">No archived rotation plans</h4>
                  <p className="text-[11px] text-stone-500">
                    Generate an AI rotation plan and tap Save to store your seasonal strategies here.
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {savedRotations.map(item => (
                    <div
                      key={item.id}
                      onClick={() => loadArchived(item)}
                      className="bg-stone-950 p-3.5 rounded-xl border border-stone-850 hover:border-emerald-500/40 space-y-2 cursor-pointer group transition-all"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-xs font-bold text-white group-hover:text-emerald-300">📍 {item.location}</h4>
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
                        <span className="text-stone-300 font-bold">Crops: {item.currentCrops.join(', ')}</span>
                        <span>•</span>
                        <span className="text-emerald-400 font-bold">{item.soil} Soil</span>
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

export default CropRotationAdvisor;
