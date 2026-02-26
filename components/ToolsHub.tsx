
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
  Map as MapIcon
} from 'lucide-react';

interface ToolsHubProps {
  setView: (view: AppView) => void;
}

const ToolsHub: React.FC<ToolsHubProps> = ({ setView }) => {
  const [searchQuery, setSearchQuery] = React.useState('');

  return (
    <div className="w-full flex flex-col pb-40 animate-in fade-in slide-in-from-bottom-8 duration-1000 ease-out bg-stone-50 min-h-screen">
      
      {/* Dynamic Header */}
      <section className="px-6 pt-10 pb-6">
        <div className="flex flex-col gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse"></div>
              <span className="text-[9px] font-black text-stone-400 uppercase tracking-[0.3em]">Arsenal</span>
            </div>
            <h2 className="text-4xl font-black text-stone-950 tracking-tighter uppercase leading-none">
              Field<br /><span className="text-amber-600 italic">Arsenal.</span>
            </h2>
          </div>
          
          <div className="relative group w-full">
            <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
              <Search className="w-4 h-4 text-stone-300 group-focus-within:text-amber-500 transition-colors" />
            </div>
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Tools & Protocols..."
              className="w-full bg-white border border-stone-100 p-4 pl-12 rounded-2xl outline-none shadow-sm font-bold text-xs text-stone-950 focus:ring-4 focus:ring-amber-500/10 transition-all placeholder:text-stone-300"
            />
          </div>
        </div>
      </section>

      <div className="px-6 space-y-12">
        
        {/* Featured Section: Precision Suite */}
        <section className="space-y-6">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-[10px] font-black text-stone-400 uppercase tracking-[0.4em]">Precision Suite</h3>
            <div className="h-px flex-1 bg-stone-100 mx-4" />
          </div>
          
          <div className="grid grid-cols-1 gap-4">
            <FeaturedTool 
              icon={<Maximize />} 
              title="Acreage Telemetry" 
              desc="Advanced GPS boundary mapping and topographical land analysis."
              onClick={() => setView(AppView.LAND_MARKER)}
              color="bg-stone-950"
              accent="text-amber-400"
            />
            <div className="grid grid-cols-2 gap-4">
              <ToolCard icon={<Camera />} label="Disease Scan" onClick={() => setView(AppView.DISEASE_SCANNER)} theme="rose" />
              <ToolCard icon={<MapIcon />} label="Field Registry" onClick={() => setView(AppView.FIELD_MAP)} theme="amber" />
            </div>
          </div>
        </section>

        {/* Market & Finance Section */}
        <section className="space-y-6">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-[10px] font-black text-stone-400 uppercase tracking-[0.4em]">Market & Finance</h3>
            <div className="h-px flex-1 bg-stone-100 mx-4" />
          </div>
          
          <div className="grid grid-cols-1 gap-4">
            <FeaturedTool 
              icon={<Wallet />} 
              title="Finance Ledger" 
              desc="Real-time P&L monitoring and expense tracking protocols."
              onClick={() => setView(AppView.FINANCE_LEDGER)}
              color="bg-gradient-to-br from-amber-500 to-orange-600"
              accent="text-white"
            />
            <div className="grid grid-cols-2 gap-4">
              <ToolCard icon={<TrendingUp />} label="Mandi Trends" onClick={() => setView(AppView.MARKET_PRICES)} theme="orange" />
              <ToolCard icon={<ShoppingCart />} label="Supply Rates" onClick={() => setView(AppView.INPUT_ADVISOR)} theme="amber" />
            </div>
          </div>
        </section>

        {/* Operational Suite Grid */}
        <section className="space-y-6">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-[10px] font-black text-stone-400 uppercase tracking-[0.4em]">Operational Suite</h3>
            <div className="h-px flex-1 bg-stone-100 mx-4" />
          </div>
          
          <div className="grid grid-cols-3 gap-4">
            <ToolCard icon={<Lightbulb />} label="Advisor" onClick={() => setView(AppView.CROP_ADVISOR)} theme="amber" compact />
            <ToolCard icon={<Beaker />} label="Spraying" onClick={() => setView(AppView.SPRAYING_ADVISOR)} theme="orange" compact />
            <ToolCard icon={<Droplets />} label="Irrigation" onClick={() => setView(AppView.IRRIGATION_HUB)} theme="rose" compact />
            <ToolCard icon={<Calendar />} label="Harvest" onClick={() => setView(AppView.HARVEST_SCHEDULER)} theme="amber" compact />
            <ToolCard icon={<Calculator />} label="Yield" onClick={() => setView(AppView.YIELD_PREDICTOR)} theme="orange" compact />
            <ToolCard icon={<CloudSun />} label="Weather" onClick={() => setView(AppView.WEATHER_HUB)} theme="rose" compact />
            <ToolCard icon={<Microscope />} label="Soil Lab" onClick={() => setView(AppView.SOIL_LAB)} theme="amber" compact />
            <ToolCard icon={<Bug />} label="Pest ID" onClick={() => setView(AppView.PEST_LIBRARY)} theme="orange" compact />
            <ToolCard icon={<Bell />} label="Alerts" onClick={() => setView(AppView.SMART_ALERTS)} theme="rose" compact />
            <ToolCard icon={<SettingsIcon />} label="Config" onClick={() => setView(AppView.SETTINGS)} theme="rose" compact />
          </div>
        </section>

        {/* Community & Knowledge */}
        <section className="space-y-6">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-[10px] font-black text-stone-400 uppercase tracking-[0.4em]">Community & Knowledge</h3>
            <div className="h-px flex-1 bg-stone-100 mx-4" />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <ToolCard icon={<Truck />} label="Equip Market" onClick={() => setView(AppView.EQUIPMENT_MARKET)} theme="amber" />
            <ToolCard icon={<BookOpen />} label="Agri Academy" onClick={() => setView(AppView.AGRI_ACADEMY)} theme="orange" />
          </div>
        </section>

        {/* Secondary Tools */}
        <section className="space-y-6">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-[10px] font-black text-stone-400 uppercase tracking-[0.4em]">Resources</h3>
            <div className="h-px flex-1 bg-stone-100 mx-4" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <SecondaryTool icon={<Newspaper />} label="Agri News" onClick={() => setView(AppView.AGRI_NEWS)} />
            <SecondaryTool icon={<Beef />} label="Livestock" onClick={() => setView(AppView.LIVESTOCK_ASSISTANT)} />
            <SecondaryTool icon={<ShieldCheck />} label="Sustainability" onClick={() => setView(AppView.SUSTAINABILITY_HUB)} />
            <SecondaryTool icon={<HelpCircle />} label="Support" onClick={() => setView(AppView.HELP_FEEDBACK)} />
          </div>
        </section>
      </div>
    </div>
  );
};

