
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
  Layers,
  Share2,
  Download,
  AlertCircle,
  History
} from 'lucide-react';
import { JournalEntry, AppView } from '../types';
import { Geolocation } from '@capacitor/geolocation';
import { Share } from '@capacitor/share';
import { useFirebase } from '../src/components/FirebaseProvider';
import { db } from '../src/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../src/utils/firestoreErrorHandler';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

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

  const exportProfilePDF = () => {
    const doc = new jsPDF();
    
    // Theme Colors
    const amber: [number, number, number] = [255, 180, 0];
    const dark: [number, number, number] = [20, 20, 20];
    
    // Header
    doc.setFillColor(dark[0], dark[1], dark[2]);
    doc.rect(0, 0, 210, 40, 'F');
    
    doc.setTextColor(amber[0], amber[1], amber[2]);
    doc.setFontSize(24);
    doc.text('BHARAT KISAN - FARMER PROFILE', 14, 25);
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 33);

    // Basic Info
    autoTable(doc, {
      startY: 50,
      head: [['Category', 'Details']],
      body: [
        ['Farmer Name', profile.farmerName],
        ['Farm Name', profile.farmName],
        ['Contact', `${profile.phone} | ${profile.email}`],
        ['Location', `${profile.location} (${profile.state}, ${profile.district})`],
        ['Farm Size', `${profile.farmSize} ${profile.sizeUnit}`],
        ['Soil Type', profile.soilType],
        ['Irrigation', profile.irrigation]
      ],
      theme: 'grid',
      headStyles: { fillColor: amber as any, textColor: [0, 0, 0], fontStyle: 'bold' },
      styles: { fontSize: 9, cellPadding: 4 }
    });

    // Crops
    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 10,
      head: [['Main Crops']],
      body: profile.mainCrops.map(c => [c]),
      theme: 'grid',
      headStyles: { fillColor: amber as any, textColor: [0, 0, 0], fontStyle: 'bold' },
      styles: { fontSize: 9, cellPadding: 4 }
    });

    // History
    if (profile.cropHistory.length > 0) {
      autoTable(doc, {
        startY: (doc as any).lastAutoTable.finalY + 10,
        head: [['Year', 'Crop', 'Yield']],
        body: profile.cropHistory.map((h: any) => [h.year, h.crop, h.yield]),
        theme: 'grid',
        headStyles: { fillColor: amber as any, textColor: [0, 0, 0], fontStyle: 'bold' },
        styles: { fontSize: 9, cellPadding: 4 }
      });
    }

    doc.save(`BharatKisan_Profile_${profile.farmerName.replace(/\s+/g, '_')}.pdf`);
  };

  const shareProfile = async () => {
    const text = `*Bharat Kisan - Farmer Profile*\n\n*Name:* ${profile.farmerName}\n*Farm:* ${profile.farmName}\n*Location:* ${profile.location}\n*Crops:* ${profile.mainCrops.join(', ')}\n\n_Generated via Bharat Kisan App_`;
    
    try {
      await Share.share({
        title: 'My Farm Profile',
        text: text,
        url: window.location.href,
        dialogTitle: 'Share Profile'
      });
    } catch (err) {
      console.error("Sharing failed", err);
      // Fallback for web if Share API not available
      const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
      window.open(whatsappUrl, '_blank');
    }
  };

  return (
    <div className="space-y-6 pb-24 bg-black min-h-screen">
      {/* Header Profile Card */}
      <div className="bg-stone-950 rounded-b-[2.5rem] p-8 pt-12 shadow-2xl relative overflow-hidden border-b border-amber-500/10">
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl -mr-32 -mt-32" />
        <div className="relative z-10 flex flex-col items-center">
          <div className="relative mb-4 group">
            <div className="w-28 h-28 bg-stone-900 rounded-3xl flex items-center justify-center shadow-lg overflow-hidden border-2 border-amber-500/20">
              <div className="w-full h-full bg-stone-950 flex items-center justify-center">
                <User className="w-14 h-14 text-amber-500" />
              </div>
            </div>
            <button 
              onClick={handleEditToggle}
              className={`absolute -bottom-2 -right-2 p-3 rounded-2xl shadow-md transition-all ${isEditing ? 'bg-red-600 text-white' : 'bg-amber-600 text-black'}`}
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
                  className="text-2xl font-black text-white bg-stone-900 border-b-2 border-amber-500 outline-none px-4 py-2 rounded-t-lg w-full text-center focus:bg-stone-800 transition-all uppercase tracking-tighter"
                />
                <input 
                  value={profile.farmName}
                  onChange={e => setProfile({...profile, farmName: e.target.value})}
                  placeholder="Farm Name"
                  className="text-[10px] font-black text-amber-500/60 bg-transparent border-b border-stone-800 outline-none px-4 py-1 text-center w-2/3 uppercase tracking-[0.3em]"
                />
              </div>
            ) : (
              <>
                <h2 className="text-4xl font-black text-white mb-1 uppercase tracking-tighter">{profile.farmerName}</h2>
                <p className="text-amber-500/60 text-[10px] font-black uppercase tracking-[0.3em]">{profile.farmName}</p>
              </>
            )}
          </div>

          <div className="mt-6 flex gap-2">
             <div className="bg-stone-900/50 backdrop-blur-sm px-4 py-2 rounded-full border border-amber-500/10 flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-500" />
                <span className="text-[10px] font-black uppercase text-stone-300 tracking-widest">Krishi Master</span>
             </div>
             <div className="bg-stone-900/50 backdrop-blur-sm px-4 py-2 rounded-full border border-amber-500/10 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-amber-500" />
                <span className="text-[10px] font-black uppercase text-stone-300 tracking-widest">Level 12</span>
             </div>
          </div>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-3 gap-3 px-6">
        <StatsCard icon={<Briefcase className="w-4 h-4" />} label="Total Logs" value={stats.totalLogs.toString()} color="bg-stone-950" textColor="text-white" />
        <StatsCard icon={<Clock className="w-4 h-4" />} label="Activity" value={stats.lastActivity} color="bg-stone-950" textColor="text-white" isSmall />
        <StatsCard icon={<Leaf className="w-4 h-4" />} label="Focus Crop" value={stats.topCategory} color="bg-stone-950" textColor="text-white" />
      </div>

      {/* Account Settings Section */}
      <div className="px-6 space-y-3">
        <SectionHeader title="Account Management" />
        <div className="m3-card-filled p-2 bg-stone-950 divide-y divide-amber-500/5 border border-amber-500/5">
          <button 
            onClick={handleEditToggle}
            className="w-full flex items-center justify-between p-4 active:bg-stone-900 transition-colors group rounded-xl"
          >
            <div className="flex items-center gap-4 text-left">
              <div className="p-3 bg-amber-500/10 rounded-xl text-amber-500 border border-amber-500/20">
                <Edit2 className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-black text-white uppercase tracking-wider">Edit Profile</p>
                <p className="text-[9px] text-stone-500 font-bold uppercase tracking-widest">Update Identity & Operation</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-stone-700 group-hover:text-amber-500 transition-colors" />
          </button>
          
          <button 
            onClick={() => onNavigate(AppView.SETTINGS)}
            className="w-full flex items-center justify-between p-4 active:bg-stone-900 transition-colors group rounded-xl"
          >
            <div className="flex items-center gap-4 text-left">
              <div className="p-3 bg-stone-900 rounded-xl text-stone-500 border border-stone-800">
                <SettingsIcon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-black text-white uppercase tracking-wider">System Preferences</p>
                <p className="text-[9px] text-stone-500 font-bold uppercase tracking-widest">Language, Units & Alerts</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-stone-700 group-hover:text-amber-500 transition-colors" />
          </button>
        </div>
      </div>

      {/* Profile Sections */}
      <div className="space-y-6 px-6 pb-12">
        <section className="space-y-3">
          <SectionHeader title="Contact Details" />
          <div className="m3-card-filled p-4 bg-stone-950 divide-y divide-amber-500/5 border border-amber-500/5">
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
          <div className="m3-card-filled p-4 bg-stone-950 divide-y divide-amber-500/5 border border-amber-500/5">
            <div className="flex items-center gap-4 py-4">
              <div className="p-3 bg-stone-900 rounded-xl text-stone-500 border border-stone-800">
                <MapPin className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[9px] font-black text-stone-500 uppercase tracking-widest mb-1">State & Region</p>
                {isEditing ? (
                  <div className="flex flex-col gap-2">
                    <input 
                      value={profile.state} 
                      onChange={e => setProfile({...profile, state: e.target.value})}
                      placeholder="State"
                      className="flex-1 bg-stone-900 border-b border-amber-500/20 outline-none text-xs font-bold text-white p-2 rounded-t-lg focus:border-amber-500 transition-all"
                    />
                    <input 
                      value={profile.district} 
                      onChange={e => setProfile({...profile, district: e.target.value})}
                      placeholder="District"
                      className="flex-1 bg-stone-900 border-b border-amber-500/20 outline-none text-xs font-bold text-white p-2 rounded-t-lg focus:border-amber-500 transition-all"
                    />
                    <button onClick={detectLocation} disabled={isLocating} className="p-2 bg-amber-500/10 text-amber-500 rounded-full border border-amber-500/20 disabled:opacity-50 w-fit text-[9px] font-black uppercase tracking-widest flex items-center gap-2">
                      {isLocating ? <Loader2 className="w-3 h-3 animate-spin" /> : <><Navigation className="w-3 h-3" /> Auto-Detect</>}
                    </button>
                  </div>
                ) : (
                  <p className="text-xs font-bold text-white truncate">{profile.state}, {profile.district}</p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-4 py-4">
              <div className="p-3 bg-stone-900 rounded-xl text-stone-500 border border-stone-800">
                <Landmark className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[9px] font-black text-stone-500 uppercase tracking-widest mb-1">Mandal & Revenue Village</p>
                {isEditing ? (
                  <div className="flex flex-col gap-2">
                     <input 
                      value={profile.mandal} 
                      onChange={e => setProfile({...profile, mandal: e.target.value})}
                      placeholder="Mandal"
                      className="flex-1 bg-stone-900 border-b border-amber-500/20 outline-none text-xs font-bold text-white p-2 rounded-t-lg focus:border-amber-500 transition-all"
                    />
                    <input 
                      value={profile.revenue} 
                      onChange={e => setProfile({...profile, revenue: e.target.value})}
                      placeholder="Revenue Village"
                      className="flex-1 bg-stone-900 border-b border-amber-500/20 outline-none text-xs font-bold text-white p-2 rounded-t-lg focus:border-amber-500 transition-all"
                    />
                  </div>
                ) : (
                  <p className="text-xs font-bold text-white">{profile.mandal} • {profile.revenue}</p>
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
          <div className="m3-card-filled p-4 bg-stone-950 divide-y divide-amber-500/5 border border-amber-500/5">
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
          <div className="m3-card-filled p-6 bg-stone-950 border border-amber-500/5 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-stone-900 rounded-xl text-amber-500 border border-stone-800">
                <Leaf className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-[9px] font-black text-stone-500 uppercase tracking-widest">Active Crops</p>
                  {isEditing && (
                    <button onClick={addCrop} className="flex items-center gap-1.5 text-[9px] font-black text-amber-500 bg-amber-500/10 px-3 py-1.5 rounded-full active:scale-95 transition-all border border-amber-500/20 uppercase tracking-widest">
                      <Plus className="w-3.5 h-3.5" /> Add Crop
                    </button>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {profile.mainCrops.map((c: string) => (
                    <span key={c} className="inline-flex items-center gap-2 bg-stone-900 border border-stone-800 px-4 py-2 rounded-full text-[10px] font-black text-white shadow-sm uppercase tracking-widest">
                      {c}
                      {isEditing && (
                        <button onClick={() => removeCrop(c)} className="text-stone-500 hover:text-red-500 transition-colors">
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

        <section className="space-y-3">
          <SectionHeader title="Historical Performance" />
          <div className="m3-card-filled p-6 bg-stone-950 border border-amber-500/5 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-stone-900 rounded-xl text-amber-500 border border-stone-800">
                <History className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-[9px] font-black text-stone-500 uppercase tracking-widest">Yield History</p>
                  {isEditing && (
                    <button onClick={addHistoryEntry} className="flex items-center gap-1.5 text-[9px] font-black text-amber-500 bg-amber-500/10 px-3 py-1.5 rounded-full active:scale-95 transition-all border border-amber-500/20 uppercase tracking-widest">
                      <Plus className="w-3.5 h-3.5" /> Add Record
                    </button>
                  )}
                </div>
                <div className="space-y-2">
                  {profile.cropHistory.map((h: any, i: number) => (
                    <div key={i} className="flex items-center justify-between bg-stone-900/50 p-3 rounded-xl border border-stone-800">
                      <div>
                        <p className="text-xs font-black text-white uppercase tracking-wider">{h.crop}</p>
                        <p className="text-[9px] text-stone-500 font-bold uppercase tracking-widest">{h.year} • {h.yield}</p>
                      </div>
                      {isEditing && (
                        <button onClick={() => removeHistoryEntry(i)} className="p-2 text-stone-600 hover:text-red-500 transition-colors">
                          <CloseIcon className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                  {profile.cropHistory.length === 0 && (
                    <p className="text-[10px] text-stone-600 font-medium italic">No historical records added.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-3">
          <SectionHeader title="Risk & Resilience" />
          <div className="m3-card-filled p-6 bg-stone-950 border border-amber-500/5 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-stone-900 rounded-xl text-amber-500 border border-stone-800">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-[9px] font-black text-stone-500 uppercase tracking-widest">Past Issues</p>
                  {isEditing && (
                    <button onClick={addIssue} className="flex items-center gap-1.5 text-[9px] font-black text-amber-500 bg-amber-500/10 px-3 py-1.5 rounded-full active:scale-95 transition-all border border-amber-500/20 uppercase tracking-widest">
                      <Plus className="w-3.5 h-3.5" /> Add Issue
                    </button>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {profile.pastIssues.map((issue: string, i: number) => (
                    <span key={i} className="inline-flex items-center gap-2 bg-stone-900 border border-stone-800 px-4 py-2 rounded-full text-[10px] font-black text-white shadow-sm uppercase tracking-widest">
                      {issue}
                      {isEditing && (
                        <button onClick={() => removeIssue(i)} className="text-stone-500 hover:text-red-500 transition-colors">
                          <CloseIcon className="w-4 h-4" />
                        </button>
                      )}
                    </span>
                  ))}
                  {profile.pastIssues.length === 0 && (
                    <p className="text-[10px] text-stone-600 font-medium italic">No past issues recorded.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-3">
          <SectionHeader title="Data & Sharing" />
          <div className="m3-card-filled p-2 bg-stone-950 divide-y divide-amber-500/5 border border-amber-500/5">
            <button 
              onClick={exportProfilePDF}
              className="w-full flex items-center justify-between p-4 active:bg-stone-900 transition-colors group rounded-xl"
            >
              <div className="flex items-center gap-4 text-left">
                <div className="p-3 bg-stone-900 rounded-xl text-stone-500 border border-stone-800">
                  <Download className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-black text-white uppercase tracking-wider">Export Profile (PDF)</p>
                  <p className="text-[9px] text-stone-500 font-bold uppercase tracking-widest">Download comprehensive farm report</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-stone-700 group-hover:text-amber-500 transition-colors" />
            </button>
            
            <button 
              onClick={shareProfile}
              className="w-full flex items-center justify-between p-4 active:bg-stone-900 transition-colors group rounded-xl"
            >
              <div className="flex items-center gap-4 text-left">
                <div className="p-3 bg-stone-900 rounded-xl text-stone-500 border border-stone-800">
                  <Share2 className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-black text-white uppercase tracking-wider">Share Profile</p>
                  <p className="text-[9px] text-stone-500 font-bold uppercase tracking-widest">Share via WhatsApp or SMS</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-stone-700 group-hover:text-amber-500 transition-colors" />
            </button>
          </div>
        </section>

        {isEditing ? (
          <div className="grid grid-cols-1 gap-3 mt-8">
            <button onClick={handleSave} className="w-full bg-amber-600 text-black font-black py-4 rounded-full flex items-center justify-center gap-3 shadow-xl shadow-amber-900/20 active:scale-[0.98] transition-all uppercase text-[10px] tracking-widest">
              <CheckCircle2 className="w-5 h-5" /> Save Changes
            </button>
            <button onClick={handleEditToggle} className="w-full bg-stone-900 text-stone-500 font-black py-4 rounded-full flex items-center justify-center gap-2 active:scale-[0.98] transition-all text-[10px] uppercase tracking-widest border border-stone-800">
              Discard Changes
            </button>
          </div>
        ) : (
          <div className="mt-8 space-y-4">
            <button onClick={onLogout} className="w-full bg-red-600/10 text-red-500 font-black py-4 rounded-full flex items-center justify-center gap-3 active:scale-[0.98] transition-all border border-red-500/20 uppercase text-[10px] tracking-widest">
              <LogOut className="w-5 h-5" /> Sign Out
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

const SectionHeader: React.FC<{ title: string }> = ({ title }) => (
  <h3 className="text-[10px] font-black text-amber-500/40 uppercase tracking-[0.3em] ml-1 mb-1">{title}</h3>
);

const StatsCard: React.FC<{ icon: React.ReactNode, label: string, value: string, color: string, textColor: string, isSmall?: boolean }> = ({ icon, label, value, color, textColor, isSmall }) => (
  <div className={`${color} p-4 rounded-2xl border border-amber-500/5 flex flex-col justify-between h-32 shadow-sm transition-all`}>
    <div className={`p-2 w-fit rounded-xl bg-stone-900 border border-stone-800 ${textColor}`}>{icon}</div>
    <div className="truncate">
      <p className={`text-[8px] font-black uppercase tracking-[0.2em] text-stone-500 mb-1 truncate`}>{label}</p>
      <p className={`${isSmall ? 'text-[10px]' : 'text-xs'} font-black ${textColor} truncate uppercase tracking-wider`}>{value}</p>
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
    <div className="p-3 bg-stone-900 rounded-xl text-stone-500 border border-stone-800">
      {React.cloneElement(icon as React.ReactElement<any>, { className: 'w-5 h-5' })}
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-[9px] font-black text-stone-500 uppercase tracking-widest mb-1">{label}</p>
      {isEditing ? (
        <input 
          type={type}
          value={value} 
          onChange={e => onChange(e.target.value)}
          className="w-full bg-stone-900 border-b border-amber-500/20 outline-none text-xs font-bold text-white p-2 rounded-t-lg focus:border-amber-500 transition-all"
        />
      ) : (
        <p className="text-xs font-bold text-white truncate">{value || 'Not provided'}</p>
      )}
    </div>
  </div>
);

export default Profile;
