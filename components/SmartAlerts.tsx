import React, { useEffect, useState } from 'react';
import { 
  Bell, 
  Droplets, 
  CloudRain, 
  TrendingDown, 
  ChevronRight, 
  Settings2, 
  Zap, 
  Clock, 
  AlertCircle,
  CheckCircle2,
  X,
  Plus,
  Calendar,
  Info,
  Loader2,
  Trash2,
  CloudSun
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, query, orderBy, Timestamp } from 'firebase/firestore';
import { db } from '../src/firebase';
import { useFirebase } from '../src/components/FirebaseProvider';
import { handleFirestoreError, OperationType } from '../src/utils/firestoreErrorHandler';
import { showToast } from '../src/utils/toast';
import { Alert } from '../types';

const SmartAlerts: React.FC = () => {
  const { user, activeFarmId } = useFirebase();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !activeFarmId) return;

    const path = `users/${activeFarmId}/alerts`;
    const q = query(collection(db, path), orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: Alert[] = [];
      snapshot.forEach(doc => {
        list.push({ id: doc.id, ...doc.data() } as Alert);
      });
      setAlerts(list);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, activeFarmId]);

  const toggleAlert = async (id: string, currentStatus: boolean) => {
    if (!user || !activeFarmId) return;
    const path = `users/${activeFarmId}/alerts/${id}`;
    try {
      await updateDoc(doc(db, path), { active: !currentStatus });
      showToast(currentStatus ? 'Alert muted' : 'Alert resumed');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  };

  const deleteAlert = async (id: string) => {
    if (!user || !activeFarmId) return;
    const path = `users/${activeFarmId}/alerts/${id}`;
    try {
      await deleteDoc(doc(db, path));
      showToast('Alert deleted');
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  };

  const addProtocol = async (type: 'Spray' | 'Weather' | 'Market') => {
    if (!user || !activeFarmId) return;
    const path = `users/${activeFarmId}/alerts`;
    
    const newAlert: Omit<Alert, 'id'> = {
      type,
      title: type === 'Spray' ? 'New Spray Protocol' : type === 'Weather' ? 'Weather Watch' : 'Market Monitor',
      desc: type === 'Spray' ? 'Configure your spray schedule for optimal results.' : type === 'Weather' ? 'Monitoring precipitation and wind speed.' : 'Tracking price drops for your crops.',
      time: 'Just now',
      active: true,
      priority: 'Medium',
      createdAt: new Date().toISOString()
    };

    try {
      await addDoc(collection(db, path), newAlert);
      showToast(`${type} protocol added`);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-10 h-10 text-amber-500 animate-spin" />
        <p className="text-[10px] font-black text-stone-500 uppercase tracking-[0.3em]">Syncing Intelligence...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-32 animate-in fade-in slide-in-from-bottom-6 duration-700 bg-black min-h-screen">
      {/* Header */}
      <section className="px-6 pt-10 pb-4">
        <div className="flex flex-col gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-amber-600 rounded-full shadow-sm animate-pulse"></div>
              <span className="text-[9px] font-bold text-stone-500 uppercase tracking-[0.2em]">System Intelligence</span>
            </div>
            <h2 className="text-4xl font-bold text-white tracking-tight font-serif leading-none">
              Smart<br /><span className="text-amber-500 italic">Alerts.</span>
            </h2>
          </div>
          
          <div className="bg-stone-900 rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden group border border-stone-800">
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
              <Zap className="w-48 h-48 -mr-12 -mt-12 rotate-12" />
            </div>
            <div className="relative z-10 flex items-center justify-between">
              <div>
                <p className="text-[9px] font-bold text-amber-500 uppercase tracking-widest mb-1">Active Protocols</p>
                <h3 className="text-3xl font-bold tracking-tight font-serif leading-none">
                  {alerts.filter(a => a.active).length}<br />
                  <span className="text-sm text-white/60 font-sans font-medium">Live Monitors</span>
                </h3>
              </div>
              <button className="bg-white/5 backdrop-blur-md p-5 rounded-[2rem] border border-white/10 hover:bg-white/10 transition-colors shadow-xl">
                <Settings2 className="w-6 h-6 text-amber-500" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Alert Feed */}
      <section className="px-6 space-y-6">
        <div className="flex items-center justify-between px-2">
          <h3 className="text-[10px] font-black text-stone-400 uppercase tracking-[0.4em]">Intelligence Feed</h3>
          <div className="h-px flex-1 bg-stone-200 mx-4" />
        </div>

        <AnimatePresence mode="popLayout">
          {alerts.map((alert) => {
            const isWeather = alert.type === 'Weather';
            const isSpray = alert.type === 'Spray';
            const isMarket = alert.type === 'Market';
            
            return (
              <motion.div 
                key={alert.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className={`group relative bg-stone-900 rounded-[2.5rem] border transition-all duration-500 ${
                  alert.active 
                    ? 'border-stone-800 shadow-xl' 
                    : 'border-stone-900 opacity-40 grayscale'
                }`}
              >
                {/* Priority Badge */}
                {alert.priority === 'High' && alert.active && (
                  <div className="absolute -top-2 -right-2 z-10 bg-rose-500 text-white text-[8px] font-black uppercase px-3 py-1 rounded-full shadow-lg border-2 border-white">
                    Critical
                  </div>
                )}

                <div className="p-8 space-y-6">
                  <div className="flex gap-5">
                    <div className={`w-16 h-16 rounded-3xl flex items-center justify-center shrink-0 shadow-inner border ${
                      isWeather ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' :
                      isSpray ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' :
                      'bg-amber-500/10 text-amber-500 border-amber-500/20'
                    }`}>
                      {isWeather && <CloudSun className="w-8 h-8" />}
                      {isSpray && <Droplets className="w-8 h-8" />}
                      {isMarket && <TrendingDown className="w-8 h-8" />}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <h4 className="text-lg font-bold text-white tracking-tight uppercase leading-none truncate pr-4">
                          {alert.title}
                        </h4>
                        <button 
                          onClick={() => deleteAlert(alert.id)}
                          className="p-2 text-stone-700 hover:text-rose-500 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <Clock className="w-3 h-3 text-stone-600" />
                        <span className="text-[9px] font-bold text-stone-500 uppercase tracking-widest">{alert.time}</span>
                      </div>
                    </div>
                  </div>

                  <p className="text-xs font-medium text-stone-400 leading-relaxed">
                    {alert.desc}
                  </p>

                  <div className="flex gap-3 pt-2">
                    <button className={`flex-1 py-4 rounded-2xl font-bold text-[10px] uppercase tracking-widest transition-all shadow-xl active:scale-95 border ${
                      isWeather ? 'bg-blue-600 text-white border-blue-500/20 shadow-blue-900/20' :
                      isSpray ? 'bg-rose-600 text-white border-rose-500/20 shadow-rose-900/20' :
                      'bg-amber-600 text-black border-amber-500/20 shadow-amber-900/20'
                    }`}>
                      {isWeather ? 'View Radar' : isSpray ? 'Open Map' : 'Market Trends'}
                    </button>
                    <button 
                      onClick={() => toggleAlert(alert.id, alert.active)}
                      className={`px-6 py-4 rounded-2xl font-bold text-[10px] uppercase tracking-widest transition-all border ${
                        alert.active 
                          ? 'bg-stone-800 text-white border-stone-700' 
                          : 'bg-amber-50 text-black border-amber-400'
                      }`}
                    >
                      {alert.active ? 'Mute' : 'Resume'}
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {alerts.length === 0 && (
          <div className="py-24 text-center flex flex-col items-center gap-6 bg-stone-900/30 rounded-[3rem] border border-dashed border-stone-800">
            <Bell className="w-16 h-16 text-stone-800" />
            <div className="space-y-1">
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-stone-600">Silence is Golden</p>
              <p className="text-[9px] font-medium text-stone-700 px-12">No active intelligence protocols found. Configure your first alert below.</p>
            </div>
          </div>
        )}
      </section>

      {/* Protocol Setup */}
      <section className="px-6 space-y-6">
        <div className="flex items-center justify-between px-2">
          <h3 className="text-[10px] font-bold text-stone-500 uppercase tracking-[0.3em]">Protocol Setup</h3>
          <div className="h-px flex-1 bg-stone-900 mx-4" />
        </div>

        <div className="grid grid-cols-1 gap-4">
          <SetupCard 
            icon={<Droplets />} 
            label="Spray Reminder" 
            desc="Schedule chemical application cycles"
            color="bg-rose-600"
            onClick={() => addProtocol('Spray')}
          />
          <SetupCard 
            icon={<CloudSun />} 
            label="Weather Guard" 
            desc="Precipitation & wind speed thresholds"
            color="bg-blue-600"
            onClick={() => addProtocol('Weather')}
          />
          <SetupCard 
            icon={<TrendingDown />} 
            label="Market Watch" 
            desc="Price drop alerts for specific crops"
            color="bg-amber-600"
            onClick={() => addProtocol('Market')}
          />
        </div>
      </section>

      {/* Floating Action Button */}
      <div className="fixed bottom-24 right-6 z-50">
        <motion.button 
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => addProtocol('Weather')}
          className="w-16 h-16 bg-amber-600 text-black rounded-[2rem] shadow-2xl flex items-center justify-center border-4 border-black"
        >
          <Plus className="w-8 h-8" />
        </motion.button>
      </div>
    </div>
  );
};

const SetupCard: React.FC<{ icon: React.ReactNode, label: string, desc: string, color: string, onClick: () => void }> = ({ icon, label, desc, color, onClick }) => (
  <button 
    onClick={onClick}
    className="bg-stone-900 border border-stone-800 p-6 rounded-[2.5rem] flex items-center gap-5 text-left hover:border-amber-500/30 transition-all group shadow-sm active:scale-[0.98]"
  >
    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-xl ${color} group-hover:scale-110 transition-transform border border-white/10`}>
      {React.cloneElement(icon as React.ReactElement, { className: 'w-7 h-7' } as any)}
    </div>
    <div className="flex-1">
      <h4 className="text-sm font-bold text-white uppercase tracking-tight leading-none mb-1">{label}</h4>
      <p className="text-[10px] font-medium text-stone-500 leading-tight">{desc}</p>
    </div>
    <ChevronRight className="w-4 h-4 text-stone-700 group-hover:text-amber-500 transition-colors" />
  </button>
);

export default SmartAlerts;
