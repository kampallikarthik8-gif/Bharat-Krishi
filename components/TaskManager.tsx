
import React from 'react';
import { Task } from '../types';
import { 
  Plus, 
  Trash2, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  ChevronRight, 
  X, 
  Calendar, 
  ClipboardCheck,
  Search,
  Check,
  Sparkles,
  Loader2
} from 'lucide-react';
import { suggestTasks } from '../services/geminiService';
import { db, auth } from '../src/firebase';
import { collection, query, onSnapshot, addDoc, updateDoc, deleteDoc, doc, orderBy } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../src/utils/firestoreErrorHandler';
import { useFirebase } from '../src/components/FirebaseProvider';

const CATEGORIES = ['General', 'Irrigation', 'Pest Control', 'Fertilizing', 'Harvesting', 'Repairs', 'Livestock'];

interface TaskManagerProps {
  language: string;
}

const TaskManager: React.FC<TaskManagerProps> = ({ language }) => {
  const { activeFarmId } = useFirebase();
  const [tasks, setTasks] = React.useState<Task[]>([]);
  const [loading, setLoading] = React.useState(true);
  
  const [showAdd, setShowAdd] = React.useState(false);
  const [suggesting, setSuggesting] = React.useState(false);
  const [suggestions, setSuggestions] = React.useState<Partial<Task>[] | null>(null);
  const [filter, setFilter] = React.useState<'All' | 'Pending' | 'Completed'>('All');
  const [newTask, setNewTask] = React.useState<Partial<Task>>({
    priority: 'Medium',
    category: 'General',
    status: 'Pending'
  });

  React.useEffect(() => {
    if (!activeFarmId) return;

    const path = `users/${activeFarmId}/tasks`;
    const q = query(collection(db, path), orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const taskList: Task[] = [];
      snapshot.forEach((doc) => {
        taskList.push({ id: doc.id, ...doc.data() } as Task);
      });
      setTasks(taskList);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    });

    return () => unsubscribe();
  }, []);

  const addTask = async (e?: React.FormEvent, customTask?: Partial<Task>) => {
    if (e) e.preventDefault();
    if (!activeFarmId) return;

    const taskToUse = customTask || newTask;
    if (!taskToUse.title) return;
    
    const path = `users/${activeFarmId}/tasks`;
    const taskData = {
      title: taskToUse.title,
      description: taskToUse.description || '',
      priority: taskToUse.priority as Task['priority'],
      status: 'Pending',
      category: taskToUse.category || 'General',
      createdAt: new Date().toISOString()
    };
    
    try {
      await addDoc(collection(db, path), taskData);
      if (!customTask) {
        setShowAdd(false);
        setNewTask({ priority: 'Medium', category: 'General', status: 'Pending' });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  };

  const getAiSuggestions = async () => {
    setSuggesting(true);
    setSuggestions(null);
    try {
      const weatherText = "Sunny, 24C, 60% Humidity"; // Placeholder
      const crops = JSON.parse(localStorage.getItem('agri_main_crops') || '["Corn", "Wheat"]');
      const date = new Date().toLocaleDateString();
      
      const aiSuggestions = await suggestTasks({ weather: weatherText, crops, date }, language);
      setSuggestions(aiSuggestions);
    } catch (err) {
      console.error(err);
    } finally {
      setSuggesting(false);
    }
  };

  const toggleTask = async (id: string, currentStatus: string) => {
    if (!activeFarmId) return;
    const path = `users/${activeFarmId}/tasks/${id}`;
    try {
      await updateDoc(doc(db, path), {
        status: currentStatus === 'Pending' ? 'Completed' : 'Pending'
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  };

  const deleteTask = async (id: string) => {
    if (!activeFarmId) return;
    const path = `users/${activeFarmId}/tasks/${id}`;
    try {
      await deleteDoc(doc(db, path));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  };

  const filteredTasks = tasks.filter(t => {
    if (filter === 'All') return true;
    return t.status === filter;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12 animate-in fade-in slide-in-from-bottom-6">
      <div className="flex items-center justify-between px-2">
        <div>
           <h2 className="text-2xl font-black text-stone-900 flex items-center gap-3">
              <ClipboardCheck className="w-6 h-6 text-[#825500]" />
              Farm Agenda ({language})
           </h2>
           <p className="text-[10px] text-stone-400 font-black uppercase tracking-widest mt-1">Central Operations Manager</p>
        </div>
        <div className="flex gap-2">
           <button 
            onClick={getAiSuggestions}
            disabled={suggesting}
            className="bg-[#ffddb3] text-[#825500] p-3 rounded-2xl shadow-lg border border-[#825500]/20 active:scale-90 transition-transform"
            title="Get AI Task Suggestions"
          >
            {suggesting ? <Loader2 className="w-6 h-6 animate-spin" /> : <Sparkles className="w-6 h-6" />}
          </button>
          <button 
            onClick={() => setShowAdd(true)}
            className="bg-stone-900 text-white p-3 rounded-2xl shadow-xl active:scale-90 transition-transform"
          >
            <Plus className="w-6 h-6" />
          </button>
        </div>
      </div>

      {suggestions && (
        <div className="mx-2 bg-stone-900 rounded-[2.5rem] p-6 shadow-2xl border border-white/10 animate-in slide-in-from-top-4">
           <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                 <Sparkles className="w-4 h-4 text-amber-400" />
                 <h3 className="text-xs font-black uppercase text-amber-50 tracking-[0.2em]">Proactive Recommendations</h3>
              </div>
              <button onClick={() => setSuggestions(null)} className="text-white/40 hover:text-white">
                 <X className="w-4 h-4" />
              </button>
           </div>
           <div className="space-y-3">
              {suggestions.map((s, i) => (
                <div key={i} className="bg-white/10 border border-white/5 p-4 rounded-[1.5rem] flex items-center justify-between gap-4 group">
                   <div className="flex-1 min-w-0">
                      <p className="text-[8px] font-black uppercase text-amber-400 mb-1">{s.category} • {s.priority} Priority</p>
                      <h4 className="text-sm font-bold text-white leading-snug">{s.title}</h4>
                      <p className="text-[10px] text-white/50 truncate mt-0.5">{s.description}</p>
                   </div>
                   <button 
                    onClick={() => { addTask(undefined, s); setSuggestions(prev => prev?.filter((_, idx) => idx !== i) || null); }}
                    className="shrink-0 bg-amber-400 text-stone-900 p-2.5 rounded-xl font-black text-[9px] uppercase active:scale-90 transition-transform shadow-lg"
                   >
                      Add
                   </button>
                </div>
              ))}
           </div>
        </div>
      )}

      <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar px-1">
         {(['All', 'Pending', 'Completed'] as const).map(f => (
           <button
             key={f}
             onClick={() => setFilter(f)}
             className={`px-5 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all ${
               filter === f ? 'bg-[#ffddb3] text-[#825500] border-[#825500] shadow-sm' : 'bg-white text-stone-400 border-stone-100'
             }`}
           >
             {f}
           </button>
         ))}
      </div>

      <div className="space-y-3">
        {filteredTasks.length === 0 ? (
          <div className="py-24 text-center opacity-30 flex flex-col items-center">
             <ClipboardCheck className="w-20 h-20 mb-4" />
             <p className="font-black text-xs uppercase tracking-widest">No activities logged</p>
          </div>
        ) : (
          filteredTasks.map(task => (
            <div 
              key={task.id} 
              className={`bg-white rounded-[2rem] border p-5 flex items-center gap-5 transition-all group ${
                task.status === 'Completed' ? 'opacity-50 border-stone-100' : 'border-stone-200 hover:border-[#825500]/30 shadow-sm'
              }`}
            >
              <button 
                onClick={() => toggleTask(task.id, task.status)}
                className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border-2 transition-all ${
                  task.status === 'Completed' 
                    ? 'bg-emerald-500 border-emerald-500 text-white' 
                    : 'bg-white border-stone-100 text-transparent hover:border-[#825500]'
                }`}
              >
                <Check className="w-5 h-5" />
              </button>
              
              <div className="flex-1 min-w-0">
                 <h4 className={`font-black text-stone-900 text-sm tracking-tight truncate ${task.status === 'Completed' ? 'line-through' : ''}`}>
                    {task.title}
                 </h4>
                 <div className="flex items-center gap-3 mt-1">
                    <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md ${
                      task.priority === 'High' ? 'bg-rose-50 text-rose-600' : 
                      task.priority === 'Medium' ? 'bg-amber-50 text-amber-600' : 'bg-stone-100 text-stone-500'
                    }`}>
                      {task.priority} Priority
                    </span>
                    <span className="text-[9px] text-stone-400 font-bold uppercase">{task.category}</span>
                 </div>
              </div>

              <button 
                onClick={() => deleteTask(task.id)}
                className="opacity-0 group-hover:opacity-100 p-2 text-stone-300 hover:text-rose-500 transition-all"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))
        )}
      </div>

      {showAdd && (
        <div className="fixed inset-0 z-[110] bg-black/60 backdrop-blur-sm flex items-end animate-in fade-in duration-300">
           <div className="w-full max-w-md mx-auto bg-white rounded-t-[3rem] p-8 animate-in slide-in-from-bottom-full duration-500">
              <div className="flex items-center justify-between mb-8">
                 <h3 className="text-xl font-black text-stone-900">New Farm Task</h3>
                 <button onClick={() => setShowAdd(false)} className="p-2 bg-stone-50 rounded-full">
                    <X className="w-5 h-5" />
                 </button>
              </div>

              <form onSubmit={addTask} className="space-y-6">
                 <div className="space-y-1">
                    <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-2">Objective</label>
                    <input 
                      autoFocus
                      placeholder="e.g. Check North Field Drip Lines" 
                      className="w-full bg-stone-50 border border-stone-100 p-4 rounded-2xl outline-none focus:ring-2 focus:ring-[#825500] font-bold text-sm"
                      value={newTask.title || ''}
                      onChange={e => setNewTask({...newTask, title: e.target.value})}
                    />
                 </div>

                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                       <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-2">Priority</label>
                       <select 
                         className="w-full bg-stone-50 border border-stone-100 p-4 rounded-2xl outline-none appearance-none font-bold text-xs"
                         value={newTask.priority}
                         onChange={e => setNewTask({...newTask, priority: e.target.value as any})}
                       >
                          <option>Low</option>
                          <option>Medium</option>
                          <option>High</option>
                       </select>
                    </div>
                    <div className="space-y-1">
                       <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-2">Category</label>
                       <select 
                         className="w-full bg-stone-50 border border-stone-100 p-4 rounded-2xl outline-none appearance-none font-bold text-xs"
                         value={newTask.category}
                         onChange={e => setNewTask({...newTask, category: e.target.value})}
                       >
                          {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                       </select>
                    </div>
                 </div>

                 <div className="space-y-1">
                    <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-2">Extra Details</label>
                    <textarea 
                      placeholder="Specific instructions or observations..."
                      className="w-full bg-stone-50 border border-stone-100 p-4 rounded-2xl outline-none focus:ring-2 focus:ring-[#825500] font-medium text-xs resize-none"
                      rows={3}
                      value={newTask.description || ''}
                      onChange={e => setNewTask({...newTask, description: e.target.value})}
                    />
                 </div>

                 <button 
                   type="submit"
                   className="w-full bg-stone-900 text-white font-black py-5 rounded-[1.5rem] shadow-xl active:scale-95 transition-all flex items-center justify-center gap-3"
                 >
                    <Plus className="w-5 h-5" /> Register Activity
                 </button>
              </form>
           </div>
        </div>
      )}
    </div>
  );
};

export default TaskManager;
