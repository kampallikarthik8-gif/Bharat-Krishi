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
import LandMarker from './components/LandMarker';
import ToolsHub from './components/ToolsHub';
import WeatherHub from './components/WeatherHub';
import InventoryHub from './components/InventoryHub';
import FinanceLedger from './components/FinanceLedger';
import SubsidyTracker from './components/SubsidyTracker';
import SeasonalPlanner from './components/SeasonalPlanner';
import InputAdvisor from './components/InputAdvisor';

import AgriAcademy from './components/AgriAcademy';
import EquipmentMarket from './components/EquipmentMarket';
import SmartAlerts from './components/SmartAlerts';
import FeatureTour from './components/FeatureTour';

const App: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = React.useState<boolean>(() => {
    return localStorage.getItem('agri_session_active') === 'true';
  });
  const [authMode, setAuthMode] = React.useState<'login' | 'register'>('login');
  const [currentView, setCurrentView] = React.useState<AppView>(AppView.DASHBOARD);
  const [viewHistory, setViewHistory] = React.useState<AppView[]>([]);
  const [language, setLanguage] = React.useState<string>(() => {
    return localStorage.getItem('agri_language') || 'English';
  });
  const [showTour, setShowTour] = React.useState<boolean>(() => {
    return localStorage.getItem('agri_tour_completed') !== 'true';
  });

  const handleOnboardingComplete = (name: string, farm: string, phone: string, lang: string, state: string, district: string, mandal: string, revenue: string) => {
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
    setIsLoggedIn(true);
    setShowTour(true);
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

  const handleLogout = () => {
    localStorage.setItem('agri_session_active', 'false');
    setIsLoggedIn(false);
    setAuthMode('login');
  };

  const handleLogin = (phone: string) => {
    const storedPhone = localStorage.getItem('agri_farmer_phone');
    const hasRegistered = !!localStorage.getItem('agri_farmer_name');

    if (hasRegistered && (!storedPhone || storedPhone === phone)) {
      localStorage.setItem('agri_session_active', 'true');
      setIsLoggedIn(true);
    } else {
      setAuthMode('register');
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
        return <FieldMap language={language} />;
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
      case AppView.LAND_MARKER:
        return <LandMarker language={language} onBack={handleBack} />;
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
      default:
        return <Dashboard setView={navigateTo} />;
    }
  };

  const handleTourComplete = () => {
    localStorage.setItem('agri_tour_completed', 'true');
    setShowTour(false);
  };

  if (!isLoggedIn) {
    if (authMode === 'login') {
      return <Login onLogin={handleLogin} onSwitchToRegister={() => setAuthMode('register')} />;
    }
    return <Onboarding onComplete={handleOnboardingComplete} onBackToLogin={() => setAuthMode('login')} />;
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
        {isLoggedIn && showTour && (
          <FeatureTour onComplete={handleTourComplete} />
        )}
      </AnimatePresence>
    </>
  );
};

export default App;