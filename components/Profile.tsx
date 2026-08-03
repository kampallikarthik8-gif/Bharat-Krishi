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
  Sparkles,
  Check,
  Copy,
  Sprout,
  Compass
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
  const [copiedId, setCopiedId] = React.useState(false);
  
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
      try {
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
      } catch (err) {
        console.error("Error parsing journal stats:", err);
      }
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
      message: 'Enter the name of the new crop (e.g. Wheat, Maize, Cotton):',
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
      title: 'Add Yield History',
      message: 'Enter Year (e.g. 2024):',
      onConfirm: (year) => {
        if (!year) return;
        prompt({
          title: 'Add Yield History',
          message: 'Enter Crop Name:',
          onConfirm: (crop) => {
            if (!crop) return;
            prompt({
              title: 'Add Yield History',
              message: 'Enter Yield Output (e.g. 5.2 tons/ha):',
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
      title: 'Add Incident / Threat',
      message: 'Enter past incident or threat (e.g. Locust attack 2023):',
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

  const copyKisanId = () => {
    const kisanId = `BK-${activeFarmId?.slice(0, 8).toUpperCase() || 'SYS'}`;
    navigator.clipboard.writeText(kisanId);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const exportProfilePDF = () => {
    const doc = new jsPDF();
    
    // Theme Colors
    const emerald: [number, number, number] = [16, 185, 129];
    const dark: [number, number, number] = [17, 24, 19];
    
    // Header
    doc.setFillColor(dark[0], dark[1], dark[2]);
    doc.rect(0, 0, 210, 42, 'F');
    
    doc.setTextColor(16, 185, 129);
    doc.setFontSize(20);
    doc.text('BHARAT KISAN - DIGITAL GREEN PASSPORT', 14, 24);
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(9);
    doc.text(`Verified Agricultural Credentials • Issued: ${new Date().toLocaleDateString()}`, 14, 33);

    // Basic Info
    autoTable(doc, {
      startY: 50,
      head: [['Attribute', 'Registered Detail']],
      body: [
        ['Farmer Name', profile.farmerName || 'Not specified'],
        ['Farm Estate', profile.farmName || 'Kisan Estate'],
        ['Contact Mobile', profile.phone || 'N/A'],
        ['E-Mail Address', profile.email || 'N/A'],
        ['Geographic Location', `${profile.location} (${profile.state}, ${profile.district})`],
        ['Farm Size', `${profile.farmSize} ${profile.sizeUnit}`],
        ['Soil Type', profile.soilType || 'N/A'],
        ['Irrigation System', profile.irrigation || 'N/A']
      ],
      theme: 'grid',
      headStyles: { fillColor: emerald as any, textColor: [255, 255, 255], fontStyle: 'bold' },
      styles: { fontSize: 9, cellPadding: 4 }
    });

    // Crops
    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 10,
      head: [['Registered Main Crops']],
      body: profile.mainCrops.length > 0 ? profile.mainCrops.map(c => [c]) : [['No crops registered']],
      theme: 'grid',
      headStyles: { fillColor: [6, 78, 59] as any, textColor: [255, 255, 255], fontStyle: 'bold' },
      styles: { fontSize: 9, cellPadding: 4 }
    });

    // History
    if (profile.cropHistory.length > 0) {
      autoTable(doc, {
        startY: (doc as any).lastAutoTable.finalY + 10,
        head: [['Year', 'Crop Type', 'Yield Record']],
        body: profile.cropHistory.map((h: any) => [h.year, h.crop, h.yield]),
        theme: 'grid',
        headStyles: { fillColor: emerald as any, textColor: [255, 255, 255], fontStyle: 'bold' },
        styles: { fontSize: 9, cellPadding: 4 }
      });
    }

    doc.save(`BharatKisan_GreenPassport_${(profile.farmerName || 'Farmer').replace(/\s+/g, '_')}.pdf`);
  };

  const shareProfile = async () => {
    const text = `🌾 *Bharat Kisan - Green Agri Passport*\n\n*Farmer:* ${profile.farmerName || 'Registered Farmer'}\n*Estate:* ${profile.farmName || 'Kisan Estate'}\n*Location:* ${profile.location || 'India'}\n*Main Crops:* ${profile.mainCrops.join(', ') || 'N/A'}\n\n_Generated via Bharat Kisan Smart Farming Companion_`;
    
    try {
      await Share.share({
        title: 'Agricultural Passport',
        text: text,
        url: window.location.href,
        dialogTitle: 'Share Agri Passport'
      });
    } catch (err) {
      const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
      window.open(whatsappUrl, '_blank');
    }
  };

  return (
    <div className="w-full min-h-screen bg-[#090e0c] text-stone-100 pb-36 font-sans">
      
      {/* Visual Header Banner with Gradient Glow */}
      <section className="relative pt-8 pb-6 px-6 overflow-hidden bg-gradient-to-b from-emerald-950/40 via-[#0c130f] to-[#090e0c] border-b border-emerald-500/10">
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-[100px] -mr-36 -mt-36 pointer-events-none" />
        <div className="absolute top-1/2 left-0 w-64 h-64 bg-amber-500/5 rounded-full blur-[100px] pointer-events-none" />

        <div className="relative z-10 max-w-xl mx-auto flex flex-col items-center text-center">
          
          {/* Avatar Container */}
          <div className="relative mb-4">
            <motion.div 
              whileHover={{ scale: 1.03 }}
              className="relative w-28 h-28 rounded-3xl p-1 bg-gradient-to-br from-emerald-400 via-emerald-600 to-amber-500 shadow-xl glow-emerald"
            >
              <div className="w-full h-full bg-[#111813] rounded-[22px] flex items-center justify-center overflow-hidden border border-emerald-500/30 relative">
                <User className="w-14 h-14 text-emerald-400" />
                <div className="absolute top-2.5 right-2.5 w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse border-2 border-[#111813]" />
              </div>
            </motion.div>

            <button 
              onClick={handleEditToggle}
              className={`absolute -bottom-1 -right-1 p-2.5 rounded-2xl shadow-lg transition-all duration-200 active:scale-95 border ${
                isEditing 
                  ? 'bg-rose-600 border-rose-400 text-white shadow-rose-950/50' 
                  : 'bg-emerald-500 border-emerald-300 text-stone-950 font-bold shadow-emerald-950/50 hover:bg-emerald-400'
              }`}
              title={isEditing ? "Cancel Editing" : "Edit Profile"}
            >
              {isEditing ? <RotateCcw className="w-4 h-4" /> : <Edit2 className="w-4 h-4" />}
            </button>
          </div>

          {/* Profile Name & Farm Title */}
          <div className="w-full px-2 max-w-md">
            {isEditing ? (
              <div className="space-y-3 glass-card p-4 rounded-2xl border border-emerald-500/30 shadow-xl text-left">
                <div>
                  <label className="text-[10px] font-bold uppercase text-emerald-400 tracking-wider">Farmer Name</label>
                  <input 
                    value={profile.farmerName}
                    onChange={e => setProfile({...profile, farmerName: e.target.value})}
                    placeholder="Enter Farmer Name"
                    className="w-full text-sm font-bold text-white bg-[#0a0f0d] border border-emerald-500/20 focus:border-emerald-400 rounded-xl px-3.5 py-2 outline-none mt-1"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-amber-400 tracking-wider">Farm Estate Name</label>
                  <input 
                    value={profile.farmName}
                    onChange={e => setProfile({...profile, farmName: e.target.value})}
                    placeholder="Enter Farm Name"
                    className="w-full text-xs font-semibold text-amber-300 bg-[#0a0f0d] border border-emerald-500/20 focus:border-amber-400 rounded-xl px-3.5 py-2 outline-none mt-1"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-1.5">
                <div className="flex items-center justify-center gap-2">
                  <span className="bg-emerald-950/80 text-emerald-300 text-[10px] font-bold px-3 py-1 rounded-full border border-emerald-500/30 flex items-center gap-1 shadow-sm">
                    <Sparkles className="w-3 h-3 text-emerald-400" /> Verified Kisan Pass
                  </span>
                  <button 
                    onClick={copyKisanId}
                    className="bg-stone-900/80 hover:bg-stone-800 text-stone-300 text-[10px] font-mono px-2.5 py-1 rounded-full border border-stone-700/60 flex items-center gap-1 transition-colors"
                  >
                    <span>BK-{activeFarmId?.slice(0, 6).toUpperCase() || 'SYS'}</span>
                    {copiedId ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-stone-400" />}
                  </button>
                </div>

                <h2 className="text-2xl font-extrabold text-white tracking-tight pt-1">
                  {profile.farmerName || 'Registered Farmer'}
                </h2>
                <p className="text-amber-400 text-xs font-semibold flex items-center justify-center gap-1">
                  <Sprout className="w-3.5 h-3.5 text-amber-400" />
                  <span>{profile.farmName || 'My Farm Estate'}</span>
                </p>
              </div>
            )}
          </div>

          {/* Gamified Krishi Level Card */}
          <div className="mt-5 w-full max-w-md">
            <div className="glass-card p-3.5 rounded-2xl border border-emerald-500/20 flex items-center justify-between shadow-md">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-gradient-to-br from-amber-400 to-amber-600 rounded-xl flex items-center justify-center text-stone-950 shadow-md">
                  <Award className="w-5 h-5 font-bold" />
                </div>
                <div className="text-left">
                  <p className="text-xs font-extrabold text-amber-400">Krishi Master • Tier 12</p>
                  <p className="text-[10px] text-stone-400 font-medium">Sustainable Farm Practices</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs font-extrabold text-white">8,400 XP</p>
                <p className="text-[10px] text-stone-400">Next Level: 10,000</p>
              </div>
            </div>
            
            <div className="w-full bg-stone-950 h-1.5 rounded-full mt-2 overflow-hidden border border-emerald-500/20">
              <div 
                className="bg-gradient-to-r from-amber-400 via-emerald-400 to-emerald-500 h-full rounded-full transition-all duration-1000 shadow-md" 
                style={{ width: '84%' }}
              />
            </div>
          </div>

        </div>
      </section>

      {/* Quick Bento Stats */}
      <section className="px-6 py-6 max-w-xl mx-auto">
        <div className="grid grid-cols-3 gap-3">
          <div className="glass-card p-3.5 rounded-2xl border border-emerald-500/20 flex flex-col justify-between h-24">
            <div className="p-1.5 w-fit rounded-lg bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
              <Briefcase className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] text-stone-400 font-medium">Journal Logs</p>
              <p className="text-base font-extrabold text-white">{stats.totalLogs}</p>
            </div>
          </div>

          <div className="glass-card p-3.5 rounded-2xl border border-emerald-500/20 flex flex-col justify-between h-24">
            <div className="p-1.5 w-fit rounded-lg bg-amber-500/15 text-amber-400 border border-amber-500/20">
              <Leaf className="w-4 h-4" />
            </div>
            <div className="truncate">
              <p className="text-[10px] text-stone-400 font-medium">Main Crops</p>
              <p className="text-base font-extrabold text-white">{profile.mainCrops.length}</p>
            </div>
          </div>

          <div className="glass-card p-3.5 rounded-2xl border border-emerald-500/20 flex flex-col justify-between h-24">
            <div className="p-1.5 w-fit rounded-lg bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
              <Maximize2 className="w-4 h-4" />
            </div>
            <div className="truncate">
              <p className="text-[10px] text-stone-400 font-medium">Land Area</p>
              <p className="text-base font-extrabold text-white truncate">{profile.farmSize || '0'} <span className="text-[10px] font-normal">{profile.sizeUnit}</span></p>
            </div>
          </div>
        </div>
      </section>

      {/* Navigation Segment Tabs */}
      <section className="px-6 max-w-xl mx-auto mb-6">
        <div className="bg-[#121a14] p-1.5 rounded-2xl border border-emerald-500/20 flex gap-1">
          <button 
            onClick={() => setActiveTab('farm')}
            className={`flex-1 py-2.5 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'farm' 
                ? 'bg-emerald-500 text-stone-950 shadow-md font-extrabold' 
                : 'text-stone-400 hover:text-white hover:bg-emerald-950/40'
            }`}
          >
            <Leaf className="w-3.5 h-3.5" />
            <span>Farm Specs</span>
          </button>
          
          <button 
            onClick={() => setActiveTab('identity')}
            className={`flex-1 py-2.5 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'identity' 
                ? 'bg-emerald-500 text-stone-950 shadow-md font-extrabold' 
                : 'text-stone-400 hover:text-white hover:bg-emerald-950/40'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Location & ID</span>
          </button>

          <button 
            onClick={() => setActiveTab('utility')}
            className={`flex-1 py-2.5 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'utility' 
                ? 'bg-emerald-500 text-stone-950 shadow-md font-extrabold' 
                : 'text-stone-400 hover:text-white hover:bg-emerald-950/40'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Passports</span>
          </button>
        </div>
      </section>

      {/* Tab Contents */}
      <section className="px-6 max-w-xl mx-auto">
        <AnimatePresence mode="wait">
          {activeTab === 'farm' && (
            <motion.div
              key="panel-farm"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              {/* Registered Main Crops */}
              <div className="glass-card rounded-2xl p-5 border border-emerald-500/20 shadow-md">
                <div className="flex items-center justify-between mb-3 border-b border-emerald-500/10 pb-2.5">
                  <div className="flex items-center gap-2">
                    <Leaf className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-extrabold text-stone-200">Active Crops</span>
                  </div>
                  {isEditing && (
                    <button 
                      onClick={addCrop} 
                      className="flex items-center gap-1 text-xs font-bold text-emerald-300 bg-emerald-950/80 px-2.5 py-1 rounded-xl border border-emerald-500/30 hover:bg-emerald-900/60 transition-all"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Crop
                    </button>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  {profile.mainCrops.map((c: string) => (
                    <span key={c} className="inline-flex items-center gap-1.5 bg-emerald-950/60 border border-emerald-500/30 px-3 py-1.5 rounded-xl text-xs font-medium text-emerald-200">
                      🌾 {c}
                      {isEditing && (
                        <button onClick={() => removeCrop(c)} className="text-stone-400 hover:text-rose-400 ml-1 p-0.5">
                          <CloseIcon className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </span>
                  ))}
                  {profile.mainCrops.length === 0 && (
                    <p className="text-xs text-stone-400 italic">No crops registered yet.</p>
                  )}
                </div>
              </div>

              {/* Yield History Records */}
              <div className="glass-card rounded-2xl p-5 border border-emerald-500/20 shadow-md">
                <div className="flex items-center justify-between mb-3 border-b border-emerald-500/10 pb-2.5">
                  <div className="flex items-center gap-2">
                    <History className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-extrabold text-stone-200">Yield Output History</span>
                  </div>
                  {isEditing && (
                    <button 
                      onClick={addHistoryEntry} 
                      className="flex items-center gap-1 text-xs font-bold text-emerald-300 bg-emerald-950/80 px-2.5 py-1 rounded-xl border border-emerald-500/30 hover:bg-emerald-900/60 transition-all"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Yield Record
                    </button>
                  )}
                </div>

                <div className="space-y-2">
                  {profile.cropHistory.map((h: any, i: number) => (
                    <div key={i} className="flex items-center justify-between bg-[#111813] p-3 rounded-xl border border-emerald-500/15">
                      <div>
                        <p className="text-xs font-bold text-white">{h.crop}</p>
                        <p className="text-[10px] text-stone-400">{h.year} • {h.yield}</p>
                      </div>
                      {isEditing && (
                        <button onClick={() => removeHistoryEntry(i)} className="p-1.5 text-stone-400 hover:text-rose-400">
                          <CloseIcon className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                  {profile.cropHistory.length === 0 && (
                    <p className="text-xs text-stone-400 italic">No past yield records added.</p>
                  )}
                </div>
              </div>

              {/* Farmland Attributes */}
              <div className="glass-card rounded-2xl p-5 border border-emerald-500/20 shadow-md divide-y divide-emerald-500/10">
                <div className="flex items-center gap-2 pb-2.5">
                  <Layers className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-extrabold text-stone-200">Soil & Hydrology Infrastructure</span>
                </div>

                <ProfileItem 
                  icon={<Droplets />} 
                  label="Irrigation System" 
                  value={profile.irrigation} 
                  isEditing={isEditing}
                  placeholder="e.g. Drip, Canal, Borewell"
                  onChange={val => setProfile({...profile, irrigation: val})}
                />
                
                <ProfileItem 
                  icon={<Layers />} 
                  label="Soil Classification" 
                  value={profile.soilType} 
                  isEditing={isEditing}
                  placeholder="e.g. Alluvial, Black Soil, Clay"
                  onChange={val => setProfile({...profile, soilType: val})}
                />

                <ProfileItem 
                  icon={<Navigation />} 
                  label="Terrain Topography" 
                  value={profile.terrain} 
                  isEditing={isEditing}
                  placeholder="e.g. Flatland, Terraced Slope"
                  onChange={val => setProfile({...profile, terrain: val})}
                />
              </div>

              {/* Threat Log */}
              <div className="glass-card rounded-2xl p-5 border border-emerald-500/20 shadow-md">
                <div className="flex items-center justify-between mb-3 border-b border-emerald-500/10 pb-2.5">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-extrabold text-stone-200">Incidents & Threats Log</span>
                  </div>
                  {isEditing && (
                    <button 
                      onClick={addIssue} 
                      className="flex items-center gap-1 text-xs font-bold text-amber-300 bg-amber-950/80 px-2.5 py-1 rounded-xl border border-amber-500/30 hover:bg-amber-900/60 transition-all"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Incident
                    </button>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  {profile.pastIssues.map((issue: string, i: number) => (
                    <span key={i} className="inline-flex items-center gap-1.5 bg-amber-950/40 border border-amber-500/20 px-3 py-1.5 rounded-xl text-xs font-medium text-amber-200">
                      ⚠️ {issue}
                      {isEditing && (
                        <button onClick={() => removeIssue(i)} className="text-amber-400 hover:text-rose-400 ml-1 p-0.5">
                          <CloseIcon className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </span>
                  ))}
                  {profile.pastIssues.length === 0 && (
                    <p className="text-xs text-stone-400 italic">No pathogen or pest threats logged.</p>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'identity' && (
            <motion.div
              key="panel-identity"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              {/* Regional Geolocation */}
              <div className="glass-card rounded-2xl p-5 border border-emerald-500/20 shadow-md space-y-3">
                <div className="flex items-center justify-between border-b border-emerald-500/10 pb-2.5">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-extrabold text-stone-200">Location & Demographics</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <span className="text-[10px] text-stone-400 font-bold uppercase tracking-wider block mb-1">State & District</span>
                    {isEditing ? (
                      <div className="grid grid-cols-2 gap-2">
                        <input 
                          value={profile.state} 
                          onChange={e => setProfile({...profile, state: e.target.value})}
                          placeholder="State"
                          className="bg-[#111813] border border-emerald-500/20 text-xs font-semibold text-white p-2.5 rounded-xl outline-none focus:border-emerald-400"
                        />
                        <input 
                          value={profile.district} 
                          onChange={e => setProfile({...profile, district: e.target.value})}
                          placeholder="District"
                          className="bg-[#111813] border border-emerald-500/20 text-xs font-semibold text-white p-2.5 rounded-xl outline-none focus:border-emerald-400"
                        />
                      </div>
                    ) : (
                      <p className="text-xs font-bold text-white">{profile.state || 'State Not Set'}{profile.district ? `, ${profile.district}` : ''}</p>
                    )}
                  </div>

                  <div>
                    <span className="text-[10px] text-stone-400 font-bold uppercase tracking-wider block mb-1">Mandal & Revenue Village</span>
                    {isEditing ? (
                      <div className="grid grid-cols-2 gap-2">
                        <input 
                          value={profile.mandal} 
                          onChange={e => setProfile({...profile, mandal: e.target.value})}
                          placeholder="Mandal"
                          className="bg-[#111813] border border-emerald-500/20 text-xs font-semibold text-white p-2.5 rounded-xl outline-none focus:border-emerald-400"
                        />
                        <input 
                          value={profile.revenue} 
                          onChange={e => setProfile({...profile, revenue: e.target.value})}
                          placeholder="Revenue Village"
                          className="bg-[#111813] border border-emerald-500/20 text-xs font-semibold text-white p-2.5 rounded-xl outline-none focus:border-emerald-400"
                        />
                      </div>
                    ) : (
                      <p className="text-xs font-bold text-white">{profile.mandal || 'Mandal Not Set'}{profile.revenue ? ` • ${profile.revenue}` : ''}</p>
                    )}
                  </div>

                  {isEditing && (
                    <button 
                      onClick={detectLocation} 
                      disabled={isLocating} 
                      className="py-2.5 px-4 bg-emerald-500 text-stone-950 font-bold rounded-xl text-xs w-full flex items-center justify-center gap-2 shadow-md hover:bg-emerald-400 transition-all disabled:opacity-50"
                    >
                      {isLocating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Navigation className="w-4 h-4" />}
                      <span>Auto-Detect GPS Location</span>
                    </button>
                  )}
                </div>

                <ProfileItem 
                  icon={<Maximize2 />} 
                  label={`Total Farm Land (${profile.sizeUnit})`} 
                  value={profile.farmSize} 
                  isEditing={isEditing}
                  type="number"
                  placeholder="e.g. 12"
                  onChange={val => setProfile({...profile, farmSize: val})}
                />
              </div>

              {/* Direct Communication Info */}
              <div className="glass-card rounded-2xl p-5 border border-emerald-500/20 shadow-md divide-y divide-emerald-500/10">
                <div className="flex items-center gap-2 pb-2.5">
                  <Phone className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-extrabold text-stone-200">Contact Registry</span>
                </div>

                <ProfileItem 
                  icon={<Phone />} 
                  label="Registered Mobile Number" 
                  value={profile.phone} 
                  isEditing={isEditing}
                  placeholder="Enter Phone Number"
                  onChange={val => setProfile({...profile, phone: val})}
                />
                
                <ProfileItem 
                  icon={<Mail />} 
                  label="Registered Email Address" 
                  value={profile.email} 
                  isEditing={isEditing}
                  placeholder="Enter Email Address"
                  onChange={val => setProfile({...profile, email: val})}
                />
              </div>
            </motion.div>
          )}

          {activeTab === 'utility' && (
            <motion.div
              key="panel-utility"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-3"
            >
              <div className="glass-card rounded-2xl p-2 border border-emerald-500/20 shadow-md space-y-1">
                <button 
                  onClick={exportProfilePDF}
                  className="w-full flex items-center justify-between p-3.5 hover:bg-emerald-950/40 rounded-xl transition-all group text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-emerald-950/80 rounded-xl text-emerald-400 border border-emerald-500/20 group-hover:scale-105 transition-all">
                      <Download className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">Export Digital Green Passport</p>
                      <p className="text-[10px] text-stone-400">Download verified credentials as PDF</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-stone-500 group-hover:text-emerald-400 transition-colors" />
                </button>
                
                <button 
                  onClick={shareProfile}
                  className="w-full flex items-center justify-between p-3.5 hover:bg-emerald-950/40 rounded-xl transition-all group text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-emerald-950/80 rounded-xl text-emerald-400 border border-emerald-500/20 group-hover:scale-105 transition-all">
                      <Share2 className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">Share Agri Credentials</p>
                      <p className="text-[10px] text-stone-400">Send summary via WhatsApp or Share Sheet</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-stone-500 group-hover:text-emerald-400 transition-colors" />
                </button>
              </div>

              <div className="glass-card rounded-2xl p-2 border border-emerald-500/20 shadow-md">
                <button 
                  onClick={() => onNavigate(AppView.SETTINGS)}
                  className="w-full flex items-center justify-between p-3.5 hover:bg-emerald-950/40 rounded-xl transition-all group text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-emerald-950/80 rounded-xl text-amber-400 border border-amber-500/20 group-hover:scale-105 transition-all">
                      <SettingsIcon className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">Platform Settings</p>
                      <p className="text-[10px] text-stone-400">Language, notification & offline preferences</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-stone-500 group-hover:text-amber-400 transition-colors" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* Primary Action Buttons */}
      <section className="px-6 max-w-xl mx-auto pt-6">
        {isEditing ? (
          <div className="grid grid-cols-2 gap-3">
            <button 
              onClick={handleSave} 
              className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 text-stone-950 font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all text-xs"
            >
              <CheckCircle2 className="w-4 h-4" /> Save Profile
            </button>
            <button 
              onClick={handleEditToggle} 
              className="w-full bg-stone-900 text-stone-300 font-semibold py-3 px-4 rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-all text-xs border border-stone-800"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button 
            onClick={onLogout} 
            className="w-full bg-rose-950/30 hover:bg-rose-900/40 text-rose-400 font-bold py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-all border border-rose-500/20 text-xs shadow-sm"
          >
            <LogOut className="w-4 h-4" /> Log Out
          </button>
        )}
      </section>

    </div>
  );
};

const ProfileItem: React.FC<{ 
  icon: React.ReactNode, 
  label: string, 
  value: string, 
  isEditing: boolean, 
  type?: string,
  placeholder?: string,
  onChange: (val: string) => void 
}> = ({ icon, label, value, isEditing, type = "text", placeholder, onChange }) => (
  <div className="flex items-center gap-3.5 py-3">
    <div className="p-2.5 bg-[#111813] rounded-xl text-emerald-400 border border-emerald-500/20 flex-shrink-0">
      {React.cloneElement(icon as React.ReactElement<any>, { className: 'w-4 h-4' })}
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-[10px] text-stone-400 font-medium">{label}</p>
      {isEditing ? (
        <input 
          type={type}
          value={value} 
          placeholder={placeholder}
          onChange={e => onChange(e.target.value)}
          className="w-full bg-[#111813] border border-emerald-500/20 text-xs font-semibold text-white p-2 rounded-lg outline-none focus:border-emerald-400 mt-0.5"
        />
      ) : (
        <p className="text-xs font-bold text-white truncate mt-0.5">{value || 'Not provided'}</p>
      )}
    </div>
  </div>
);

export default Profile;
