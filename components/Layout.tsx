import React from 'react';
import { AppView } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Home, 
  Menu, 
  User, 
  LayoutGrid,
  ChevronLeft,
  Settings as SettingsIcon,
  LogOut,
  Shield,
  Database,
  Users,
  ShoppingBag,
  FileText,
  Camera,
  Mic,
  BookPlus,
  TrendingUp,
  Sparkles
} from 'lucide-react';
import { useFirebase } from '../src/components/FirebaseProvider';
import { triggerHaptic, triggerSelectionHaptic } from '../src/utils/haptics';
import { StatusBar, Style } from '@capacitor/status-bar';
import { Capacitor } from '@capacitor/core';

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
  const { profile } = useFirebase();
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [showThumbBar, setShowThumbBar] = React.useState(true);
  const tapCountRef = React.useRef(0);
  const tapTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  const handleVersionTap = () => {
    if (tapTimeoutRef.current) {
      clearTimeout(tapTimeoutRef.current);
    }

    tapCountRef.current += 1;
    
    if (tapCountRef.current >= 5) {
      triggerHaptic();
      setView(AppView.ADMIN_PANEL);
      setDrawerOpen(false);
      tapCountRef.current = 0;
    } else {
      tapTimeoutRef.current = setTimeout(() => {
        tapCountRef.current = 0;
      }, 2000);
    }
  };

  React.useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      StatusBar.setStyle({ style: Style.Light });
      StatusBar.setBackgroundColor({ color: '#000000' });
    }
  }, []);

  const getViewTitle = () => {
    if (currentView === AppView.DASHBOARD) return 'Bharat Kisan';
    if (currentView === AppView.TOOLS_HUB) return 'Tools';
    if (currentView === AppView.PROFILE) return 'Profile';
    if (currentView === AppView.SETTINGS) return 'Settings';
    if (currentView === AppView.ADMIN_PANEL) return 'Admin Panel';
    return currentView.split('_').map(w => w.charAt(0) + w.slice(1).toLowerCase()).join(' ');
  };

  const isMainView = [AppView.DASHBOARD, AppView.TOOLS_HUB, AppView.PROFILE, AppView.SETTINGS].includes(currentView);

  const handleNavClick = (view: AppView) => {
    triggerSelectionHaptic();
    setView(view);
  };

  const handleBackClick = () => {
    triggerHaptic();
    if (onBack) onBack();
  };

  const handleMenuClick = () => {
    triggerHaptic();
    setDrawerOpen(true);
  };

  return (
    <div className="flex flex-col h-screen w-full bg-[#090e0c] text-stone-100 relative overflow-hidden mobile-container">
      {/* Top App Bar with glass backdrop and refined controls */}
      <header className="flex items-center justify-between px-4 py-3 sticky top-0 z-40 bg-[#090e0c]/85 backdrop-blur-xl pt-safe border-b border-emerald-500/10 shadow-sm">
        <div className="flex items-center gap-3">
          {canGoBack && !isMainView ? (
            <button 
              onClick={handleBackClick}
              className="px-3.5 py-2 rounded-xl active:scale-95 transition-all flex items-center gap-1.5 bg-emerald-950/40 border border-emerald-500/20 text-emerald-300 hover:text-white hover:bg-emerald-900/40 shadow-sm"
            >
              <ChevronLeft className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-bold uppercase tracking-wider">Back</span>
            </button>
          ) : (
            <button 
              onClick={handleMenuClick}
              className="px-3.5 py-2 rounded-xl active:scale-95 transition-all flex items-center gap-2 bg-emerald-950/40 border border-emerald-500/20 text-emerald-300 hover:text-white hover:bg-emerald-900/40 shadow-sm"
            >
              <Menu className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-bold uppercase tracking-wider">Menu</span>
            </button>
          )}
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <h1 className="text-base font-extrabold text-white tracking-tight truncate max-w-[170px]">
              {getViewTitle()}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={() => handleNavClick(AppView.PROFILE)}
            className="p-2 rounded-xl flex items-center gap-1.5 active:scale-95 transition-all bg-emerald-950/40 border border-emerald-500/20 text-emerald-300 hover:text-white hover:bg-emerald-900/40 shadow-sm"
          >
            <User className="w-4.5 h-4.5 text-emerald-400" />
            <span className="text-xs font-bold uppercase tracking-wider hidden sm:inline">Profile</span>
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
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="w-full h-full"
          >
             {children}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 bg-[#0c120e]/95 backdrop-blur-xl px-3 py-2.5 pb-safe z-50 flex items-center justify-around max-w-[480px] mx-auto border-t border-emerald-500/10 shadow-2xl">
        <NavButton 
          icon={Home} 
          label="Home" 
          active={currentView === AppView.DASHBOARD} 
          onClick={() => handleNavClick(AppView.DASHBOARD)} 
        />
        <NavButton 
          icon={LayoutGrid} 
          label="Tools" 
          active={currentView === AppView.TOOLS_HUB} 
          onClick={() => handleNavClick(AppView.TOOLS_HUB)} 
        />
        <NavButton 
          icon={User} 
          label="Profile" 
          active={currentView === AppView.PROFILE} 
          onClick={() => handleNavClick(AppView.PROFILE)} 
        />
        <NavButton 
          icon={SettingsIcon} 
          label="Settings" 
          active={currentView === AppView.SETTINGS} 
          onClick={() => handleNavClick(AppView.SETTINGS)} 
        />
      </nav>

      {/* Navigation Drawer */}
      <div className={`fixed inset-0 z-[60] transition-all duration-300 max-w-[480px] mx-auto ${drawerOpen ? 'opacity-100 visible' : 'opacity-0 invisible pointer-events-none'}`}>
        <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => setDrawerOpen(false)} />
          <aside className={`
          absolute top-0 left-0 bottom-0 w-[85%] max-w-[340px] bg-[#0c120e] transition-transform duration-300 ease-[0.16,1,0.3,1] flex flex-col overflow-hidden rounded-r-3xl border-r border-emerald-500/20 shadow-2xl
          ${drawerOpen ? 'translate-x-0' : '-translate-x-full'}
        `}>
          <div className="p-6 pt-10 bg-gradient-to-b from-emerald-950/40 to-transparent border-b border-emerald-500/10">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-14 h-14 bg-emerald-950 rounded-2xl flex items-center justify-center p-1 border border-emerald-500/30 shadow-lg glow-emerald">
                <img 
                  src="/icon-192.png" 
                  alt="Bharat Kisan Logo" 
                  className="w-full h-full object-cover rounded-xl"
                  onError={(e) => {
                    // Fallback to Icon if image missing
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
                <Sparkles className="w-7 h-7 text-emerald-400" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white tracking-tight">
                  {profile?.name || 'Farmer Profile'}
                </h2>
                <p className="text-xs font-semibold text-emerald-400/90 flex items-center gap-1 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  {profile?.farmName || 'My Farm'}
                </p>
              </div>
            </div>
            
            {profile?.mainCrops && profile.mainCrops.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {profile.mainCrops.map((crop: string) => (
                  <span key={crop} className="px-2.5 py-1 bg-emerald-900/30 text-emerald-300 border border-emerald-500/20 rounded-full text-[10px] font-bold">
                    🌾 {crop}
                  </span>
                ))}
              </div>
            )}
          </div>
          
          <div className="px-3 py-4 space-y-1 flex-1 overflow-y-auto no-scrollbar">
            <DrawerItem icon={Home} label="Home Dashboard" onClick={() => { handleNavClick(AppView.DASHBOARD); setDrawerOpen(false); }} active={currentView === AppView.DASHBOARD} />
            <DrawerItem icon={LayoutGrid} label="Tools & Analytics" onClick={() => { handleNavClick(AppView.TOOLS_HUB); setDrawerOpen(false); }} active={currentView === AppView.TOOLS_HUB} />
            <DrawerItem icon={User} label="My Profile" onClick={() => { handleNavClick(AppView.PROFILE); setDrawerOpen(false); }} active={currentView === AppView.PROFILE} />
            <DrawerItem icon={SettingsIcon} label="Settings" onClick={() => { handleNavClick(AppView.SETTINGS); setDrawerOpen(false); }} active={currentView === AppView.SETTINGS} />
            
            {profile?.role === 'admin' && (
              <DrawerItem icon={Shield} label="Admin Panel" onClick={() => { handleNavClick(AppView.ADMIN_PANEL); setDrawerOpen(false); }} active={currentView === AppView.ADMIN_PANEL} />
            )}
            
            <div className="my-4 h-px bg-emerald-500/10 mx-3" />
            <p className="px-4 py-1.5 text-[10px] font-extrabold text-emerald-400/60 uppercase tracking-widest">Dapp Ecosystem</p>
            <DrawerItem icon={Database} label="Produce Ledger" onClick={() => { handleNavClick(AppView.PRODUCE_LEDGER); setDrawerOpen(false); }} active={currentView === AppView.PRODUCE_LEDGER} />
            <DrawerItem icon={Users} label="Farmer DAO" onClick={() => { handleNavClick(AppView.COMMUNITY_DAO); setDrawerOpen(false); }} active={currentView === AppView.COMMUNITY_DAO} />
            <DrawerItem icon={ShoppingBag} label="P2P Market" onClick={() => { handleNavClick(AppView.P2P_MARKETPLACE); setDrawerOpen(false); }} active={currentView === AppView.P2P_MARKETPLACE} />
            <DrawerItem icon={FileText} label="Project Specs" onClick={() => { handleNavClick(AppView.PROJECT_DOCS); setDrawerOpen(false); }} active={currentView === AppView.PROJECT_DOCS} />

            <div className="my-4 h-px bg-emerald-500/10 mx-3" />
            
            <button 
              onClick={() => { triggerHaptic(); onLogout(); setDrawerOpen(false); }}
              className="w-full flex items-center gap-3 px-4 py-3 text-rose-400 font-bold text-xs uppercase tracking-wider rounded-xl hover:bg-rose-500/10 transition-all"
            >
              <LogOut className="w-4 h-4 text-rose-500" />
              <span>Logout</span>
            </button>
          </div>

          <div className="p-4 text-center border-t border-emerald-500/10">
            <p 
              onClick={handleVersionTap}
              className="text-xs font-mono font-semibold text-stone-500 cursor-pointer select-none"
            >
              Bharat Kisan v2.5
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
};

const DrawerItem: React.FC<{ icon: any, label: string, onClick: () => void, active: boolean }> = ({ icon: Icon, label, onClick, active }) => (
  <button
    onClick={() => { triggerHaptic(); onClick(); }}
    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${active ? 'bg-emerald-500/15 text-emerald-300 font-bold border border-emerald-500/20' : 'text-stone-300 hover:bg-emerald-500/5'}`}
  >
    <Icon className="w-4.5 h-4.5 text-emerald-400" />
    <span className="font-medium text-sm">{label}</span>
  </button>
);

const NavButton: React.FC<{ icon: any, label: string, active: boolean, onClick: () => void }> = ({ icon: Icon, label, active, onClick }) => (
  <button 
    onClick={() => { triggerHaptic(); onClick(); }}
    className="flex flex-col items-center gap-1 min-w-[60px] group py-1"
  >
    <div className={`
      relative px-4 py-1.5 rounded-full transition-all duration-200 flex items-center justify-center
      ${active ? 'bg-emerald-500/20 text-emerald-400 font-bold shadow-sm border border-emerald-500/30' : 'text-stone-400 hover:bg-emerald-500/5'}
    `}>
      <Icon className="w-5 h-5" />
    </div>
    <span className={`text-[11px] font-bold tracking-tight transition-colors ${active ? 'text-emerald-400' : 'text-stone-400'}`}>
      {label}
    </span>
  </button>
);

export default Layout;