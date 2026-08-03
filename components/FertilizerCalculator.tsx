import React, { useState, useEffect } from 'react';
import { 
  Calculator, 
  FlaskConical, 
  Sprout, 
  Layers, 
  Droplets, 
  Sparkles, 
  Loader2, 
  CheckCircle2, 
  Info, 
  Calendar, 
  ArrowRight, 
  Download, 
  Share2, 
  RotateCcw, 
  ShieldAlert, 
  Leaf, 
  Scale, 
  ChevronRight, 
  Lightbulb,
  ArrowLeft,
  DollarSign,
  TrendingUp,
  FileText,
  Save,
  Check,
  History,
  Trash2,
  Clock,
  RefreshCw,
  Plus,
  Minus,
  Sliders,
  ChevronDown
} from 'lucide-react';
import { getFertilizerAdvice } from '../services/geminiService';
import { useFirebase } from '../src/components/FirebaseProvider';
import { db } from '../src/firebase';
import { collection, addDoc, onSnapshot, query, orderBy, deleteDoc, doc } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../src/utils/firestoreErrorHandler';
import { showToast } from '../src/utils/toast';

interface FertilizerCalculatorProps {
  language?: string;
  onBack?: () => void;
}

interface SavedCalculation {
  id: string;
  crop: string;
  soilType: string;
  areaValue: number;
  areaUnit: string;
  totalAcres: number;
  reqN: number;
  reqP: number;
  reqK: number;
  ureaKg: number;
  dapKg: number;
  mopKg: number;
  totalEstCost: number;
  createdAt: string;
  notes?: string;
  aiAdvice?: string;
}

// Soil Type definitions and agronomic attributes
const SOIL_TYPES = [
  { id: 'loamy', name: 'Loamy Soil', desc: 'Balanced texture, ideal retention & drainage', nMod: 1.0, pMod: 1.0, kMod: 1.0, splitN: 2, icon: '🌱', badge: 'Optimal' },
  { id: 'clay', name: 'Clay Soil', desc: 'High water hold, slow drainage, high P-fixation', nMod: 0.95, pMod: 1.15, kMod: 1.0, splitN: 2, icon: '🧱', badge: 'High P Need' },
  { id: 'sandy', name: 'Sandy Soil', desc: 'Fast leaching, requires 3+ split doses', nMod: 1.15, pMod: 1.0, kMod: 1.1, splitN: 3, icon: '🏜️', badge: 'Split Doses' },
  { id: 'black', name: 'Black (Regur)', desc: 'Rich in Potash & Calcium, low Phosphorus', nMod: 1.0, pMod: 1.1, kMod: 0.85, splitN: 2, icon: '🌑', badge: 'Rich Potash' },
  { id: 'red', name: 'Red / Laterite', desc: 'Acidic, P-deficient, needs organic matter', nMod: 1.05, pMod: 1.2, kMod: 1.0, splitN: 3, icon: '🔴', badge: 'Lime Boost' },
  { id: 'alluvial', name: 'Alluvial Plain', desc: 'Fertile river soil, rich in K, low N', nMod: 1.05, pMod: 0.95, kMod: 0.9, splitN: 2, icon: '🌾', badge: 'High Fertility' },
  { id: 'acidic', name: 'Acidic Peaty', desc: 'High organic matter, low pH, needs lime', nMod: 1.0, pMod: 1.25, kMod: 1.05, splitN: 3, icon: '🧪', badge: 'Low pH' },
  { id: 'silt', name: 'Silt Soil', desc: 'Smooth, moisture retentive, fertile', nMod: 1.0, pMod: 1.0, kMod: 0.95, splitN: 2, icon: '🌊', badge: 'Balanced' }
];

// Crop NPK Database (kg/acre for baseline yield)
const CROPS = [
  { id: 'rice', name: 'Rice / Paddy', category: 'Cereals', n: 100, p: 50, k: 50, durationDays: 120, zincReq: true, emoji: '🌾' },
  { id: 'wheat', name: 'Wheat', category: 'Cereals', n: 120, p: 60, k: 40, durationDays: 135, zincReq: true, emoji: '🌾' },
  { id: 'maize', name: 'Maize / Corn', category: 'Cereals', n: 120, p: 60, k: 50, durationDays: 110, zincReq: true, emoji: '🌽' },
  { id: 'cotton', name: 'Cotton', category: 'Commercial', n: 120, p: 60, k: 60, durationDays: 160, zincReq: false, emoji: '☁️' },
  { id: 'sugarcane', name: 'Sugarcane', category: 'Commercial', n: 250, p: 115, k: 115, durationDays: 360, zincReq: true, emoji: '🎋' },
  { id: 'potato', name: 'Potato', category: 'Vegetables', n: 150, p: 100, k: 120, durationDays: 90, zincReq: true, emoji: '🥔' },
  { id: 'tomato', name: 'Tomato', category: 'Vegetables', n: 150, p: 100, k: 100, durationDays: 120, zincReq: false, emoji: '🍅' },
  { id: 'chili', name: 'Chili / Pepper', category: 'Spices', n: 120, p: 60, k: 60, durationDays: 150, zincReq: false, emoji: '🌶️' },
  { id: 'soybean', name: 'Soybean', category: 'Pulses/Oil', n: 30, p: 80, k: 40, durationDays: 100, zincReq: false, emoji: '🫘' },
  { id: 'groundnut', name: 'Groundnut', category: 'Oilseeds', n: 25, p: 50, k: 25, durationDays: 110, zincReq: false, emoji: '🥜' },
  { id: 'mustard', name: 'Mustard', category: 'Oilseeds', n: 80, p: 40, k: 40, durationDays: 110, zincReq: true, emoji: '🌼' },
  { id: 'pulses', name: 'Pulses / Chickpea', category: 'Pulses', n: 20, p: 50, k: 20, durationDays: 100, zincReq: false, emoji: '🌱' },
  { id: 'onion', name: 'Onion', category: 'Vegetables', n: 100, p: 50, k: 80, durationDays: 120, zincReq: false, emoji: '🧅' },
  { id: 'banana', name: 'Banana', category: 'Fruits', n: 200, p: 60, k: 250, durationDays: 330, zincReq: true, emoji: '🍌' },
  { id: 'custom', name: 'Custom Crop', category: 'General', n: 100, p: 50, k: 50, durationDays: 120, zincReq: false, emoji: '✏️' }
];

