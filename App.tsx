import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AppView } from './types';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import DiseaseScanner from './components/DiseaseScanner';
import MarketPrices from './components/MarketPrices';
import CropAdvisor from './components/CropAdvisor';
import ChatBot from './components/ChatBot';
import VoiceAssistant from './components/VoiceAssistant';
import FarmJournal from './components/FarmJournal';
import VisualGallery from './components/VisualGallery';
import SoilLab from './components/SoilLab';
import YieldPredictor from './components/YieldPredictor';
import AgriNews from './components/AgriNews';
import IrrigationHub from './components/IrrigationHub';
import FieldMap from './components/FieldMap';
import SprayingAdvisor from './components/SprayingAdvisor';
import Settings from './components/Settings';
import Profile from './components/Profile';
import HarvestScheduler from './components/HarvestScheduler';
import LivestockAssistant from './components/LivestockAssistant';
import SustainabilityHub from './components/SustainabilityHub';
import HelpFeedback from './components/HelpFeedback';
import TaskManager from './components/TaskManager';
import Onboarding from './components/Onboarding';
import Login from './components/Login';
import ToolsHub from './components/ToolsHub';
import WeatherHub from './components/WeatherHub';
import InventoryHub from './components/InventoryHub';
import FinanceLedger from './components/FinanceLedger';
import SubsidyTracker from './components/SubsidyTracker';
import SeasonalPlanner from './components/SeasonalPlanner';
import InputAdvisor from './components/InputAdvisor';
import CarbonCreditTracker from './components/CarbonCreditTracker';
import EquipmentRental from './components/EquipmentRental';
import CropHealthMonitor from './components/CropHealthMonitor';
import SplashScreen from './components/SplashScreen';
import AdminPanel from './components/AdminPanel';

import AgriAcademy from './components/AgriAcademy';
import EquipmentMarket from './components/EquipmentMarket';
import SmartAlerts from './components/SmartAlerts';
import FeatureTour from './components/FeatureTour';
import CropRotationAdvisor from './components/CropRotationAdvisor';

import { useFirebase } from './src/components/FirebaseProvider';
import { auth, db } from './src/firebase';
import { signOut } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { Loader2 } from 'lucide-react';

