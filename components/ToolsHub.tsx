
import React from 'react';
import { AppView } from '../types';
import { 
  Droplets, 
  Layers, 
  Beaker, 
  MapPin, 
  Calculator, 
  FlaskConical,
  Calendar, 
  Maximize,
  ChevronRight,
  Bell,
  Search,
  Box,
  Wallet,
  Landmark,
  CloudSun,
  ShieldCheck,
  TrendingUp,
  Microscope,
  ShoppingCart,
  Lightbulb,
  Camera,
  Bug,
  Newspaper,
  ClipboardCheck,
  Mic,
  Activity,
  Target,
  Globe,
  Ruler,
  Compass,
  Star,
  ArrowRight,
  Settings as SettingsIcon,
  HelpCircle,
  Map as MapIcon,
  ArrowRightLeft,
  FileText
} from 'lucide-react';

import { triggerSelectionHaptic } from '../src/utils/haptics';
import { useFirebase } from '../src/components/FirebaseProvider';

interface ToolsHubProps {
  setView: (view: AppView) => void;
}

const TOOLS = [
  { id: 'disease', icon: <Camera />, label: 'Disease Scan', view: AppView.DISEASE_SCANNER, category: 'Field', theme: 'amber', desc: 'AI-powered crop diagnosis' },
  { id: 'health', icon: <Activity />, label: 'Crop Health', view: AppView.CROP_HEALTH_MONITOR, category: 'Field', theme: 'orange', desc: 'Satellite & sensor monitoring' },
  { id: 'registry', icon: <MapIcon />, label: 'Field Registry', view: AppView.FIELD_MAP, category: 'Field', theme: 'amber', desc: 'GIS-based parcel management' },
  { id: 'ledger', icon: <Wallet />, label: 'Finance Ledger', view: AppView.FINANCE_LEDGER, category: 'Finance', theme: 'amber', desc: 'P&L monitoring & audits', featured: true },
  { id: 'mandi', icon: <TrendingUp />, label: 'Mandi Prices', view: AppView.MARKET_PRICES, category: 'Finance', theme: 'amber', desc: 'Live market price tracking' },
  { id: 'inputs', icon: <ShoppingCart />, label: 'Input Advisor', view: AppView.INPUT_ADVISOR, category: 'Finance', theme: 'amber', desc: 'Smart procurement advice' },
  { id: 'advisor', icon: <Lightbulb />, label: 'Crop Advisor', view: AppView.CROP_ADVISOR, category: 'Daily', theme: 'amber', desc: 'AI agronomy recommendations' },
  { id: 'rotation', icon: <ArrowRightLeft />, label: 'Rotation', view: AppView.CROP_ROTATION_ADVISOR, category: 'Daily', theme: 'amber', desc: 'Soil health optimization' },
  { id: 'fertilizer', icon: <FlaskConical />, label: 'Fertilizer Calc', view: AppView.FERTILIZER_CALCULATOR, category: 'Daily', theme: 'amber', desc: 'NPK ratio & bag dosage calculator' },
  { id: 'spraying', icon: <Beaker />, label: 'Spraying', view: AppView.SPRAYING_ADVISOR, category: 'Daily', theme: 'amber', desc: 'Pesticide dosage calculator' },
  { id: 'irrigation', icon: <Droplets />, label: 'Irrigation', view: AppView.IRRIGATION_HUB, category: 'Daily', theme: 'amber', desc: 'Water management hub' },
  { id: 'harvest', icon: <Calendar />, label: 'Harvest', view: AppView.HARVEST_SCHEDULER, category: 'Daily', theme: 'amber', desc: 'Optimal timing scheduler' },
  { id: 'yield', icon: <Calculator />, label: 'Yield', view: AppView.YIELD_PREDICTOR, category: 'Daily', theme: 'amber', desc: 'Production forecasting' },
  { id: 'weather', icon: <CloudSun />, label: 'Weather', view: AppView.WEATHER_HUB, category: 'Daily', theme: 'amber', desc: 'Hyper-local forecasting' },
  { id: 'soil', icon: <Microscope />, label: 'Soil Lab', view: AppView.SOIL_LAB, category: 'Daily', theme: 'amber', desc: 'Nutrient & pH analysis' },
  { id: 'pest', icon: <Bug />, label: 'Pest ID', view: AppView.PEST_LIBRARY, category: 'Daily', theme: 'amber', desc: 'Pest identification library' },
  { id: 'news', icon: <Newspaper />, label: 'Agri News', view: AppView.AGRI_NEWS, category: 'Learning', theme: 'amber', desc: 'Latest industry updates' },
  { id: 'project_docs', icon: <FileText />, label: 'Project Specs', view: AppView.PROJECT_DOCS, category: 'Learning', theme: 'amber', desc: '30-Page SRS & System Architecture' },
];

