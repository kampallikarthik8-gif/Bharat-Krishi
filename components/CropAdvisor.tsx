import React from 'react';
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
  GripVertical,
  Sun,
  Wind,
  MessageCircle
} from 'lucide-react';
import Markdown from 'react-markdown';

import { useFirebase } from '../src/components/FirebaseProvider';
import { db } from '../src/firebase';
import { collection, query, onSnapshot, addDoc, deleteDoc, doc, orderBy } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../src/utils/firestoreErrorHandler';

const WEATHER_API_KEY = import.meta.env.VITE_WEATHER_API_KEY;

const INDIAN_CROPS = [
  'Paddy (Rice)', 'Wheat', 'Sugarcane', 'Cotton', 'Mustard', 'Bajra', 'Moong Dal', 'Tomato', 'Onion', 'Potato', 'Maize', 'Soybean'
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
}

const CropAdvisor: React.FC<CropAdvisorProps> = ({ language: initialLanguage }) => {
  const { profile, activeFarmId } = useFirebase();
  const [formData, setFormData] = React.useState({
    crop: '',
    location: profile?.location || '',
    soil: profile?.soilType || ''
  });

  React.useEffect(() => {
    if (profile) {
      setFormData(prev => ({
        ...prev,
        location: prev.location || profile.location || '',
        soil: prev.soil || profile.soilType || ''
      }));
    }
  }, [profile]);

  const [language, setLanguage] = React.useState(initialLanguage);
  const [advice, setAdvice] = React.useState('');
  const [fertilizerPlan, setFertilizerPlan] = React.useState<FertilizerPlan | null>(null);
  const [weatherData, setWeatherData] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(false);
  const [detecting, setDetecting] = React.useState(false);
  const [saveStatus, setSaveStatus] = React.useState<'idle' | 'saved'>('idle');

  const [savedStrategies, setSavedStrategies] = React.useState<SavedStrategy[]>([]);
  const reportRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
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
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const res = await fetch(
            `https://api.openweathermap.org/data/2.5/weather?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&appid=${WEATHER_API_KEY}&units=metric`
          );
          const data = await res.json();
          setFormData(prev => ({ ...prev, location: data.name ? `${data.name}, ${data.sys.country}` : 'Current Region' }));
          setWeatherData(data);
        } catch (err) { console.error(err); }
        finally { setDetecting(false); }
      },
      () => setDetecting(false)
    );
  };

  const handleFetchAdvice = async (targetLanguage: string) => {
    if (!formData.crop) return;
    setLoading(true);
    setSaveStatus('idle');
    const weatherContext = weatherData ? 
      `${weatherData.main.temp}°C, Humidity: ${weatherData.main.humidity}%, ${weatherData.weather[0].description}` : 
      '';
    try {
      const [adviceRes, fertRes] = await Promise.all([
        getCropAdvice(formData.crop, formData.location, formData.soil, targetLanguage, weatherContext),
        getFertilizerAdvice(formData.crop, formData.location, formData.soil, targetLanguage, weatherContext)
      ]);
      setAdvice(adviceRes || '');
      setFertilizerPlan(fertRes);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
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
    if (!advice || !fertilizerPlan || !activeFarmId) return;
    
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
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  };

  const deleteArchived = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!activeFarmId) return;
    if (!confirm("Remove this archived strategy?")) return;
    
    const path = `users/${activeFarmId}/cropStrategies/${id}`;
    try {
      await deleteDoc(doc(db, path));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  };

  const loadArchived = (strategy: SavedStrategy) => {
    setFormData({
      crop: strategy.crop,
      location: strategy.location,
      soil: strategy.soil
    });
    setAdvice(strategy.advice);
    setFertilizerPlan(strategy.fertilizerPlan);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const shareOnWhatsApp = () => {
    if (!advice) return;
    
    const farmName = localStorage.getItem('agri_farm_name') || 'My Farm';
    const message = `*Bharat Kisan - Crop Strategy Report*%0A%0A` +
      `*Farm:* ${farmName}%0A` +
      `*Crop:* ${formData.crop}%0A` +
      `*Location:* ${formData.location}%0A%0A` +
      `*Strategic Advice:*%0A${advice.substring(0, 500)}${advice.length > 500 ? '...' : ''}%0A%0A` +
      `Generated via Bharat Kisan App`;
    
    window.open(`https://wa.me/?text=${message}`, '_blank');
  };

  const downloadReport = async () => {
    if (!advice || !reportRef.current) return;

    try {
      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
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

      pdf.save(`AgriAssist_Report_${formData.crop.replace(/\s+/g, '_')}_${new Date().getTime()}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
    }
  };

  return (
    <div className="space-y-8 pb-32 animate-in fade-in">
      <div className="bg-white rounded-[3rem] p-6 md:p-10 shadow-sm border border-stone-200">
        <div className="flex justify-between items-start mb-10">
          <div>
            <h2 className="text-3xl font-black mb-2 flex items-center gap-4 text-stone-900 tracking-tight">
              <div className="bg-amber-500 p-3 rounded-2xl shadow-lg shadow-amber-500/20 text-white">
                <Lightbulb className="w-8 h-8" />
              </div>
              Precision Strategy
            </h2>
            <p className="text-stone-500 text-sm font-medium">Personalized agronomy reports grounded in local field conditions.</p>
          </div>
          <div className="bg-stone-50 p-2 rounded-2xl border border-stone-100 hidden sm:block">
            <Zap className="w-5 h-5 text-amber-500 animate-pulse" />
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-stone-400 ml-4 uppercase tracking-[0.2em]">Crop Selection</label>
              <div className="relative group">
                <input 
                  list="crop-options" 
                  placeholder="e.g. Paddy" 
                  value={formData.crop} 
                  onChange={e => setFormData({...formData, crop: e.target.value})} 
                  className="w-full bg-stone-50 border-2 border-stone-100 p-5 rounded-[1.75rem] font-bold text-sm outline-none shadow-inner pl-14 focus:border-amber-500/50 focus:bg-white transition-all" 
                />
                <Database className="absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 text-stone-300 group-focus-within:text-amber-500 transition-colors" />
                <datalist id="crop-options">
                  {INDIAN_CROPS.map(c => <option key={c} value={c} />)}
                </datalist>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-stone-400 ml-4 uppercase tracking-[0.2em]">District / Region</label>
              <div className="relative group">
                <input 
                  placeholder="e.g. Punjab" 
                  value={formData.location} 
                  onChange={e => setFormData({...formData, location: e.target.value})} 
                  className="w-full bg-stone-50 border-2 border-stone-100 p-5 rounded-[1.75rem] font-bold text-sm outline-none shadow-inner pl-14 focus:border-amber-500/50 focus:bg-white transition-all" 
                />
                <MapPin className="absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 text-stone-300 group-focus-within:text-amber-500 transition-colors" />
                <button type="button" onClick={detectLocation} className="absolute right-4 top-1/2 -translate-y-1/2 p-2.5 bg-white rounded-xl shadow-md text-amber-600 active:scale-90 transition-all border border-stone-100">
                  <Navigation className={`w-4 h-4 ${detecting ? 'animate-spin' : ''}`} />
                </button>
              </div>
              {weatherData && (
                <div className="flex items-center gap-4 mt-3 px-4 py-2 bg-stone-50 rounded-2xl border border-stone-100 w-fit animate-in fade-in slide-in-from-left-4">
                  <div className="flex items-center gap-2">
                    <Sun className="w-4 h-4 text-amber-500" />
                    <span className="text-[10px] font-black text-stone-600 uppercase tracking-widest">{weatherData.main.temp}°C</span>
                  </div>
                  <div className="w-px h-3 bg-stone-200" />
                  <div className="flex items-center gap-2">
                    <Droplets className="w-4 h-4 text-blue-500" />
                    <span className="text-[10px] font-black text-stone-600 uppercase tracking-widest">{weatherData.main.humidity}%</span>
                  </div>
                  <div className="w-px h-3 bg-stone-200" />
                  <div className="flex items-center gap-2">
                    <Wind className="w-4 h-4 text-stone-400" />
                    <span className="text-[10px] font-black text-stone-600 uppercase tracking-widest">{Math.round(weatherData.wind.speed * 3.6)} km/h</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-stone-400 ml-4 uppercase tracking-[0.2em]">Soil Health Metric</label>
              <div className="relative group">
                <select value={formData.soil} onChange={e => setFormData({...formData, soil: e.target.value})} className="w-full bg-stone-50 border-2 border-stone-100 p-5 rounded-[1.75rem] font-bold text-sm outline-none appearance-none shadow-inner pl-14 focus:border-amber-500/50 focus:bg-white transition-all">
                  <option value="">Select Soil Profile</option>
                  <option value="Alluvial">Alluvial (High Fertility)</option>
                  <option value="Black Cotton">Black Cotton (Rich Clay)</option>
                  <option value="Red/Yellow">Red/Yellow (Iron Rich)</option>
                  <option value="Laterite">Laterite (Weathered)</option>
                  <option value="Desert/Sandy">Desert/Sandy (Loamy)</option>
                </select>
                <FlaskConical className="absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 text-stone-300 group-focus-within:text-amber-500 transition-colors pointer-events-none" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-stone-400 ml-4 uppercase tracking-[0.2em]">Vernacular Delivery</label>
              <div className="relative group">
                <select 
                  value={language}
                  onChange={(e) => onLanguageChange(e.target.value)}
                  className="w-full bg-stone-50 border-2 border-stone-100 p-5 rounded-[1.75rem] font-bold text-sm outline-none appearance-none shadow-inner pl-14 focus:border-amber-500/50 focus:bg-white transition-all"
                >
                  {LANGUAGES.map(l => (
                    <option key={l.name} value={l.name}>{l.label}</option>
                  ))}
                </select>
                <LangIcon className="absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 text-stone-300 group-focus-within:text-[#825500] transition-colors pointer-events-none" />
              </div>
            </div>
          </div>

          <button type="submit" disabled={loading} className="w-full bg-stone-900 text-white font-black py-6 rounded-[2rem] shadow-2xl flex items-center justify-center gap-4 active:scale-[0.98] transition-all disabled:opacity-50 group">
            {loading ? <Loader2 className="animate-spin w-6 h-6" /> : <Zap className="w-6 h-6 text-amber-400 group-hover:scale-110 transition-transform" />}
            <span className="uppercase tracking-[0.2em] text-sm">Generate Biological Protocol</span>
          </button>
        </form>

        {advice && !loading && (
          <div className="mt-20 space-y-16 animate-in zoom-in-95 duration-700">
            {/* Header / Actions */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 px-4">
               <div className="flex items-center gap-4">
                  <div className="bg-emerald-500 p-2 rounded-full"><ShieldCheck className="w-5 h-5 text-white" /></div>
                  <h3 className="text-stone-900 font-black text-2xl tracking-tighter">Protocol Finalized</h3>
               </div>
               <div className="flex gap-3">
                 <button 
                  onClick={saveToArchive}
                  disabled={saveStatus === 'saved'}
                  className={`flex items-center gap-3 px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-lg ${saveStatus === 'saved' ? 'bg-emerald-500 text-white' : 'bg-stone-50 text-stone-700 hover:bg-stone-100 border border-stone-100'}`}
                 >
                   {saveStatus === 'saved' ? <CheckCircle2 className="w-4 h-4" /> : <Archive className="w-4 h-4" />}
                   {saveStatus === 'saved' ? 'Archived' : 'Archive Plan'}
                 </button>
                 <button 
                  onClick={downloadReport}
                  className="flex items-center gap-3 bg-[#825500] text-white px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-black active:scale-95 transition-all shadow-xl"
                 >
                   <Download className="w-4 h-4" /> Export Document
                 </button>
                 <button 
                  onClick={shareOnWhatsApp}
                  className="flex items-center gap-3 bg-[#25D366] text-white px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-[#128C7E] active:scale-95 transition-all shadow-xl"
                 >
                   <MessageCircle className="w-4 h-4" /> Share WhatsApp
                 </button>
               </div>
            </div>

            {/* Main Advisor Module */}
            <div className="relative">
              <div className="absolute inset-0 bg-amber-50/30 rounded-[3.5rem] blur-3xl -z-10"></div>
              <div className="bg-white border-2 border-amber-100/50 p-10 md:p-14 rounded-[3.5rem] shadow-sm relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-10 opacity-[0.03] group-hover:opacity-5 transition-opacity">
                  <Sprout className="w-96 h-96 -mr-20 -mt-20 rotate-12" />
                </div>
                <h3 className="text-amber-700 font-black text-[11px] uppercase mb-10 tracking-[0.4em] flex items-center gap-3 bg-amber-50 w-fit px-6 py-2.5 rounded-full border border-amber-100 shadow-sm">
                  <TrendingUp className="w-4 h-4" /> Regional Strategic Audit
                </h3>
                <div className="prose prose-stone max-w-none text-base md:text-lg font-medium text-stone-700 leading-relaxed italic">
                  <Markdown>{advice}</Markdown>
                </div>
              </div>
            </div>
            
            {fertilizerPlan && (
              <div className="space-y-20">
                 {/* Intelligence Briefs */}
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8 px-2">
                    <div className="bg-emerald-950/95 p-10 rounded-[3rem] shadow-2xl relative overflow-hidden group border border-white/5">
                       <Target className="absolute -right-8 -bottom-8 w-40 h-40 text-emerald-500/10 group-hover:scale-110 transition-transform" />
                       <div className="relative z-10">
                          <div className="bg-emerald-500 p-3 rounded-2xl w-fit mb-8 shadow-xl text-stone-900"><Target className="w-6 h-6" /></div>
                          <h4 className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.3em] mb-4">Focus Requirements</h4>
                          <p className="text-lg font-black text-white leading-snug">{fertilizerPlan.cropRequirements}</p>
                       </div>
                    </div>
                    <div className="bg-stone-100/50 p-10 rounded-[3rem] shadow-inner relative overflow-hidden group border border-stone-200">
                       <Atom className="absolute -right-8 -bottom-8 w-40 h-40 text-stone-900/5 group-hover:scale-110 transition-transform" />
                       <div className="relative z-10">
                          <div className="bg-white p-3 rounded-2xl w-fit mb-8 shadow-md text-blue-500 border border-stone-100"><Atom className="w-6 h-6" /></div>
                          <h4 className="text-[10px] font-black text-stone-400 uppercase tracking-[0.3em] mb-4">Soil Adjustments</h4>
                          <p className="text-lg font-black text-stone-800 leading-snug">{fertilizerPlan.soilAdjustments}</p>
                       </div>
                    </div>
                 </div>

                 {/* NUTRIENT MODULE */}
                 <div className="space-y-8">
                    <div className="flex flex-col gap-3 px-4">
                      <div className="flex items-center gap-4 text-amber-600">
                        <Beaker className="w-8 h-8" />
                        <h3 className="text-2xl font-black tracking-tight text-stone-900">Nutrient Inventory</h3>
                      </div>
                      <p className="text-stone-400 text-xs font-bold uppercase tracking-widest ml-12">Precision Engineered Nutrient Matrix</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                       {fertilizerPlan.fertilizers.map((f, i) => (
                         <div key={i} className="bg-white border-2 border-stone-50 p-8 rounded-[3rem] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.08)] relative overflow-hidden group hover:border-amber-400 transition-all">
                            <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:rotate-6 transition-transform">
                               {f.isOrganic ? <Leaf className="w-24 h-24 text-emerald-600" /> : <Zap className="w-24 h-24 text-amber-500" />}
                            </div>
                            <div className="relative z-10">
                               <div className={`w-fit px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest mb-6 border-2 ${f.isOrganic ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-orange-50 text-orange-700 border-orange-100'}`}>
                                 {f.isOrganic ? 'Biological Base' : 'High Efficiency Synthetics'}
                               </div>
                               <h4 className="font-black text-2xl mb-4 text-stone-900 tracking-tighter leading-none">{f.name}</h4>
                               <div className="bg-stone-900 rounded-[1.25rem] px-6 py-3 w-fit mb-8 shadow-xl">
                                  <span className="text-xs font-black tracking-[0.2em] text-amber-400 uppercase">NPK {f.npk}</span>
                               </div>
                               <p className="text-sm font-medium text-stone-500 leading-relaxed italic border-l-4 border-stone-100 pl-4">"{f.description}"</p>
                            </div>
                         </div>
                       ))}
                    </div>
                 </div>

                 {/* APPLICATION TIMELINE */}
                 <div className="space-y-12">
                    <div className="flex flex-col gap-3 px-4">
                      <div className="flex items-center gap-4 text-emerald-600">
                        <CalendarCheck className="w-8 h-8" />
                        <h3 className="text-2xl font-black tracking-tight text-stone-900">Deployment Schedule</h3>
                      </div>
                      <p className="text-stone-400 text-xs font-bold uppercase tracking-widest ml-12">Critical Operations Timeline</p>
                    </div>
                    <div className="relative pl-8 md:pl-16 space-y-16 before:absolute before:left-[16px] md:before:left-[44px] before:top-4 before:bottom-4 before:w-1 before:bg-gradient-to-b before:from-amber-400 before:via-emerald-500 before:to-stone-200 before:rounded-full">
                       {fertilizerPlan.schedule.map((s, i) => (
                         <div key={i} className="relative group">
                            <div className={`absolute -left-[24px] md:-left-[52px] top-1.5 w-12 h-12 rounded-[1.5rem] border-4 border-white z-10 shadow-2xl transition-all group-hover:scale-125 flex items-center justify-center ${i === 0 ? 'bg-amber-500 animate-pulse' : 'bg-stone-900'}`}>
                                {i === 0 ? <Clock className="w-5 h-5 text-white" /> : <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
                            </div>
                            <div className="bg-white border-2 border-stone-100 rounded-[3rem] p-8 md:p-10 shadow-sm group-hover:border-emerald-300 group-hover:shadow-2xl transition-all relative">
                               <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 pb-8 border-b border-stone-50">
                                  <div className="flex items-center gap-6">
                                     <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 text-xl font-black shadow-inner">
                                        0{i + 1}
                                     </div>
                                     <div>
                                        <h4 className="text-xl font-black text-stone-900 tracking-tight leading-none mb-2">{s.stage}</h4>
                                        <div className="flex items-center gap-2">
                                           <div className="w-1.5 h-1.5 rounded-full bg-amber-400"></div>
                                           <p className="text-[11px] font-black text-stone-400 uppercase tracking-widest">{s.timing}</p>
                                        </div>
                                     </div>
                                  </div>
                                  <div className="bg-stone-900 px-6 py-2.5 rounded-2xl shadow-xl">
                                     <span className="text-[10px] font-black text-white uppercase tracking-[0.2em]">Deployment Cycle</span>
                                  </div>
                               </div>
                               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                  <div className="bg-stone-50 p-6 rounded-[2rem] border border-stone-100 flex items-center gap-6 group/item hover:bg-white transition-colors">
                                     <div className="p-4 bg-white rounded-2xl shadow-sm text-amber-600 group-hover/item:scale-110 transition-transform"><Beaker className="w-6 h-6" /></div>
                                     <div>
                                        <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-1">Target Dosage</p>
                                        <p className="text-base font-black text-stone-800">{s.dosage}</p>
                                     </div>
                                  </div>
                                  <div className="bg-stone-50 p-6 rounded-[2rem] border border-stone-100 flex items-center gap-6 group/item hover:bg-white transition-colors">
                                     <div className="p-4 bg-white rounded-2xl shadow-sm text-blue-500 group-hover/item:scale-110 transition-transform"><Droplets className="w-6 h-6" /></div>
                                     <div>
                                        <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-1">Application Method</p>
                                        <p className="text-base font-black text-stone-800">{s.method}</p>
                                     </div>
                                  </div>
                               </div>
                            </div>
                         </div>
                       ))}
                    </div>
                 </div>

                 {/* BIO-SHIELD: MICRONUTRIENTS */}
                 {fertilizerPlan.micronutrients && fertilizerPlan.micronutrients.length > 0 && (
                   <div className="space-y-10">
                      <div className="flex flex-col gap-3 px-4">
                        <div className="flex items-center gap-4 text-indigo-600">
                          <ShieldCheck className="w-8 h-8" />
                          <h3 className="text-2xl font-black tracking-tight text-stone-900">Bio-Fortification</h3>
                        </div>
                        <p className="text-stone-400 text-xs font-bold uppercase tracking-widest ml-12">Essential Micro-Elements Cluster</p>
                      </div>
                      <div className="bg-indigo-950 p-10 md:p-14 rounded-[4rem] flex flex-wrap justify-center gap-4 shadow-2xl relative overflow-hidden border-8 border-indigo-900/50">
                         <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/50 to-transparent"></div>
                         <Sparkles className="absolute top-0 left-0 w-64 h-64 text-white/5 -ml-20 -mt-20" />
                         {fertilizerPlan.micronutrients.map((micro, i) => (
                           <div key={i} className="bg-white/10 backdrop-blur-xl px-8 py-4 rounded-[1.75rem] border border-white/10 flex items-center gap-4 animate-in zoom-in group hover:bg-white hover:border-white transition-all shadow-xl relative z-10">
                              <div className="w-3 h-3 rounded-full bg-indigo-400 shadow-[0_0_15px_rgba(129,140,248,1)] group-hover:bg-indigo-600" />
                              <span className="text-sm font-black text-white group-hover:text-indigo-950 uppercase tracking-[0.15em]">{micro}</span>
                           </div>
                         ))}
                      </div>
                   </div>
                 )}

                 {/* EXPERT GUIDANCE: TIPS */}
                 {fertilizerPlan.tips && fertilizerPlan.tips.length > 0 && (
                    <div className="bg-stone-950 rounded-[4rem] p-10 md:p-16 text-white shadow-2xl relative overflow-hidden border-t-8 border-emerald-600/30">
                       <div className="absolute top-0 right-0 p-12 opacity-10">
                          <ClipboardList className="w-48 h-48 rotate-12" />
                       </div>
                       <div className="relative z-10 max-w-4xl">
                          <h4 className="text-emerald-400 font-black text-[11px] uppercase tracking-[0.5em] mb-12 flex items-center gap-4 bg-white/5 w-fit px-8 py-3 rounded-full border border-white/10">
                             <CheckCircle2 className="w-5 h-5 text-amber-400" /> Expert Management Directives
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                             {fertilizerPlan.tips.map((tip, i) => (
                               <div key={i} className="flex gap-6 items-start group">
                                  <div className="mt-2.5 w-2 h-2 rounded-full bg-emerald-500 shrink-0 group-hover:scale-150 transition-all shadow-[0_0_15px_#10b981]" />
                                  <p className="text-sm md:text-base font-medium text-stone-300 leading-relaxed italic opacity-80 group-hover:opacity-100 transition-opacity">"{tip}"</p>
                               </div>
                             ))}
                          </div>
                          <div className="mt-16 pt-10 border-t border-white/5 flex items-center gap-4 opacity-40">
                             <AlertCircle className="w-5 h-5" />
                             <p className="text-[10px] font-bold uppercase tracking-widest leading-relaxed max-w-lg">AI Generated Protocol. Consult District Agricultural Officers (DAO) before mass-scale implementation.</p>
                          </div>
                       </div>
                    </div>
                 )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Historical strategies Section */}
      {savedStrategies.length > 0 && (
        <div className="px-4 space-y-6">
          <div className="flex items-center justify-between px-2">
             <div className="flex items-center gap-3">
                <History className="w-5 h-5 text-stone-400" />
                <h3 className="text-xs font-black text-stone-400 uppercase tracking-[0.2em]">Strategy Archives</h3>
             </div>
             <span className="text-[10px] font-bold text-stone-300 uppercase">{savedStrategies.length} Entries</span>
          </div>
          <div className="grid grid-cols-1 gap-4">
             {savedStrategies.map(s => (
               <div 
                key={s.id} 
                onClick={() => loadArchived(s)}
                className="bg-white border border-stone-100 p-6 rounded-[2.5rem] flex items-center justify-between group active:scale-[0.98] transition-all hover:shadow-xl hover:border-amber-200 cursor-pointer shadow-sm"
               >
                  <div className="flex items-center gap-6">
                    <div className="w-16 h-16 rounded-3xl bg-stone-50 flex items-center justify-center shadow-inner text-stone-400 group-hover:bg-amber-50 group-hover:text-amber-600 transition-all">
                       <GripVertical className="w-6 h-6 opacity-20 group-hover:opacity-50" />
                       <FileText className="w-7 h-7 absolute" />
                    </div>
                    <div className="text-left">
                       <p className="font-black text-stone-900 text-lg tracking-tighter leading-none mb-1.5">{s.crop}</p>
                       <div className="flex items-center gap-3">
                          <p className="text-[10px] text-stone-400 font-black uppercase tracking-widest">{s.soil} Profile</p>
                          <div className="w-1 h-1 bg-stone-200 rounded-full" />
                          <p className="text-[10px] text-stone-300 font-bold uppercase">{new Date(s.timestamp).toLocaleDateString()}</p>
                       </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={(e) => deleteArchived(s.id, e)}
                      className="p-3 bg-stone-50 rounded-2xl text-stone-300 hover:text-rose-500 hover:bg-rose-50 transition-all border border-transparent hover:border-rose-100 shadow-sm"
                    >
                       <Trash2 className="w-5 h-5" />
                    </button>
                    <div className="p-3 bg-stone-50 rounded-2xl text-stone-200 group-hover:text-amber-600 group-hover:bg-amber-50 transition-all shadow-sm">
                       <ChevronRight className="w-6 h-6" />
                    </div>
                  </div>
               </div>
             ))}
          </div>
        </div>
      )}

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
          <h1 style={{ fontSize: '28px', fontWeight: '900', margin: 0, letterSpacing: '-0.02em' }}>AGRIASSIST STRATEGIC REPORT</h1>
          <p style={{ fontSize: '12px', opacity: 0.7, marginTop: '8px' }}>Generated: {new Date().toLocaleString()}</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px', marginBottom: '40px' }}>
          <div>
            <h3 style={{ fontSize: '14px', fontWeight: '900', borderBottom: '1px solid #e7e5e4', paddingBottom: '8px', marginBottom: '12px', color: '#78716c' }}>FARMER INFORMATION</h3>
            <p style={{ fontSize: '14px', margin: '4px 0' }}><strong>Farmer Name:</strong> {profile?.name || 'Valued Farmer'}</p>
            <p style={{ fontSize: '14px', margin: '4px 0' }}><strong>Farm Unit:</strong> {profile?.farmName || 'Unnamed Farm'}</p>
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
            <Markdown>{advice}</Markdown>
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

        <div style={{ marginTop: '60px', borderTop: '1px solid #e7e5e4', paddingTop: '20px', textAlign: 'center', fontSize: '10px', color: '#a8a29e' }}>
          <p>Disclaimer: AI recommendations should be verified with local agricultural officers.</p>
          <p>© 2026 AgriAssist Smart Farming Companion</p>
        </div>
      </div>
    </div>
  );
};

export default CropAdvisor;