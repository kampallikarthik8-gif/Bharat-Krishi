import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShoppingBag, 
  Plus, 
  Search, 
  Tag, 
  User, 
  MapPin, 
  ArrowLeft,
  Filter,
  Loader2,
  ChevronRight,
  Package,
  IndianRupee,
  MessageCircle,
  Heart,
  Share2
} from 'lucide-react';
import { db, auth } from '../src/firebase';
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  serverTimestamp 
} from 'firebase/firestore';
import { useFirebase } from '../src/components/FirebaseProvider';
import { handleFirestoreError, OperationType } from '../src/utils/firestoreErrorHandler';

interface MarketItem {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  quantity: number;
  unit: string;
  sellerId: string;
  sellerName: string;
  category: string;
  status: 'Available' | 'Sold';
  createdAt: any;
}

export default function P2PMarketplace({ onBack }: { onBack: () => void }) {
  const { profile } = useFirebase();
  const [items, setItems] = useState<MarketItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [newItem, setNewItem] = useState({
    name: '',
    description: '',
    price: 0,
    quantity: 1,
    unit: 'unit',
    category: 'Seeds'
  });

  const categories = ['All', 'Seeds', 'Fertilizer', 'Tools', 'Produce', 'Livestock', 'Other'];

  useEffect(() => {
    const q = query(collection(db, 'marketplace'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as MarketItem[];
      setItems(data);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'marketplace');
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser || !profile) return;

    try {
      await addDoc(collection(db, 'marketplace'), {
        ...newItem,
        currency: 'INR',
        sellerId: auth.currentUser.uid,
        sellerName: profile.name || 'Unknown Seller',
        status: 'Available',
        createdAt: serverTimestamp()
      });
      setShowAddModal(false);
      setNewItem({
        name: '',
        description: '',
        price: 0,
        quantity: 1,
        unit: 'unit',
        category: 'Seeds'
      });
    } catch (error) {
      console.error('Error adding item:', error);
    }
  };

  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white pb-24">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-[#0A0A0A]/80 backdrop-blur-md border-b border-white/10 px-4 py-4">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 hover:bg-white/5 rounded-full transition-colors">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-amber-500" />
              P2P Marketplace
            </h1>
            <p className="text-xs text-white/50">Direct Farmer-to-Farmer Trading</p>
          </div>
        </div>
      </div>

      <div className="p-4 max-w-2xl mx-auto space-y-6">
        {/* Search & Filter */}
        <div className="space-y-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
              <input
                type="text"
                placeholder="Search items for sale..."
                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm focus:outline-none focus:border-amber-500/50 transition-colors"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button 
              onClick={() => setShowAddModal(true)}
              className="bg-amber-500 text-black px-4 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-amber-400 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Sell
            </button>
          </div>

          {/* Category Pills */}
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide no-scrollbar">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                  selectedCategory === cat 
                    ? 'bg-amber-500 text-black' 
                    : 'bg-white/5 text-white/50 border border-white/10 hover:border-white/20'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Items Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {loading ? (
            <div className="col-span-full flex flex-col items-center justify-center py-12 gap-3">
              <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
              <p className="text-sm text-white/40">Fetching marketplace items...</p>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="col-span-full text-center py-12 bg-white/5 rounded-3xl border border-dashed border-white/10">
              <Package className="w-12 h-12 text-white/10 mx-auto mb-3" />
              <p className="text-white/40">No items found in this category</p>
            </div>
          ) : (
            filteredItems.map((item) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden group hover:border-amber-500/30 transition-all flex flex-col"
              >
                {/* Item Image Placeholder */}
                <div className="aspect-square bg-white/5 relative flex items-center justify-center">
                  <Package className="w-12 h-12 text-white/10" />
                  <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md px-2 py-1 rounded-lg text-[10px] font-bold text-amber-500 border border-white/10">
                    {item.category}
                  </div>
                  <button className="absolute top-3 right-3 p-2 bg-black/60 backdrop-blur-md rounded-full text-white/50 hover:text-red-500 transition-colors">
                    <Heart className="w-4 h-4" />
                  </button>
                </div>

                <div className="p-4 flex-1 flex flex-col">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-base line-clamp-1">{item.name}</h3>
                    <div className="flex items-center text-amber-500 font-bold">
                      <IndianRupee className="w-3 h-3" />
                      {item.price}
                    </div>
                  </div>
                  
                  <p className="text-xs text-white/50 line-clamp-2 mb-4 flex-1">
                    {item.description}
                  </p>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-[10px] text-white/30">
                      <div className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {item.sellerName}
                      </div>
                      <div className="flex items-center gap-1">
                        <Tag className="w-3 h-3" />
                        {item.quantity} {item.unit}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button className="flex-1 bg-amber-500 text-black py-2 rounded-xl font-bold text-xs hover:bg-amber-400 transition-colors flex items-center justify-center gap-2">
                        <MessageCircle className="w-4 h-4" />
                        Chat
                      </button>
                      <button className="p-2 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-colors">
                        <Share2 className="w-4 h-4 text-white/50" />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>

      {/* Add Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddModal(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="relative w-full max-w-lg bg-[#121212] rounded-t-[2.5rem] sm:rounded-[2.5rem] border border-white/10 p-6"
            >
              <div className="w-12 h-1.5 bg-white/10 rounded-full mx-auto mb-6" />
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                <Plus className="w-6 h-6 text-amber-500" />
                List an Item
              </h2>

              <form onSubmit={handleAddItem} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-white/50 uppercase ml-1">Item Name</label>
                  <input
                    required
                    type="text"
                    placeholder="e.g. Organic Urea Fertilizer"
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-4 focus:outline-none focus:border-amber-500/50 transition-colors"
                    value={newItem.name}
                    onChange={(e) => setNewItem({...newItem, name: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-white/50 uppercase ml-1">Description</label>
                  <textarea
                    required
                    rows={3}
                    placeholder="Describe the item condition, quality, etc..."
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-4 focus:outline-none focus:border-amber-500/50 transition-colors resize-none"
                    value={newItem.description}
                    onChange={(e) => setNewItem({...newItem, description: e.target.value})}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-white/50 uppercase ml-1">Price (INR)</label>
                    <input
                      required
                      type="number"
                      className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-4 focus:outline-none focus:border-amber-500/50 transition-colors"
                      value={newItem.price}
                      onChange={(e) => setNewItem({...newItem, price: Number(e.target.value)})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-white/50 uppercase ml-1">Category</label>
                    <select
                      className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-4 focus:outline-none focus:border-amber-500/50 transition-colors"
                      value={newItem.category}
                      onChange={(e) => setNewItem({...newItem, category: e.target.value})}
                    >
                      {categories.filter(c => c !== 'All').map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-white/50 uppercase ml-1">Quantity</label>
                    <input
                      required
                      type="number"
                      className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-4 focus:outline-none focus:border-amber-500/50 transition-colors"
                      value={newItem.quantity}
                      onChange={(e) => setNewItem({...newItem, quantity: Number(e.target.value)})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-white/50 uppercase ml-1">Unit</label>
                    <input
                      required
                      type="text"
                      placeholder="kg, bag, etc."
                      className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-4 focus:outline-none focus:border-amber-500/50 transition-colors"
                      value={newItem.unit}
                      onChange={(e) => setNewItem({...newItem, unit: e.target.value})}
                    />
                  </div>
                </div>

                <div className="pt-4">
                  <button
                    type="submit"
                    className="w-full bg-amber-500 text-black py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-amber-400 transition-colors"
                  >
                    <ShoppingBag className="w-5 h-5" />
                    List Item for Sale
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
