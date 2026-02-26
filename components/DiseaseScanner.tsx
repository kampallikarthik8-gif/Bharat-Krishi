import React from 'react';
import { diagnosePlant, identifyPest, generatePestVisual } from '../services/geminiService';
import { DiseaseDiagnosis, PestIdentification, Task } from '../types';
import { 
  Camera, 
  AlertTriangle, 
  Sprout, 
  Info, 
  ChevronLeft, 
  Share2, 
  ShieldCheck, 
  Stethoscope,
  Bug,
  Sparkles,
  Search,
  ShieldAlert,
  Skull,
  X,
  RotateCcw,
  Zap,
  RefreshCw,
  Plus,
  CheckCircle2,
  Clock,
  Database,
  Target,
  FlaskConical,
  ClipboardList,
  Activity,
  Heart,
  FileText,
  BadgeCheck,
  AlertCircle,
  Eye,
  Scan
} from 'lucide-react';

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

const ConfidenceGauge: React.FC<{ confidence: number, healthy: boolean }> = ({ confidence, healthy }) => {
  const percentage = Math.round(confidence * 100);
  const color = healthy ? 'text-emerald-300' : 'text-amber-200';
  
  return (
    <div className="flex flex-col items-center">
       <div className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60 mb-1">AI Confidence</div>
       <div className="flex items-baseline gap-1">
          <span className={`text-2xl font-black ${color}`}>{percentage}</span>
          <span className={`text-[10px] font-bold ${color} opacity-60`}>%</span>
       </div>
    </div>
  );
};

interface DiseaseScannerProps {
  language: string;
}