const AREA_UNITS = [
  { id: 'acre', label: 'Acre(s)', toAcres: 1.0 },
  { id: 'hectare', label: 'Hectare(s)', toAcres: 2.471 },
  { id: 'guntha', label: 'Guntha(s)', toAcres: 0.025 },
  { id: 'bigha', label: 'Bigha(s)', toAcres: 0.625 }
];

export const FertilizerCalculator: React.FC<FertilizerCalculatorProps> = ({ 
  language = 'English',
  onBack
}) => {
  const { activeFarmId, profile } = useFirebase();
  
  // Mobile Android View Mode
  const [activeTab, setActiveTab] = useState<'calc' | 'bags' | 'schedule' | 'ai' | 'history'>('calc');
  
  // Crop Category Filter
  const [cropCategory, setCropCategory] = useState<string>('All');

  // Inputs
  const [selectedCropId, setSelectedCropId] = useState<string>('rice');
  const [customCropName, setCustomCropName] = useState<string>('');
  const [selectedSoilId, setSelectedSoilId] = useState<string>('loamy');
  const [areaValue, setAreaValue] = useState<number>(1);
  const [areaUnit, setAreaUnit] = useState<string>('acre');
  const [yieldGoal, setYieldGoal] = useState<'standard' | 'high' | 'eco'>('standard');
  const [soilTestStatus, setSoilTestStatus] = useState<{ n: 'low' | 'medium' | 'high'; p: 'low' | 'medium' | 'high'; k: 'low' | 'medium' | 'high' }>({
    n: 'medium',
    p: 'medium',
    k: 'medium'
  });

  // AI & Extra advice states
  const [aiAnalysis, setAiAnalysis] = useState<any>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // History state
  const [historyList, setHistoryList] = useState<SavedCalculation[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState<boolean>(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Fetch past calculations history from Firestore
  useEffect(() => {
    if (!activeFarmId) {
      setHistoryList([]);
      setIsLoadingHistory(false);
      return;
    }

    const colPath = `users/${activeFarmId}/fertilizerCalculations`;
    const q = query(collection(db, colPath), orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items: SavedCalculation[] = snapshot.docs.map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data()
      } as SavedCalculation));
      setHistoryList(items);
      setIsLoadingHistory(false);
    }, (error) => {
      console.error('Error fetching calculation history:', error);
      setIsLoadingHistory(false);
    });

    return () => unsubscribe();
  }, [activeFarmId]);

  // Active crop object
  const activeCrop = CROPS.find(c => c.id === selectedCropId) || CROPS[0];
  const activeSoil = SOIL_TYPES.find(s => s.id === selectedSoilId) || SOIL_TYPES[0];
  const unitObj = AREA_UNITS.find(u => u.id === areaUnit) || AREA_UNITS[0];

  const effectiveCropName = selectedCropId === 'custom' ? (customCropName || 'Custom Crop') : activeCrop.name;
  const totalAcres = Math.max(0.01, areaValue * unitObj.toAcres);

  // Soil health status multipliers
  const soilStatusMult = (val: 'low' | 'medium' | 'high') => {
    if (val === 'low') return 1.25; // add 25% if soil test is low
    if (val === 'high') return 0.75; // reduce 25% if soil test is high
    return 1.0;
  };

  const yieldGoalMult = yieldGoal === 'high' ? 1.2 : yieldGoal === 'eco' ? 0.9 : 1.0;

  // Calculate Required Pure Nutrients in Kg for total land area
  const reqN = Math.round(activeCrop.n * activeSoil.nMod * soilStatusMult(soilTestStatus.n) * yieldGoalMult * totalAcres);
  const reqP = Math.round(activeCrop.p * activeSoil.pMod * soilStatusMult(soilTestStatus.p) * yieldGoalMult * totalAcres);
  const reqK = Math.round(activeCrop.k * activeSoil.kMod * soilStatusMult(soilTestStatus.k) * yieldGoalMult * totalAcres);

  // Calculate Commercial Fertilizer Quantities:
  // Option A: DAP + Urea + MOP
  // DAP (18% N, 46% P2O5)
  const dapKg = Math.round(reqP / 0.46);
  const nFromDap = Math.round(dapKg * 0.18);
  const remainingN = Math.max(0, reqN - nFromDap);
  const ureaKg = Math.round(remainingN / 0.46); // Urea is 46% N
  const mopKg = Math.round(reqK / 0.60); // MOP is 60% K2O

  const ureaBags = (ureaKg / 45).toFixed(1); // 45kg bag standard in India
  const dapBags = (dapKg / 50).toFixed(1); // 50kg bag
  const mopBags = (mopKg / 50).toFixed(1); // 50kg bag

  // Option B: NPK Complex 10-26-26 + Urea
  const npkComplexKg = Math.round(reqP / 0.26);
  const nFromComplex = Math.round(npkComplexKg * 0.10);
  const kFromComplex = Math.round(npkComplexKg * 0.26);
  const remNForComplex = Math.max(0, reqN - nFromComplex);
  const ureaForComplexKg = Math.round(remNForComplex / 0.46);
  const remKForComplex = Math.max(0, reqK - kFromComplex);
  const mopForComplexKg = Math.round(remKForComplex / 0.60);

  // Estimated Government Subsidized Price Estimation (Approx Indian Market)
  // Urea: ~₹267 / 45kg bag, DAP: ~₹1350 / 50kg bag, MOP: ~₹1700 / 50kg bag
  const estCostUrea = Math.round((ureaKg / 45) * 267);
  const estCostDap = Math.round((dapKg / 50) * 1350);
  const estCostMop = Math.round((mopKg / 50) * 1700);
  const totalEstCost = estCostUrea + estCostDap + estCostMop;

  // Stages Application Schedule
  const basalDap = dapKg;
  const basalMop = mopKg;
  const basalUrea = Math.round(ureaKg * 0.25);
  const vegUrea = Math.round(ureaKg * 0.45);
  const flowerUrea = Math.round(ureaKg * 0.30);

  // Trigger Gemini AI Expert Agronomist
  const handleFetchAiAnalysis = async () => {
    setIsAiLoading(true);
    setActiveTab('ai');
    try {
      const res = await getFertilizerAdvice(
        `${effectiveCropName} (${areaValue} ${unitObj.label})`,
        profile?.state || 'India',
        activeSoil.name,
        language
      );
      setAiAnalysis(res);
      showToast('AI Fertilizer Optimization Generated');
    } catch (err) {
      console.error(err);
      showToast('Failed to fetch AI analysis', 'long');
    } finally {
      setIsAiLoading(false);
    }
  };

  // Save calculation to Firebase
  const handleSaveCalculation = async () => {
    if (!activeFarmId) {
      showToast('Please log in to save fertilizer calculations', 'long');
      return;
    }
    setIsSaving(true);
    const calcPath = `users/${activeFarmId}/fertilizerCalculations`;
    const journalPath = `users/${activeFarmId}/journal`;

    try {
      await addDoc(collection(db, calcPath), {
        crop: effectiveCropName,
        soilType: activeSoil.name,
        areaValue: areaValue,
        areaUnit: unitObj.label,
        totalAcres: parseFloat(totalAcres.toFixed(2)),
        reqN,
        reqP,
        reqK,
        ureaKg,
        dapKg,
        mopKg,
        totalEstCost,
        createdAt: new Date().toISOString(),
        notes: `Target NPK: N:${reqN}kg, P:${reqP}kg, K:${reqK}kg | Urea: ${ureaBags} bags, DAP: ${dapBags} bags, MOP: ${mopBags} bags`,
        aiAdvice: aiAnalysis?.cropRequirements || undefined
      });

      await addDoc(collection(db, journalPath), {
        date: new Date().toISOString().split('T')[0],
        category: 'Fertilizer',
        crop: effectiveCropName,
        notes: `Fertilizer Calculation for ${areaValue} ${unitObj.label} (${activeSoil.name}):
- Target NPK: N:${reqN}kg, P:${reqP}kg, K:${reqK}kg
- Urea: ${ureaKg} kg (${ureaBags} bags)
- DAP: ${dapKg} kg (${dapBags} bags)
- MOP: ${mopKg} kg (${mopBags} bags)
- Est. Cost: ₹${totalEstCost.toLocaleString('en-IN')}`,
        createdAt: new Date().toISOString()
      });

      setSavedSuccess(true);
      showToast('Saved to profile & history!');
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, calcPath);
    } finally {
      setIsSaving(false);
    }
  };

  // Delete calculation from history
  const handleDeleteHistory = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!activeFarmId) return;
    setDeletingId(id);
    const docPath = `users/${activeFarmId}/fertilizerCalculations/${id}`;
    try {
      await deleteDoc(doc(db, docPath));
      showToast('Calculation removed from history');
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, docPath);
    } finally {
      setDeletingId(null);
    }
  };

  // Load a historical calculation item into current parameters
  const handleLoadHistoryItem = (calc: SavedCalculation) => {
    const matchedCrop = CROPS.find(c => c.name.toLowerCase() === calc.crop.toLowerCase());
    if (matchedCrop) {
      setSelectedCropId(matchedCrop.id);
      setCustomCropName('');
    } else {
      setSelectedCropId('custom');
      setCustomCropName(calc.crop);
    }

    const matchedSoil = SOIL_TYPES.find(s => s.name.toLowerCase() === calc.soilType.toLowerCase());
    if (matchedSoil) {
      setSelectedSoilId(matchedSoil.id);
    }

    if (calc.areaValue) setAreaValue(calc.areaValue);
    if (calc.areaUnit) {
      const matchedUnit = AREA_UNITS.find(u => u.label.toLowerCase() === calc.areaUnit.toLowerCase() || u.id.toLowerCase() === calc.areaUnit.toLowerCase());
      if (matchedUnit) setAreaUnit(matchedUnit.id);
    }

    setActiveTab('calc');
    showToast(`Loaded parameters for ${calc.crop}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Categories for Crop Filter
  const categories = ['All', 'Cereals', 'Commercial', 'Vegetables', 'Pulses/Oil'];
  const filteredCrops = cropCategory === 'All' 
    ? CROPS 
    : CROPS.filter(c => c.category === cropCategory || c.id === 'custom');

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
            <Calculator className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-black text-white tracking-tight leading-none">Fertilizer Calc</h1>
            <p className="text-[10px] text-emerald-400 font-mono mt-0.5">{effectiveCropName} • {activeSoil.name}</p>
          </div>
        </div>

        <button
          onClick={handleSaveCalculation}
          disabled={isSaving}
          className="px-3 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-black text-xs flex items-center gap-1.5 shadow-md transition-all active:scale-95 disabled:opacity-50 min-h-[40px]"
        >
          {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : savedSuccess ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          <span>{savedSuccess ? 'Saved' : 'Save'}</span>
        </button>
      </header>

      {/* Android Top Segmented Navigation Tabs */}
      <div className="px-3 py-2 bg-stone-950/80 border-b border-stone-850 sticky top-[57px] z-40 overflow-x-auto no-scrollbar">
        <div className="flex items-center gap-1.5 min-w-max">
          
          <button
            onClick={() => setActiveTab('calc')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 min-h-[44px] ${
              activeTab === 'calc'
                ? 'bg-emerald-500 text-stone-950 shadow-md shadow-emerald-950/50'
                : 'bg-stone-900 text-stone-400 hover:text-stone-200 border border-stone-800'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>Inputs & NPK</span>
          </button>

          <button
            onClick={() => setActiveTab('bags')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 min-h-[44px] ${
              activeTab === 'bags'
                ? 'bg-emerald-500 text-stone-950 shadow-md shadow-emerald-950/50'
                : 'bg-stone-900 text-stone-400 hover:text-stone-200 border border-stone-800'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Bag Dosage</span>
            <span className="text-[10px] bg-stone-950/80 text-emerald-300 font-mono px-1.5 py-0.5 rounded-md">
              {dapBags} DAP
            </span>
          </button>

          <button
            onClick={() => setActiveTab('schedule')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 min-h-[44px] ${
              activeTab === 'schedule'
                ? 'bg-emerald-500 text-stone-950 shadow-md shadow-emerald-950/50'
                : 'bg-stone-900 text-stone-400 hover:text-stone-200 border border-stone-800'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Split Timetable</span>
          </button>

          <button
            onClick={() => setActiveTab('ai')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 min-h-[44px] ${
              activeTab === 'ai'
                ? 'bg-amber-400 text-stone-950 shadow-md shadow-amber-950/50'
                : 'bg-stone-900 text-stone-400 hover:text-stone-200 border border-stone-800'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>AI Report</span>
            {aiAnalysis && <span className="w-2 h-2 rounded-full bg-emerald-400" />}
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 min-h-[44px] ${
              activeTab === 'history'
                ? 'bg-emerald-500 text-stone-950 shadow-md shadow-emerald-950/50'
                : 'bg-stone-900 text-stone-400 hover:text-stone-200 border border-stone-800'
            }`}
          >
            <History className="w-4 h-4" />
            <span>History ({historyList.length})</span>
          </button>

        </div>
      </div>

      <main className="px-3.5 sm:px-6 mt-4 space-y-5 max-w-3xl mx-auto w-full">

        {/* SUMMARY HERO BAR */}
        <div className="bg-gradient-to-br from-stone-900 via-stone-900/90 to-emerald-950/40 border border-stone-800/90 rounded-2xl p-4 shadow-xl flex items-center justify-between gap-3">
          <div className="space-y-1">
            <span className="text-[10px] font-black uppercase text-emerald-400 tracking-wider">Target NPK Requirement</span>
            <div className="flex items-baseline gap-2 font-mono">
              <span className="text-xl font-black text-emerald-400">{reqN}<span className="text-xs text-stone-400 font-normal">N</span></span>
              <span className="text-stone-600">:</span>
              <span className="text-xl font-black text-amber-400">{reqP}<span className="text-xs text-stone-400 font-normal">P</span></span>
              <span className="text-stone-600">:</span>
              <span className="text-xl font-black text-cyan-400">{reqK}<span className="text-xs text-stone-400 font-normal">K</span></span>
              <span className="text-xs text-stone-400 font-sans font-medium">kg/total</span>
            </div>
          </div>

          <div className="text-right border-l border-stone-800 pl-3">
            <span className="text-[10px] text-stone-400 block font-sans">Est. Cost</span>
            <span className="text-lg font-black text-amber-300 font-mono">₹{totalEstCost.toLocaleString('en-IN')}</span>
          </div>
        </div>

        {/* TAB 1: INPUTS & NPK TARGETS */}
        {activeTab === 'calc' && (
          <div className="space-y-5 animate-in fade-in duration-200">
            
            {/* 1. Crop Selection Carousel & Filter */}
            <div className="bg-stone-900/90 border border-stone-800 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-stone-200 flex items-center gap-1.5">
                  <Sprout className="w-4 h-4 text-emerald-400" />
                  Select Target Crop
                </label>
                <span className="text-[10px] text-emerald-400 font-mono bg-emerald-950 px-2 py-0.5 rounded border border-emerald-500/30">
                  {effectiveCropName}
                </span>
              </div>

              {/* Crop Category Pills */}
              <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1">
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setCropCategory(cat)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap transition-all ${
                      cropCategory === cat
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : 'bg-stone-950 text-stone-400 border border-stone-850 hover:text-white'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Horizontal Scrollable Crop Chips for Touch Ease */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-52 overflow-y-auto pr-1 no-scrollbar">
                {filteredCrops.map(c => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setSelectedCropId(c.id)}
                    className={`p-2.5 rounded-xl text-left transition-all border flex flex-col justify-between min-h-[52px] active:scale-95 ${
                      selectedCropId === c.id
                        ? 'bg-emerald-950 text-emerald-300 border-emerald-500/60 shadow-md font-bold'
                        : 'bg-stone-950 text-stone-300 border-stone-800 hover:bg-stone-850'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-xs truncate">{c.emoji} {c.name}</span>
                      {selectedCropId === c.id && <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                    </div>
                    <span className="text-[9px] font-mono text-stone-400">{c.n}:{c.p}:{c.k} NPK</span>
                  </button>
                ))}
              </div>

              {selectedCropId === 'custom' && (
                <input
                  type="text"
                  value={customCropName}
                  onChange={e => setCustomCropName(e.target.value)}
                  placeholder="Type custom crop name..."
                  className="w-full bg-stone-950 border border-emerald-500/50 rounded-xl p-3 text-xs text-white outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              )}
            </div>

            {/* 2. Soil Type Selection */}
            <div className="bg-stone-900/90 border border-stone-800 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-stone-200 flex items-center gap-1.5">
                  <FlaskConical className="w-4 h-4 text-amber-400" />
                  Soil Texture Classification
                </label>
                <span className="text-[10px] text-amber-300 bg-amber-950/80 px-2 py-0.5 rounded border border-amber-500/30">
                  {activeSoil.badge}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto no-scrollbar">
                {SOIL_TYPES.map(s => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setSelectedSoilId(s.id)}
                    className={`p-2.5 rounded-xl text-left transition-all border flex items-center justify-between min-h-[48px] active:scale-95 ${
                      selectedSoilId === s.id
                        ? 'bg-amber-950/90 text-amber-300 border-amber-500/60 font-bold shadow-md'
                        : 'bg-stone-950 text-stone-300 border-stone-800 hover:bg-stone-850'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className="text-base">{s.icon}</span>
                      <span className="text-xs truncate">{s.name}</span>
                    </div>
                  </button>
                ))}
              </div>

              <div className="p-2.5 bg-stone-950/60 rounded-xl border border-stone-850 text-[11px] text-stone-400 leading-relaxed">
                💡 <strong className="text-stone-200">{activeSoil.name}:</strong> {activeSoil.desc}
              </div>
            </div>

            {/* 3. Land Area Quick Stepper & Unit Toggles */}
            <div className="bg-stone-900/90 border border-stone-800 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-stone-200">Land Area Size</label>
                <span className="text-xs text-emerald-400 font-mono font-bold">
                  ≈ {totalAcres.toFixed(2)} Acres Total
                </span>
              </div>

              {/* Quick Stepper Bar for Android touch ease */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setAreaValue(prev => Math.max(0.1, parseFloat((prev - 0.5).toFixed(1))))}
                  className="w-11 h-11 rounded-xl bg-stone-950 border border-stone-800 text-stone-300 flex items-center justify-center font-bold text-lg active:scale-90"
                >
                  <Minus className="w-4 h-4" />
                </button>

                <div className="flex-1 bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-center">
                  <input
                    type="number"
                    step="0.5"
                    min="0.1"
                    value={areaValue}
                    onChange={e => setAreaValue(Math.max(0.1, parseFloat(e.target.value) || 0.1))}
                    className="w-full bg-transparent text-center text-lg font-black text-white outline-none"
                  />
                  <span className="text-[10px] text-stone-500 uppercase block font-bold">{unitObj.label}</span>
                </div>

                <button
                  type="button"
                  onClick={() => setAreaValue(prev => parseFloat((prev + 0.5).toFixed(1)))}
                  className="w-11 h-11 rounded-xl bg-stone-950 border border-stone-800 text-stone-300 flex items-center justify-center font-bold text-lg active:scale-90"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {/* Unit Badges */}
              <div className="grid grid-cols-4 gap-1.5 pt-1">
                {AREA_UNITS.map(u => (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => setAreaUnit(u.id)}
                    className={`py-2 rounded-xl text-xs font-bold text-center transition-all min-h-[40px] ${
                      areaUnit === u.id
                        ? 'bg-emerald-500 text-stone-950 shadow-sm'
                        : 'bg-stone-950 text-stone-400 border border-stone-850'
                    }`}
                  >
                    {u.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 4. Target Strategy & Soil Test Adjusters */}
            <div className="bg-stone-900/90 border border-stone-800 rounded-2xl p-4 space-y-3">
              <label className="text-xs font-bold text-stone-200 block">Yield Target Strategy</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setYieldGoal('standard')}
                  className={`p-2.5 rounded-xl text-center text-xs font-bold border transition-all min-h-[44px] ${
                    yieldGoal === 'standard'
                      ? 'bg-emerald-950 text-emerald-300 border-emerald-500/50 shadow-md'
                      : 'bg-stone-950 text-stone-400 border-stone-800'
                  }`}
                >
                  Standard
                  <span className="block text-[9px] font-normal opacity-70">100% Rec</span>
                </button>

                <button
                  type="button"
                  onClick={() => setYieldGoal('high')}
                  className={`p-2.5 rounded-xl text-center text-xs font-bold border transition-all min-h-[44px] ${
                    yieldGoal === 'high'
                      ? 'bg-amber-950 text-amber-300 border-amber-500/50 shadow-md'
                      : 'bg-stone-950 text-stone-400 border-stone-800'
                  }`}
                >
                  High Yield
                  <span className="block text-[9px] font-normal opacity-70">+20% Output</span>
                </button>

                <button
                  type="button"
                  onClick={() => setYieldGoal('eco')}
                  className={`p-2.5 rounded-xl text-center text-xs font-bold border transition-all min-h-[44px] ${
                    yieldGoal === 'eco'
                      ? 'bg-teal-950 text-teal-300 border-teal-500/50 shadow-md'
                      : 'bg-stone-950 text-stone-400 border-stone-800'
                  }`}
                >
                  Eco / Organic
                  <span className="block text-[9px] font-normal opacity-70">Soil Friendly</span>
                </button>
              </div>

              {/* Quick Soil Test Status Toggles */}
              <div className="pt-3 border-t border-stone-800 space-y-2">
                <span className="text-xs font-bold text-stone-300 block">
                  Soil Health Card Test Adjustments
                </span>
                <div className="grid grid-cols-3 gap-2">
                  {(['n', 'p', 'k'] as const).map(nutrient => (
                    <div key={nutrient} className="bg-stone-950 p-2 rounded-xl border border-stone-850 space-y-1">
                      <span className="text-[10px] font-black text-stone-400 uppercase block">
                        {nutrient === 'n' ? 'Nitrogen' : nutrient === 'p' ? 'Phosphorus' : 'Potassium'}
                      </span>
                      <div className="flex gap-1">
                        {(['low', 'medium', 'high'] as const).map(level => (
                          <button
                            key={level}
                            type="button"
                            onClick={() => setSoilTestStatus(prev => ({ ...prev, [nutrient]: level }))}
                            className={`flex-1 py-1 rounded text-[10px] font-bold uppercase ${
                              soilTestStatus[nutrient] === level
                                ? level === 'low' ? 'bg-rose-950 text-rose-300 border border-rose-500/40'
                                  : level === 'medium' ? 'bg-amber-950 text-amber-300 border border-amber-500/40'
                                  : 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                                : 'bg-stone-900 text-stone-500'
                            }`}
                          >
                            {level.charAt(0)}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Next Step Action CTA */}
            <button
              onClick={() => setActiveTab('bags')}
              className="w-full py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-black text-sm flex items-center justify-center gap-2 shadow-lg transition-all active:scale-98 min-h-[48px]"
            >
              <span>View Commercial Fertilizer Bag Dosage</span>
              <ChevronRight className="w-5 h-5" />
            </button>

          </div>
        )}

        {/* TAB 2: BAG DOSAGE (OPTION A & B) */}
        {activeTab === 'bags' && (
          <div className="space-y-5 animate-in fade-in duration-200">
            
            {/* Straight Fertilizers (Urea + DAP + MOP) */}
            <div className="bg-stone-900/90 border border-stone-800 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-stone-800 pb-2.5">
                <div>
                  <h3 className="text-xs font-extrabold text-white uppercase tracking-wider flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-emerald-400" />
                    Option A: Straight Fertilizers
                  </h3>
                  <p className="text-[10px] text-stone-400">Most widely available in Indian agricultural stores</p>
                </div>
                <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-500/30">
                  ≈ ₹{totalEstCost.toLocaleString('en-IN')}
                </span>
              </div>

              <div className="space-y-2.5">
                
                {/* Urea Card */}
                <div className="flex items-center justify-between bg-stone-950 p-3 rounded-xl border border-stone-850">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center text-xs border border-emerald-500/30">
                      U
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white">Neem Coated Urea (46% N)</h4>
                      <p className="text-[10px] text-stone-400">Standard 45 Kg Bag</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-black text-emerald-400">{ureaBags} Bags</span>
                    <span className="block text-[10px] text-stone-500 font-mono">({ureaKg} kg)</span>
                  </div>
                </div>

                {/* DAP Card */}
                <div className="flex items-center justify-between bg-stone-950 p-3 rounded-xl border border-stone-850">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 font-bold flex items-center justify-center text-xs border border-amber-500/30">
                      DAP
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white">Di-Ammonium Phosphate (18-46-0)</h4>
                      <p className="text-[10px] text-stone-400">Standard 50 Kg Bag</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-black text-amber-400">{dapBags} Bags</span>
                    <span className="block text-[10px] text-stone-500 font-mono">({dapKg} kg)</span>
                  </div>
                </div>

                {/* MOP Card */}
                <div className="flex items-center justify-between bg-stone-950 p-3 rounded-xl border border-stone-850">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-cyan-500/20 text-cyan-400 font-bold flex items-center justify-center text-xs border border-cyan-500/30">
                      MOP
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white">Muriate of Potash (60% K)</h4>
                      <p className="text-[10px] text-stone-400">Standard 50 Kg Bag</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-black text-cyan-400">{mopBags} Bags</span>
                    <span className="block text-[10px] text-stone-500 font-mono">({mopKg} kg)</span>
                  </div>
                </div>

              </div>
            </div>

            {/* Option B: Complex Mix */}
            <div className="bg-stone-900/90 border border-stone-800 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-stone-800 pb-2.5">
                <div>
                  <h3 className="text-xs font-extrabold text-white uppercase tracking-wider flex items-center gap-1.5">
                    <FlaskConical className="w-4 h-4 text-purple-400" />
                    Option B: NPK Complex 10-26-26
                  </h3>
                  <p className="text-[10px] text-stone-400">Single granule uniform application</p>
                </div>
                <span className="text-xs font-mono font-bold text-purple-300 bg-purple-950 px-2 py-0.5 rounded border border-purple-500/30">
                  Complex Mix
                </span>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between bg-stone-950 p-3 rounded-xl border border-stone-850">
                  <span className="text-xs font-bold text-stone-200">NPK 10-26-26 Complex</span>
                  <div className="text-right">
                    <span className="text-sm font-black text-purple-400">{(npkComplexKg / 50).toFixed(1)} Bags</span>
                    <span className="block text-[10px] text-stone-500 font-mono">({npkComplexKg} kg)</span>
                  </div>
                </div>

                <div className="flex items-center justify-between bg-stone-950 p-3 rounded-xl border border-stone-850">
                  <span className="text-xs font-bold text-stone-200">Urea Balance</span>
                  <div className="text-right">
                    <span className="text-sm font-black text-emerald-400">{(ureaForComplexKg / 45).toFixed(1)} Bags</span>
                    <span className="block text-[10px] text-stone-500 font-mono">({ureaForComplexKg} kg)</span>
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={() => setActiveTab('schedule')}
              className="w-full py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-black text-sm flex items-center justify-center gap-2 shadow-lg transition-all active:scale-98 min-h-[48px]"
            >
              <span>View Split Stage Timetable</span>
              <ChevronRight className="w-5 h-5" />
            </button>

          </div>
        )}

        {/* TAB 3: SPLIT SCHEDULE */}
        {activeTab === 'schedule' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="bg-stone-900/90 border border-stone-800 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-stone-800 pb-2">
                <h3 className="text-xs font-extrabold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-emerald-400" />
                  Stage-Wise Split Application Schedule
                </h3>
                <span className="text-[10px] text-emerald-400 font-mono bg-emerald-950 px-2 py-0.5 rounded border border-emerald-500/30">
                  {activeSoil.splitN} Doses
                </span>
              </div>

              <div className="space-y-3">
                {/* Stage 1 */}
                <div className="bg-stone-950 p-3.5 rounded-xl border border-stone-850 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase text-amber-400 bg-amber-950/80 px-2 py-0.5 rounded border border-amber-500/30">
                      Stage 1: Basal Dose
                    </span>
                    <span className="text-[10px] text-stone-500 font-mono">Day 0 (At Sowing)</span>
                  </div>
                  <ul className="text-xs text-stone-200 space-y-1 font-mono pt-1">
                    <li className="flex justify-between"><span>DAP (100%):</span> <strong className="text-amber-400">{basalDap} kg</strong></li>
                    <li className="flex justify-between"><span>MOP (100%):</span> <strong className="text-cyan-400">{basalMop} kg</strong></li>
                    <li className="flex justify-between"><span>Urea (25%):</span> <strong className="text-emerald-400">{basalUrea} kg</strong></li>
                  </ul>
                </div>

                {/* Stage 2 */}
                <div className="bg-stone-950 p-3.5 rounded-xl border border-stone-850 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-500/30">
                      Stage 2: Vegetative Growth
                    </span>
                    <span className="text-[10px] text-stone-500 font-mono">20-25 Days</span>
                  </div>
                  <ul className="text-xs text-stone-200 space-y-1 font-mono pt-1">
                    <li className="flex justify-between"><span>Urea (45%):</span> <strong className="text-emerald-400">{vegUrea} kg</strong></li>
                    {activeCrop.zincReq && (
                      <li className="flex justify-between text-yellow-300"><span>Zinc Sulphate:</span> <strong>10 kg / acre</strong></li>
                    )}
                  </ul>
                </div>

                {/* Stage 3 */}
                <div className="bg-stone-950 p-3.5 rounded-xl border border-stone-850 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase text-cyan-400 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-500/30">
                      Stage 3: Flowering / Grain Fill
                    </span>
                    <span className="text-[10px] text-stone-500 font-mono">45-50 Days</span>
                  </div>
                  <ul className="text-xs text-stone-200 space-y-1 font-mono pt-1">
                    <li className="flex justify-between"><span>Urea (30%):</span> <strong className="text-emerald-400">{flowerUrea} kg</strong></li>
                  </ul>
                </div>
              </div>
            </div>

            <button
              onClick={handleFetchAiAnalysis}
              disabled={isAiLoading}
              className="w-full py-3.5 rounded-2xl bg-amber-400 hover:bg-amber-300 text-stone-950 font-black text-sm flex items-center justify-center gap-2 shadow-lg transition-all active:scale-98 min-h-[48px]"
            >
              {isAiLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
              <span>{isAiLoading ? 'Analyzing Soil & Crop...' : '✨ Generate AI Agronomist Report'}</span>
            </button>
          </div>
        )}

        {/* TAB 4: AI REPORT */}
        {activeTab === 'ai' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="bg-gradient-to-br from-stone-900 via-stone-900 to-amber-950/30 border border-amber-500/30 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-stone-800 pb-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-400" />
                  <h3 className="text-xs font-extrabold text-white uppercase tracking-wider">AI Agronomist Report</h3>
                </div>
                <button
                  onClick={handleFetchAiAnalysis}
                  disabled={isAiLoading}
                  className="px-2.5 py-1 rounded-lg bg-amber-400 hover:bg-amber-300 text-stone-950 font-bold text-xs flex items-center gap-1 active:scale-95 disabled:opacity-50 min-h-[36px]"
                >
                  {isAiLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                  <span>Re-Analyze</span>
                </button>
              </div>

              {!aiAnalysis ? (
                <div className="text-center py-8 space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-bold text-white">Generate Custom AI Fertilizer Plan</h4>
                  <p className="text-xs text-stone-400 max-w-xs mx-auto">
                    Get tailored recommendations from Gemini 3.0 accounting for regional soil health and crop requirements.
                  </p>
                  <button
                    onClick={handleFetchAiAnalysis}
                    disabled={isAiLoading}
                    className="px-5 py-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-stone-950 font-black text-xs inline-flex items-center gap-2 shadow-lg active:scale-95 min-h-[44px]"
                  >
                    {isAiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                    <span>Generate AI Report</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-3 text-xs text-stone-200">
                  {aiAnalysis.cropRequirements && (
                    <div className="p-3 bg-emerald-950/40 rounded-xl border border-emerald-500/20 space-y-1">
                      <h4 className="font-bold text-emerald-300 uppercase tracking-wider text-[10px]">Crop Requirement Focus</h4>
                      <p className="text-stone-300 leading-relaxed">{aiAnalysis.cropRequirements}</p>
                    </div>
                  )}

                  {aiAnalysis.soilAdjustments && (
                    <div className="p-3 bg-amber-950/40 rounded-xl border border-amber-500/20 space-y-1">
                      <h4 className="font-bold text-amber-300 uppercase tracking-wider text-[10px]">Soil Specific Adjustments</h4>
                      <p className="text-stone-300 leading-relaxed">{aiAnalysis.soilAdjustments}</p>
                    </div>
                  )}

                  {aiAnalysis.tips && aiAnalysis.tips.length > 0 && (
                    <div className="p-3 bg-stone-950 rounded-xl border border-stone-800 space-y-2">
                      <h4 className="font-bold text-stone-200 flex items-center gap-1">
                        <Lightbulb className="w-4 h-4 text-amber-400" /> Agronomic Pro-Tips
                      </h4>
                      <ul className="list-disc list-inside space-y-1 text-stone-300">
                        {aiAnalysis.tips.map((tip: string, idx: number) => (
                          <li key={idx}>{tip}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 5: HISTORY */}
        {activeTab === 'history' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="bg-stone-900/90 border border-stone-800 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-stone-800 pb-2">
                <div className="flex items-center gap-2">
                  <History className="w-5 h-5 text-emerald-400" />
                  <h3 className="text-xs font-extrabold text-white uppercase tracking-wider">Saved Calculations History</h3>
                </div>
                <span className="text-[10px] text-amber-300 font-mono bg-amber-950 px-2 py-0.5 rounded border border-amber-500/30">
                  {historyList.length} Items
                </span>
              </div>

              {isLoadingHistory ? (
                <div className="flex items-center justify-center py-8 gap-2 text-stone-400 text-xs">
                  <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
                  <span>Loading calculations...</span>
                </div>
              ) : historyList.length === 0 ? (
                <div className="text-center py-8 space-y-2">
                  <p className="text-xs text-stone-400">No saved calculations found.</p>
                  <p className="text-[11px] text-stone-500">
                    Use the "Save" button in the top bar to record NPK calculations to your profile.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {historyList.map(calc => (
                    <div 
                      key={calc.id}
                      className="bg-stone-950 p-3.5 rounded-xl border border-stone-800 space-y-2.5 hover:border-emerald-500/40 transition-all"
                    >
                      <div className="flex items-center justify-between border-b border-stone-850 pb-2">
                        <div>
                          <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                            <span>{calc.crop}</span>
                            <span className="text-[10px] text-amber-300 bg-amber-950/80 px-1.5 py-0.2 rounded font-normal">
                              {calc.soilType}
                            </span>
                          </h4>
                          <span className="text-[10px] text-stone-500 font-mono">
                            {calc.createdAt ? new Date(calc.createdAt).toLocaleDateString() : ''} • {calc.areaValue} {calc.areaUnit}
                          </span>
                        </div>

                        <button
                          onClick={(e) => handleDeleteHistory(calc.id, e)}
                          disabled={deletingId === calc.id}
                          className="p-1.5 text-stone-500 hover:text-rose-400 active:scale-90 transition-all min-w-[36px] min-h-[36px] flex items-center justify-center"
                        >
                          {deletingId === calc.id ? <Loader2 className="w-4 h-4 animate-spin text-rose-400" /> : <Trash2 className="w-4 h-4" />}
                        </button>
                      </div>

                      {/* Saved NPK Badges */}
                      <div className="flex items-center justify-between text-xs font-mono bg-stone-900/60 p-2 rounded-lg">
                        <span className="text-emerald-400">N: {calc.reqN}kg</span>
                        <span className="text-amber-400">P: {calc.reqP}kg</span>
                        <span className="text-cyan-400">K: {calc.reqK}kg</span>
                        <span className="text-amber-300 font-bold">₹{calc.totalEstCost.toLocaleString('en-IN')}</span>
                      </div>

                      <button
                        onClick={() => handleLoadHistoryItem(calc)}
                        className="w-full py-2 rounded-xl bg-stone-900 hover:bg-emerald-950 border border-stone-800 text-stone-300 hover:text-emerald-300 font-bold text-xs flex items-center justify-center gap-1.5 active:scale-95 transition-all min-h-[40px]"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Load in Calculator</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

      </main>

      {/* Android Floating Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 p-3 bg-[#0c1410]/95 backdrop-blur-xl border-t border-stone-800 z-50 flex items-center justify-between gap-3 max-w-3xl mx-auto">
        <div className="pl-1">
          <span className="text-[10px] text-stone-400 block font-sans">Total Est. Cost</span>
          <span className="text-base font-black text-amber-300 font-mono">₹{totalEstCost.toLocaleString('en-IN')}</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleSaveCalculation}
            disabled={isSaving}
            className="px-4 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 border border-stone-700 text-stone-200 font-bold text-xs flex items-center gap-1.5 active:scale-95 min-h-[44px]"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 text-emerald-400" />}
            <span>Save</span>
          </button>

          <button
            onClick={() => {
              if (activeTab === 'calc') setActiveTab('bags');
              else if (activeTab === 'bags') setActiveTab('schedule');
              else if (activeTab === 'schedule') setActiveTab('ai');
              else setActiveTab('calc');
            }}
            className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-black text-xs flex items-center gap-1.5 shadow-lg shadow-emerald-950/50 active:scale-95 min-h-[44px]"
          >
            <span>Next View</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

    </div>
  );
};

export default FertilizerCalculator;
