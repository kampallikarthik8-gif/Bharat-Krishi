import React from 'react';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { 
  User, 
  MapPin, 
  Bell, 
  Globe, 
  Trash2, 
  ShieldCheck, 
  ChevronRight,
  Database,
  Moon,
  Info,
  Navigation,
  Loader2,
  Signal,
  Languages as LangIcon,
  Mic2,
  Cpu,
  Download,
  CreditCard,
  Landmark,
  Zap,
  Camera,
  Layers,
  FileJson,
  FileText
} from 'lucide-react';

const WEATHER_API_KEY = "42d5aa17c7f2866670e62b4c77cb3d32";

const LANGUAGES = [
  { name: "English", label: "English" },
  { name: "Hindi", label: "Hindi (हिंदी)" },
  { name: "Bengali", label: "Bengali (বাংলা)" },
  { name: "Telugu", label: "Telugu (తెలుగు)" },
  { name: "Marathi", label: "Marathi (मराठी)" },
  { name: "Tamil", label: "Tamil (தமிழ்)" },
  { name: "Gujarati", label: "Gujarati (ગુજરાતી)" },
  { name: "Kannada", label: "Kannada (କନ୍ନଡ)" },
  { name: "Malayalam", label: "Malayalam (മലയാളം)" },
  { name: "Punjabi", label: "Punjabi (ਪੰਜਾਬੀ)" },
  { name: "Odia", label: "Odia (ଓଡ଼ିଆ)" },
  { name: "Assamese", label: "Assamese (ଅସମୀୟା)" },
  { name: "Urdu", label: "Urdu (اردو)" }
];

const AI_VOICES = [
  { name: 'Zephyr', label: 'Neutral/Professional' },
  { name: 'Puck', label: 'Friendly/Energetic' },
  { name: 'Charon', label: 'Deep/Calm' },
  { name: 'Kore', label: 'Soft/Helpful' },
  { name: 'Fenrir', label: 'Authoritative' }
];

interface SettingsProps {
  language: string;
  setLanguage: (lang: string) => void;
}

