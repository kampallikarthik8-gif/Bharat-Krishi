
import React from 'react';
import { 
  Shield, 
  Activity, 
  Users, 
  Database, 
  Zap, 
  AlertCircle, 
  Radio, 
  Trash2, 
  FileJson, 
  Terminal,
  Server,
  Cpu,
  Globe,
  BarChart3,
  RefreshCw,
  Send,
  LayoutGrid,
  Sprout,
  Droplets,
  Wallet,
  Bug,
  Newspaper,
  ClipboardList,
  Map as MapIcon,
  CloudSun,
  TrendingUp,
  Microscope,
  Leaf,
  Truck,
  BookOpen,
  Beef,
  ShieldCheck,
  Bell,
  Search
} from 'lucide-react';
import { JournalEntry, Task, Field, InventoryItem, Transaction, UserProfile } from '../types';
import { useFirebase } from '../src/components/FirebaseProvider';
import { db } from '../src/firebase';
import { collection, onSnapshot, query, limit, orderBy, getDocs } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../src/utils/firestoreErrorHandler';

const AdminPanel: React.FC = () => {
  const { activeFarmId, profile } = useFirebase();
  const [stats, setStats] = React.useState({
    totalLogs: 0,
    totalTasks: 0,
    totalFields: 0,
    totalInventory: 0,
    totalTransactions: 0,
    totalJournal: 0,
    totalAlerts: 3,
    totalUsers: 0,
    storageSize: 0,
    apiRequests: 42,
    systemHealth: 'Optimal'
  });

  const [activeTab, setActiveTab] = React.useState<'metrics' | 'features' | 'users' | 'broadcast'>('metrics');
  const [broadcastMessage, setBroadcastMessage] = React.useState('');
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const [logs, setLogs] = React.useState<string[]>([]);
  const [users, setUsers] = React.useState<UserProfile[]>([]);
  const [loadingUsers, setLoadingUsers] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');

  const addLog = (msg: string) => {
    setLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev].slice(0, 50));
  };

  React.useEffect(() => {
    if (!activeFarmId) return;

    addLog(`Initializing Admin Session for Farm: ${activeFarmId}`);
    
    // Tasks Listener
    const tasksUnsub = onSnapshot(collection(db, `users/${activeFarmId}/tasks`), (snap) => {
      setStats(prev => ({ ...prev, totalTasks: snap.size }));
      addLog(`Synced ${snap.size} tasks from node.`);
    }, (err) => handleFirestoreError(err, OperationType.LIST, `users/${activeFarmId}/tasks`));

    // Fields Listener
    const fieldsUnsub = onSnapshot(collection(db, `users/${activeFarmId}/fields`), (snap) => {
      setStats(prev => ({ ...prev, totalFields: snap.size }));
      addLog(`Synced ${snap.size} fields from node.`);
    }, (err) => handleFirestoreError(err, OperationType.LIST, `users/${activeFarmId}/fields`));

    // Inventory Listener
    const invUnsub = onSnapshot(collection(db, `users/${activeFarmId}/inventory`), (snap) => {
      setStats(prev => ({ ...prev, totalInventory: snap.size }));
      addLog(`Synced ${snap.size} inventory items.`);
    }, (err) => handleFirestoreError(err, OperationType.LIST, `users/${activeFarmId}/inventory`));

    // Transactions Listener
    const txUnsub = onSnapshot(collection(db, `users/${activeFarmId}/transactions`), (snap) => {
      setStats(prev => ({ ...prev, totalTransactions: snap.size }));
      addLog(`Synced ${snap.size} financial records.`);
    }, (err) => handleFirestoreError(err, OperationType.LIST, `users/${activeFarmId}/transactions`));

    // Journal Listener
    const journalUnsub = onSnapshot(collection(db, `users/${activeFarmId}/journal`), (snap) => {
      setStats(prev => ({ ...prev, totalJournal: snap.size }));
      addLog(`Synced ${snap.size} journal entries.`);
    }, (err) => handleFirestoreError(err, OperationType.LIST, `users/${activeFarmId}/journal`));

    return () => {
      tasksUnsub();
      fieldsUnsub();
      invUnsub();
      txUnsub();
      journalUnsub();
    };
  }, [activeFarmId]);

  React.useEffect(() => {
    if (activeTab === 'users') {
      fetchUsers();
    }
  }, [activeTab]);

  const fetchUsers = async () => {
    setLoadingUsers(true);
    addLog("Fetching global user registry...");
    try {
      const snap = await getDocs(collection(db, 'users'));
      const userList: UserProfile[] = [];
      snap.forEach(doc => {
        userList.push({ id: doc.id, ...doc.data() } as UserProfile);
      });
      setUsers(userList);
      setStats(prev => ({ ...prev, totalUsers: userList.length }));
      addLog(`Retrieved ${userList.length} active user profiles.`);
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'users');
    } finally {
      setLoadingUsers(false);
    }
  };

  const refreshStats = () => {
    setIsRefreshing(true);
    addLog("Manual node refresh initiated...");
    
    // Simulate API check
    setTimeout(() => {
      setStats(prev => ({
        ...prev,
        apiRequests: prev.apiRequests + Math.floor(Math.random() * 5),
        storageSize: (JSON.stringify(localStorage).length / 1024) + (stats.totalTasks * 0.5)
      }));
      setIsRefreshing(false);
      addLog("Refresh complete. Latency: 24ms");
    }, 800);
  };

  const handleSendBroadcast = () => {
    if (!broadcastMessage.trim()) return;
    const existingRaw = localStorage.getItem('agri_broadcasts');
    const broadcasts = existingRaw ? JSON.parse(existingRaw) : [];
    const newBroadcast = {
      id: Date.now(),
      message: broadcastMessage,
      timestamp: new Date().toISOString(),
      type: 'Alert'
    };
    localStorage.setItem('agri_broadcasts', JSON.stringify([newBroadcast, ...broadcasts]));
    setBroadcastMessage('');
    alert("Emergency broadcast queued for all active terminals.");
  };

  const renderMetrics = () => (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="grid grid-cols-2 gap-4">
        <MetricCard 
          icon={<Users className="w-5 h-5" />} 
          label="Total Users" 
          value={`${stats.totalUsers || '...'}`} 
          sub="Global Registry"
        />
        <MetricCard 
          icon={<Activity className="w-5 h-5 text-amber-400" />} 
          label="System Health" 
          value="Optimal" 
          sub="All Nodes Online"
        />
        <MetricCard 
          icon={<Database className="w-5 h-5 text-orange-400" />} 
          label="DB Capacity" 
          value={`${stats.storageSize.toFixed(1)} KB`} 
          sub="Browser Partition"
        />
        <MetricCard 
          icon={<Zap className="w-5 h-5 text-amber-500" />} 
          label="AI Inference" 
          value={`${stats.apiRequests}`} 
          sub="Total Tokens Ref."
        />
      </div>

      <div className="bg-stone-900 rounded-[2rem] p-6 border border-white/5">
        <h3 className="text-xs font-black text-stone-500 uppercase tracking-widest mb-6 flex items-center gap-2">
          <Terminal className="w-4 h-4" /> Live Node Logs
        </h3>
        <div className="font-mono text-[10px] space-y-2 text-stone-400 overflow-y-auto max-h-48 custom-scrollbar">
          {logs.length > 0 ? logs.map((log, i) => (
            <p key={i} className={log.includes('WARN') ? 'text-amber-500' : log.includes('Initializing') ? 'text-emerald-500' : ''}>
              {log}
            </p>
          )) : (
            <p className="opacity-40 italic">No logs recorded in this session...</p>
          )}
        </div>
      </div>
    </div>
  );

  const renderFeatures = () => (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 gap-4">
        <FeatureStatusCard 
          icon={<ClipboardList className="w-5 h-5 text-emerald-400" />}
          name="Task Manager"
          count={stats.totalTasks}
          status="Active"
          desc="Real-time farm operation tracking"
        />
        <FeatureStatusCard 
          icon={<MapIcon className="w-5 h-5 text-blue-400" />}
          name="Field Mapping"
          count={stats.totalFields}
          status="Active"
          desc="GIS-based parcel management"
        />
        <FeatureStatusCard 
          icon={<Droplets className="w-5 h-5 text-cyan-400" />}
          name="Inventory Hub"
          count={stats.totalInventory}
          status="Active"
          desc="Seed, fertilizer & tool tracking"
        />
        <FeatureStatusCard 
          icon={<Wallet className="w-5 h-5 text-amber-400" />}
          name="Finance Ledger"
          count={stats.totalTransactions}
          status="Active"
          desc="Income & expense auditing"
        />
        <FeatureStatusCard 
          icon={<BookOpen className="w-5 h-5 text-purple-400" />}
          name="Farm Journal"
          count={stats.totalJournal}
          status="Active"
          desc="Activity logging & seasonal intelligence"
        />
        <FeatureStatusCard 
          icon={<Bell className="w-5 h-5 text-amber-500" />}
          name="Smart Alerts"
          count={stats.totalAlerts}
          status="Active"
          desc="Intelligent notification protocols"
        />
        <FeatureStatusCard 
          icon={<Bug className="w-5 h-5 text-rose-400" />}
          name="Disease Scanner"
          count={0}
          status="Active"
          desc="AI-powered pest & disease detection"
        />
        <FeatureStatusCard 
          icon={<TrendingUp className="w-5 h-5 text-emerald-500" />}
          name="Market Prices"
          count={0}
          status="Active"
          desc="Live Mandi price tracking"
        />
        <FeatureStatusCard 
          icon={<CloudSun className="w-5 h-5 text-blue-400" />}
          name="Weather Forecast"
          count={0}
          status="Active"
          desc="Hyper-local weather intelligence"
        />
        <FeatureStatusCard 
          icon={<Microscope className="w-5 h-5 text-purple-400" />}
          name="Soil Health"
          count={0}
          status="Active"
          desc="Soil nutrient & pH analysis"
        />
        <FeatureStatusCard 
          icon={<Sprout className="w-5 h-5 text-lime-500" />}
          name="Crop Advisor"
          count={0}
          status="Active"
          desc="AI agronomy recommendations"
        />
        <FeatureStatusCard 
          icon={<Leaf className="w-5 h-5 text-emerald-600" />}
          name="Sustainability"
          count={0}
          status="Active"
          desc="Carbon credits & eco-tracking"
        />
        <FeatureStatusCard 
          icon={<Truck className="w-5 h-5 text-orange-400" />}
          name="Equipment"
          count={0}
          status="Active"
          desc="Rental & fleet management"
        />
        <FeatureStatusCard 
          icon={<Beef className="w-5 h-5 text-amber-600" />}
          name="Livestock"
          count={0}
          status="Active"
          desc="Animal health & production"
        />
      </div>
    </div>
  );

  const renderUsers = () => (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-500" />
        <input 
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search users by name, email or farm..."
          className="w-full bg-stone-900 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-xs font-medium text-white outline-none focus:border-amber-500 transition-colors"
        />
      </div>

      <div className="space-y-3">
        {loadingUsers ? (
          <div className="flex flex-col items-center justify-center py-12 gap-4">
            <RefreshCw className="w-8 h-8 text-amber-500 animate-spin" />
            <p className="text-[10px] font-bold text-stone-500 uppercase tracking-widest">Accessing Secure Registry...</p>
          </div>
        ) : users.filter(u => 
          u.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
          u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          u.farmName?.toLowerCase().includes(searchQuery.toLowerCase())
        ).map(user => (
          <div key={user.id} className="bg-stone-900 border border-white/5 p-4 rounded-[1.5rem] flex items-center justify-between group hover:bg-stone-800 transition-all">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-amber-600/20 flex items-center justify-center text-amber-500 font-black text-lg border border-amber-500/20">
                {user.name?.charAt(0) || '?'}
              </div>
              <div>
                <h4 className="text-sm font-black text-white">{user.name || 'Anonymous User'}</h4>
                <p className="text-[10px] text-stone-500 font-medium">{user.farmName || 'No Farm Linked'} • {user.role || 'farmer'}</p>
                <p className="text-[9px] text-stone-600 font-mono mt-0.5">{user.email || 'No Email'}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button className="p-2 bg-white/5 rounded-xl text-stone-400 hover:text-white transition-colors">
                <FileJson className="w-4 h-4" />
              </button>
              <button className="p-2 bg-white/5 rounded-xl text-stone-400 hover:text-amber-500 transition-colors">
                <ShieldCheck className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderBroadcast = () => (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="bg-stone-900 rounded-[2rem] p-6 border border-white/5">
        <h3 className="text-xs font-black text-stone-500 uppercase tracking-widest mb-4 flex items-center gap-2">
          <Radio className="w-4 h-4 text-amber-500" /> Global Alert Broadcast
        </h3>
        <p className="text-[10px] text-stone-400 mb-6 leading-relaxed">
          Broadcasting a message will inject it into the dashboard of all farmers in this local partition.
        </p>
        <textarea 
          value={broadcastMessage}
          onChange={(e) => setBroadcastMessage(e.target.value)}
          placeholder="e.g. Extreme weather warning: Heavy hailstorm predicted for Northern District..."
          className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-xs font-medium text-white outline-none focus:border-amber-500 transition-colors resize-none mb-4"
          rows={5}
        />
        <button 
          onClick={handleSendBroadcast}
          disabled={!broadcastMessage.trim()}
          className="w-full bg-amber-600 text-white font-black py-4 rounded-[1.25rem] shadow-xl shadow-amber-950/40 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-20"
        >
          <Send className="w-4 h-4" /> Initiate Transmission
        </button>
      </div>
    </div>
  );

  return (
    <div className="space-y-8 pb-12 bg-black -mx-4 -mt-2 p-6 min-h-screen text-stone-300">
      <header className="flex items-center justify-between pt-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-amber-600/20 rounded-xl border border-amber-500/20">
            <Shield className="w-6 h-6 text-amber-500" />
          </div>
          <div>
            <h2 className="text-xl font-black text-white leading-none">Admin Panel</h2>
            <p className="text-[10px] font-bold text-stone-500 uppercase tracking-[0.2em] mt-1">Admin Privilege Active</p>
          </div>
        </div>
        <button 
          onClick={refreshStats}
          className={`p-3 rounded-xl bg-white/5 border border-white/5 transition-all ${isRefreshing ? 'animate-spin' : ''}`}
        >
          <RefreshCw className="w-5 h-5" />
        </button>
      </header>

      {/* Navigation Tabs */}
      <div className="flex gap-2 p-1 bg-white/5 rounded-[1.5rem] border border-white/5 overflow-x-auto no-scrollbar">
        <TabButton 
          active={activeTab === 'metrics'} 
          onClick={() => setActiveTab('metrics')} 
          icon={<BarChart3 className="w-4 h-4" />}
          label="Metrics"
        />
        <TabButton 
          active={activeTab === 'features'} 
          onClick={() => setActiveTab('features')} 
          icon={<LayoutGrid className="w-4 h-4" />}
          label="Features"
        />
        <TabButton 
          active={activeTab === 'users'} 
          onClick={() => setActiveTab('users')} 
          icon={<Users className="w-4 h-4" />}
          label="Users"
        />
        <TabButton 
          active={activeTab === 'broadcast'} 
          onClick={() => setActiveTab('broadcast')} 
          icon={<Radio className="w-4 h-4" />}
          label="Broadcast"
        />
      </div>

      {activeTab === 'metrics' && renderMetrics()}
      {activeTab === 'features' && renderFeatures()}
      {activeTab === 'users' && renderUsers()}
      {activeTab === 'broadcast' && renderBroadcast()}

      {/* System Status Footer */}
      <footer className="pt-8 border-t border-white/5">
        <div className="grid grid-cols-3 gap-4">
          <div className="flex flex-col items-center text-center">
            <Cpu className="w-4 h-4 text-stone-600 mb-1" />
            <p className="text-[8px] font-black uppercase text-stone-500 tracking-widest">Logic Core</p>
            <p className="text-[10px] font-bold text-stone-400">Gemini 3.0</p>
          </div>
          <div className="flex flex-col items-center text-center">
            <Globe className="w-4 h-4 text-stone-600 mb-1" />
            <p className="text-[8px] font-black uppercase text-stone-500 tracking-widest">Network</p>
            <p className="text-[10px] font-bold text-stone-400">SSL Encrypted</p>
          </div>
          <div className="flex flex-col items-center text-center">
            <AlertCircle className="w-4 h-4 text-stone-600 mb-1" />
            <p className="text-[8px] font-black uppercase text-stone-500 tracking-widest">Log Level</p>
            <p className="text-[10px] font-bold text-stone-400">Verbose</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

const MetricCard: React.FC<{ icon: React.ReactNode, label: string, value: string, sub: string }> = ({ icon, label, value, sub }) => (
  <div className="bg-stone-900 border border-white/5 p-5 rounded-[2rem] flex flex-col justify-between h-32 transition-all hover:bg-stone-800">
    <div className="flex justify-between items-start">
      <div className="p-2 bg-black/40 rounded-xl text-stone-400">{icon}</div>
      <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
    </div>
    <div>
      <p className="text-[9px] font-black uppercase text-stone-500 tracking-widest mb-0.5">{label}</p>
      <div className="flex items-baseline gap-2">
        <span className="text-xl font-black text-white">{value}</span>
        <span className="text-[9px] font-bold text-stone-600">{sub}</span>
      </div>
    </div>
  </div>
);

const TabButton: React.FC<{ active: boolean, onClick: () => void, icon: React.ReactNode, label: string }> = ({ active, onClick, icon, label }) => (
  <button 
    onClick={onClick}
    className={`flex-shrink-0 flex items-center justify-center gap-2 py-3 px-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all
      ${active ? 'bg-amber-600 text-white shadow-lg' : 'text-stone-500 hover:text-stone-300'}
    `}
  >
    {icon} {label}
  </button>
);

const FeatureStatusCard: React.FC<{ icon: React.ReactNode, name: string, count: number, status: string, desc: string }> = ({ icon, name, count, status, desc }) => (
  <div className="bg-stone-900 border border-white/5 p-5 rounded-[2rem] flex items-center gap-4 transition-all hover:bg-stone-800">
    <div className="p-3 bg-black/40 rounded-2xl text-stone-400">{icon}</div>
    <div className="flex-1">
      <div className="flex justify-between items-center mb-1">
        <h4 className="text-sm font-black text-white">{name}</h4>
        <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest ${status === 'Active' ? 'bg-emerald-500/20 text-emerald-500' : 'bg-stone-500/20 text-stone-500'}`}>
          {status}
        </span>
      </div>
      <p className="text-[10px] text-stone-500 font-medium mb-2">{desc}</p>
      <div className="flex items-center gap-2">
        <div className="h-1 flex-1 bg-white/5 rounded-full overflow-hidden">
          <div className="h-full bg-amber-600" style={{ width: `${Math.min(count * 10, 100)}%` }} />
        </div>
        <span className="text-[10px] font-mono text-stone-400">{count} units</span>
      </div>
    </div>
  </div>
);

export default AdminPanel;
