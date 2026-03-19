import React from 'react';
import { generatePestVisual, identifyPest, translateText } from '../services/geminiService';
import { PestIdentification } from '../types';
import { 
  Bug, 
  Search, 
  Loader2, 
  Sparkles, 
  HelpCircle, 
  Download, 
  Database, 
  Thermometer, 
  Camera, 
  RotateCcw, 
  X, 
  Zap,
  ShieldAlert,
  Skull,
  AlertTriangle,
  ShieldCheck,
  Activity,
  ArrowRight,
  Info,
  FlaskConical,
  Filter,
  CheckCircle2,
  Languages as LangIcon
} from 'lucide-react';

const CROPS = [
  'General', 'Corn', 'Soybeans', 'Wheat', 'Rice', 'Cotton', 'Potato', 'Tomato', 'Citrus', 'Apple', 'Grapes'
];

const LIFECYCLES = [
  'All Stages', 'Egg', 'Larva / Caterpillar', 'Pupa', 'Adult', 'Nymph'
];

const LANGUAGES = [
  { name: "English", label: "English" },
  { name: "Hindi", label: "Hindi (हिंदी)" },
  { name: "Bengali", label: "Bengali (বাংলা)" },
  { name: "Telugu", label: "Telugu (తెలుగు)" },
  { name: "Marathi", label: "Marathi (मराठी)" },
  { name: "Tamil", label: "Tamil (தமிழ்)" },
  { name: "Gujarati", label: "Gujarati (ગુજરાતી)" },
  { name: "Kannada", label: "Kannada (ಕನ್ನಡ)" },
  { name: "Malayalam", label: "Malayalam (മലയാളം)" },
  { name: "Punjabi", label: "Punjabi (ਪੰਜਾਬੀ)" },
  { name: "Odia", label: "Odia (ଓଡ଼ିଆ)" },
  { name: "Assamese", label: "Assamese (ଅସମୀୟା)" },
  { name: "Urdu", label: "Urdu (اردو)" }
];

const PEST_DATABASE = [
  { name: 'Aphids', pesticides: ['Imidacloprid', 'Neem Oil', 'Dimethoate'], symptoms: 'Curled leaves, sticky honey-dew residue' },
  { name: 'Bollworm', pesticides: ['Cypermethrin', 'Spinosad', 'Indoxacarb'], symptoms: 'Holes in bolls, square dropping, internal damage' },
  { name: 'Whiteflies', pesticides: ['Acetamiprid', 'Pyriproxyfen', 'Yellow Sticky Traps'], symptoms: 'Yellowing leaves, silverleaf, stunted growth' },
  { name: 'Rice Stem Borer', pesticides: ['Cartap Hydrochloride', 'Chlorantraniliprole'], symptoms: 'Dead hearts, white heads, broken stalks' },
  { name: 'Locusts', pesticides: ['Malathion', 'Lambda-cyhalothrin', 'Fipronil'], symptoms: 'Rapid foliage loss, stripped bark' },
  { name: 'Spider Mites', pesticides: ['Abamectin', 'Spiromesifen', 'Wettable Sulphur'], symptoms: 'Fine webbing on underside, yellow stippling' },
  { name: 'Mealybugs', pesticides: ['Buprofezin', 'Cryptolaemus beetles', 'Fish Oil Rosin Soap'], symptoms: 'Cottony white masses, waxy protection' },
  { name: 'Thrips', pesticides: ['Spinetoram', 'Fipronil', 'Blue Sticky Traps'], symptoms: 'Silvering of leaves, deformed fruit' },
];

