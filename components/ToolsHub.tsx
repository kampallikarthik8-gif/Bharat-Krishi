
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
  ArrowRightLeft
} from 'lucide-react';

interface ToolsHubProps {
  setView: (view: AppView) => void;
}

const ToolsHub: React.FC<ToolsHubProps> = ({ setView }) => {
  const [searchQuery, setSearchQuery] = React.useState('');

  return (
    <div className="w-full flex flex-col pb-40 bg-transparent min-h-screen">
      
      {/* Header */}
      <section className="px-6 pt-12 pb-8">
        <div className="flex flex-col gap-8">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-emerald-600 shadow-sm" />
              <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-[0.2em]">Explore Tools</span>
            </div>
            <h2 className="text-5xl font-bold text-stone-900 tracking-tight font-serif leading-none">
              Your <span className="text-emerald-700">Toolkit.</span>
            </h2>
            <p className="text-[10px] font-bold text-stone-400 uppercase tracking-[0.1em]">Smart Farming Solutions v2.5</p>
          </div>
          
          <div className="relative group w-full">
            <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none">
              <Search className="w-5 h-5 text-stone-300 group-focus-within:text-emerald-600 transition-colors" />
            </div>
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for a tool..."
              className="w-full bg-white border border-stone-200 p-6 pl-16 rounded-[2rem] outline-none shadow-xl shadow-stone-200/30 text-sm text-stone-900 focus:border-emerald-600/50 focus:ring-4 focus:ring-emerald-50/50 transition-all placeholder:text-stone-300"
            />
          </div>
        </div>
      </section>

      <div className="px-6 space-y-16">
        
        {/* Field Tools */}
        <section className="space-y-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-1.5 h-5 bg-emerald-600 rounded-full" />
              <h3 className="text-[10px] font-bold text-stone-400 uppercase tracking-[0.3em]">Field Tools</h3>
            </div>
            <div className="h-px flex-1 bg-stone-100 ml-6" />
          </div>
          
          <div className="grid grid-cols-1 gap-6">
            <FeaturedTool 
              icon={<Maximize />} 
              title="Acreage Mapping" 
              desc="High-precision GPS boundary mapping and geospatial land analysis."
              onClick={() => setView(AppView.LAND_MARKER)}
              color="bg-stone-900"
              accent="text-emerald-400"
            />
            <div className="grid grid-cols-2 gap-6">
              <ToolCard icon={<Camera />} label="Disease Scan" onClick={() => setView(AppView.DISEASE_SCANNER)} theme="emerald" />
              <ToolCard icon={<MapIcon />} label="Field Registry" onClick={() => setView(AppView.FIELD_MAP)} theme="blue" />
            </div>
          </div>
        </section>

        {/* Market & Finance */}
        <section className="space-y-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-1.5 h-5 bg-emerald-600 rounded-full" />
              <h3 className="text-[10px] font-bold text-stone-400 uppercase tracking-[0.3em]">Finance & Market</h3>
            </div>
            <div className="h-px flex-1 bg-stone-100 ml-6" />
          </div>
          
          <div className="grid grid-cols-1 gap-6">
            <FeaturedTool 
              icon={<Wallet />} 
              title="Finance Ledger" 
              desc="Real-time P&L monitoring, automated expense tracking, and fiscal audits."
              onClick={() => setView(AppView.FINANCE_LEDGER)}
              color="bg-emerald-50"
              accent="text-emerald-800"
            />
            <div className="grid grid-cols-2 gap-6">
              <ToolCard icon={<TrendingUp />} label="Mandi Prices" onClick={() => setView(AppView.MARKET_PRICES)} theme="emerald" />
              <ToolCard icon={<ShoppingCart />} label="Input Advisor" onClick={() => setView(AppView.INPUT_ADVISOR)} theme="blue" />
            </div>
          </div>
        </section>

        {/* Daily Farming */}
        <section className="space-y-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-1.5 h-5 bg-emerald-600 rounded-full" />
              <h3 className="text-[10px] font-bold text-stone-400 uppercase tracking-[0.3em]">Daily Farming</h3>
            </div>
            <div className="h-px flex-1 bg-stone-100 ml-6" />
          </div>
          
          <div className="grid grid-cols-3 gap-4">
            <ToolCard icon={<Lightbulb />} label="Advisor" onClick={() => setView(AppView.CROP_ADVISOR)} theme="emerald" compact />
            <ToolCard icon={<ArrowRightLeft />} label="Rotation" onClick={() => setView(AppView.CROP_ROTATION_ADVISOR)} theme="blue" compact />
            <ToolCard icon={<Beaker />} label="Spraying" onClick={() => setView(AppView.SPRAYING_ADVISOR)} theme="blue" compact />
            <ToolCard icon={<Droplets />} label="Irrigation" onClick={() => setView(AppView.IRRIGATION_HUB)} theme="emerald" compact />
            <ToolCard icon={<Calendar />} label="Harvest" onClick={() => setView(AppView.HARVEST_SCHEDULER)} theme="blue" compact />
            <ToolCard icon={<Calculator />} label="Yield" onClick={() => setView(AppView.YIELD_PREDICTOR)} theme="emerald" compact />
            <ToolCard icon={<CloudSun />} label="Weather" onClick={() => setView(AppView.WEATHER_HUB)} theme="blue" compact />
            <ToolCard icon={<Microscope />} label="Soil Lab" onClick={() => setView(AppView.SOIL_LAB)} theme="emerald" compact />
            <ToolCard icon={<Bug />} label="Pest ID" onClick={() => setView(AppView.PEST_LIBRARY)} theme="blue" compact />
          </div>
        </section>

        {/* Knowledge Base */}
        <section className="space-y-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-1.5 h-5 bg-emerald-600 rounded-full" />
              <h3 className="text-[10px] font-bold text-stone-400 uppercase tracking-[0.3em]">Learning & News</h3>
            </div>
            <div className="h-px flex-1 bg-stone-100 ml-6" />
          </div>
          <div className="grid grid-cols-1 gap-4">
            <SecondaryTool icon={<BookOpen />} label="Agri Academy" onClick={() => setView(AppView.AGRI_ACADEMY)} />
            <SecondaryTool icon={<Newspaper />} label="Agri News" onClick={() => setView(AppView.AGRI_NEWS)} />
            <SecondaryTool icon={<Beef />} label="Livestock Assistant" onClick={() => setView(AppView.LIVESTOCK_ASSISTANT)} />
            <SecondaryTool icon={<ShieldCheck />} label="Sustainability Hub" onClick={() => setView(AppView.SUSTAINABILITY_HUB)} />
          </div>
        </section>
      </div>

      {/* Footer */}
      <section className="px-6 mt-20 mb-10 text-center">
        <div className="flex items-center justify-center gap-4 mb-4 opacity-30">
          <div className="h-px w-12 bg-stone-300" />
          <span className="text-[8px] font-bold uppercase tracking-[0.5em] text-stone-400">Bharat Kisan</span>
          <div className="h-px w-12 bg-stone-300" />
        </div>
        <p className="text-[8px] font-bold text-stone-300 uppercase tracking-[0.3em]">
          © {new Date().getFullYear()} BHARAT-KISAN-SYSTEMS
        </p>
      </section>
    </div>
  );
};

