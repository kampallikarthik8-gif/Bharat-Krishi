
import React from 'react';
import { Transaction } from '../types';
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
  DollarSign
} from 'lucide-react';

const FinanceLedger: React.FC = () => {
  const [transactions, setTransactions] = React.useState<Transaction[]>(() => {
    const saved = localStorage.getItem('agri_finances');
    return saved ? JSON.parse(saved) : [
      { id: '1', type: 'Expense', category: 'Seeds', amount: 12000, date: '2023-10-15', note: 'Basmati Paddy Seeds' },
      { id: '2', type: 'Income', category: 'Sales', amount: 85000, date: '2023-10-20', note: 'Wheat Harvest Sale' }
    ];
  });
  
  const [showAdd, setShowAdd] = React.useState(false);
  const [newTx, setNewTx] = React.useState<Partial<Transaction>>({
    type: 'Expense',
    category: 'Seeds',
    date: new Date().toISOString().split('T')[0]
  });

  React.useEffect(() => {
    localStorage.setItem('agri_finances', JSON.stringify(transactions));
  }, [transactions]);

  const addTx = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTx.amount || !newTx.category) return;
    
    const tx: Transaction = {
      id: Date.now().toString(),
      type: newTx.type as any,
      category: newTx.category,
      amount: parseFloat(newTx.amount.toString()),
      date: newTx.date!,
      note: newTx.note || ''
    };
    
    setTransactions([tx, ...transactions]);
    setShowAdd(false);
    setNewTx({ type: 'Expense', category: 'Seeds', date: new Date().toISOString().split('T')[0] });
  };

  const deleteTx = (id: string) => {
    setTransactions(transactions.filter(t => t.id !== id));
  };

  const totals = transactions.reduce((acc, tx) => {
    if (tx.type === 'Income') acc.income += tx.amount;
    else acc.expense += tx.amount;
    return acc;
  }, { income: 0, expense: 0 });

  const balance = totals.income - totals.expense;

  return (
    <div className="space-y-6 pb-12 animate-in fade-in slide-in-from-bottom-6 duration-700">
      <div className="flex items-center justify-between px-2">
        <div>
          <h2 className="text-2xl font-black text-stone-900 flex items-center gap-3">
            <Wallet className="w-6 h-6 text-emerald-600" />
            Finance Ledger
          </h2>
          <p className="text-[10px] text-stone-400 font-black uppercase tracking-widest mt-1">Cashflow & P&L Tracker</p>
        </div>
        <button 
          onClick={() => setShowAdd(true)}
          className="bg-emerald-600 text-white p-3 rounded-2xl shadow-xl active:scale-90 transition-transform"
        >
          <Plus className="w-6 h-6" />
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 px-2">
         <div className="bg-stone-900 rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10">
               <DollarSign className="w-32 h-32" />
            </div>
            <div className="relative z-10">
               <p className="text-[10px] font-black uppercase tracking-widest text-stone-500 mb-2">Net Cash Position</p>
               <h3 className="text-4xl font-black tracking-tighter mb-8">₹{balance.toLocaleString()}</h3>
               <div className="grid grid-cols-2 gap-8 border-t border-white/10 pt-6">
                  <div>
                     <p className="text-[9px] font-black uppercase tracking-widest text-emerald-400 mb-1">Total Yield Value</p>
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

      <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-stone-200">
        <h3 className="text-[11px] font-black text-stone-400 uppercase tracking-[0.2em] mb-6 px-2">Audit Trail</h3>
        <div className="space-y-3">
           {transactions.map(tx => (
             <div key={tx.id} className="p-5 bg-stone-50 border border-stone-100 rounded-[2rem] flex items-center gap-5 transition-all group hover:bg-white hover:border-emerald-100">
                <div className={`p-4 rounded-2xl shadow-inner ${tx.type === 'Income' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                   {tx.type === 'Income' ? <ArrowUpCircle className="w-6 h-6" /> : <ArrowDownCircle className="w-6 h-6" />}
                </div>
                <div className="flex-1 min-w-0">
                   <h4 className="font-black text-stone-900 text-sm tracking-tight leading-none mb-1.5">{tx.note || tx.category}</h4>
                   <div className="flex gap-3">
                      <span className="text-[9px] font-black uppercase text-stone-400">{tx.category}</span>
                      <span className="text-[9px] font-black uppercase text-stone-400">{tx.date}</span>
                   </div>
                </div>
                <div className="text-right">
                   <p className={`text-base font-black leading-none ${tx.type === 'Income' ? 'text-emerald-600' : 'text-stone-900'}`}>
                     {tx.type === 'Income' ? '+' : '-'}₹{tx.amount.toLocaleString()}
                   </p>
                   <button onClick={() => deleteTx(tx.id)} className="opacity-0 group-hover:opacity-100 p-1 text-stone-300 hover:text-rose-500 transition-all mt-1">
                      <Trash2 className="w-3.5 h-3.5" />
                   </button>
                </div>
             </div>
           ))}
        </div>
      </div>

      {showAdd && (
        <div className="fixed inset-0 z-[110] bg-black/60 backdrop-blur-sm flex items-end animate-in fade-in duration-300">
           <div className="w-full max-w-md mx-auto bg-white rounded-t-[3rem] p-8 animate-in slide-in-from-bottom-full duration-500">
              <div className="flex items-center justify-between mb-8">
                 <h3 className="text-xl font-black text-stone-900">Log Transaction</h3>
                 <button onClick={() => setShowAdd(false)} className="p-2 bg-stone-50 rounded-full">
                    <X className="w-5 h-5" />
                 </button>
              </div>

              <form onSubmit={addTx} className="space-y-6">
                 <div className="flex p-1.5 bg-stone-50 rounded-2xl border border-stone-100">
                    <button 
                      type="button"
                      onClick={() => setNewTx({...newTx, type: 'Expense'})}
                      className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${newTx.type === 'Expense' ? 'bg-stone-900 text-white shadow-lg' : 'text-stone-400'}`}
                    >
                       Expense
                    </button>
                    <button 
                      type="button"
                      onClick={() => setNewTx({...newTx, type: 'Income'})}
                      className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${newTx.type === 'Income' ? 'bg-emerald-600 text-white shadow-lg' : 'text-stone-400'}`}
                    >
                       Income
                    </button>
                 </div>

                 <div className="space-y-1">
                    <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-2">Amount (₹)</label>
                    <input 
                      autoFocus
                      type="number"
                      placeholder="0.00" 
                      className="w-full bg-stone-50 border border-stone-100 p-4 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500 font-black text-xl"
                      value={newTx.amount || ''}
                      onChange={e => setNewTx({...newTx, amount: parseFloat(e.target.value)})}
                    />
                 </div>

                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                       <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-2">Category</label>
                       <select 
                         className="w-full bg-stone-50 border border-stone-100 p-4 rounded-2xl outline-none appearance-none font-bold text-xs"
                         value={newTx.category}
                         onChange={e => setNewTx({...newTx, category: e.target.value})}
                       >
                          {newTx.type === 'Expense' ? (
                            ['Seeds', 'Fertilizer', 'Labor', 'Fuel', 'Machinery', 'Repairs', 'Other'].map(c => <option key={c}>{c}</option>)
                          ) : (
                            ['Sales', 'Subsidy', 'Lease', 'Grants', 'Other'].map(c => <option key={c}>{c}</option>)
                          )}
                       </select>
                    </div>
                    <div className="space-y-1">
                       <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-2">Date</label>
                       <input 
                        type="date"
                        className="w-full bg-stone-50 border border-stone-100 p-4 rounded-2xl outline-none font-bold text-xs"
                        value={newTx.date}
                        onChange={e => setNewTx({...newTx, date: e.target.value})}
                       />
                    </div>
                 </div>

                 <div className="space-y-1">
                    <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-2">Note (Optional)</label>
                    <input 
                      placeholder="e.g. Sold 20 tons of Paddy" 
                      className="w-full bg-stone-50 border border-stone-100 p-4 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500 font-bold text-sm"
                      value={newTx.note || ''}
                      onChange={e => setNewTx({...newTx, note: e.target.value})}
                    />
                 </div>

                 <button 
                   type="submit"
                   className="w-full bg-stone-900 text-white font-black py-5 rounded-[1.5rem] shadow-xl active:scale-95 transition-all flex items-center justify-center gap-3"
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