const FeaturedTool: React.FC<{ icon: React.ReactNode, title: string, desc: string, onClick: () => void, color: string, accent: string }> = ({ icon, title, desc, onClick, color, accent }) => (
  <button 
    onClick={onClick}
    className={`w-full ${color} p-6 rounded-[2rem] text-white shadow-xl relative overflow-hidden group active:scale-[0.98] transition-all text-left`}
  >
    <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
      {React.cloneElement(icon as React.ReactElement, { className: 'w-32 h-32 -mr-8 -mt-8 rotate-12' } as any)}
    </div>
    <div className="relative z-10 space-y-4">
      <div className="bg-white/20 backdrop-blur-md w-fit p-3 rounded-xl border border-white/20">
        {React.cloneElement(icon as React.ReactElement, { className: 'w-6 h-6 text-white' } as any)}
      </div>
      <div className="space-y-1">
        <h4 className={`text-2xl font-black tracking-tighter uppercase leading-none ${accent}`}>{title}</h4>
        <p className="text-white/60 text-xs font-medium leading-tight max-w-[200px]">{desc}</p>
      </div>
      <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-white/40 group-hover:text-white transition-colors">
        Initialize <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-2 transition-transform" />
      </div>
    </div>
  </button>
);

const ToolCard: React.FC<{ icon: React.ReactNode, label: string, onClick: () => void, theme: 'amber' | 'orange' | 'rose', compact?: boolean }> = ({ icon, label, onClick, theme, compact }) => {
  const themes = {
    amber: 'bg-amber-50 text-amber-600 border-amber-100',
    orange: 'bg-orange-50 text-orange-600 border-orange-100',
    rose: 'bg-rose-50 text-rose-600 border-rose-100'
  };

  return (
    <button 
      onClick={onClick}
      className="bg-white border border-stone-100 p-6 rounded-[2rem] flex flex-col items-center justify-center gap-4 active:scale-95 transition-all hover:shadow-xl hover:border-stone-200 group"
    >
      <div className={`${themes[theme]} ${compact ? 'p-4' : 'p-6'} rounded-2xl border transition-all group-hover:scale-110 group-hover:rotate-6`}>
        {React.cloneElement(icon as React.ReactElement, { className: compact ? 'w-5 h-5' : 'w-7 h-7' } as any)}
      </div>
      <span className={`font-black uppercase tracking-widest text-center leading-tight group-hover:text-stone-950 transition-colors ${compact ? 'text-[8px]' : 'text-[10px]'}`}>
        {label}
      </span>
    </button>
  );
};

const SecondaryTool: React.FC<{ icon: React.ReactNode, label: string, onClick: () => void }> = ({ icon, label, onClick }) => (
  <button 
    onClick={onClick}
    className="flex items-center gap-4 p-4 bg-white border border-stone-100 rounded-2xl active:scale-95 transition-all hover:shadow-md"
  >
    <div className="p-3 bg-stone-50 text-stone-400 rounded-xl">
      {React.cloneElement(icon as React.ReactElement, { className: 'w-5 h-5' } as any)}
    </div>
    <span className="text-[10px] font-black text-stone-600 uppercase tracking-widest">{label}</span>
  </button>
);

export default ToolsHub;
