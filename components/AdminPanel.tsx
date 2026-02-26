
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
  Send
} from 'lucide-react';
import { JournalEntry, Task } from '../types';

const AdminPanel: React.FC = () => {
  const [stats, setStats] = React.useState({
    totalLogs: 0,
    totalTasks: 0,
    storageSize: 0,
    apiRequests: 42 // Mocked
  });

  const [activeTab, setActiveTab] = React.useState<'metrics' | 'explorer' | 'broadcast'>('metrics');
  const [broadcastMessage, setBroadcastMessage] = React.useState('');
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  React.useEffect(() => {
    refreshStats();
  }, []);

  const refreshStats = () => {
    setIsRefreshing(true);
    const journalRaw = localStorage.getItem('agriassist_journal');
    const tasksRaw = localStorage.getItem('agri_tasks');
    const entries: JournalEntry[] = journalRaw ? JSON.parse(journalRaw) : [];
    const tasks: Task[] = tasksRaw ? JSON.parse(tasksRaw) : [];
    
    setStats({
      totalLogs: entries.length,
      totalTasks: tasks.length,
      storageSize: (JSON.stringify(localStorage).length / 1024),
      apiRequests: Math.floor(Math.random() * 100) + 50
    });
    
    setTimeout(() => setIsRefreshing(false), 800);
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
          label="Active Tenants" 
          value="1" 
          sub="Local Host"
        />
        <MetricCard 
          icon={<Activity className="w-5 h-5 text-emerald-400" />} 
          label="System Health" 
          value="Optimal" 
          sub="All Nodes Online"
        />
        <MetricCard 
          icon={<Database className="w-5 h-5 text-blue-400" />} 
          label="DB Capacity" 
          value={`${stats.storageSize.toFixed(1)} KB`} 
          sub="Browser Partition"
        />
        <MetricCard 
          icon={<Zap className="w-5 h-5 text-amber-400" />} 
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
          <p className="text-emerald-500">[SYSTEM] Initialization complete. Protocol 7.4 active.</p>
          <p>[STORAGE] Successfully queried 'agri_tasks' partition.</p>
          <p>[NETWORK] Latency to Gemini Edge: 42ms.</p>
          <p>[AUTH] Farmer session validated via LocalToken.</p>
          <p className="text-amber-500">[WARN] High memory consumption in SoilLab module.</p>
          <p>[CACHE] Purged 12 expired image assets.</p>
        </div>
      </div>
    </div>
  );

  const renderExplorer = () => (
    <div className="space-y-4 animate-in fade-in duration-500">
      <div className="bg-stone-900 rounded-[2rem] p-6 border border-white/5">
        <h3 className="text-xs font-black text-stone-500 uppercase tracking-widest mb-4">Storage Partitions</h3>
        <div className="space-y-3">
          {Object.keys(localStorage).map((key) => (
            <div key={key} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5">
              <div className="flex items-center gap-3">
                <FileJson className="w-4 h-4 text-stone-500" />
                <span className="text-xs font-bold text-stone-300">{key}</span>
              </div>
              <span className="text-[10px] font-mono text-stone-500">{(localStorage.getItem(key)?.length || 0)} bytes</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderBroadcast = () => (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="bg-stone-900 rounded-[2rem] p-6 border border-white/5">
        <h3 className="text-xs font-black text-stone-500 uppercase tracking-widest mb-4 flex items-center gap-2">
          <Radio className="w-4 h-4 text-rose-500" /> Global Alert Broadcast
        </h3>
        <p className="text-[10px] text-stone-400 mb-6 leading-relaxed">
          Broadcasting a message will inject it into the dashboard of all farmers in this local partition.
        </p>
        <textarea 
          value={broadcastMessage}
          onChange={(e) => setBroadcastMessage(e.target.value)}
          placeholder="e.g. Extreme weather warning: Heavy hailstorm predicted for Northern District..."
          className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-xs font-medium text-white outline-none focus:border-rose-500 transition-colors resize-none mb-4"
          rows={5}
        />
        <button 
          onClick={handleSendBroadcast}
          disabled={!broadcastMessage.trim()}
          className="w-full bg-rose-600 text-white font-black py-4 rounded-[1.25rem] shadow-xl shadow-rose-950/40 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-20"
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
          <div className="p-2.5 bg-rose-600/20 rounded-xl border border-rose-500/20">
            <Shield className="w-6 h-6 text-rose-500" />
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
      <div className="flex gap-2 p-1 bg-white/5 rounded-[1.5rem] border border-white/5">
        <TabButton 
          active={activeTab === 'metrics'} 
          onClick={() => setActiveTab('metrics')} 
          icon={<BarChart3 className="w-4 h-4" />}
          label="Metrics"
        />
        <TabButton 
          active={activeTab === 'explorer'} 
          onClick={() => setActiveTab('explorer')} 
          icon={<Server className="w-4 h-4" />}
          label="Nodes"
        />
        <TabButton 
          active={activeTab === 'broadcast'} 
          onClick={() => setActiveTab('broadcast')} 
          icon={<Radio className="w-4 h-4" />}
          label="Broadcast"
        />
      </div>

      {activeTab === 'metrics' && renderMetrics()}
      {activeTab === 'explorer' && renderExplorer()}
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
    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all
      ${active ? 'bg-rose-600 text-white shadow-lg' : 'text-stone-500 hover:text-stone-300'}
    `}
  >
    {icon} {label}
  </button>
);

export default AdminPanel;
