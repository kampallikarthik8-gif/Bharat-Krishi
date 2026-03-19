import React from 'react';
import { getCropRotationAdvice } from '../services/geminiService';
import { 
  RefreshCw, 
  Loader2, 
  MapPin, 
  Database, 
  FlaskConical, 
  History, 
  Sparkles, 
  ChevronRight, 
  Trash2, 
  Download,
  Sprout,
  ArrowRightLeft,
  Calendar,
  ShieldCheck,
  TrendingUp,
  Info,
  Zap,
  Save,
  RotateCcw
} from 'lucide-react';
import Markdown from 'react-markdown';

const WEATHER_API_KEY = import.meta.env.VITE_WEATHER_API_KEY;

const INDIAN_CROPS = [
  'Paddy (Rice)', 'Wheat', 'Sugarcane', 'Cotton', 'Mustard', 'Bajra', 'Moong Dal', 'Tomato', 'Onion', 'Potato', 'Maize', 'Soybean'
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
  language: string;
}

const CropRotationAdvisor: React.FC<CropRotationAdvisorProps> = ({ language }) => {
  const [formData, setFormData] = React.useState({
    currentCrops: [] as string[],
    location: localStorage.getItem('agri_farm_location') || '',
    soil: localStorage.getItem('agri_soil_type') || '',
    history: [] as string[]
  });
  
  const [newCrop, setNewCrop] = React.useState('');
  const [historyCrop, setHistoryCrop] = React.useState('');
  const [advice, setAdvice] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [detecting, setDetecting] = React.useState(false);
  const [saveStatus, setSaveStatus] = React.useState<'idle' | 'saved'>('idle');

  const [savedRotations, setSavedRotations] = React.useState<SavedRotation[]>(() => {
    const saved = localStorage.getItem('agri_saved_rotations');
    return saved ? JSON.parse(saved) : [];
  });

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
        } catch (err) { console.error(err); }
        finally { setDetecting(false); }
      },
      () => setDetecting(false)
    );
  };

  const handleFetchAdvice = async () => {
    if (formData.currentCrops.length === 0) return;
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
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const addCrop = () => {
    if (newCrop && !formData.currentCrops.includes(newCrop)) {
      setFormData(prev => ({ ...prev, currentCrops: [...prev.currentCrops, newCrop] }));
      setNewCrop('');
    }
  };

  const removeCrop = (crop: string) => {
    setFormData(prev => ({ ...prev, currentCrops: prev.currentCrops.filter(c => c !== crop) }));
  };

  const addHistoryCrop = () => {
    if (historyCrop && !formData.history.includes(historyCrop)) {
      setFormData(prev => ({ ...prev, history: [...prev.history, historyCrop] }));
      setHistoryCrop('');
    }
  };

  const removeHistoryCrop = (crop: string) => {
    setFormData(prev => ({ ...prev, history: prev.history.filter(c => c !== crop) }));
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
    const updated = [newRotation, ...savedRotations];
    setSavedRotations(updated);
    localStorage.setItem('agri_saved_rotations', JSON.stringify(updated));
    setSaveStatus('saved');
    setTimeout(() => setSaveStatus('idle'), 3000);
  };

  const deleteArchived = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Remove this archived rotation plan?")) return;
    const updated = savedRotations.filter(s => s.id !== id);
    setSavedRotations(updated);
    localStorage.setItem('agri_saved_rotations', JSON.stringify(updated));
  };

  const loadArchived = (rotation: SavedRotation) => {
    setFormData({
      currentCrops: rotation.currentCrops,
      location: rotation.location,
      soil: rotation.soil,
      history: rotation.history
    });
    setAdvice(rotation.advice);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="w-full flex flex-col pb-40 bg-transparent min-h-screen">
      
      {/* Technical Header */}
      <section className="px-6 pt-12 pb-8">
        <div className="flex flex-col gap-8">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-mono text-emerald-500 font-bold uppercase tracking-[0.4em]">Agricultural Intelligence</span>
            </div>
            <h2 className="text-5xl font-black text-white tracking-tighter font-display uppercase leading-none">
              Rotation <span className="text-emerald-500">Advisor.</span>
            </h2>
            <p className="text-[10px] font-mono text-white/30 uppercase tracking-[0.2em]">Soil Health Optimization Engine v1.0</p>
          </div>
        </div>
      </section>

      <div className="px-6 space-y-12">
        
        {/* Configuration Panel */}
        <section className="glass-panel p-8 rounded-[2.5rem] border border-white/10 space-y-8">
          <div className="flex items-center gap-4">
            <div className="w-1 h-4 bg-emerald-500 rounded-full" />
            <h3 className="text-[10px] font-black text-white/40 uppercase tracking-[0.4em]">System Parameters</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <label className="text-[10px] font-mono text-white/30 uppercase tracking-widest ml-2">Current Crop Matrix</label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Sprout className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-500/40" />
                  <input 
                    list="crop-options"
                    type="text"
                    value={newCrop}
                    onChange={(e) => setNewCrop(e.target.value)}
                    onKeyPress={e => e.key === 'Enter' && addCrop()}
                    placeholder="Add current crop..."
                    className="w-full bg-white/5 border border-white/10 p-5 pl-14 rounded-2xl outline-none font-mono text-sm text-white focus:border-emerald-500/50 transition-all"
                  />
                </div>
                <button onClick={addCrop} className="bg-emerald-500 text-black px-6 rounded-2xl font-black text-[10px] uppercase tracking-widest active:scale-90 transition-all glow-emerald">Add</button>
              </div>
              <div className="flex flex-wrap gap-2 px-2">
                {formData.currentCrops.map(c => (
                  <span key={c} className="bg-emerald-500/10 text-emerald-500 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-500/20 flex items-center gap-2">
                    {c}
                    <button onClick={() => removeCrop(c)}><Trash2 className="w-3 h-3 opacity-50 hover:opacity-100 hover:text-rose-500" /></button>
                  </span>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-[10px] font-mono text-white/30 uppercase tracking-widest ml-2">Geospatial Coordinates</label>
              <div className="relative">
                <MapPin className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-500/40" />
                <input 
                  type="text"
                  value={formData.location}
                  onChange={e => setFormData({...formData, location: e.target.value})}
                  placeholder="e.g. Punjab, India"
                  className="w-full bg-white/5 border border-white/10 p-5 pl-14 rounded-2xl outline-none font-mono text-sm text-white focus:border-emerald-500/50 transition-all"
                />
                <button type="button" onClick={detectLocation} className="absolute right-4 top-1/2 -translate-y-1/2 p-2.5 bg-white/5 rounded-xl border border-white/10 text-emerald-500 active:scale-90 transition-all">
                  <RefreshCw className={`w-4 h-4 ${detecting ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-[10px] font-mono text-white/30 uppercase tracking-widest ml-2">Soil Composition</label>
              <div className="relative">
                <FlaskConical className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-500/40" />
                <select 
                  value={formData.soil} 
                  onChange={e => setFormData({...formData, soil: e.target.value})} 
                  className="w-full bg-white/5 border border-white/10 p-5 pl-14 rounded-2xl outline-none font-mono text-sm text-white focus:border-emerald-500/50 transition-all appearance-none"
                >
                  <option value="" className="bg-[#0a0c10]">Select Soil Type</option>
                  <option value="Alluvial" className="bg-[#0a0c10]">Alluvial (High Fertility)</option>
                  <option value="Black Cotton" className="bg-[#0a0c10]">Black Cotton (Rich Clay)</option>
                  <option value="Red/Yellow" className="bg-[#0a0c10]">Red/Yellow (Iron Rich)</option>
                  <option value="Laterite" className="bg-[#0a0c10]">Laterite (Weathered)</option>
                  <option value="Desert/Sandy" className="bg-[#0a0c10]">Desert/Sandy (Loamy)</option>
                </select>
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-[10px] font-mono text-white/30 uppercase tracking-widest ml-2">Historical Data (Last 2 Years)</label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <History className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-500/40" />
                  <input 
                    list="crop-options"
                    type="text"
                    value={historyCrop}
                    onChange={(e) => setHistoryCrop(e.target.value)}
                    onKeyPress={e => e.key === 'Enter' && addHistoryCrop()}
                    placeholder="Add past crop..."
                    className="w-full bg-white/5 border border-white/10 p-5 pl-14 rounded-2xl outline-none font-mono text-sm text-white focus:border-emerald-500/50 transition-all"
                  />
                </div>
                <button onClick={addHistoryCrop} className="bg-white/10 text-white px-6 rounded-2xl font-black text-[10px] uppercase tracking-widest active:scale-90 transition-all border border-white/10">Add</button>
              </div>
              <div className="flex flex-wrap gap-2 px-2">
                {formData.history.map(c => (
                  <span key={c} className="bg-white/5 text-white/40 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border border-white/10 flex items-center gap-2">
                    {c}
                    <button onClick={() => removeHistoryCrop(c)}><Trash2 className="w-3 h-3 opacity-50 hover:opacity-100 hover:text-rose-500" /></button>
                  </span>
                ))}
              </div>
            </div>
          </div>

          <button 
            onClick={handleFetchAdvice}
            disabled={loading || formData.currentCrops.length === 0}
            className="w-full bg-emerald-500 p-6 rounded-[2rem] text-black font-black uppercase tracking-[0.4em] flex items-center justify-center gap-4 hover:bg-emerald-400 disabled:opacity-20 disabled:cursor-not-allowed transition-all glow-emerald"
          >
            {loading ? (
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                <span>Processing Matrix...</span>
              </div>
            ) : (
              <>
                <Zap className="w-6 h-6" />
                <span>Initialize Analysis</span>
              </>
            )}
          </button>
        </section>

        <datalist id="crop-options">
          {INDIAN_CROPS.map(c => <option key={c} value={c} />)}
        </datalist>

        {/* Results Panel */}
        {advice && (
          <div className="space-y-8 animate-in zoom-in-95 duration-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-1 h-4 bg-emerald-500 rounded-full" />
                <h3 className="text-[10px] font-black text-white/40 uppercase tracking-[0.4em]">Analysis Output</h3>
              </div>
              <div className="flex gap-4">
                <button 
                  onClick={saveToArchive}
                  disabled={saveStatus === 'saved'}
                  className={`p-4 rounded-2xl transition-all border ${saveStatus === 'saved' ? 'bg-emerald-500 text-black border-emerald-500 glow-emerald' : 'bg-white/5 border-white/10 text-emerald-500 hover:bg-white/10'}`}
                >
                  <Save className="w-5 h-5" />
                </button>
                <button 
                  onClick={() => setAdvice('')}
                  className="p-4 bg-white/5 border border-white/10 rounded-2xl text-white/40 hover:bg-white/10 transition-all"
                >
                  <RotateCcw className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="glass-panel p-10 rounded-[2.5rem] border border-white/10 space-y-10 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-10 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity">
                <RefreshCw className="w-96 h-96 -mr-20 -mt-20 rotate-12" />
              </div>
              
              <div className="flex items-center gap-3 text-emerald-500 bg-emerald-500/5 w-fit px-6 py-2.5 rounded-full border border-emerald-500/20 shadow-sm">
                <TrendingUp className="w-4 h-4" /> 
                <span className="text-[10px] font-black uppercase tracking-[0.4em]">Strategic Rotation Audit</span>
              </div>

              <div className="prose prose-invert max-w-none">
                <div className="text-white/70 font-mono text-sm leading-relaxed italic">
                  <Markdown>{advice}</Markdown>
                </div>
              </div>

              <div className="p-8 bg-white/[0.02] rounded-3xl border border-white/5">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-1 h-4 bg-emerald-500 rounded-full" />
                  <h4 className="text-[10px] font-black text-white/40 uppercase tracking-[0.4em]">Agronomist Disclaimer</h4>
                </div>
                <p className="text-[10px] font-mono text-white/30 uppercase tracking-widest leading-relaxed italic">
                  "This rotation plan is generated using AI models optimized for Indian agricultural contexts. While it considers soil types and historical patterns, we strongly recommend validating these transitions with your local Krishi Vigyan Kendra (KVK) or agricultural extension officer."
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Archive Section */}
        {savedRotations.length > 0 && (
          <section className="space-y-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-1 h-4 bg-emerald-500 rounded-full" />
                <h3 className="text-[10px] font-black text-white/40 uppercase tracking-[0.4em]">Rotation Archive</h3>
              </div>
              <button 
                onClick={() => {
                  if (confirm("Clear all archived plans?")) {
                    localStorage.removeItem('agri_saved_rotations');
                    setSavedRotations([]);
                  }
                }}
                className="text-[10px] font-black text-orange-400 uppercase tracking-widest hover:text-orange-300 transition-colors"
              >
                Clear Logs
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {savedRotations.map((item) => (
                <div 
                  key={item.id} 
                  onClick={() => loadArchived(item)}
                  className="glass-panel p-8 rounded-[2rem] border border-white/10 space-y-6 group active:scale-[0.98] transition-all cursor-pointer hover:border-emerald-500/30"
                >
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-[10px] font-mono text-white/30 uppercase tracking-widest">{new Date(item.timestamp).toLocaleDateString()}</p>
                      <h4 className="text-xl font-black text-white tracking-tighter uppercase font-display">{item.location}</h4>
                    </div>
                    <div className="bg-emerald-500/10 p-3 rounded-xl border border-emerald-500/20">
                      <History className="w-5 h-5 text-emerald-500" />
                    </div>
                  </div>
                  <div className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/5">
                    <div className="flex-1 text-center">
                      <p className="text-[8px] font-mono text-white/20 uppercase tracking-widest mb-1">Current</p>
                      <p className="text-xs font-black text-white/60 uppercase tracking-widest truncate">{item.currentCrops.join(', ')}</p>
                    </div>
                    <ArrowRightLeft className="w-4 h-4 text-emerald-500/40" />
                    <div className="flex-1 text-center">
                      <p className="text-[8px] font-mono text-white/20 uppercase tracking-widest mb-1">Soil Type</p>
                      <p className="text-xs font-black text-emerald-500 uppercase tracking-widest">{item.soil}</p>
                    </div>
                  </div>
                  <button 
                    onClick={(e) => deleteArchived(item.id, e)}
                    className="w-full py-3 bg-white/5 rounded-xl text-[8px] font-black uppercase tracking-[0.3em] text-white/20 hover:text-rose-500 hover:bg-rose-500/10 transition-all"
                  >
                    Purge Record
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Footer */}
      <section className="px-6 mt-20 mb-10 text-center">
        <div className="flex items-center justify-center gap-4 mb-4 opacity-20">
          <div className="h-px w-12 bg-white" />
          <span className="text-[8px] font-mono uppercase tracking-[0.5em]">End of Stream</span>
          <div className="h-px w-12 bg-white" />
        </div>
        <p className="text-[8px] font-mono text-white/20 uppercase tracking-[0.3em]">
          © {new Date().getFullYear()} BHARAT-KRISHI-SYSTEMS
        </p>
      </section>
    </div>
  );
};

export default CropRotationAdvisor;
