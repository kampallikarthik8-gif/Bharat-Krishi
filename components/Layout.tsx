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
  LogOut,
  Shield
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
    <div className="flex flex-col h-screen w-full bg-black relative overflow-hidden mobile-container">
      {/* Top App Bar */}
      <header className="flex items-center justify-between px-4 py-3 sticky top-0 z-40 bg-black/80 backdrop-blur-md pt-safe border-b border-amber-500/5">
        <div className="flex items-center gap-2">
          {canGoBack && !isMainView ? (
            <button 
              onClick={handleBackClick}
              className="w-12 h-12 rounded-full active:bg-stone-900 transition-all flex items-center justify-center border border-stone-800"
            >
              <ChevronLeft className="w-6 h-6 text-white" />
            </button>
          ) : (
            <button 
              onClick={handleMenuClick}
              className="w-12 h-12 rounded-full active:bg-stone-900 transition-all flex items-center justify-center border border-stone-800"
            >
              <Menu className="w-6 h-6 text-white" />
            </button>
          )}
          <h1 className="text-xl font-black text-white uppercase tracking-tighter">
            {getViewTitle()}
          </h1>
        </div>

        <div className="flex items-center gap-1">
          <button 
            onClick={() => handleNavClick(AppView.PROFILE)}
            className="w-12 h-12 rounded-full flex items-center justify-center active:bg-stone-900 transition-all overflow-hidden border border-stone-800"
          >
            <User className="w-6 h-6 text-stone-500" />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto w-full no-scrollbar scroll-smooth pb-24">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentView}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.02 }}
            transition={{ duration: 0.3, ease: [0.2, 0, 0, 1] }}
            className="w-full h-full"
          >
             {children}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Bottom Navigation Bar (M3) */}
      <nav className="fixed bottom-0 left-0 right-0 bg-stone-950 px-2 py-3 pb-safe z-50 flex items-center justify-around max-w-[480px] mx-auto border-t border-amber-500/5">
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

      {/* Navigation Drawer (M3) */}
      <div className={`fixed inset-0 z-[60] transition-all duration-300 max-w-[480px] mx-auto ${drawerOpen ? 'opacity-100 visible' : 'opacity-0 invisible pointer-events-none'}`}>
        <div className="absolute inset-0 bg-black/30" onClick={() => setDrawerOpen(false)} />
          <aside className={`
          absolute top-0 left-0 bottom-0 w-[85%] max-w-[360px] bg-black transition-transform duration-300 ease-[0.2,0,0,1] flex flex-col overflow-hidden rounded-r-3xl border-r border-amber-500/10
          ${drawerOpen ? 'translate-x-0' : '-translate-x-full'}
        `}>
          <div className="p-6 pt-12">
            <div className="w-16 h-16 bg-stone-950 rounded-2xl flex items-center justify-center mb-6 overflow-hidden border border-amber-500/20">
              <img 
                src="https://image2url.com/r2/default/images/1773645978799-968d61a0-3ceb-48da-814f-71deb5b97303.png" 
                alt="Logo" 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <h2 className="text-xl font-black text-white mb-1 uppercase tracking-tighter">
              {profile?.name || 'Farmer Profile'}
            </h2>
            <p className="text-[10px] font-bold text-amber-500/60 uppercase tracking-widest">
              {profile?.farmName || 'My Farm'}
            </p>
          </div>
          
          <div className="px-3 py-4 space-y-1 flex-1 overflow-y-auto no-scrollbar">
            <DrawerItem icon={Home} label="Home" onClick={() => { handleNavClick(AppView.DASHBOARD); setDrawerOpen(false); }} active={currentView === AppView.DASHBOARD} />
            <DrawerItem icon={LayoutGrid} label="Tools" onClick={() => { handleNavClick(AppView.TOOLS_HUB); setDrawerOpen(false); }} active={currentView === AppView.TOOLS_HUB} />
            <DrawerItem icon={User} label="My Profile" onClick={() => { handleNavClick(AppView.PROFILE); setDrawerOpen(false); }} active={currentView === AppView.PROFILE} />
            <DrawerItem icon={SettingsIcon} label="Settings" onClick={() => { handleNavClick(AppView.SETTINGS); setDrawerOpen(false); }} active={currentView === AppView.SETTINGS} />
            
            {profile?.role === 'admin' && (
              <DrawerItem icon={Shield} label="Admin Panel" onClick={() => { handleNavClick(AppView.ADMIN_PANEL); setDrawerOpen(false); }} active={currentView === AppView.ADMIN_PANEL} />
            )}
            
            <div className="my-4 h-px bg-amber-500/10 mx-4" />
            
            <button 
              onClick={() => { triggerHaptic(); onLogout(); setDrawerOpen(false); }}
              className="w-full flex items-center gap-3 px-4 py-3 text-stone-500 font-black text-[10px] uppercase tracking-widest rounded-full hover:bg-amber-500/5 transition-all"
            >
              <LogOut className="w-6 h-6" />
              <span>Logout</span>
            </button>
          </div>

          <div className="p-6 text-center">
            <p 
              onClick={handleVersionTap}
              className="text-[10px] font-black text-stone-500 uppercase tracking-widest opacity-60 cursor-pointer select-none"
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
    className={`w-full flex items-center gap-3 px-4 py-3 rounded-full transition-all ${active ? 'bg-amber-500/10 text-amber-500' : 'text-stone-400 hover:bg-amber-500/5'}`}
  >
    <Icon className="w-6 h-6" />
    <span className="font-medium text-sm">{label}</span>
  </button>
);

const NavButton: React.FC<{ icon: any, label: string, active: boolean, onClick: () => void }> = ({ icon: Icon, label, active, onClick }) => (
  <button 
    onClick={() => { triggerHaptic(); onClick(); }}
    className="flex flex-col items-center gap-1 min-w-[64px] group"
  >
    <div className={`
      relative px-5 py-1 rounded-full transition-all duration-200 flex items-center justify-center
      ${active ? 'bg-amber-500/10 text-amber-500' : 'text-stone-500 hover:bg-amber-500/5'}
    `}>
      <Icon className="w-6 h-6" />
    </div>
    <span className={`text-[11px] font-black uppercase tracking-widest transition-colors ${active ? 'text-amber-500' : 'text-stone-600'}`}>
      {label}
    </span>
  </button>
);

export default Layout;