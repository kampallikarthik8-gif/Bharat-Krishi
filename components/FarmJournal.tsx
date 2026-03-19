
import React from 'react';
import { BookOpen, Plus, Trash2, Calendar, Tag, FileText, Sparkles, Loader2, ChevronRight, X, Download, MessageCircle } from 'lucide-react';
import { JournalEntry } from '../types';
import { analyzeJournal } from '../services/geminiService';
import ReactMarkdown from 'react-markdown';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { db, auth } from '../src/firebase';
import { collection, addDoc, deleteDoc, doc, onSnapshot, query, orderBy } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../src/utils/firestoreErrorHandler';

import { useFirebase } from '../src/components/FirebaseProvider';

interface FarmJournalProps {
  language: string;
}

const FarmJournal: React.FC<FarmJournalProps> = ({ language }) => {
  const { activeFarmId } = useFirebase();
  const [entries, setEntries] = React.useState<JournalEntry[]>([]);
  const [loading, setLoading] = React.useState(true);
  
  const [showForm, setShowForm] = React.useState(false);
  const [analyzing, setAnalyzing] = React.useState(false);
  const [analysis, setAnalysis] = React.useState<string | null>(null);
  const [newEntry, setNewEntry] = React.useState<Partial<JournalEntry>>({
    category: 'Planting',
    crop: '',
    notes: '',
    date: new Date().toISOString().split('T')[0]
  });

  React.useEffect(() => {
    if (!activeFarmId) return;

    const path = `users/${activeFarmId}/journal`;
    const q = query(collection(db, path), orderBy('date', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const journalData: JournalEntry[] = [];
      snapshot.forEach((doc) => {
        journalData.push({ id: doc.id, ...doc.data() } as JournalEntry);
      });
      setEntries(journalData);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [activeFarmId]);

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text('Bharat Kisan - Farm Journal Report', 14, 22);
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 30);

    const tableData = entries.map(entry => [
      entry.date,
      entry.category,
      entry.crop,
      entry.notes
    ]);

    autoTable(doc, {
      startY: 40,
      head: [['Date', 'Category', 'Crop/Field', 'Notes']],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: [45, 90, 39] }
    });

    doc.save(`BharatKisan_Journal_Report_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const shareOnWhatsApp = () => {
    if (!analysis) return;
    const message = `*Bharat Kisan - Seasonal Farm Analysis*%0A%0A` +
      `${analysis.substring(0, 500)}${analysis.length > 500 ? '...' : ''}%0A%0A` +
      `Generated via Bharat Kisan App`;
    
    window.open(`https://wa.me/?text=${message}`, '_blank');
  };

  const addEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeFarmId || !newEntry.crop || !newEntry.notes) return;

    const path = `users/${activeFarmId}/journal`;
    const entryData = {
      date: newEntry.date!,
      category: newEntry.category as JournalEntry['category'],
      crop: newEntry.crop!,
      notes: newEntry.notes!
    };

    try {
      await addDoc(collection(db, path), entryData);
      setShowForm(false);
      setNewEntry({ category: 'Planting', crop: '', notes: '', date: new Date().toISOString().split('T')[0] });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  };

  const deleteEntry = async (id: string) => {
    if (!activeFarmId) return;
    const path = `users/${activeFarmId}/journal/${id}`;
    try {
      await deleteDoc(doc(db, path));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  };

  const handleAnalyze = async () => {
    if (entries.length === 0) return;
    setAnalyzing(true);
    try {
      const result = await analyzeJournal(entries, language);
      setAnalysis(result);
    } catch (err) {
      console.error(err);
    } finally {
      setAnalyzing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <BookOpen className="text-emerald-600" />
            Field Log ({language})
          </h2>
          <p className="text-stone-500">Keep track of your farming activities and seasonal progress.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={exportPDF}
            className="bg-stone-100 text-stone-600 p-3 rounded-xl hover:bg-stone-200 transition-colors"
            title="Export PDF"
          >
            <Download className="w-5 h-5" />
          </button>
          <button 
            onClick={() => setShowForm(!showForm)}
            className="bg-emerald-600 text-white font-bold px-6 py-3 rounded-xl hover:bg-emerald-700 transition-all flex items-center gap-2 shadow-lg shadow-emerald-200"
          >
            {showForm ? <Trash2 className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {showForm ? 'Cancel' : 'New Entry'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button 
          onClick={handleAnalyze}
          disabled={entries.length < 2 || analyzing}
          className="w-full bg-[#ffddb3] text-[#825500] font-black py-4 rounded-2xl flex items-center justify-center gap-3 border border-[#825500]/20 active:scale-95 transition-all disabled:opacity-50"
        >
          {analyzing ? <Loader2 className="animate-spin w-5 h-5" /> : <Sparkles className="w-5 h-5" />}
          Generate Seasonal Analysis
        </button>
      </div>

      {analysis && (
        <div className="fixed inset-0 z-[110] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-300">
           <div className="w-full max-w-lg bg-white rounded-[3rem] p-8 shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-500 max-h-[80vh] flex flex-col">
              <button onClick={() => setAnalysis(null)} className="absolute top-6 right-6 p-2 bg-stone-50 rounded-full hover:bg-stone-100">
                 <X className="w-5 h-5 text-stone-500" />
              </button>
              
              <div className="flex items-center gap-3 mb-6">
                 <div className="bg-[#ffddb3] p-3 rounded-2xl">
                    <Sparkles className="text-[#825500] w-6 h-6" />
                 </div>
                 <div>
                    <h3 className="text-xl font-black text-stone-900 leading-none">Strategic Intelligence</h3>
                    <p className="text-[10px] text-[#825500] font-black uppercase tracking-widest mt-1">Grounded in your field log</p>
                 </div>
              </div>

              <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                <div className="prose prose-stone max-w-none text-sm font-medium text-stone-700 leading-relaxed">
                   <ReactMarkdown>{analysis}</ReactMarkdown>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-stone-100 flex justify-end gap-3">
                <button 
                  onClick={shareOnWhatsApp}
                  className="bg-[#25D366] text-white px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest active:scale-95 transition-all flex items-center gap-2"
                >
                  <MessageCircle className="w-4 h-4" /> Share WhatsApp
                </button>
                <button 
                  onClick={() => setAnalysis(null)}
                  className="bg-stone-900 text-white px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest active:scale-95 transition-all"
                >
                  Dismiss Analysis
                </button>
              </div>
           </div>
        </div>
      )}

      {showForm && (
        <form onSubmit={addEntry} className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm animate-in slide-in-from-top-4 duration-300">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-stone-400 ml-1">CATEGORY</label>
              <select 
                value={newEntry.category}
                onChange={e => setNewEntry({...newEntry, category: e.target.value as any})}
                className="w-full bg-stone-50 border border-stone-200 p-3 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
              >
                <option>Planting</option>
                <option>Irrigation</option>
                <option>Fertilizer</option>
                <option>Pest Control</option>
                <option>Harvest</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-stone-400 ml-1">DATE</label>
              <input 
                type="date"
                value={newEntry.date}
                onChange={e => setNewEntry({...newEntry, date: e.target.value})}
                className="w-full bg-stone-50 border border-stone-200 p-3 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>
            <div className="space-y-1 md:col-span-2">
              <label className="text-[10px] font-bold text-stone-400 ml-1">CROP / FIELD</label>
              <input 
                type="text"
                placeholder="e.g. Field A Tomatoes"
                value={newEntry.crop}
                onChange={e => setNewEntry({...newEntry, crop: e.target.value})}
                className="w-full bg-stone-50 border border-stone-200 p-3 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                required
              />
            </div>
          </div>
          <div className="space-y-1 mb-6">
            <label className="text-[10px] font-bold text-stone-400 ml-1">NOTES</label>
            <textarea 
              rows={3}
              placeholder="Record any details, observations or actions taken..."
              value={newEntry.notes}
              onChange={e => setNewEntry({...newEntry, notes: e.target.value})}
              className="w-full bg-stone-50 border border-stone-200 p-3 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none resize-none"
            />
          </div>
          <button type="submit" className="w-full bg-emerald-600 text-white font-bold py-3 rounded-xl hover:bg-emerald-700 transition-colors">
            Save Journal Entry
          </button>
        </form>
      )}

      <div className="space-y-4">
        {entries.length === 0 ? (
          <div className="bg-white p-12 rounded-3xl border border-stone-200 text-center flex flex-col items-center">
            <div className="bg-stone-50 p-4 rounded-full mb-4">
              <BookOpen className="w-8 h-8 text-stone-300" />
            </div>
            <p className="text-stone-500 font-medium">No records yet. Start your farm journal today!</p>
          </div>
        ) : (
          entries.map(entry => (
            <div key={entry.id} className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm flex flex-col md:flex-row gap-6 group hover:border-emerald-200 transition-all">
              <div className="md:w-48 shrink-0">
                <div className="flex items-center gap-2 text-stone-400 text-xs font-bold mb-1">
                  <Calendar className="w-3 h-3" />
                  {new Date(entry.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </div>
                <div className={`
                  inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase
                  ${entry.category === 'Planting' ? 'bg-emerald-100 text-emerald-700' : 
                    entry.category === 'Harvest' ? 'bg-amber-100 text-amber-700' :
                    entry.category === 'Irrigation' ? 'bg-blue-100 text-blue-700' :
                    'bg-stone-100 text-stone-600'}
                `}>
                  <Tag className="w-2.5 h-2.5" />
                  {entry.category}
                </div>
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-stone-900 mb-2 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-emerald-500" />
                  {entry.crop}
                </h4>
                <p className="text-stone-600 text-sm leading-relaxed">{entry.notes}</p>
              </div>
              <button 
                onClick={() => deleteEntry(entry.id)}
                className="opacity-0 group-hover:opacity-100 p-2 text-stone-300 hover:text-red-500 transition-all self-start"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default FarmJournal;
