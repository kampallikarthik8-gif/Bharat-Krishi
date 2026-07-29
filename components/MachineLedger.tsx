import React from 'react';
import { motion } from 'motion/react';
import { 
  Settings2, 
  Fuel, 
  Wrench, 
  Calendar, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  AlertTriangle,
  History,
  TrendingUp,
  Cpu
} from 'lucide-react';
import { useDialogs } from '../src/components/DialogProvider';

interface Machine {
  id: string;
  name: string;
  type: string;
  fuelLevel: number;
  nextService: string;
  status: 'Operational' | 'Maintenance' | 'Critical';
  lastUsed: string;
  totalHours: number;
}

interface LogEntry {
  id: string;
  machineId: string;
  type: 'Fuel' | 'Service' | 'Repair';
  date: string;
  cost: number;
  notes: string;
}

const MachineLedger: React.FC = () => {
  const { alert, confirm, prompt } = useDialogs();
  const [machines, setMachines] = React.useState<Machine[]>([
    { id: '1', name: 'John Deere 5050D', type: 'Tractor', fuelLevel: 65, nextService: '2026-05-15', status: 'Operational', lastUsed: '2026-04-18', totalHours: 1240 },
    { id: '2', name: 'Mahindra Arjun 555', type: 'Tractor', fuelLevel: 20, nextService: '2026-04-20', status: 'Maintenance', lastUsed: '2026-04-15', totalHours: 850 },
    { id: '3', name: 'Kubota Combine', type: 'Harvester', fuelLevel: 95, nextService: '2026-06-01', status: 'Operational', lastUsed: '2026-03-20', totalHours: 420 }
  ]);

  const [logs, setLogs] = React.useState<LogEntry[]>([
    { id: 'l1', machineId: '1', type: 'Fuel', date: '2026-04-18', cost: 2500, notes: 'Full tank refill' },
    { id: 'l2', machineId: '2', type: 'Service', date: '2026-04-10', cost: 5000, notes: 'Oil filter change' }
  ]);

  const deleteMachine = (id: string) => {
    confirm({
      title: 'Remove Machine',
      message: 'Are you sure you want to remove this equipment from the system?',
      type: 'danger',
      onConfirm: () => setMachines(prev => prev.filter(m => m.id !== id))
    });
  };

  const addFuel = (id: string) => {
    prompt({
      title: 'Add Fuel',
      message: 'Enter amount of fuel added (L):',
      onConfirm: (val) => {
        if (val) {
          setMachines(prev => prev.map(m => m.id === id ? { ...m, fuelLevel: Math.min(100, m.fuelLevel + parseInt(val)) } : m));
          alert({ title: 'Success', message: 'Fuel levels updated successfully.' });
        }
      }
    });
  };

  return (
    <div className="space-y-8 pb-32 animate-in fade-in duration-700 bg-[var(--m3-background)] min-h-screen">
      <section className="px-6 pt-16 pb-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full blur-[100px] -mr-32 -mt-32" />
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex flex-col gap-8 relative z-10"
        >
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              <span className="text-[10px] font-mono text-amber-500 font-bold uppercase tracking-[0.4em]">Hardware Lifecycle.</span>
            </div>
            <h2 className="text-5xl font-black text-white tracking-tighter font-sans uppercase leading-none">
              Machine <span className="text-amber-500">Ledger.</span>
            </h2>
            <p className="text-[10px] font-mono text-white/30 uppercase tracking-[0.2em]">Maintenance & Fuel Registry</p>
          </div>
        </motion.div>
      </section>

      <div className="px-6 grid grid-cols-1 md:grid-cols-2 gap-6">
        {machines.map((machine, idx) => (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            key={machine.id}
            className="bg-[var(--m3-surface-container-low)] rounded-[2.5rem] p-8 border border-white/5 space-y-6 relative overflow-hidden group shadow-2xl"
          >
            <div className="absolute top-0 right-0 p-8 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity">
              <Settings2 className="w-32 h-32 rotate-12" />
            </div>

            <div className="flex justify-between items-start relative z-10">
              <div className="flex items-center gap-4">
                <div className={`p-4 rounded-2xl border ${
                  machine.status === 'Operational' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' :
                  machine.status === 'Maintenance' ? 'bg-amber-500/10 border-amber-500/20 text-amber-500' :
                  'bg-rose-500/10 border-rose-500/20 text-rose-500'
                }`}>
                  <Cpu className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-white uppercase tracking-tighter">{machine.name}</h3>
                  <p className="text-[10px] font-mono text-white/30 uppercase tracking-widest">{machine.type}</p>
                </div>
              </div>
              <button onClick={() => deleteMachine(machine.id)} className="p-2 text-white/10 hover:text-rose-500 transition-colors">
                <Trash2 className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-5 bg-white/[0.02] border border-white/5 rounded-3xl">
                <p className="text-[9px] font-mono text-white/30 uppercase tracking-widest mb-1">Fuel Status</p>
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-1000 ${machine.fuelLevel > 30 ? 'bg-amber-500' : 'bg-rose-500'}`}
                      style={{ width: `${machine.fuelLevel}%` }}
                    />
                  </div>
                  <span className="text-xs font-mono font-bold text-white">{machine.fuelLevel}%</span>
                </div>
              </div>
              <div className="p-5 bg-white/[0.02] border border-white/5 rounded-3xl">
                <p className="text-[9px] font-mono text-white/30 uppercase tracking-widest mb-1">Total Hours</p>
                <p className="text-lg font-black text-white">{machine.totalHours.toLocaleString()}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 relative z-10">
              <button 
                onClick={() => addFuel(machine.id)}
                className="flex-1 py-4 bg-white/[0.03] border border-white/10 rounded-2xl flex items-center justify-center gap-3 active:scale-95 transition-all text-white/60 hover:text-white"
              >
                <Fuel className="w-4 h-4 text-amber-500" />
                <span className="text-[9px] font-black uppercase tracking-widest">Add Fuel</span>
              </button>
              <button 
                onClick={() => alert({ title: 'Service Logged', message: `Maintenance entry created for ${machine.name}` })}
                className="flex-1 py-4 bg-white/[0.03] border border-white/10 rounded-2xl flex items-center justify-center gap-3 active:scale-95 transition-all text-white/60 hover:text-white"
              >
                <Wrench className="w-4 h-4 text-emerald-500" />
                <span className="text-[9px] font-black uppercase tracking-widest">Service</span>
              </button>
            </div>

            <div className="pt-4 border-t border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Calendar className="w-4 h-4 text-white/20" />
                <span className="text-[9px] font-mono text-white/30 uppercase tracking-widest">Next Service: {machine.nextService}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-1.5 h-1.5 rounded-full ${machine.status === 'Operational' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                <span className="text-[9px] font-mono text-white/40 uppercase tracking-widest">{machine.status}</span>
              </div>
            </div>
          </motion.div>
        ))}

        <button 
          onClick={() => prompt({ title: 'New Machine', message: 'Enter unit codename:', onConfirm: () => {} })}
          className="h-full min-h-[300px] border-2 border-dashed border-white/5 rounded-[2.5rem] flex flex-col items-center justify-center gap-4 hover:border-amber-500/20 hover:bg-amber-500/[0.02] transition-all group"
        >
          <div className="p-6 bg-white/[0.03] rounded-3xl text-white/10 group-hover:text-amber-500 transition-colors">
            <Plus className="w-8 h-8" />
          </div>
          <p className="text-[10px] font-mono text-white/20 uppercase tracking-[0.4em] group-hover:text-white transition-colors">Commission Unit</p>
        </button>
      </div>

      <section className="px-6 space-y-6">
        <div className="flex items-center gap-3 ml-2">
          <div className="w-1 h-3 bg-amber-500 rounded-full" />
          <h3 className="text-[11px] font-black text-white uppercase tracking-[0.3em]">Operational Logs</h3>
        </div>
        
        <div className="bg-[var(--m3-surface-container-low)] rounded-[2.5rem] border border-white/5 overflow-hidden">
          {logs.map((log, idx) => (
            <div key={log.id} className="p-8 border-b border-white/5 last:border-0 flex items-center justify-between group hover:bg-white/[0.01] transition-colors">
              <div className="flex items-center gap-6">
                <div className={`p-4 rounded-2xl ${
                  log.type === 'Fuel' ? 'bg-amber-500/10 text-amber-500' : 'bg-emerald-500/10 text-emerald-500'
                }`}>
                  {log.type === 'Fuel' ? <Fuel className="w-5 h-5" /> : <Wrench className="w-5 h-5" />}
                </div>
                <div>
                  <p className="text-sm font-black text-white uppercase tracking-widest">{log.type} entry</p>
                  <p className="text-[9px] font-mono text-white/20 uppercase tracking-widest mt-1">{log.date} • {log.notes}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-base font-black text-white tracking-widest">₹{log.cost.toLocaleString()}</p>
                <p className="text-[9px] font-mono text-white/20 uppercase tracking-widest">Processed</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default MachineLedger;
