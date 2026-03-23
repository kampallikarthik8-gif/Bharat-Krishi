
import React from 'react';
import { Transaction } from '../types';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { 
  Wallet, 
  Plus, 
  Trash2, 
  ArrowUpCircle, 
  ArrowDownCircle, 
  TrendingUp, 
  Calendar, 
  FileText,
  Loader2,
  X,
  CreditCard,
  PieChart,
  DollarSign,
  Download,
  MessageCircle
} from 'lucide-react';
import { db, auth } from '../src/firebase';
import { collection, addDoc, deleteDoc, doc, onSnapshot, query, orderBy } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../src/utils/firestoreErrorHandler';

import { useFirebase } from '../src/components/FirebaseProvider';

const FinanceLedger: React.FC = () => {
  const { activeFarmId } = useFirebase();
  const [transactions, setTransactions] = React.useState<Transaction[]>([]);
  const [loading, setLoading] = React.useState(true);
  
  const [showAdd, setShowAdd] = React.useState(false);
  const [newTx, setNewTx] = React.useState<Partial<Transaction>>({
    type: 'Expense',
    category: 'Seeds',
    date: new Date().toISOString().split('T')[0]
  });

  React.useEffect(() => {
    if (!activeFarmId) return;

    const path = `users/${activeFarmId}/transactions`;
    const q = query(collection(db, path), orderBy('date', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const txData: Transaction[] = [];
      snapshot.forEach((doc) => {
        txData.push({ id: doc.id, ...doc.data() } as Transaction);
      });
      setTransactions(txData);
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
    doc.text('Bharat Kisan - Finance Ledger Report', 14, 22);
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 30);

    const tableData = transactions.map(tx => [
      tx.date,
      tx.type,
      tx.category,
      tx.note || '-',
      `INR ${tx.amount.toLocaleString()}`
    ]);

    autoTable(doc, {
      startY: 40,
      head: [['Date', 'Type', 'Category', 'Note', 'Amount']],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: [45, 90, 39] }
    });

    const totals = transactions.reduce((acc, tx) => {
      if (tx.type === 'Income') acc.income += tx.amount;
      else acc.expense += tx.amount;
      return acc;
    }, { income: 0, expense: 0 });

    const finalY = (doc as any).lastAutoTable.finalY + 10;
    doc.text(`Total Income: INR ${totals.income.toLocaleString()}`, 14, finalY);
    doc.text(`Total Expense: INR ${totals.expense.toLocaleString()}`, 14, finalY + 7);
    doc.setFontSize(14);
    doc.text(`Net Balance: INR ${(totals.income - totals.expense).toLocaleString()}`, 14, finalY + 17);

    doc.save(`BharatKisan_Finance_Report_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const shareOnWhatsApp = () => {
    const farmName = localStorage.getItem('agri_farm_name') || 'My Farm';
    const message = `*Bharat Kisan - Finance Summary*%0A%0A` +
      `*Farm:* ${farmName}%0A` +
      `*Net Balance:* ₹${balance.toLocaleString()}%0A` +
      `*Total Income:* ₹${totals.income.toLocaleString()}%0A` +
      `*Total Expense:* ₹${totals.expense.toLocaleString()}%0A%0A` +
      `Managed via Bharat Kisan App`;
    
    window.open(`https://wa.me/?text=${message}`, '_blank');
  };

  const addTx = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTx.amount || !newTx.category || !activeFarmId) return;
    
    const path = `users/${activeFarmId}/transactions`;
    const txData = {
      type: newTx.type as any,
      category: newTx.category,
      amount: parseFloat(newTx.amount.toString()),
      date: newTx.date!,
      note: newTx.note || ''
    };
    
    try {
      await addDoc(collection(db, path), txData);
      setShowAdd(false);
      setNewTx({ type: 'Expense', category: 'Seeds', date: new Date().toISOString().split('T')[0] });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  };

  const deleteTx = async (id: string) => {
    if (!activeFarmId) return;
    const path = `users/${activeFarmId}/transactions/${id}`;
    try {
      await deleteDoc(doc(db, path));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  };

  const totals = transactions.reduce((acc, tx) => {
    if (tx.type === 'Income') acc.income += tx.amount;
    else acc.expense += tx.amount;
    return acc;
  }, { income: 0, expense: 0 });

  const balance = totals.income - totals.expense;

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-amber-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12 animate-in fade-in slide-in-from-bottom-6 duration-700 bg-black min-h-screen p-4">
      <div className="flex items-center justify-between px-2">
        <div>
          <h2 className="text-2xl font-black text-white flex items-center gap-3">
            <Wallet className="w-6 h-6 text-amber-500" />
            Finance Ledger
          </h2>
          <p className="text-[10px] text-stone-500 font-black uppercase tracking-widest mt-1">Cashflow & P&L Tracker</p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={exportPDF}
            className="bg-stone-900 text-stone-400 p-3 rounded-2xl hover:bg-stone-800 transition-colors border border-stone-800"
            title="Export PDF"
          >
            <Download className="w-6 h-6" />
          </button>
          <button 
            onClick={shareOnWhatsApp}
            className="bg-[#25D366] text-white p-3 rounded-2xl shadow-xl active:scale-90 transition-transform"
            title="Share WhatsApp"
          >
            <MessageCircle className="w-6 h-6" />
          </button>
          <button 
            onClick={() => setShowAdd(true)}
            className="bg-amber-600 text-black p-3 rounded-2xl shadow-xl active:scale-90 transition-transform"
          >
            <Plus className="w-6 h-6" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 px-2">
         <div className="bg-stone-900 rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden border border-amber-500/5">
            <div className="absolute top-0 right-0 p-8 opacity-5">
               <DollarSign className="w-32 h-32 text-amber-500" />
            </div>
            <div className="relative z-10">
               <p className="text-[10px] font-black uppercase tracking-widest text-stone-500 mb-2">Net Cash Position</p>
               <h3 className="text-4xl font-black tracking-tighter mb-8 text-amber-500">₹{balance.toLocaleString()}</h3>
               <div className="grid grid-cols-2 gap-8 border-t border-white/5 pt-6">
                  <div>
                     <p className="text-[9px] font-black uppercase tracking-widest text-amber-400 mb-1">Total Yield Value</p>
                     <p className="text-xl font-bold">₹{totals.income.toLocaleString()}</p>
                  </div>
                  <div>
                     <p className="text-[9px] font-black uppercase tracking-widest text-rose-400 mb-1">Operational Spend</p>
                     <p className="text-xl font-bold">₹{totals.expense.toLocaleString()}</p>
                  </div>
               </div>
            </div>
         </div>
      </div>

      <div className="bg-stone-950 rounded-[2.5rem] p-8 shadow-sm border border-amber-500/5">
        <h3 className="text-[11px] font-black text-stone-500 uppercase tracking-[0.2em] mb-6 px-2">Audit Trail</h3>
        <div className="space-y-3">
           {transactions.map(tx => (
             <div key={tx.id} className="p-5 bg-stone-900 border border-stone-800 rounded-[2rem] flex items-center gap-5 transition-all group hover:bg-black hover:border-amber-500/20">
                <div className={`p-4 rounded-2xl shadow-inner ${tx.type === 'Income' ? 'bg-amber-500/10 text-amber-500' : 'bg-rose-500/10 text-rose-500'}`}>
                   {tx.type === 'Income' ? <ArrowUpCircle className="w-6 h-6" /> : <ArrowDownCircle className="w-6 h-6" />}
                </div>
                <div className="flex-1 min-w-0">
                   <h4 className="font-black text-white text-sm tracking-tight leading-none mb-1.5">{tx.note || tx.category}</h4>
                   <div className="flex gap-3">
                      <span className="text-[9px] font-black uppercase text-stone-500">{tx.category}</span>
                      <span className="text-[9px] font-black uppercase text-stone-500">{tx.date}</span>
                   </div>
                </div>
                <div className="text-right">
                   <p className={`text-base font-black leading-none ${tx.type === 'Income' ? 'text-amber-500' : 'text-white'}`}>
                     {tx.type === 'Income' ? '+' : '-'}₹{tx.amount.toLocaleString()}
                   </p>
                   <button onClick={() => deleteTx(tx.id)} className="opacity-0 group-hover:opacity-100 p-1 text-stone-600 hover:text-rose-500 transition-all mt-1">
                      <Trash2 className="w-3.5 h-3.5" />
                   </button>
                </div>
             </div>
           ))}
        </div>
      </div>

      {showAdd && (
        <div className="fixed inset-0 z-[110] bg-black/80 backdrop-blur-sm flex items-end animate-in fade-in duration-300">
           <div className="w-full max-w-md mx-auto bg-stone-950 rounded-t-[3rem] p-8 animate-in slide-in-from-bottom-full duration-500 border-t border-amber-500/20">
              <div className="flex items-center justify-between mb-8">
                 <h3 className="text-xl font-black text-white">Log Transaction</h3>
                 <button onClick={() => setShowAdd(false)} className="p-2 bg-stone-900 rounded-full text-stone-400">
                    <X className="w-5 h-5" />
                 </button>
              </div>

              <form onSubmit={addTx} className="space-y-6">
                 <div className="flex p-1.5 bg-stone-900 rounded-2xl border border-stone-800">
                    <button 
                      type="button"
                      onClick={() => setNewTx({...newTx, type: 'Expense'})}
                      className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${newTx.type === 'Expense' ? 'bg-amber-600 text-black shadow-lg' : 'text-stone-500'}`}
                    >
                       Expense
                    </button>
                    <button 
                      type="button"
                      onClick={() => setNewTx({...newTx, type: 'Income'})}
                      className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${newTx.type === 'Income' ? 'bg-amber-600 text-black shadow-lg' : 'text-stone-500'}`}
                    >
                       Income
                    </button>
                 </div>

                 <div className="space-y-1">
                    <label className="text-[10px] font-black text-stone-500 uppercase tracking-widest ml-2">Amount (₹)</label>
                    <input 
                      autoFocus
                      type="number"
                      placeholder="0.00" 
                      className="w-full bg-stone-900 border border-stone-800 p-4 rounded-2xl outline-none focus:ring-2 focus:ring-amber-500 font-black text-xl text-white placeholder:text-stone-700"
                      value={newTx.amount || ''}
                      onChange={e => setNewTx({...newTx, amount: parseFloat(e.target.value)})}
                    />
                 </div>

                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                       <label className="text-[10px] font-black text-stone-500 uppercase tracking-widest ml-2">Category</label>
                       <select 
                         className="w-full bg-stone-900 border border-stone-800 p-4 rounded-2xl outline-none appearance-none font-bold text-xs text-white"
                         value={newTx.category}
                         onChange={e => setNewTx({...newTx, category: e.target.value})}
                       >
                          {newTx.type === 'Expense' ? (
                            ['Seeds', 'Fertilizer', 'Labor', 'Fuel', 'Machinery', 'Repairs', 'Other'].map(c => <option key={c} className="bg-stone-900">{c}</option>)
                          ) : (
                            ['Sales', 'Subsidy', 'Lease', 'Grants', 'Other'].map(c => <option key={c} className="bg-stone-900">{c}</option>)
                          )}
                       </select>
                    </div>
                    <div className="space-y-1">
                       <label className="text-[10px] font-black text-stone-500 uppercase tracking-widest ml-2">Date</label>
                       <input 
                        type="date"
                        className="w-full bg-stone-900 border border-stone-800 p-4 rounded-2xl outline-none font-bold text-xs text-white"
                        value={newTx.date}
                        onChange={e => setNewTx({...newTx, date: e.target.value})}
                       />
                    </div>
                 </div>

                 <div className="space-y-1">
                    <label className="text-[10px] font-black text-stone-500 uppercase tracking-widest ml-2">Note (Optional)</label>
                    <input 
                      placeholder="e.g. Sold 20 tons of Paddy" 
                      className="w-full bg-stone-900 border border-stone-800 p-4 rounded-2xl outline-none focus:ring-2 focus:ring-amber-500 font-bold text-sm text-white placeholder:text-stone-700"
                      value={newTx.note || ''}
                      onChange={e => setNewTx({...newTx, note: e.target.value})}
                    />
                 </div>

                 <button 
                   type="submit"
                   className="w-full bg-amber-600 text-black font-black py-5 rounded-[1.5rem] shadow-xl active:scale-95 transition-all flex items-center justify-center gap-3 uppercase tracking-widest text-xs"
                 >
                    <CreditCard className="w-5 h-5" /> Register Transaction
                 </button>
              </form>
           </div>
        </div>
      )}
    </div>
  );
};

export default FinanceLedger;
