
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
  Landmark
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
    mainCrops: JSON.parse(localStorage.getItem('agri_main_crops') || '["Corn", "Wheat", "Soybeans"]')
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

  return (
    <div className="space-y-8 pb-12 animate-in fade-in slide-in-from-bottom-6 duration-700">
      {/* Header Profile Card */}
      <div className="bg-[#ffddb3] rounded-[2.5rem] p-8 shadow-sm relative overflow-hidden">
        <div className="relative z-10 flex flex-col items-center">
          <div className="relative mb-4 group">
            <div className="w-28 h-28 bg-[#825500] rounded-full border-4 border-white flex items-center justify-center shadow-xl group-hover:scale-105 transition-transform duration-500">
              <User className="w-14 h-14 text-white" />
            </div>
            <button 
              onClick={handleEditToggle}
              className={`absolute bottom-0 right-0 p-2.5 rounded-full shadow-lg transition-all ${isEditing ? 'bg-rose-50 text-white' : 'bg-white text-[#825500]'}`}
            >
              {isEditing ? <RotateCcw className="w-4 h-4" /> : <Edit2 className="w-4 h-4" />}
            </button>
          </div>
          
          <div className="text-center w-full px-4">
            {isEditing ? (
              <div className="flex flex-col items-center gap-2">
                <input 
                  value={profile.farmerName}
                  onChange={e => setProfile({...profile, farmerName: e.target.value})}
                  placeholder="Farmer Name"
                  className="text-2xl font-black text-[#291800] bg-white/60 border-2 border-dashed border-[#825500]/30 outline-none px-4 py-1.5 rounded-2xl mb-1 text-center w-full focus:border-[#825500] transition-colors"
                />
                <input 
                  value={profile.farmName}
                  onChange={e => setProfile({...profile, farmName: e.target.value})}
                  placeholder="Farm Name"
                  className="text-sm font-bold text-[#825500] bg-white/40 border-b border-[#825500]/20 outline-none px-3 py-1 text-center w-2/3 uppercase tracking-widest focus:border-[#825500]"
                />
              </div>
            ) : (
              <>
                <h2 className="text-3xl font-black text-[#291800] mb-1 tracking-tight">{profile.farmerName}</h2>
                <p className="text-[#825500] text-sm font-black uppercase tracking-[0.2em]">{profile.farmName}</p>
              </>
            )}
          </div>

          <div className="mt-6 flex gap-3">
             <div className="bg-white/40 backdrop-blur-md px-4 py-2 rounded-full border border-white/20 flex items-center gap-2 shadow-sm">
                <Award className="w-3.5 h-3.5 text-[#825500]" />
                <span className="text-[10px] font-black uppercase text-[#291800] tracking-widest">Krishi Master</span>
             </div>
             <div className="bg-white/40 backdrop-blur-md px-4 py-2 rounded-full border border-white/20 flex items-center gap-2 shadow-sm">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-[10px] font-black uppercase text-[#291800] tracking-widest">Level 12</span>
             </div>
          </div>
        </div>
      </div>

      {/* Account Settings Section */}
      <div className="px-2 space-y-4">
        <SectionHeader title="Account Management" />
        <div className="bg-white rounded-[2rem] p-4 shadow-sm border border-stone-100 divide-y divide-stone-50">
          <button 
            onClick={handleEditToggle}
            className="w-full flex items-center justify-between p-4 active:bg-stone-50 transition-colors group"
          >
            <div className="flex items-center gap-4 text-left">
              <div className="p-3 bg-emerald-50 rounded-2xl text-emerald-600 shadow-inner group-hover:bg-emerald-100 transition-colors">
                <Edit2 className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-black text-stone-800">Edit Profile Action</p>
                <p className="text-[10px] text-stone-400 font-bold uppercase tracking-widest">Update Identity & Operation</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-stone-200 group-hover:text-emerald-500 transition-colors" />
          </button>
          
          <button 
            onClick={() => onNavigate(AppView.SETTINGS)}
            className="w-full flex items-center justify-between p-4 active:bg-stone-50 transition-colors group"
          >
            <div className="flex items-center gap-4 text-left">
              <div className="p-3 bg-[#ffddb3]/30 rounded-2xl text-[#825500] shadow-inner group-hover:bg-[#ffddb3]/50 transition-colors">
                <SettingsIcon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-black text-stone-800">System Preferences</p>
                <p className="text-[10px] text-stone-400 font-bold uppercase tracking-widest">Language, Units & Alerts</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-stone-200 group-hover:text-[#825500] transition-colors" />
          </button>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-3 gap-4 px-2">
        <StatsCard icon={<Briefcase className="w-4 h-4" />} label="Total Logs" value={stats.totalLogs.toString()} color="bg-orange-50" textColor="text-orange-700" />
        <StatsCard icon={<Clock className="w-4 h-4" />} label="Last Activity" value={stats.lastActivity} color="bg-emerald-50" textColor="text-emerald-700" isSmall />
        <StatsCard icon={<Leaf className="w-4 h-4" />} label="Focus Crop" value={stats.topCategory} color="bg-blue-50" textColor="text-blue-700" />
      </div>

      {/* Profile Sections */}
      <div className="space-y-4 px-2 pb-8">
        <SectionHeader title="Contact Details" />
        <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-stone-100 divide-y divide-stone-50">
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

        <SectionHeader title="Farm Geo-Data" />
        <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-stone-100 divide-y divide-stone-50">
          <div className="flex items-center gap-4 py-5 group transition-all">
            <div className="p-3 bg-stone-50 rounded-2xl text-stone-400 group-hover:bg-[#ffddb3]/20 group-hover:text-[#825500] transition-colors shadow-inner">
              <MapPin className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-1">State & Region</p>
              {isEditing ? (
                <div className="flex flex-col gap-2">
                  <input 
                    value={profile.state} 
                    onChange={e => setProfile({...profile, state: e.target.value})}
                    placeholder="State"
                    className="flex-1 bg-stone-50/50 border-none outline-none text-sm font-bold text-[#825500] p-1 rounded-md focus:bg-white transition-colors border-b border-dashed border-[#825500]/20"
                  />
                  <input 
                    value={profile.district} 
                    onChange={e => setProfile({...profile, district: e.target.value})}
                    placeholder="District"
                    className="flex-1 bg-stone-50/50 border-none outline-none text-sm font-bold text-[#825500] p-1 rounded-md focus:bg-white transition-colors border-b border-dashed border-[#825500]/20"
                  />
                  <button onClick={detectLocation} disabled={isLocating} className="p-2 bg-amber-50 text-[#825500] rounded-xl border border-amber-100 disabled:opacity-50 w-fit">
                    {isLocating ? <Loader2 className="w-3 h-3 animate-spin" /> : <><Navigation className="w-3 h-3 inline mr-2" /> Locate Dist.</>}
                  </button>
                </div>
              ) : (
                <p className="text-sm font-bold text-stone-800 truncate">{profile.state}, {profile.district}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4 py-5 group transition-all">
            <div className="p-3 bg-stone-50 rounded-2xl text-stone-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors shadow-inner">
              <Landmark className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-1">Mandal & Revenue Village</p>
              {isEditing ? (
                <div className="flex flex-col gap-2">
                   <input 
                    value={profile.mandal} 
                    onChange={e => setProfile({...profile, mandal: e.target.value})}
                    placeholder="Mandal"
                    className="flex-1 bg-stone-50/50 border-none outline-none text-sm font-bold text-[#825500] p-1 rounded-md focus:bg-white transition-colors border-b border-dashed border-[#825500]/20"
                  />
                  <input 
                    value={profile.revenue} 
                    onChange={e => setProfile({...profile, revenue: e.target.value})}
                    placeholder="Revenue Village"
                    className="flex-1 bg-stone-50/50 border-none outline-none text-sm font-bold text-[#825500] p-1 rounded-md focus:bg-white transition-colors border-b border-dashed border-[#825500]/20"
                  />
                </div>
              ) : (
                <p className="text-sm font-bold text-stone-800">{profile.mandal} • {profile.revenue}</p>
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
          
          <div className="py-5">
             <div className="flex items-center gap-4">
                <div className="p-3 bg-stone-50 rounded-2xl text-emerald-500 shadow-inner">
                   <Leaf className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Active Crop Intelligence</p>
                    {isEditing && (
                      <button onClick={addCrop} className="flex items-center gap-1.5 text-[9px] font-black text-[#825500] bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-100 active:scale-95 transition-all">
                        <Plus className="w-3 h-3" /> Add
                      </button>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {profile.mainCrops.map((c: string) => (
                      <span key={c} className="group inline-flex items-center gap-2 bg-stone-50 border border-stone-200 px-3.5 py-2 rounded-xl text-xs font-bold text-stone-700 shadow-sm">
                        {c}
                        {isEditing && (
                          <button onClick={() => removeCrop(c)} className="text-stone-300 hover:text-rose-500 transition-colors">
                            <CloseIcon className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </span>
                    ))}
                  </div>
                </div>
             </div>
          </div>
        </div>

        {isEditing ? (
          <div className="grid grid-cols-1 gap-3 mt-8">
            <button onClick={handleSave} className="w-full bg-stone-900 text-white font-black py-5 rounded-[1.5rem] flex items-center justify-center gap-3 shadow-xl active:scale-[0.98] transition-all">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" /> Save Profile Details
            </button>
            <button onClick={handleEditToggle} className="w-full bg-stone-50 text-stone-400 font-bold py-4 rounded-[1.5rem] flex items-center justify-center gap-2 active:scale-[0.98] transition-all text-xs uppercase tracking-widest border border-stone-200">
              Discard Changes
            </button>
          </div>
        ) : (
          <div className="mt-8 space-y-3">
            <button onClick={onLogout} className="w-full bg-rose-50 text-rose-600 font-black py-5 rounded-[1.5rem] flex items-center justify-center gap-3 border-2 border-rose-100 shadow-sm active:scale-[0.98] transition-all">
              <LogOut className="w-5 h-5" /> End Current Session
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

const SectionHeader: React.FC<{ title: string }> = ({ title }) => (
  <h3 className="text-[10px] font-black text-stone-400 uppercase tracking-[0.2em] ml-4 mt-8 mb-2">{title}</h3>
);

const StatsCard: React.FC<{ icon: React.ReactNode, label: string, value: string, color: string, textColor: string, isSmall?: boolean }> = ({ icon, label, value, color, textColor, isSmall }) => (
  <div className={`${color} p-4 rounded-[2rem] border border-stone-100 flex flex-col justify-between h-32 shadow-sm transition-all hover:shadow-md`}>
    <div className={`p-2.5 w-fit rounded-xl bg-white/70 shadow-sm ${textColor}`}>{icon}</div>
    <div className="truncate">
      <p className={`text-[9px] font-black uppercase tracking-[0.15em] ${textColor} opacity-60 truncate mb-1`}>{label}</p>
      <p className={`${isSmall ? 'text-[11px]' : 'text-base'} font-black ${textColor} truncate`}>{value}</p>
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
    <div className="p-3 bg-stone-50 rounded-2xl text-stone-400 group-hover:bg-[#ffddb3]/20 group-hover:text-[#825500] transition-colors shadow-inner">
      {React.cloneElement(icon as React.ReactElement<any>, { className: 'w-5 h-5' })}
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-1">{label}</p>
      {isEditing ? (
        <input 
          type={type}
          value={value} 
          onChange={e => onChange(e.target.value)}
          className="w-full bg-stone-50/50 border-none outline-none text-sm font-bold text-[#825500] p-1 rounded-md focus:bg-white transition-colors border-b border-dashed border-[#825500]/20"
        />
      ) : (
        <p className="text-sm font-bold text-stone-800 truncate">{value || 'Not provided'}</p>
      )}
    </div>
  </div>
);

export default Profile;
