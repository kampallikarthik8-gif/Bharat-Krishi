
import React from 'react';
import { 
  User, 
  MapPin, 
  Phone, 
  Mail, 
  Maximize2, 
  Leaf, 
  Award, 
  TrendingUp, 
  Calendar,
  ChevronRight,
  Edit2,
  CheckCircle2,
  Clock,
  Briefcase,
  X as CloseIcon,
  Plus,
  RotateCcw,
  LogOut,
  Navigation,
  Loader2,
  Settings as SettingsIcon,
  ShieldCheck,
  CreditCard,
  Landmark,
  Droplets,
  Layers
} from 'lucide-react';
import { JournalEntry, AppView } from '../types';
import { Geolocation } from '@capacitor/geolocation';
import { useFirebase } from '../src/components/FirebaseProvider';
import { db } from '../src/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../src/utils/firestoreErrorHandler';

interface ProfileProps {
  onLogout: () => void;
  onNavigate: (view: AppView) => void;
}

const WEATHER_API_KEY = import.meta.env.VITE_WEATHER_API_KEY;

const Profile: React.FC<ProfileProps> = ({ onLogout, onNavigate }) => {
  const { user, profile: firebaseProfile, activeFarmId } = useFirebase();
  const [isEditing, setIsEditing] = React.useState(false);
  const [isLocating, setIsLocating] = React.useState(false);
  
  // Persistent State
  const [profile, setProfile] = React.useState({
    farmerName: '',
    farmName: '',
    phone: '',
    email: '',
    location: '',
    state: '',
    district: '',
    mandal: '',
    revenue: '',
    farmSize: '',
    sizeUnit: 'Acres',
    mainCrops: [],
    soilType: '',
    irrigation: '',
    terrain: '',
    cropHistory: [],
    pastIssues: []
  });

  React.useEffect(() => {
    if (firebaseProfile) {
      setProfile({
        farmerName: firebaseProfile.name || '',
        farmName: firebaseProfile.farmName || '',
        phone: firebaseProfile.phone || '',
        email: firebaseProfile.email || user?.email || '',
        location: firebaseProfile.location || '',
        state: firebaseProfile.state || '',
        district: firebaseProfile.district || '',
        mandal: firebaseProfile.mandal || '',
        revenue: firebaseProfile.revenueVillage || '',
        farmSize: firebaseProfile.farmSize?.toString() || '',
        sizeUnit: firebaseProfile.units === 'Imperial' ? 'Acres' : 'Hectares',
        mainCrops: firebaseProfile.mainCrops || [],
        soilType: firebaseProfile.soilType || '',
        irrigation: firebaseProfile.irrigation || '',
        terrain: firebaseProfile.terrain || '',
        cropHistory: firebaseProfile.cropHistory || [],
        pastIssues: firebaseProfile.pastIssues || []
      });
    }
  }, [firebaseProfile, user]);

  // Backup state for cancelling
  const [backupProfile, setBackupProfile] = React.useState(profile);

  const [stats, setStats] = React.useState({
    totalLogs: 0,
    lastActivity: 'No activity',
    topCategory: 'General'
  });

  React.useEffect(() => {
    // Calculate stats from Journal
    const journalRaw = localStorage.getItem('agriassist_journal');
    if (journalRaw) {
      const entries: JournalEntry[] = JSON.parse(journalRaw);
      
      // Calculate top category
      const counts: Record<string, number> = {};
      entries.forEach(e => {
        counts[e.category] = (counts[e.category] || 0) + 1;
      });
      const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'General';

      setStats({
        totalLogs: entries.length,
        lastActivity: entries.length > 0 ? entries[0].date : 'No activity',
        topCategory: top
      });
    }
  }, []);

  const handleEditToggle = () => {
    if (isEditing) {
      setProfile(backupProfile);
    } else {
      setBackupProfile(profile);
    }
    setIsEditing(!isEditing);
  };

  const handleSave = async () => {
    if (!user) return;

    const updatedData = {
      name: profile.farmerName,
      farmName: profile.farmName,
      phone: profile.phone,
      email: profile.email,
      location: profile.location,
      state: profile.state,
      district: profile.district,
      mandal: profile.mandal,
      revenueVillage: profile.revenue,
      farmSize: parseFloat(profile.farmSize) || 0,
      mainCrops: profile.mainCrops,
      soilType: profile.soilType,
      irrigation: profile.irrigation,
      terrain: profile.terrain,
      cropHistory: profile.cropHistory,
      pastIssues: profile.pastIssues
    };

    try {
      await updateDoc(doc(db, 'users', activeFarmId), updatedData);
      setIsEditing(false);
      setBackupProfile(profile);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${activeFarmId}`);
    }
  };

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
      setProfile(prev => ({ ...prev, location: cityRegion }));
    } catch (err) {
      console.error("Location detection failed", err);
      alert("GPS Access Denied or Location Error.");
    } finally {
      setIsLocating(false);
    }
  };

  const addCrop = () => {
    const crop = prompt("Enter the name of the new crop:");
    if (crop && crop.trim()) {
      const formatted = crop.trim();
      if (!profile.mainCrops.includes(formatted)) {
        setProfile(prev => ({ ...prev, mainCrops: [...prev.mainCrops, formatted] }));
      }
    }
  };

  const removeCrop = (cropToRemove: string) => {
    setProfile(prev => ({ ...prev, mainCrops: prev.mainCrops.filter(c => c !== cropToRemove) }));
  };

  const addHistoryEntry = () => {
    const year = prompt("Enter Year (e.g. 2023):");
    const crop = prompt("Enter Crop Name:");
    const yieldVal = prompt("Enter Yield (e.g. 4.5 tons/ha):");
    
    if (year && crop && yieldVal) {
      setProfile(prev => ({
        ...prev,
        cropHistory: [...prev.cropHistory, { year, crop, yield: yieldVal }]
      }));
    }
  };

  const removeHistoryEntry = (index: number) => {
    setProfile(prev => ({
      ...prev,
      cropHistory: prev.cropHistory.filter((_, i) => i !== index)
    }));
  };

  const addIssue = () => {
    const issue = prompt("Enter past issue (e.g. Locust attack 2022):");
    if (issue && issue.trim()) {
      setProfile(prev => ({
        ...prev,
        pastIssues: [...prev.pastIssues, issue.trim()]
      }));
    }
  };

  const removeIssue = (index: number) => {
    setProfile(prev => ({
      ...prev,
      pastIssues: prev.pastIssues.filter((_, i) => i !== index)
    }));
  };

  return (
    <div className="space-y-6 pb-24 bg-[var(--m3-background)] min-h-screen">
      {/* Header Profile Card */}
      <div className="bg-[var(--m3-primary-container)] rounded-b-[2.5rem] p-8 pt-12 shadow-md relative overflow-hidden">
        <div className="relative z-10 flex flex-col items-center">
          <div className="relative mb-4 group">
            <div className="w-28 h-28 bg-[var(--m3-surface)] rounded-3xl flex items-center justify-center shadow-lg overflow-hidden border-2 border-[var(--m3-outline-variant)]">
              <div className="w-full h-full bg-[var(--m3-surface-container-high)] flex items-center justify-center">
                <User className="w-14 h-14 text-[var(--m3-primary)]" />
              </div>
            </div>
            <button 
              onClick={handleEditToggle}
              className={`absolute -bottom-2 -right-2 p-3 rounded-2xl shadow-md transition-all ${isEditing ? 'bg-[var(--m3-error)] text-[var(--m3-on-error)]' : 'bg-[var(--m3-primary)] text-[var(--m3-on-primary)]'}`}
            >
              {isEditing ? <RotateCcw className="w-5 h-5" /> : <Edit2 className="w-5 h-5" />}
            </button>
          </div>
          
          <div className="text-center w-full px-4">
            {isEditing ? (
              <div className="flex flex-col items-center gap-2">
                <input 
                  value={profile.farmerName}
                  onChange={e => setProfile({...profile, farmerName: e.target.value})}
                  placeholder="Farmer Name"
                  className="text-2xl font-medium text-[var(--m3-on-primary-container)] bg-[var(--m3-surface)] border-b-2 border-[var(--m3-primary)] outline-none px-4 py-2 rounded-t-lg w-full text-center focus:bg-[var(--m3-surface-container-high)] transition-all"
                />
                <input 
                  value={profile.farmName}
                  onChange={e => setProfile({...profile, farmName: e.target.value})}
                  placeholder="Farm Name"
                  className="text-sm font-medium text-[var(--m3-on-primary-container)] opacity-80 bg-transparent border-b border-[var(--m3-outline)] outline-none px-4 py-1 text-center w-2/3 uppercase tracking-widest"
                />
              </div>
            ) : (
              <>
                <h2 className="text-3xl font-medium text-[var(--m3-on-primary-container)] mb-1 m3-headline-medium">{profile.farmerName}</h2>
                <p className="text-[var(--m3-on-primary-container)] opacity-70 text-xs font-medium uppercase tracking-widest">{profile.farmName}</p>
              </>
            )}
          </div>

          <div className="mt-6 flex gap-2">
             <div className="bg-[var(--m3-surface)]/50 backdrop-blur-sm px-4 py-2 rounded-full border border-[var(--m3-outline-variant)] flex items-center gap-2">
                <Award className="w-4 h-4 text-[var(--m3-primary)]" />
                <span className="text-[10px] font-medium uppercase text-[var(--m3-on-surface)] tracking-wider">Krishi Master</span>
             </div>
             <div className="bg-[var(--m3-surface)]/50 backdrop-blur-sm px-4 py-2 rounded-full border border-[var(--m3-outline-variant)] flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-[var(--m3-primary)]" />
                <span className="text-[10px] font-medium uppercase text-[var(--m3-on-surface)] tracking-wider">Level 12</span>
             </div>
          </div>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-3 gap-3 px-6">
        <StatsCard icon={<Briefcase className="w-4 h-4" />} label="Total Logs" value={stats.totalLogs.toString()} color="bg-[var(--m3-surface-container-low)]" textColor="text-[var(--m3-on-surface)]" />
        <StatsCard icon={<Clock className="w-4 h-4" />} label="Activity" value={stats.lastActivity} color="bg-[var(--m3-surface-container-low)]" textColor="text-[var(--m3-on-surface)]" isSmall />
        <StatsCard icon={<Leaf className="w-4 h-4" />} label="Focus Crop" value={stats.topCategory} color="bg-[var(--m3-surface-container-low)]" textColor="text-[var(--m3-on-surface)]" />
      </div>

      {/* Account Settings Section */}
      <div className="px-6 space-y-3">
        <SectionHeader title="Account Management" />
        <div className="m3-card-filled p-2 bg-[var(--m3-surface-container-low)] divide-y divide-[var(--m3-outline-variant)]">
          <button 
            onClick={handleEditToggle}
            className="w-full flex items-center justify-between p-4 active:bg-[var(--m3-surface-container-high)] transition-colors group rounded-xl"
          >
            <div className="flex items-center gap-4 text-left">
              <div className="p-3 bg-[var(--m3-primary-container)] rounded-xl text-[var(--m3-on-primary-container)]">
                <Edit2 className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-[var(--m3-on-surface)]">Edit Profile</p>
                <p className="text-[10px] text-[var(--m3-on-surface-variant)] font-medium uppercase tracking-wider">Update Identity & Operation</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-[var(--m3-on-surface-variant)]" />
          </button>
          
          <button 
            onClick={() => onNavigate(AppView.SETTINGS)}
            className="w-full flex items-center justify-between p-4 active:bg-[var(--m3-surface-container-high)] transition-colors group rounded-xl"
          >
            <div className="flex items-center gap-4 text-left">
              <div className="p-3 bg-[var(--m3-surface-container-high)] rounded-xl text-[var(--m3-on-surface-variant)]">
                <SettingsIcon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-[var(--m3-on-surface)]">System Preferences</p>
                <p className="text-[10px] text-[var(--m3-on-surface-variant)] font-medium uppercase tracking-wider">Language, Units & Alerts</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-[var(--m3-on-surface-variant)]" />
          </button>
        </div>
      </div>

      {/* Profile Sections */}
      <div className="space-y-6 px-6 pb-12">
        <section className="space-y-3">
          <SectionHeader title="Contact Details" />
          <div className="m3-card-filled p-4 bg-[var(--m3-surface-container-low)] divide-y divide-[var(--m3-outline-variant)]">
            <ProfileItem 
              icon={<Phone />} 
              label="Mobile" 
              value={profile.phone} 
              isEditing={isEditing}
              onChange={val => setProfile({...profile, phone: val})}
            />
            <ProfileItem 
              icon={<Mail />} 
              label="Email" 
              value={profile.email} 
              isEditing={isEditing}
              onChange={val => setProfile({...profile, email: val})}
            />
          </div>
        </section>

        <section className="space-y-3">
          <SectionHeader title="Farm Geo-Data" />
          <div className="m3-card-filled p-4 bg-[var(--m3-surface-container-low)] divide-y divide-[var(--m3-outline-variant)]">
            <div className="flex items-center gap-4 py-4">
              <div className="p-3 bg-[var(--m3-surface-container-high)] rounded-xl text-[var(--m3-on-surface-variant)]">
                <MapPin className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-medium text-[var(--m3-on-surface-variant)] uppercase tracking-wider mb-1">State & Region</p>
                {isEditing ? (
                  <div className="flex flex-col gap-2">
                    <input 
                      value={profile.state} 
                      onChange={e => setProfile({...profile, state: e.target.value})}
                      placeholder="State"
                      className="flex-1 bg-[var(--m3-surface-container-high)] border-b border-[var(--m3-outline)] outline-none text-sm font-medium text-[var(--m3-on-surface)] p-2 rounded-t-lg focus:border-[var(--m3-primary)] transition-all"
                    />
                    <input 
                      value={profile.district} 
                      onChange={e => setProfile({...profile, district: e.target.value})}
                      placeholder="District"
                      className="flex-1 bg-[var(--m3-surface-container-high)] border-b border-[var(--m3-outline)] outline-none text-sm font-medium text-[var(--m3-on-surface)] p-2 rounded-t-lg focus:border-[var(--m3-primary)] transition-all"
                    />
                    <button onClick={detectLocation} disabled={isLocating} className="p-2 bg-[var(--m3-primary-container)] text-[var(--m3-on-primary-container)] rounded-full disabled:opacity-50 w-fit text-xs font-medium flex items-center gap-2">
                      {isLocating ? <Loader2 className="w-3 h-3 animate-spin" /> : <><Navigation className="w-3 h-3" /> Auto-Detect</>}
                    </button>
                  </div>
                ) : (
                  <p className="text-sm font-medium text-[var(--m3-on-surface)] truncate">{profile.state}, {profile.district}</p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-4 py-4">
              <div className="p-3 bg-[var(--m3-surface-container-high)] rounded-xl text-[var(--m3-on-surface-variant)]">
                <Landmark className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-medium text-[var(--m3-on-surface-variant)] uppercase tracking-wider mb-1">Mandal & Revenue Village</p>
                {isEditing ? (
                  <div className="flex flex-col gap-2">
                     <input 
                      value={profile.mandal} 
                      onChange={e => setProfile({...profile, mandal: e.target.value})}
                      placeholder="Mandal"
                      className="flex-1 bg-[var(--m3-surface-container-high)] border-b border-[var(--m3-outline)] outline-none text-sm font-medium text-[var(--m3-on-surface)] p-2 rounded-t-lg focus:border-[var(--m3-primary)] transition-all"
                    />
                    <input 
                      value={profile.revenue} 
                      onChange={e => setProfile({...profile, revenue: e.target.value})}
                      placeholder="Revenue Village"
                      className="flex-1 bg-[var(--m3-surface-container-high)] border-b border-[var(--m3-outline)] outline-none text-sm font-medium text-[var(--m3-on-surface)] p-2 rounded-t-lg focus:border-[var(--m3-primary)] transition-all"
                    />
                  </div>
                ) : (
                  <p className="text-sm font-medium text-[var(--m3-on-surface)]">{profile.mandal} • {profile.revenue}</p>
                )}
              </div>
            </div>
            
            <ProfileItem 
              icon={<Maximize2 />} 
              label={`Size (${profile.sizeUnit})`} 
              value={profile.farmSize} 
              isEditing={isEditing}
              type="number"
              onChange={val => setProfile({...profile, farmSize: val})}
            />
          </div>
        </section>

        <section className="space-y-3">
          <SectionHeader title="Farm Intelligence" />
          <div className="m3-card-filled p-4 bg-[var(--m3-surface-container-low)] divide-y divide-[var(--m3-outline-variant)]">
            <ProfileItem 
              icon={<Droplets className="w-5 h-5" />} 
              label="Irrigation System" 
              value={profile.irrigation} 
              isEditing={isEditing}
              onChange={val => setProfile({...profile, irrigation: val})}
            />
            <ProfileItem 
              icon={<Layers className="w-5 h-5" />} 
              label="Soil Type" 
              value={profile.soilType} 
              isEditing={isEditing}
              onChange={val => setProfile({...profile, soilType: val})}
            />
            <ProfileItem 
              icon={<Navigation className="w-5 h-5" />} 
              label="Terrain" 
              value={profile.terrain} 
              isEditing={isEditing}
              onChange={val => setProfile({...profile, terrain: val})}
            />
          </div>
        </section>

        <section className="space-y-3">
          <SectionHeader title="Crop Intelligence" />
          <div className="m3-card-filled p-6 bg-[var(--m3-surface-container-low)]">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-[var(--m3-surface-container-high)] rounded-xl text-[var(--m3-primary)]">
                <Leaf className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-[10px] font-medium text-[var(--m3-on-surface-variant)] uppercase tracking-wider">Active Crops</p>
                  {isEditing && (
                    <button onClick={addCrop} className="flex items-center gap-1.5 text-[10px] font-medium text-[var(--m3-primary)] bg-[var(--m3-primary-container)] px-3 py-1.5 rounded-full active:scale-95 transition-all">
                      <Plus className="w-3.5 h-3.5" /> Add Crop
                    </button>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {profile.mainCrops.map((c: string) => (
                    <span key={c} className="inline-flex items-center gap-2 bg-[var(--m3-surface)] border border-[var(--m3-outline-variant)] px-4 py-2 rounded-full text-xs font-medium text-[var(--m3-on-surface)] shadow-sm">
                      {c}
                      {isEditing && (
                        <button onClick={() => removeCrop(c)} className="text-[var(--m3-on-surface-variant)] hover:text-[var(--m3-error)] transition-colors">
                          <CloseIcon className="w-4 h-4" />
                        </button>
                      )}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {isEditing ? (
          <div className="grid grid-cols-1 gap-3 mt-8">
            <button onClick={handleSave} className="w-full bg-[var(--m3-primary)] text-[var(--m3-on-primary)] font-medium py-4 rounded-full flex items-center justify-center gap-3 shadow-md active:scale-[0.98] transition-all">
              <CheckCircle2 className="w-5 h-5" /> Save Changes
            </button>
            <button onClick={handleEditToggle} className="w-full bg-[var(--m3-surface-container-high)] text-[var(--m3-on-surface-variant)] font-medium py-4 rounded-full flex items-center justify-center gap-2 active:scale-[0.98] transition-all text-xs uppercase tracking-widest">
              Discard Changes
            </button>
          </div>
        ) : (
          <div className="mt-8 space-y-4">
            <button onClick={onLogout} className="w-full bg-[var(--m3-error-container)] text-[var(--m3-on-error-container)] font-medium py-4 rounded-full flex items-center justify-center gap-3 active:scale-[0.98] transition-all">
              <LogOut className="w-5 h-5" /> Sign Out
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

const SectionHeader: React.FC<{ title: string }> = ({ title }) => (
  <h3 className="text-[10px] font-medium text-[var(--m3-on-surface-variant)] uppercase tracking-[0.15em] ml-1 mb-1">{title}</h3>
);

const StatsCard: React.FC<{ icon: React.ReactNode, label: string, value: string, color: string, textColor: string, isSmall?: boolean }> = ({ icon, label, value, color, textColor, isSmall }) => (
  <div className={`${color} p-4 rounded-2xl border border-[var(--m3-outline-variant)] flex flex-col justify-between h-32 shadow-sm transition-all`}>
    <div className={`p-2 w-fit rounded-xl bg-[var(--m3-surface-container-high)] ${textColor}`}>{icon}</div>
    <div className="truncate">
      <p className={`text-[9px] font-medium uppercase tracking-[0.1em] text-[var(--m3-on-surface-variant)] mb-1 truncate`}>{label}</p>
      <p className={`${isSmall ? 'text-[11px]' : 'text-sm'} font-medium ${textColor} truncate`}>{value}</p>
    </div>
  </div>
);

const ProfileItem: React.FC<{ 
  icon: React.ReactNode, 
  label: string, 
  value: string, 
  isEditing: boolean, 
  type?: string,
  onChange: (val: string) => void 
}> = ({ icon, label, value, isEditing, type = "text", onChange }) => (
  <div className="flex items-center gap-4 py-4">
    <div className="p-3 bg-[var(--m3-surface-container-high)] rounded-xl text-[var(--m3-on-surface-variant)]">
      {React.cloneElement(icon as React.ReactElement<any>, { className: 'w-5 h-5' })}
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-[10px] font-medium text-[var(--m3-on-surface-variant)] uppercase tracking-wider mb-1">{label}</p>
      {isEditing ? (
        <input 
          type={type}
          value={value} 
          onChange={e => onChange(e.target.value)}
          className="w-full bg-[var(--m3-surface-container-high)] border-b border-[var(--m3-outline)] outline-none text-sm font-medium text-[var(--m3-on-surface)] p-2 rounded-t-lg focus:border-[var(--m3-primary)] transition-all"
        />
      ) : (
        <p className="text-sm font-medium text-[var(--m3-on-surface)] truncate">{value || 'Not provided'}</p>
      )}
    </div>
  </div>
);

export default Profile;
