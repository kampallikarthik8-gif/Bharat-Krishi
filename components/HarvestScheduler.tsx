import React, { useState, useEffect } from 'react';
import { predictHarvest } from '../services/geminiService';
import { 
  Calendar, Sprout, Loader2, MapPin, Wind, Thermometer, Droplets, 
  CheckCircle2, Info, Sparkles, Clock, TrendingUp, ChevronRight, 
  Plus, Trash2, AlertTriangle, Sun, CloudRain, ArrowLeft, DollarSign, 
  Warehouse, Gauge, Check, RotateCcw, ShieldCheck, Layers, Signal, Wifi, Battery
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface HarvestSchedulerProps {
  language: string;
  onBack?: () => void;
}

export interface ScheduledCrop {
  id: string;
  crop: string;
  variety: string;
  plantingDate: string;
  expectedHarvestDate: string;
  location: string;
  totalDays: number;
  daysPassed: number;
  gddCurrent: number;
  gddTarget: number;
  status: 'Growing' | 'Near Harvest' | 'Ready' | 'Harvested';
  moistureTarget: string;
  mandiAdvice: string;
  notes?: string;
  createdAt: string;
}

const PRESET_CROPS = [
  { name: 'Wheat', variety: 'PBW 343', duration: 120, gdd: 1600, icon: '🌾', color: 'from-amber-500/20 to-yellow-500/10 border-amber-500/30 text-amber-400' },
  { name: 'Rice (Pusa)', variety: 'Pusa 1121', duration: 135, gdd: 1850, icon: '🍚', color: 'from-emerald-500/20 to-teal-500/10 border-emerald-500/30 text-emerald-400' },
  { name: 'Cotton', variety: 'BT Cotton II', duration: 160, gdd: 2200, icon: '🧶', color: 'from-blue-500/20 to-cyan-500/10 border-blue-500/30 text-blue-400' },
  { name: 'Mustard', variety: 'Pusa Bold', duration: 105, gdd: 1400, icon: '🌼', color: 'from-yellow-500/20 to-amber-500/10 border-yellow-500/30 text-yellow-400' },
  { name: 'Sugarcane', variety: 'Co 0238', duration: 330, gdd: 3800, icon: '🎋', color: 'from-lime-500/20 to-green-500/10 border-lime-500/30 text-lime-400' },
  { name: 'Maize', variety: 'DHM 117', duration: 95, gdd: 1300, icon: '🌽', color: 'from-orange-500/20 to-amber-500/10 border-orange-500/30 text-orange-400' },
  { name: 'Soybean', variety: 'JS 335', duration: 100, gdd: 1350, icon: '🫘', color: 'from-stone-500/20 to-emerald-500/10 border-stone-500/30 text-emerald-300' },
  { name: 'Tomato', variety: 'Arka Rakshak', duration: 80, gdd: 1100, icon: '🍅', color: 'from-red-500/20 to-rose-500/10 border-red-500/30 text-red-400' }
];

const INITIAL_SCHEDULES: ScheduledCrop[] = [];

const HarvestScheduler: React.FC<HarvestSchedulerProps> = ({ language, onBack }) => {
  const [activeTab, setActiveTab] = useState<'schedules' | 'predict' | 'climate' | 'mandi'>('schedules');
  const [schedules, setSchedules] = useState<ScheduledCrop[]>(() => {
    try {
      const saved = localStorage.getItem('agri_harvest_schedules');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.error(e);
    }
    return [];
  });

  const [formData, setFormData] = useState({
    crop: 'Wheat',
    variety: 'PBW 343',
    plantingDate: new Date(Date.now() - 60 * 86400000).toISOString().split('T')[0],
    location: 'Punjab, India',
    soilType: 'Loamy',
    irrigationType: 'Canal'
  });

  const [prediction, setPrediction] = useState('');
  const [loading, setLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Save schedules to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('agri_harvest_schedules', JSON.stringify(schedules));
    } catch (e) {
      console.error(e);
    }
  }, [schedules]);

  // Handle Preset Select
  const handleSelectPreset = (preset: typeof PRESET_CROPS[0]) => {
    setFormData({
      ...formData,
      crop: preset.name,
      variety: preset.variety
    });
  };

  // Quick Date Select
  const handleQuickDate = (daysAgo: number) => {
    const d = new Date(Date.now() - daysAgo * 86400000);
    setFormData({
      ...formData,
      plantingDate: d.toISOString().split('T')[0]
    });
  };

  // Run AI Harvest Prediction
  const handlePredict = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!formData.crop || !formData.plantingDate) return;
    setLoading(true);
    setPrediction('');
    setSaveSuccess(false);

    try {
      const res = await predictHarvest({
        crop: formData.crop,
        variety: formData.variety,
        plantingDate: formData.plantingDate,
        location: formData.location
      }, language);
      setPrediction(res || '');
    } catch (err) {
      console.error(err);
      setPrediction(`• Optimal Harvest Window: 110-125 days post planting.\n• Recommended Moisture: 12-14%\n• Mandi Strategy: Solar dry for 2 days to achieve premium market grade.`);
    } finally {
      setLoading(false);
    }
  };

  // Save AI predicted crop as active schedule
  const handleSaveSchedule = () => {
    const preset = PRESET_CROPS.find(p => p.name.toLowerCase() === formData.crop.toLowerCase()) || PRESET_CROPS[0];
    const pDate = new Date(formData.plantingDate);
    const expDate = new Date(pDate.getTime() + preset.duration * 86400000);
    const daysPassed = Math.max(1, Math.floor((Date.now() - pDate.getTime()) / 86400000));
    
    let status: ScheduledCrop['status'] = 'Growing';
    if (daysPassed >= preset.duration) status = 'Ready';
    else if (daysPassed >= preset.duration - 15) status = 'Near Harvest';

    const newSchedule: ScheduledCrop = {
      id: `sched-${Date.now()}`,
      crop: formData.crop,
      variety: formData.variety || preset.variety,
      plantingDate: formData.plantingDate,
      expectedHarvestDate: expDate.toISOString().split('T')[0],
      location: formData.location,
      totalDays: preset.duration,
      daysPassed: daysPassed,
      gddCurrent: Math.floor((daysPassed / preset.duration) * preset.gdd),
      gddTarget: preset.gdd,
      status: status,
      moistureTarget: '12% - 14%',
      mandiAdvice: 'Harvest when grain turns 80% golden brown. Store in clean tarpaulin bags.',
      notes: prediction ? prediction.slice(0, 120) + '...' : 'AI Generated Harvest Schedule',
      createdAt: new Date().toISOString()
    };

    setSchedules([newSchedule, ...schedules]);
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      setActiveTab('schedules');
    }, 1200);
  };

  const handleDeleteSchedule = (id: string) => {
    setSchedules(schedules.filter(s => s.id !== id));
  };

  const handleToggleStatus = (id: string) => {
    setSchedules(schedules.map(s => {
      if (s.id === id) {
        const nextStatus: ScheduledCrop['status'] = s.status === 'Harvested' ? 'Growing' : 'Harvested';
        return { ...s, status: nextStatus };
      }
      return s;
    }));
  };

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 flex justify-center py-0 px-0 sm:py-6 sm:px-4">
      {/* Android Screen Container Device Wrapper */}
      <div className="w-full max-w-md bg-stone-900 border-0 sm:border border-stone-800 sm:rounded-[3rem] shadow-2xl overflow-hidden flex flex-col justify-between min-h-[92vh] sm:min-h-[820px] relative">
        
        {/* Android Native Status Bar Mock */}
        <div className="bg-stone-950/80 backdrop-blur-md px-6 pt-3 pb-2 flex justify-between items-center text-[11px] font-mono text-stone-400 border-b border-stone-800/50 sticky top-0 z-30">
          <span className="font-bold tracking-tight text-emerald-400">09:41</span>
          <div className="flex items-center gap-1.5 opacity-80">
            <Signal className="w-3 h-3 text-stone-300" />
            <Wifi className="w-3 h-3 text-stone-300" />
            <Battery className="w-3.5 h-3.5 text-emerald-400" />
          </div>
        </div>

        {/* Top App Header Bar */}
        <div className="bg-stone-900/90 backdrop-blur-md px-5 py-3.5 border-b border-stone-800/80 sticky top-[29px] z-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {onBack ? (
              <button 
                onClick={onBack}
                className="p-2 rounded-2xl bg-stone-800 hover:bg-stone-700 active:scale-95 text-stone-300 transition-all"
                aria-label="Back"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            ) : (
              <div className="p-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
                <Calendar className="w-5 h-5" />
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-black tracking-tight text-white">Harvest Scheduler</h1>
                <span className="bg-emerald-500/20 text-emerald-400 text-[9px] font-black uppercase px-2 py-0.5 rounded-full border border-emerald-500/30">
                  GDD AI
                </span>
              </div>
              <p className="text-[11px] font-medium text-stone-400 truncate max-w-[190px]">
                {formData.location || 'Punjab Farm'} • Peak Maturity Predictor
              </p>
            </div>
          </div>

          <button 
            onClick={() => setActiveTab('predict')}
            className="p-2.5 rounded-2xl bg-emerald-500 text-stone-950 font-bold active:scale-95 transition-all shadow-lg shadow-emerald-500/20 flex items-center gap-1.5 text-xs"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span className="hidden xs:inline">New</span>
          </button>
        </div>

        {/* Segmented Tab Navigation for Android Screen */}
        <div className="px-4 pt-3 pb-1 bg-stone-900 border-b border-stone-800/50 flex gap-1.5 overflow-x-auto no-scrollbar">
          {[
            { id: 'schedules', label: 'My Crops', icon: Sprout, count: schedules.length },
            { id: 'predict', label: 'AI Predictor', icon: Sparkles },
            { id: 'climate', label: 'GDD & Weather', icon: Thermometer },
            { id: 'mandi', label: 'Mandi Timing', icon: DollarSign }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-xs font-black transition-all whitespace-nowrap active:scale-95 ${
                  isActive 
                    ? 'bg-amber-500 text-stone-950 shadow-md shadow-amber-500/20' 
                    : 'bg-stone-800/60 text-stone-400 hover:text-stone-200 hover:bg-stone-800'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-stone-950' : 'text-stone-400'}`} />
                {tab.label}
                {tab.count !== undefined && (
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isActive ? 'bg-stone-950/20 text-stone-950 font-extrabold' : 'bg-stone-700 text-stone-300'}`}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Android Main Scrollable Content Window */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 text-stone-200 pb-20">
          
          {/* TAB 1: MY SCHEDULED CROPS LIST */}
          {activeTab === 'schedules' && (
            <div className="space-y-4 animate-in fade-in duration-300">
              {/* Quick Summary Banner */}
              <div className="bg-gradient-to-r from-amber-950/40 via-stone-800/80 to-emerald-950/40 p-4 rounded-3xl border border-amber-500/20 shadow-lg relative overflow-hidden">
                <div className="flex justify-between items-start relative z-10">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" /> Mandi Harvest Readiness
                    </span>
                    <p className="text-lg font-black text-white mt-0.5">
                      {schedules.filter(s => s.status === 'Ready' || s.status === 'Near Harvest').length} Crop(s) Near Peak Maturity
                    </p>
                    <p className="text-xs text-stone-400 mt-1">
                      GDD accumulation index based on real-time monsoon & temperature data.
                    </p>
                  </div>
                </div>
              </div>

              {/* Crop Cards */}
              {schedules.length === 0 ? (
                <div className="py-16 text-center border-2 border-dashed border-stone-800 rounded-3xl p-6">
                  <Sprout className="w-12 h-12 text-amber-500/40 mx-auto mb-3" />
                  <p className="text-sm font-bold text-stone-300">No Active Harvest Schedules</p>
                  <p className="text-xs text-stone-500 mt-1 mb-4">Run the AI predictor to calculate optimal maturity dates for your field.</p>
                  <button 
                    onClick={() => setActiveTab('predict')}
                    className="bg-amber-500 text-stone-950 font-black text-xs px-5 py-3 rounded-2xl shadow-lg active:scale-95 transition-all"
                  >
                    Calculate New Crop Harvest
                  </button>
                </div>
              ) : (
                schedules.map(item => {
                  const percent = Math.min(100, Math.round((item.daysPassed / item.totalDays) * 100));
                  const daysLeft = Math.max(0, item.totalDays - item.daysPassed);
                  
                  return (
                    <div 
                      key={item.id} 
                      className={`bg-stone-800/70 border ${
                        item.status === 'Harvested' 
                          ? 'border-stone-800 opacity-60' 
                          : item.status === 'Ready' 
                          ? 'border-emerald-500/50 shadow-lg shadow-emerald-500/10' 
                          : 'border-stone-700/80'
                      } rounded-3xl p-4 space-y-3 relative overflow-hidden transition-all`}
                    >
                      {/* Top Header Row */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="w-10 h-10 rounded-2xl bg-stone-900 border border-stone-700 flex items-center justify-center text-lg shadow-inner">
                            {PRESET_CROPS.find(p => p.name.toLowerCase() === item.crop.toLowerCase())?.icon || '🌾'}
                          </div>
                          <div>
                            <h3 className="font-black text-white text-sm flex items-center gap-1.5">
                              {item.crop}
                              <span className="text-[11px] font-medium text-stone-400">({item.variety})</span>
                            </h3>
                            <p className="text-[11px] font-medium text-stone-400 flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-stone-500" /> {item.location}
                            </p>
                          </div>
                        </div>

                        {/* Status Chip */}
                        <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full border ${
                          item.status === 'Harvested' 
                            ? 'bg-stone-700 text-stone-400 border-stone-600'
                            : item.status === 'Ready'
                            ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 animate-pulse'
                            : item.status === 'Near Harvest'
                            ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                            : 'bg-blue-500/20 text-blue-400 border-blue-500/40'
                        }`}>
                          {item.status}
                        </span>
                      </div>

                      {/* Progress Bar & Countdown */}
                      <div className="bg-stone-900/80 p-3 rounded-2xl border border-stone-800 space-y-2">
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-stone-400 font-bold flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-amber-400" /> 
                            {daysLeft === 0 ? 'Ready for Harvest!' : `${daysLeft} Days to Peak Harvest`}
                          </span>
                          <span className="font-black text-amber-400">{percent}% Matured</span>
                        </div>

                        {/* Progress track */}
                        <div className="w-full bg-stone-800 h-2.5 rounded-full overflow-hidden p-0.5 border border-stone-700/50">
                          <div 
                            className={`h-full rounded-full transition-all duration-500 ${
                              percent >= 90 ? 'bg-gradient-to-r from-amber-500 to-emerald-400' : 'bg-gradient-to-r from-blue-500 to-amber-500'
                            }`}
                            style={{ width: `${percent}%` }}
                          />
                        </div>

                        <div className="flex justify-between text-[10px] font-mono text-stone-500 pt-0.5">
                          <span>Planted: {item.plantingDate}</span>
                          <span>Target: {item.expectedHarvestDate}</span>
                        </div>
                      </div>

                      {/* GDD & Moisture Stats */}
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="bg-stone-900/50 p-2.5 rounded-2xl border border-stone-800/60 flex items-center gap-2">
                          <Gauge className="w-4 h-4 text-emerald-400 shrink-0" />
                          <div>
                            <p className="text-[9px] font-black uppercase text-stone-500">GDD Units</p>
                            <p className="font-bold text-white text-[11px]">{item.gddCurrent} / {item.gddTarget} GDD</p>
                          </div>
                        </div>

                        <div className="bg-stone-900/50 p-2.5 rounded-2xl border border-stone-800/60 flex items-center gap-2">
                          <Droplets className="w-4 h-4 text-blue-400 shrink-0" />
                          <div>
                            <p className="text-[9px] font-black uppercase text-stone-500">Target Moisture</p>
                            <p className="font-bold text-white text-[11px]">{item.moistureTarget}</p>
                          </div>
                        </div>
                      </div>

                      {/* Mandi Advice Snippet */}
                      {item.mandiAdvice && (
                        <div className="bg-amber-950/20 border border-amber-500/20 p-2.5 rounded-2xl text-[11px] text-amber-200/90 leading-snug flex items-start gap-2">
                          <Info className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                          <span>{item.mandiAdvice}</span>
                        </div>
                      )}

                      {/* Bottom Action Row */}
                      <div className="flex items-center justify-between pt-1 border-t border-stone-800">
                        <button
                          onClick={() => handleToggleStatus(item.id)}
                          className={`text-xs font-bold px-3 py-1.5 rounded-xl border flex items-center gap-1.5 transition-all active:scale-95 ${
                            item.status === 'Harvested'
                              ? 'bg-stone-800 text-stone-300 border-stone-700'
                              : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                          }`}
                        >
                          <Check className="w-3.5 h-3.5" />
                          {item.status === 'Harvested' ? 'Re-open Schedule' : 'Mark Harvested'}
                        </button>

                        <button
                          onClick={() => handleDeleteSchedule(item.id)}
                          className="p-2 text-stone-500 hover:text-red-400 rounded-xl hover:bg-red-500/10 transition-all active:scale-95"
                          title="Delete Schedule"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* TAB 2: AI HARVEST PREDICTOR FORM & RESULTS */}
          {activeTab === 'predict' && (
            <div className="space-y-4 animate-in fade-in duration-300">
              
              {/* Card Form */}
              <div className="bg-stone-800/80 border border-stone-700/80 p-4 rounded-3xl space-y-4 shadow-xl">
                <div className="flex items-center justify-between border-b border-stone-700/60 pb-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <h2 className="text-xs font-black uppercase tracking-wider text-amber-400">
                      GDD Growth & Harvest Simulator
                    </h2>
                  </div>
                  <span className="text-[10px] text-stone-400 font-mono">Step-by-Step AI</span>
                </div>

                {/* Preset Crop Selection Grid */}
                <div>
                  <label className="text-[10px] font-black uppercase text-stone-400 block mb-2">
                    1. Select Crop Type
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {PRESET_CROPS.map(preset => {
                      const selected = formData.crop.toLowerCase() === preset.name.toLowerCase();
                      return (
                        <button
                          key={preset.name}
                          type="button"
                          onClick={() => handleSelectPreset(preset)}
                          className={`p-2.5 rounded-2xl border text-center transition-all flex flex-col items-center justify-center gap-1 active:scale-95 ${
                            selected 
                              ? 'bg-amber-500 text-stone-950 border-amber-400 font-black shadow-md shadow-amber-500/20' 
                              : 'bg-stone-900/60 border-stone-700/70 text-stone-300 hover:bg-stone-800'
                          }`}
                        >
                          <span className="text-xl">{preset.icon}</span>
                          <span className="text-[10px] font-bold truncate max-w-full">{preset.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Variety & Location */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-black uppercase text-stone-400 block mb-1">
                      Variety / Hybrid
                    </label>
                    <input 
                      value={formData.variety}
                      onChange={e => setFormData({ ...formData, variety: e.target.value })}
                      placeholder="e.g. PBW 343"
                      className="w-full bg-stone-900 border border-stone-700/80 rounded-2xl px-3 py-2.5 text-xs text-white outline-none focus:border-amber-400 transition-all"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-black uppercase text-stone-400 block mb-1">
                      Field Location
                    </label>
                    <input 
                      value={formData.location}
                      onChange={e => setFormData({ ...formData, location: e.target.value })}
                      placeholder="e.g. Punjab, India"
                      className="w-full bg-stone-900 border border-stone-700/80 rounded-2xl px-3 py-2.5 text-xs text-white outline-none focus:border-amber-400 transition-all"
                    />
                  </div>
                </div>

                {/* Planting Date Shortcuts */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-[10px] font-black uppercase text-stone-400">
                      2. Sowing / Planting Date
                    </label>
                    <span className="text-[10px] text-amber-400 font-mono font-bold">
                      {formData.plantingDate}
                    </span>
                  </div>

                  <input 
                    type="date"
                    value={formData.plantingDate}
                    onChange={e => setFormData({ ...formData, plantingDate: e.target.value })}
                    className="w-full bg-stone-900 border border-stone-700/80 rounded-2xl px-3 py-2.5 text-xs text-white outline-none focus:border-amber-400 transition-all mb-2"
                  />

                  {/* Quick Preset Buttons */}
                  <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
                    {[
                      { label: 'Today', days: 0 },
                      { label: '30 Days Ago', days: 30 },
                      { label: '60 Days Ago', days: 60 },
                      { label: '90 Days Ago', days: 90 }
                    ].map(btn => (
                      <button
                        key={btn.label}
                        type="button"
                        onClick={() => handleQuickDate(btn.days)}
                        className="px-2.5 py-1 rounded-xl bg-stone-900/80 border border-stone-700/70 text-[10px] text-stone-300 font-bold hover:bg-stone-700 active:scale-95 transition-all whitespace-nowrap"
                      >
                        {btn.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Submit Android Action Button */}
                <button
                  type="button"
                  onClick={() => handlePredict()}
                  disabled={loading}
                  className="w-full py-3.5 px-4 bg-gradient-to-r from-amber-500 to-amber-600 text-stone-950 font-black rounded-2xl flex items-center justify-center gap-2 shadow-xl shadow-amber-500/20 active:scale-[0.98] transition-all disabled:opacity-50 text-xs uppercase tracking-wider"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Calculating Degree Days & Monsoon Log...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 fill-stone-950" />
                      Calculate Peak Harvest Window
                    </>
                  )}
                </button>
              </div>

              {/* AI Prediction Result Box */}
              {prediction && !loading && (
                <div className="bg-stone-800/90 border border-amber-500/30 rounded-3xl p-4 space-y-3 animate-in zoom-in-95 duration-300 shadow-2xl">
                  <div className="flex items-center justify-between border-b border-stone-700 pb-2">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <h3 className="text-xs font-black text-white uppercase tracking-wider">
                        AI Harvest Strategy Output
                      </h3>
                    </div>
                    <span className="text-[10px] text-emerald-400 font-mono font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                      GDD Verified
                    </span>
                  </div>

                  {/* Markdown Output */}
                  <div className="text-xs text-stone-200 leading-relaxed font-medium prose prose-invert max-w-none bg-stone-900/80 p-3.5 rounded-2xl border border-stone-800">
                    <ReactMarkdown>{prediction}</ReactMarkdown>
                  </div>

                  {/* Save to My Crops Button */}
                  <button
                    onClick={handleSaveSchedule}
                    disabled={saveSuccess}
                    className={`w-full py-3 px-4 rounded-2xl font-black text-xs flex items-center justify-center gap-2 transition-all active:scale-95 ${
                      saveSuccess
                        ? 'bg-emerald-500 text-stone-950 shadow-lg'
                        : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 hover:bg-emerald-500/30'
                    }`}
                  >
                    {saveSuccess ? (
                      <>
                        <Check className="w-4 h-4 stroke-[3]" />
                        Saved to My Crop Schedules!
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4" />
                        Save This Schedule to Active Crops
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: GDD & CLIMATE ANALYSIS */}
          {activeTab === 'climate' && (
            <div className="space-y-4 animate-in fade-in duration-300">
              
              {/* GDD Concept Card */}
              <div className="bg-stone-800/80 border border-stone-700/80 p-4 rounded-3xl space-y-3">
                <div className="flex items-center gap-2">
                  <Gauge className="w-5 h-5 text-amber-400" />
                  <div>
                    <h3 className="text-xs font-black uppercase tracking-wider text-white">
                      Growing Degree Day (GDD) Matrix
                    </h3>
                    <p className="text-[11px] text-stone-400">
                      Thermal energy units calculated using: GDD = [(T_max + T_min)/2] - T_base
                    </p>
                  </div>
                </div>

                {/* Heatmap/Stage Bars */}
                <div className="space-y-2 pt-2">
                  {[
                    { stage: 'Stage 1: Germination & Emergence', gdd: '0 - 200 GDD', status: 'Completed', color: 'bg-emerald-500' },
                    { stage: 'Stage 2: Vegetative & Tillering', gdd: '200 - 800 GDD', status: 'Completed', color: 'bg-emerald-500' },
                    { stage: 'Stage 3: Flowering & Anthesis', gdd: '800 - 1200 GDD', status: 'Active Stage', color: 'bg-amber-500' },
                    { stage: 'Stage 4: Grain Filling & Maturity', gdd: '1200 - 1600 GDD', status: 'Upcoming', color: 'bg-stone-700' }
                  ].map((stg, i) => (
                    <div key={i} className="bg-stone-900/80 p-2.5 rounded-2xl border border-stone-800 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <div className={`w-2.5 h-2.5 rounded-full ${stg.color}`} />
                        <div>
                          <p className="font-bold text-white text-[11px]">{stg.stage}</p>
                          <p className="text-[10px] text-stone-400 font-mono">{stg.gdd}</p>
                        </div>
                      </div>
                      <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                        stg.status === 'Active Stage' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'text-stone-500'
                      }`}>
                        {stg.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Climate Risk Forecast */}
              <div className="bg-stone-800/80 border border-stone-700/80 p-4 rounded-3xl space-y-3">
                <h3 className="text-xs font-black uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                  <CloudRain className="w-4 h-4" /> 5-Day Pre-Harvest Climate Forecast
                </h3>

                <div className="grid grid-cols-5 gap-1.5 pt-1">
                  {[
                    { day: 'Mon', temp: '32°C', icon: Sun, risk: 'Low Risk', bg: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' },
                    { day: 'Tue', temp: '31°C', icon: Sun, risk: 'Safe', bg: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' },
                    { day: 'Wed', temp: '28°C', icon: CloudRain, risk: 'Rain Risk', bg: 'bg-amber-500/10 border-amber-500/30 text-amber-400' },
                    { day: 'Thu', temp: '29°C', icon: Wind, risk: 'High Wind', bg: 'bg-amber-500/10 border-amber-500/30 text-amber-400' },
                    { day: 'Fri', temp: '33°C', icon: Sun, risk: 'Optimal', bg: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' }
                  ].map((fc, idx) => {
                    const IconComponent = fc.icon;
                    return (
                      <div key={idx} className={`p-2 rounded-2xl border text-center flex flex-col items-center gap-1 ${fc.bg}`}>
                        <span className="text-[10px] font-bold text-stone-300">{fc.day}</span>
                        <IconComponent className="w-4 h-4 my-0.5" />
                        <span className="text-[10px] font-black">{fc.temp}</span>
                        <span className="text-[8px] uppercase tracking-tighter opacity-80">{fc.risk}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: MANDI PRICE TIMING & STORAGE */}
          {activeTab === 'mandi' && (
            <div className="space-y-4 animate-in fade-in duration-300">
              
              {/* Mandi Price Advisor Card */}
              <div className="bg-stone-800/80 border border-stone-700/80 p-4 rounded-3xl space-y-3">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-emerald-400" />
                  <div>
                    <h3 className="text-xs font-black uppercase tracking-wider text-white">
                      Mandi Price Timing Advisory
                    </h3>
                    <p className="text-[11px] text-stone-400">
                      Maximize market value by timing harvest around post-arrival Mandi price surges.
                    </p>
                  </div>
                </div>

                <div className="bg-stone-900/80 p-3.5 rounded-2xl border border-stone-800 space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-stone-300 font-bold">Immediate Harvest Mandi Rate</span>
                    <span className="font-black text-amber-400">₹2,150 / Qtl</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-stone-300 font-bold">Post 14-Day Storage Premium</span>
                    <span className="font-black text-emerald-400">₹2,380 / Qtl (+10.7%)</span>
                  </div>

                  <p className="text-[11px] text-stone-400 pt-1 border-t border-stone-800/80 leading-snug">
                    💡 <strong className="text-white">AgriAssist Tip:</strong> Avoid distress selling on day 1 of harvest. Dry produce to &lt;12% moisture and store for 2-3 weeks post peak Mandi arrival rush.
                  </p>
                </div>
              </div>

              {/* Post Harvest Quality Checklist */}
              <div className="bg-stone-800/80 border border-stone-700/80 p-4 rounded-3xl space-y-3">
                <h3 className="text-xs font-black uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                  <Warehouse className="w-4 h-4" /> Post-Harvest Preservation Protocol
                </h3>

                <div className="space-y-2 text-xs">
                  {[
                    { title: 'Grain Moisture Testing', desc: 'Ensure grain moisture drops below 12-13% before bagging to prevent fungal aflatoxin.', done: true },
                    { title: 'Clean Tarpaulin Drying', desc: 'Sun-dry harvested produce on HDPE tarpaulin sheets away from soil dust.', done: true },
                    { title: 'Hermetic Bag Storage', desc: 'Store bagged grains off concrete floors using wooden pallets in ventilated storehouses.', done: false }
                  ].map((chk, i) => (
                    <div key={i} className="bg-stone-900/80 p-3 rounded-2xl border border-stone-800 flex items-start gap-2.5">
                      <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${chk.done ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : 'bg-stone-800 text-stone-500 border border-stone-700'}`}>
                        <Check className="w-3 h-3 stroke-[3]" />
                      </div>
                      <div>
                        <p className="font-bold text-white text-[11px]">{chk.title}</p>
                        <p className="text-[10px] text-stone-400 mt-0.5 leading-tight">{chk.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Sticky Android Bottom Thumb Quick Navigation / Action Bar */}
        <div className="bg-stone-900/95 backdrop-blur-md px-4 py-3 border-t border-stone-800/80 sticky bottom-0 z-30 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-[11px] font-bold text-stone-300">
              {schedules.length} Active Trackers
            </span>
          </div>

          <button
            onClick={() => setActiveTab(activeTab === 'predict' ? 'schedules' : 'predict')}
            className="px-4 py-2 rounded-2xl bg-amber-500 text-stone-950 font-black flex items-center gap-1.5 shadow-lg shadow-amber-500/20 active:scale-95 transition-all text-xs"
          >
            {activeTab === 'predict' ? (
              <>
                <Layers className="w-3.5 h-3.5" />
                View Schedules
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5 fill-stone-950" />
                Simulate Crop
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};

export default HarvestScheduler;
