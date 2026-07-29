import React from 'react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
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
  FileText,
  LogOut,
  Users,
  UserPlus,
  ShieldAlert,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Geolocation } from '@capacitor/geolocation';
import { useFirebase } from '../src/components/FirebaseProvider';
import { useDialogs } from '../src/components/DialogProvider';
import { db } from '../src/firebase';
import { collection, query, onSnapshot, doc, updateDoc, addDoc, deleteDoc, setDoc } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../src/utils/firestoreErrorHandler';
import { TeamMember } from '../types';

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
  const { user, profile, logout, activeFarmId, updateProfileLocal } = useFirebase();
  const { confirm, alert, prompt } = useDialogs();

  const [settings, setSettings] = React.useState({
    farmName: profile?.farmName || 'Sunrise Acres',
    units: profile?.units || 'Metric',
    notifications: profile?.notifications ?? true,
    weatherAlerts: profile?.weatherAlerts ?? true,
    autoNightMode: profile?.autoNightMode ?? true,
    aiVoice: profile?.aiVoice || 'Zephyr',
    precisionMode: profile?.precisionMode || 'Balanced',
    scannerHD: profile?.scannerHD ?? false,
    kccId: profile?.kccId || '',
    pmKisanId: profile?.pmKisanId || ''
  });

  const [location, setLocation] = React.useState<string>(profile?.location || 'Awaiting GPS...');
  const [isLocating, setIsLocating] = React.useState(false);
  const [team, setTeam] = React.useState<TeamMember[]>([]);
  const [loadingTeam, setLoadingTeam] = React.useState(true);
  const [devMode, setDevMode] = React.useState(false);
  const tapCountRef = React.useRef(0);
  const tapTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  const handleVersionTap = () => {
    if (tapTimeoutRef.current) {
      clearTimeout(tapTimeoutRef.current);
    }

    tapCountRef.current += 1;
    
    if (tapCountRef.current >= 5) {
      setDevMode(!devMode);
      tapCountRef.current = 0;
      alert({
        title: 'Developer Mode',
        message: `Developer Mode ${!devMode ? 'Enabled' : 'Disabled'}. Advanced settings and diagnostics are now available.`
      });
    } else {
      tapTimeoutRef.current = setTimeout(() => {
        tapCountRef.current = 0;
      }, 2000);
    }
  };

  const becomeAdmin = async () => {
    if (!user || !activeFarmId) return;
    try {
      await updateDoc(doc(db, 'users', activeFarmId), { role: 'admin' });
      alert({
        title: 'Admin Access',
        message: 'You are now an Admin. Please restart the app or refresh to see changes to your dashboard permissions.'
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${activeFarmId}`);
    }
  };

  const WEATHER_API_KEY = import.meta.env.VITE_WEATHER_API_KEY;

  React.useEffect(() => {
    if (!user || !activeFarmId) return;

    const path = `users/${activeFarmId}/team`;
    const q = query(collection(db, path));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const members: TeamMember[] = [];
      snapshot.forEach((doc) => {
        members.push({ id: doc.id, ...doc.data() } as TeamMember);
      });
      setTeam(members);
      setLoadingTeam(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
      setLoadingTeam(false);
    });

    return () => unsubscribe();
  }, [user]);

  React.useEffect(() => {
    if (profile) {
      setSettings({
        farmName: profile.farmName || 'Sunrise Acres',
        units: profile.units || 'Metric',
        notifications: profile.notifications ?? true,
        weatherAlerts: profile.weatherAlerts ?? true,
        autoNightMode: profile.autoNightMode ?? true,
        aiVoice: profile.aiVoice || 'Zephyr',
        precisionMode: profile.precisionMode || 'Balanced',
        scannerHD: profile.scannerHD ?? false,
        kccId: profile.kccId || '',
        pmKisanId: profile.pmKisanId || ''
      });
      setLocation(profile.location || 'Awaiting GPS...');
    }
  }, [profile]);

  const detectLocation = async () => {
    setIsLocating(true);
    try {
      const pos = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true
      });
      
      const res = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&appid=${WEATHER_API_KEY}&units=metric`
      );
      const data = await res.json();
      const cityRegion = data.name && data.sys?.country ? `${data.name}, ${data.sys.country}` : `${pos.coords.latitude.toFixed(2)}, ${pos.coords.longitude.toFixed(2)}`;
      setLocation(cityRegion);
      updateProfileField('location', cityRegion);
    } catch (err) {
      console.error("Location detection failed", err);
      alert({
        title: 'GPS Error',
        message: 'GPS Access Denied or Location Error. Please ensure location services are active for this app.'
      });
    } finally {
      setIsLocating(false);
    }
  };

  const updateProfileField = (key: string, value: any) => {
    if (!user || !activeFarmId) return;
    updateProfileLocal({ [key]: value });
    const path = `users/${activeFarmId}`;
    try {
      updateDoc(doc(db, 'users', activeFarmId), { [key]: value }).catch((err) => {
        console.warn(`Background update warning for ${key}:`, err);
      });
    } catch (error) {
      console.error(`Error updating profile field ${key}:`, error);
    }
  };

  const updateSetting = (key: string, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    updateProfileField(key, value);
  };

  const handleLanguageChange = (val: string) => {
    setLanguage(val);
    updateProfileField('language', val);
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

    autoTable(doc, {
      startY: 40,
      head: [['Setting/Data Key', 'Value (Preview)']],
      body: data,
      theme: 'striped',
      headStyles: { fillColor: [255, 180, 0], textColor: [0, 0, 0] }
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
    confirm({
      title: 'Danger Zone',
      message: 'This will permanently delete your field logbook and all saved farm data. Continue?',
      type: 'danger',
      onConfirm: () => {
        localStorage.clear();
        window.location.reload();
      }
    });
  };

  const addTeamMember = async () => {
    if (!user || !activeFarmId) return;
    
    prompt({
      title: 'Add Team Member',
      message: 'Enter Team Member Name:',
      onConfirm: (name) => {
        if (!name) return;
        prompt({
          title: 'Add Team Member',
          message: 'Enter Team Member Email:',
          onConfirm: (email) => {
            if (!email) return;
            prompt({
              title: 'Add Team Member',
              message: 'Enter Role (Manager/Worker):',
              defaultValue: 'Worker',
              onConfirm: (role) => {
                if (!role) return;
                prompt({
                  title: 'Add Team Member',
                  message: 'Enter User ID (Optional - for secure access):',
                  onConfirm: (memberUid) => {
                    const memberId = memberUid || `temp_${Date.now()}`;
                    const path = `users/${activeFarmId}/team/${memberId}`;
                    try {
                      setDoc(doc(db, path), {
                        name,
                        email,
                        role: role.charAt(0).toUpperCase() + role.slice(1).toLowerCase(),
                        joinedAt: new Date().toISOString(),
                        status: memberUid ? 'Active' : 'Pending',
                        uid: memberUid || null
                      });
                    } catch (error) {
                      handleFirestoreError(error, OperationType.CREATE, path);
                    }
                  }
                });
              }
            });
          }
        });
      }
    });
  };

  const removeTeamMember = async (memberId: string) => {
    if (!user || !activeFarmId) return;
    
    confirm({
      title: 'Remove Member',
      message: 'Are you sure you want to remove this team member? They will lose access to the shared farm data?',
      type: 'danger',
      onConfirm: async () => {
        const path = `users/${activeFarmId}/team/${memberId}`;
        try {
          await deleteDoc(doc(db, path));
        } catch (error) {
          handleFirestoreError(error, OperationType.DELETE, path);
        }
      }
    });
  };

  const updateMemberRole = async (memberId: string, currentRole: string) => {
    if (!user || !activeFarmId) return;
    prompt({
      title: 'Update Role',
      message: 'Enter New Role (Manager/Worker):',
      defaultValue: currentRole,
      onConfirm: (newRole) => {
        if (newRole && newRole !== currentRole) {
          const path = `users/${activeFarmId}/team/${memberId}`;
          try {
            updateDoc(doc(db, path), { 
              role: newRole.charAt(0).toUpperCase() + newRole.slice(1).toLowerCase() 
            });
          } catch (error) {
            handleFirestoreError(error, OperationType.UPDATE, path);
          }
        }
      }
    });
  };

  return (
    <div className="space-y-8 pb-32 animate-in fade-in duration-700 bg-[var(--m3-background)] min-h-screen">
      {/* Dynamic System Header */}
      <section className="px-6 pt-16 pb-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--m3-primary)]/5 rounded-full blur-[100px] -mr-32 -mt-32" />
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex flex-col gap-8 relative z-10"
        >
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-[var(--m3-primary)] animate-pulse" />
              <span className="text-[10px] font-mono text-[var(--m3-primary)] font-bold uppercase tracking-[0.4em]">Integrated Settings.</span>
            </div>
            <h2 className="text-5xl font-black text-white tracking-tighter font-sans uppercase leading-none">
              System <span className="text-[var(--m3-primary)]">Control.</span>
            </h2>
            <div className="flex items-center gap-4">
              <p className="text-[10px] font-mono text-white/30 uppercase tracking-[0.2em]">Agri-OS v2.5 Deployment</p>
              <div className="h-px w-12 bg-white/10" />
              <div className="flex items-center gap-1.5">
                <Signal className="w-3 h-3 text-[var(--m3-primary)]" />
                <span className="text-[10px] font-mono text-[var(--m3-primary)] uppercase tracking-widest">Active</span>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      <div className="px-6 space-y-12">
        {/* Farm Infrastructure */}
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-6"
        >
          <SectionHeader title="Farm Infrastructure" subtitle="Base Coordinates & Spatial identity" />
          <div className="bg-[var(--m3-surface-container-low)] rounded-[2.5rem] p-8 border border-white/5 space-y-8 shadow-2xl relative group overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity">
              <Landmark className="w-32 h-32 rotate-12" />
            </div>
            
            <div className="space-y-6 relative z-10">
              <div className="group/input">
                <label className="text-[9px] font-mono text-white/30 uppercase tracking-[0.3em] mb-3 block pl-2 group-focus-within/input:text-[var(--m3-primary)] transition-colors">Registered Farm Codename</label>
                <input 
                  value={settings.farmName}
                  onChange={e => updateSetting('farmName', e.target.value)}
                  className="w-full bg-white/[0.03] border border-white/10 p-5 rounded-2xl outline-none font-mono text-sm text-white focus:border-[var(--m3-primary)]/50 transition-all placeholder:text-white/10"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="group/input">
                  <label className="text-[9px] font-mono text-white/30 uppercase tracking-[0.3em] mb-3 block pl-2">Territory Size</label>
                  <div className="relative">
                    <input 
                      type="number"
                      value={profile?.farmSize || 0}
                      onChange={e => updateSetting('farmSize', parseFloat(e.target.value) || 0)}
                      className="w-full bg-white/[0.03] border border-white/10 p-5 rounded-2xl outline-none font-mono text-sm text-white focus:border-[var(--m3-primary)]/50 transition-all"
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[9px] font-black text-[var(--m3-primary)] uppercase tracking-widest bg-[var(--m3-primary)]/10 px-3 py-1.5 rounded-lg border border-[var(--m3-primary)]/20">
                      {profile?.units === 'Imperial' ? 'ACRES' : 'HECTARES'}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col justify-end">
                   <button 
                    onClick={detectLocation}
                    disabled={isLocating}
                    className="w-full bg-white/[0.03] border border-white/10 p-5 rounded-2xl flex items-center justify-center gap-3 active:scale-95 transition-all group/loc"
                   >
                     {isLocating ? <Loader2 className="w-4 h-4 animate-spin text-[var(--m3-primary)]" /> : <Navigation className="w-4 h-4 text-white/40 group-hover/loc:text-[var(--m3-primary)] transition-colors" />}
                     <span className="text-[9px] font-black text-white/40 uppercase tracking-widest group-hover/loc:text-white transition-colors">Relocate</span>
                   </button>
                </div>
              </div>

              <div className="p-6 bg-white/[0.02] border border-white/5 rounded-3xl flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-[var(--m3-primary)]/10 rounded-2xl text-[var(--m3-primary)] border border-[var(--m3-primary)]/20">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[9px] font-mono text-white/30 uppercase tracking-widest mb-1">Current Telemetry</p>
                    <p className="text-xs font-black text-white uppercase tracking-wider">{location}</p>
                  </div>
                </div>
                <button 
                  onClick={() => {
                    prompt({
                      title: 'Manual Coordination',
                      message: 'Enter system location manually:',
                      defaultValue: location,
                      onConfirm: (loc) => loc && (setLocation(loc), updateProfileField('location', loc))
                    });
                  }}
                  className="text-[9px] font-black text-[var(--m3-primary)] uppercase tracking-widest hover:underline"
                >
                  Override
                </button>
              </div>
            </div>
          </div>
        </motion.section>

        {/* Global Operations */}
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-6"
        >
          <SectionHeader title="Global Operations" subtitle="Interface & Locale Configuration" />
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {LANGUAGES.slice(0, 6).map(lang => {
              const isActive = language === lang.name;
              return (
                <button
                  key={lang.name}
                  onClick={() => handleLanguageChange(lang.name)}
                  className={`relative p-6 rounded-[2rem] border transition-all duration-500 text-left overflow-hidden active:scale-95 ${
                    isActive 
                      ? 'bg-[var(--m3-primary)] border-[var(--m3-primary)] text-black shadow-2xl scale-[1.02]' 
                      : 'bg-white/[0.03] border-white/10 text-white/40 hover:border-white/20'
                  }`}
                >
                  <div className={`text-[9px] font-mono mb-2 uppercase tracking-[0.2em] ${isActive ? 'text-black/60' : 'text-white/20'}`}>
                    {lang.name}
                  </div>
                  <div className="text-base font-black tracking-tighter uppercase font-sans">
                    {lang.label.split(' ')[1] || lang.label}
                  </div>
                  {isActive && (
                    <div className="absolute top-4 right-4 animate-pulse">
                      <div className="w-1.5 h-1.5 bg-black rounded-full" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </motion.section>

        {/* Intelligence & Protocols */}
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-6"
        >
          <SectionHeader title="Intelligence Protocols" subtitle="AI Inference & Awareness Tuning" />
          <div className="bg-[var(--m3-surface-container-low)] rounded-[2.5rem] border border-white/5 divide-y divide-white/5 overflow-hidden">
            <ToggleItem 
              icon={<Mic2 />}
              label="AgriVoice Personality"
              enabled={true} 
              onToggle={() => {}}
              rightElement={
                <select 
                  value={settings.aiVoice}
                  onChange={(e) => updateSetting('aiVoice', e.target.value)}
                  className="bg-transparent border-none text-[10px] font-mono text-[var(--m3-primary)] font-bold uppercase tracking-widest outline-none cursor-pointer text-right appearance-none"
                >
                  {AI_VOICES.map(voice => <option key={voice.name} value={voice.name} className="bg-stone-900">{voice.name}</option>)}
                </select>
              }
            />
            <ToggleItem 
              icon={<Cpu />}
              label="Inference Precision"
              enabled={true}
              onToggle={() => {}}
              rightElement={
                <select 
                  value={settings.precisionMode}
                  onChange={(e) => updateSetting('precisionMode', e.target.value)}
                  className="bg-transparent border-none text-[10px] font-mono text-[var(--m3-primary)] font-bold uppercase tracking-widest outline-none cursor-pointer text-right appearance-none"
                >
                  <option className="bg-stone-900">Standard</option>
                  <option className="bg-stone-900">High</option>
                </select>
              }
            />
            <ToggleItem 
              icon={<Camera />}
              label="HD Diagnostic Scanning"
              enabled={settings.scannerHD}
              onToggle={(val) => updateSetting('scannerHD', val)}
            />
            <ToggleItem 
              icon={<Bell />}
              label="Push Link Protocols"
              enabled={settings.notifications}
              onToggle={(val) => updateSetting('notifications', val)}
            />
             <ToggleItem 
              icon={<Zap />}
              label="Weather Guard Monitoring"
              enabled={settings.weatherAlerts}
              onToggle={(val) => updateSetting('weatherAlerts', val)}
            />
          </div>
        </motion.section>

        {/* Personnel & Logistics */}
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="space-y-6"
        >
          <div className="flex items-center justify-between">
            <SectionHeader title="Personnel & Logistics" subtitle="Shared Network access" />
            <button 
              onClick={addTeamMember}
              className="p-3 bg-[var(--m3-primary)] text-black rounded-2xl shadow-xl active:scale-90 transition-all border border-black/10"
            >
              <UserPlus className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-4">
            {team.length > 0 ? team.map(member => (
              <div key={member.id} className="bg-white/[0.03] p-6 rounded-[2rem] border border-white/5 flex items-center justify-between group">
                <div className="flex items-center gap-5">
                  <div className="w-12 h-12 rounded-2xl bg-white/[0.05] border border-white/10 flex items-center justify-center text-xs font-mono font-black text-[var(--m3-primary)]">
                    {member.name.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-white uppercase tracking-widest leading-none mb-1">{member.name}</h4>
                    <div className="flex items-center gap-3">
                      <span className="text-[9px] font-mono text-[var(--m3-primary)] font-bold uppercase tracking-widest">{member.role}</span>
                      <div className="w-1 h-1 rounded-full bg-white/10" />
                      <span className="text-[9px] font-mono text-white/30 uppercase tracking-widest">{member.email}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                  <button onClick={() => updateMemberRole(member.id, member.role)} className="p-3 bg-white/5 rounded-xl hover:text-[var(--m3-primary)] transition-colors"><ShieldCheck className="w-4 h-4" /></button>
                  <button onClick={() => removeTeamMember(member.id)} className="p-3 bg-white/5 rounded-xl hover:text-rose-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            )) : (
              <div className="py-12 border border-dashed border-white/10 rounded-[2.5rem] flex flex-col items-center gap-4 text-center">
                <Users className="w-12 h-12 text-white/5" />
                <p className="text-[9px] font-mono text-white/20 uppercase tracking-[0.4em]">Zero Personnel Detected</p>
              </div>
            )}
          </div>
        </motion.section>

        {/* System & Compliance */}
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="space-y-6"
        >
          <SectionHeader title="System & Compliance" subtitle="Federal records & Authentication" />
          <div className="bg-[var(--m3-surface-container-low)] rounded-[2.5rem] border border-white/5 divide-y divide-white/5 overflow-hidden">
            <SettingItem 
              icon={<CreditCard />}
              label="Kisan Credit Card (KCC)"
              value={settings.kccId || 'LINK SYSTEM'}
              onClick={() => prompt({ title: 'KCC Sync', message: 'Enter unit KCC identity code:', defaultValue: settings.kccId, onConfirm: (id) => id !== null && updateSetting('kccId', id) })}
            />
            <SettingItem 
              icon={<Landmark />}
              label="PM-KISAN Registry"
              value={settings.pmKisanId || 'LINK SYSTEM'}
              onClick={() => prompt({ title: 'PM-KISAN Sync', message: 'Enter PM-KISAN registration code:', defaultValue: settings.pmKisanId, onConfirm: (id) => id !== null && updateSetting('pmKisanId', id) })}
            />
            <SettingItem 
              icon={<ShieldCheck />}
              label="Privacy Policy"
              sub="Data usage & OAuth security"
              onClick={() => { window.location.hash = '#privacy'; }}
            />
            <SettingItem 
              icon={<FileText />}
              label="Terms of Service"
              sub="Legal terms & agronomic disclaimer"
              onClick={() => { window.location.hash = '#terms'; }}
            />
            <SettingItem 
              icon={<Download />}
              label="Export System Archive"
              sub="Generate PDF/JSON telemetry"
              onClick={exportPDF}
            />
            <SettingItem 
              icon={<LogOut />}
              label="Terminate Session"
              sub="De-authenticate existing link"
              onClick={logout}
              className="text-rose-500"
            />
             <SettingItem 
              icon={<Trash2 />}
              label="Wipe Local Matrix"
              sub="Purge all cached data protocols"
              onClick={clearData}
              className="text-rose-600"
            />
          </div>
        </motion.section>

        {/* Build Telemetry */}
        <section className="py-20 flex flex-col items-center gap-8">
          <div className="h-px w-24 bg-white/10" />
          <div className="flex flex-col items-center gap-3">
            <div className="flex items-center gap-2 px-6 py-2 bg-white/[0.03] border border-white/10 rounded-full">
              <Database className="w-3 h-3 text-[var(--m3-primary)]" />
              <span className="text-[9px] font-mono text-white/40 uppercase tracking-[0.3em]">
                Static RAM: {(JSON.stringify(localStorage).length / 1024).toFixed(1)} KB Committed
              </span>
            </div>
            <p 
              onClick={handleVersionTap}
              className="text-[9px] font-mono text-white/20 uppercase tracking-[0.5em] cursor-pointer hover:text-[var(--m3-primary)] transition-colors"
            >
              Bharat-Agri-v2.5.2-Platinum
            </p>
          </div>

          {devMode && (
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="w-full bg-emerald-500/10 border border-emerald-500/20 p-8 rounded-[2.5rem] space-y-6"
            >
              <div className="flex items-center gap-3">
                <ShieldAlert className="w-5 h-5 text-emerald-500" />
                <h4 className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.4em]">Administrative Access Enabled</h4>
              </div>
              <div className="grid grid-cols-1 gap-3">
                <button onClick={becomeAdmin} className="w-full py-4 bg-emerald-500 text-black font-black text-[10px] uppercase tracking-[0.3em] rounded-2xl active:scale-95 transition-all">Elevate To Admin</button>
                <div className="bg-black/40 p-5 rounded-2xl font-mono text-[9px] text-white/40 space-y-1 border border-white/5">
                  <p>UID: {user?.uid}</p>
                  <p>FID: {activeFarmId}</p>
                  <p>ROLE: {profile?.role || 'FARMER'}</p>
                </div>
              </div>
            </motion.div>
          )}
        </section>
      </div>
    </div>
  );
};

const SectionHeader: React.FC<{ title: string, subtitle?: string }> = ({ title, subtitle }) => (
  <div className="flex flex-col gap-1 mb-2 ml-2">
    <div className="flex items-center gap-3">
      <div className="w-1 h-3 bg-[var(--m3-primary)] rounded-full" />
      <h3 className="text-[11px] font-black text-white uppercase tracking-[0.3em] leading-none">
        {title}
      </h3>
    </div>
    {subtitle && <p className="text-[9px] font-mono text-white/20 uppercase tracking-widest pl-4">{subtitle}</p>}
  </div>
);

const SettingItem: React.FC<{ icon: React.ReactNode, label: string, value?: string, sub?: string, onClick?: () => void, className?: string }> = ({ icon, label, value, sub, onClick, className }) => (
  <button 
    onClick={onClick}
    className="w-full flex items-center justify-between p-8 active:bg-white/[0.03] transition-all group relative"
  >
    <div className="flex items-center gap-5 text-left relative z-10">
      <div className={`p-4 bg-white/[0.03] rounded-2xl border border-white/5 text-white/40 group-hover:text-[var(--m3-primary)] group-hover:border-[var(--m3-primary)]/20 transition-all ${className}`}>
        {React.cloneElement(icon as React.ReactElement<any>, { className: 'w-6 h-6' })}
      </div>
      <div>
        <p className={`text-sm font-black uppercase tracking-widest transition-colors ${className || 'text-white'}`}>{label}</p>
        {sub && <p className="text-[9px] font-mono text-white/20 uppercase tracking-widest mt-1">{sub}</p>}
      </div>
    </div>
    <div className="flex items-center gap-4 relative z-10">
      {value && <span className="text-[10px] font-bold text-[var(--m3-primary)] uppercase tracking-widest">{value}</span>}
      <ChevronRight className="w-5 h-5 text-white/10 group-hover:text-[var(--m3-primary)] transition-colors" />
    </div>
  </button>
);

const ToggleItem: React.FC<{ icon: React.ReactNode, label: string, enabled: boolean, onToggle: (val: boolean) => void, rightElement?: React.ReactNode }> = ({ icon, label, enabled, onToggle, rightElement }) => (
  <div className="flex items-center justify-between p-8 group">
    <div className="flex items-center gap-5">
      <div className={`p-4 bg-white/[0.03] rounded-2xl border border-white/5 text-white/40 group-hover:text-[var(--m3-primary)] group-hover:border-[var(--m3-primary)]/20 transition-all`}>
        {React.cloneElement(icon as React.ReactElement<any>, { className: 'w-6 h-6' })}
      </div>
      <p className="text-sm font-black text-white uppercase tracking-widest">{label}</p>
    </div>
    <div className="flex items-center gap-6">
      {rightElement}
      <button 
        onClick={() => onToggle(!enabled)}
        className="relative w-14 h-8 rounded-full transition-all duration-500 overflow-hidden border border-white/10 shadow-inner group/toggle"
      >
        <div className={`absolute inset-0 transition-opacity duration-500 ${enabled ? 'bg-[var(--m3-primary)] opacity-100' : 'bg-white/5 opacity-0'}`} />
        <div className={`absolute top-1.5 w-5 h-5 rounded-full transition-all duration-500 shadow-2xl ${enabled ? 'right-1.5 bg-black' : 'left-1.5 bg-white/20'}`} />
      </button>
    </div>
  </div>
);


export default Settings;