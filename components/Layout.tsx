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
    if (currentView === AppView.DASHBOARD) return 'Home';
    if (currentView === AppView.TOOLS_HUB) return 'Tools';
    if (currentView === AppView.PROFILE) return 'Profile';
    if (currentView === AppView.SETTINGS) return 'Settings';
    return currentView.split('_').map(w => w.charAt(0) + w.slice(1).toLowerCase()).join(' ');
  };

  return (
    <div className="flex flex-col h-screen w-full bg-[#fdfcf8] relative overflow-hidden organic-grid mobile-container">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-stone-200 pt-safe">
        <div className="flex items-center gap-4">
          {canGoBack ? (
            <button 
              onClick={onBack}
              className="w-10 h-10 bg-stone-100 rounded-2xl active:scale-95 transition-all flex items-center justify-center border border-stone-200 hover:border-emerald-600/50"
            >
              <ChevronLeft className="w-5 h-5 text-emerald-800" />
            </button>
          ) : (
            <button 
              onClick={() => setDrawerOpen(true)}
              className="w-10 h-10 bg-stone-100 rounded-2xl active:scale-95 transition-all flex items-center justify-center border border-stone-200 hover:border-emerald-600/50"
            >
              <Menu className="w-5 h-5 text-emerald-800" />
            </button>
          )}
          <div className="flex flex-col">
            <h1 className="text-xl font-bold text-stone-900 leading-none font-serif tracking-tight">
              {getViewTitle()}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
              <span className="text-[10px] font-medium text-emerald-700/70 uppercase tracking-widest">Connected</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => setView(AppView.PROFILE)}
            className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all overflow-hidden border-2 ${currentView === AppView.PROFILE ? 'border-emerald-600 bg-emerald-50' : 'border-stone-200 bg-stone-100'}`}
          >
            <User className={`w-5 h-5 ${currentView === AppView.PROFILE ? 'text-emerald-700' : 'text-stone-400'}`} />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto w-full no-scrollbar scroll-smooth pb-24">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentView}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
            className="w-full h-full"
          >
             {children}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t border-stone-200 px-6 py-3 pb-safe z-50 flex items-center justify-between max-w-[480px] mx-auto">
        <NavButton 
          icon={Home} 
          label="Home" 
          active={currentView === AppView.DASHBOARD} 
          onClick={() => setView(AppView.DASHBOARD)} 
        />
        <NavButton 
          icon={LayoutGrid} 
          label="Tools" 
          active={currentView === AppView.TOOLS_HUB} 
          onClick={() => setView(AppView.TOOLS_HUB)} 
        />
        <NavButton 
          icon={User} 
          label="Profile" 
          active={currentView === AppView.PROFILE} 
          onClick={() => setView(AppView.PROFILE)} 
        />
        <NavButton 
          icon={SettingsIcon} 
          label="Settings" 
          active={currentView === AppView.SETTINGS} 
          onClick={() => setView(AppView.SETTINGS)} 
        />
      </nav>

      {/* Side Drawer */}
      <div className={`fixed inset-0 z-[60] transition-all duration-500 max-w-[480px] mx-auto ${drawerOpen ? 'opacity-100 visible' : 'opacity-0 invisible pointer-events-none'}`}>
        <div className="absolute inset-0 bg-stone-900/40 backdrop-blur-sm" onClick={() => setDrawerOpen(false)} />
        <aside className={`
          absolute top-0 left-0 bottom-0 w-[85%] max-w-[320px] bg-white shadow-2xl transition-transform duration-500 cubic-bezier(0.16, 1, 0.3, 1) flex flex-col overflow-hidden
          ${drawerOpen ? 'translate-x-0' : '-translate-x-full'}
        `}>
          <div className="p-10 bg-emerald-50 border-b border-emerald-100 relative overflow-hidden shrink-0">
            <div className="absolute -top-20 -right-20 w-64 h-64 bg-emerald-200/20 rounded-full blur-[80px]"></div>
            <div className="w-20 h-20 bg-white rounded-[2rem] shadow-sm flex items-center justify-center mb-6 border border-emerald-100 relative z-10">
              <User className="w-10 h-10 text-emerald-700" />
            </div>
            <h2 className="text-2xl font-bold text-stone-900 leading-tight mb-1 font-serif relative z-10">
              {localStorage.getItem('agri_farmer_name') || 'Farmer Profile'}
            </h2>
            <div className="flex items-center gap-2 relative z-10">
              <div className="w-2 h-2 rounded-full bg-emerald-600" />
              <p className="text-xs text-emerald-800 font-medium">
                {localStorage.getItem('agri_farm_name') || 'My Farm'}
              </p>
            </div>
          </div>
          
          <div className="p-8 space-y-2 flex-1 overflow-y-auto no-scrollbar">
            <div className="text-[10px] font-bold text-stone-400 uppercase tracking-[0.2em] mb-4 ml-4">Menu</div>
            <DrawerItem icon={Home} label="Home" onClick={() => { setView(AppView.DASHBOARD); setDrawerOpen(false); }} active={currentView === AppView.DASHBOARD} />
            <DrawerItem icon={LayoutGrid} label="Tools" onClick={() => { setView(AppView.TOOLS_HUB); setDrawerOpen(false); }} active={currentView === AppView.TOOLS_HUB} />
            <DrawerItem icon={User} label="My Profile" onClick={() => { setView(AppView.PROFILE); setDrawerOpen(false); }} active={currentView === AppView.PROFILE} />
            <DrawerItem icon={SettingsIcon} label="Settings" onClick={() => { setView(AppView.SETTINGS); setDrawerOpen(false); }} active={currentView === AppView.SETTINGS} />
            
            <div className="my-8 h-px bg-stone-100 mx-4" />
            
            <button 
              onClick={() => { onLogout(); setDrawerOpen(false); }}
              className="w-full flex items-center gap-4 px-6 py-4 text-stone-500 font-medium text-sm rounded-2xl hover:bg-rose-50 hover:text-rose-600 transition-all group"
            >
              <LogOut className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              <span>Logout</span>
            </button>
          </div>

          <div className="p-8 bg-stone-50 border-t border-stone-100 shrink-0">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white rounded-xl border border-stone-200 shadow-sm">
                <Code className="w-4 h-4 text-emerald-700" />
              </div>
              <div>
                <p className="text-[8px] font-bold text-stone-400 uppercase tracking-[0.2em]">Application</p>
                <p className="text-[10px] font-bold text-stone-600 font-mono">BHARAT-KISAN v2.5</p>
              </div>
            </div>
            <div className="mt-6 pt-4 border-t border-stone-200/50">
              <p className="text-[7px] font-bold text-stone-400 uppercase tracking-[0.2em] text-center leading-relaxed">
                App Designed and Developed by<br/>
                <span className="text-emerald-700/60">Nexus Creative Studio</span>
              </p>
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
    className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all group ${active ? 'bg-emerald-600 text-white shadow-md shadow-emerald-200' : 'text-stone-600 hover:bg-emerald-50 hover:text-emerald-700'}`}
  >
    <Icon className={`w-5 h-5 ${active ? 'text-white' : 'text-stone-400 group-hover:text-emerald-600'}`} />
    <span className="font-bold text-sm">{label}</span>
  </button>
);

const NavButton: React.FC<{ icon: any, label: string, active: boolean, onClick: () => void }> = ({ icon: Icon, label, active, onClick }) => (
  <motion.button 
    whileTap={{ scale: 0.9 }}
    onClick={onClick}
    className="flex flex-col items-center gap-1 relative group py-1 px-3 outline-none"
  >
    <div className={`
      p-2 rounded-xl transition-all duration-300
      ${active ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200 -translate-y-1' : 'text-stone-400 group-hover:text-emerald-600'}
    `}>
      <Icon className="w-5 h-5" />
    </div>
    <span className={`text-[9px] font-bold uppercase tracking-widest transition-colors ${active ? 'text-emerald-700' : 'text-stone-400'}`}>
      {label}
    </span>
    {active && (
      <motion.div 
        layoutId="nav-indicator"
        className="absolute -bottom-1 w-1 h-1 bg-emerald-600 rounded-full"
      />
    )}
  </motion.button>
);

export default Layout;