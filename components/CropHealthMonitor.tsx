
import React from 'react';
import { motion } from 'motion/react';
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
  Thermometer
} from 'lucide-react';

const CropHealthMonitor: React.FC = () => {
  const [selectedField, setSelectedField] = React.useState('North Parcel');
  const [isScanning, setIsScanning] = React.useState(false);

  const fields = ['North Parcel', 'South Ridge', 'East Meadow', 'West Orchard'];

  const handleScan = () => {
    setIsScanning(true);
    setTimeout(() => setIsScanning(false), 2500);
  };

  return (
    <div className="w-full flex flex-col pb-40 bg-stone-950 min-h-screen text-white">
      {/* Header */}
      <section className="px-6 pt-12 pb-8 bg-stone-900/50 border-b border-white/5">
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-500/60">Satellite Telemetry</span>
          </div>
          <h1 className="text-5xl font-black tracking-tighter uppercase leading-none">
            Crop<br />
            <span className="text-emerald-500 italic">Health.</span>
          </h1>
          
          <div className="flex gap-2 overflow-x-auto no-scrollbar py-2">
            {fields.map(field => (
              <button 
                key={field}
                onClick={() => setSelectedField(field)}
                className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${selectedField === field ? 'bg-emerald-500 text-stone-950 shadow-lg shadow-emerald-500/20' : 'bg-white/5 text-stone-500 border border-white/5'}`}
              >
                {field}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="px-6 py-8 space-y-8">
        
        {/* NDVI Visualization (Simulated) */}
        <div className="relative aspect-square bg-stone-900 rounded-[2.5rem] overflow-hidden border border-white/5 shadow-2xl">
          <div className="absolute inset-0 opacity-40">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/50 via-stone-900 to-emerald-900/50" />
            <div className="absolute inset-0 organic-grid opacity-20" />
          </div>
          
          {/* Simulated Heatmap Layers */}
          <div className="absolute inset-12 rounded-[2rem] border-2 border-emerald-500/20 flex items-center justify-center">
             <motion.div 
               animate={{ 
                 scale: [1, 1.05, 1],
                 opacity: [0.3, 0.6, 0.3]
               }}
               transition={{ duration: 4, repeat: Infinity }}
               className="w-full h-full bg-emerald-500/10 blur-3xl rounded-full"
             />
             <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-3/4 h-3/4 border border-emerald-500/30 rounded-full border-dashed animate-spin-slow" />
             </div>
          </div>

          {/* Scanning Line */}
          {isScanning && (
            <motion.div 
              initial={{ top: '0%' }}
              animate={{ top: '100%' }}
              transition={{ duration: 2.5, ease: "linear" }}
              className="absolute left-0 right-0 h-px bg-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.8)] z-10"
            />
          )}

          <div className="absolute bottom-8 left-8 right-8 flex justify-between items-end">
            <div className="space-y-1">
              <p className="text-[8px] font-black text-emerald-500 uppercase tracking-widest">NDVI Index</p>
              <p className="text-4xl font-black tracking-tighter">0.82</p>
            </div>
            <button 
              onClick={handleScan}
              disabled={isScanning}
              className="p-4 bg-white text-stone-950 rounded-2xl shadow-xl active:scale-95 transition-all disabled:opacity-50"
            >
              <Activity className={`w-6 h-6 ${isScanning ? 'animate-pulse' : ''}`} />
            </button>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 gap-4">
          <MetricCard icon={<Droplets />} label="Moisture" value="68%" status="Optimal" color="text-blue-400" />
          <MetricCard icon={<Sun />} label="Chlorophyll" value="High" status="Healthy" color="text-emerald-400" />
          <MetricCard icon={<Thermometer />} label="Surface Temp" value="24°C" status="Normal" color="text-orange-400" />
          <MetricCard icon={<Layers />} label="Biomass" value="1.2t" status="Growing" color="text-purple-400" />
        </div>

        {/* Alerts Section */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-[10px] font-black text-stone-500 uppercase tracking-[0.3em]">Health Alerts</h3>
            <div className="h-px flex-1 bg-white/5 ml-6" />
          </div>
          
          <div className="space-y-4">
            <div className="bg-white/5 p-6 rounded-[2rem] border border-white/5 flex items-start gap-4">
              <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-xl">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h4 className="text-[10px] font-black uppercase tracking-widest">Uniform Growth</h4>
                <p className="text-[9px] font-bold text-stone-500 uppercase leading-relaxed tracking-widest">
                  92% of the parcel shows consistent vegetation density. No immediate action required.
                </p>
              </div>
            </div>

            <div className="bg-white/5 p-6 rounded-[2rem] border border-white/5 flex items-start gap-4">
              <div className="p-3 bg-orange-500/10 text-orange-500 rounded-xl">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h4 className="text-[10px] font-black uppercase tracking-widest">Low Moisture Zone</h4>
                <p className="text-[9px] font-bold text-stone-500 uppercase leading-relaxed tracking-widest">
                  South-east corner (0.4 Ac) shows signs of water stress. Check irrigation lines.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Action Card */}
        <div className="bg-emerald-500 p-8 rounded-[2.5rem] text-stone-950 space-y-4">
          <div className="flex items-center gap-3">
            <Info className="w-5 h-5" />
            <span className="text-[10px] font-black uppercase tracking-widest">AI Recommendation</span>
          </div>
          <p className="text-lg font-black tracking-tight leading-tight uppercase">
            Apply nitrogen-rich fertilizer to the North-West quadrant to boost late-stage growth.
          </p>
          <button className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest group">
            View Protocol <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

      </div>
    </div>
  );
};

const MetricCard: React.FC<{ icon: React.ReactNode, label: string, value: string, status: string, color: string }> = ({ icon, label, value, status, color }) => (
  <div className="bg-white/5 p-6 rounded-[2rem] border border-white/5 space-y-3">
    <div className={`p-3 bg-white/5 ${color} rounded-xl w-fit`}>
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
