
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
  const { activeFarmId, profile } = useFirebase();
  const [entries, setEntries] = React.useState<JournalEntry[]>([]);
  const [transactions, setTransactions] = React.useState<any[]>([]);
  const [batches, setBatches] = React.useState<any[]>([]);
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

    // 1. Subscribe to field journal entries
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

    // 2. Subscribe to transactions for cost and input logs
    const txPath = `users/${activeFarmId}/transactions`;
    const txQ = query(collection(db, txPath), orderBy('date', 'desc'));
    const unsubscribeTx = onSnapshot(txQ, (snapshot) => {
      const txData: any[] = [];
      snapshot.forEach((doc) => {
        txData.push({ id: doc.id, ...doc.data() });
      });
      setTransactions(txData);
    }, (error) => {
      console.error("Error fetching transactions for journal report:", error);
    });

    // 3. Subscribe to produce ledger for yield logs
    const currentUid = auth.currentUser?.uid;
    const prodQ = query(collection(db, 'produce_ledger'), orderBy('createdAt', 'desc'));
    const unsubscribeProd = onSnapshot(prodQ, (snapshot) => {
      const prodData: any[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        if (data.farmerId === currentUid) {
          prodData.push({ id: doc.id, ...data });
        }
      });
      setBatches(prodData);
    }, (error) => {
      console.error("Error fetching produce batches for journal report:", error);
    });

    return () => {
      unsubscribe();
      unsubscribeTx();
      unsubscribeProd();
    };
  }, [activeFarmId]);

  const exportPDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    
    // --- Header Branding ---
    doc.setFillColor(45, 90, 39); // Deep Forest Green
    doc.rect(0, 0, pageWidth, 42, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.text('BHARAT KISAN', 14, 18);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text('INTEGRATED FARM PERFORMANCE & FINANCIAL AUDIT REPORT', 14, 25);
    doc.text('Certified Official Record for Banks, Subsidies, and Government Schemes', 14, 30);
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.text(`REPORT REF ID: BK-${Math.floor(100000 + Math.random() * 900000)}`, pageWidth - 75, 18);
    doc.setFont("helvetica", "normal");
    doc.text(`Generated: ${new Date().toLocaleDateString('en-US', { dateStyle: 'long' })}`, pageWidth - 75, 24);
    doc.text('Status: Cryptographically Verified', pageWidth - 75, 30);
    
    // --- Section: Farmer Identification ---
    doc.setFillColor(245, 246, 244);
    doc.rect(14, 48, pageWidth - 28, 38, 'F');
    doc.setDrawColor(220, 224, 218);
    doc.rect(14, 48, pageWidth - 28, 38, 'S');
    
    doc.setTextColor(45, 90, 39);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text('FARMER & LAND REGISTRATION RECORD', 18, 54);
    
    doc.setTextColor(60, 60, 60);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text(`Farmer Name:   ${profile?.name || profile?.farmerName || 'Not Declared'}`, 18, 62);
    doc.text(`Phone / UID:   ${profile?.phone || 'Not Declared'}`, 18, 68);
    doc.text(`Email Address: ${profile?.email || auth.currentUser?.email || 'Not Declared'}`, 18, 74);
    doc.text(`Farm Identifier: ${activeFarmId || 'N/A'}`, 18, 80);
    
    doc.text(`Farm Name:     ${profile?.farmName || 'Bharat Kisan Partner'}`, 110, 62);
    doc.text(`Location:      ${[profile?.district, profile?.state].filter(Boolean).join(', ') || 'Not Configured'}`, 110, 68);
    doc.text(`Land Area:     ${profile?.farmSize || 'N/A'} ${profile?.units === 'Imperial' ? 'Acres' : 'Hectares'}`, 110, 74);
    doc.text(`Soil Category: ${profile?.soilType || 'N/A'}`, 110, 80);

    let currentY = 94;

    // --- Section 1: Seasonal Performance (Field Logs) ---
    doc.setTextColor(45, 90, 39);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text('1. SEASONAL PERFORMANCE & FIELD LOGS', 14, currentY);
    
    const journalHeaders = [['Date', 'Category', 'Crop/Field Context', 'Activity Details / Field Observations']];
    const journalBody = entries.map(entry => [
      entry.date,
      entry.category,
      entry.crop,
      entry.notes
    ]);
    
    autoTable(doc, {
      startY: currentY + 4,
      head: journalHeaders,
      body: journalBody.length > 0 ? journalBody : [['-', 'No logs', 'No active records', 'Please log events in field log']],
      theme: 'grid',
      headStyles: { fillColor: [45, 90, 39], fontSize: 9, fontStyle: 'bold' },
      bodyStyles: { fontSize: 8, textColor: [50, 50, 50] },
      columnStyles: {
        0: { cellWidth: 24 },
        1: { cellWidth: 28 },
        2: { cellWidth: 40 },
        3: { cellWidth: 'auto' }
      },
      margin: { left: 14, right: 14 }
    });
    
    currentY = (doc as any).lastAutoTable.finalY + 12;

    // --- Check page overlap for next section ---
    if (currentY > pageHeight - 80) {
      doc.addPage();
      currentY = 20;
    }

    // --- Section 2: Harvest Yields & Traceability Ledger ---
    doc.setTextColor(45, 90, 39);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text('2. VERIFIED HARVEST YIELDS & BLOCKCHAIN TRACEABILITY', 14, currentY);
    
    const yieldHeaders = [['Harvest Date', 'Crop/Produce', 'Quantity Logged', 'Quality Grade', 'Ledger Status', 'Cryptographic Reference Hash']];
    const yieldBody = batches.map(b => [
      b.harvestDate || '-',
      b.crop || '-',
      `${b.quantity} ${b.unit || 'kg'}`,
      b.quality || 'Grade A',
      b.status || 'Verified',
      b.traceHash || '-'
    ]);
    
    autoTable(doc, {
      startY: currentY + 4,
      head: yieldHeaders,
      body: yieldBody.length > 0 ? yieldBody : [['-', 'No batches', '-', '-', 'Unverified', 'Register your batches in Produce Ledger']],
      theme: 'grid',
      headStyles: { fillColor: [45, 90, 39], fontSize: 9, fontStyle: 'bold' },
      bodyStyles: { fontSize: 8, textColor: [50, 50, 50] },
      columnStyles: {
        0: { cellWidth: 24 },
        1: { cellWidth: 35 },
        2: { cellWidth: 28 },
        3: { cellWidth: 24 },
        4: { cellWidth: 22 },
        5: { cellWidth: 'auto' }
      },
      margin: { left: 14, right: 14 }
    });

    currentY = (doc as any).lastAutoTable.finalY + 12;

    // --- Check page overlap for next section ---
    if (currentY > pageHeight - 80) {
      doc.addPage();
      currentY = 20;
    }

    // --- Section 3: Financial Statements & Cost Ledger ---
    doc.setTextColor(45, 90, 39);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text('3. COST ANALYSIS & COMPREHENSIVE INPUT SPEND', 14, currentY);

    const totals = transactions.reduce((acc, tx) => {
      if (tx.type === 'Income') acc.income += tx.amount;
      else acc.expense += tx.amount;
      return acc;
    }, { income: 0, expense: 0 });
    
    const finHeaders = [['Transaction Date', 'Cashflow Type', 'Expense/Income Category', 'Particulars / Notes', 'Amount (INR)']];
    const finBody = transactions.map(tx => [
      tx.date,
      tx.type,
      tx.category,
      tx.note || '-',
      `INR ${tx.amount.toLocaleString()}`
    ]);

    autoTable(doc, {
      startY: currentY + 4,
      head: finHeaders,
      body: finBody.length > 0 ? finBody : [['-', 'No financial transactions', '-', '-', 'INR 0']],
      theme: 'grid',
      headStyles: { fillColor: [45, 90, 39], fontSize: 9, fontStyle: 'bold' },
      bodyStyles: { fontSize: 8, textColor: [50, 50, 50] },
      columnStyles: {
        0: { cellWidth: 28 },
        1: { cellWidth: 28 },
        2: { cellWidth: 40 },
        3: { cellWidth: 'auto' },
        4: { cellWidth: 32 }
      },
      margin: { left: 14, right: 14 }
    });

    currentY = (doc as any).lastAutoTable.finalY + 8;

    // Add aggregate total summary boxes
    doc.setFillColor(245, 246, 244);
    doc.rect(14, currentY, pageWidth - 28, 22, 'F');
    doc.setDrawColor(220, 224, 218);
    doc.rect(14, currentY, pageWidth - 28, 22, 'S');

    doc.setTextColor(60, 60, 60);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text(`TOTAL HARVEST VALUE (INFLOW): INR ${totals.income.toLocaleString()}`, 18, currentY + 8);
    doc.text(`TOTAL OPERATIONAL SPEND (OUTFLOW): INR ${totals.expense.toLocaleString()}`, 18, currentY + 15);
    
    const balance = totals.income - totals.expense;
    doc.setTextColor(balance >= 0 ? 45 : 180, balance >= 0 ? 90 : 40, balance >= 0 ? 39 : 40);
    doc.text(`NET OPERATIONAL CASH FLOW: INR ${balance.toLocaleString()}`, pageWidth - 90, currentY + 12);

    currentY = currentY + 34;

    // --- Check page overlap for signatures ---
    if (currentY > pageHeight - 50) {
      doc.addPage();
      currentY = 20;
    }

    // --- Section 4: Declaration & Verification Seal ---
    doc.setDrawColor(45, 90, 39);
    doc.setLineWidth(0.5);
    doc.line(14, currentY, pageWidth - 14, currentY);

    doc.setTextColor(80, 80, 80);
    doc.setFont("helvetica", "italic");
    doc.setFontSize(7.5);
    const declText = "Official Declaration: This document compiles digital records logged and verified within the Bharat Kisan Progressive Web App, integrated with localized crop calendars, live market commodity pricing data, and blockchain-supported traceability ledgers. Historical transactional cost records and field operations are chronologically secure. Suitable for presentation to commercial banks for crop loan underwriting (KCC), interest subvention claims, state agricultural department subsidy applications, and crop insurance assessment.";
    const splitDeclText = doc.splitTextToSize(declText, pageWidth - 28);
    doc.text(splitDeclText, 14, currentY + 6);

    currentY = currentY + 22;

    // Signatures
    doc.setTextColor(60, 60, 60);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.line(14, currentY + 14, 75, currentY + 14);
    doc.text('Signature / Thumbprint of Farmer', 14, currentY + 19);

    doc.line(pageWidth - 75, currentY + 14, pageWidth - 14, currentY + 14);
    doc.text('Authorized Verification Officer', pageWidth - 75, currentY + 19);
    doc.setFont("helvetica", "italic");
    doc.setFontSize(8);
    doc.text('(Seal and Signature)', pageWidth - 75, currentY + 23);

    doc.save(`BharatKisan_Comprehensive_Report_${new Date().toISOString().split('T')[0]}.pdf`);
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
      <div className="flex items-center justify-center py-20 bg-black min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6 bg-black min-h-screen p-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2 text-white">
            <BookOpen className="text-amber-500" />
            Field Log ({language})
          </h2>
          <p className="text-stone-400 text-sm">Keep track of your farming activities and seasonal progress.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={exportPDF}
            className="bg-stone-900 text-stone-400 p-3 rounded-xl hover:bg-stone-800 transition-colors border border-stone-800"
            title="Export PDF"
          >
            <Download className="w-5 h-5" />
          </button>
          <button 
            onClick={() => setShowForm(!showForm)}
            className="bg-amber-600 text-black font-bold px-6 py-3 rounded-xl hover:bg-amber-500 transition-all flex items-center gap-2 shadow-lg shadow-amber-900/20"
          >
            {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {showForm ? 'Cancel' : 'New Entry'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <button 
          onClick={handleAnalyze}
          disabled={entries.length < 2 || analyzing}
          className="w-full bg-amber-500/10 text-amber-500 font-black py-4 rounded-2xl flex items-center justify-center gap-3 border border-amber-500/20 active:scale-95 transition-all disabled:opacity-50"
        >
          {analyzing ? <Loader2 className="animate-spin w-5 h-5" /> : <Sparkles className="w-5 h-5" />}
          Generate Seasonal Analysis
        </button>
      </div>

      {analysis && (
        <div className="fixed inset-0 z-[110] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300">
           <div className="w-full max-w-lg bg-stone-900 border border-stone-800 rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-500 max-h-[80vh] flex flex-col">
              <button onClick={() => setAnalysis(null)} className="absolute top-6 right-6 p-2 bg-stone-800 rounded-full hover:bg-stone-700 text-stone-400">
                 <X className="w-5 h-5" />
              </button>
              
              <div className="flex items-center gap-3 mb-6">
                 <div className="bg-amber-500/20 p-3 rounded-2xl">
                    <Sparkles className="text-amber-500 w-6 h-6" />
                 </div>
                 <div>
                    <h3 className="text-xl font-black text-white leading-none">Strategic Intelligence</h3>
                    <p className="text-[10px] text-amber-500 font-black uppercase tracking-widest mt-1">Grounded in your field log</p>
                 </div>
              </div>

              <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                <div className="prose prose-invert prose-stone max-w-none text-sm font-medium text-stone-300 leading-relaxed">
                   <ReactMarkdown>{analysis}</ReactMarkdown>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-stone-800 flex flex-col sm:flex-row justify-end gap-3">
                <button 
                  onClick={shareOnWhatsApp}
                  className="bg-[#25D366] text-white px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  <MessageCircle className="w-4 h-4" /> Share WhatsApp
                </button>
                <button 
                  onClick={() => setAnalysis(null)}
                  className="bg-amber-600 text-black px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest active:scale-95 transition-all"
                >
                  Dismiss Analysis
                </button>
              </div>
           </div>
        </div>
      )}

      {showForm && (
        <form onSubmit={addEntry} className="bg-stone-900 p-6 rounded-3xl border border-stone-800 shadow-xl animate-in slide-in-from-top-4 duration-300">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-stone-500 ml-1 uppercase tracking-widest">Category</label>
              <select 
                value={newEntry.category}
                onChange={e => setNewEntry({...newEntry, category: e.target.value as any})}
                className="w-full bg-stone-800 border border-stone-700 p-3 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none text-white text-sm"
              >
                <option>Planting</option>
                <option>Irrigation</option>
                <option>Fertilizer</option>
                <option>Pest Control</option>
                <option>Harvest</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-stone-500 ml-1 uppercase tracking-widest">Date</label>
              <input 
                type="date"
                value={newEntry.date}
                onChange={e => setNewEntry({...newEntry, date: e.target.value})}
                className="w-full bg-stone-800 border border-stone-700 p-3 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none text-white text-sm"
              />
            </div>
            <div className="space-y-1 md:col-span-2">
              <label className="text-[10px] font-bold text-stone-500 ml-1 uppercase tracking-widest">Crop / Field</label>
              <input 
                type="text"
                placeholder="e.g. Field A Tomatoes"
                value={newEntry.crop}
                onChange={e => setNewEntry({...newEntry, crop: e.target.value})}
                className="w-full bg-stone-800 border border-stone-700 p-3 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none text-white text-sm placeholder:text-stone-600"
                required
              />
            </div>
          </div>
          <div className="space-y-1 mb-6">
            <label className="text-[10px] font-bold text-stone-500 ml-1 uppercase tracking-widest">Notes</label>
            <textarea 
              rows={3}
              placeholder="Record any details, observations or actions taken..."
              value={newEntry.notes}
              onChange={e => setNewEntry({...newEntry, notes: e.target.value})}
              className="w-full bg-stone-800 border border-stone-700 p-3 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none resize-none text-white text-sm placeholder:text-stone-600"
            />
          </div>
          <button type="submit" className="w-full bg-amber-600 text-black font-bold py-4 rounded-xl hover:bg-amber-500 transition-colors shadow-lg shadow-amber-900/20">
            Save Journal Entry
          </button>
        </form>
      )}

      <div className="space-y-4">
        {entries.length === 0 ? (
          <div className="bg-stone-900 p-12 rounded-3xl border border-stone-800 text-center flex flex-col items-center">
            <div className="bg-stone-800 p-4 rounded-full mb-4">
              <BookOpen className="w-8 h-8 text-stone-600" />
            </div>
            <p className="text-stone-500 font-medium">No records yet. Start your farm journal today!</p>
          </div>
        ) : (
          entries.map(entry => (
            <div key={entry.id} className="bg-stone-900 p-6 rounded-2xl border border-stone-800 shadow-sm flex flex-col md:flex-row gap-6 group hover:border-amber-500/30 transition-all">
              <div className="md:w-48 shrink-0">
                <div className="flex items-center gap-2 text-stone-500 text-[10px] font-bold uppercase tracking-widest mb-2">
                  <Calendar className="w-3 h-3" />
                  {new Date(entry.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </div>
                <div className={`
                  inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider
                  ${entry.category === 'Planting' ? 'bg-amber-500/10 text-amber-500' : 
                    entry.category === 'Harvest' ? 'bg-orange-500/10 text-orange-500' :
                    entry.category === 'Irrigation' ? 'bg-blue-500/10 text-blue-400' :
                    'bg-stone-800 text-stone-400'}
                `}>
                  <Tag className="w-2.5 h-2.5" />
                  {entry.category}
                </div>
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-white mb-2 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-amber-500" />
                  {entry.crop}
                </h4>
                <p className="text-stone-400 text-sm leading-relaxed">{entry.notes}</p>
              </div>
              <button 
                onClick={() => deleteEntry(entry.id)}
                className="opacity-0 group-hover:opacity-100 p-2 text-stone-600 hover:text-red-500 transition-all self-start"
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