const FeaturedTool: React.FC<{ icon: React.ReactNode, title: string, desc: string, onClick: () => void, color: string, accent: string }> = ({ icon, title, desc, onClick, color, accent }) => (
  <button 
    onClick={onClick}
    className={`w-full ${color} p-10 rounded-[2.5rem] border border-stone-200 shadow-xl shadow-stone-200/30 relative overflow-hidden group active:scale-[0.98] transition-all text-left`}
  >
    <div className="absolute top-0 right-0 p-12 opacity-[0.05] group-hover:opacity-[0.1] transition-opacity">
      {React.cloneElement(icon as React.ReactElement, { className: 'w-56 h-56 -mr-10 -mt-10 rotate-12' } as any)}
    </div>
    <div className="relative z-10 space-y-6">
      <div className="bg-white/10 backdrop-blur-md w-fit p-4 rounded-2xl border border-white/20 shadow-sm">
        {React.cloneElement(icon as React.ReactElement, { className: `w-8 h-8 ${color === 'bg-stone-900' ? 'text-emerald-400' : 'text-emerald-700'}` } as any)}
      </div>
      <div className="space-y-2">
        <h4 className={`text-3xl font-bold tracking-tight font-serif ${accent}`}>{title}</h4>
        <p className={`${color === 'bg-stone-900' ? 'text-white/40' : 'text-stone-500'} text-[10px] font-bold uppercase tracking-widest leading-relaxed max-w-[280px]`}>{desc}</p>
      </div>
      <div className={`flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.2em] ${color === 'bg-stone-900' ? 'text-white/20 group-hover:text-emerald-400' : 'text-stone-300 group-hover:text-emerald-700'} transition-colors`}>
        Open Tool <ArrowRight className="w-4 h-4 group-hover:translate-x-2 transition-transform" />
      </div>
    </div>
  </button>
);

const ToolCard: React.FC<{ icon: React.ReactNode, label: string, onClick: () => void, theme: 'emerald' | 'orange' | 'blue', compact?: boolean }> = ({ icon, label, onClick, theme, compact }) => {
  const themes = {
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    orange: 'bg-orange-50 text-orange-600 border-orange-100',
    blue: 'bg-blue-50 text-blue-600 border-blue-100'
  };

  return (
    <button 
      onClick={onClick}
      className="bg-white p-6 rounded-[2rem] border border-stone-200 flex flex-col items-center justify-center gap-6 active:scale-95 transition-all group shadow-sm hover:shadow-md hover:border-emerald-600/20"
    >
      <div className={`${themes[theme]} ${compact ? 'p-5' : 'p-8'} rounded-2xl border transition-all group-hover:scale-110 group-hover:rotate-3`}>
        {React.cloneElement(icon as React.ReactElement, { className: compact ? 'w-6 h-6' : 'w-8 h-8' } as any)}
      </div>
      <span className={`font-bold uppercase tracking-[0.1em] text-center leading-tight group-hover:text-emerald-700 transition-colors ${compact ? 'text-[8px]' : 'text-[10px]'} text-stone-400`}>
        {label}
      </span>
    </button>
  );
};

const SecondaryTool: React.FC<{ icon: React.ReactNode, label: string, onClick: () => void }> = ({ icon, label, onClick }) => (
  <button 
    onClick={onClick}
    className="flex items-center gap-6 p-6 bg-white border border-stone-200 rounded-[2rem] active:scale-[0.98] transition-all hover:bg-emerald-50 hover:border-emerald-600/20 group shadow-sm hover:shadow-md"
  >
    <div className="p-4 bg-stone-50 text-stone-400 rounded-xl group-hover:bg-emerald-100 group-hover:text-emerald-700 transition-colors border border-stone-100">
      {React.cloneElement(icon as React.ReactElement, { className: 'w-6 h-6' } as any)}
    </div>
    <span className="text-[10px] font-bold text-stone-500 uppercase tracking-widest group-hover:text-stone-900 transition-colors">{label}</span>
    <ChevronRight className="w-5 h-5 text-stone-200 ml-auto group-hover:text-emerald-600 transition-colors" />
  </button>
);

export default ToolsHub;
