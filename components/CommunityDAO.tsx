import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, 
  Plus, 
  Vote, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  ArrowLeft,
  MessageSquare,
  TrendingUp,
  Shield,
  Loader2,
  ChevronRight,
  Info
} from 'lucide-react';
import { db, auth } from '../src/firebase';
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  updateDoc,
  doc,
  serverTimestamp,
  increment
} from 'firebase/firestore';
import { useFirebase } from '../src/components/FirebaseProvider';
import { handleFirestoreError, OperationType } from '../src/utils/firestoreErrorHandler';

interface DAOProposal {
  id: string;
  title: string;
  description: string;
  creatorId: string;
  creatorName: string;
  votesYes: number;
  votesNo: number;
  status: 'Active' | 'Passed' | 'Rejected';
  endsAt: string;
  createdAt: any;
}

export default function CommunityDAO({ onBack }: { onBack: () => void }) {
  const { profile } = useFirebase();
  const [proposals, setProposals] = useState<DAOProposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newProposal, setNewProposal] = useState({
    title: '',
    description: '',
    duration: 7 // days
  });

  useEffect(() => {
    const q = query(collection(db, 'dao_proposals'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as DAOProposal[];
      setProposals(data);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'dao_proposals');
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleCreateProposal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser || !profile) return;

    try {
      const endsAt = new Date();
      endsAt.setDate(endsAt.getDate() + newProposal.duration);

      await addDoc(collection(db, 'dao_proposals'), {
        title: newProposal.title,
        description: newProposal.description,
        creatorId: auth.currentUser.uid,
        creatorName: profile.name || 'Unknown Farmer',
        votesYes: 0,
        votesNo: 0,
        status: 'Active',
        endsAt: endsAt.toISOString(),
        createdAt: serverTimestamp()
      });
      setShowAddModal(false);
      setNewProposal({ title: '', description: '', duration: 7 });
    } catch (error) {
      console.error('Error creating proposal:', error);
    }
  };

  const handleVote = async (proposalId: string, voteType: 'Yes' | 'No') => {
    try {
      const proposalRef = doc(db, 'dao_proposals', proposalId);
      await updateDoc(proposalRef, {
        [voteType === 'Yes' ? 'votesYes' : 'votesNo']: increment(1)
      });
    } catch (error) {
      console.error('Error voting:', error);
    }
  };

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
              <Users className="w-5 h-5 text-amber-500" />
              Farmer DAO
            </h1>
            <p className="text-xs text-white/50">Community Governance & Voting</p>
          </div>
        </div>
      </div>

      <div className="p-4 max-w-2xl mx-auto space-y-6">
        {/* DAO Info Card */}
        <div className="bg-gradient-to-br from-amber-500/20 to-amber-900/10 border border-amber-500/20 rounded-3xl p-6 relative overflow-hidden">
          <div className="relative z-10">
            <h2 className="text-lg font-bold mb-2">Decentralized Governance</h2>
            <p className="text-sm text-white/70 mb-4">
              Vote on community initiatives, equipment sharing rules, and local farming standards.
            </p>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-500">
                <Shield className="w-4 h-4" />
                1 Vote = 1 Farmer
              </div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-500">
                <TrendingUp className="w-4 h-4" />
                Quorum: 20%
              </div>
            </div>
          </div>
          <Users className="absolute -right-4 -bottom-4 w-32 h-32 text-amber-500/5 rotate-12" />
        </div>

        {/* Action Bar */}
        <div className="flex justify-between items-center">
          <h2 className="text-sm font-semibold text-white/40 uppercase tracking-wider">Active Proposals</h2>
          <button 
            onClick={() => setShowAddModal(true)}
            className="bg-amber-500 text-black px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-amber-400 transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Proposal
          </button>
        </div>

        {/* Proposals List */}
        <div className="space-y-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
              <p className="text-sm text-white/40">Loading proposals...</p>
            </div>
          ) : proposals.length === 0 ? (
            <div className="text-center py-12 bg-white/5 rounded-3xl border border-dashed border-white/10">
              <MessageSquare className="w-12 h-12 text-white/10 mx-auto mb-3" />
              <p className="text-white/40">No proposals yet. Be the first!</p>
            </div>
          ) : (
            proposals.map((proposal) => (
              <motion.div
                key={proposal.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white/5 border border-white/10 rounded-2xl p-5 hover:border-amber-500/30 transition-all"
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                        proposal.status === 'Active' ? 'bg-amber-500/10 text-amber-500' :
                        proposal.status === 'Passed' ? 'bg-green-500/10 text-green-500' :
                        'bg-red-500/10 text-red-500'
                      }`}>
                        {proposal.status}
                      </span>
                      <span className="text-[10px] text-white/30 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Ends: {new Date(proposal.endsAt).toLocaleDateString()}
                      </span>
                    </div>
                    <h3 className="font-bold text-lg">{proposal.title}</h3>
                  </div>
                  <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center">
                    <Vote className="w-5 h-5 text-amber-500" />
                  </div>
                </div>

                <p className="text-sm text-white/60 mb-6 line-clamp-2">
                  {proposal.description}
                </p>

                {/* Voting Progress */}
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-xs font-bold mb-1">
                    <span className="text-green-500 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      Yes: {proposal.votesYes}
                    </span>
                    <span className="text-red-500 flex items-center gap-1">
                      <XCircle className="w-3 h-3" />
                      No: {proposal.votesNo}
                    </span>
                  </div>
                  <div className="h-2 bg-white/5 rounded-full overflow-hidden flex">
                    <div 
                      className="h-full bg-green-500 transition-all duration-500" 
                      style={{ width: `${(proposal.votesYes / (proposal.votesYes + proposal.votesNo || 1)) * 100}%` }}
                    />
                    <div 
                      className="h-full bg-red-500 transition-all duration-500" 
                      style={{ width: `${(proposal.votesNo / (proposal.votesYes + proposal.votesNo || 1)) * 100}%` }}
                    />
                  </div>
                </div>

                {/* Voting Actions */}
                {proposal.status === 'Active' && (
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => handleVote(proposal.id, 'Yes')}
                      className="bg-green-500/10 text-green-500 py-3 rounded-xl font-bold text-sm hover:bg-green-500/20 transition-colors flex items-center justify-center gap-2"
                    >
                      Vote Yes
                    </button>
                    <button
                      onClick={() => handleVote(proposal.id, 'No')}
                      className="bg-red-500/10 text-red-500 py-3 rounded-xl font-bold text-sm hover:bg-red-500/20 transition-colors flex items-center justify-center gap-2"
                    >
                      Vote No
                    </button>
                  </div>
                )}

                <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between text-[10px] text-white/30">
                  <span>Proposed by: {proposal.creatorName}</span>
                  <button className="flex items-center gap-1 hover:text-amber-500 transition-colors">
                    View Discussion
                    <ChevronRight className="w-3 h-3" />
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
              className="relative w-full max-w-lg bg-[#121212] rounded-t-[2.5rem] sm:rounded-[2.5rem] border border-white/10 p-6"
            >
              <div className="w-12 h-1.5 bg-white/10 rounded-full mx-auto mb-6" />
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                <Plus className="w-6 h-6 text-amber-500" />
                Create Proposal
              </h2>

              <form onSubmit={handleCreateProposal} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-white/50 uppercase ml-1">Title</label>
                  <input
                    required
                    type="text"
                    placeholder="e.g. Community Seed Bank Initiative"
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-4 focus:outline-none focus:border-amber-500/50 transition-colors"
                    value={newProposal.title}
                    onChange={(e) => setNewProposal({...newProposal, title: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-white/50 uppercase ml-1">Description</label>
                  <textarea
                    required
                    rows={4}
                    placeholder="Describe the proposal and its benefits..."
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-4 focus:outline-none focus:border-amber-500/50 transition-colors resize-none"
                    value={newProposal.description}
                    onChange={(e) => setNewProposal({...newProposal, description: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-white/50 uppercase ml-1">Voting Duration (Days)</label>
                  <select
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-4 focus:outline-none focus:border-amber-500/50 transition-colors"
                    value={newProposal.duration}
                    onChange={(e) => setNewProposal({...newProposal, duration: Number(e.target.value)})}
                  >
                    <option value={3}>3 Days</option>
                    <option value={7}>7 Days</option>
                    <option value={14}>14 Days</option>
                    <option value={30}>30 Days</option>
                  </select>
                </div>

                <div className="bg-amber-500/10 rounded-2xl p-4 flex gap-3">
                  <Info className="w-5 h-5 text-amber-500 shrink-0" />
                  <p className="text-xs text-amber-500/80 leading-relaxed">
                    Once created, a proposal cannot be edited. Ensure all details are correct before submitting to the DAO.
                  </p>
                </div>

                <div className="pt-4">
                  <button
                    type="submit"
                    className="w-full bg-amber-500 text-black py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-amber-400 transition-colors"
                  >
                    <Vote className="w-5 h-5" />
                    Submit to Community
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
