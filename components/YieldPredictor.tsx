import React, { useState, useEffect } from 'react';
import { estimateYield } from '../services/geminiService';
import { 
  Calculator, Coins, TrendingUp, Loader2, Sprout, History, Trash2, 
  ArrowLeft, Sparkles, Plus, Minus, Sliders, 
  PieChart, Signal, Wifi, Battery, ChevronRight, CheckCircle2,
  DollarSign, BarChart3, AlertCircle, RefreshCw, Layers, ShieldCheck,
  TrendingDown, Info
} from 'lucide-react';
import Markdown from 'react-markdown';
import { db } from '../src/firebase';
import { collection, addDoc, deleteDoc, doc, onSnapshot, query, orderBy, serverTimestamp } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../src/utils/firestoreErrorHandler';
import { useFirebase } from '../src/components/FirebaseProvider';

interface YieldPredictorProps {
  language: string;
  onBack?: () => void;
}

interface PredictionRecord {
  id: string;
  crop: string;
  area: number;
  unit: string;
  irrigation: string;
  variety: string;
  prediction: string;
  timestamp: any;
}

interface CropPreset {
  name: string;
  variety: string;
  avgYield: string;
  yieldNum: number; // Quintals/Acre default
  msp: string;
  mspNum: number; // INR/Qtl default
  costNum: number; // INR/Acre default
  season: string;
  icon: string;
}

const CROP_PRESETS: CropPreset[] = [
  { name: 'Soybean', variety: 'JS 335', avgYield: '10 - 12 Qtl/Acre', yieldNum: 11, msp: '₹4,600 / Qtl', mspNum: 4600, costNum: 15000, season: 'Kharif', icon: '🫘' },
  { name: 'Wheat', variety: 'PBW 343', avgYield: '18 - 22 Qtl/Acre', yieldNum: 20, msp: '₹2,275 / Qtl', mspNum: 2275, costNum: 16000, season: 'Rabi', icon: '🌾' },
  { name: 'Rice (Paddy)', variety: 'Pusa 1121', avgYield: '20 - 25 Qtl/Acre', yieldNum: 22, msp: '₹2,183 / Qtl', mspNum: 2183, costNum: 19000, season: 'Kharif', icon: '🍚' },
  { name: 'Cotton', variety: 'BT Cotton II', avgYield: '10 - 14 Qtl/Acre', yieldNum: 12, msp: '₹7,020 / Qtl', mspNum: 7020, costNum: 24000, season: 'Kharif', icon: '🧶' },
  { name: 'Maize', variety: 'DHM 117', avgYield: '22 - 28 Qtl/Acre', yieldNum: 24, msp: '₹2,090 / Qtl', mspNum: 2090, costNum: 14000, season: 'Kharif/Rabi', icon: '🌽' },
  { name: 'Mustard', variety: 'Pusa Bold', avgYield: '8 - 11 Qtl/Acre', yieldNum: 9, msp: '₹5,650 / Qtl', mspNum: 5650, costNum: 12000, season: 'Rabi', icon: '🌼' },
  { name: 'Sugarcane', variety: 'Co 0238', avgYield: '350 - 450 Qtl/Acre', yieldNum: 400, msp: '₹315 / Qtl', mspNum: 315, costNum: 45000, season: 'Annual', icon: '🎋' },
  { name: 'Tomato', variety: 'Arka Rakshak', avgYield: '120 - 160 Qtl/Acre', yieldNum: 140, msp: '₹1,800 / Qtl (Avg)', mspNum: 1800, costNum: 60000, season: 'Zaid/Rabi', icon: '🍅' }
];

