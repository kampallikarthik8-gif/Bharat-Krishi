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
  History,
  Info,
  QrCode,
  Globe,
  Sparkles
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
import { useDialogs } from '../src/components/DialogProvider';
import { motion, AnimatePresence } from 'motion/react';

interface ProfileProps {
  onLogout: () => void;
  onNavigate: (view: AppView) => void;
}

const WEATHER_API_KEY = import.meta.env.VITE_WEATHER_API_KEY;

const Profile: React.FC<ProfileProps> = ({ onLogout, onNavigate }) => {
  const { user, profile: firebaseProfile, activeFarmId, updateProfileLocal } = useFirebase();
  const { alert, prompt } = useDialogs();
  const [isEditing, setIsEditing] = React.useState(false);
  const [isLocating, setIsLocating] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState<'farm' | 'identity' | 'utility'>('farm');
  
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
    mainCrops: [] as string[],
    soilType: '',
    irrigation: '',
    terrain: '',
    cropHistory: [] as Array<{ year: string; crop: string; yield: string }>,
    pastIssues: [] as string[]
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

    updateProfileLocal(updatedData);
    setIsEditing(false);
    setBackupProfile(profile);

    try {
      updateDoc(doc(db, 'users', activeFarmId), updatedData).catch((err) => {
        console.warn("Background profile update warning:", err);
      });
    } catch (error) {
      console.error("Error updating profile:", error);
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
      alert({
        title: 'GPS Error',
        message: 'GPS Access Denied or Location Error. Please enable location services for Bharat Kisan.'
      });
    } finally {
      setIsLocating(false);
    }
  };

  const addCrop = () => {
    prompt({
      title: 'Add Crop',
      message: 'Enter the name of the new crop:',
      onConfirm: (crop) => {
        if (crop && crop.trim()) {
          const formatted = crop.trim();
          if (!profile.mainCrops.includes(formatted)) {
            setProfile(prev => ({ ...prev, mainCrops: [...prev.mainCrops, formatted] }));
          }
        }
      }
    });
  };

  const removeCrop = (cropToRemove: string) => {
    setProfile(prev => ({ ...prev, mainCrops: prev.mainCrops.filter(c => c !== cropToRemove) }));
  };

  const addHistoryEntry = () => {
    prompt({
      title: 'Add History',
      message: 'Enter Year (e.g. 2023):',
      onConfirm: (year) => {
        if (!year) return;
        prompt({
          title: 'Add History',
          message: 'Enter Crop Name:',
          onConfirm: (crop) => {
            if (!crop) return;
            prompt({
              title: 'Add History',
              message: 'Enter Yield (e.g. 4.5 tons/ha):',
              onConfirm: (yieldVal) => {
                if (!yieldVal) return;
                setProfile(prev => ({
                  ...prev,
                  cropHistory: [...prev.cropHistory, { year, crop, yield: yieldVal }]
                }));
              }
            });
          }
        });
      }
    });
  };

  const removeHistoryEntry = (index: number) => {
    setProfile(prev => ({
      ...prev,
      cropHistory: prev.cropHistory.filter((_, i) => i !== index)
    }));
  };

  const addIssue = () => {
    prompt({
      title: 'Add Issue',
      message: 'Enter past issue (e.g. Locust attack 2022):',
      onConfirm: (issue) => {
        if (issue && issue.trim()) {
          setProfile(prev => ({
            ...prev,
            pastIssues: [...prev.pastIssues, issue.trim()]
          }));
        }
      }
    });
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
    const amber: [number, number, number] = [217, 119, 6];
    const dark: [number, number, number] = [24, 24, 27];
    
    // Header
    doc.setFillColor(dark[0], dark[1], dark[2]);
    doc.rect(0, 0, 210, 40, 'F');
    
    doc.setTextColor(251, 191, 36);
    doc.setFontSize(22);
    doc.text('BHARAT KISAN - DIGITAL GREEN PASS', 14, 25);
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(9);
    doc.text(`Verified Agricultural Passport • Generated: ${new Date().toLocaleString()}`, 14, 33);

    // Basic Info
    autoTable(doc, {
      startY: 50,
      head: [['Category', 'Details']],
      body: [
        ['Farmer Name', profile.farmerName],
        ['Farm Name', profile.farmName],
        ['Contact Details', `${profile.phone} | ${profile.email}`],
        ['Location Data', `${profile.location} (${profile.state}, ${profile.district})`],
        ['Physical Area', `${profile.farmSize} ${profile.sizeUnit}`],
        ['Soil Classification', profile.soilType],
        ['Irrigation Delivery', profile.irrigation]
      ],
      theme: 'grid',
      headStyles: { fillColor: amber as any, textColor: [255, 255, 255], fontStyle: 'bold' },
      styles: { fontSize: 9, cellPadding: 4 }
    });

    // Crops
    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 10,
      head: [['Active Main Crops Registered']],
      body: profile.mainCrops.map(c => [c]),
      theme: 'grid',
      headStyles: { fillColor: [4, 120, 87] as any, textColor: [255, 255, 255], fontStyle: 'bold' },
      styles: { fontSize: 9, cellPadding: 4 }
    });

    // History
    if (profile.cropHistory.length > 0) {
      autoTable(doc, {
        startY: (doc as any).lastAutoTable.finalY + 10,
        head: [['Year Registered', 'Crop Type', 'Yield Resulted']],
        body: profile.cropHistory.map((h: any) => [h.year, h.crop, h.yield]),
        theme: 'grid',
        headStyles: { fillColor: amber as any, textColor: [255, 255, 255], fontStyle: 'bold' },
        styles: { fontSize: 9, cellPadding: 4 }
      });
    }

    doc.save(`BharatKisan_GoldenPass_${profile.farmerName.replace(/\s+/g, '_')}.pdf`);
  };

  const shareProfile = async () => {
    const text = `*Bharat Kisan - Digital Agri Passport*\n\n*Farmer Name:* ${profile.farmerName}\n*Farm Estate:* ${profile.farmName}\n*Region:* ${profile.location}\n*Active Crops:* ${profile.mainCrops.join(', ')}\n\n_Generated via Bharat Kisan Smart Farming Hub_`;
    
    try {
      await Share.share({
        title: 'Agricultural Passport',
        text: text,
        url: window.location.href,
        dialogTitle: 'Share Profile Passport'
      });
    } catch (err) {
      console.error("Sharing failed", err);
      const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
      window.open(whatsappUrl, '_blank');
    }
  };

  return (
    <div id="profile-pane-container" className="space-y-6 pb-28 bg-stone-950 min-h-screen text-stone-100 font-sans">
      {/* Exquisite Digital Passport Header */}
      <div id="passport-header-section" className="relative pt-12 pb-8 px-6 bg-radial-gradient from-emerald-950/20 to-stone-950 border-b border-white/5 overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/5 rounded-full blur-[100px] -mr-20 -mt-20 pointer-events-none" />
        <div className="absolute top-1/2 left-10 w-64 h-64 bg-amber-500/5 rounded-full blur-[120px] pointer-events-none" />
        
        <div className="relative z-10 max-w-xl mx-auto flex flex-col items-center">
          {/* Passport Identity Frame */}
          <div className="relative mb-6">
            <motion.div 
              whileHover={{ scale: 1.02 }}
              className="relative w-32 h-32 rounded-[2rem] bg-gradient-to-tr from-emerald-600/30 via-amber-500/20 to-emerald-800/10 p-[1.5px] shadow-2xl backdrop-blur-md"
            >
              <div className="w-full h-full bg-stone-900/90 rounded-[2rem] flex items-center justify-center overflow-hidden border border-white/5 relative group">
                <div className="absolute inset-0 bg-gradient-to-t from-emerald-900/40 to-transparent opacity-60 pointer-events-none" />
                <User className="w-16 h-16 text-emerald-400" />
                <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              </div>
            </motion.div>
            
            <button 
              id="btn-toggle-edit"
              onClick={handleEditToggle}
              className={`absolute -bottom-2 -right-2 p-3 rounded-2xl shadow-xl transition-all duration-300 transform active:scale-95 ${
                isEditing 
                  ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-950/40' 
                  : 'bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-black shadow-emerald-950/40'
              }`}
              title={isEditing ? "Cancel" : "Edit Passport"}
            >
              {isEditing ? <RotateCcw className="w-4 h-4" /> : <Edit2 className="w-4 h-4" />}
            </button>
          </div>

          <div className="text-center w-full px-4 max-w-md">
            {isEditing ? (
              <div className="space-y-3 bg-stone-900/80 p-4 rounded-2xl border border-white/5 backdrop-blur-md shadow-2xl">
                <div className="text-left">
                  <label className="text-[9px] font-black uppercase text-emerald-400 tracking-wider">Farmer Name</label>
                  <input 
                    id="input-farmer-name"
                    value={profile.farmerName}
                    onChange={e => setProfile({...profile, farmerName: e.target.value})}
                    placeholder="Full Farmer Name"
                    className="w-full text-base font-bold text-white bg-stone-950/90 border border-white/10 focus:border-emerald-500 rounded-xl px-4 py-2.5 outline-none transition-all uppercase tracking-tight text-center"
                  />
                </div>
                <div className="text-left">
                  <label className="text-[9px] font-black uppercase text-amber-500/80 tracking-wider">Farm Estate Name</label>
                  <input 
                    id="input-farm-name"
                    value={profile.farmName}
                    onChange={e => setProfile({...profile, farmName: e.target.value})}
                    placeholder="Farm Estate"
                    className="w-full text-xs font-bold text-amber-500 bg-stone-950/90 border border-white/10 focus:border-amber-500 rounded-xl px-4 py-2.5 outline-none transition-all uppercase tracking-[0.1em] text-center"
                  />
                </div>
              </div>
            ) : (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-2"
              >
                <div className="flex items-center justify-center gap-2">
                  <span className="bg-emerald-500/10 text-emerald-400 text-[9px] font-black px-2.5 py-1 rounded-full uppercase tracking-widest border border-emerald-500/20 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> Gold Tier ID
                  </span>
                  <span className="bg-stone-900 text-stone-400 text-[9px] font-mono px-2.5 py-1 rounded-full border border-white/5">
                    ID: BK-{activeFarmId?.slice(0, 5).toUpperCase() || 'SYS'}
                  </span>
                </div>
                <h2 className="text-3xl font-black text-white hover:text-emerald-300 transition-colors uppercase tracking-tight leading-none mt-1">
                  {profile.farmerName || 'Registered Farmer'}
                </h2>
                <p className="text-amber-500/80 text-xs font-black uppercase tracking-[0.25em] py-0.5">
                  ✦ {profile.farmName || 'Kisan Estate'} ✦
                </p>
              </motion.div>
            )}
          </div>

          {/* Gamified Krishi Level Badge */}
          <div className="mt-6 flex flex-col items-center w-full max-w-sm px-4">
            <div className="w-full bg-stone-900/60 p-3 rounded-2xl border border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 bg-gradient-to-tr from-amber-500 to-amber-600 rounded-xl flex items-center justify-center text-stone-950 shadow-md">
                  <Award className="w-5 h-5 font-black" />
                </div>
                <div className="text-left">
                  <p className="text-[10px] font-black uppercase text-amber-500 tracking-wider">Krishi Master</p>
                  <p className="text-[8px] text-stone-400 font-bold uppercase tracking-widest">Growth Tier Level 12</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[9px] font-mono font-bold text-stone-400 uppercase tracking-widest">Progress</p>
                <p className="text-xs font-black text-white font-mono">8,400 <span className="text-stone-500 text-[10px]">/ 10k XP</span></p>
              </div>
            </div>
            
            {/* Smooth glowing progress indicator */}
            <div className="w-full bg-stone-900 h-1.5 rounded-full mt-2 overflow-hidden border border-white/5 relative">
              <div 
                className="bg-gradient-to-r from-amber-500 via-emerald-500 to-emerald-400 h-full rounded-full transition-all duration-1000 shadow-lg shadow-emerald-500/20" 
                style={{ width: '84%' }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Bento Grid Analytics */}
      <div id="passport-metrics-bento" className="grid grid-cols-3 gap-3 px-6 max-w-xl mx-auto">
        <div className="bg-stone-900/50 p-4 rounded-2xl border border-white/5 flex flex-col justify-between h-28 transform active:scale-95 transition-all">
          <div className="p-2 w-fit rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/10">
            <Briefcase className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[8px] font-black uppercase tracking-[0.15em] text-stone-500 mb-0.5">Total Logs</p>
            <p className="text-base font-black text-white uppercase tracking-tight">{stats.totalLogs}</p>
          </div>
        </div>

        <div className="bg-stone-900/50 p-4 rounded-2xl border border-white/5 flex flex-col justify-between h-28 transform active:scale-95 transition-all">
          <div className="p-2 w-fit rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/10">
            <Clock className="w-4 h-4" />
          </div>
          <div className="overflow-hidden">
            <p className="text-[8px] font-black uppercase tracking-[0.15em] text-stone-500 mb-0.5">Last Log</p>
            <p className="text-[10px] font-black text-white truncate uppercase tracking-wider">{stats.lastActivity}</p>
          </div>
        </div>

        <div className="bg-stone-900/50 p-4 rounded-2xl border border-white/5 flex flex-col justify-between h-28 transform active:scale-95 transition-all">
          <div className="p-2 w-fit rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/10">
            <Leaf className="w-4 h-4" />
          </div>
          <div className="overflow-hidden">
            <p className="text-[8px] font-black uppercase tracking-[0.15em] text-stone-500 mb-0.5">Sovereign</p>
            <p className="text-[10px] font-black text-stone-200 truncate uppercase tracking-wider">{stats.topCategory}</p>
          </div>
        </div>
      </div>

      {/* Clean Tab Segment Switcher */}
      <div id="passport-tabs-wrapper" className="px-6 max-w-xl mx-auto">
        <div className="bg-stone-900/90 p-1.5 rounded-2xl border border-white/5 flex gap-1">
          <button 
            id="tab-btn-farm"
            onClick={() => setActiveTab('farm')}
            className={`flex-1 py-3 px-1 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-300 flex items-center justify-center gap-2 ${
              activeTab === 'farm' 
                ? 'bg-gradient-to-tr from-emerald-600 to-emerald-500 text-stone-950 shadow-md' 
                : 'text-stone-400 hover:text-white hover:bg-stone-800/40'
            }`}
          >
            <Leaf className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Farm Lab</span>
          </button>
          
          <button 
            id="tab-btn-identity"
            onClick={() => setActiveTab('identity')}
            className={`flex-1 py-3 px-1 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-300 flex items-center justify-center gap-2 ${
              activeTab === 'identity' 
                ? 'bg-gradient-to-tr from-emerald-600 to-emerald-500 text-stone-950 shadow-md' 
                : 'text-stone-400 hover:text-white hover:bg-stone-800/40'
            }`}
          >
            <QrCode className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Identity Info</span>
          </button>

          <button 
            id="tab-btn-utility"
            onClick={() => setActiveTab('utility')}
            className={`flex-1 py-3 px-1 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-300 flex items-center justify-center gap-2 ${
              activeTab === 'utility' 
                ? 'bg-gradient-to-tr from-emerald-600 to-emerald-500 text-stone-950 shadow-md' 
                : 'text-stone-400 hover:text-white hover:bg-stone-800/40'
            }`}
          >
            <Globe className="w-3.5 h-3.5" /> <span className="hidden sm:inline">System Actions</span>
          </button>
        </div>
      </div>

      {/* Main Tab Panels with AnimatePresence */}
      <div className="px-6 max-w-xl mx-auto">
        <AnimatePresence mode="wait">
          {activeTab === 'farm' && (
            <motion.div
              key="panel-farm"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
              className="space-y-6"
            >
              {/* Profile Crop Intelligence Section */}
              <div className="bg-stone-900/40 rounded-3xl p-5 border border-white/5 backdrop-blur-sm self-start">
                <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-3">
                  <div className="flex items-center gap-2">
                    <Leaf className="w-4 h-4 text-emerald-400" />
                    <span className="text-[10px] font-black uppercase text-stone-400 tracking-widest">Active Crop Intelligence</span>
                  </div>
                  {isEditing && (
                    <button 
                      id="btn-add-crop"
                      onClick={addCrop} 
                      className="flex items-center gap-1 text-[9px] font-black text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 px-3 py-1.5 rounded-full outline-none border border-emerald-500/20 uppercase tracking-widest transition-all active:scale-95"
                    >
                      <Plus className="w-3 h-3" /> Add Crop
                    </button>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  {profile.mainCrops.map((c: string) => (
                    <span key={c} className="inline-flex items-center gap-2 bg-stone-950 border border-white/5 px-4 py-2 rounded-2xl text-[10px] font-mono text-emerald-300 uppercase tracking-wider shadow-sm">
                      ● {c}
                      {isEditing && (
                        <button onClick={() => removeCrop(c)} className="text-stone-500 hover:text-rose-500 transition-colors ml-1 p-0.5">
                          <CloseIcon className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </span>
                  ))}
                  {profile.mainCrops.length === 0 && (
                    <p className="text-[10px] text-stone-500 italic py-2">No registered crops added.</p>
                  )}
                </div>
              </div>

              {/* Crop Historical Performance */}
              <div className="bg-stone-900/40 rounded-3xl p-5 border border-white/5 backdrop-blur-sm">
                <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-3">
                  <div className="flex items-center gap-2">
                    <History className="w-4 h-4 text-emerald-400" />
                    <span className="text-[10px] font-black uppercase text-stone-400 tracking-widest">Yield Registries</span>
                  </div>
                  {isEditing && (
                    <button 
                      id="btn-add-yield"
                      onClick={addHistoryEntry} 
                      className="flex items-center gap-1 text-[9px] font-black text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 px-3 py-1.5 rounded-full outline-none border border-emerald-500/20 uppercase tracking-widest transition-all active:scale-95"
                    >
                      <Plus className="w-3 h-3" /> Add Yield
                    </button>
                  )}
                </div>

                <div className="space-y-2.5">
                  {profile.cropHistory.map((h: any, i: number) => (
                    <div key={i} className="flex items-center justify-between bg-stone-950 p-3.5 rounded-2xl border border-white/5 hover:border-emerald-500/10 transition-all">
                      <div>
                        <p className="text-xs font-black text-stone-200 uppercase tracking-wider">{h.crop}</p>
                        <p className="text-[9px] text-stone-500 font-bold uppercase tracking-widest mt-0.5">{h.year} • {h.yield}</p>
                      </div>
                      {isEditing && (
                        <button onClick={() => removeHistoryEntry(i)} className="p-2 text-stone-500 hover:text-rose-500 transition-colors">
                          <CloseIcon className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                  {profile.cropHistory.length === 0 && (
                    <p className="text-[10px] text-stone-500 italic py-2">No past history registered.</p>
                  )}
                </div>
              </div>

              {/* Environmental Intelligence Details */}
              <div className="bg-stone-900/40 rounded-3xl p-5 border border-white/5 divide-y divide-white/5 backdrop-blur-sm">
                <div className="flex items-center gap-2 mb-2 pb-3 border-b border-white/5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span className="text-[10px] font-black uppercase text-stone-400 tracking-widest">Hydrology & Earth Stats</span>
                </div>

                <ProfileItem 
                  icon={<Droplets />} 
                  label="Irrigation Infrastructure" 
                  value={profile.irrigation} 
                  isEditing={isEditing}
                  onChange={val => setProfile({...profile, irrigation: val})}
                />
                
                <ProfileItem 
                  icon={<Layers />} 
                  label="Soil Classification" 
                  value={profile.soilType} 
                  isEditing={isEditing}
                  onChange={val => setProfile({...profile, soilType: val})}
                />

                <ProfileItem 
                  icon={<Navigation />} 
                  label="Farmland Terrain" 
                  value={profile.terrain} 
                  isEditing={isEditing}
                  onChange={val => setProfile({...profile, terrain: val})}
                />
              </div>

              {/* Risk Mitigation Issues */}
              <div className="bg-stone-900/40 rounded-3xl p-5 border border-white/5 backdrop-blur-sm">
                <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-3">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-400" />
                    <span className="text-[10px] font-black uppercase text-stone-400 tracking-widest">Soil & Outbreak Incidents</span>
                  </div>
                  {isEditing && (
                    <button 
                      id="btn-add-issue"
                      onClick={addIssue} 
                      className="flex items-center gap-1 text-[9px] font-black text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 px-3 py-1.5 rounded-full outline-none border border-rose-500/20 uppercase tracking-widest transition-all active:scale-95"
                    >
                      <Plus className="w-3 h-3" /> Add Threat
                    </button>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  {profile.pastIssues.map((issue: string, i: number) => (
                    <span key={i} className="inline-flex items-center gap-2 bg-rose-950/20 border border-rose-500/10 px-4 py-2 rounded-2xl text-[10px] font-mono text-rose-300 uppercase tracking-wider">
                      ⚠ {issue}
                      {isEditing && (
                        <button onClick={() => removeIssue(i)} className="text-rose-500 hover:text-rose-400 transition-colors ml-1 p-0.5">
                          <CloseIcon className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </span>
                  ))}
                  {profile.pastIssues.length === 0 && (
                    <p className="text-[10px] text-stone-500 italic py-2">No soil or pathogen alerts recorded.</p>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'identity' && (
            <motion.div
              key="panel-identity"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
              className="space-y-6"
            >
              {/* Geolocation Section */}
              <div className="bg-stone-900/40 rounded-3xl p-5 border border-white/5 divide-y divide-white/5 backdrop-blur-sm">
                <div className="flex items-center gap-2 mb-2 pb-3 border-b border-white/5">
                  <MapPin className="w-4 h-4 text-emerald-400" />
                  <span className="text-[10px] font-black uppercase text-stone-400 tracking-widest">Regional Demography</span>
                </div>

                <div className="flex items-center gap-4 py-4">
                  <div className="p-3 bg-stone-950 rounded-2xl text-stone-400 border border-white/5">
                    <Globe className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[9px] font-black text-stone-500 uppercase tracking-widest mb-1">State & District Coordinates</p>
                    {isEditing ? (
                      <div className="flex flex-col gap-2.5">
                        <input 
                          id="input-state"
                          value={profile.state} 
                          onChange={e => setProfile({...profile, state: e.target.value})}
                          placeholder="State Name"
                          className="flex-1 bg-stone-950 border border-white/10 outline-none text-xs font-bold text-white p-3 rounded-xl focus:border-emerald-500 transition-all uppercase"
                        />
                        <input 
                          id="input-district"
                          value={profile.district} 
                          onChange={e => setProfile({...profile, district: e.target.value})}
                          placeholder="District Name"
                          className="flex-1 bg-stone-950 border border-white/10 outline-none text-xs font-bold text-white p-3 rounded-xl focus:border-emerald-500 transition-all uppercase"
                        />
                        <button 
                          id="btn-detect-loc"
                          onClick={detectLocation} 
                          disabled={isLocating} 
                          className="py-2.5 px-4 bg-emerald-500/10 hover:bg-emerald-500/15 text-emerald-400 rounded-xl border border-emerald-500/20 disabled:opacity-50 w-full text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-1.5 transition-all"
                        >
                          {isLocating ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Navigation className="w-4 h-4" /> Sync GPS Coordinates</>}
                        </button>
                      </div>
                    ) : (
                      <p className="text-xs font-bold text-white uppercase tracking-wider">{profile.state || 'N/A'}{profile.district ? `, ${profile.district}` : ''}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-4 py-4">
                  <div className="p-3 bg-stone-950 rounded-2xl text-stone-400 border border-white/5">
                    <Landmark className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[9px] font-black text-stone-500 uppercase tracking-widest mb-1">Mandal & Revenue Township</p>
                    {isEditing ? (
                      <div className="flex flex-col gap-2.5">
                        <input 
                          id="input-mandal"
                          value={profile.mandal} 
                          onChange={e => setProfile({...profile, mandal: e.target.value})}
                          placeholder="Mandal Sector"
                          className="flex-1 bg-stone-950 border border-white/10 outline-none text-xs font-bold text-white p-3 rounded-xl focus:border-emerald-500 transition-all uppercase"
                        />
                        <input 
                          id="input-revenue"
                          value={profile.revenue} 
                          onChange={e => setProfile({...profile, revenue: e.target.value})}
                          placeholder="Revenue Village Code"
                          className="flex-1 bg-stone-950 border border-white/10 outline-none text-xs font-bold text-white p-3 rounded-xl focus:border-emerald-500 transition-all uppercase"
                        />
                      </div>
                    ) : (
                      <p className="text-xs font-bold text-white uppercase tracking-wider">
                        {profile.mandal || 'N/A'} {profile.revenue ? `• ${profile.revenue}` : ''}
                      </p>
                    )}
                  </div>
                </div>

                <ProfileItem 
                  icon={<Maximize2 />} 
                  label={`Total Farm Area (${profile.sizeUnit})`} 
                  value={profile.farmSize} 
                  isEditing={isEditing}
                  type="number"
                  onChange={val => setProfile({...profile, farmSize: val})}
                />
              </div>

              {/* Direct Communications */}
              <div className="bg-stone-900/40 rounded-3xl p-5 border border-white/5 divide-y divide-white/5 backdrop-blur-sm">
                <div className="flex items-center gap-2 mb-2 pb-3 border-b border-white/5">
                  <Mail className="w-4 h-4 text-emerald-400" />
                  <span className="text-[10px] font-black uppercase text-stone-400 tracking-widest">Communications Registry</span>
                </div>

                <ProfileItem 
                  icon={<Phone />} 
                  label="Registered Mobile Identifier" 
                  value={profile.phone} 
                  isEditing={isEditing}
                  onChange={val => setProfile({...profile, phone: val})}
                />
                
                <ProfileItem 
                  icon={<Mail />} 
                  label="Verified Cloud E-Mail Address" 
                  value={profile.email} 
                  isEditing={isEditing}
                  onChange={val => setProfile({...profile, email: val})}
                />
              </div>
            </motion.div>
          )}

          {activeTab === 'utility' && (
            <motion.div
              key="panel-utility"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
              className="space-y-4"
            >
              {/* Export & Cert Group */}
              <div className="bg-stone-900/40 rounded-3xl p-2 border border-white/5 divide-y divide-white/5 backdrop-blur-sm">
                <button 
                  id="btn-export-pdf"
                  onClick={exportProfilePDF}
                  className="w-full flex items-center justify-between p-4 bg-stone-900/20 active:bg-stone-900/60 transition-colors group rounded-2xl outline-none"
                >
                  <div className="flex items-center gap-4 text-left">
                    <div className="p-3 bg-stone-950 rounded-2xl text-stone-400 border border-white/5 group-hover:text-emerald-400 group-hover:border-emerald-500/20 transition-all">
                      <Download className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-black text-white uppercase tracking-wider">Export Green Digital Pass</p>
                      <p className="text-[9px] text-stone-500 font-bold uppercase tracking-widest mt-0.5">Generate audited credentials PDF</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-stone-700 group-hover:text-emerald-500 transition-colors" />
                </button>
                
                <button 
                  id="btn-share-passport"
                  onClick={shareProfile}
                  className="w-full flex items-center justify-between p-4 bg-stone-900/20 active:bg-stone-900/60 transition-colors group rounded-2xl outline-none"
                >
                  <div className="flex items-center gap-4 text-left">
                    <div className="p-3 bg-stone-950 rounded-2xl text-stone-400 border border-white/5 group-hover:text-emerald-400 group-hover:border-emerald-500/20 transition-all">
                      <Share2 className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-black text-white uppercase tracking-wider">Broadcast Credentials</p>
                      <p className="text-[9px] text-stone-500 font-bold uppercase tracking-widest mt-0.5">Share via secure WhatsApp link</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-stone-700 group-hover:text-emerald-500 transition-colors" />
                </button>
              </div>

              {/* Preferences Configuration Link */}
              <div className="bg-stone-900/40 rounded-3xl p-2 border border-white/5 divide-y divide-white/5 backdrop-blur-sm">
                <button 
                  id="btn-nav-settings"
                  onClick={() => onNavigate(AppView.SETTINGS)}
                  className="w-full flex items-center justify-between p-4 bg-stone-900/20 active:bg-stone-900/60 transition-colors group rounded-2xl outline-none"
                >
                  <div className="flex items-center gap-4 text-left">
                    <div className="p-3 bg-stone-950 rounded-xl text-stone-400 border border-white/5 group-hover:text-amber-500 group-hover:border-amber-500/20 transition-all">
                      <SettingsIcon className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-black text-white uppercase tracking-wider">Local Platform Preferences</p>
                      <p className="text-[9px] text-stone-500 font-bold uppercase tracking-widest mt-0.5">Toggle language settings & telemetry</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-stone-700 group-hover:text-amber-500 transition-colors" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Editing State Confirm Panel / Core Logout */}
      <div id="passport-action-panel" className="px-6 max-w-xl mx-auto pt-6">
        {isEditing ? (
          <div className="grid grid-cols-2 gap-3">
            <button 
              id="btn-save-profile"
              onClick={handleSave} 
              className="w-full bg-gradient-to-tr from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-stone-950 font-black py-4 rounded-2xl flex items-center justify-center gap-2 shadow-xl shadow-emerald-900/10 active:scale-[0.98] transition-all uppercase text-[10px] tracking-widest"
            >
              <CheckCircle2 className="w-4 h-4" /> Save Passport
            </button>
            <button 
              id="btn-cancel-edit"
              onClick={handleEditToggle} 
              className="w-full bg-stone-900 hover:bg-stone-800 text-stone-400 font-black py-4 rounded-2xl flex items-center justify-center gap-2 active:scale-[0.98] transition-all text-[10px] uppercase tracking-widest border border-white/5"
            >
              Cancel Edit
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <button 
              id="btn-signout"
              onClick={onLogout} 
              className="w-full bg-stone-900/40 hover:bg-rose-950/20 text-rose-500 hover:text-rose-400 hover:border-rose-500/20 font-black py-4 rounded-2xl flex items-center justify-center gap-2.5 active:scale-[0.98] transition-all border border-white/5 uppercase text-[10px] tracking-widest"
            >
              <LogOut className="w-4 h-4" /> Exit Digital Hub
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

const ProfileItem: React.FC<{ 
  icon: React.ReactNode, 
  label: string, 
  value: string, 
  isEditing: boolean, 
  type?: string,
  onChange: (val: string) => void 
}> = ({ icon, label, value, isEditing, type = "text", onChange }) => (
  <div className="flex items-center gap-4 py-4">
    <div className="p-3 bg-stone-950 rounded-2xl text-stone-500 border border-white/5">
      {React.cloneElement(icon as React.ReactElement<any>, { className: 'w-5 h-5' })}
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-[9px] font-black text-stone-500 uppercase tracking-widest mb-1">{label}</p>
      {isEditing ? (
        <input 
          type={type}
          value={value} 
          onChange={e => onChange(e.target.value)}
          className="w-full bg-stone-950 border border-white/10 outline-none text-xs font-bold text-white p-3 rounded-xl focus:border-emerald-500 transition-all uppercase"
        />
      ) : (
        <p className="text-xs font-bold text-white truncate uppercase tracking-wide">{value || 'Not provided'}</p>
      )}
    </div>
  </div>
);

export default Profile;
