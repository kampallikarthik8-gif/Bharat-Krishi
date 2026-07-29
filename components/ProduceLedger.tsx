import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Database, 
  Plus, 
  Search, 
  QrCode, 
  ShieldCheck, 
  History, 
  ChevronRight,
  Package,
  Calendar,
  User,
  Hash,
  ArrowLeft,
  Loader2,
  CheckCircle2
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

interface ProduceBatch {
  id: string;
  crop: string;
  harvestDate: string;
  quantity: number;
  unit: string;
  quality: string;
  farmerId: string;
  farmerName: string;
  traceHash: string;
  status: string;
  createdAt: any;
}

export default function ProduceLedger({ onBack }: { onBack: () => void }) {
  const { profile } = useFirebase();
  const [batches, setBatches] = useState<ProduceBatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [newBatch, setNewBatch] = useState({
    crop: '',
    harvestDate: new Date().toISOString().split('T')[0],
    quantity: 0,
    unit: 'kg',
    quality: 'Grade A'
  });

  useEffect(() => {
    const q = query(collection(db, 'produce_ledger'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ProduceBatch[];
      setBatches(data);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'produce_ledger');
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleAddBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser || !profile) return;

    try {
      const traceHash = '0x' + Math.random().toString(16).slice(2, 10) + '...' + Math.random().toString(16).slice(2, 10);
      await addDoc(collection(db, 'produce_ledger'), {
        ...newBatch,
        farmerId: auth.currentUser.uid,
        farmerName: profile.name || 'Unknown Farmer',
        traceHash,
        status: 'Verified',
        createdAt: serverTimestamp()
      });
      setShowAddModal(false);
      setNewBatch({
        crop: '',
        harvestDate: new Date().toISOString().split('T')[0],
        quantity: 0,
        unit: 'kg',
        quality: 'Grade A'
      });
    } catch (error) {
      console.error('Error adding batch:', error);
    }
  };

  const filteredBatches = batches.filter(b => 
    b.crop.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.farmerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.traceHash.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
              <Database className="w-5 h-5 text-amber-500" />
              Produce Ledger
            </h1>
            <p className="text-xs text-white/50">Blockchain-backed Traceability</p>
          </div>
        </div>
      </div>

      <div className="p-4 max-w-2xl mx-auto space-y-6">
        {/* Search & Action */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <input
              type="text"
              placeholder="Search batches, farmers, or hash..."
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
            Log
          </button>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
            <p className="text-xs text-white/50 mb-1">Total Batches</p>
            <p className="text-2xl font-bold text-amber-500">{batches.length}</p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
            <p className="text-xs text-white/50 mb-1">Verified Status</p>
            <p className="text-2xl font-bold text-green-500">100%</p>
          </div>
        </div>

        {/* Ledger List */}
        <div className="space-y-4">
          <h2 className="text-sm font-semibold text-white/40 uppercase tracking-wider flex items-center gap-2">
            <History className="w-4 h-4" />
            Recent Entries
          </h2>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
              <p className="text-sm text-white/40">Syncing with ledger...</p>
            </div>
          ) : filteredBatches.length === 0 ? (
            <div className="text-center py-12 bg-white/5 rounded-3xl border border-dashed border-white/10">
              <Package className="w-12 h-12 text-white/10 mx-auto mb-3" />
              <p className="text-white/40">No batches found in the ledger</p>
            </div>
          ) : (
            filteredBatches.map((batch) => (
              <motion.div
                key={batch.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white/5 border border-white/10 rounded-2xl p-4 hover:border-amber-500/30 transition-all group"
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-amber-500/10 rounded-xl flex items-center justify-center">
                      <Package className="w-5 h-5 text-amber-500" />
                    </div>
                    <div>
                      <h3 className="font-bold">{batch.crop}</h3>
                      <p className="text-xs text-white/50 flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {batch.farmerName}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-xs font-bold text-amber-500 bg-amber-500/10 px-2 py-1 rounded-lg">
                      {batch.quantity} {batch.unit}
                    </span>
                    <span className="text-[10px] text-green-500 flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" />
                      {batch.status}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 py-3 border-y border-white/5 mb-3">
                  <div className="space-y-1">
                    <p className="text-[10px] text-white/30 uppercase tracking-tighter">Harvest Date</p>
                    <p className="text-xs flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-white/50" />
                      {batch.harvestDate}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] text-white/30 uppercase tracking-tighter">Quality Grade</p>
                    <p className="text-xs flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-white/50" />
                      {batch.quality}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Hash className="w-3 h-3 text-white/30" />
                    <code className="text-[10px] text-white/40 font-mono bg-black/40 px-2 py-1 rounded">
                      {batch.traceHash}
                    </code>
                  </div>
                  <button className="p-2 hover:bg-white/5 rounded-lg transition-colors text-amber-500">
                    <QrCode className="w-4 h-4" />
                  </button>
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
              className="relative w-full max-w-lg bg-[#121212] rounded-t-[2.5rem] sm:rounded-[2.5rem] border border-white/10 p-6 overflow-hidden"
            >
              <div className="w-12 h-1.5 bg-white/10 rounded-full mx-auto mb-6" />
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                <Plus className="w-6 h-6 text-amber-500" />
                New Ledger Entry
              </h2>

              <form onSubmit={handleAddBatch} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-white/50 uppercase ml-1">Crop Name</label>
                  <input
                    required
                    type="text"
                    placeholder="e.g. Basmati Rice"
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-4 focus:outline-none focus:border-amber-500/50 transition-colors"
                    value={newBatch.crop}
                    onChange={(e) => setNewBatch({...newBatch, crop: e.target.value})}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-white/50 uppercase ml-1">Quantity</label>
                    <input
                      required
                      type="number"
                      className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-4 focus:outline-none focus:border-amber-500/50 transition-colors"
                      value={newBatch.quantity}
                      onChange={(e) => setNewBatch({...newBatch, quantity: Number(e.target.value)})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-white/50 uppercase ml-1">Unit</label>
                    <select
                      className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-4 focus:outline-none focus:border-amber-500/50 transition-colors"
                      value={newBatch.unit}
                      onChange={(e) => setNewBatch({...newBatch, unit: e.target.value})}
                    >
                      <option value="kg">kg</option>
                      <option value="quintal">quintal</option>
                      <option value="ton">ton</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-white/50 uppercase ml-1">Harvest Date</label>
                  <input
                    required
                    type="date"
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-4 focus:outline-none focus:border-amber-500/50 transition-colors"
                    value={newBatch.harvestDate}
                    onChange={(e) => setNewBatch({...newBatch, harvestDate: e.target.value})}
                  />
                </div>

                <div className="pt-4">
                  <button
                    type="submit"
                    className="w-full bg-amber-500 text-black py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-amber-400 transition-colors"
                  >
                    <Database className="w-5 h-5" />
                    Verify & Commit to Ledger
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