const DiseaseScanner: React.FC<DiseaseScannerProps> = ({ language }) => {
  const [image, setImage] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [scanMode, setScanMode] = React.useState<'disease' | 'pest'>('disease');
  const [diagnosis, setDiagnosis] = React.useState<DiseaseDiagnosis | null>(null);
  const [pestResult, setPestResult] = React.useState<PestIdentification | null>(null);
  const [referenceImg, setReferenceImg] = React.useState<string | null>(null);
  const [showCamera, setShowCamera] = React.useState(false);
  const [facingMode, setFacingMode] = React.useState<'user' | 'environment'>('environment');
  const [addedTasks, setAddedTasks] = React.useState<Set<string>>(new Set());
  
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
      if (streamRef.current) stopCamera();
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facingMode },
        audio: false
      });
      streamRef.current = stream;
      setShowCamera(true);
      setDiagnosis(null);
      setPestResult(null);
    } catch (err) {
      console.error("Camera access denied", err);
      alert("Camera access required for live scanning.");
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
        const base64String = dataUrl.split(',')[1];
        setImage(dataUrl);
        stopCamera();
        handleScan(base64String);
      }
    }
  };

  const handleScan = async (base64: string) => {
    setLoading(true);
    setDiagnosis(null);
    setPestResult(null);
    setReferenceImg(null);
    setAddedTasks(new Set());
    try {
      if (scanMode === 'disease') {
        const result = await diagnosePlant(base64, language);
        setDiagnosis(result);
      } else {
        const result = await identifyPest(base64, language);
        setPestResult(result);
        try {
          const refUrl = await generatePestVisual(result.pestName, undefined, result.lifecycleStage);
          setReferenceImg(refUrl);
        } catch (err) {
          console.error("Reference image generation failed", err);
        }
      }
    } catch (error) {
      console.error("Scanning failed", error);
    } finally {
      setLoading(false);
    }
  };

  const addToTasks = (title: string, desc: string, priority: 'High' | 'Medium' | 'Low' = 'High') => {
    const savedTasks = localStorage.getItem('agri_tasks');
    const tasks: Task[] = savedTasks ? JSON.parse(savedTasks) : [];
    
    const newTask: Task = {
      id: Date.now().toString(),
      title,
      description: desc,
      priority,
      status: 'Pending',
      category: scanMode === 'disease' ? 'Pest Control' : 'Repairs',
      createdAt: new Date().toISOString()
    };
    
    localStorage.setItem('agri_tasks', JSON.stringify([newTask, ...tasks]));
    setAddedTasks(prev => new Set(prev).add(title));
  };

  const handleShare = async () => {
    const content = scanMode === 'disease' ? diagnosis : pestResult;
    if (!content) return;

    const shareText = scanMode === 'disease' 
      ? `AgriAssist Diagnosis:\nPlant: ${diagnosis?.plantName}\nCondition: ${diagnosis?.condition}\nStatus: ${diagnosis?.isHealthy ? 'Healthy' : 'Issue Detected'}`
      : `AgriAssist Pest Identification:\nPest: ${pestResult?.pestName} (${pestResult?.scientificName})\nThreat Level: ${pestResult?.threatLevel}\nLifecycle Stage: ${pestResult?.lifecycleStage}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `AgriAssist Scan Report`,
          text: shareText,
        });
      } catch (err) {
        console.error("Error sharing:", err);
      }
    } else {
      try {
        await navigator.clipboard.writeText(shareText);
        alert("Report copied to clipboard!");
      } catch (err) {
        console.error("Clipboard failed:", err);
      }
    }
  };

  const resetScanner = () => {
    setDiagnosis(null);
    setPestResult(null);
    setReferenceImg(null);
    setImage(null);
  };

  return (
    <div className="space-y-8 pb-32 animate-in fade-in slide-in-from-bottom-6 duration-1000 ease-out">
      
      {/* Mode Selector - Premium Pill */}
      {!diagnosis && !pestResult && (
        <div className="flex bg-stone-100 p-2 rounded-[2rem] border border-stone-200 shadow-inner max-w-md mx-auto">
          <button 
            onClick={() => setScanMode('disease')}
            className={`flex-1 flex items-center justify-center gap-3 py-4 rounded-[1.5rem] font-black text-[10px] uppercase tracking-[0.3em] transition-all ${scanMode === 'disease' ? 'bg-white text-stone-950 shadow-xl' : 'text-stone-400'}`}
          >
            <Sprout className="w-4 h-4" /> Disease Scan
          </button>
          <button 
            onClick={() => setScanMode('pest')}
            className={`flex-1 flex items-center justify-center gap-3 py-4 rounded-[1.5rem] font-black text-[10px] uppercase tracking-[0.3em] transition-all ${scanMode === 'pest' ? 'bg-white text-stone-950 shadow-xl' : 'text-stone-400'}`}
          >
            <Bug className="w-4 h-4" /> Pest Identify
          </button>
        </div>
      )}

      {(!diagnosis && !pestResult) ? (
        <div className="flex flex-col gap-8">
          <div 
            onClick={() => !showCamera && startCamera()}
            className="aspect-[4/5] bg-stone-50 rounded-[4rem] border-2 border-dashed border-stone-200 flex flex-col items-center justify-center relative overflow-hidden active:bg-stone-100 transition-all shadow-sm group cursor-pointer"
          >
            {image ? (
              <img src={image} className="w-full h-full object-cover" alt="Preview" />
            ) : (
              <div className="text-stone-300 flex flex-col items-center gap-8 group-hover:text-stone-400 transition-colors">
                <div className="relative">
                  <div className="absolute inset-0 bg-emerald-500/10 blur-3xl rounded-full"></div>
                  <div className="bg-white p-10 rounded-[2.5rem] shadow-2xl relative z-10 border border-stone-100">
                    {scanMode === 'disease' ? <Camera className="w-16 h-16 text-stone-950" /> : <Search className="w-16 h-16 text-stone-950" />}
                  </div>
                </div>
                <div className="text-center px-8">
                  <span className="font-black text-[11px] uppercase tracking-[0.5em] text-stone-950 block mb-3">
                    {scanMode === 'disease' ? 'Neural Leaf Analysis' : 'Specimen Identification'}
                  </span>
                  <p className="text-[10px] text-stone-400 font-bold uppercase tracking-[0.2em] leading-relaxed max-w-[240px]">
                    Position subject within frame for high-fidelity morphology capture
                  </p>
                </div>
              </div>
            )}
            
            {/* Viewfinder Corners */}
            <div className="absolute top-10 left-10 w-12 h-12 border-t-4 border-l-4 border-stone-200 rounded-tl-2xl"></div>
            <div className="absolute top-10 right-10 w-12 h-12 border-t-4 border-r-4 border-stone-200 rounded-tr-2xl"></div>
            <div className="absolute bottom-10 left-10 w-12 h-12 border-b-4 border-l-4 border-stone-200 rounded-bl-2xl"></div>
            <div className="absolute bottom-10 right-10 w-12 h-12 border-b-4 border-r-4 border-stone-200 rounded-br-2xl"></div>
          </div>
          
          <div className="flex flex-col px-4">
            <button 
              onClick={() => startCamera()}
              className="bg-stone-950 text-white font-black py-6 rounded-[2rem] flex items-center justify-center gap-4 shadow-2xl active:scale-[0.98] transition-all uppercase text-[11px] tracking-[0.4em]"
            >
              <Zap className="w-5 h-5 text-emerald-400" />
              {image ? 'RE-INITIALIZE LENS' : 'INITIALIZE BIO-LENS'}
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-10 animate-in slide-in-from-bottom-12 duration-1000 ease-out">
          <div className="flex items-center justify-between px-6">
            <button 
              onClick={resetScanner} 
              className="text-stone-400 flex items-center gap-3 font-black text-[10px] uppercase tracking-[0.4em] hover:text-stone-950 transition-colors"
            >
              <ChevronLeft className="w-5 h-5" /> New Analysis
            </button>
            <button 
              onClick={handleShare} 
              className="bg-stone-100 text-stone-950 p-3 px-6 rounded-full flex items-center gap-3 font-black text-[10px] uppercase tracking-[0.3em] active:scale-95 transition-all border border-stone-200"
            >
              <Share2 className="w-4 h-4" /> Export Report
            </button>
          </div>

          {scanMode === 'disease' && diagnosis && (
            <div className="space-y-10">
              {/* Result Hero - Editorial Style */}
              <div className={`rounded-[4rem] p-12 shadow-2xl relative overflow-hidden transition-all duration-1000 ${
                diagnosis.isHealthy 
                  ? 'bg-stone-950 text-white' 
                  : 'bg-stone-950 text-white'
              }`}>
                <div className="absolute top-0 right-0 p-12 opacity-[0.03] rotate-12 scale-150 pointer-events-none">
                   {diagnosis.isHealthy ? <ShieldCheck className="w-96 h-96" /> : <AlertTriangle className="w-96 h-96" />}
                </div>

                <div className="relative z-10">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-10 mb-16">
                    <div className="flex items-center gap-8">
                      <div className="p-6 rounded-[2.5rem] bg-white/10 backdrop-blur-2xl shadow-2xl border border-white/10">
                        <Sprout className="w-12 h-12 text-emerald-400" />
                      </div>
                      <div>
                        <h3 className="text-5xl font-black tracking-tighter uppercase leading-none">{diagnosis.plantName}</h3>
                        <div className="flex items-center gap-3 mt-4">
                          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-stone-400">Biological Identification Confirmed</p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-white/5 backdrop-blur-md p-6 rounded-[2rem] border border-white/10">
                      <ConfidenceGauge confidence={diagnosis.confidence} healthy={diagnosis.isHealthy} />
                    </div>
                  </div>

                  <div className="flex items-center gap-4 py-4 px-8 bg-white/5 backdrop-blur-md rounded-full border border-white/10 w-fit mb-12">
                    {diagnosis.isHealthy 
                      ? <BadgeCheck className="w-6 h-6 text-emerald-400" /> 
                      : <ShieldAlert className="w-6 h-6 text-amber-400" />
                    }
                    <span className="font-black text-[10px] uppercase tracking-[0.4em]">
                      {diagnosis.isHealthy ? 'Condition: Optimal Vitality' : 'Alert: Pathogenic Stress Detected'}
                    </span>
                  </div>

                  <div className="text-3xl md:text-4xl font-black tracking-tight leading-tight text-stone-100 italic">
                    "{diagnosis.condition}"
                  </div>
                </div>
              </div>

              {/* Symptoms - Technical Grid */}
              <div className="bg-white rounded-[4rem] p-12 shadow-sm border border-stone-100">
                <div className="flex items-center justify-between mb-12">
                  <div>
                    <h4 className="font-black text-stone-950 text-xs uppercase tracking-[0.5em] flex items-center gap-4">
                        <Stethoscope className="w-6 h-6 text-emerald-600" /> Morphology Markers
                    </h4>
                    <p className="text-[10px] text-stone-400 font-bold uppercase tracking-[0.3em] mt-3 ml-10">Visual Evidence Grounding</p>
                  </div>
                  <Activity className="w-6 h-6 text-stone-200" />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {diagnosis.symptoms.map((s, i) => (
                    <div key={i} className="bg-stone-50 border border-stone-100 p-8 rounded-[2.5rem] text-base font-bold text-stone-700 flex items-center gap-8 transition-all hover:bg-white hover:shadow-xl hover:border-stone-200 group">
                        <div className={`w-1.5 h-16 rounded-full transition-all group-hover:scale-y-110 ${diagnosis.isHealthy ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                        <span className="leading-relaxed tracking-tight">{s}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Protocol - Actionable Terminal */}
              <div className="bg-stone-950 p-12 md:p-16 rounded-[5rem] shadow-2xl relative overflow-hidden border border-white/5">
                <div className="absolute -bottom-24 -right-24 opacity-[0.03] pointer-events-none">
                   <FlaskConical className="w-[600px] h-[600px] text-emerald-400" />
                </div>
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-16">
                    <div>
                      <h4 className="font-black text-emerald-400 text-xs uppercase tracking-[0.5em] flex items-center gap-4">
                          <ClipboardList className="w-6 h-6" /> Remediation Protocol
                      </h4>
                      <p className="text-[10px] text-stone-500 font-bold uppercase tracking-[0.3em] mt-3 ml-10">Targeted Biological Intervention</p>
                    </div>
                    <Zap className="w-6 h-6 text-amber-400 animate-pulse" />
                  </div>

                  <div className="space-y-6">
                      {diagnosis.recommendations.map((r, i) => (
                          <div key={i} className="flex gap-8 items-center bg-white/5 p-8 rounded-[3rem] backdrop-blur-md border border-white/5 transition-all hover:bg-white/10 group">
                              <div className="w-16 h-16 rounded-[1.5rem] bg-emerald-500 text-stone-950 flex items-center justify-center shrink-0 text-xl font-black shadow-2xl group-hover:rotate-6 transition-transform">
                                  {i + 1}
                              </div>
                              <p className="flex-1 text-lg text-emerald-50 font-medium leading-snug tracking-tight">{r}</p>
                              <button 
                                onClick={() => addToTasks(`${diagnosis.plantName} Treatment`, r)}
                                disabled={addedTasks.has(r)}
                                className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center transition-all shadow-xl ${addedTasks.has(r) ? 'bg-emerald-400 text-stone-950' : 'bg-white/10 text-emerald-100 hover:bg-emerald-500 hover:text-stone-950 active:scale-90'}`}
                              >
                                 {addedTasks.has(r) ? <CheckCircle2 className="w-8 h-8" /> : <Plus className="w-8 h-8" />}
                              </button>
                          </div>
                      ))}
                  </div>

                  {!diagnosis.isHealthy && (
                    <div className="mt-16 p-8 bg-emerald-500/10 rounded-[3rem] border border-emerald-500/20 flex gap-6 items-center">
                       <div className="p-4 bg-emerald-500 text-stone-950 rounded-[1.25rem] shadow-2xl">
                          <Heart className="w-6 h-6" />
                       </div>
                       <p className="text-sm text-emerald-100 font-medium leading-relaxed italic opacity-80">
                         System Note: Prioritize soil hydration and morning monitoring during active treatment cycles.
                       </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {scanMode === 'pest' && pestResult && (
            <div className="space-y-10">
              {/* Pest Result Hero */}
              <div className="bg-white rounded-[4rem] p-12 shadow-sm border border-stone-100">
                <div className="flex flex-col md:flex-row md:items-center gap-10 mb-16">
                    <div className="p-8 rounded-[3rem] shadow-inner bg-stone-50 text-stone-950 border border-stone-100">
                        <Bug className="w-16 h-16" />
                    </div>
                    <div className="flex-1">
                        <div className="flex items-center gap-4 mb-4">
                          <div className="w-2 h-2 bg-rose-500 rounded-full"></div>
                          <span className="text-[10px] font-black text-stone-400 uppercase tracking-[0.4em]">Specimen Catalogued</span>
                        </div>
                        <h3 className="text-5xl font-black text-stone-950 tracking-tighter uppercase leading-none">{pestResult.pestName}</h3>
                        <p className="text-lg text-stone-400 font-black italic mt-4 uppercase tracking-[0.2em] opacity-80">
                          {pestResult.scientificName}
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
                   <div className="bg-stone-50 border border-stone-100 p-8 rounded-[3rem] shadow-inner">
                      <ThreatRadar level={pestResult.threatLevel} />
                   </div>
                   <div className="bg-stone-950 border border-stone-900 p-8 rounded-[3rem] flex items-center justify-between text-white">
                      <div>
                        <p className="text-[10px] font-black text-stone-500 uppercase tracking-[0.3em] mb-2">Biological State</p>
                        <p className="text-2xl font-black text-white uppercase tracking-tight">{pestResult.lifecycleStage}</p>
                      </div>
                      <div className="bg-white/10 p-5 rounded-[1.5rem] text-white shadow-2xl border border-white/10">
                        <Clock className="w-8 h-8" />
                      </div>
                   </div>
                </div>

                <div className="bg-stone-50 p-10 rounded-[3rem] border border-stone-100 text-stone-600 leading-relaxed text-lg shadow-inner mb-12 font-medium italic">
                    "{pestResult.description}"
                </div>

                <div className="space-y-6">
                   <p className="text-[10px] font-black text-stone-400 uppercase tracking-[0.5em] ml-2 flex items-center gap-4">
                    <div className="w-1.5 h-1.5 bg-stone-950 rounded-full"></div>
                    Target Host Matrix
                   </p>
                   <div className="flex flex-wrap gap-4">
                     {pestResult.hostCrops.map((crop, idx) => (
                       <span key={idx} className="bg-stone-950 text-white px-8 py-3 rounded-full text-[10px] font-black uppercase tracking-[0.3em] shadow-xl">
                         {crop}
                       </span>
                     ))}
                   </div>
                </div>
              </div>

              {/* Damage Signature Section */}
              <div className="bg-white rounded-[4rem] p-12 shadow-sm border border-stone-100">
                <div className="flex items-center justify-between mb-12">
                  <div>
                    <h4 className="font-black text-rose-600 text-xs uppercase tracking-[0.5em] flex items-center gap-4">
                        <AlertCircle className="w-6 h-6" /> Damage Signature
                    </h4>
                    <p className="text-[10px] text-stone-400 font-bold uppercase tracking-[0.3em] mt-3 ml-10">Neural Pattern Recognition</p>
                  </div>
                  <Eye className="w-6 h-6 text-stone-200" />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {pestResult.damageSymptoms.map((s, i) => (
                    <div key={i} className="bg-rose-50/30 border border-rose-100 p-8 rounded-[2.5rem] text-base font-bold text-stone-900 flex items-center gap-8 transition-all hover:bg-white hover:shadow-2xl hover:border-rose-200 group">
                        <div className="w-16 h-16 rounded-[1.5rem] bg-white flex items-center justify-center shadow-xl text-rose-500 group-hover:scale-110 group-hover:rotate-6 transition-transform border border-rose-100/50">
                          <Scan className="w-8 h-8" />
                        </div>
                        <span className="leading-snug flex-1 font-black tracking-tight">{s}</span>
                    </div>
                  ))}
                </div>
              </div>

              {referenceImg && (
                <div className="bg-white rounded-[4rem] p-10 shadow-sm border border-stone-100 group">
                  <div className="flex items-center justify-between mb-8 px-4">
                     <h4 className="font-black text-stone-400 text-[10px] uppercase tracking-[0.4em] flex items-center gap-3">
                        <Database className="w-5 h-5 text-stone-950" /> AI Biometric Reference
                     </h4>
                     <span className="text-[10px] font-black text-stone-300 uppercase tracking-widest">Stage: {pestResult.lifecycleStage}</span>
                  </div>
                  <div className="aspect-square w-full rounded-[3.5rem] overflow-hidden border-8 border-stone-50 shadow-2xl relative group">
                    <img src={referenceImg} alt="Reference" className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" />
                    <div className="absolute inset-x-0 bottom-0 bg-stone-950/80 backdrop-blur-xl p-8 text-[10px] font-black uppercase tracking-[0.4em] text-white text-center border-t border-white/10">
                      High-Fidelity Neural Reconstruction Plate
                    </div>
                  </div>
                </div>
              )}

              {/* Control Measures - Dark Terminal */}
              <div className="bg-stone-950 p-12 md:p-16 rounded-[5rem] shadow-2xl border border-white/5 relative overflow-hidden">
                <div className="absolute top-0 left-0 p-12 opacity-[0.03] pointer-events-none">
                   <ShieldAlert className="w-[500px] h-[500px] text-rose-500" />
                </div>
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-16">
                     <h4 className="font-black text-rose-500 text-xs uppercase tracking-[0.5em] flex items-center gap-4">
                        <ShieldAlert className="w-6 h-6" /> Strategic Interventions
                     </h4>
                     <Zap className="w-6 h-6 text-amber-400 animate-pulse" />
                  </div>
                  <div className="space-y-6">
                      {pestResult.controlMeasures.map((r, i) => (
                          <div key={i} className="flex gap-8 items-center bg-white/5 p-8 rounded-[3rem] border border-white/5 transition-all hover:bg-white/10 group">
                              <div className="w-16 h-16 rounded-[1.5rem] bg-rose-600 text-white flex items-center justify-center shrink-0 text-xl font-black shadow-2xl group-hover:rotate-6 transition-transform">
                                  {i + 1}
                              </div>
                              <p className="flex-1 text-lg text-stone-200 font-medium leading-snug tracking-tight">{r}</p>
                              <button 
                                onClick={() => addToTasks(`Pest Control: ${pestResult.pestName}`, r, pestResult.threatLevel === 'Critical' ? 'High' : 'Medium')}
                                disabled={addedTasks.has(r)}
                                className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center transition-all shadow-2xl ${addedTasks.has(r) ? 'bg-emerald-500 text-stone-950' : 'bg-white/10 text-stone-400 hover:bg-rose-600 hover:text-white active:scale-90'}`}
                              >
                                 {addedTasks.has(r) ? <CheckCircle2 className="w-8 h-8" /> : <Plus className="w-8 h-8" />}
                              </button>
                          </div>
                      ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Camera Overlay - Full Immersive */}
      {showCamera && (
        <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center animate-in fade-in duration-500">
          <div className="absolute top-12 left-0 right-0 px-10 flex items-center justify-between z-10">
            <button 
              onClick={stopCamera}
              className="bg-white/10 backdrop-blur-2xl p-5 rounded-full text-white hover:bg-white/20 transition-all border border-white/10 shadow-2xl"
            >
              <X className="w-8 h-8" />
            </button>
            <div className="bg-white/10 backdrop-blur-2xl px-8 py-4 rounded-full border border-white/20 shadow-2xl">
               <span className="text-white text-[11px] font-black uppercase tracking-[0.4em] flex items-center gap-4">
                 <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_15px_#10b981]"></div>
                 Neural Lens Active
               </span>
            </div>
            <button 
              onClick={switchCamera}
              className="bg-white/10 backdrop-blur-2xl p-5 rounded-full text-white hover:bg-white/20 transition-all border border-white/10 shadow-2xl"
            >
              <RotateCcw className="w-8 h-8" />
            </button>
          </div>

          <video 
            ref={videoRef} 
            autoPlay 
            playsInline 
            muted
            className="w-full h-full object-cover opacity-80"
          />
          <canvas ref={canvasRef} className="hidden" />

          {/* Viewfinder Overlay */}
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
             <div className="w-[300px] h-[400px] border-2 border-white/20 rounded-[3rem] relative">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white/10 backdrop-blur-md px-4 py-1 rounded-full border border-white/20">
                   <span className="text-white text-[8px] font-black uppercase tracking-widest">Alignment Matrix</span>
                </div>
                <div className="absolute top-1/2 left-0 w-full h-px bg-white/10"></div>
                <div className="absolute top-0 left-1/2 w-px h-full bg-white/10"></div>
             </div>
          </div>

          <div className="absolute bottom-16 flex flex-col items-center gap-12 w-full px-10">
            <p className="text-white/40 text-[10px] font-black uppercase tracking-[0.4em] text-center max-w-[320px] leading-relaxed">
              Center the affected specimen within the alignment matrix for morphology capture
            </p>
            <button 
              onClick={capturePhoto}
              className="w-28 h-28 rounded-full bg-white border-[12px] border-white/10 p-1 active:scale-90 transition-all shadow-[0_0_80px_rgba(255,255,255,0.2)]"
            >
              <div className="w-full h-full rounded-full border-4 border-stone-950 bg-white shadow-inner flex items-center justify-center">
                 <div className="w-6 h-6 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_20px_#10b981]"></div>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* Loading State - Immersive */}
      {loading && (
        <div className="fixed inset-0 bg-[#fcfcf9]/98 backdrop-blur-3xl z-50 flex flex-col items-center justify-center gap-16 p-12 animate-in fade-in duration-700">
          <div className="relative">
            <div className="w-48 h-48 border-[12px] border-stone-100 rounded-full shadow-inner opacity-50"></div>
            <div className="absolute inset-0 w-48 h-48 border-[12px] border-stone-950 border-t-transparent rounded-full animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              {scanMode === 'disease' ? (
                <Sprout className="w-16 h-16 text-stone-950 animate-bounce" />
              ) : (
                <Bug className="w-16 h-16 text-stone-950 animate-bounce" />
              )}
            </div>
          </div>
          <div className="text-center space-y-6">
            <div className="flex items-center justify-center gap-4">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
              <p className="font-black text-stone-950 text-base uppercase tracking-[0.5em] animate-pulse">
                {scanMode === 'disease' ? 'Neural Diagnosis...' : 'Specimen Mapping...'}
              </p>
            </div>
            <p className="text-[11px] text-stone-400 font-bold uppercase tracking-[0.3em] max-w-[280px] leading-relaxed mx-auto">
              Synthesizing biometric markers with global agricultural intelligence database
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default DiseaseScanner;