
import React from 'react';
import { analyzeSoil } from '../services/geminiService';
import { SoilReport } from '../types';
import { 
  Camera, 
  Loader2, 
  Thermometer, 
  Droplets, 
  RefreshCw, 
  Layers, 
  Save, 
  History, 
  Trash2, 
  Calendar, 
  ChevronRight, 
  X, 
  RotateCcw,
  Zap,
  FlaskConical,
  Beaker,
  ShieldCheck,
  Activity,
  ArrowRight,
  TrendingDown,
  TrendingUp,
  Minus
} from 'lucide-react';

interface SavedSoilReport extends SoilReport {
  id: string;
  date: string;
  image?: string;
}

const NpkGauge: React.FC<{ label: string, value: 'Low' | 'Medium' | 'High', color: string }> = ({ label, value, color }) => {
  const icon = value === 'High' ? <TrendingUp className="w-3 h-3" /> : value === 'Low' ? <TrendingDown className="w-3 h-3" /> : <Minus className="w-3 h-3" />;
  
  return (
    <div className="flex-1 bg-white border border-stone-100 p-4 rounded-[2rem] flex flex-col items-center gap-2 shadow-sm group hover:border-stone-300 transition-all">
      <span className="text-[8px] font-black text-stone-400 uppercase tracking-[0.2em]">{label}</span>
      <div className={`w-10 h-10 rounded-2xl ${color} text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
        {icon}
      </div>
      <span className={`text-[10px] font-black uppercase tracking-widest ${color.replace('bg-', 'text-')}`}>{value}</span>
    </div>
  );
};

const PhMeter: React.FC<{ value: string }> = ({ value }) => {
  const ph = parseFloat(value) || 7.0;
  const percentage = Math.min(Math.max(((ph - 0) / 14) * 100, 0), 100);
  
  return (
    <div className="space-y-6 w-full">
      <div className="flex justify-between items-end">
        <div className="flex flex-col">
          <span className="text-[10px] font-black text-rose-500 uppercase tracking-[0.3em] mb-1">Acidic</span>
          <span className="text-[8px] font-bold text-stone-300 uppercase">pH 0-6</span>
        </div>
        <div className="flex flex-col items-center">
           <div className="relative">
             <span className="text-6xl font-black text-stone-950 leading-none tracking-tighter">{ph.toFixed(1)}</span>
             <div className="absolute -top-2 -right-4 w-3 h-3 bg-emerald-500 rounded-full animate-pulse"></div>
           </div>
           <span className="text-[10px] font-black text-stone-400 uppercase mt-4 tracking-[0.4em]">Soil Alkalinity Index</span>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.3em] mb-1 text-right">Alkaline</span>
          <span className="text-[8px] font-bold text-stone-300 uppercase">pH 8-14</span>
        </div>
      </div>
      <div className="h-6 w-full bg-stone-100 rounded-full relative shadow-inner overflow-hidden p-1">
        <div className="absolute inset-1 bg-gradient-to-r from-rose-500 via-emerald-500 to-indigo-700 rounded-full opacity-80"></div>
        <div 
          className="absolute top-0 bottom-0 w-2 bg-white shadow-[0_0_15px_rgba(255,255,255,1)] z-10 transition-all duration-1000 ease-out rounded-full border border-stone-200"
          style={{ left: `calc(${percentage}% - 4px)` }}
        />
      </div>
    </div>
  );
};

// Fixed error: Added SoilLabProps and used language from props
interface SoilLabProps {
  language: string;
}

const SoilLab: React.FC<SoilLabProps> = ({ language }) => {
  const [image, setImage] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [report, setReport] = React.useState<SoilReport | null>(null);
  const [history, setHistory] = React.useState<SavedSoilReport[]>(() => {
    const saved = localStorage.getItem('agriassist_soil_history');
    return saved ? JSON.parse(saved) : [];
  });
  const [saveStatus, setSaveStatus] = React.useState<'idle' | 'saved'>('idle');
  const [showCamera, setProjectedShowCamera] = React.useState(false);
  const [facingMode, setFacingMode] = React.useState<'user' | 'environment'>('environment');
  
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const streamRef = React.useRef<MediaStream | null>(null);

  React.useEffect(() => {
    if (showCamera && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
    }
  }, [showCamera]);

  const startCamera = async () => {
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode }, audio: false });
      streamRef.current = stream;
      setProjectedShowCamera(true);
    } catch (err) { alert("Camera access required."); }
  };

  const stopCamera = () => {
    if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
    setProjectedShowCamera(false);
  };

  const handleAnalyze = async (base64: string) => {
    setLoading(true);
    setReport(null);
    setSaveStatus('idle');
    try {
      const result = await analyzeSoil(base64, language);
      setReport(result);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg');
        setImage(dataUrl);
        stopCamera();
        handleAnalyze(dataUrl.split(',')[1]);
      }
    }
  };

  const saveReport = () => {
    if (!report) return;
    const newReport = { ...report, id: Date.now().toString(), date: new Date().toISOString(), image: image || undefined };
    const updated = [newReport, ...history];
    setHistory(updated);
    localStorage.setItem('agriassist_soil_history', JSON.stringify(updated));
    setSaveStatus('saved');
    setTimeout(() => setSaveStatus('idle'), 3000);
  };

  const deleteHistory = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = history.filter(h => h.id !== id);
    setHistory(updated);
    localStorage.setItem('agriassist_soil_history', JSON.stringify(updated));
  };

  return (
    <div className="w-full flex flex-col pb-32 animate-in fade-in duration-700 bg-[#fcfcf9]">
      {/* Editorial Header */}
      <section className="px-6 md:px-12 pt-8 mb-12">
        <div className="max-w-4xl">
          <span className="text-[10px] font-black text-orange-600 uppercase tracking-[0.4em] leading-none mb-4 block">Biometric Analysis</span>
          <h1 className="text-6xl md:text-8xl font-black text-stone-950 leading-[0.85] tracking-tighter uppercase mb-6">
            Soil<br />
            <span className="italic text-stone-400 text-5xl md:text-7xl">Diagnostics.</span>
          </h1>
          <p className="text-stone-500 text-lg md:text-xl font-medium tracking-tight max-w-2xl">
            Real-time mineral composition parsing and spectral soil health mapping via high-resolution bio-lens.
          </p>
        </div>
      </section>

      {/* Main Interface */}
      <section className="px-6 md:px-12 mb-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Camera / Image Section */}
          <div className="lg:col-span-5 space-y-8">
            <div 
              onClick={() => !showCamera && startCamera()} 
              className="aspect-square rounded-[4rem] bg-white border-2 border-dashed border-stone-200 flex flex-col items-center justify-center cursor-pointer overflow-hidden group shadow-sm hover:border-orange-500 transition-all relative"
            >
              {image ? (
                <>
                  <img src={image} className="w-full h-full object-cover" alt="Soil Specimen" />
                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <RefreshCw className="w-12 h-12 text-white" />
                  </div>
                </>
              ) : (
                <div className="text-stone-300 flex flex-col items-center gap-6 p-12 text-center">
                  <div className="w-24 h-24 bg-stone-50 rounded-[2rem] flex items-center justify-center shadow-inner group-hover:bg-orange-50 group-hover:text-orange-600 transition-all">
                    <Camera className="w-10 h-10" />
                  </div>
                  <div>
                    <span className="font-black text-xs uppercase tracking-[0.3em] block mb-2 text-stone-950">Initialize Bio-Lens</span>
                    <p className="text-xs font-medium text-stone-400 leading-relaxed">Position soil specimen within the optical frame for spectral parsing.</p>
                  </div>
                </div>
              )}
            </div>
            
            <button 
              onClick={startCamera} 
              className="w-full bg-stone-950 text-white font-black py-8 rounded-[2.5rem] shadow-2xl flex items-center justify-center gap-4 active:scale-[0.98] transition-all group overflow-hidden relative"
            >
              <div className="absolute inset-0 bg-orange-600 translate-y-full group-hover:translate-y-0 transition-transform duration-500"></div>
              <div className="relative z-10 flex items-center gap-4">
                <Zap className="w-6 h-6 fill-current" />
                <span className="uppercase tracking-[0.4em] text-xs">Activate Scanner</span>
              </div>
            </button>
          </div>

          {/* Results Section */}
          <div className="lg:col-span-7">
            <div className="bg-white border border-stone-100 rounded-[4rem] p-8 md:p-12 shadow-sm min-h-full flex flex-col">
              {loading ? (
                <div className="flex-1 flex flex-col items-center justify-center text-stone-500 space-y-8 py-20">
                  <div className="relative">
                    <div className="w-24 h-24 border-8 border-stone-50 rounded-full"></div>
                    <div className="absolute inset-0 w-24 h-24 border-8 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                    <FlaskConical className="absolute inset-0 m-auto w-8 h-8 text-orange-500 animate-pulse" />
                  </div>
                  <div className="text-center">
                    <p className="font-black text-xs uppercase tracking-[0.4em] text-stone-950 mb-2">Analyzing Mineral Matrix</p>
                    <p className="text-xs font-medium text-stone-400">Parsing NPK levels and pH balance via AI vision...</p>
                  </div>
                </div>
              ) : report ? (
                <div className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse"></div>
                      <h4 className="text-[10px] font-black text-stone-400 uppercase tracking-[0.4em]">Health Card Finalized</h4>
                    </div>
                    <button 
                      onClick={saveReport} 
                      disabled={saveStatus === 'saved'} 
                      className={`flex items-center gap-3 px-8 py-3 rounded-full text-[10px] font-black uppercase tracking-widest transition-all border ${saveStatus === 'saved' ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-stone-950 border-stone-950 text-white shadow-xl hover:bg-orange-600 hover:border-orange-600'}`}
                    >
                      {saveStatus === 'saved' ? <ShieldCheck className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                      {saveStatus === 'saved' ? 'Log Archived' : 'Archive Result'}
                    </button>
                  </div>
                  
                  {/* pH Meter Card */}
                  <div className="bg-stone-50 border border-stone-100 p-10 rounded-[3rem] shadow-inner">
                     <PhMeter value={report.estimatedPh} />
                  </div>

                  {/* NPK Grid */}
                  <div className="space-y-6">
                     <div className="flex items-center gap-4">
                        <Activity className="w-5 h-5 text-orange-600" />
                        <h4 className="text-[10px] font-black text-stone-950 uppercase tracking-[0.4em]">Nutrient Profile</h4>
                        <div className="h-px flex-1 bg-stone-100"></div>
                     </div>
                     <div className="flex flex-col sm:flex-row gap-4">
                        <NpkGauge label="Nitrogen" value={report.n} color="bg-orange-500" />
                        <NpkGauge label="Phosphorus" value={report.p} color="bg-amber-500" />
                        <NpkGauge label="Potassium" value={report.k} color="bg-emerald-500" />
                     </div>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 gap-6">
                    <div className="bg-white border border-stone-100 p-8 rounded-[3rem] flex flex-col justify-between h-40 shadow-sm group hover:border-orange-200 transition-all">
                      <div className="w-12 h-12 bg-stone-50 rounded-2xl flex items-center justify-center text-stone-400 group-hover:bg-orange-50 group-hover:text-orange-600 transition-all">
                        <Layers className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-[9px] font-black uppercase tracking-widest text-stone-400 mb-1">Soil Texture</p>
                        <p className="text-xl font-black text-stone-950 uppercase tracking-tighter">{report.texture}</p>
                      </div>
                    </div>
                    <div className="bg-white border border-stone-100 p-8 rounded-[3rem] flex flex-col justify-between h-40 shadow-sm group hover:border-emerald-200 transition-all">
                      <div className="w-12 h-12 bg-stone-50 rounded-2xl flex items-center justify-center text-stone-400 group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-all">
                        <Droplets className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-[9px] font-black uppercase tracking-widest text-stone-400 mb-1">Organic Matter</p>
                        <p className="text-xl font-black text-stone-950 uppercase tracking-tighter">{report.organicMatter}</p>
                      </div>
                    </div>
                  </div>

                  {/* Recommendations */}
                  <div className="space-y-6">
                    <div className="flex items-center gap-4">
                      <Beaker className="w-5 h-5 text-emerald-600" />
                      <h4 className="text-[10px] font-black text-stone-950 uppercase tracking-[0.4em]">Expert Directives</h4>
                      <div className="h-px flex-1 bg-stone-100"></div>
                    </div>
                    <div className="space-y-4">
                      {report.recommendations.map((rec, i) => (
                        <div key={i} className="flex gap-6 bg-stone-50 p-8 rounded-[2.5rem] border border-stone-100 text-base font-medium text-stone-700 shadow-sm group hover:bg-white hover:border-orange-200 transition-all">
                          <div className="w-10 h-10 rounded-2xl bg-white border border-stone-100 text-stone-950 flex items-center justify-center shrink-0 text-xs font-black shadow-sm group-hover:bg-orange-500 group-hover:text-white transition-all">
                            0{i + 1}
                          </div>
                          <p className="italic leading-relaxed">"{rec}"</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-stone-300 py-20 text-center px-12">
                  <div className="w-20 h-20 bg-stone-50 rounded-[2rem] flex items-center justify-center mb-8 opacity-40">
                    <FlaskConical className="w-10 h-10" />
                  </div>
                  <h4 className="text-stone-950 font-black text-lg uppercase tracking-tighter mb-4">Laboratory Idle</h4>
                  <p className="text-sm font-medium leading-relaxed max-w-xs text-stone-400">Capture soil specimen for digital spectral analysis and NPK grading. AI will parse mineral composition automatically.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* History Section */}
      {history.length > 0 && (
        <section className="px-6 md:px-12 mt-16">
          <div className="flex items-center justify-between mb-10 px-4">
            <h3 className="text-[10px] font-black text-stone-400 uppercase tracking-[0.4em]">Laboratory Archives</h3>
            <div className="h-px flex-1 mx-8 bg-stone-100"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {history.map(h => (
              <div 
                key={h.id} 
                className="bg-white border border-stone-100 rounded-[3rem] overflow-hidden group hover:shadow-2xl hover:border-orange-500 transition-all flex flex-col"
              >
                <div className="aspect-video relative overflow-hidden">
                  {h.image ? (
                    <img src={h.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt="Soil Archive" />
                  ) : (
                    <div className="w-full h-full bg-stone-100 flex items-center justify-center text-stone-300">
                      <Layers className="w-12 h-12" />
                    </div>
                  )}
                  <div className="absolute top-4 left-4 bg-black/50 backdrop-blur-md px-4 py-1.5 rounded-full text-[9px] font-black text-white uppercase tracking-widest">
                    {new Date(h.date).toLocaleDateString()}
                  </div>
                  <button 
                    onClick={(e) => deleteHistory(h.id, e)}
                    className="absolute top-4 right-4 p-2.5 bg-white/10 backdrop-blur-md rounded-full text-white hover:bg-rose-500 transition-all opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="p-8 space-y-6">
                  <div className="flex justify-between items-center">
                    <h5 className="text-xl font-black text-stone-950 uppercase tracking-tighter">{h.texture} Matrix</h5>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black text-stone-400 uppercase">pH</span>
                      <span className="text-lg font-black text-stone-950">{h.estimatedPh}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <div className={`flex-1 h-1 rounded-full ${h.n === 'High' ? 'bg-orange-500' : h.n === 'Medium' ? 'bg-orange-300' : 'bg-orange-100'}`}></div>
                    <div className={`flex-1 h-1 rounded-full ${h.p === 'High' ? 'bg-amber-500' : h.p === 'Medium' ? 'bg-amber-300' : 'bg-amber-100'}`}></div>
                    <div className={`flex-1 h-1 rounded-full ${h.k === 'High' ? 'bg-emerald-500' : h.k === 'Medium' ? 'bg-emerald-300' : 'bg-emerald-100'}`}></div>
                  </div>
                  <button 
                    onClick={() => {
                      setReport(h);
                      setImage(h.image || null);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="w-full py-4 rounded-2xl border border-stone-100 text-[10px] font-black uppercase tracking-widest text-stone-400 hover:bg-stone-950 hover:text-white hover:border-stone-950 transition-all"
                  >
                    Review Analysis
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Camera Overlay */}
      {showCamera && (
        <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center">
          <div className="absolute top-8 left-0 right-0 px-8 flex items-center justify-between z-10">
            <button onClick={stopCamera} className="bg-white/10 backdrop-blur-md p-4 rounded-full text-white hover:bg-white/20 transition-all"><X className="w-6 h-6" /></button>
            <div className="flex flex-col items-center">
              <span className="text-white text-[10px] font-black uppercase tracking-[0.4em]">Spectral Bio-Lens</span>
              <div className="flex items-center gap-2 mt-1">
                <div className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-pulse"></div>
                <span className="text-white/40 text-[8px] font-bold uppercase tracking-widest">Live Feed</span>
              </div>
            </div>
            <button onClick={() => setFacingMode(prev => prev === 'user' ? 'environment' : 'user')} className="bg-white/10 backdrop-blur-md p-4 rounded-full text-white hover:bg-white/20 transition-all"><RotateCcw className="w-6 h-6" /></button>
          </div>
          
          {/* Viewfinder Corners */}
          <div className="relative w-full max-w-md aspect-square p-8">
            <div className="absolute top-0 left-0 w-16 h-16 border-t-4 border-l-4 border-orange-500 rounded-tl-[3rem]"></div>
            <div className="absolute top-0 right-0 w-16 h-16 border-t-4 border-r-4 border-orange-500 rounded-tr-[3rem]"></div>
            <div className="absolute bottom-0 left-0 w-16 h-16 border-b-4 border-l-4 border-orange-500 rounded-bl-[3rem]"></div>
            <div className="absolute bottom-0 right-0 w-16 h-16 border-b-4 border-r-4 border-orange-500 rounded-br-[3rem]"></div>
            
            <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover rounded-[2.5rem]" />
            
            {/* Scanning Line Animation */}
            <div className="absolute left-8 right-8 h-1 bg-orange-500/50 shadow-[0_0_15px_rgba(249,115,22,0.5)] animate-[scan_3s_ease-in-out_infinite] z-10"></div>
          </div>

          <div className="absolute bottom-12 w-full px-8 flex flex-col items-center gap-8">
            <p className="text-white/60 text-[10px] font-medium uppercase tracking-widest text-center max-w-xs">Align soil specimen within the frame. Ensure adequate lighting for spectral parsing.</p>
            <button onClick={capturePhoto} className="w-24 h-24 rounded-full bg-white/10 backdrop-blur-md border-4 border-white/20 p-2 shadow-2xl active:scale-90 transition-transform group">
              <div className="w-full h-full rounded-full bg-white flex items-center justify-center group-hover:bg-orange-500 transition-colors">
                <div className="w-12 h-12 border-2 border-stone-950 rounded-full group-hover:border-white transition-colors"></div>
              </div>
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes scan {
          0%, 100% { top: 2rem; }
          50% { top: calc(100% - 3rem); }
        }
      `}</style>
    </div>
  );
};

const Stat: React.FC<{ label: string, value: string, icon: React.ReactNode, color: string, textColor: string }> = ({ label, value, icon, color, textColor }) => (
  <div className={`${color} p-4 rounded-[1.75rem] border flex flex-col justify-between h-28 shadow-sm`}>
    <div className={`p-2 w-fit rounded-xl bg-white/60 shadow-sm ${textColor}`}>{icon}</div>
    <div>
      <p className={`text-[9px] font-black uppercase ${textColor} opacity-60`}>{label}</p>
      <p className={`text-xs font-black ${textColor} truncate`}>{value}</p>
    </div>
  </div>
);

export default SoilLab;