const ToolsHub: React.FC<ToolsHubProps> = ({ setView }) => {
  const [searchQuery, setSearchQuery] = React.useState('');
  const { profile } = useFirebase();

  const handleSetView = (view: AppView) => {
    triggerSelectionHaptic();
    setView(view);
  };

  const filteredTools = TOOLS.filter(tool => 
    tool.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tool.desc.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tool.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const categories = Array.from(new Set(filteredTools.map(t => t.category)));

  return (
    <div className="w-full flex flex-col pb-40 min-h-screen bg-[#090e0c] text-stone-100">
      
      {/* Hero Header */}
      <section className="px-6 pt-10 pb-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-[100px] -mr-40 -mt-40 pointer-events-none" />
        <div className="relative z-10 space-y-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-widest">Advanced Agriculture Suite</span>
            </div>
            <h2 className="text-3xl font-extrabold text-white tracking-tight">
              Smart <span className="text-emerald-400 font-serif italic">Farmer Toolkit</span>
            </h2>
            <p className="text-xs text-stone-400">All precision AI advisory, GIS mapping, and financial ledger tools in one hub.</p>
          </div>
          
          <div className="relative group max-w-md">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
              <Search className="w-4 h-4 text-stone-400 group-focus-within:text-emerald-400 transition-colors" />
            </div>
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tools, categories, diagnosis..."
              className="w-full bg-[#121a14] border border-emerald-500/20 p-3.5 pl-11 rounded-2xl outline-none shadow-xl text-sm text-white focus:border-emerald-500/50 focus:ring-4 focus:ring-emerald-500/10 transition-all placeholder:text-stone-500 font-medium"
            />
          </div>
        </div>
      </section>

      <div className="px-6 space-y-10">
        
        {/* Featured Section */}
        {searchQuery === '' && (
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-extrabold text-emerald-400 uppercase tracking-widest flex items-center gap-2">
                <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" /> Featured Tool
              </h3>
              <div className="h-px flex-1 bg-emerald-500/10 ml-4" />
            </div>
            <div className="grid grid-cols-1 gap-4">
              <FeaturedTool 
                icon={<Wallet />} 
                title="Finance Ledger" 
                desc="Real-time P&L monitoring, automated input expense tracking, and fiscal audits."
                onClick={() => handleSetView(AppView.FINANCE_LEDGER)}
                color="glass-card"
                accent="text-emerald-400"
              />
            </div>
          </section>
        )}

        {/* Dynamic Tool Grid */}
        {categories.map((category, idx) => (
          <section key={category} className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-emerald-400/60">0{idx + 1}</span>
                <h3 className="text-xs font-extrabold text-stone-300 uppercase tracking-widest">{category} Tools</h3>
              </div>
              <div className="h-px flex-1 bg-emerald-500/10 ml-4" />
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {filteredTools.filter(t => t.category === category).map(tool => (
                <ToolBentoCard 
                  key={tool.id}
                  icon={tool.icon}
                  label={tool.label}
                  desc={tool.desc}
                  onClick={() => handleSetView(tool.view)}
                />
              ))}
            </div>
          </section>
        ))}

        {/* Admin Tools */}
        {profile?.role === 'admin' && searchQuery === '' && (
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <h3 className="text-xs font-extrabold text-stone-300 uppercase tracking-widest">System Admin</h3>
              </div>
              <div className="h-px flex-1 bg-emerald-500/10 ml-4" />
            </div>
            <div>
              <button 
                onClick={() => handleSetView(AppView.ADMIN_PANEL)}
                className="w-full flex items-center gap-4 p-5 glass-card glass-card-hover rounded-2xl border border-emerald-500/20 shadow-md text-left group"
              >
                <div className="p-3 bg-emerald-950/80 text-emerald-400 rounded-xl border border-emerald-500/30 group-hover:scale-105 transition-all">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-bold text-white mb-0.5">Admin Control Center</h4>
                  <p className="text-xs text-stone-400">System metrics, node logs & broadcasts</p>
                </div>
                <ArrowRight className="w-5 h-5 text-stone-500 group-hover:text-emerald-400 group-hover:translate-x-1 transition-all" />
              </button>
            </div>
          </section>
        )}

        {filteredTools.length === 0 && (
          <div className="py-16 text-center space-y-3 glass-card rounded-3xl">
            <div className="w-12 h-12 bg-emerald-950/80 rounded-2xl flex items-center justify-center mx-auto border border-emerald-500/20">
              <Search className="w-6 h-6 text-emerald-400" />
            </div>
            <p className="text-xs font-bold text-stone-300">No tools match "{searchQuery}"</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <section className="px-6 mt-20 mb-6 text-center">
        <p className="text-[10px] font-mono font-medium text-stone-500">
          Bharat Kisan Smart Systems • v2.5
        </p>
      </section>
    </div>
  );
};

const ToolBentoCard: React.FC<{ icon: React.ReactNode, label: string, desc: string, onClick: () => void }> = ({ icon, label, desc, onClick }) => {
  return (
    <button 
      onClick={onClick}
      className="glass-card glass-card-hover p-4 rounded-2xl border border-emerald-500/15 flex flex-col items-start text-left gap-3 active:scale-95 transition-all group shadow-sm hover:border-emerald-500/30"
    >
      <div className="p-3 bg-emerald-950/80 text-emerald-400 rounded-xl border border-emerald-500/20 group-hover:scale-105 transition-all">
        {React.cloneElement(icon as React.ReactElement, { className: 'w-5 h-5' } as any)}
      </div>
      <div>
        <h4 className="text-xs font-bold text-white group-hover:text-emerald-300 transition-colors">
          {label}
        </h4>
        <p className="text-[10px] text-stone-400 font-normal leading-snug mt-0.5 line-clamp-2">
          {desc}
        </p>
      </div>
    </button>
  );
};

const FeaturedTool: React.FC<{ icon: React.ReactNode, title: string, desc: string, onClick: () => void, color: string, accent: string }> = ({ icon, title, desc, onClick, color, accent }) => (
  <button 
    onClick={onClick}
    className={`w-full ${color} p-6 rounded-3xl border border-emerald-500/20 shadow-xl relative overflow-hidden group active:scale-[0.98] transition-all text-left glass-card-hover`}
  >
    <div className="relative z-10 space-y-4">
      <div className="flex items-center justify-between">
        <div className="p-3 bg-emerald-950/80 rounded-xl border border-emerald-500/20">
          {React.cloneElement(icon as React.ReactElement, { className: `w-6 h-6 ${accent}` } as any)}
        </div>
        <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/80 px-2.5 py-1 rounded-full border border-emerald-500/30">
          Finance Hub
        </span>
      </div>
      <div className="space-y-1">
        <h4 className="text-base font-extrabold text-white tracking-tight">{title}</h4>
        <p className="text-stone-300 text-xs leading-relaxed max-w-[320px]">{desc}</p>
      </div>
      <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 group-hover:text-emerald-300 transition-colors pt-1">
        <span>Open Ledger</span> 
        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
      </div>
    </div>
  </button>
);

export default ToolsHub;
