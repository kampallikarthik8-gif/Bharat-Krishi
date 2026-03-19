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
  ShieldAlert
} from 'lucide-react';
import { Geolocation } from '@capacitor/geolocation';
import { useFirebase } from '../src/components/FirebaseProvider';
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
  const { user, profile, logout, activeFarmId } = useFirebase();

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
      alert(`Developer Mode ${!devMode ? 'Enabled' : 'Disabled'}`);
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
      alert("You are now an Admin. Please restart the app or refresh to see changes.");
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
      alert("GPS Access Denied or Location Error.");
    } finally {
      setIsLocating(false);
    }
  };

  const updateProfileField = async (key: string, value: any) => {
    if (!user || !activeFarmId) return;
    const path = `users/${activeFarmId}`;
    try {
      await updateDoc(doc(db, 'users', activeFarmId), { [key]: value });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
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

  const addTeamMember = async () => {
    if (!user || !activeFarmId) return;
    const name = prompt("Enter Team Member Name:");
    const email = prompt("Enter Team Member Email:");
    const role = prompt("Enter Role (Manager/Worker):", "Worker");
    const memberUid = prompt("Enter User ID (Optional - for secure access):");

    if (name && email && role) {
      const memberId = memberUid || `temp_${Date.now()}`;
      const path = `users/${activeFarmId}/team/${memberId}`;
      try {
        await setDoc(doc(db, path), {
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
  };

  const removeTeamMember = async (memberId: string) => {
    if (!user || !activeFarmId) return;
    if (confirm("Are you sure you want to remove this team member?")) {
      const path = `users/${activeFarmId}/team/${memberId}`;
      try {
        await deleteDoc(doc(db, path));
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, path);
      }
    }
  };

  const updateMemberRole = async (memberId: string, currentRole: string) => {
    if (!user) return;
    const newRole = prompt("Enter New Role (Manager/Worker):", currentRole);
    if (newRole && newRole !== currentRole) {
      const path = `users/${user.uid}/team/${memberId}`;
      try {
        await updateDoc(doc(db, path), { 
          role: newRole.charAt(0).toUpperCase() + newRole.slice(1).toLowerCase() 
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, path);
      }
    }
  };

  return (
    <div className="space-y-6 pb-24 bg-[var(--m3-background)] min-h-screen">
      {/* Header */}
      <div className="bg-[var(--m3-primary-container)] rounded-b-[2.5rem] p-8 pt-12 shadow-md relative overflow-hidden">
        <div className="relative z-10">
          <h2 className="text-3xl font-medium text-[var(--m3-on-primary-container)] mb-1 m3-headline-medium">Settings</h2>
          <p className="text-[var(--m3-on-primary-container)] opacity-70 text-xs font-medium uppercase tracking-widest">System Configuration</p>
        </div>
      </div>

      <div className="px-6 space-y-6">
        {/* Farm Identity Section */}
        <section className="space-y-3">
          <SectionHeader title="Farm Identity" />
      
          <div className="m3-card-filled p-4 bg-[var(--m3-surface-container-low)] divide-y divide-[var(--m3-outline-variant)]">
            <div className="py-4">
              <label className="text-[10px] font-medium text-[var(--m3-on-surface-variant)] uppercase tracking-wider mb-2 block">Farm Name</label>
              <input 
                value={settings.farmName}
                onChange={e => updateSetting('farmName', e.target.value)}
                className="w-full bg-[var(--m3-surface-container-high)] border-b border-[var(--m3-outline)] outline-none text-sm font-medium text-[var(--m3-on-surface)] p-3 rounded-t-lg focus:border-[var(--m3-primary)] transition-all"
              />
            </div>
            <div className="py-4">
              <label className="text-[10px] font-medium text-[var(--m3-on-surface-variant)] uppercase tracking-wider mb-2 block">Farm Land Size</label>
              <div className="flex gap-2">
                <input 
                  type="number"
                  value={profile?.farmSize || 0}
                  onChange={e => updateSetting('farmSize', parseFloat(e.target.value) || 0)}
                  className="flex-1 bg-[var(--m3-surface-container-high)] border-b border-[var(--m3-outline)] outline-none text-sm font-medium text-[var(--m3-on-surface)] p-3 rounded-t-lg focus:border-[var(--m3-primary)] transition-all"
                />
                <div className="bg-[var(--m3-surface-container-high)] px-4 flex items-center rounded-t-lg border-b border-[var(--m3-outline)] text-xs font-medium text-[var(--m3-on-surface-variant)]">
                  {profile?.units === 'Imperial' ? 'Acres' : 'Hectares'}
                </div>
              </div>
            </div>
            <div className="w-full flex items-center justify-between py-4">
              <div className="flex items-center gap-4 text-left">
                <div className="p-3 bg-[var(--m3-surface-container-high)] rounded-xl text-[var(--m3-on-surface-variant)]">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-medium text-[var(--m3-on-surface)]">Primary Region</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className={`w-1.5 h-1.5 rounded-full ${isLocating ? 'bg-[var(--m3-primary)] animate-pulse' : 'bg-[var(--m3-outline)]'}`} />
                    <p className="text-[10px] text-[var(--m3-on-surface-variant)] font-medium uppercase tracking-widest">{isLocating ? 'Syncing...' : 'Connected to GPS'}</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex flex-col items-end">
                  <span className="text-xs font-medium text-[var(--m3-primary)] truncate max-w-[120px]">{location}</span>
                  <button 
                    onClick={() => {
                      const loc = prompt("Enter Location Manually", location);
                      if (loc) {
                        setLocation(loc);
                        localStorage.setItem('agri_farm_location', loc);
                      }
                    }}
                    className="text-[8px] font-medium text-[var(--m3-on-surface-variant)] uppercase tracking-widest mt-1"
                  >
                    Edit Manually
                  </button>
                </div>
                <button 
                  onClick={detectLocation}
                  disabled={isLocating}
                  className="p-2 bg-[var(--m3-surface-container-high)] rounded-xl text-[var(--m3-primary)] disabled:opacity-50"
                >
                  {isLocating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Navigation className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Farm Team Section */}
        <section className="space-y-3">
          <SectionHeader title="Farm Team & Roles" />
        <div className="m3-card-filled p-4 bg-[var(--m3-surface-container-low)] space-y-4">
          <div className="flex items-center justify-between px-2 mb-2">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[var(--m3-surface-container-high)] rounded-xl text-[var(--m3-on-surface-variant)]">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-[var(--m3-on-surface)]">Team Management</p>
                <p className="text-[10px] text-[var(--m3-on-surface-variant)] font-medium">Manage access for workers & managers</p>
              </div>
            </div>
            <button 
              onClick={addTeamMember}
              className="p-2 bg-[var(--m3-primary)] text-[var(--m3-on-primary)] rounded-xl shadow-md active:scale-95 transition-all"
            >
              <UserPlus className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-3">
            {loadingTeam ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="w-6 h-6 animate-spin text-[var(--m3-primary)]/30" />
              </div>
            ) : team.length > 0 ? (
              team.map(member => (
                <div key={member.id} className="flex items-center justify-between p-4 bg-[var(--m3-surface-container-high)] rounded-2xl border border-[var(--m3-outline-variant)] group">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs ${
                      member.role === 'Manager' ? 'bg-[var(--m3-tertiary-container)] text-[var(--m3-on-tertiary-container)]' : 'bg-[var(--m3-secondary-container)] text-[var(--m3-on-secondary-container)]'
                    }`}>
                      {member.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[var(--m3-on-surface)]">{member.name}</p>
                      <div className="flex items-center gap-2">
                        <span className={`text-[9px] font-bold uppercase tracking-wider ${
                          member.role === 'Manager' ? 'text-[var(--m3-tertiary)]' : 'text-[var(--m3-secondary)]'
                        }`}>{member.role}</span>
                        <span className="text-[9px] text-[var(--m3-outline)]">•</span>
                        <span className="text-[9px] text-[var(--m3-on-surface-variant)] font-medium">{member.email}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => updateMemberRole(member.id, member.role)}
                      className="p-2 text-[var(--m3-on-surface-variant)] hover:text-[var(--m3-primary)] transition-colors"
                    >
                      <ShieldCheck className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => removeTeamMember(member.id)}
                      className="p-2 text-[var(--m3-on-surface-variant)] hover:text-[var(--m3-error)] transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 border-2 border-dashed border-[var(--m3-outline-variant)] rounded-2xl">
                <Users className="w-8 h-8 text-[var(--m3-outline)] mx-auto mb-2" />
                <p className="text-[10px] font-medium text-[var(--m3-on-surface-variant)] uppercase tracking-widest">No team members yet</p>
                <button 
                  onClick={addTeamMember}
                  className="mt-3 text-[10px] font-medium text-[var(--m3-primary)] uppercase tracking-widest bg-[var(--m3-primary-container)] px-4 py-2 rounded-full border border-[var(--m3-outline-variant)]"
                >
                  Add First Member
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

        {/* AI Section */}
        <section className="space-y-3">
          <SectionHeader title="AI & Intelligence Tuning" />
          <div className="m3-card-filled p-4 bg-[var(--m3-surface-container-low)] divide-y divide-[var(--m3-outline-variant)]">
            <div className="flex items-center justify-between py-4">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-[var(--m3-surface-container-high)] rounded-xl text-[var(--m3-on-surface-variant)]">
                  <Mic2 className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-medium text-[var(--m3-on-surface)]">AgriVoice Profile</p>
                  <p className="text-[10px] text-[var(--m3-on-surface-variant)] font-medium italic">Gemini Voice Personality</p>
                </div>
              </div>
              <select 
                value={settings.aiVoice}
                onChange={(e) => updateSetting('aiVoice', e.target.value)}
                className="bg-[var(--m3-surface-container-high)] border-none rounded-xl py-2 px-4 text-xs font-medium text-[var(--m3-primary)] outline-none"
              >
                {AI_VOICES.map(voice => (
                  <option key={voice.name} value={voice.name}>{voice.label}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-between py-4">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-[var(--m3-surface-container-high)] rounded-xl text-[var(--m3-on-surface-variant)]">
                  <Cpu className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-medium text-[var(--m3-on-surface)]">Intelligence Strategy</p>
                  <p className="text-[10px] text-[var(--m3-on-surface-variant)] font-medium italic">Inference Depth vs Speed</p>
                </div>
              </div>
              <select 
                value={settings.precisionMode}
                onChange={(e) => updateSetting('precisionMode', e.target.value)}
                className="bg-[var(--m3-surface-container-high)] border-none rounded-xl py-2 px-4 text-xs font-medium text-[var(--m3-primary)] outline-none"
              >
                <option>Standard</option>
                <option>Balanced</option>
                <option>High Accuracy</option>
              </select>
            </div>

            <ToggleItem 
              icon={<Camera />}
              label="HD Diagnostic Scanning"
              enabled={settings.scannerHD}
              onToggle={(val) => updateSetting('scannerHD', val)}
            />
          </div>
        </section>

        {/* Government Section */}
        <section className="space-y-3">
          <SectionHeader title="Government & Schemes" />
          <div className="m3-card-filled p-4 bg-[var(--m3-surface-container-low)] divide-y divide-[var(--m3-outline-variant)]">
            <SettingItem 
              icon={<CreditCard />}
              label="Kisan Credit Card (KCC)"
              value={settings.kccId || 'Link ID'}
              onClick={() => {
                const id = prompt("Enter KCC ID (16 digits)", settings.kccId);
                if (id !== null) updateSetting('kccId', id);
              }}
            />
            <SettingItem 
              icon={<Landmark />}
              label="PM-KISAN ID"
              value={settings.pmKisanId || 'Link ID'}
              onClick={() => {
                const id = prompt("Enter PM-KISAN Registration ID", settings.pmKisanId);
                if (id !== null) updateSetting('pmKisanId', id);
              }}
            />
          </div>
        </section>

        {/* Language Section */}
        <section className="space-y-3">
          <SectionHeader title="Language & Dialect" />
          <div className="grid grid-cols-2 gap-3">
            {LANGUAGES.map(lang => {
              const isActive = language === lang.name;
              return (
                <button
                  key={lang.name}
                  onClick={() => handleLanguageChange(lang.name)}
                  className={`flex flex-col items-start p-4 rounded-3xl border transition-all relative overflow-hidden group ${
                    isActive 
                      ? 'bg-[var(--m3-primary)] border-[var(--m3-primary)] text-[var(--m3-on-primary)] shadow-xl scale-[1.02]' 
                      : 'bg-[var(--m3-surface-container-low)] border-[var(--m3-outline-variant)] text-[var(--m3-on-surface)] hover:border-[var(--m3-primary)]'
                  }`}
                >
                  {isActive && (
                    <div className="absolute top-0 right-0 p-3">
                      <div className="w-1.5 h-1.5 bg-[var(--m3-on-primary)] rounded-full animate-pulse" />
                    </div>
                  )}
                  <span className={`text-[10px] font-medium uppercase tracking-widest mb-1 ${isActive ? 'text-[var(--m3-on-primary)]/70' : 'text-[var(--m3-on-surface-variant)]'}`}>
                    {lang.name}
                  </span>
                  <span className="text-sm font-medium tracking-tight">
                    {lang.label.split(' ')[1] || lang.label}
                  </span>
                  {isActive && (
                    <div className="mt-3 flex items-center gap-1.5">
                      <div className="w-4 h-px bg-[var(--m3-on-primary)]/50" />
                      <span className="text-[8px] font-medium uppercase tracking-tighter text-[var(--m3-on-primary)]/80">Active Profile</span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </section>

        {/* Preferences Section */}
        <section className="space-y-3">
          <SectionHeader title="System Preferences" />
          <div className="m3-card-filled p-4 bg-[var(--m3-surface-container-low)] divide-y divide-[var(--m3-outline-variant)]">
            <div className="flex items-center justify-between py-4">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-[var(--m3-surface-container-high)] rounded-xl text-[var(--m3-on-surface-variant)]">
                  <Globe className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-medium text-[var(--m3-on-surface)]">Measurement Units</p>
                  <p className="text-[10px] text-[var(--m3-on-surface-variant)] font-medium italic">Metric (C°, Ha) vs Imperial (F°, Ac)</p>
                </div>
              </div>
              <select 
                value={settings.units}
                onChange={(e) => updateSetting('units', e.target.value)}
                className="bg-[var(--m3-surface-container-high)] border-none rounded-xl py-2 px-4 text-xs font-medium text-[var(--m3-primary)] outline-none"
              >
                <option>Metric</option>
                <option>Imperial</option>
              </select>
            </div>

            <ToggleItem 
              icon={<Bell />}
              label="Push Notifications"
              enabled={settings.notifications}
              onToggle={(val) => updateSetting('notifications', val)}
            />
            <ToggleItem 
              icon={<Bell />}
              label="Weather Alerts"
              enabled={settings.weatherAlerts}
              onToggle={(val) => updateSetting('weatherAlerts', val)}
            />
            <ToggleItem 
              icon={<Moon />}
              label="Auto Night Mode"
              enabled={settings.autoNightMode}
              onToggle={(val) => updateSetting('autoNightMode', val)}
            />
          </div>
        </section>

        {/* Account Section */}
        <section className="space-y-3">
          <SectionHeader title="Account & Data" />
          <div className="m3-card-filled p-4 bg-[var(--m3-surface-container-low)] divide-y divide-[var(--m3-outline-variant)]">
            <button 
              onClick={exportPDF}
              className="w-full flex items-center justify-between py-4 active:bg-[var(--m3-surface-container-high)] transition-colors group text-left"
            >
              <div className="flex items-center gap-4">
                <div className="p-3 bg-[var(--m3-surface-container-high)] rounded-xl text-[var(--m3-on-surface-variant)]">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-medium text-[var(--m3-on-surface)]">Export Farm Report (PDF)</p>
                  <p className="text-[10px] text-[var(--m3-on-surface-variant)] font-medium">Download professional PDF report</p>
                </div>
              </div>
              <Download className="w-5 h-5 text-[var(--m3-outline)]" />
            </button>

            <button 
              onClick={logout}
              className="w-full flex items-center gap-4 py-4 text-[var(--m3-on-surface)] active:bg-[var(--m3-surface-container-high)] transition-colors text-left"
            >
              <div className="p-3 bg-[var(--m3-surface-container-high)] rounded-xl text-[var(--m3-on-surface-variant)]">
                <LogOut className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-medium">Sign Out</p>
                <p className="text-[10px] opacity-60 font-medium">Log out of your Bharat Kisan account</p>
              </div>
            </button>

            <button 
              onClick={() => {
                if (confirm("This will permanently delete your local cache. Your cloud data will remain safe. Continue?")) {
                  localStorage.clear();
                  window.location.reload();
                }
              }}
              className="w-full flex items-center gap-4 py-4 text-[var(--m3-error)] active:bg-[var(--m3-error-container)]/10 transition-colors text-left"
            >
              <div className="p-3 bg-[var(--m3-error-container)]/20 rounded-xl text-[var(--m3-error)]">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-medium">Clear Local Cache</p>
                <p className="text-[10px] opacity-60 font-medium">Reset local application state</p>
              </div>
            </button>
          </div>
        </section>

        {/* Developer Options */}
        {devMode && (
          <section className="space-y-3 animate-in slide-in-from-bottom-4 duration-500">
            <SectionHeader title="Developer Options" />
            <div className="m3-card-filled p-4 bg-[var(--m3-surface-container-low)] divide-y divide-[var(--m3-outline-variant)]">
              <button 
                onClick={becomeAdmin}
                className="w-full flex items-center gap-4 py-4 text-[var(--m3-primary)] active:bg-[var(--m3-primary-container)]/20 transition-colors text-left"
              >
                <div className="p-3 bg-[var(--m3-primary-container)]/30 rounded-xl text-[var(--m3-primary)]">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-medium">Become Administrator</p>
                  <p className="text-[10px] opacity-60 font-medium">Elevate your role to Admin (Testing only)</p>
                </div>
              </button>
              
              <div className="py-4">
                <p className="text-[10px] font-medium text-[var(--m3-on-surface-variant)] uppercase tracking-widest mb-2">Debug Info</p>
                <div className="bg-black/5 rounded-xl p-3 font-mono text-[10px] text-[var(--m3-on-surface-variant)] space-y-1">
                  <p>User ID: {user?.uid}</p>
                  <p>Farm ID: {activeFarmId}</p>
                  <p>Role: {profile?.role || 'user'}</p>
                  <p>Platform: {import.meta.env.MODE}</p>
                </div>
              </div>
            </div>
          </section>
        )}
      </div>

      <div className="text-center py-8">
        <div className="inline-flex items-center gap-2 bg-[var(--m3-secondary-container)] px-4 py-2 rounded-full border border-[var(--m3-outline-variant)]">
          <Database className="w-3 h-3 text-[var(--m3-on-secondary-container)]" />
          <span className="text-[10px] font-medium uppercase text-[var(--m3-on-secondary-container)] tracking-widest">
            Cache: {(JSON.stringify(localStorage).length / 1024).toFixed(1)} KB Used
          </span>
        </div>
        <p 
          onClick={handleVersionTap}
          className="text-[9px] text-[var(--m3-on-surface-variant)] mt-3 font-medium uppercase tracking-widest opacity-60 cursor-pointer select-none"
        >
          Build Version: 2.5.2-Platinum
        </p>
      </div>
    </div>
  );
};

const SectionHeader: React.FC<{ title: string }> = ({ title }) => (
  <h3 className="text-[10px] font-medium text-[var(--m3-on-surface-variant)] uppercase tracking-[0.15em] ml-1 mb-1">{title}</h3>
);

const SettingItem: React.FC<{ icon: React.ReactNode, label: string, value?: string, sub?: string, onClick?: () => void }> = ({ icon, label, value, sub, onClick }) => (
  <button 
    onClick={onClick}
    className="w-full flex items-center justify-between p-4 active:bg-[var(--m3-surface-container-high)] transition-colors group rounded-xl"
  >
    <div className="flex items-center gap-4 text-left">
      <div className="p-3 bg-[var(--m3-surface-container-high)] rounded-xl text-[var(--m3-on-surface-variant)]">
        {React.cloneElement(icon as React.ReactElement<any>, { className: 'w-5 h-5' })}
      </div>
      <div>
        <p className="text-sm font-medium text-[var(--m3-on-surface)]">{label}</p>
        {sub && <p className="text-[10px] text-[var(--m3-on-surface-variant)] font-medium uppercase tracking-wider">{sub}</p>}
      </div>
    </div>
    <div className="flex items-center gap-2">
      {value && <span className="text-xs font-medium text-[var(--m3-primary)] truncate max-w-[120px]">{value}</span>}
      <ChevronRight className="w-4 h-4 text-[var(--m3-on-surface-variant)]" />
    </div>
  </button>
);

const ToggleItem: React.FC<{ icon: React.ReactNode, label: string, enabled: boolean, onToggle: (val: boolean) => void }> = ({ icon, label, enabled, onToggle }) => (
  <div className="flex items-center justify-between py-4">
    <div className="flex items-center gap-4">
      <div className="p-3 bg-[var(--m3-surface-container-high)] rounded-xl text-[var(--m3-on-surface-variant)]">
        {React.cloneElement(icon as React.ReactElement<any>, { className: 'w-5 h-5' })}
      </div>
      <p className="text-sm font-medium text-[var(--m3-on-surface)]">{label}</p>
    </div>
    <button 
      onClick={() => onToggle(!enabled)}
      className={`relative w-12 h-7 rounded-full transition-all duration-300 ${enabled ? 'bg-[var(--m3-primary)]' : 'bg-[var(--m3-surface-container-high)] border border-[var(--m3-outline)]'}`}
    >
      <div className={`absolute top-1 w-5 h-5 rounded-full transition-all duration-300 ${enabled ? 'left-6 bg-[var(--m3-on-primary)] shadow-sm' : 'left-1 bg-[var(--m3-on-surface-variant)]'}`} />
    </button>
  </div>
);

export default Settings;