
import React from 'react';
import { estimateYield } from '../services/geminiService';
import { Calculator, Coins, TrendingUp, Loader2, Map as MapIcon, Sprout } from 'lucide-react';
import Markdown from 'react-markdown';

interface YieldPredictorProps {
  language: string;
}

// Fixed error: Used direct props destructuring for more reliable prop type inference
const YieldPredictor = ({ language }: YieldPredictorProps) => {
  const [data, setData] = React.useState({ crop: '', area: '', unit: 'Hectares', irrigation: 'Rainfed', variety: '' });
  const [prediction, setPrediction] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  const handlePredict = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!data.crop || !data.area) return;
    setLoading(true);
    try {
      const res = await estimateYield(data, language);
      setPrediction(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-stone-200">
        <h2 className="text-2xl font-bold mb-2 flex items-center gap-2 text-stone-800">
          <Calculator className="text-blue-600" />
          Yield & ROI Predictor
        </h2>
        <p className="text-stone-500 mb-8">
          Calculate estimated harvest weight and potential financial returns for the season.
        </p>

        <form onSubmit={handlePredict} className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10 bg-stone-50 p-6 rounded-3xl border border-stone-100">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-stone-400 ml-1">CROP TYPE</label>
            <input 
              placeholder="e.g. Soybeans" 
              className="w-full bg-white border border-stone-200 p-3 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
              onChange={e => setData({...data, crop: e.target.value})}
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-stone-400 ml-1">VARIETY</label>
            <input 
              placeholder="e.g. Pioneer 93Y92" 
              className="w-full bg-white border border-stone-200 p-3 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
              onChange={e => setData({...data, variety: e.target.value})}
            />
          </div>
          <div className="flex gap-2">
            <div className="space-y-1 flex-1">
              <label className="text-[10px] font-bold text-stone-400 ml-1">AREA</label>
              <input 
                type="number"
                placeholder="0" 
                className="w-full bg-white border border-stone-200 p-3 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                onChange={e => setData({...data, area: e.target.value})}
              />
            </div>
            <div className="space-y-1 w-24">
              <label className="text-[10px] font-bold text-stone-400 ml-1">UNIT</label>
              <select 
                className="w-full bg-white border border-stone-200 p-3 rounded-xl outline-none h-[46px]"
                onChange={e => setData({...data, unit: e.target.value})}
              >
                <option>Hectares</option>
                <option>Acres</option>
              </select>
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-stone-400 ml-1">IRRIGATION</label>
            <select 
              className="w-full bg-white border border-stone-200 p-3 rounded-xl outline-none"
              onChange={e => setData({...data, irrigation: e.target.value})}
            >
              <option>Rainfed</option>
              <option>Drip</option>
              <option>Sprinkler</option>
              <option>Flood</option>
            </select>
          </div>
          <div className="lg:col-span-2 flex items-end">
            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white font-bold h-[46px] rounded-xl flex items-center justify-center gap-2 hover:bg-blue-700 transition-all disabled:opacity-50"
            >
              {loading ? <Loader2 className="animate-spin" /> : <TrendingUp className="w-5 h-5" />}
              Generate Yield Report
            </button>
          </div>
        </form>

        {prediction && (
          <div className="bg-stone-50 border border-stone-200 p-8 rounded-[2rem] prose prose-blue max-w-none animate-in zoom-in-95">
            <div className="flex items-center gap-3 mb-6 not-prose">
              <div className="p-3 bg-white rounded-2xl shadow-sm text-blue-600">
                <Coins className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-stone-800 m-0 leading-none">AI Yield Forecast ({language})</h3>
                <p className="text-xs text-stone-400 mt-1 uppercase font-bold tracking-widest">Calculated via Gemini 3 Pro</p>
              </div>
            </div>
            <Markdown>{prediction}</Markdown>
          </div>
        )}
      </div>
    </div>
  );
};

export default YieldPredictor;
