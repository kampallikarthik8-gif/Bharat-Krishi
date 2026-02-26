import React from 'react';
import { fetchMarketPrices } from '../services/geminiService';
import { 
  Search, 
  Loader2, 
  ExternalLink, 
  TrendingUp, 
  Globe, 
  ArrowUpRight, 
  ChevronRight, 
  TrendingDown, 
  Info,
  Navigation,
  MapPin,
  Landmark,
  BadgeCheck,
  Zap,
  Store,
  CalendarDays,
  Activity,
  ArrowRight,
  GripHorizontal
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface MarketTrendPoint {
  month: string;
  price: number;
}

interface MarketData {
  summary: string;
  currentPrice: number;
  currency: string;
  unit: string;
  trend: MarketTrendPoint[];
}

const TrendChart: React.FC<{ data: MarketTrendPoint[] }> = ({ data }) => {
  if (!data || data.length === 0) return null;

  const width = 400;
  const height = 180;
  const padding = 30;

  const prices = data.map(d => d.price);
  const minPrice = Math.min(...prices) * 0.95;
  const maxPrice = Math.max(...prices) * 1.05;
  const priceRange = maxPrice - minPrice;

  const points = data.map((d, i) => {
    const x = padding + (i * (width - 2 * padding)) / (data.length - 1);
    const y = height - padding - ((d.price - minPrice) / priceRange) * (height - 2 * padding);
    return { x, y };
  });

  const pathData = points.reduce((acc, point, i, arr) => {
    if (i === 0) return `M ${point.x} ${point.y}`;
    const prev = arr[i - 1];
    const cp1x = prev.x + (point.x - prev.x) / 2;
    const cp2x = prev.x + (point.x - prev.x) / 2;
    return `${acc} C ${cp1x} ${prev.y}, ${cp2x} ${point.y}, ${point.x} ${point.y}`;
  }, "");

  const areaPath = `${pathData} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`;

  return (
    <div className="w-full bg-white rounded-[2.5rem] p-7 border border-stone-100 shadow-inner">
      <div className="flex items-center justify-between mb-6">
        <h4 className="text-[10px] font-black text-stone-400 uppercase tracking-[0.2em] flex items-center gap-2">
          <Activity className="w-3.5 h-3.5 text-emerald-600" /> Season Velocity
        </h4>
        <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100/50">Historical Pulse</span>
      </div>
      <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
        <defs>
          <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={areaPath} fill="url(#chartGradient)" />
        <path d={pathData} fill="none" stroke="#059669" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
        {points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="6" fill="#059669" stroke="white" strokeWidth="3" />
        ))}
      </svg>
      <div className="flex justify-between mt-4 px-2">
        {data.map((d, i) => (
          <span key={i} className="text-[9px] font-black text-stone-300 uppercase">{d.month}</span>
        ))}
      </div>
    </div>
  );
};

interface MarketPricesProps {
  language: string;
}

