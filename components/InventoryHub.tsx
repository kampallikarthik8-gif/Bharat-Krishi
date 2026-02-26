
import React from 'react';
import { InventoryItem } from '../types';
import { 
  Box, 
  Plus, 
  Trash2, 
  AlertCircle, 
  ChevronRight, 
  Package, 
  Calendar, 
  CheckCircle2, 
  Info,
  ArrowRight,
  TrendingDown,
  Droplets,
  Zap,
  Sprout,
  X,
  Search
} from 'lucide-react';

const CATEGORIES = ['Seeds', 'Fertilizer', 'Pesticide', 'Tools', 'Fuel', 'Other'];

const InventoryHub: React.FC = () => {
  const [items, setItems] = React.useState<InventoryItem[]>(() => {
    const saved = localStorage.getItem('agri_inventory');
    return saved ? JSON.parse(saved) : [
      { id: '1', name: 'Urea Fertilizer', category: 'Fertilizer', quantity: 50, unit: 'kg', minThreshold: 100 },
      { id: '2', name: 'Paddy Seeds (Basmati)', category: 'Seeds', quantity: 200, unit: 'kg', minThreshold: 50 }
    ];
  });
  
  const [showAdd, setShowAdd] = React.useState(false);
  const [newItem, setNewItem] = React.useState<Partial<InventoryItem>>({
    category: 'Seeds',
    quantity: 0,
    minThreshold: 10
  });

  React.useEffect(() => {
    localStorage.setItem('agri_inventory', JSON.stringify(items));
  }, [items]);

  const addItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.name || newItem.quantity === undefined) return;
    
    const item: InventoryItem = {
      id: Date.now().toString(),
      name: newItem.name,
      category: newItem.category as any,
      quantity: newItem.quantity,
      unit: newItem.unit || 'kg',
      minThreshold: newItem.minThreshold || 0,
      expiryDate: newItem.expiryDate
    };
    
    setItems([...items, item]);
    setShowAdd(false);
    setNewItem({ category: 'Seeds', quantity: 0, minThreshold: 10 });
  };

  const deleteItem = (id: string) => {
    setItems(items.filter(i => i.id !== id));
  };

  const lowStockItems = items.filter(i => i.quantity <= i.minThreshold);

  return (
    <div className="space-y-6 pb-12 animate-in fade-in slide-in-from-bottom-6 duration-700">
      <div className="flex items-center justify-between px-2">
        <div>
          <h2 className="text-2xl font-black text-stone-900 flex items-center gap-3">
            <Box className="w-6 h-6 text-blue-600" />
            Inventory Hub
          </h2>
          <p className="text-[10px] text-stone-400 font-black uppercase tracking-widest mt-1">Resource & Input Tracker</p>
        </div>
        <button 
          onClick={() => setShowAdd(true)}
          className="bg-blue-600 text-white p-3 rounded-2xl shadow-xl active:scale-90 transition-transform"
        >
          <Plus className="w-6 h-6" />
        </button>
      </div>

      {lowStockItems.length > 0 && (
        <div className="mx-2 bg-rose-50 border border-rose-100 rounded-[2rem] p-6 shadow-sm animate-in slide-in-from-top-2">
           <div className="flex items-center gap-3 mb-4">
              <AlertCircle className="w-5 h-5 text-rose-500" />
              <h3 className="text-xs font-black uppercase text-rose-900 tracking-widest">Stock Alert</h3>
           </div>
           <div className="space-y-3">
              {lowStockItems.map(item => (
                <div key={item.id} className="bg-white/60 p-3 rounded-xl border border-rose-100 flex items-center justify-between">
                   <span className="text-xs font-bold text-rose-900">{item.name}</span>
                   <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black text-rose-400 uppercase">Only {item.quantity}{item.unit} left</span>
                      <TrendingDown className="w-3.5 h-3.5 text-rose-500" />
                   </div>
                </div>
              ))}
           </div>
        </div>
      )}

      <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-stone-200">
        <div className="relative mb-8">
           <input placeholder="Search stock..." className="w-full bg-stone-50 border border-stone-100 p-4 pl-12 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 font-bold text-sm" />
           <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-300 w-5 h-5" />
        </div>

        <div className="space-y-4">
           {items.map(item => (
             <div key={item.id} className="p-5 bg-stone-50 border border-stone-100 rounded-[2rem] flex items-center gap-5 group transition-all hover:bg-white hover:border-blue-100">
                <div className={`p-4 rounded-2xl shadow-inner ${
                  item.category === 'Seeds' ? 'bg-emerald-50 text-emerald-600' :
                  item.category === 'Fertilizer' ? 'bg-orange-50 text-orange-600' :
                  item.category === 'Pesticide' ? 'bg-rose-50 text-rose-600' :
                  'bg-blue-50 text-blue-600'
                }`}>
                   {item.category === 'Seeds' ? <Sprout className="w-6 h-6" /> : <Package className="w-6 h-6" />}
                </div>
                <div className="flex-1 min-w-0">
                   <h4 className="font-black text-stone-900 text-base leading-none mb-1.5">{item.name}</h4>
                   <div className="flex gap-3">
                      <span className="text-[9px] font-black uppercase text-stone-400">{item.category}</span>
                      {item.expiryDate && <span className="text-[9px] font-black uppercase text-rose-400">Exp: {item.expiryDate}</span>}
                   </div>
                </div>
                <div className="text-right">
                   <p className="text-lg font-black text-stone-900 leading-none">{item.quantity}<span className="text-[10px] ml-0.5 font-bold text-stone-400">{item.unit}</span></p>
                   <button onClick={() => deleteItem(item.id)} className="opacity-0 group-hover:opacity-100 p-1 text-stone-300 hover:text-rose-500 transition-all">
                      <Trash2 className="w-4 h-4" />
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
                 <h3 className="text-xl font-black text-stone-900">Add Stock Item</h3>
                 <button onClick={() => setShowAdd(false)} className="p-2 bg-stone-50 rounded-full">
                    <X className="w-5 h-5" />
                 </button>
              </div>

              <form onSubmit={addItem} className="space-y-6">
                 <div className="space-y-1">
                    <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-2">Item Name</label>
                    <input 
                      autoFocus
                      placeholder="e.g. DAP Fertilizer" 
                      className="w-full bg-stone-50 border border-stone-100 p-4 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 font-bold text-sm"
                      value={newItem.name || ''}
                      onChange={e => setNewItem({...newItem, name: e.target.value})}
                    />
                 </div>

                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                       <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-2">Category</label>
                       <select 
                         className="w-full bg-stone-50 border border-stone-100 p-4 rounded-2xl outline-none appearance-none font-bold text-xs"
                         value={newItem.category}
                         onChange={e => setNewItem({...newItem, category: e.target.value as any})}
                       >
                          {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                       </select>
                    </div>
                    <div className="space-y-1">
                       <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-2">Initial Qty</label>
                       <div className="flex gap-2">
                          <input 
                            type="number"
                            className="flex-1 bg-stone-50 border border-stone-100 p-4 rounded-2xl outline-none font-bold text-xs"
                            value={newItem.quantity}
                            onChange={e => setNewItem({...newItem, quantity: parseFloat(e.target.value)})}
                          />
                          <input 
                            placeholder="Unit"
                            className="w-16 bg-stone-50 border border-stone-100 p-4 rounded-2xl outline-none font-bold text-xs"
                            value={newItem.unit || ''}
                            onChange={e => setNewItem({...newItem, unit: e.target.value})}
                          />
                       </div>
                    </div>
                 </div>

                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                       <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-2">Low Alert Level</label>
                       <input 
                        type="number"
                        className="w-full bg-stone-50 border border-stone-100 p-4 rounded-2xl outline-none font-bold text-xs"
                        value={newItem.minThreshold}
                        onChange={e => setNewItem({...newItem, minThreshold: parseFloat(e.target.value)})}
                       />
                    </div>
                    <div className="space-y-1">
                       <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-2">Expiry (Optional)</label>
                       <input 
                        type="date"
                        className="w-full bg-stone-50 border border-stone-100 p-4 rounded-2xl outline-none font-bold text-xs"
                        onChange={e => setNewItem({...newItem, expiryDate: e.target.value})}
                       />
                    </div>
                 </div>

                 <button 
                   type="submit"
                   className="w-full bg-stone-900 text-white font-black py-5 rounded-[1.5rem] shadow-xl active:scale-95 transition-all flex items-center justify-center gap-3"
                 >
                    <Package className="w-5 h-5" /> Commit to Inventory
                 </button>
              </form>
           </div>
        </div>
      )}
    </div>
  );
};

export default InventoryHub;
