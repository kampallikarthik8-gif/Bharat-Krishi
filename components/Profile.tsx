
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

interface ProfileProps {
  onLogout: () => void;
  onNavigate: (view: AppView) => void;
}

const WEATHER_API_KEY = "42d5aa17c7f2866670e62b4c77cb3d32";

const Profile: React.FC<ProfileProps> = ({ onLogout, onNavigate }) => {
  const [isEditing, setIsEditing] = React.useState(false);
  const [isLocating, setIsLocating] = React.useState(false);
  
  // Persistent State
  const [profile, setProfile] = React.useState({
    farmerName: localStorage.getItem('agri_farmer_name') || 'John Doe',
    farmName: localStorage.getItem('agri_farm_name') || 'Sunrise Acres',
    phone: localStorage.getItem('agri_farmer_phone') || '+1 555-0123',
    email: localStorage.getItem('agri_farmer_email') || 'farmer.john@example.com',
    location: localStorage.getItem('agri_farm_location') || 'Central Valley, CA',
    state: localStorage.getItem('agri_state') || 'N/A',
    district: localStorage.getItem('agri_district') || 'N/A',
    mandal: localStorage.getItem('agri_mandal') || 'N/A',
    revenue: localStorage.getItem('agri_revenue_village') || 'N/A',
    farmSize: localStorage.getItem('agri_farm_size') || '120',
    sizeUnit: localStorage.getItem('agri_units') === 'Imperial' ? 'Acres' : 'Hectares',
    mainCrops: JSON.parse(localStorage.getItem('agri_main_crops') || '["Corn", "Wheat", "Soybeans"]'),
    soilType: localStorage.getItem('agri_soil_type') || 'Loamy',
    irrigation: localStorage.getItem('agri_irrigation') || 'Drip',
    terrain: localStorage.getItem('agri_terrain') || 'Flat',
    cropHistory: JSON.parse(localStorage.getItem('agri_crop_history') || '[]'),
    pastIssues: JSON.parse(localStorage.getItem('agri_past_issues') || '[]')
  });

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

  const handleSave = () => {
    localStorage.setItem('agri_farmer_name', profile.farmerName);
    localStorage.setItem('agri_farm_name', profile.farmName);
    localStorage.setItem('agri_farmer_phone', profile.phone);
    localStorage.setItem('agri_farmer_email', profile.email);
    localStorage.setItem('agri_farm_location', profile.location);
    localStorage.setItem('agri_state', profile.state);
    localStorage.setItem('agri_district', profile.district);
    localStorage.setItem('agri_mandal', profile.mandal);
    localStorage.setItem('agri_revenue_village', profile.revenue);
    localStorage.setItem('agri_farm_size', profile.farmSize);
    localStorage.setItem('agri_main_crops', JSON.stringify(profile.mainCrops));
    localStorage.setItem('agri_soil_type', profile.soilType);
    localStorage.setItem('agri_irrigation', profile.irrigation);
    localStorage.setItem('agri_terrain', profile.terrain);
    localStorage.setItem('agri_crop_history', JSON.stringify(profile.cropHistory));
    localStorage.setItem('agri_past_issues', JSON.stringify(profile.pastIssues));
    
    setIsEditing(false);
    setBackupProfile(profile);
  };

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
          setProfile(prev => ({ ...prev, location: cityRegion }));
        } catch (err) {
          console.error("Location detection failed", err);
        } finally {
          setIsLocating(false);
        }
      },
      (err) => {
        setIsLocating(false);
        alert("GPS Access Denied.");
      },
      { enableHighAccuracy: true }
    );
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
    <div className="space-y-8 pb-12 bg-slate-50 min-h-screen">
      {/* Header Profile Card */}
      <div className="bg-emerald-600 rounded-b-[3rem] p-8 pt-12 shadow-xl shadow-emerald-900/10 relative overflow-hidden">
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
        <div className="relative z-10 flex flex-col items-center">
          <div className="relative mb-6 group">
            <div className="w-32 h-32 bg-white rounded-3xl flex items-center justify-center shadow-2xl group-hover:scale-105 transition-transform duration-500 overflow-hidden border-4 border-white/20">
              <div className="w-full h-full bg-emerald-50 flex items-center justify-center">
                <User className="w-16 h-16 text-emerald-600" />
              </div>
            </div>
            <button 
              onClick={handleEditToggle}
              className={`absolute -bottom-2 -right-2 p-3 rounded-2xl shadow-xl transition-all ${isEditing ? 'bg-rose-500 text-white' : 'bg-white text-emerald-600'}`}
            >
              {isEditing ? <RotateCcw className="w-5 h-5" /> : <Edit2 className="w-5 h-5" />}
            </button>
          </div>
          
          <div className="text-center w-full px-4">
            {isEditing ? (
              <div className="flex flex-col items-center gap-3">
                <input 
                  value={profile.farmerName}
                  onChange={e => setProfile({...profile, farmerName: e.target.value})}
                  placeholder="Farmer Name"
                  className="text-3xl font-black text-white bg-white/10 border-2 border-dashed border-white/30 outline-none px-6 py-2 rounded-2xl mb-1 text-center w-full focus:border-white transition-colors placeholder:text-white/50"
                />
                <input 
                  value={profile.farmName}
                  onChange={e => setProfile({...profile, farmName: e.target.value})}
                  placeholder="Farm Name"
                  className="text-sm font-bold text-emerald-100 bg-white/10 border-b border-white/20 outline-none px-4 py-1.5 text-center w-2/3 uppercase tracking-widest focus:border-white placeholder:text-white/30"
                />
              </div>
            ) : (
              <>
                <h2 className="text-4xl font-bold text-white mb-1 tracking-tight font-display">{profile.farmerName}</h2>
                <p className="text-emerald-100 text-[10px] font-bold uppercase tracking-[0.25em]">{profile.farmName}</p>
              </>
            )}
          </div>

          <div className="mt-8 flex gap-3">
             <div className="bg-white/10 backdrop-blur-md px-5 py-2.5 rounded-2xl border border-white/10 flex items-center gap-2.5 shadow-sm">
                <Award className="w-4 h-4 text-emerald-200" />
                <span className="text-[10px] font-bold uppercase text-white tracking-widest">Krishi Master</span>
             </div>
             <div className="bg-white/10 backdrop-blur-md px-5 py-2.5 rounded-2xl border border-white/10 flex items-center gap-2.5 shadow-sm">
                <TrendingUp className="w-4 h-4 text-emerald-200" />
                <span className="text-[10px] font-bold uppercase text-white tracking-widest">Level 12</span>
             </div>
          </div>
        </div>
      </div>

      {/* Account Settings Section */}
      <div className="px-6 space-y-4">
        <SectionHeader title="Account Management" />
        <div className="bg-white rounded-3xl p-2 shadow-sm border border-slate-100 divide-y divide-slate-50">
          <button 
            onClick={handleEditToggle}
            className="w-full flex items-center justify-between p-5 active:bg-slate-50 transition-colors group rounded-2xl"
          >
            <div className="flex items-center gap-4 text-left">
              <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600 group-hover:bg-emerald-100 transition-colors">
                <Edit2 className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900">Edit Profile</p>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Update Identity & Operation</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-emerald-500 transition-colors" />
          </button>
          
          <button 
            onClick={() => onNavigate(AppView.SETTINGS)}
            className="w-full flex items-center justify-between p-5 active:bg-slate-50 transition-colors group rounded-2xl"
          >
            <div className="flex items-center gap-4 text-left">
              <div className="p-3 bg-slate-50 rounded-xl text-slate-400 group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-colors">
                <SettingsIcon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900">System Preferences</p>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Language, Units & Alerts</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-emerald-500 transition-colors" />
          </button>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-3 gap-4 px-6">
        <StatsCard icon={<Briefcase className="w-4 h-4" />} label="Total Logs" value={stats.totalLogs.toString()} color="bg-white" textColor="text-slate-900" />
        <StatsCard icon={<Clock className="w-4 h-4" />} label="Activity" value={stats.lastActivity} color="bg-white" textColor="text-slate-900" isSmall />
        <StatsCard icon={<Leaf className="w-4 h-4" />} label="Focus Crop" value={stats.topCategory} color="bg-white" textColor="text-slate-900" />
      </div>

      {/* Profile Sections */}
      <div className="space-y-6 px-6 pb-12">
        <section className="space-y-4">
          <SectionHeader title="Contact Details" />
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 divide-y divide-slate-50">
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

        <section className="space-y-4">
          <SectionHeader title="Farm Geo-Data" />
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 divide-y divide-slate-50">
            <div className="flex items-center gap-4 py-5 group transition-all">
              <div className="p-3 bg-slate-50 rounded-xl text-slate-400 group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-colors">
                <MapPin className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">State & Region</p>
                {isEditing ? (
                  <div className="flex flex-col gap-2">
                    <input 
                      value={profile.state} 
                      onChange={e => setProfile({...profile, state: e.target.value})}
                      placeholder="State"
                      className="flex-1 bg-slate-50 border-none outline-none text-sm font-bold text-slate-900 p-2 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500/10 transition-all"
                    />
                    <input 
                      value={profile.district} 
                      onChange={e => setProfile({...profile, district: e.target.value})}
                      placeholder="District"
                      className="flex-1 bg-slate-50 border-none outline-none text-sm font-bold text-slate-900 p-2 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500/10 transition-all"
                    />
                    <button onClick={detectLocation} disabled={isLocating} className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100 disabled:opacity-50 w-fit text-xs font-bold flex items-center gap-2">
                      {isLocating ? <Loader2 className="w-3 h-3 animate-spin" /> : <><Navigation className="w-3 h-3" /> Auto-Detect</>}
                    </button>
                  </div>
                ) : (
                  <p className="text-sm font-bold text-slate-900 truncate">{profile.state}, {profile.district}</p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-4 py-5 group transition-all">
              <div className="p-3 bg-slate-50 rounded-xl text-slate-400 group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-colors">
                <Landmark className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Mandal & Revenue Village</p>
                {isEditing ? (
                  <div className="flex flex-col gap-2">
                     <input 
                      value={profile.mandal} 
                      onChange={e => setProfile({...profile, mandal: e.target.value})}
                      placeholder="Mandal"
                      className="flex-1 bg-slate-50 border-none outline-none text-sm font-bold text-slate-900 p-2 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500/10 transition-all"
                    />
                    <input 
                      value={profile.revenue} 
                      onChange={e => setProfile({...profile, revenue: e.target.value})}
                      placeholder="Revenue Village"
                      className="flex-1 bg-slate-50 border-none outline-none text-sm font-bold text-slate-900 p-2 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500/10 transition-all"
                    />
                  </div>
                ) : (
                  <p className="text-sm font-bold text-slate-900">{profile.mandal} • {profile.revenue}</p>
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

        <section className="space-y-4">
          <SectionHeader title="Farm Intelligence" />
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 divide-y divide-slate-50">
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

        <section className="space-y-4">
          <SectionHeader title="Crop Intelligence" />
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
            <div className="py-2">
               <div className="flex items-center gap-4">
                  <div className="p-3 bg-slate-50 rounded-xl text-emerald-500">
                     <Leaf className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active Crops</p>
                      {isEditing && (
                        <button onClick={addCrop} className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-100 active:scale-95 transition-all">
                          <Plus className="w-3.5 h-3.5" /> Add Crop
                        </button>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {profile.mainCrops.map((c: string) => (
                        <span key={c} className="group inline-flex items-center gap-2 bg-slate-50 border border-slate-100 px-4 py-2 rounded-xl text-xs font-bold text-slate-700 shadow-sm">
                          {c}
                          {isEditing && (
                            <button onClick={() => removeCrop(c)} className="text-slate-300 hover:text-rose-500 transition-colors">
                              <CloseIcon className="w-4 h-4" />
                            </button>
                          )}
                        </span>
                      ))}
                    </div>
                  </div>
               </div>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <SectionHeader title="Historical Performance" />
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Yield History</p>
                {isEditing && (
                  <button onClick={addHistoryEntry} className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-100">
                    <Plus className="w-3.5 h-3.5" /> Add Record
                  </button>
                )}
              </div>
              <div className="space-y-3">
                {profile.cropHistory.length > 0 ? (
                  profile.cropHistory.map((h: any, i: number) => (
                    <div key={i} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <div>
                        <p className="text-sm font-bold text-slate-900">{h.crop} ({h.year})</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{h.yield}</p>
                      </div>
                      {isEditing && (
                        <button onClick={() => removeHistoryEntry(i)} className="text-slate-300 hover:text-rose-500">
                          <CloseIcon className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 italic">No historical yield data recorded.</p>
                )}
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-slate-50">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Past Issues & Challenges</p>
                {isEditing && (
                  <button onClick={addIssue} className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-100">
                    <Plus className="w-3.5 h-3.5" /> Add Issue
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {profile.pastIssues.length > 0 ? (
                  profile.pastIssues.map((issue: string, i: number) => (
                    <span key={i} className="inline-flex items-center gap-2 bg-rose-50 border border-rose-100 px-4 py-2 rounded-xl text-[10px] font-bold text-rose-700">
                      {issue}
                      {isEditing && (
                        <button onClick={() => removeIssue(i)} className="text-rose-300 hover:text-rose-600">
                          <CloseIcon className="w-4 h-4" />
                        </button>
                      )}
                    </span>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 italic">No past issues recorded.</p>
                )}
              </div>
            </div>
          </div>
        </section>

        {isEditing ? (
          <div className="grid grid-cols-1 gap-3 mt-12">
            <button onClick={handleSave} className="w-full bg-emerald-600 text-white font-bold py-5 rounded-2xl flex items-center justify-center gap-3 shadow-xl shadow-emerald-900/10 active:scale-[0.98] transition-all">
              <CheckCircle2 className="w-5 h-5" /> Save Profile Details
            </button>
            <button onClick={handleEditToggle} className="w-full bg-slate-100 text-slate-400 font-bold py-4 rounded-2xl flex items-center justify-center gap-2 active:scale-[0.98] transition-all text-xs uppercase tracking-widest border border-slate-200">
              Discard Changes
            </button>
          </div>
        ) : (
          <div className="mt-12 space-y-4">
            <button onClick={onLogout} className="w-full bg-white text-rose-600 font-bold py-5 rounded-2xl flex items-center justify-center gap-3 border border-rose-100 shadow-sm active:scale-[0.98] transition-all">
              <LogOut className="w-5 h-5" /> End Current Session
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

const SectionHeader: React.FC<{ title: string }> = ({ title }) => (
  <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em] ml-1 mb-2">{title}</h3>
);

const StatsCard: React.FC<{ icon: React.ReactNode, label: string, value: string, color: string, textColor: string, isSmall?: boolean }> = ({ icon, label, value, color, textColor, isSmall }) => (
  <div className={`${color} p-5 rounded-3xl border border-slate-100 flex flex-col justify-between h-36 shadow-sm transition-all hover:shadow-md`}>
    <div className={`p-3 w-fit rounded-xl bg-slate-50 shadow-inner ${textColor}`}>{icon}</div>
    <div className="truncate">
      <p className={`text-[9px] font-bold uppercase tracking-[0.1em] text-slate-400 mb-1 truncate`}>{label}</p>
      <p className={`${isSmall ? 'text-[11px]' : 'text-sm'} font-bold ${textColor} truncate font-display`}>{value}</p>
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
  <div className="flex items-center gap-4 py-5 group transition-all">
    <div className="p-3 bg-slate-50 rounded-xl text-slate-400 group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-colors">
      {React.cloneElement(icon as React.ReactElement<any>, { className: 'w-5 h-5' })}
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">{label}</p>
      {isEditing ? (
        <input 
          type={type}
          value={value} 
          onChange={e => onChange(e.target.value)}
          className="w-full bg-slate-50 border-none outline-none text-sm font-bold text-slate-900 p-2 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500/10 transition-all"
        />
      ) : (
        <p className="text-sm font-bold text-slate-900 truncate">{value || 'Not provided'}</p>
      )}
    </div>
  </div>
);

export default Profile;