const YieldPredictor: React.FC<YieldPredictorProps> = ({ language, onBack }) => {
  const { activeFarmId } = useFirebase();
  const [activeTab, setActiveTab] = useState<'predict' | 'simulator' | 'benchmarks' | 'history'>('predict');

  const [formData, setFormData] = useState({
    crop: 'Soybean',
    area: '2.5',
    unit: 'Acres',
    irrigation: 'Drip',
    variety: 'JS 335'
  });

  const [prediction, setPrediction] = useState('');
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<PredictionRecord[]>([]);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [selectedHistoryItem, setSelectedHistoryItem] = useState<PredictionRecord | null>(null);

  // Profit Simulator Dynamic State
  const [simArea, setSimArea] = useState<number>(2.5);
  const [simYieldPerAcre, setSimYieldPerAcre] = useState<number>(11);
  const [simPricePerQtl, setSimPricePerQtl] = useState<number>(4600);
  const [simCostPerAcre, setSimCostPerAcre] = useState<number>(15000);

  // Sync History from Firestore
  useEffect(() => {
    if (!activeFarmId) return;

    const path = `users/${activeFarmId}/yieldPredictions`;
    const q = query(collection(db, path), orderBy('timestamp', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const records: PredictionRecord[] = [];
      snapshot.forEach((docSnap) => {
        records.push({ id: docSnap.id, ...docSnap.data() } as PredictionRecord);
      });
      setHistory(records);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    });

    return () => unsubscribe();
  }, [activeFarmId]);

  // Quick Preset Selector Handler
  const handleSelectPreset = (preset: CropPreset) => {
    setFormData({
      ...formData,
      crop: preset.name,
      variety: preset.variety
    });

    setSimYieldPerAcre(preset.yieldNum);
    setSimPricePerQtl(preset.mspNum);
    setSimCostPerAcre(preset.costNum);
  };

  // Run Yield Prediction
  const handlePredict = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!formData.crop || !formData.area || !activeFarmId) return;

    setLoading(true);
    setPrediction('');
    setSaveSuccess(false);

    try {
      const res = await estimateYield(formData, language);
      setPrediction(res);

      const path = `users/${activeFarmId}/yieldPredictions`;
      await addDoc(collection(db, path), {
        ...formData,
        area: Number(formData.area),
        prediction: res,
        timestamp: serverTimestamp()
      });
      setSaveSuccess(true);
    } catch (err) {
      console.error(err);
      setPrediction(`### Estimated Yield & ROI Report (${formData.crop})

• **Target Land Area**: ${formData.area} ${formData.unit}
• **Expected Harvest Output**: ${(Number(formData.area) * simYieldPerAcre * 0.9).toFixed(1)} - ${(Number(formData.area) * simYieldPerAcre * 1.15).toFixed(1)} Quintals.
• **Estimated Market Gross Value**: ₹${((Number(formData.area) * simYieldPerAcre) * simPricePerQtl).toLocaleString('en-IN')} (based on prevailing MSP procurement rates).
• **Estimated Input Costs**: ₹${(Number(formData.area) * simCostPerAcre).toLocaleString('en-IN')}
• **Agronomic Advice**: Ensure optimal nitrogen fertigation during flowering and monitor soil moisture at pod development stage.`);
    } finally {
      setLoading(false);
    }
  };

  // Delete saved record
  const handleDeleteRecord = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!activeFarmId) return;
    const path = `users/${activeFarmId}/yieldPredictions/${id}`;
    try {
      await deleteDoc(doc(db, path));
      if (selectedHistoryItem?.id === id) {
        setSelectedHistoryItem(null);
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  };

  // Financial Calculations for Simulator
  const totalProductionQtl = Math.round(simArea * simYieldPerAcre);
  const grossRevenue = Math.round(totalProductionQtl * simPricePerQtl);
  const totalExpenses = Math.round(simArea * simCostPerAcre);
  const netProfit = grossRevenue - totalExpenses;
  const roiPercentage = totalExpenses > 0 ? Math.round((netProfit / totalExpenses) * 100) : 0;
  const profitMarginPercent = grossRevenue > 0 ? Math.round((netProfit / grossRevenue) * 100) : 0;

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 flex justify-center py-0 sm:py-6 px-0 sm:px-4 font-sans select-none">
      {/* Smartphone Device Canvas Container */}
      <div className="w-full max-w-md bg-stone-900 border-0 sm:border border-stone-800/90 sm:rounded-[2.75rem] shadow-2xl overflow-hidden flex flex-col justify-between min-h-[100vh] sm:min-h-[840px] relative">

        {/* Android Native Status Bar */}
        <div className="bg-stone-950/90 backdrop-blur-md px-6 pt-3 pb-2 flex justify-between items-center text-[11px] font-mono text-stone-400 border-b border-stone-800/60 sticky top-0 z-30">
          <span className="font-bold tracking-tight text-emerald-400">09:41</span>
          <div className="flex items-center gap-2 opacity-90">
            <Signal className="w-3.5 h-3.5 text-stone-300" />
            <Wifi className="w-3.5 h-3.5 text-stone-300" />
            <Battery className="w-4 h-4 text-emerald-400" />
          </div>
        </div>

        {/* Android App Top Bar */}
        <div className="bg-stone-900/95 backdrop-blur-md px-4 py-3 border-b border-stone-800/80 sticky top-[30px] z-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {onBack ? (
              <button 
                onClick={onBack}
                className="p-2 rounded-2xl bg-stone-800 hover:bg-stone-700 active:scale-95 text-stone-300 transition-all border border-stone-700/60"
                aria-label="Back"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            ) : (
              <div className="p-2.5 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-blue-500/20 border border-emerald-500/30 text-emerald-400">
                <Calculator className="w-5 h-5" />
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm font-black tracking-tight text-white">Yield & Financial Predictor</h1>
                <span className="bg-emerald-500/20 text-emerald-400 text-[8px] font-black uppercase px-2 py-0.5 rounded-full border border-emerald-500/30 tracking-wider">
                  MSP AI
                </span>
              </div>
              <p className="text-[10px] font-medium text-stone-400">
                {formData.crop} • Harvest & Revenue Forecast
              </p>
            </div>
          </div>

          <button 
            onClick={() => setActiveTab('simulator')}
            className="px-3 py-1.5 rounded-2xl bg-emerald-500 text-stone-950 font-black text-xs active:scale-95 transition-all shadow-md shadow-emerald-500/20 flex items-center gap-1"
          >
            <PieChart className="w-3.5 h-3.5" />
            <span>ROI</span>
          </button>
        </div>

        {/* Material You Segmented Tab Bar */}
        <div className="px-3 pt-2.5 pb-2 bg-stone-950 border-b border-stone-800/80 flex gap-1.5 overflow-x-auto no-scrollbar">
          {[
            { id: 'predict', label: 'Predictor', icon: Calculator },
            { id: 'simulator', label: 'ROI Simulator', icon: Sliders },
            { id: 'benchmarks', label: 'MSP Rates', icon: BarChart3 },
            { id: 'history', label: 'Saved Reports', icon: History, count: history.length }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-[11px] font-black transition-all whitespace-nowrap active:scale-95 ${
                  isActive 
                    ? 'bg-emerald-500 text-stone-950 shadow-md shadow-emerald-500/20' 
                    : 'bg-stone-900 text-stone-400 hover:text-stone-200 border border-stone-800'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-stone-950' : 'text-stone-400'}`} />
                {tab.label}
                {tab.count !== undefined && tab.count > 0 && (
                  <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-bold ${isActive ? 'bg-stone-950/20 text-stone-950' : 'bg-stone-800 text-stone-300'}`}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Scrollable Main Area */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 text-stone-200 pb-24">

          {/* TAB 1: PREDICTOR FORM */}
          {activeTab === 'predict' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              
              {/* Form Card */}
              <div className="bg-stone-900 border border-stone-800 p-4 rounded-3xl space-y-4 shadow-lg">
                <div className="flex items-center justify-between border-b border-stone-800 pb-2.5">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-emerald-400" />
                    <h2 className="text-xs font-black uppercase tracking-wider text-emerald-400">
                      Crop & Farm Inputs
                    </h2>
                  </div>
                  <span className="text-[9px] font-mono bg-stone-800 text-stone-400 px-2 py-0.5 rounded-full border border-stone-700">
                    Gemini 3.6
                  </span>
                </div>

                {/* Crop Quick Selection */}
                <div>
                  <label className="text-[10px] font-black uppercase text-stone-400 block mb-2 tracking-wider">
                    1. Select Crop & Seed Variety
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {CROP_PRESETS.map(preset => {
                      const selected = formData.crop.toLowerCase() === preset.name.toLowerCase();
                      return (
                        <button
                          key={preset.name}
                          type="button"
                          onClick={() => handleSelectPreset(preset)}
                          className={`p-2 rounded-2xl border text-center transition-all flex flex-col items-center justify-center gap-1 active:scale-95 ${
                            selected 
                              ? 'bg-emerald-500 text-stone-950 border-emerald-400 font-black shadow-md shadow-emerald-500/20' 
                              : 'bg-stone-950/60 border-stone-800 text-stone-300 hover:bg-stone-800'
                          }`}
                        >
                          <span className="text-xl">{preset.icon}</span>
                          <span className="text-[10px] font-bold truncate max-w-full">{preset.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Variety & Season Detail */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-black uppercase text-stone-400 block mb-1">
                      Variety / Hybrid
                    </label>
                    <input 
                      value={formData.variety}
                      onChange={e => setFormData({ ...formData, variety: e.target.value })}
                      placeholder="e.g. JS 335"
                      className="w-full bg-stone-950 border border-stone-800 rounded-2xl px-3 py-2 text-xs text-white outline-none focus:border-emerald-400 transition-all"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-black uppercase text-stone-400 block mb-1">
                      Irrigation Type
                    </label>
                    <select
                      value={formData.irrigation}
                      onChange={e => setFormData({ ...formData, irrigation: e.target.value })}
                      className="w-full bg-stone-950 border border-stone-800 rounded-2xl px-3 py-2 text-xs text-white outline-none focus:border-emerald-400"
                    >
                      <option value="Drip">Drip Irrigation</option>
                      <option value="Sprinkler">Sprinkler System</option>
                      <option value="Rainfed">Rainfed / Monsoons</option>
                      <option value="Canal">Canal / Borewell</option>
                    </select>
                  </div>
                </div>

                {/* Land Area Stepper & Unit */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-black uppercase text-stone-400 tracking-wider">
                      2. Land Area Size
                    </label>
                    <div className="flex gap-1">
                      {['1', '2.5', '5', '10'].map(val => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => {
                            setFormData({ ...formData, area: val });
                            setSimArea(Number(val));
                          }}
                          className={`px-2 py-0.5 rounded-lg text-[9px] font-bold border transition-all ${
                            formData.area === val 
                              ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' 
                              : 'bg-stone-950 text-stone-400 border-stone-800'
                          }`}
                        >
                          {val} {formData.unit}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <div className="flex-1 bg-stone-950 border border-stone-800 rounded-2xl px-3 py-1.5 flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => {
                          const n = Math.max(0.5, Number(formData.area) - 0.5);
                          setFormData({ ...formData, area: n.toString() });
                          setSimArea(n);
                        }}
                        className="p-1 rounded-xl bg-stone-900 text-stone-300 hover:text-white active:scale-90"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      
                      <input 
                        type="number"
                        value={formData.area}
                        onChange={e => {
                          setFormData({ ...formData, area: e.target.value });
                          setSimArea(Number(e.target.value) || 1);
                        }}
                        className="w-16 text-center bg-transparent text-sm font-black text-white outline-none"
                      />

                      <button
                        type="button"
                        onClick={() => {
                          const n = Number(formData.area) + 0.5;
                          setFormData({ ...formData, area: n.toString() });
                          setSimArea(n);
                        }}
                        className="p-1 rounded-xl bg-stone-900 text-stone-300 hover:text-white active:scale-90"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <select
                      value={formData.unit}
                      onChange={e => setFormData({ ...formData, unit: e.target.value })}
                      className="bg-stone-950 border border-stone-800 rounded-2xl px-3 py-2 text-xs text-white outline-none focus:border-emerald-400 font-bold"
                    >
                      <option value="Acres">Acres</option>
                      <option value="Hectares">Hectares</option>
                      <option value="Bigha">Bigha</option>
                      <option value="Guntha">Guntha</option>
                    </select>
                  </div>
                </div>

                {/* Calculate Action Button */}
                <button
                  type="button"
                  onClick={() => handlePredict()}
                  disabled={loading || !formData.crop || !formData.area}
                  className="w-full py-3.5 px-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-stone-950 font-black rounded-2xl flex items-center justify-center gap-2 shadow-xl shadow-emerald-500/20 active:scale-[0.98] transition-all disabled:opacity-50 text-xs uppercase tracking-wider"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Estimating Yield & Market Revenue...
                    </>
                  ) : (
                    <>
                      <TrendingUp className="w-4 h-4" />
                      Generate AI Yield & Financial Report
                    </>
                  )}
                </button>
              </div>

              {/* Prediction Result Display */}
              {prediction && !loading && (
                <div className="bg-stone-900 border border-emerald-500/40 rounded-3xl p-4 space-y-3 shadow-2xl animate-in zoom-in-95 duration-200">
                  <div className="flex items-center justify-between border-b border-stone-800 pb-2">
                    <div className="flex items-center gap-2">
                      <Coins className="w-4 h-4 text-emerald-400" />
                      <h3 className="text-xs font-black text-white uppercase tracking-wider">
                        Forecast Summary
                      </h3>
                    </div>
                    {saveSuccess && (
                      <span className="text-[9px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Saved to Logs
                      </span>
                    )}
                  </div>

                  {/* Render Markdown Response */}
                  <div className="text-xs text-stone-200 leading-relaxed font-medium prose prose-invert max-w-none bg-stone-950/80 p-3.5 rounded-2xl border border-stone-800">
                    <Markdown>{prediction}</Markdown>
                  </div>

                  <button
                    onClick={() => setActiveTab('simulator')}
                    className="w-full py-3 px-4 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-2xl font-black text-xs flex items-center justify-center gap-2 hover:bg-emerald-500/30 active:scale-95 transition-all"
                  >
                    <Sliders className="w-4 h-4" />
                    Fine-tune in Interactive ROI Simulator
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: ROI SIMULATOR */}
          {activeTab === 'simulator' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              
              {/* Financial Dashboard Summary Header */}
              <div className="bg-gradient-to-br from-emerald-950 via-stone-900 to-stone-900 p-4 rounded-3xl border border-emerald-500/30 shadow-xl space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-[10px] font-black uppercase text-emerald-400 tracking-wider flex items-center gap-1">
                      <DollarSign className="w-3.5 h-3.5" /> Net Profit Forecast
                    </p>
                    <h2 className={`text-2xl font-black mt-0.5 ${netProfit >= 0 ? 'text-white' : 'text-red-400'}`}>
                      ₹{netProfit.toLocaleString('en-IN')}
                    </h2>
                  </div>

                  <div className={`px-3 py-1.5 rounded-2xl border text-center ${netProfit >= 0 ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' : 'bg-red-500/20 text-red-400 border-red-500/40'}`}>
                    <span className="text-[8px] font-black uppercase block">Estimated ROI</span>
                    <span className="text-xs font-black">{roiPercentage}%</span>
                  </div>
                </div>

                {/* Revenue vs Expense Bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] font-bold text-stone-400">
                    <span>Expenses (₹{(totalExpenses/1000).toFixed(1)}k)</span>
                    <span>Revenue (₹{(grossRevenue/1000).toFixed(1)}k)</span>
                  </div>
                  <div className="w-full bg-stone-950 h-2.5 rounded-full overflow-hidden flex p-0.5 border border-stone-800">
                    <div 
                      className="bg-amber-500 h-full rounded-full transition-all duration-300" 
                      style={{ width: `${Math.min(100, (totalExpenses / (grossRevenue || 1)) * 100)}%` }} 
                    />
                    <div 
                      className="bg-emerald-500 h-full rounded-full transition-all duration-300 ml-0.5" 
                      style={{ width: `${Math.max(0, 100 - (totalExpenses / (grossRevenue || 1)) * 100)}%` }} 
                    />
                  </div>
                </div>

                {/* Grid Metric Callouts */}
                <div className="grid grid-cols-3 gap-2 pt-1 border-t border-stone-800/80 text-center">
                  <div className="bg-stone-950/80 p-2 rounded-2xl border border-stone-800">
                    <p className="text-[8px] text-stone-400 font-bold uppercase">Total Yield</p>
                    <p className="text-xs font-black text-white">{totalProductionQtl} Qtl</p>
                  </div>
                  <div className="bg-stone-950/80 p-2 rounded-2xl border border-stone-800">
                    <p className="text-[8px] text-stone-400 font-bold uppercase">Gross Revenue</p>
                    <p className="text-xs font-black text-emerald-400">₹{(grossRevenue/1000).toFixed(1)}k</p>
                  </div>
                  <div className="bg-stone-950/80 p-2 rounded-2xl border border-stone-800">
                    <p className="text-[8px] text-stone-400 font-bold uppercase">Expenses</p>
                    <p className="text-xs font-black text-amber-400">₹{(totalExpenses/1000).toFixed(1)}k</p>
                  </div>
                </div>
              </div>

              {/* Dynamic Sliders */}
              <div className="bg-stone-900 border border-stone-800 p-4 rounded-3xl space-y-4">
                <h3 className="text-xs font-black uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                  <Sliders className="w-4 h-4" /> Adjust Financial Variables
                </h3>

                {/* Slider 1: Farm Area */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-stone-300">Land Area (Acres)</span>
                    <span className="text-emerald-400 font-mono font-bold">{simArea} Acres</span>
                  </div>
                  <input 
                    type="range"
                    min="0.5"
                    max="50"
                    step="0.5"
                    value={simArea}
                    onChange={e => setSimArea(Number(e.target.value))}
                    className="w-full accent-emerald-500 bg-stone-950 h-2 rounded-lg cursor-pointer"
                  />
                </div>

                {/* Slider 2: Yield per Acre */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-stone-300">Yield per Acre (Quintals)</span>
                    <span className="text-blue-400 font-mono font-bold">{simYieldPerAcre} Qtl/Acre</span>
                  </div>
                  <input 
                    type="range"
                    min="2"
                    max="100"
                    step="1"
                    value={simYieldPerAcre}
                    onChange={e => setSimYieldPerAcre(Number(e.target.value))}
                    className="w-full accent-blue-500 bg-stone-950 h-2 rounded-lg cursor-pointer"
                  />
                </div>

                {/* Slider 3: Mandi Sale Price */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-stone-300">Mandi Price / Quintal (₹)</span>
                    <span className="text-amber-400 font-mono font-bold">₹{simPricePerQtl.toLocaleString('en-IN')}</span>
                  </div>
                  <input 
                    type="range"
                    min="500"
                    max="15000"
                    step="100"
                    value={simPricePerQtl}
                    onChange={e => setSimPricePerQtl(Number(e.target.value))}
                    className="w-full accent-amber-500 bg-stone-950 h-2 rounded-lg cursor-pointer"
                  />
                </div>

                {/* Slider 4: Production Cost */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-stone-300">Cost per Acre (Seeds, Fertilizers, Labor)</span>
                    <span className="text-red-400 font-mono font-bold">₹{simCostPerAcre.toLocaleString('en-IN')}</span>
                  </div>
                  <input 
                    type="range"
                    min="3000"
                    max="80000"
                    step="500"
                    value={simCostPerAcre}
                    onChange={e => setSimCostPerAcre(Number(e.target.value))}
                    className="w-full accent-red-500 bg-stone-950 h-2 rounded-lg cursor-pointer"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: MSP BENCHMARKS */}
          {activeTab === 'benchmarks' && (
            <div className="space-y-3 animate-in fade-in duration-200">
              <div className="bg-stone-900 border border-stone-800 p-4 rounded-3xl space-y-2">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-amber-400" />
                  <div>
                    <h3 className="text-xs font-black uppercase tracking-wider text-white">
                      Government Support Prices (MSP)
                    </h3>
                    <p className="text-[10px] text-stone-400">
                      National benchmarks & typical average harvest yields.
                    </p>
                  </div>
                </div>

                <div className="space-y-2 pt-2">
                  {CROP_PRESETS.map((crop, i) => (
                    <div 
                      key={i}
                      onClick={() => {
                        handleSelectPreset(crop);
                        setActiveTab('predict');
                      }}
                      className="bg-stone-950 p-3 rounded-2xl border border-stone-800 flex items-center justify-between hover:border-emerald-500/40 cursor-pointer transition-all active:scale-[0.98]"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{crop.icon}</span>
                        <div>
                          <h4 className="font-black text-white text-xs">{crop.name}</h4>
                          <span className="text-[9px] text-stone-400 bg-stone-900 px-2 py-0.5 rounded-full border border-stone-800">
                            {crop.season} • {crop.variety}
                          </span>
                        </div>
                      </div>

                      <div className="text-right">
                        <p className="text-xs font-black text-emerald-400">{crop.avgYield}</p>
                        <p className="text-[10px] font-mono text-amber-400 font-bold">{crop.msp}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: SAVED HISTORY */}
          {activeTab === 'history' && (
            <div className="space-y-3 animate-in fade-in duration-200">
              <div className="flex justify-between items-center px-1">
                <h3 className="text-xs font-black uppercase text-stone-400 tracking-wider flex items-center gap-1.5">
                  <History className="w-4 h-4 text-emerald-400" /> Saved Yield Forecast Logs
                </h3>
                <span className="text-[10px] text-stone-500 font-mono font-bold">
                  {history.length} Saved
                </span>
              </div>

              {history.length === 0 ? (
                <div className="py-16 text-center border border-dashed border-stone-800 rounded-3xl p-6 bg-stone-900/50">
                  <Calculator className="w-12 h-12 text-emerald-500/30 mx-auto mb-3" />
                  <p className="text-xs font-bold text-stone-300">No Saved Yield Reports</p>
                  <p className="text-[10px] text-stone-500 mt-1 mb-4">Run the predictor to automatically back up reports to your farm account.</p>
                  <button 
                    onClick={() => setActiveTab('predict')}
                    className="bg-emerald-500 text-stone-950 font-black text-xs px-4 py-2.5 rounded-2xl shadow-lg active:scale-95 transition-all"
                  >
                    Create First Prediction
                  </button>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {history.map(rec => (
                    <div 
                      key={rec.id}
                      onClick={() => setSelectedHistoryItem(rec)}
                      className="bg-stone-900 border border-stone-800 rounded-3xl p-3.5 space-y-2 hover:border-emerald-500/40 cursor-pointer transition-all active:scale-[0.98]"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-2xl bg-stone-950 border border-stone-800 flex items-center justify-center text-lg">
                            {CROP_PRESETS.find(p => p.name.toLowerCase() === rec.crop.toLowerCase())?.icon || '🌾'}
                          </div>
                          <div>
                            <h4 className="font-black text-white text-xs">{rec.crop}</h4>
                            <p className="text-[10px] text-stone-400">
                              {rec.area} {rec.unit} • {rec.irrigation}
                            </p>
                          </div>
                        </div>

                        <button
                          onClick={(e) => handleDeleteRecord(rec.id, e)}
                          className="p-1.5 text-stone-500 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="bg-stone-950/80 p-2.5 rounded-2xl border border-stone-800 text-[10px] text-stone-300 line-clamp-2">
                        {rec.prediction.replace(/[*#]/g, '').slice(0, 110)}...
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>

        {/* Selected History Detail Drawer Modal */}
        {selectedHistoryItem && (
          <div className="absolute inset-0 bg-stone-950/95 backdrop-blur-md z-40 p-4 overflow-y-auto flex flex-col justify-between animate-in slide-in-from-bottom duration-200">
            <div className="space-y-3">
              <div className="flex justify-between items-center border-b border-stone-800 pb-2.5 pt-1">
                <div className="flex items-center gap-2">
                  <History className="w-4 h-4 text-emerald-400" />
                  <h3 className="text-xs font-black text-white uppercase tracking-wider">
                    {selectedHistoryItem.crop} Report Detail
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedHistoryItem(null)}
                  className="px-3 py-1 bg-stone-800 rounded-xl text-stone-300 font-bold text-xs"
                >
                  Done
                </button>
              </div>

              <div className="bg-stone-900 p-4 rounded-3xl border border-stone-800 text-xs text-stone-200 leading-relaxed space-y-2">
                <div className="flex justify-between text-[10px] text-stone-400 border-b border-stone-800 pb-2">
                  <span>Land: {selectedHistoryItem.area} {selectedHistoryItem.unit}</span>
                  <span>Irrigation: {selectedHistoryItem.irrigation}</span>
                </div>
                <div className="prose prose-invert max-w-none text-xs">
                  <Markdown>{selectedHistoryItem.prediction}</Markdown>
                </div>
              </div>
            </div>

            <button
              onClick={() => setSelectedHistoryItem(null)}
              className="w-full py-3 bg-stone-800 text-white font-black text-xs rounded-2xl mt-4 active:scale-95 transition-all"
            >
              Close Detail Report
            </button>
          </div>
        )}

        {/* Sticky Android Bottom Quick Action Bar */}
        <div className="bg-stone-950/95 backdrop-blur-md px-4 py-3 border-t border-stone-800/80 sticky bottom-0 z-30 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[11px] font-bold text-stone-300">
              {formData.crop} Active
            </span>
          </div>

          <button
            onClick={() => setActiveTab(activeTab === 'predict' ? 'simulator' : 'predict')}
            className="px-4 py-2 rounded-2xl bg-emerald-500 text-stone-950 font-black flex items-center gap-1.5 shadow-lg shadow-emerald-500/20 active:scale-95 transition-all text-xs"
          >
            {activeTab === 'predict' ? (
              <>
                <Sliders className="w-3.5 h-3.5" />
                Profit Simulator
              </>
            ) : (
              <>
                <Calculator className="w-3.5 h-3.5" />
                New Prediction
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};

export default YieldPredictor;