const App: React.FC = () => {
  const { user, profile, loading, memberships, activeFarmId, setActiveFarmId } = useFirebase();
  const [currentView, setCurrentView] = React.useState<AppView>(AppView.DASHBOARD);
  const [viewHistory, setViewHistory] = React.useState<AppView[]>([]);
  const [language, setLanguage] = React.useState<string>(() => {
    return localStorage.getItem('agri_language') || 'English';
  });
  const [showTour, setShowTour] = React.useState<boolean>(() => {
    return localStorage.getItem('agri_tour_completed') !== 'true';
  });
  const [showSplash, setShowSplash] = React.useState(true);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  // Auto-switch to first membership if no personal profile
  React.useEffect(() => {
    if (!loading && !profile && memberships.length > 0 && activeFarmId === user?.uid) {
      setActiveFarmId(memberships[0].farmId);
    }
  }, [loading, profile, memberships, activeFarmId, user]);

  React.useEffect(() => {
    if (profile) {
      // Sync to localStorage for components that still use it
      localStorage.setItem('agri_farmer_name', profile.name);
      localStorage.setItem('agri_farm_name', profile.farmName);
      localStorage.setItem('agri_farmer_phone', profile.phone || '');
      localStorage.setItem('agri_language', profile.language || 'English');
      localStorage.setItem('agri_state', profile.state || '');
      localStorage.setItem('agri_district', profile.district || '');
      localStorage.setItem('agri_mandal', profile.mandal || '');
      localStorage.setItem('agri_revenue_village', profile.revenueVillage || '');
      localStorage.setItem('agri_soil_type', profile.soilType || '');
      localStorage.setItem('agri_units', profile.units || 'Metric');
      setLanguage(profile.language || 'English');
    }
  }, [profile]);

  const handleOnboardingComplete = async (name: string, farm: string, phone: string, lang: string, state: string, district: string, mandal: string, revenue: string, farmSize: string) => {
    if (!user) return;

    const profileData = {
      name,
      farmName: farm,
      phone,
      email: user.email,
      language: lang,
      state,
      district,
      mandal,
      revenueVillage: revenue,
      farmSize: parseFloat(farmSize) || 0,
      role: 'farmer',
      createdAt: new Date().toISOString(),
      soilType: 'Loamy', // Default
      units: 'Metric', // Default
      onboardingComplete: true
    };

    try {
      await setDoc(doc(db, 'users', user.uid), profileData);
      
      // Sync to localStorage
      localStorage.setItem('agri_farmer_name', name);
      localStorage.setItem('agri_farm_name', farm);
      localStorage.setItem('agri_farmer_phone', phone);
      localStorage.setItem('agri_language', lang);
      localStorage.setItem('agri_state', state);
      localStorage.setItem('agri_district', district);
      localStorage.setItem('agri_mandal', mandal);
      localStorage.setItem('agri_revenue_village', revenue);
      localStorage.setItem('agri_session_active', 'true');
      
      setLanguage(lang);
      setShowTour(true);
    } catch (error) {
      console.error("Error saving profile:", error);
    }
  };

  const navigateTo = (view: AppView) => {
    if (view !== currentView) {
      setViewHistory(prev => [...prev, currentView]);
      setCurrentView(view);
    }
  };

  const handleBack = () => {
    if (viewHistory.length > 0) {
      const prevView = viewHistory[viewHistory.length - 1];
      setViewHistory(prev => prev.slice(0, -1));
      setCurrentView(prevView);
    } else {
      setCurrentView(AppView.DASHBOARD);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      localStorage.setItem('agri_session_active', 'false');
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const renderView = () => {
    switch (currentView) {
      case AppView.DASHBOARD:
        return <Dashboard setView={navigateTo} />;
      case AppView.TOOLS_HUB:
        return <ToolsHub setView={navigateTo} />;
      case AppView.DISEASE_SCANNER:
        return <DiseaseScanner language={language} />;
      case AppView.MARKET_PRICES:
        return <MarketPrices language={language} />;
      case AppView.CROP_ADVISOR:
        return <CropAdvisor language={language} />;
      case AppView.COMMUNITY_CHAT:
        return <ChatBot language={language} />;
      case AppView.VOICE_ASSISTANT:
        return <VoiceAssistant language={language} />;
      case AppView.FARM_JOURNAL:
        return <FarmJournal language={language} />;
      case AppView.PEST_LIBRARY:
        return <VisualGallery language={language} />;
      case AppView.SOIL_LAB:
        return <SoilLab language={language} />;
      case AppView.YIELD_PREDICTOR:
        return <YieldPredictor language={language} />;
      case AppView.AGRI_NEWS:
        return <AgriNews language={language} />;
      case AppView.IRRIGATION_HUB:
        return <IrrigationHub language={language} />;
      case AppView.FIELD_MAP:
        return <FieldMap language={language} onBack={handleBack} />;
      case AppView.SPRAYING_ADVISOR:
        return <SprayingAdvisor language={language} />;
      case AppView.SETTINGS:
        return <Settings language={language} setLanguage={setLanguage} />;
      case AppView.PROFILE:
        return <Profile onLogout={handleLogout} onNavigate={navigateTo} />;
      case AppView.HARVEST_SCHEDULER:
        return <HarvestScheduler language={language} />;
      case AppView.LIVESTOCK_ASSISTANT:
        return <LivestockAssistant language={language} />;
      case AppView.SUSTAINABILITY_HUB:
        return <SustainabilityHub language={language} />;
      case AppView.HELP_FEEDBACK:
        return <HelpFeedback />;
      case AppView.TASK_MANAGER:
        return <TaskManager language={language} />;
      case AppView.WEATHER_HUB:
        return <WeatherHub language={language} />;
      case AppView.INVENTORY_HUB:
        return <InventoryHub />;
      case AppView.FINANCE_LEDGER:
        return <FinanceLedger />;
      case AppView.SUBSIDY_TRACKER:
        return <SubsidyTracker language={language} />;
      case AppView.SEASONAL_PLANNER:
        return <SeasonalPlanner language={language} />;
      case AppView.INPUT_ADVISOR:
        return <InputAdvisor language={language} />;
      case AppView.EQUIPMENT_MARKET:
        return <EquipmentMarket />;
      case AppView.AGRI_ACADEMY:
        return <AgriAcademy />;
      case AppView.SMART_ALERTS:
        return <SmartAlerts />;
      case AppView.CROP_ROTATION_ADVISOR:
        return <CropRotationAdvisor language={language} />;
      case AppView.CARBON_CREDIT_TRACKER:
        return <CarbonCreditTracker />;
      case AppView.EQUIPMENT_RENTAL:
        return <EquipmentRental />;
      case AppView.CROP_HEALTH_MONITOR:
        return <CropHealthMonitor />;
      case AppView.ADMIN_PANEL:
        return <AdminPanel />;
      default:
        return <Dashboard setView={navigateTo} />;
    }
  };

  const handleTourComplete = () => {
    localStorage.setItem('agri_tour_completed', 'true');
    setShowTour(false);
  };

  if (showSplash) {
    return <SplashScreen />;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <Loader2 className="w-10 h-10 animate-spin text-amber-500" />
      </div>
    );
  }

  if (!user) {
    return <Login onLogin={() => {}} onSwitchToRegister={() => {}} />;
  }

  if (!profile && memberships.length === 0) {
    return <Onboarding onComplete={handleOnboardingComplete} onBackToLogin={handleLogout} />;
  }

  return (
    <>
      <Layout 
        currentView={currentView} 
        setView={navigateTo} 
        onLogout={handleLogout}
        onBack={handleBack}
        canGoBack={viewHistory.length > 0}
      >
        {renderView()}
      </Layout>
      <AnimatePresence>
        {user && showTour && (
          <FeatureTour onComplete={handleTourComplete} />
        )}
      </AnimatePresence>
    </>
  );
};

export default App;
