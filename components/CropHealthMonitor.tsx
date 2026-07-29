
import React from 'react';
import { motion } from 'motion/react';
import { db } from '../src/firebase';
import { collection, addDoc, deleteDoc, doc, onSnapshot, query, orderBy, serverTimestamp } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../src/utils/firestoreErrorHandler';
import { useFirebase } from '../src/components/FirebaseProvider';
import { useDialogs } from '../src/components/DialogProvider';
import { fetchSatelliteReport } from '../services/geminiService';
import { 
  Activity, 
  Layers, 
  Eye, 
  AlertTriangle, 
  CheckCircle2, 
  Info,
  ArrowRight,
  Droplets,
  Sun,
  Thermometer,
  History,
  Trash2,
  Search,
  Satellite
} from 'lucide-react';

interface HealthReport {
  id: string;
  fieldName: string;
  ndvi: number;
  moisture: string;
  chlorophyll: string;
  temp: string;
  biomass: string;
  recommendation: string;
  timestamp: any;
}

const CropHealthMonitor: React.FC = () => {
  const { activeFarmId, profile } = useFirebase();
  const { confirm } = useDialogs();
  const [selectedField, setSelectedField] = React.useState('North Parcel');
  const [isScanning, setIsScanning] = React.useState(false);
  const [history, setHistory] = React.useState<HealthReport[]>([]);
  const [activeReport, setActiveReport] = React.useState<HealthReport | null>(null);

  const [fields, setFields] = React.useState<{ name: string; cropType?: string }[]>([
    { name: 'North Parcel', cropType: 'Wheat' },
    { name: 'South Ridge', cropType: 'Rice' },
    { name: 'East Meadow', cropType: 'Cotton' },
    { name: 'West Orchard', cropType: 'Sugarcane' }
  ]);

  React.useEffect(() => {
    if (!activeFarmId) return;
    const path = `users/${activeFarmId}/fields`;
    const q = query(collection(db, path), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const list: { name: string; cropType?: string }[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          if (data.name) {
            list.push({ name: data.name, cropType: data.cropType || 'Wheat' });
          }
        });
        setFields(list);
        setSelectedField(list[0].name);
      }
    }, (error) => {
      console.warn("Could not load dynamic fields list:", error);
    });
    return () => unsubscribe();
  }, [activeFarmId]);

  const currentFieldObj = fields.find(f => f.name === selectedField);
  const currentCrop = currentFieldObj?.cropType || profile?.mainCrops?.[0] || 'Wheat';

  React.useEffect(() => {
    if (!activeFarmId) return;

    const path = `users/${activeFarmId}/cropHealthReports`;
    const q = query(collection(db, path), orderBy('timestamp', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const records: HealthReport[] = [];
      snapshot.forEach((doc) => {
        records.push({ id: doc.id, ...doc.data() } as HealthReport);
      });
      setHistory(records);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    });

    return () => unsubscribe();
  }, [activeFarmId]);

  const handleScan = async () => {
    if (!activeFarmId) return;
    setIsScanning(true);
    
    try {
      const data = await fetchSatelliteReport(selectedField, currentCrop, profile?.language || 'English');
      const newReport = {
        fieldName: selectedField,
        ndvi: Number(data.ndvi) || 0.72,
        moisture: data.moisture || 'Optimal (68%)',
        chlorophyll: data.chlorophyll || 'High',
        temp: data.temp || '24.5°C',
        biomass: data.biomass || '12.4 t/ha',
        recommendation: data.recommendation || 'Vegetative growth is strong.',
        timestamp: serverTimestamp()
      };
      
      const path = `users/${activeFarmId}/cropHealthReports`;
      const docRef = await addDoc(collection(db, path), newReport);
      setActiveReport({ id: docRef.id, ...newReport } as HealthReport);
    } catch (error) {
      console.error(error);
      handleFirestoreError(error, OperationType.CREATE, `users/${activeFarmId}/cropHealthReports`);
    } finally {
      setIsScanning(false);
    }
  };

  const deleteReport = async (id: string) => {
    if (!activeFarmId) return;

    confirm({
      title: 'Delete Health Report',
      message: 'Are you sure you want to remove this satellite health report?',
      type: 'danger',
      onConfirm: async () => {
        const path = `users/${activeFarmId}/cropHealthReports/${id}`;
        try {
          await deleteDoc(doc(db, path));
          if (activeReport?.id === id) setActiveReport(null);
        } catch (error) {
          handleFirestoreError(error, OperationType.DELETE, path);
        }
      }
    });
  };

  const selectedReportOrLatest = activeReport || history.find(h => h.fieldName === selectedField) || history[0];

  const displayNdvi = selectedReportOrLatest ? selectedReportOrLatest.ndvi : 0.72;
  const displayMoisture = selectedReportOrLatest ? selectedReportOrLatest.moisture : 'Optimal (68%)';
  const displayChlorophyll = selectedReportOrLatest ? selectedReportOrLatest.chlorophyll : 'High';
  const displayTemp = selectedReportOrLatest ? selectedReportOrLatest.temp : '24.5°C';
  const displayBiomass = selectedReportOrLatest ? selectedReportOrLatest.biomass : '12.4 t/ha';
  const displayRecommendation = selectedReportOrLatest ? selectedReportOrLatest.recommendation : 'Apply targeted nitrogen enrichment to boost vegetative cellular structure during current humidity indexes.';

  return (
    <div className="w-full flex flex-col pb-40 bg-black min-h-screen text-white">
      {/* Header */}
      <section className="px-6 pt-12 pb-8 bg-stone-950 border-b border-amber-500/5">
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-amber-500/60">Satellite Telemetry</span>
          </div>
          <h1 className="text-5xl font-black tracking-tighter uppercase leading-none">
            Crop<br />
            <span className="text-amber-500 italic">Health.</span>
          </h1>
          
          <div className="flex gap-2 overflow-x-auto no-scrollbar py-2">
            {fields.map(field => (
              <button 
                key={field.name}
                onClick={() => setSelectedField(field.name)}
                className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${selectedField === field.name ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20' : 'bg-stone-900 text-stone-500 border border-white/5'}`}
              >
                {field.name}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="px-6 py-8 space-y-8">
        
        {/* NDVI Visualization (Simulated) */}
        <div className="relative aspect-square bg-stone-950 rounded-[2.5rem] overflow-hidden border border-amber-500/10 shadow-2xl">
          <div className="absolute inset-0 opacity-40">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-900/30 via-black to-amber-900/30" />
            <div className="absolute inset-0 organic-grid opacity-20" />
          </div>
          
          {/* Simulated Heatmap Layers */}
          <div className="absolute inset-12 rounded-[2rem] border-2 border-amber-500/20 flex items-center justify-center">
             <motion.div 
               animate={{ 
                 scale: [1, 1.05, 1],
                 opacity: [0.3, 0.6, 0.3]
               }}
               transition={{ duration: 4, repeat: Infinity }}
               className="w-full h-full bg-amber-500/10 blur-3xl rounded-full"
             />
             <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-3/4 h-3/4 border border-amber-500/30 rounded-full border-dashed animate-spin-slow" />
             </div>
          </div>

          {/* Scanning Line */}
          {isScanning && (
            <motion.div 
              initial={{ top: '0%' }}
              animate={{ top: '100%' }}
              transition={{ duration: 2.5, ease: "linear" }}
              className="absolute left-0 right-0 h-px bg-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.8)] z-10"
            />
          )}

          <div className="absolute bottom-8 left-8 right-8 flex justify-between items-end">
            <div className="space-y-1">
              <p className="text-[8px] font-black text-amber-500 uppercase tracking-widest">NDVI Index</p>
              <p className="text-4xl font-black tracking-tighter">{displayNdvi}</p>
            </div>
            <button 
              onClick={handleScan}
              disabled={isScanning}
              className="p-4 bg-amber-500 text-black rounded-2xl shadow-xl active:scale-95 transition-all disabled:opacity-50"
            >
              <Activity className={`w-6 h-6 ${isScanning ? 'animate-pulse' : ''}`} />
            </button>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 gap-4">
          <MetricCard icon={<Droplets />} label="Moisture" value={displayMoisture} status={Number(displayNdvi) > 0.6 ? "Optimal" : "Check Lines"} color="text-amber-400" />
          <MetricCard icon={<Sun />} label="Chlorophyll" value={displayChlorophyll} status={displayChlorophyll === 'High' ? "Healthy" : "Deficient"} color="text-amber-500" />
          <MetricCard icon={<Thermometer />} label="Surface Temp" value={displayTemp} status="Normal" color="text-orange-400" />
          <MetricCard icon={<Layers />} label="Biomass" value={displayBiomass} status="Growing" color="text-amber-600" />
        </div>

        {/* Alerts Section */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-[10px] font-black text-stone-500 uppercase tracking-[0.3em]">Health Alerts</h3>
            <div className="h-px flex-1 bg-amber-500/10 ml-6" />
          </div>
          
          <div className="space-y-4">
            <div className="bg-stone-950 p-6 rounded-[2rem] border border-amber-500/5 flex items-start gap-4">
              <div className="p-3 bg-amber-500/10 text-amber-500 rounded-xl">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h4 className="text-[10px] font-black uppercase tracking-widest">Uniform Growth</h4>
                <p className="text-[9px] font-bold text-stone-500 uppercase leading-relaxed tracking-widest">
                  {Number(displayNdvi) > 0.7 ? "Excellent canopy thickness and dense cellular coverage." : "Consistent growth, monitor nutrient dispersion patterns."}
                </p>
              </div>
            </div>

            <div className="bg-stone-950 p-6 rounded-[2rem] border border-amber-500/5 flex items-start gap-4">
              <div className="p-3 bg-orange-500/10 text-orange-500 rounded-xl">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h4 className="text-[10px] font-black uppercase tracking-widest">Water Monitor</h4>
                <p className="text-[9px] font-bold text-stone-500 uppercase leading-relaxed tracking-widest">
                  Current Moisture index stands at {displayMoisture}. Keep irrigation lines fully pressurized.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Action Card */}
        <div className="bg-amber-500 p-8 rounded-[2.5rem] text-black space-y-4">
          <div className="flex items-center gap-3">
            <Info className="w-5 h-5" />
            <span className="text-[10px] font-black uppercase tracking-widest">AI Recommendation</span>
          </div>
          <p className="text-lg font-black tracking-tight leading-tight uppercase">
            {displayRecommendation}
          </p>
          <button className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest group">
            View Protocol <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        {history.length > 0 && (
          <div className="mt-12 space-y-6">
            <h3 className="text-xl font-black flex items-center gap-3 text-white uppercase tracking-tighter">
              <History className="text-amber-500 w-5 h-5" />
              Satellite History
            </h3>
            <div className="space-y-4">
              {history.map((report) => (
                <div key={report.id} className="bg-stone-950 rounded-[2rem] p-6 border border-white/5 flex items-center justify-between group">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-white/5 rounded-2xl text-amber-500 border border-white/5">
                      <Satellite className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-black text-white text-sm uppercase tracking-tight">{report.fieldName}</h4>
                      <p className="text-[10px] font-bold text-stone-500 uppercase tracking-widest">
                        {report.timestamp?.toDate ? report.timestamp.toDate().toLocaleDateString() : 'Recent'} • NDVI: {report.ndvi}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => setActiveReport(report)}
                      className="p-3 bg-white/5 rounded-xl border border-white/5 text-stone-400 hover:text-amber-500 transition-all"
                    >
                      <Search className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => deleteReport(report.id)}
                      className="p-3 bg-white/5 rounded-xl border border-white/5 text-stone-400 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

const MetricCard: React.FC<{ icon: React.ReactNode, label: string, value: string, status: string, color: string }> = ({ icon, label, value, status, color }) => (
  <div className="bg-stone-950 p-6 rounded-[2rem] border border-amber-500/5 space-y-3">
    <div className={`p-3 bg-amber-500/5 ${color} rounded-xl w-fit`}>
      {icon}
    </div>
    <div>
      <p className="text-[8px] font-black text-stone-500 uppercase tracking-widest mb-1">{label}</p>
      <div className="flex items-baseline gap-2">
        <span className="text-xl font-black tracking-tight">{value}</span>
        <span className={`text-[8px] font-black uppercase ${color}`}>{status}</span>
      </div>
    </div>
  </div>
);

export default CropHealthMonitor;
