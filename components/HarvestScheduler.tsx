
import React from 'react';
import { predictHarvest } from '../services/geminiService';
import { Calendar, Sprout, Loader2, MapPin, Wind, Thermometer, Droplets, CheckCircle2, Info } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface HarvestSchedulerProps {
  language: string;
}

const HarvestScheduler: React.FC<HarvestSchedulerProps> = ({ language }) => {
  const [data, setData] = React.useState({ crop: '', variety: '', plantingDate: '', location: '' });
  const [prediction, setPrediction] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  const handlePredict = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!data.crop || !data.plantingDate) return;
    setLoading(true);
    try {
      const res = await predictHarvest(data, language);
      setPrediction(res || '');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in slide-in-from-bottom-6">
      <div className="bg-white rounded-[2.5rem] p-6 md:p-8 shadow-sm border border-stone-200">
        <h2 className="text-2xl font-black mb-2 flex items-center gap-3 text-stone-900">
          <div className="bg-emerald-100 p-2.5 rounded-2xl">
            <Calendar className="text-emerald-700 w-6 h-6" />
          </div>
          Harvest Window Predictor
        </h2>
        <p className="text-stone-500 text-sm font-medium mb-8">
          Predict your peak harvest date using GDD (Growing Degree Days) logic and climate trends.
        </p>

        <form onSubmit={handlePredict} className="space-y-4 mb-8">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-stone-400 ml-2 uppercase tracking-widest">Crop</label>
              <input 
                placeholder="e.g. Wheat" 
                className="w-full bg-stone-50 border border-stone-200 p-4 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500"
                onChange={e => setData({...data, crop: e.target.value})}
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-stone-400 ml-2 uppercase tracking-widest">Variety</label>
              <input 
                placeholder="e.g. Hard Red Winter" 
                className="w-full bg-stone-50 border border-stone-200 p-4 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500"
                onChange={e => setData({...data, variety: e.target.value})}
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-stone-400 ml-2 uppercase tracking-widest">Planting Date</label>
              <input 
                type="date"
                className="w-full bg-stone-50 border border-stone-200 p-4 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500"
                onChange={e => setData({...data, plantingDate: e.target.value})}
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-stone-400 ml-2 uppercase tracking-widest">Location</label>
              <input 
                placeholder="e.g. Kansas, USA" 
                className="w-full bg-stone-50 border border-stone-200 p-4 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500"
                onChange={e => setData({...data, location: e.target.value})}
              />
            </div>
          </div>
          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-stone-900 text-white font-black py-4.5 rounded-[1.5rem] flex items-center justify-center gap-3 shadow-xl active:scale-[0.98] transition-all disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin" /> : <Calendar className="w-5 h-5" />}
            Calculate Harvest Strategy
          </button>
        </form>

        {loading && (
          <div className="py-20 flex flex-col items-center justify-center text-emerald-600 space-y-4">
            <Loader2 className="animate-spin w-10 h-10" />
            <p className="font-black text-[10px] uppercase tracking-widest animate-pulse">Running Growth Simulations...</p>
          </div>
        )}

        {prediction && !loading && (
          <div className="mt-8 space-y-6 animate-in zoom-in-95 duration-500">
            <div className="bg-emerald-50 border border-emerald-100 p-6 rounded-[2rem] prose prose-emerald max-w-none text-sm font-medium leading-relaxed shadow-inner">
               <div className="flex items-center gap-2 text-emerald-700 font-black text-[10px] uppercase tracking-[0.2em] mb-4">
                 <CheckCircle2 className="w-4 h-4" /> Strategic Assessment ({language})
               </div>
               <ReactMarkdown>{prediction}</ReactMarkdown>
            </div>

            <div className="grid grid-cols-2 gap-4">
               <div className="bg-blue-50 p-4 rounded-[1.5rem] border border-blue-100">
                  <Droplets className="w-5 h-5 text-blue-600 mb-2" />
                  <p className="text-[10px] font-black text-blue-800 uppercase tracking-widest">Storage Humidity</p>
                  <p className="text-xs font-bold text-blue-900">AI Predicted Optima</p>
               </div>
               <div className="bg-orange-50 p-4 rounded-[1.5rem] border border-orange-100">
                  <Thermometer className="w-5 h-5 text-orange-600 mb-2" />
                  <p className="text-[10px] font-black text-orange-800 uppercase tracking-widest">Storage Temp</p>
                  <p className="text-xs font-bold text-orange-900">Climate Logged</p>
               </div>
            </div>
          </div>
        )}

        {!prediction && !loading && (
          <div className="py-24 text-center text-stone-200 opacity-40">
            <Calendar className="w-16 h-16 mx-auto mb-4" />
            <p className="font-black text-sm uppercase tracking-widest">Plan your harvest window</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default HarvestScheduler;
