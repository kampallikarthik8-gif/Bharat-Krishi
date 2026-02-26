import React from 'react';
import { AppView } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Home, 
  Menu, 
  User, 
  LayoutGrid,
  ChevronLeft,
  Code,
  Settings as SettingsIcon,
  LogOut
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  currentView: AppView;
  setView: (view: AppView) => void;
  onLogout: () => void;
  onBack?: () => void;
  canGoBack?: boolean;
}

const Layout: React.FC<LayoutProps> = ({ 
  children, 
  currentView, 
  setView, 
  onLogout,
  onBack,
  canGoBack 
}) => {
  const [drawerOpen, setDrawerOpen] = React.useState(false);

  const getViewTitle = () => {
    if (currentView === AppView.DASHBOARD) return 'Dashboard';
    if (currentView === AppView.TOOLS_HUB) return 'Arsenal';
    if (currentView === AppView.PROFILE) return 'Identity';
    if (currentView === AppView.SETTINGS) return 'System';
    return currentView.split('_').map(w => w.charAt(0) + w.slice(1).toLowerCase()).join(' ');
  };

  return (
    <div className="flex flex-col h-screen w-full bg-[#fcfcf9] relative overflow-hidden">
      {/* Refined Navigation Header */}
      <header className="flex items-center justify-between px-6 py-5 sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-stone-100">
        <div className="flex items-center gap-4">
          {canGoBack ? (
            <button 
              onClick={onBack}
              className="w-10 h-10 bg-stone-50 rounded-xl active:scale-90 transition-all flex items-center justify-center border border-stone-100"
            >
              <ChevronLeft className="w-5 h-5 text-stone-700" />
            </button>
          ) : (
            <button 
              onClick={() => setDrawerOpen(true)}
              className="w-10 h-10 bg-stone-50 rounded-xl active:scale-90 transition-all flex items-center justify-center border border-stone-100"
            >
              <Menu className="w-5 h-5 text-stone-700" />
            </button>
          )}
          <div className="flex flex-col">
            <h1 className="text-xl font-black tracking-tight text-stone-950 leading-none">
              {getViewTitle()}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={onLogout}
            className="w-10 h-10 bg-rose-50 rounded-xl flex items-center justify-center text-rose-600 active:scale-90 border border-rose-100"
          >
            <LogOut className="w-4 h-4" />
          </button>

          <button 
            onClick={() => setView(AppView.PROFILE)}
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all overflow-hidden border-2 ${currentView === AppView.PROFILE ? 'border-amber-500' : 'border-white'}`}
          >
            <div className="w-full h-full bg-stone-100 flex items-center justify-center">
              <User className={`w-4 h-4 ${currentView === AppView.PROFILE ? 'text-amber-600' : 'text-stone-400'}`} />
            </div>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto w-full custom-scrollbar scroll-smooth bg-stone-50/50">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentView}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="w-full h-full"
          >
             {children}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Immersive Side Drawer - Redesigned */}
      <div className={`fixed inset-0 z-[60] transition-all duration-700 ${drawerOpen ? 'opacity-100 visible' : 'opacity-0 invisible pointer-events-none'}`}>
        <div className="absolute inset-0 bg-stone-950/40 backdrop-blur-md" onClick={() => setDrawerOpen(false)} />
        <aside className={`
          absolute top-0 left-0 bottom-0 w-[85%] max-w-[420px] bg-white shadow-2xl transition-transform duration-700 cubic-bezier(0.16, 1, 0.3, 1) rounded-r-[4rem] flex flex-col
          ${drawerOpen ? 'translate-x-0' : '-translate-x-full'}
        `}>
          <div className="p-10 bg-gradient-to-br from-amber-500 to-orange-600 text-white rounded-tr-[3rem] relative overflow-hidden shrink-0">
            <div className="absolute -top-20 -right-20 w-64 h-64 bg-white/10 rounded-full blur-[80px]"></div>
            <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mb-6 shadow-2xl border border-white/20">
              <User className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-2xl font-black leading-none tracking-tighter uppercase serif">
              {localStorage.getItem('agri_farmer_name') || 'Farmer Identity'}
            </h2>
            <div className="flex items-center gap-4 mt-4">
              <div className="h-px w-6 bg-white/40"></div>
              <p className="text-[9px] font-black text-white/80 uppercase tracking-[0.3em]">
                {localStorage.getItem('agri_farm_name') || 'Main Operations'}
              </p>
            </div>
          </div>
          
          <div className="p-8 space-y-2 flex-1 overflow-y-auto">
            <DrawerItem icon={Home} label="Home" onClick={() => { setView(AppView.DASHBOARD); setDrawerOpen(false); }} active={currentView === AppView.DASHBOARD} />
            <DrawerItem icon={LayoutGrid} label="Arsenal Hub" onClick={() => { setView(AppView.TOOLS_HUB); setDrawerOpen(false); }} active={currentView === AppView.TOOLS_HUB} />
            <DrawerItem icon={User} label="Identity Context" onClick={() => { setView(AppView.PROFILE); setDrawerOpen(false); }} active={currentView === AppView.PROFILE} />
            <DrawerItem icon={SettingsIcon} label="System Config" onClick={() => { setView(AppView.SETTINGS); setDrawerOpen(false); }} active={currentView === AppView.SETTINGS} />
            
            <div className="my-6 h-px bg-stone-100" />
            
            <button 
              onClick={() => { onLogout(); setDrawerOpen(false); }}
              className="w-full flex items-center gap-4 px-6 py-4 text-rose-600 font-black text-[9px] rounded-2xl hover:bg-rose-50 transition-all uppercase tracking-[0.3em]"
            >
              Terminate Session
            </button>
          </div>


          <div className="p-6 bg-stone-50 border-t border-stone-100 shrink-0">
            <div className="flex items-center gap-4 opacity-60">
              <div className="p-3 bg-white rounded-xl shadow-sm border border-stone-100">
                <Code className="w-4 h-4 text-stone-400" />
              </div>
              <div>
                <p className="text-[8px] font-black uppercase text-stone-400 tracking-[0.3em] mb-0.5">Architected By</p>
                <p className="text-xs font-black text-stone-800 uppercase tracking-tight">AgriTech Labs</p>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

const DrawerItem: React.FC<{ icon: any, label: string, onClick: () => void, active: boolean }> = ({ icon: Icon, label, onClick, active }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all group ${active ? 'bg-stone-950 text-white shadow-xl' : 'text-stone-600 hover:bg-stone-50'}`}
  >
    <Icon className={`w-5 h-5 transition-transform group-hover:scale-110 ${active ? 'text-amber-400' : 'text-stone-400'}`} />
    <span className="font-black text-[10px] uppercase tracking-widest">{label}</span>
  </button>
);

export default Layout;