
import React from 'react';
import { diagnoseLivestock } from '../services/geminiService';
import { db } from '../src/firebase';
import { collection, addDoc, deleteDoc, doc, onSnapshot, query, orderBy, serverTimestamp } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../src/utils/firestoreErrorHandler';
import { useFirebase } from '../src/components/FirebaseProvider';
import { 
  Beef, 
  Camera, 
  Loader2, 
  AlertTriangle, 
  ShieldCheck, 
  Heart, 
  Info, 
  PlusCircle, 
  History,
  X,
  RotateCcw,
  Zap,
  RefreshCw,
  Search,
  Trash2,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const ANIMAL_TYPES = ['Cattle', 'Poultry', 'Swine', 'Sheep', 'Goats', 'Other'];

interface LivestockAssistantProps {
  language: string;
}

interface DiagnosisRecord {
  id: string;
  animalType: string;
  conditionName: string;
  isHealthy: boolean;
  urgency: string;
  symptomsSeen: string[];
  careSteps: string[];
  nutritionalAdvice: string;
  image?: string;
  timestamp: any;
}

const LivestockAssistant = ({ language }: LivestockAssistantProps) => {
  const { activeFarmId } = useFirebase();
  const [image, setImage] = React.useState<string | null>(null);
  const [animalType, setAnimalType] = React.useState('Cattle');
  const [loading, setLoading] = React.useState(false);
  const [result, setResult] = React.useState<any>(null);
  const [history, setHistory] = React.useState<DiagnosisRecord[]>([]);
  const [showCamera, setShowCamera] = React.useState(false);
  const [facingMode, setFacingMode] = React.useState<'user' | 'environment'>('environment');
  const [confirmDialog, setConfirmDialog] = React.useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    type: 'danger' | 'info';
  }>({ isOpen: false, title: '', message: '', onConfirm: () => {}, type: 'info' });

  const [alertDialog, setAlertDialog] = React.useState<{
    isOpen: boolean;
    title: string;
    message: string;
  }>({ isOpen: false, title: '', message: '' });

  React.useEffect(() => {
    if (!activeFarmId) return;

    const path = `users/${activeFarmId}/livestockHistory`;
    const q = query(collection(db, path), orderBy('timestamp', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const records: DiagnosisRecord[] = [];
      snapshot.forEach((doc) => {
        records.push({ id: doc.id, ...doc.data() } as DiagnosisRecord);
      });
      setHistory(records);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    });

    return () => unsubscribe();
  }, [activeFarmId]);
  
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

  const startCamera = async () => {
    try {
      if (streamRef.current) stopCamera();
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facingMode },
        audio: false
      });
      streamRef.current = stream;
      setShowCamera(true);
      setResult(null);
    } catch (err) {
      console.error("Camera access denied", err);
      setAlertDialog({
        isOpen: true,
        title: 'Sensor Access',
        message: 'Microphone/Camera access is required for livestock health scanning. Please enable these permissions in your system settings.'
      });
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
      
      // Ensure video is ready
      if (video.videoWidth === 0 || video.videoHeight === 0) {
        console.warn("Video not ready for capture");
        // Try again in 100ms
        setTimeout(capturePhoto, 100);
        return;
      }

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg');
        const base64String = dataUrl.split(',')[1];
        setImage(dataUrl);
        stopCamera();
        handleAnalyze(base64String);
      }
    }
  };

  const handleAnalyze = async (base64: string) => {
    if (!activeFarmId) return;
    setLoading(true);
    setResult(null);
    try {
      const data = await diagnoseLivestock(base64, animalType, language);
      setResult(data);
      
      const path = `users/${activeFarmId}/livestockHistory`;
      await addDoc(collection(db, path), {
        ...data,
        animalType,
        image: `data:image/jpeg;base64,${base64}`,
        timestamp: serverTimestamp()
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const deleteRecord = async (id: string) => {
    if (!activeFarmId) return;
    
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Record',
      message: 'Are you sure you want to remove this health diagnosis from history?',
      type: 'danger',
      onConfirm: async () => {
        const path = `users/${activeFarmId}/livestockHistory/${id}`;
        try {
          await deleteDoc(doc(db, path));
        } catch (error) {
          handleFirestoreError(error, OperationType.DELETE, path);
        }
      }
    });
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in slide-in-from-bottom-6 duration-700">
      <div className="bg-white rounded-[2.5rem] p-6 md:p-8 shadow-sm border border-stone-200">
        <h2 className="text-2xl font-black mb-2 flex items-center gap-3 text-stone-900">
          <div className="bg-orange-100 p-2.5 rounded-2xl">
            <Beef className="text-orange-700 w-6 h-6" />
          </div>
          Livestock Intelligence ({language})
        </h2>
        <p className="text-stone-500 text-sm font-medium mb-8">
          Identify symptoms in your herd or flock and get nutritionist-grade feed advice.
        </p>

        <div className="space-y-6">
          <div className="grid grid-cols-3 gap-2">
            {ANIMAL_TYPES.map(type => (
              <button 
                key={type}
                onClick={() => setAnimalType(type)}
                className={`px-4 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border ${animalType === type ? 'bg-[#825500] text-white border-[#825500] shadow-md' : 'bg-stone-50 text-stone-400 border-stone-100'}`}
              >
                {type}
              </button>
            ))}
          </div>

          <div 
            onClick={() => !showCamera && startCamera()}
            className="aspect-video bg-stone-50 rounded-[2.5rem] border-4 border-dashed border-stone-100 flex flex-col items-center justify-center cursor-pointer relative overflow-hidden active:scale-[0.98] transition-all shadow-inner group"
          >
            {image ? (
              <img src={image} className="w-full h-full object-cover" alt="Livestock" />
            ) : (
              <div className="text-stone-300 flex flex-col items-center gap-3 group-hover:text-stone-400 transition-colors">
                <div className="bg-white p-5 rounded-full shadow-lg">
                  <Camera className="w-8 h-8 text-orange-600" />
                </div>
                <span className="font-black text-[10px] uppercase tracking-widest">Scan Animal or Symptom</span>
              </div>
            )}
          </div>
          
          <div className="flex flex-col">
            <button 
              onClick={() => startCamera()}
              className="bg-orange-600 text-white font-black py-4.5 rounded-[1.5rem] flex items-center justify-center gap-3 shadow-xl active:scale-[0.98] transition-all"
            >
              <Camera className="w-5 h-5" />
              {image ? 'Rescan Sample' : 'Start Health Scan'}
            </button>
          </div>
        </div>

        {loading && (
          <div className="py-20 flex flex-col items-center justify-center text-orange-600 space-y-4">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-orange-50 rounded-full"></div>
              <div className="absolute inset-0 w-16 h-16 border-4 border-orange-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
            <p className="font-black text-[10px] uppercase tracking-widest animate-pulse">Running Veterinary Analysis...</p>
          </div>
        )}

        {result && !loading && (
          <div className="mt-12 space-y-8 animate-in zoom-in-95 duration-500">
            <div className="bg-stone-50 border border-stone-100 p-6 rounded-[2.5rem] shadow-inner">
               <div className="flex items-center justify-between mb-6">
                 <div>
                    <h3 className="text-2xl font-black text-stone-900 tracking-tight">{result.conditionName}</h3>
                    <p className="text-[10px] text-orange-600 font-black uppercase tracking-widest mt-1">Status: {result.isHealthy ? 'Healthy' : 'Medical Attention Required'}</p>
                 </div>
                 <div className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest ${
                   result.urgency === 'High' || result.urgency === 'Emergency' ? 'bg-rose-500 text-white' : 'bg-orange-100 text-orange-700'
                 }`}>
                   {result.urgency} Urgency
                 </div>
               </div>

               <div className="space-y-4">
                 <h4 className="text-[10px] font-black text-stone-400 uppercase tracking-widest flex items-center gap-2">
                   <AlertTriangle className="w-4 h-4 text-orange-500" /> Observed Symptoms
                 </h4>
                 <div className="flex flex-wrap gap-2">
                    {result.symptomsSeen.map((s: string, i: number) => (
                      <span key={i} className="bg-white border border-stone-100 px-3 py-1.5 rounded-xl text-xs font-bold text-stone-700">
                        {s}
                      </span>
                    ))}
                 </div>
               </div>

               <div className="mt-8 space-y-4">
                 <h4 className="text-[10px] font-black text-stone-400 uppercase tracking-widest flex items-center gap-2">
                   <ShieldCheck className="w-4 h-4 text-emerald-500" /> Care Protocol
                 </h4>
                 <div className="space-y-3">
                    {result.careSteps.map((step: string, i: number) => (
                      <div key={i} className="flex gap-4 items-start bg-white p-4 rounded-2xl border border-stone-50 shadow-sm">
                        <div className="w-6 h-6 rounded-lg bg-orange-100 text-orange-700 flex items-center justify-center shrink-0 text-[10px] font-black">
                          {i + 1}
                        </div>
                        <p className="text-sm font-medium text-stone-700 leading-snug">{step}</p>
                      </div>
                    ))}
                 </div>
               </div>

               <div className="mt-8 p-6 bg-white rounded-[2rem] border-2 border-orange-100 shadow-sm">
                  <div className="flex items-center gap-2 text-orange-600 font-black text-[10px] uppercase tracking-[0.2em] mb-3">
                    <Heart className="w-4 h-4" /> Nutritional Insight
                  </div>
                  <p className="text-sm font-medium text-stone-600 leading-relaxed italic">
                    "{result.nutritionalAdvice}"
                  </p>
               </div>
            </div>
          </div>
        )}
      </div>

      {showCamera && (
        <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center animate-in fade-in duration-300">
          <div className="absolute top-8 left-0 right-0 px-6 flex items-center justify-between z-10">
            <button 
              onClick={stopCamera}
              className="bg-white/10 backdrop-blur-md p-3 rounded-full text-white hover:bg-white/20 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
            <div className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-full border border-white/20">
               <span className="text-white text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                 <Zap className="w-3 h-3 text-amber-400" /> Live Bio-Scanning
               </span>
            </div>
            <button 
              onClick={switchCamera}
              className="bg-white/10 backdrop-blur-md p-3 rounded-full text-white hover:bg-white/20 transition-colors"
            >
              <RotateCcw className="w-6 h-6" />
            </button>
          </div>

          <video 
            ref={setVideoRef} 
            autoPlay 
            playsInline 
            muted
            className="w-full h-full object-cover"
          />
          <canvas ref={canvasRef} className="hidden" />

          <div className="absolute bottom-12 flex flex-col items-center gap-8 w-full px-8">
            <p className="text-white/60 text-[10px] font-bold uppercase tracking-[0.2em] text-center max-w-[240px]">
              Center the animal or symptomatic area for precision diagnosis
            </p>
            <button 
              onClick={capturePhoto}
              className="w-20 h-20 rounded-full bg-white border-4 border-stone-200 p-1 active:scale-90 transition-transform shadow-2xl"
            >
              <div className="w-full h-full rounded-full border-2 border-stone-900 bg-white"></div>
            </button>
          </div>
        </div>
      )}

      {history.length > 0 && (
        <div className="bg-white rounded-[2.5rem] p-6 md:p-8 shadow-sm border border-stone-200">
          <h3 className="text-xl font-black mb-6 flex items-center gap-3 text-stone-900">
            <History className="text-stone-400 w-5 h-5" />
            Diagnosis History
          </h3>
          <div className="space-y-4">
            {history.map((record) => (
              <div key={record.id} className="bg-stone-50 rounded-3xl p-4 border border-stone-100 flex gap-4 items-center group">
                {record.image && (
                  <img 
                    src={record.image} 
                    alt="Scan" 
                    className="w-16 h-16 rounded-2xl object-cover border border-stone-200"
                    referrerPolicy="no-referrer"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${record.isHealthy ? 'bg-emerald-100 text-emerald-700' : 'bg-orange-100 text-orange-700'}`}>
                      {record.isHealthy ? 'Healthy' : 'Issue Detected'}
                    </span>
                    <span className="text-[10px] font-bold text-stone-400">
                      {record.timestamp?.toDate ? record.timestamp.toDate().toLocaleDateString() : 'Recent'}
                    </span>
                  </div>
                  <h4 className="font-bold text-stone-800 truncate">{record.conditionName}</h4>
                  <p className="text-xs text-stone-500">{record.animalType}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => setResult(record)}
                    className="p-2 bg-white rounded-xl border border-stone-200 text-stone-400 hover:text-orange-600 transition-all"
                  >
                    <Search className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => deleteRecord(record.id)}
                    className="p-2 bg-white rounded-xl border border-stone-200 text-stone-400 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Custom Confirmation Dialog */}
      <AnimatePresence>
        {confirmDialog.isOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white rounded-[2.5rem] p-8 max-w-sm w-full shadow-2xl border border-stone-200"
            >
              <div className="text-center">
                <div className={`w-16 h-16 ${confirmDialog.type === 'danger' ? 'bg-rose-500/10 text-rose-500' : 'bg-amber-500/10 text-amber-500'} rounded-2xl flex items-center justify-center mb-6 mx-auto`}>
                  {confirmDialog.type === 'danger' ? <Trash2 className="w-8 h-8" /> : <Info className="w-8 h-8" />}
                </div>
                <h3 className="text-xl font-black text-stone-900 uppercase tracking-tighter mb-2">{confirmDialog.title}</h3>
                <p className="text-sm font-medium text-stone-500 leading-relaxed mb-8">{confirmDialog.message}</p>
                <div className="flex gap-3">
                  <button 
                    onClick={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
                    className="flex-1 py-4 bg-stone-100 text-stone-500 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-stone-200 transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={() => {
                      confirmDialog.onConfirm();
                      setConfirmDialog({ ...confirmDialog, isOpen: false });
                    }}
                    className={`flex-1 py-4 ${confirmDialog.type === 'danger' ? 'bg-rose-500' : 'bg-stone-900'} text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg hover:opacity-90 transition-all`}
                  >
                    Confirm
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Custom Alert Dialog */}
      <AnimatePresence>
        {alertDialog.isOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white rounded-[2.5rem] p-8 max-w-sm w-full shadow-2xl border border-stone-200"
            >
              <div className="text-center">
                <div className="w-16 h-16 bg-amber-500/10 text-amber-500 rounded-2xl flex items-center justify-center mb-6 mx-auto">
                  <AlertCircle className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-black text-stone-900 uppercase tracking-tighter mb-2">{alertDialog.title}</h3>
                <p className="text-sm font-medium text-stone-500 leading-relaxed mb-8">{alertDialog.message}</p>
                <button 
                  onClick={() => setAlertDialog({ ...alertDialog, isOpen: false })}
                  className="w-full py-4 bg-stone-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg hover:opacity-90 transition-all"
                >
                  Understood
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LivestockAssistant;