const ThreatRadar: React.FC<{ level: PestIdentification['threatLevel'] }> = ({ level }) => {
  const levels = {
    'Low': { color: 'bg-emerald-500', width: '25%', label: 'Manageable' },
    'Moderate': { color: 'bg-amber-500', width: '50%', label: 'Active Watch' },
    'High': { color: 'bg-orange-600', width: '75%', label: 'Urgent Action' },
    'Critical': { color: 'bg-rose-600', width: '100%', label: 'Emergency' }
  };
  const config = levels[level] || levels['Low'];

  return (
    <div className="space-y-2 w-full animate-in fade-in duration-1000">
      <div className="flex justify-between items-end">
        <span className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Threat Radar</span>
        <span className={`text-[10px] font-black uppercase tracking-widest ${config.color.replace('bg-', 'text-')}`}>{config.label}</span>
      </div>
      <div className="h-2.5 w-full bg-stone-100 rounded-full overflow-hidden border border-stone-200 shadow-inner">
        <div 
          className={`h-full transition-all duration-1000 ease-out ${config.color}`}
          style={{ width: config.width }}
        />
      </div>
    </div>
  );
};

// Added VisualGalleryProps interface to handle language prop
interface VisualGalleryProps {
  language: string;
}

// Updated component to accept language from props
const VisualGallery: React.FC<VisualGalleryProps> = ({ language: initialLanguage }) => {
  const [query, setQuery] = React.useState('');
  const [pesticideQuery, setPesticideQuery] = React.useState('');
  const [cropType, setCropType] = React.useState('General');
  const [lifecycle, setLifecycle] = React.useState('All Stages');
  // Initialize local language state from the provided prop
  const [language, setLanguage] = React.useState(initialLanguage);
  const [genLoading, setGenLoading] = React.useState(false);
  const [generatedImg, setGeneratedImg] = React.useState<string | null>(null);
  
  const [scanLoading, setScanLoading] = React.useState(false);
  const [translating, setTranslating] = React.useState(false);
  const [pestResult, setPestResult] = React.useState<PestIdentification | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  
  const [showCamera, setShowCamera] = React.useState(false);
  const [facingMode, setFacingMode] = React.useState<'user' | 'environment'>('environment');
  const [capturedImage, setCapturedImage] = React.useState<string | null>(null);

  const videoRef = React.useRef<HTMLVideoElement>(null);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const streamRef = React.useRef<MediaStream | null>(null);

  // Use a callback ref to handle video element mounting
  const setVideoRef = React.useCallback((node: HTMLVideoElement | null) => {
    if (node && streamRef.current) {
      node.srcObject = streamRef.current;
    }
    // @ts-ignore
    videoRef.current = node;
  }, []);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setGenLoading(true);
    setError(null);
    setPestResult(null);
    try {
      const url = await generatePestVisual(
        query, 
        cropType === 'General' ? undefined : cropType, 
        lifecycle === 'All Stages' ? undefined : lifecycle
      );
      setGeneratedImg(url);
    } catch (err) {
      console.error(err);
      setError("Generation failed.");
    } finally {
      setGenLoading(false);
    }
  };

  const handleInstantTranslate = async () => {
    if (!pestResult || translating) return;
    setTranslating(true);
    try {
      // Pack the pest result into a text blob for translation
      const textToTranslate = `
        Pest Name: ${pestResult.pestName}
        Description: ${pestResult.description}
        Damage Symptoms: ${pestResult.damageSymptoms.join(', ')}
        Control Measures: ${pestResult.controlMeasures.join(', ')}
        Lifecycle Stage: ${pestResult.lifecycleStage}
      `;
      
      const translated = await translateText(textToTranslate, language);
      
      // Attempt to parse the translated text back into structure if possible, 
      // but simpler to just show it or replace descriptions.
      // For a better UX, we just update the descriptive fields.
      const lines = translated.split('\n');
      const updatedResult = { ...pestResult };
      
      // Simple parsing of translated lines
      lines.forEach(line => {
        if (line.toLowerCase().includes('name:') || line.toLowerCase().includes('नाम:')) updatedResult.pestName = line.split(':')[1]?.trim() || updatedResult.pestName;
        if (line.toLowerCase().includes('description:') || line.toLowerCase().includes('विवरण:')) updatedResult.description = line.split(':')[1]?.trim() || updatedResult.description;
        if (line.toLowerCase().includes('stage:') || line.toLowerCase().includes('चरण:')) updatedResult.lifecycleStage = line.split(':')[1]?.trim() || updatedResult.lifecycleStage;
      });
      
      setPestResult(updatedResult);
    } catch (err) {
      console.error("Translation failed", err);
    } finally {
      setTranslating(false);
    }
  };

  const startCamera = async () => {
    try {
      if (streamRef.current) stopCamera();
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facingMode },
        audio: false
      });
      streamRef.current = stream;
      setShowCamera(true);
      setError(null);
    } catch (err) {
      alert("Camera access denied.");
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setShowCamera(false);
  };

  const switchCamera = () => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
    setTimeout(() => startCamera(), 100);
  };

  const captureAndIdentify = async () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      // Ensure video is ready
      if (video.videoWidth === 0 || video.videoHeight === 0) {
        console.warn("Video not ready for capture");
        // Try again in 100ms
        setTimeout(captureAndIdentify, 100);
        return;
      }

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg');
        const base64String = dataUrl.split(',')[1];
        setCapturedImage(dataUrl);
        stopCamera();
        
        setScanLoading(true);
        setPestResult(null);
        setGeneratedImg(null);
        try {
          // Pass the current language to the identification service
          const result = await identifyPest(base64String, language);
          setPestResult(result);
          const refUrl = await generatePestVisual(result.pestName);
          setGeneratedImg(refUrl);
        } catch (err) {
          setError("Identification failed.");
        } finally {
          setScanLoading(false);
        }
      }
    }
  };

  const filteredRemedies = PEST_DATABASE.filter(pest => 
    !pesticideQuery || 
    pest.pesticides.some(p => p.toLowerCase().includes(pesticideQuery.toLowerCase())) ||
    pest.name.toLowerCase().includes(pesticideQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-12 animate-in fade-in slide-in-from-bottom-6 duration-700">
      <div className="bg-white rounded-[2.5rem] p-6 md:p-8 shadow-sm border border-stone-200">
        <h2 className="text-2xl font-black mb-2 flex items-center gap-3 text-stone-900">
          <div className="bg-stone-100 p-2.5 rounded-2xl">
            <Bug className="text-stone-700 w-6 h-6" />
          </div>
          Pest Intelligence Hub
        </h2>
        <p className="text-stone-500 text-sm font-medium mb-8 leading-relaxed">
          Biometric identification, high-fidelity reference library, and treatment lookup.
        </p>

        <div className="grid grid-cols-2 gap-4 mb-8">
          <button 
            onClick={() => startCamera()}
            className="bg-[#825500] text-white font-black py-4 rounded-2xl flex items-center justify-center gap-3 hover:bg-black transition-all shadow-lg active:scale-95 text-xs uppercase tracking-widest"
          >
            <Camera className="w-5 h-5" /> Live Bio-Scan
          </button>
          <div className="bg-stone-50 text-stone-400 py-4 rounded-2xl flex items-center justify-center text-xs font-black uppercase tracking-widest border border-stone-100">
             Knowledge Base
          </div>
        </div>

        {/* Treatment Reference Search */}
        <div className="space-y-4 mb-8">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-[10px] font-black text-stone-400 uppercase tracking-[0.2em] flex items-center gap-2">
              <FlaskConical className="w-4 h-4 text-emerald-600" /> Treatment Reference
            </h3>
            <span className="text-[9px] font-bold text-stone-300 uppercase">Chemical & Organic</span>
          </div>
          <div className="relative">
            <input
              type="text"
              placeholder="Search by pesticide (e.g. 'Neem' or 'Malathion')..."
              value={pesticideQuery}
              onChange={(e) => setPesticideQuery(e.target.value)}
              className="w-full bg-stone-50 border border-stone-200 p-5 pl-14 rounded-[1.5rem] focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-semibold text-sm shadow-inner"
            />
            <Filter className="absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 text-stone-300" />
          </div>

          {pesticideQuery && (
            <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
               {filteredRemedies.length > 0 ? (
                 filteredRemedies.map((pest, idx) => (
                   <div key={idx} className="bg-white border-2 border-stone-100 p-5 rounded-[1.75rem] hover:border-emerald-200 transition-all group">
                      <div className="flex items-center justify-between mb-3">
                         <h4 className="font-black text-stone-900 text-sm tracking-tight flex items-center gap-2">
                           <Bug className="w-3.5 h-3.5 text-[#825500]" /> {pest.name}
                         </h4>
                         <button 
                           onClick={() => {setQuery(pest.name); handleGenerate(new Event('submit') as any);}}
                           className="text-[9px] font-black text-emerald-600 uppercase tracking-widest hover:text-emerald-700"
                         >
                           Generate Ref
                         </button>
                      </div>
                      <div className="space-y-2">
                         <div className="flex flex-wrap gap-2">
                            {pest.pesticides.map((p, i) => (
                              <span key={i} className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-tighter border ${p.toLowerCase().includes(pesticideQuery.toLowerCase()) ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-stone-50 text-stone-500 border-stone-100'}`}>
                                {p}
                              </span>
                            ))}
                         </div>
                         <p className="text-[10px] text-stone-400 italic font-medium leading-relaxed">
                           Symptoms: {pest.symptoms}
                         </p>
                      </div>
                   </div>
                 ))
               ) : (
                 <div className="py-8 text-center bg-stone-50 rounded-[2rem] border border-dashed border-stone-200">
                    <p className="text-xs font-bold text-stone-400 italic">No matches found in remedy database.</p>
                 </div>
               )}
            </div>
          )}
        </div>

        <form onSubmit={handleGenerate} className="space-y-6 border-t border-stone-100 pt-8">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-[10px] font-black text-stone-400 uppercase tracking-[0.2em] flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" /> AI Morphology Generator
            </h3>
          </div>
          <div className="relative">
            <input
              type="text"
              placeholder="Query pest identification (e.g., 'Locusts')"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full bg-stone-50 border border-stone-200 p-5 pl-14 rounded-[1.5rem] focus:ring-2 focus:ring-[#825500] outline-none transition-all font-semibold text-sm shadow-inner"
            />
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 text-stone-300" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-stone-400 ml-2 uppercase tracking-widest">Target Crop</label>
              <select
                value={cropType}
                onChange={(e) => setCropType(e.target.value)}
                className="w-full bg-stone-50 border border-stone-200 p-4 rounded-2xl outline-none appearance-none font-bold text-xs text-[#825500] cursor-pointer shadow-sm"
              >
                {CROPS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-stone-400 ml-2 uppercase tracking-widest">Morphology Stage</label>
              <select
                value={lifecycle}
                onChange={(e) => setLifecycle(e.target.value)}
                className="w-full bg-stone-50 border border-stone-200 p-4 rounded-2xl outline-none appearance-none font-bold text-xs text-[#825500] cursor-pointer shadow-sm"
              >
                {LIFECYCLES.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-stone-400 ml-2 uppercase tracking-widest">Dialect</label>
              <div className="relative">
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 p-4 rounded-2xl outline-none appearance-none font-bold text-xs text-[#825500] cursor-pointer shadow-sm"
                >
                  {LANGUAGES.map(l => <option key={l.name} value={l.name}>{l.label}</option>)}
                </select>
                <LangIcon className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-300 pointer-events-none" />
              </div>
            </div>
          </div>

          <button 
            type="submit"
            disabled={genLoading}
            className="w-full bg-stone-900 text-white font-black py-4.5 rounded-[1.5rem] hover:bg-black transition-all shadow-xl active:scale-[0.98] flex items-center justify-center gap-3 disabled:opacity-50"
          >
            {genLoading ? <Loader2 className="animate-spin w-5 h-5" /> : <Sparkles className="w-5 h-5" />}
            Retrieve Reference Data
          </button>
        </form>

        {scanLoading && (
          <div className="py-20 flex flex-col items-center justify-center text-[#825500] space-y-5">
             <div className="relative">
                <div className="w-20 h-20 border-4 border-amber-50 rounded-full shadow-inner"></div>
                <div className="absolute inset-0 w-20 h-20 border-4 border-[#825500] border-t-transparent rounded-full animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <Activity className="w-8 h-8 animate-pulse text-[#825500]" />
                </div>
            </div>
            <p className="font-black uppercase tracking-[0.2em] text-[10px] animate-pulse">Analyzing Biological Markers...</p>
          </div>
        )}

        {(pestResult || generatedImg) && !scanLoading && (
          <div className="mt-12 space-y-8 animate-in fade-in zoom-in-95 duration-700">
            {pestResult && (
              <div className="space-y-6 relative overflow-hidden">
                <div className="bg-stone-50 border border-stone-100 rounded-[2.5rem] p-7 shadow-inner relative">
                  <div className="flex items-center justify-between mb-8">
                      <div className="flex items-center gap-5">
                          <div className="p-4 rounded-[1.75rem] bg-white text-[#825500] shadow-md border border-stone-100">
                              <Bug className="w-8 h-8" />
                          </div>
                          <div className="flex-1">
                              <h3 className="text-3xl font-black text-stone-900 tracking-tighter leading-none">{pestResult.pestName}</h3>
                              <p className="text-[10px] text-[#825500] font-black italic mt-2 uppercase tracking-widest opacity-80">
                                {pestResult.scientificName}
                              </p>
                          </div>
                      </div>
                      <button 
                        onClick={handleInstantTranslate}
                        disabled={translating}
                        className="flex items-center gap-2 bg-white border border-stone-200 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest text-[#825500] hover:bg-stone-50 active:scale-95 transition-all shadow-sm"
                      >
                         {translating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
                         {language}
                      </button>
                  </div>

                  <div className="bg-white border border-stone-200/60 p-6 rounded-[2rem] shadow-sm mb-6">
                    <ThreatRadar level={pestResult.threatLevel} />
                  </div>

                  <div className="bg-white/40 p-5 rounded-[1.5rem] border border-stone-200/50 mb-6">
                    <div className="flex items-center gap-2 text-stone-400 font-black text-[9px] uppercase tracking-widest mb-2">
                       <Info className="w-3.5 h-3.5" /> Intelligence Abstract
                    </div>
                    <p className="text-stone-600 text-sm font-medium leading-relaxed">{pestResult.description}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-stone-100/50 p-4 rounded-2xl border border-stone-200/40">
                       <p className="text-[9px] font-black text-stone-400 uppercase tracking-widest mb-1">Current Lifecycle</p>
                       <p className="text-sm font-black text-stone-800">{pestResult.lifecycleStage}</p>
                    </div>
                    <div className="bg-stone-100/50 p-4 rounded-2xl border border-stone-200/40">
                       <p className="text-[9px] font-black text-stone-400 uppercase tracking-widest mb-1">Detection Conf.</p>
                       <p className="text-sm font-black text-stone-800">{(pestResult.confidence * 100).toFixed(0)}%</p>
                    </div>
                  </div>

                  {translating && (
                    <div className="absolute inset-0 bg-stone-50/60 backdrop-blur-sm z-20 flex flex-col items-center justify-center gap-2">
                        <Loader2 className="w-8 h-8 animate-spin text-[#825500]" />
                        <p className="text-[10px] font-black uppercase text-[#825500] tracking-widest">Translating Intelligence...</p>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="bg-orange-50/50 border border-orange-100 rounded-[2.25rem] p-6 shadow-sm group">
                      <div className="flex items-center gap-3 mb-6">
                         <div className="bg-orange-500 text-white p-2.5 rounded-xl shadow-lg shadow-orange-500/20 group-hover:scale-110 transition-transform">
                            <AlertTriangle className="w-5 h-5" />
                         </div>
                         <h4 className="font-black text-orange-900 text-sm uppercase tracking-widest">Symptoms</h4>
                      </div>
                      <div className="space-y-2.5">
                        {pestResult.damageSymptoms.map((s, i) => (
                          <div key={i} className="bg-white border border-orange-100/50 p-4 rounded-2xl flex gap-3 items-start shadow-inner">
                            <div className="w-5 h-5 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center shrink-0">
                               <ArrowRight className="w-3 h-3" />
                            </div>
                            <p className="text-xs font-bold text-orange-800 leading-snug">{s}</p>
                          </div>
                        ))}
                      </div>
                   </div>

                   <div className="bg-emerald-50/50 border border-emerald-100 rounded-[2.25rem] p-6 shadow-sm group">
                      <div className="flex items-center gap-3 mb-6">
                         <div className="bg-emerald-600 text-white p-2.5 rounded-xl shadow-lg shadow-emerald-600/20 group-hover:scale-110 transition-transform">
                            <ShieldCheck className="w-5 h-5" />
                         </div>
                         <h4 className="font-black text-emerald-900 text-sm uppercase tracking-widest">Control Measures</h4>
                      </div>
                      <div className="space-y-2.5">
                        {pestResult.controlMeasures.map((m, i) => (
                          <div key={i} className="bg-white border border-emerald-100/50 p-4 rounded-2xl flex gap-3 items-start shadow-inner">
                            <div className="w-5 h-5 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                               <Zap className="w-3 h-3" />
                            </div>
                            <p className="text-xs font-bold text-emerald-800 leading-snug">{m}</p>
                          </div>
                        ))}
                      </div>
                   </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {capturedImage && (
                <div className="space-y-3">
                  <p className="text-[10px] font-black text-stone-400 uppercase tracking-[0.2em] ml-4">Subject Specimen</p>
                  <div className="aspect-square rounded-[2.5rem] overflow-hidden border-4 border-stone-100 shadow-md">
                    <img src={capturedImage} className="w-full h-full object-cover" alt="Captured" />
                  </div>
                </div>
              )}
              {generatedImg && (
                <div className="space-y-3">
                  <p className="text-[10px] font-black text-stone-400 uppercase tracking-[0.2em] ml-4">AI Reference Plate</p>
                  <div className="aspect-square rounded-[2.5rem] overflow-hidden border-4 border-dashed border-[#825500]/20 relative group shadow-md bg-stone-50">
                    <img src={generatedImg} className="w-full h-full object-cover" alt="Reference" />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                      <a 
                        href={generatedImg} 
                        download="Pest_Intelligence_Ref.png"
                        className="bg-white text-stone-900 px-8 py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-3 shadow-2xl hover:scale-105 transition-transform"
                      >
                        <Download className="w-4 h-4" /> Save Reference
                      </a>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {!pestResult && !generatedImg && !scanLoading && !genLoading && !pesticideQuery && (
          <div className="py-24 text-center text-stone-200 flex flex-col items-center">
            <HelpCircle className="w-16 h-16 mb-4 opacity-10" />
            <p className="max-w-[240px] text-[11px] font-black uppercase tracking-[0.2em] leading-relaxed opacity-40">
              Initiate a live scan, lookup pesticides, or query the AI for diagnostics.
            </p>
          </div>
        )}
      </div>

      {showCamera && (
        <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center">
          <div className="absolute top-8 left-0 right-0 px-6 flex items-center justify-between z-10">
            <button onClick={stopCamera} className="bg-white/10 backdrop-blur-md p-3 rounded-full text-white">
              <X className="w-6 h-6" />
            </button>
            <div className="bg-white/10 backdrop-blur-md px-5 py-2 rounded-full border border-white/20">
               <span className="text-white text-[10px] font-black uppercase tracking-[0.15em] flex items-center gap-2">
                 <Zap className="w-3.5 h-3.5 text-amber-400" /> Bio-Metric Lens
               </span>
            </div>
            <button onClick={switchCamera} className="bg-white/10 backdrop-blur-md p-3 rounded-full text-white">
              <RotateCcw className="w-6 h-6" />
            </button>
          </div>
          <video ref={setVideoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
          <canvas ref={canvasRef} className="hidden" />
          <div className="absolute bottom-12 flex flex-col items-center gap-8 w-full px-8">
            <button onClick={captureAndIdentify} className="w-20 h-20 rounded-full bg-white border-4 border-stone-200 p-1 shadow-[0_0_40px_rgba(255,255,255,0.3)] active:scale-90 transition-transform">
              <div className="w-full h-full rounded-full border-2 border-stone-900 bg-white" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default VisualGallery;