const Settings: React.FC<SettingsProps> = ({ language, setLanguage }) => {
  const loadBool = (key: string, fallback: boolean): boolean => {
    const val = localStorage.getItem(key);
    if (val === null) return fallback;
    return val === 'true';
  };

  const [settings, setSettings] = React.useState({
    farmName: localStorage.getItem('agri_farm_name') || 'Sunrise Acres',
    units: localStorage.getItem('agri_units') || 'Metric',
    notifications: loadBool('agri_notifications', true),
    weatherAlerts: loadBool('agri_weather_alerts', true),
    autoNightMode: loadBool('agri_auto_night_mode', true),
    aiVoice: localStorage.getItem('agri_ai_voice') || 'Zephyr',
    precisionMode: localStorage.getItem('agri_precision_mode') || 'Balanced',
    scannerHD: loadBool('agri_scanner_hd', false),
    kccId: localStorage.getItem('agri_kcc_id') || '',
    pmKisanId: localStorage.getItem('agri_pm_kisan_id') || ''
  });

  const [location, setLocation] = React.useState<string>(localStorage.getItem('agri_farm_location') || 'Awaiting GPS...');
  const [isLocating, setIsLocating] = React.useState(false);

  const detectLocation = () => {
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const res = await fetch(
            `https://api.openweathermap.org/data/2.5/weather?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&appid=${WEATHER_API_KEY}&units=metric`
          );
          const data = await res.json();
          const cityRegion = data.name && data.sys?.country ? `${data.name}, ${data.sys.country}` : `${pos.coords.latitude.toFixed(2)}, ${pos.coords.longitude.toFixed(2)}`;
          setLocation(cityRegion);
          localStorage.setItem('agri_farm_location', cityRegion);
        } catch (err) {
          console.error("Location detection failed", err);
        } finally {
          setIsLocating(false);
        }
      },
      (err) => {
        setIsLocating(false);
        alert("GPS Access Denied. Using fallback.");
      },
      { enableHighAccuracy: true }
    );
  };

  React.useEffect(() => {
    if (!localStorage.getItem('agri_farm_location')) {
      detectLocation();
    }
  }, []);

  const updateSetting = (key: string, value: any) => {
    const storageKey = `agri_${key.replace(/([A-Z])/g, "_$1").toLowerCase()}`;
    setSettings(prev => ({ ...prev, [key]: value }));
    localStorage.setItem(storageKey, value.toString());
  };

  const handleLanguageChange = (val: string) => {
    localStorage.setItem('agri_language', val);
    setLanguage(val);
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text('Bharat Kisan - Farm Archive Report', 14, 22);
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 30);

    const data: [string, string][] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('agri')) {
        const val = localStorage.getItem(key) || '';
        data.push([key.replace('agri_', '').replace(/_/g, ' ').toUpperCase(), val.length > 50 ? val.substring(0, 50) + '...' : val]);
      }
    }

    (doc as any).autoTable({
      startY: 40,
      head: [['Setting/Data Key', 'Value (Preview)']],
      body: data,
      theme: 'striped',
      headStyles: { fillColor: [45, 90, 39] }
    });

    doc.save(`BharatKisan_Full_Export_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const exportData = () => {
    const data: Record<string, any> = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('agri')) {
        try {
          data[key] = JSON.parse(localStorage.getItem(key) || '');
        } catch {
          data[key] = localStorage.getItem(key);
        }
      }
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `AgriAssist_Farm_Export_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const clearData = () => {
    if (confirm("This will permanently delete your field logbook and all saved farm data. Continue?")) {
      localStorage.clear();
      window.location.reload();
    }
  };

  return (
    <div className="space-y-6 pb-24 animate-in fade-in slide-in-from-bottom-6">
      <p className="px-4 text-[11px] font-bold text-stone-400 uppercase tracking-widest">Farm Identity</p>
      
      <div className="bg-white rounded-[2rem] p-4 shadow-sm border border-slate-100 divide-y divide-slate-50">
        <SettingItem 
          icon={<User className="text-emerald-600" />}
          label="Farm Name"
          value={settings.farmName}
          onClick={() => {
            const name = prompt("Enter Farm Name", settings.farmName);
            if (name) updateSetting('farmName', name);
          }}
        />
        <div className="w-full flex items-center justify-between p-4 active:bg-slate-50 transition-colors group">
          <div className="flex items-center gap-4 text-left">
            <div className="p-3 bg-slate-50 rounded-2xl group-hover:bg-emerald-50 transition-colors shadow-inner">
              <MapPin className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-800">Primary Region</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className={`w-1.5 h-1.5 rounded-full ${isLocating ? 'bg-emerald-400 animate-pulse' : 'bg-emerald-50 shadow-[0_0_5px_rgba(16,185,129,0.5)]'}`} />
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{isLocating ? 'Syncing...' : 'Connected to GPS'}</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex flex-col items-end">
              <span className="text-xs font-black text-emerald-600 truncate max-w-[120px]">{location}</span>
              <button 
                onClick={() => {
                  const loc = prompt("Enter Location Manually", location);
                  if (loc) {
                    setLocation(loc);
                    localStorage.setItem('agri_farm_location', loc);
                  }
                }}
                className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1 hover:text-emerald-600"
              >
                Edit Manually
              </button>
            </div>
            <button 
              onClick={detectLocation}
              disabled={isLocating}
              className="p-2 bg-slate-50 rounded-xl hover:bg-slate-100 text-emerald-600 disabled:opacity-50"
            >
              {isLocating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Navigation className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      <p className="px-4 text-[11px] font-bold text-stone-400 uppercase tracking-widest mt-8">AI & Intelligence Tuning</p>
      <div className="bg-white rounded-[2rem] p-4 shadow-sm border border-slate-100 divide-y divide-slate-50">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-slate-50 rounded-2xl shadow-inner">
              <Mic2 className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-800">AgriVoice Profile</p>
              <p className="text-[10px] text-slate-400 font-medium italic">Gemini Voice Personality</p>
            </div>
          </div>
          <select 
            value={settings.aiVoice}
            onChange={(e) => updateSetting('aiVoice', e.target.value)}
            className="bg-slate-50 border-none rounded-xl py-2 px-4 text-xs font-bold text-emerald-700 outline-none shadow-inner"
          >
            {AI_VOICES.map(voice => (
              <option key={voice.name} value={voice.name}>{voice.label}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-slate-50 rounded-2xl shadow-inner">
              <Cpu className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-800">Intelligence Strategy</p>
              <p className="text-[10px] text-slate-400 font-medium italic">Inference Depth vs Speed</p>
            </div>
          </div>
          <select 
            value={settings.precisionMode}
            onChange={(e) => updateSetting('precisionMode', e.target.value)}
            className="bg-slate-50 border-none rounded-xl py-2 px-4 text-xs font-bold text-emerald-700 outline-none shadow-inner"
          >
            <option>Standard</option>
            <option>Balanced</option>
            <option>High Accuracy</option>
          </select>
        </div>

        <ToggleItem 
          icon={<Camera className="text-amber-600" />}
          label="HD Diagnostic Scanning"
          enabled={settings.scannerHD}
          onToggle={(val) => updateSetting('scannerHD', val)}
        />
      </div>

      <p className="px-4 text-[11px] font-bold text-stone-400 uppercase tracking-widest mt-8">Government & Schemes</p>
      <div className="bg-white rounded-[2rem] p-4 shadow-sm border border-stone-100 divide-y divide-stone-50">
        <SettingItem 
          icon={<CreditCard className="text-indigo-600" />}
          label="Kisan Credit Card (KCC)"
          value={settings.kccId || 'Link ID'}
          onClick={() => {
            const id = prompt("Enter KCC ID (16 digits)", settings.kccId);
            if (id !== null) updateSetting('kccId', id);
          }}
        />
        <SettingItem 
          icon={<Landmark className="text-emerald-600" />}
          label="PM-KISAN ID"
          value={settings.pmKisanId || 'Link ID'}
          onClick={() => {
            const id = prompt("Enter PM-KISAN Registration ID", settings.pmKisanId);
            if (id !== null) updateSetting('pmKisanId', id);
          }}
        />
      </div>

      <p className="px-4 text-[11px] font-bold text-stone-400 uppercase tracking-widest mt-8">Language & Dialect</p>
      <div className="px-4 mt-4">
        <div className="grid grid-cols-2 gap-3">
          {LANGUAGES.map(lang => {
            const isActive = language === lang.name;
            return (
              <button
                key={lang.name}
                onClick={() => handleLanguageChange(lang.name)}
                className={`flex flex-col items-start p-4 rounded-3xl border transition-all relative overflow-hidden group ${
                  isActive 
                    ? 'bg-slate-950 border-slate-950 text-white shadow-xl scale-[1.02]' 
                    : 'bg-white border-slate-100 text-slate-600 hover:border-emerald-200'
                }`}
              >
                {isActive && (
                  <div className="absolute top-0 right-0 p-3">
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                  </div>
                )}
                <span className={`text-[10px] font-black uppercase tracking-widest mb-1 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`}>
                  {lang.name}
                </span>
                <span className="text-sm font-black tracking-tight">
                  {lang.label.split(' ')[1] || lang.label}
                </span>
                {isActive && (
                  <div className="mt-3 flex items-center gap-1.5">
                    <div className="w-4 h-px bg-emerald-500/50" />
                    <span className="text-[8px] font-black uppercase tracking-tighter text-emerald-500/80">Active Profile</span>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <p className="px-4 text-[11px] font-bold text-stone-400 uppercase tracking-widest mt-8">System Preferences</p>
      <div className="bg-white rounded-[2rem] p-4 shadow-sm border border-stone-100 divide-y divide-stone-50">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-slate-50 rounded-2xl shadow-inner">
              <Globe className="w-5 h-5 text-slate-500" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-800">Measurement Units</p>
              <p className="text-[10px] text-slate-400 font-medium italic">Metric (C°, Ha) vs Imperial (F°, Ac)</p>
            </div>
          </div>
          <select 
            value={settings.units}
            onChange={(e) => updateSetting('units', e.target.value)}
            className="bg-slate-50 border-none rounded-xl py-2 px-4 text-xs font-bold text-emerald-700 outline-none shadow-inner"
          >
            <option>Metric</option>
            <option>Imperial</option>
          </select>
        </div>

        <ToggleItem 
          icon={<Bell className="text-blue-500" />}
          label="Push Notifications"
          enabled={settings.notifications}
          onToggle={(val) => updateSetting('notifications', val)}
        />
        <ToggleItem 
          icon={<Bell className="text-amber-500" />}
          label="Weather Alerts"
          enabled={settings.weatherAlerts}
          onToggle={(val) => updateSetting('weatherAlerts', val)}
        />
        <ToggleItem 
          icon={<Moon className="text-indigo-400" />}
          label="Auto Night Mode"
          enabled={settings.autoNightMode}
          onToggle={(val) => updateSetting('autoNightMode', val)}
        />
      </div>

      <p className="px-4 text-[11px] font-bold text-stone-400 uppercase tracking-widest mt-8">Data Management</p>
      <div className="bg-white rounded-[2rem] p-4 shadow-sm border border-stone-100 divide-y divide-stone-50">
        <button 
          onClick={exportPDF}
          className="w-full flex items-center justify-between p-4 active:bg-stone-50 transition-colors group text-left"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-stone-50 rounded-2xl group-hover:bg-emerald-50 transition-colors shadow-inner">
              <FileText className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm font-bold text-stone-800">Export Farm Report (PDF)</p>
              <p className="text-[10px] text-stone-400 font-medium">Download professional PDF report</p>
            </div>
          </div>
          <Download className="w-5 h-5 text-stone-300" />
        </button>

        <button 
          onClick={exportData}
          className="w-full flex items-center justify-between p-4 active:bg-stone-50 transition-colors group text-left"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-stone-50 rounded-2xl group-hover:bg-emerald-50 transition-colors shadow-inner">
              <FileJson className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm font-bold text-stone-800">Export Farm Archive</p>
              <p className="text-[10px] text-stone-400 font-medium">Download full logbook in JSON</p>
            </div>
          </div>
          <Download className="w-5 h-5 text-stone-300" />
        </button>

        <button 
          onClick={clearData}
          className="w-full flex items-center gap-4 p-4 text-rose-600 hover:bg-rose-50 transition-colors text-left"
        >
          <div className="p-3 bg-rose-50 rounded-2xl shadow-inner">
            <Trash2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-sm font-bold">Wipe Local Database</p>
            <p className="text-[10px] opacity-60 font-medium">Permanently clear all cached farm data</p>
          </div>
        </button>
      </div>

      <div className="text-center py-6">
        <div className="inline-flex items-center gap-2 bg-emerald-50 px-4 py-2 rounded-full border border-emerald-100">
          <Database className="w-3 h-3 text-emerald-600" />
          <span className="text-[10px] font-black uppercase text-emerald-600 tracking-widest">
            Cache: {(JSON.stringify(localStorage).length / 1024).toFixed(1)} KB Used
          </span>
        </div>
        <p className="text-[9px] text-slate-400 mt-2 font-bold uppercase tracking-widest">Build Version: 2.5.2-Platinum</p>
      </div>
    </div>
  );
};

const SettingItem: React.FC<{ icon: React.ReactNode, label: string, value?: string, sub?: string, onClick?: () => void }> = ({ icon, label, value, sub, onClick }) => (
  <button 
    onClick={onClick}
    className="w-full flex items-center justify-between p-4 active:bg-slate-50 transition-colors group"
  >
    <div className="flex items-center gap-4 text-left">
      <div className="p-3 bg-slate-50 rounded-2xl group-hover:bg-white transition-colors shadow-inner">
        {React.cloneElement(icon as React.ReactElement<any>, { className: 'w-5 h-5' })}
      </div>
      <div>
        <p className="text-sm font-bold text-slate-800">{label}</p>
        {sub && <p className="text-[10px] text-slate-400 font-medium">{sub}</p>}
      </div>
    </div>
    <div className="flex items-center gap-2">
      {value && <span className="text-xs font-black text-emerald-600 truncate max-w-[120px]">{value}</span>}
      <ChevronRight className="w-4 h-4 text-slate-300" />
    </div>
  </button>
);

const ToggleItem: React.FC<{ icon: React.ReactNode, label: string, enabled: boolean, onToggle: (val: boolean) => void }> = ({ icon, label, enabled, onToggle }) => (
  <div className="flex items-center justify-between p-4">
    <div className="flex items-center gap-4">
      <div className="p-3 bg-slate-50 rounded-2xl shadow-inner">
        {React.cloneElement(icon as React.ReactElement<any>, { className: 'w-5 h-5' })}
      </div>
      <p className="text-sm font-bold text-slate-800">{label}</p>
    </div>
    <button 
      onClick={() => onToggle(!enabled)}
      className={`w-12 h-6 rounded-full p-1 transition-colors duration-300 ${enabled ? 'bg-emerald-600' : 'bg-slate-200'}`}
    >
      <div className={`w-4 h-4 bg-white rounded-full transition-transform duration-300 transform ${enabled ? 'translate-x-6' : 'translate-x-0'}`} />
    </button>
  </div>
);

export default Settings;