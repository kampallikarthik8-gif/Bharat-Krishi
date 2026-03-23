
import React from 'react';
import { AppView } from '../types';
import { 
  Droplets, 
  Layers, 
  Beaker, 
  MapPin, 
  Calculator, 
  BookOpen, 
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
  Truck,
  Lightbulb,
  Camera,
  Bug,
  Newspaper,
  Beef,
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
  Leaf,
  ArrowRightLeft
} from 'lucide-react';

import { triggerSelectionHaptic } from '../src/utils/haptics';
import { useFirebase } from '../src/components/FirebaseProvider';

interface ToolsHubProps {
  setView: (view: AppView) => void;
}

const TOOLS = [
  { id: 'disease', icon: <Camera />, label: 'Disease Scan', view: AppView.DISEASE_SCANNER, category: 'Field', theme: 'emerald', desc: 'AI-powered crop diagnosis' },
  { id: 'health', icon: <Activity />, label: 'Crop Health', view: AppView.CROP_HEALTH_MONITOR, category: 'Field', theme: 'orange', desc: 'Satellite & sensor monitoring' },
  { id: 'registry', icon: <MapIcon />, label: 'Field Registry', view: AppView.FIELD_MAP, category: 'Field', theme: 'blue', desc: 'GIS-based parcel management' },
  { id: 'ledger', icon: <Wallet />, label: 'Finance Ledger', view: AppView.FINANCE_LEDGER, category: 'Finance', theme: 'emerald', desc: 'P&L monitoring & audits', featured: true },
  { id: 'mandi', icon: <TrendingUp />, label: 'Mandi Prices', view: AppView.MARKET_PRICES, category: 'Finance', theme: 'emerald', desc: 'Live market price tracking' },
  { id: 'inputs', icon: <ShoppingCart />, label: 'Input Advisor', view: AppView.INPUT_ADVISOR, category: 'Finance', theme: 'blue', desc: 'Smart procurement advice' },
  { id: 'advisor', icon: <Lightbulb />, label: 'Crop Advisor', view: AppView.CROP_ADVISOR, category: 'Daily', theme: 'emerald', desc: 'AI agronomy recommendations' },
  { id: 'rotation', icon: <ArrowRightLeft />, label: 'Rotation', view: AppView.CROP_ROTATION_ADVISOR, category: 'Daily', theme: 'blue', desc: 'Soil health optimization' },
  { id: 'spraying', icon: <Beaker />, label: 'Spraying', view: AppView.SPRAYING_ADVISOR, category: 'Daily', theme: 'blue', desc: 'Pesticide dosage calculator' },
  { id: 'irrigation', icon: <Droplets />, label: 'Irrigation', view: AppView.IRRIGATION_HUB, category: 'Daily', theme: 'emerald', desc: 'Water management hub' },
  { id: 'harvest', icon: <Calendar />, label: 'Harvest', view: AppView.HARVEST_SCHEDULER, category: 'Daily', theme: 'blue', desc: 'Optimal timing scheduler' },
  { id: 'yield', icon: <Calculator />, label: 'Yield', view: AppView.YIELD_PREDICTOR, category: 'Daily', theme: 'emerald', desc: 'Production forecasting' },
  { id: 'weather', icon: <CloudSun />, label: 'Weather', view: AppView.WEATHER_HUB, category: 'Daily', theme: 'blue', desc: 'Hyper-local forecasting' },
  { id: 'soil', icon: <Microscope />, label: 'Soil Lab', view: AppView.SOIL_LAB, category: 'Daily', theme: 'emerald', desc: 'Nutrient & pH analysis' },
  { id: 'pest', icon: <Bug />, label: 'Pest ID', view: AppView.PEST_LIBRARY, category: 'Daily', theme: 'blue', desc: 'Pest identification library' },
  { id: 'carbon', icon: <Leaf />, label: 'Carbon Credits', view: AppView.CARBON_CREDIT_TRACKER, category: 'Learning', theme: 'emerald', desc: 'Eco-tracking & credits' },
  { id: 'rental', icon: <Truck />, label: 'Equipment', view: AppView.EQUIPMENT_RENTAL, category: 'Learning', theme: 'blue', desc: 'Fleet & rental management' },
  { id: 'academy', icon: <BookOpen />, label: 'Agri Academy', view: AppView.AGRI_ACADEMY, category: 'Learning', theme: 'emerald', desc: 'Modern farming courses' },
  { id: 'news', icon: <Newspaper />, label: 'Agri News', view: AppView.AGRI_NEWS, category: 'Learning', theme: 'blue', desc: 'Latest industry updates' },
  { id: 'livestock', icon: <Beef />, label: 'Livestock', view: AppView.LIVESTOCK_ASSISTANT, category: 'Learning', theme: 'emerald', desc: 'Animal health assistant' },
  { id: 'sustainability', icon: <ShieldCheck />, label: 'Sustainability', view: AppView.SUSTAINABILITY_HUB, category: 'Learning', theme: 'blue', desc: 'Eco-farming protocols' },
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
    <div className="w-full flex flex-col pb-40 bg-[var(--m3-background)] min-h-screen">
      
      {/* Hero Header */}
      <section className="px-6 pt-16 pb-12 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl -mr-32 -mt-32" />
        <div className="relative z-10 space-y-8">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="w-8 h-[2px] bg-emerald-600" />
              <span className="text-[10px] font-black text-emerald-700 uppercase tracking-[0.4em]">Advanced Toolkit</span>
            </div>
            <h2 className="text-6xl font-black text-stone-900 tracking-tighter leading-[0.9]">
              Smart <span className="text-emerald-700">Farming</span><br/>
              <span className="italic font-serif font-light">Solutions.</span>
            </h2>
          </div>
          
          <div className="relative group max-w-md">
            <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none">
              <Search className="w-5 h-5 text-stone-300 group-focus-within:text-emerald-600 transition-colors" />
            </div>
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tools, categories..."
              className="w-full bg-white border border-stone-200 p-6 pl-16 rounded-[2rem] outline-none shadow-2xl shadow-stone-200/40 text-sm text-stone-900 focus:border-emerald-600/50 focus:ring-8 focus:ring-emerald-50/50 transition-all placeholder:text-stone-300 font-medium"
            />
          </div>
        </div>
      </section>

      <div className="px-6 space-y-20">
        
        {/* Featured Section */}
        {searchQuery === '' && (
          <section className="space-y-8">
            <div className="flex items-center justify-between">
              <h3 className="text-[11px] font-black text-stone-400 uppercase tracking-[0.3em] flex items-center gap-3">
                <Star className="w-4 h-4 text-amber-400 fill-amber-400" /> Featured Intelligence
              </h3>
              <div className="h-px flex-1 bg-stone-100 ml-6" />
            </div>
            <div className="grid grid-cols-1 gap-6">
              <FeaturedTool 
                icon={<Wallet />} 
                title="Finance Ledger" 
                desc="Real-time P&L monitoring, automated expense tracking, and fiscal audits."
                onClick={() => handleSetView(AppView.FINANCE_LEDGER)}
                color="bg-emerald-900"
                accent="text-emerald-400"
              />
            </div>
          </section>
        )}

        {/* Dynamic Tool Grid */}
        {categories.map((category, idx) => (
          <section key={category} className="space-y-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="text-2xl font-black text-stone-200 font-mono">0{idx + 1}</span>
                <h3 className="text-[11px] font-black text-stone-400 uppercase tracking-[0.3em]">{category} Tools</h3>
              </div>
              <div className="h-px flex-1 bg-stone-100 ml-6" />
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {filteredTools.filter(t => t.category === category).map(tool => (
                <ToolBentoCard 
                  key={tool.id}
                  icon={tool.icon}
                  label={tool.label}
                  desc={tool.desc}
                  onClick={() => handleSetView(tool.view)}
                  theme={tool.theme as any}
                />
              ))}
            </div>
          </section>
        ))}

        {/* Admin Tools */}
        {profile?.role === 'admin' && searchQuery === '' && (
          <section className="space-y-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="text-2xl font-black text-rose-100 font-mono">XX</span>
                <h3 className="text-[11px] font-black text-rose-400 uppercase tracking-[0.3em]">System Admin</h3>
              </div>
              <div className="h-px flex-1 bg-rose-50 ml-6" />
            </div>
            <div className="grid grid-cols-1 gap-4">
              <button 
                onClick={() => handleSetView(AppView.ADMIN_PANEL)}
                className="flex items-center gap-6 p-8 bg-stone-900 rounded-[2.5rem] border border-stone-800 active:scale-[0.98] transition-all group shadow-2xl shadow-stone-950/40 text-left"
              >
                <div className="p-5 bg-rose-500/10 text-rose-500 rounded-2xl border border-rose-500/20 group-hover:bg-rose-500 group-hover:text-white transition-all">
                  <ShieldCheck className="w-8 h-8" />
                </div>
                <div className="flex-1">
                  <h4 className="text-lg font-black text-white uppercase tracking-wider mb-1">Admin Control Center</h4>
                  <p className="text-[10px] text-stone-500 font-bold uppercase tracking-widest">System metrics, node logs & broadcasts</p>
                </div>
                <ArrowRight className="w-6 h-6 text-stone-700 group-hover:text-rose-500 group-hover:translate-x-2 transition-all" />
              </button>
            </div>
          </section>
        )}

        {filteredTools.length === 0 && (
          <div className="py-20 text-center space-y-4">
            <div className="w-20 h-20 bg-stone-100 rounded-full flex items-center justify-center mx-auto">
              <Search className="w-8 h-8 text-stone-300" />
            </div>
            <p className="text-sm font-bold text-stone-400 uppercase tracking-widest">No tools match your search</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <section className="px-6 mt-32 mb-10 text-center">
        <div className="flex items-center justify-center gap-4 mb-6 opacity-20">
          <div className="h-px w-16 bg-stone-400" />
          <span className="text-[9px] font-black uppercase tracking-[0.6em] text-stone-500">Bharat Kisan</span>
          <div className="h-px w-16 bg-stone-400" />
        </div>
        <p className="text-[9px] font-black text-stone-300 uppercase tracking-[0.4em]">
          © {new Date().getFullYear()} BHARAT-KISAN-SYSTEMS • V2.5.2
        </p>
      </section>
    </div>
  );
};

const ToolBentoCard: React.FC<{ icon: React.ReactNode, label: string, desc: string, onClick: () => void, theme: 'emerald' | 'orange' | 'blue' }> = ({ icon, label, desc, onClick, theme }) => {
  const themes = {
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-100/50',
    orange: 'bg-orange-50 text-orange-600 border-orange-100/50',
    blue: 'bg-blue-50 text-blue-600 border-blue-100/50'
  };

  return (
    <button 
      onClick={onClick}
      className="bg-white p-6 rounded-[2.5rem] border border-stone-200 flex flex-col items-start text-left gap-6 active:scale-95 transition-all group shadow-sm hover:shadow-2xl hover:shadow-stone-200/40 hover:border-emerald-600/20"
    >
      <div className={`${themes[theme]} p-5 rounded-2xl border transition-all group-hover:scale-110 group-hover:rotate-6`}>
        {React.cloneElement(icon as React.ReactElement, { className: 'w-6 h-6' } as any)}
      </div>
      <div className="space-y-1">
        <h4 className="text-xs font-black text-stone-900 uppercase tracking-wider group-hover:text-emerald-700 transition-colors">
          {label}
        </h4>
        <p className="text-[9px] text-stone-400 font-bold uppercase tracking-widest leading-tight opacity-0 group-hover:opacity-100 transition-opacity">
          {desc}
        </p>
      </div>
    </button>
  );
};

const FeaturedTool: React.FC<{ icon: React.ReactNode, title: string, desc: string, onClick: () => void, color: string, accent: string }> = ({ icon, title, desc, onClick, color, accent }) => (
  <button 
    onClick={onClick}
    className={`w-full ${color} p-12 rounded-[3rem] border border-stone-800 shadow-2xl shadow-stone-950/40 relative overflow-hidden group active:scale-[0.98] transition-all text-left`}
  >
    <div className="absolute top-0 right-0 p-12 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity">
      {React.cloneElement(icon as React.ReactElement, { className: 'w-64 h-64 -mr-16 -mt-16 rotate-12' } as any)}
    </div>
    <div className="relative z-10 space-y-8">
      <div className="bg-white/5 backdrop-blur-xl w-fit p-5 rounded-2xl border border-white/10 shadow-inner">
        {React.cloneElement(icon as React.ReactElement, { className: `w-10 h-10 ${accent}` } as any)}
      </div>
      <div className="space-y-3">
        <h4 className={`text-4xl font-black tracking-tighter ${accent} uppercase`}>{title}</h4>
        <p className="text-white/40 text-[11px] font-bold uppercase tracking-[0.2em] leading-relaxed max-w-[300px]">{desc}</p>
      </div>
      <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-[0.4em] text-white/20 group-hover:text-white transition-colors">
        <span className="w-12 h-px bg-white/10 group-hover:bg-white transition-colors" />
        Launch Tool <ArrowRight className="w-4 h-4 group-hover:translate-x-3 transition-transform" />
      </div>
    </div>
  </button>
);

export default ToolsHub;