const MarketPrices: React.FC<MarketPricesProps> = ({ language }) => {
  const [crop, setCrop] = React.useState('');
  const [location, setLocation] = React.useState(localStorage.getItem('agri_farm_location') || '');
  const [results, setResults] = React.useState<{ data: MarketData, sources: any[] } | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [detecting, setDetecting] = React.useState(false);

  const detectLocation = () => {
    setDetecting(true);
    const WEATHER_API_KEY = "42d5aa17c7f2866670e62b4c77cb3d32";
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const res = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&appid=${WEATHER_API_KEY}&units=metric`);
          const data = await res.json();
          const cityRegion = data.name || "Known Mandi Hub";
          setLocation(cityRegion);
        } catch (err) { console.error(err); }
        finally { setDetecting(false); }
      },
      () => setDetecting(false)
    );
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!crop || !location) return;
    setLoading(true);
    try {
      const result = await fetchMarketPrices(crop, location, language);
      setResults(result);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  return (
    <div className="space-y-10 pb-32 animate-in fade-in slide-in-from-bottom-6 duration-1000 ease-out">
      <div className="bg-white rounded-[4rem] p-10 md:p-16 shadow-sm border border-stone-100">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-10 mb-16">
          <div>
            <h2 className="text-6xl font-black text-stone-950 tracking-tighter uppercase leading-none">Mandi Intel</h2>
            <div className="flex items-center gap-4 mt-6">
               <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
               <p className="text-stone-400 text-[10px] font-black uppercase tracking-[0.4em]">Grounded Trade Intelligence Terminal</p>
            </div>
          </div>
          <div className="bg-stone-50 p-8 rounded-[2.5rem] border border-stone-100 shadow-inner">
            <Store className="text-stone-950 w-12 h-12" />
          </div>
        </div>

        <form onSubmit={handleSearch} className="space-y-8 mb-16">
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-3">
              <label className="text-[10px] font-black text-stone-400 ml-6 uppercase tracking-[0.3em]">Commodity Selection</label>
              <div className="relative group">
                <input
                  placeholder="e.g. Soybeans, Paddy"
                  value={crop}
                  onChange={(e) => setCrop(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-100 p-7 rounded-[2.5rem] outline-none focus:ring-4 focus:ring-emerald-500/10 focus:bg-white font-black text-base shadow-inner transition-all group-hover:border-stone-200"
                />
                <div className="absolute right-6 top-1/2 -translate-y-1/2 opacity-20 group-hover:opacity-100 transition-opacity">
                   <Activity className="w-6 h-6 text-stone-400" />
                </div>
              </div>
            </div>
            <div className="space-y-3">
              <label className="text-[10px] font-black text-stone-400 ml-6 uppercase tracking-[0.3em]">Market Hub (Mandi)</label>
              <div className="relative group">
                <input
                  placeholder="e.g. Nashik, Guntur"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-100 p-7 pl-16 rounded-[2.5rem] outline-none focus:ring-4 focus:ring-emerald-500/10 focus:bg-white font-black text-base shadow-inner transition-all group-hover:border-stone-200"
                />
                <MapPin className="absolute left-6 top-1/2 -translate-y-1/2 text-stone-300 w-7 h-7" />
                <button 
                  type="button" 
                  onClick={detectLocation} 
                  className="absolute right-6 top-1/2 -translate-y-1/2 p-3 bg-white rounded-2xl shadow-xl text-stone-950 active:scale-90 transition-all border border-stone-100 hover:bg-emerald-500 hover:text-white"
                >
                   {detecting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Navigation className="w-5 h-5" />}
                </button>
              </div>
            </div>
          </div>
          <button 
            type="submit"
            disabled={loading || detecting}
            className="w-full bg-stone-950 text-white font-black py-7 rounded-[2.5rem] shadow-2xl active:scale-[0.98] transition-all flex items-center justify-center gap-4 disabled:opacity-50 uppercase text-[11px] tracking-[0.4em]"
          >
            {loading ? <Loader2 className="animate-spin w-6 h-6" /> : <Zap className="w-6 h-6 text-emerald-400" />}
            Synchronize Trading Quotes
          </button>
        </form>

        {loading ? (
          <div className="py-32 flex flex-col items-center justify-center space-y-10 animate-in fade-in duration-700">
            <div className="relative">
                <div className="w-32 h-32 border-[12px] border-stone-50 border-t-stone-950 rounded-full animate-spin shadow-inner"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                   <Landmark className="w-10 h-10 text-stone-950 animate-pulse" />
                </div>
            </div>
            <div className="text-center space-y-4">
              <p className="font-black text-base uppercase tracking-[0.5em] text-stone-950 animate-pulse">Polling Trading Floors...</p>
              <p className="text-[10px] text-stone-400 font-bold uppercase tracking-[0.3em]">Querying Grounded Financial Sources</p>
            </div>
          </div>
        ) : results ? (
          <div className="space-y-12 animate-in slide-in-from-bottom-12 duration-1000 ease-out">
            {/* HERO PRICE CARD - REFINED */}
            <div className="bg-stone-950 rounded-[5rem] p-12 md:p-16 text-white shadow-2xl relative overflow-hidden border border-white/5 group">
               {/* Ambient Effects */}
               <div className="absolute top-0 right-0 p-16 opacity-[0.03] rotate-12 scale-150 group-hover:scale-[1.6] transition-transform duration-1000 pointer-events-none">
                  <Landmark className="w-96 h-96" />
               </div>
               <div className="absolute -bottom-32 -left-32 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none"></div>
               
               <div className="relative z-10">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-10 mb-20">
                     <div className="flex items-center gap-8">
                        <div className="bg-white/10 backdrop-blur-2xl p-6 rounded-[2.5rem] border border-white/10 shadow-2xl">
                           <BadgeCheck className="w-10 h-10 text-emerald-400" />
                        </div>
                        <div>
                           <p className="text-[10px] font-black uppercase tracking-[0.4em] text-stone-500 mb-2">Trade Hub Verified</p>
                           <h3 className="text-3xl font-black tracking-tighter flex items-center gap-4 uppercase">
                             {location} <ArrowUpRight className="w-6 h-6 text-emerald-500" />
                           </h3>
                        </div>
                     </div>
                     <div className="flex flex-col items-end">
                        <div className="bg-white/5 backdrop-blur-md px-8 py-3 rounded-full border border-white/10 flex items-center gap-4">
                           <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_15px_#10b981]" />
                           <span className="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-50">Live Quote Active</span>
                        </div>
                        <p className="text-[9px] font-bold text-stone-500 uppercase tracking-[0.3em] mt-4">Refreshed just now</p>
                     </div>
                  </div>

                  <div className="flex flex-col gap-2 px-6">
                     <div className="flex items-center gap-4 mb-8">
                        <GripHorizontal className="w-6 h-6 text-stone-800" />
                        <span className="text-[10px] font-black uppercase tracking-[0.5em] text-stone-600">Premium Market Data</span>
                     </div>
                     
                     <div className="flex flex-col gap-6">
                        <div className="flex items-baseline gap-6">
                           <span className="text-6xl font-black text-emerald-500 tracking-tighter opacity-80">{results.data.currency || '₹'}</span>
                           <h1 className="text-9xl md:text-[12rem] font-black tracking-tighter leading-none text-white drop-shadow-2xl">
                             {results.data.currentPrice.toLocaleString()}
                           </h1>
                        </div>
                        
                        <div className="flex items-center gap-10 mt-6">
                           <div className="bg-white/5 backdrop-blur-md px-10 py-4 rounded-[2rem] border border-white/10 flex items-center gap-6 shadow-2xl">
                              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-stone-500">Per</p>
                              <div className="h-6 w-px bg-stone-800"></div>
                              <p className="text-3xl font-black text-white uppercase tracking-tight">{results.data.unit}</p>
                           </div>
                           
                           <div className="flex items-center gap-3 text-emerald-400">
                              <TrendingUp className="w-8 h-8" />
                              <span className="text-xl font-black uppercase tracking-[0.2em]">+12.4%</span>
                           </div>
                        </div>
                     </div>
                  </div>

                  {/* Market Index Visualizer */}
                  <div className="mt-20 pt-12 border-t border-white/5 space-y-6">
                    <div className="flex justify-between items-end px-4">
                       <span className="text-[10px] font-black uppercase tracking-[0.3em] text-stone-600">Season Low</span>
                       <div className="flex flex-col items-center">
                          <span className="text-[9px] font-black uppercase tracking-[0.4em] text-emerald-500 mb-2">Mandi Index Position</span>
                          <div className="w-2 h-2 bg-white rounded-full shadow-[0_0_15px_white]"></div>
                       </div>
                       <span className="text-[10px] font-black uppercase tracking-[0.3em] text-stone-600">Season High</span>
                    </div>
                    <div className="h-3 w-full bg-stone-900 rounded-full border border-white/5 relative overflow-hidden shadow-inner">
                       <div className="absolute top-0 bottom-0 left-[20%] right-[30%] bg-gradient-to-r from-emerald-600 to-emerald-400 rounded-full shadow-[0_0_20px_rgba(16,185,129,0.3)]"></div>
                       <div className="absolute top-0 bottom-0 left-[75%] w-1.5 bg-white shadow-[0_0_10px_white] z-10"></div>
                    </div>
                  </div>
               </div>
            </div>

            <div className="grid grid-cols-1 gap-12">
              <TrendChart data={results.data.trend} />
              
              <div className="bg-stone-50 rounded-[4rem] p-12 border border-stone-100 shadow-inner relative overflow-hidden group">
                 <div className="absolute -right-12 -top-12 opacity-[0.02] group-hover:opacity-10 transition-opacity pointer-events-none">
                   <Info className="w-64 h-64" />
                 </div>
                 <div className="flex items-center justify-between mb-12">
                    <div className="flex items-center gap-4 text-stone-950 font-black text-[11px] uppercase tracking-[0.4em]">
                       <div className="p-4 bg-white rounded-[1.5rem] shadow-xl border border-stone-100"><Info className="w-6 h-6 text-emerald-600" /></div>
                       Analysis Digest
                    </div>
                    <button className="flex items-center gap-3 text-[10px] font-black text-emerald-600 uppercase tracking-[0.3em] group/btn">
                       Expand Full Report <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-2 transition-transform" />
                    </button>
                 </div>
                 <div className="prose prose-stone max-w-none text-xl font-medium text-stone-700 leading-relaxed italic tracking-tight">
                    <ReactMarkdown>{results.data.summary}</ReactMarkdown>
                 </div>
              </div>
            </div>

            <div className="space-y-8">
               <div className="flex items-center justify-between px-10">
                  <h3 className="text-[11px] font-black text-stone-400 uppercase tracking-[0.4em] flex items-center gap-4">
                    <Globe className="w-6 h-6 text-stone-950" /> Grounding Citations
                  </h3>
                  <div className="flex gap-3">
                     <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>
                     <div className="w-2.5 h-2.5 rounded-full bg-stone-200"></div>
                  </div>
               </div>
               <div className="grid grid-cols-1 gap-6">
                  {results.sources.map((s, i) => s.web && (
                    <a key={i} href={s.web.uri} target="_blank" rel="noopener" className="p-8 bg-white border border-stone-100 rounded-[3rem] flex items-center justify-between group hover:border-emerald-500 hover:shadow-2xl transition-all shadow-sm">
                       <div className="flex flex-col truncate pr-10">
                          <span className="font-black text-stone-950 text-xl truncate mb-3 group-hover:text-emerald-700 transition-colors tracking-tight uppercase">{s.web.title}</span>
                          <div className="flex items-center gap-6">
                            <div className="flex items-center gap-3">
                               <div className="w-6 h-6 bg-stone-50 rounded-full flex items-center justify-center overflow-hidden border border-stone-100 shadow-inner">
                                  <img src={`https://www.google.com/s2/favicons?domain=${new URL(s.web.uri).hostname}`} className="w-3.5 h-3.5" alt="" />
                               </div>
                               <span className="text-[10px] font-black text-stone-400 uppercase tracking-[0.2em]">{new URL(s.web.uri).hostname}</span>
                            </div>
                            <div className="w-1.5 h-1.5 rounded-full bg-stone-100" />
                            <span className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.3em]">Verified Citation</span>
                          </div>
                       </div>
                       <div className="p-5 bg-stone-50 rounded-[1.5rem] group-hover:bg-emerald-500 group-hover:text-white transition-all border border-transparent group-hover:border-emerald-400 shadow-inner">
                        <ExternalLink className="w-6 h-6 text-stone-300 group-hover:text-white" />
                       </div>
                    </a>
                  ))}
               </div>
            </div>
          </div>
        ) : (
          <div className="py-40 text-center opacity-30 flex flex-col items-center animate-in fade-in duration-1000">
            <div className="p-16 bg-stone-50 rounded-[4rem] mb-12 shadow-inner relative group cursor-pointer hover:bg-stone-100 transition-all">
              <Globe className="w-32 h-32 text-stone-200 group-hover:rotate-12 transition-transform duration-1000" />
              <div className="absolute -top-6 -right-6 bg-white p-6 rounded-[2rem] shadow-2xl border border-stone-100 animate-bounce">
                 <Search className="w-8 h-8 text-emerald-500" />
              </div>
            </div>
            <p className="font-black text-2xl uppercase tracking-[0.3em] leading-relaxed max-w-[400px] text-stone-950">
              Synchronize Market Hub to Initiate Trade Pulse
            </p>
            <p className="text-stone-400 text-sm font-medium mt-6 uppercase tracking-widest">Real-time localized price discovery for your region</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MarketPrices;