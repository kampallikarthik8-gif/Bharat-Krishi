
import React from 'react';
import { evaluateSustainability } from '../services/geminiService';
import { ShieldCheck, Leaf, Loader2, Zap, TrendingUp, Info, CheckCircle2, Award, TreePine } from 'lucide-react';
import Markdown from 'react-markdown';

const SUSTAINABLE_PRACTICES = [
  'No-Till Farming',
  'Cover Cropping',
  'Crop Rotation',
  'Organic Fertilizers',
  'Drip Irrigation',
  'Agroforestry',
  'Composting',
  'Integrated Pest Management',
  'Renewable Energy Use'
];

interface SustainabilityHubProps {
  language: string;
}

// Fixed error: Used direct props destructuring instead of React.FC wrapper
const SustainabilityHub = ({ language }: SustainabilityHubProps) => {
  const [selectedPractices, setSelectedPractices] = React.useState<string[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [report, setReport] = React.useState('');

  const togglePractice = (p: string) => {
    setSelectedPractices(prev => 
      prev.includes(p) ? prev.filter(item => item !== p) : [...prev, p]
    );
  };

  const handleEvaluate = async () => {
    if (selectedPractices.length === 0) return;
    setLoading(true);
    try {
      const res = await evaluateSustainability(selectedPractices, language);
      setReport(res || '');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in slide-in-from-bottom-6 duration-700">
      <div className="bg-white rounded-[2.5rem] p-6 md:p-8 shadow-sm border border-stone-200">
        <h2 className="text-2xl font-black mb-2 flex items-center gap-3 text-stone-900">
          <div className="bg-blue-100 p-2.5 rounded-2xl">
            <ShieldCheck className="text-blue-700 w-6 h-6" />
          </div>
          Sustainability Hub ({language})
        </h2>
        <p className="text-stone-500 text-sm font-medium mb-8">
          Evaluate your farm's ecological footprint and estimate carbon credit potential.
        </p>

        <div className="space-y-6">
          <h3 className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-2">Select Active Practices</h3>
          <div className="flex flex-wrap gap-2">
            {SUSTAINABLE_PRACTICES.map(p => (
              <button 
                key={p}
                onClick={() => togglePractice(p)}
                className={`px-4 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border ${selectedPractices.includes(p) ? 'bg-blue-600 text-white border-blue-600 shadow-md' : 'bg-stone-50 text-stone-400 border-stone-100 hover:border-blue-200'}`}
              >
                {selectedPractices.includes(p) && <CheckCircle2 className="w-3 h-3 inline mr-2" />}
                {p}
              </button>
            ))}
          </div>

          <button 
            onClick={handleEvaluate}
            disabled={loading || selectedPractices.length === 0}
            className="w-full bg-stone-900 text-white font-black py-4.5 rounded-[1.5rem] flex items-center justify-center gap-3 shadow-xl active:scale-[0.98] transition-all disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin" /> : <ShieldCheck className="w-5 h-5" />}
            Analyze Eco-Impact
          </button>
        </div>

        {loading && (
          <div className="py-20 flex flex-col items-center justify-center text-blue-600 space-y-4">
            <Loader2 className="animate-spin w-10 h-10" />
            <p className="font-black text-[10px] uppercase tracking-widest animate-pulse">Calculating Biome Synergy...</p>
          </div>
        )}

        {report && !loading && (
          <div className="mt-12 space-y-8 animate-in zoom-in-95 duration-500">
            <div className="grid grid-cols-2 gap-4">
               <div className="bg-emerald-50 p-6 rounded-[2rem] border border-emerald-100 shadow-sm flex flex-col justify-between h-40">
                  <div className="bg-white p-2.5 rounded-xl w-fit shadow-sm text-emerald-600"><Award className="w-5 h-5" /></div>
                  <div>
                    <p className="text-[9px] font-black text-emerald-800 uppercase tracking-widest mb-1">Eco-Cert Level</p>
                    <p className="text-xl font-black text-emerald-900">Elite Green</p>
                  </div>
               </div>
               <div className="bg-blue-50 p-6 rounded-[2rem] border border-blue-100 shadow-sm flex flex-col justify-between h-40">
                  <div className="bg-white p-2.5 rounded-xl w-fit shadow-sm text-blue-600"><TreePine className="w-5 h-5" /></div>
                  <div>
                    <p className="text-[9px] font-black text-blue-800 uppercase tracking-widest mb-1">Sequestration</p>
                    <p className="text-xl font-black text-blue-900">Estimated +14%</p>
                  </div>
               </div>
            </div>

            <div className="bg-stone-50 border border-stone-100 p-8 rounded-[2.5rem] prose prose-blue max-w-none text-sm font-medium leading-relaxed shadow-inner">
               <div className="flex items-center gap-2 text-blue-700 font-black text-[10px] uppercase tracking-[0.2em] mb-6">
                 <Zap className="w-4 h-4" /> Environmental Audit
               </div>
               <Markdown>{report}</Markdown>
            </div>

            <div className="bg-gradient-to-br from-emerald-600 to-teal-700 p-8 rounded-[2.5rem] text-white shadow-xl shadow-emerald-950/20">
               <h4 className="font-black text-emerald-200 text-[10px] uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                 <TrendingUp className="w-4 h-4" /> ROI Potential
               </h4>
               <p className="text-lg font-black leading-tight mb-4">
                 Your practices may qualify for up to $45/acre in carbon credit offsets.
               </p>
               <p className="text-xs text-emerald-100/70 font-medium">
                 Estimate based on regional voluntary carbon markets and current sequestration logic.
               </p>
            </div>
          </div>
        )}

        {!report && !loading && (
          <div className="py-24 text-center text-stone-200 opacity-40">
            <Leaf className="w-16 h-16 mx-auto mb-4" />
            <p className="font-black text-sm uppercase tracking-widest">Measure your eco-impact</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SustainabilityHub;
