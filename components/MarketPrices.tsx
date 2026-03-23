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
  GripHorizontal,
  MessageCircle
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
    <div className="w-full rounded-3xl p-8 border border-stone-800 shadow-sm bg-stone-900">
      <div className="flex items-center justify-between mb-8">
        <h4 className="text-xs font-medium text-stone-400 uppercase tracking-widest flex items-center gap-3">
          <Activity className="w-4 h-4 text-amber-500" /> Price Trends
        </h4>
        <span className="text-[10px] font-bold text-amber-500 bg-amber-500/10 px-3 py-1.5 rounded-full border border-amber-500/20 uppercase tracking-widest">Market Pulse</span>
      </div>
      <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
        <defs>
          <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#fbbf24" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={areaPath} fill="url(#chartGradient)" />
        <path d={pathData} fill="none" stroke="#fbbf24" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        {points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="4" fill="#fbbf24" stroke="#1c1917" strokeWidth="2" />
        ))}
      </svg>
      <div className="flex justify-between mt-6 px-4">
        {data.map((d, i) => (
          <span key={i} className="text-[10px] font-medium text-stone-500 uppercase tracking-widest">{d.month}</span>
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
    const WEATHER_API_KEY = import.meta.env.VITE_WEATHER_API_KEY;
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const res = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&appid=${WEATHER_API_KEY}&units=metric`);
          const data = await res.json();
          const cityRegion = data.name || "Local Mandi";
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

  const shareOnWhatsApp = () => {
    if (!results) return;
    const message = `*Bharat Kisan - Mandi Bhav*%0A%0A` +
      `*Crop:* ${crop}%0A` +
      `*Market:* ${location}%0A` +
      `*Current Price:* ${results.data.currency}${results.data.currentPrice.toLocaleString()} per ${results.data.unit}%0A%0A` +
      `*Summary:* ${results.data.summary.substring(0, 200)}...%0A%0A` +
      `Check live rates on Bharat Kisan App`;
    
    window.open(`https://wa.me/?text=${message}`, '_blank');
  };

  return (
    <div className="space-y-12 pb-40 animate-in fade-in slide-in-from-bottom-6 duration-1000 ease-out bg-black min-h-screen p-6">
      <div className="rounded-[2.5rem] p-8 md:p-16 border border-stone-800 shadow-sm bg-stone-900">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-16">
          <div>
            <h2 className="text-5xl font-serif font-bold text-white tracking-tight">Mandi Bhav</h2>
            <div className="flex items-center gap-3 mt-4">
               <div className="w-2 h-2 bg-amber-500 rounded-full shadow-sm shadow-amber-500/50"></div>
               <p className="text-stone-400 text-xs font-medium uppercase tracking-widest">Real-time Market Rates</p>
            </div>
          </div>
          <div className="bg-amber-500/10 p-6 rounded-3xl border border-amber-500/20 shadow-sm group hover:bg-amber-500/20 transition-colors">
            <Store className="text-amber-500 w-10 h-10 group-hover:scale-110 transition-transform" />
          </div>
        </div>

        <form onSubmit={handleSearch} className="space-y-8 mb-16">
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-3">
              <label className="text-xs font-bold text-stone-500 ml-4 uppercase tracking-widest">Crop Name</label>
              <div className="relative group">
                <input
                  placeholder="e.g. Wheat, Cotton"
                  value={crop}
                  onChange={(e) => setCrop(e.target.value)}
                  className="w-full bg-stone-800 border border-stone-700 p-6 rounded-3xl outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-500/5 font-medium text-white transition-all placeholder:text-stone-600"
                />
                <div className="absolute right-6 top-1/2 -translate-y-1/2 text-stone-600 group-focus-within:text-amber-500 transition-colors">
                   <Activity className="w-6 h-6" />
                </div>
              </div>
            </div>
            <div className="space-y-3">
              <label className="text-xs font-bold text-stone-500 ml-4 uppercase tracking-widest">Market Location</label>
              <div className="relative group">
                <input
                  placeholder="e.g. Nashik, Indore"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full bg-stone-800 border border-stone-700 p-6 pl-16 rounded-3xl outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-500/5 font-medium text-white transition-all placeholder:text-stone-600"
                />
                <MapPin className="absolute left-6 top-1/2 -translate-y-1/2 text-stone-600 group-focus-within:text-amber-500 transition-colors w-6 h-6" />
                <button 
                  type="button" 
                  onClick={detectLocation} 
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-stone-700 rounded-2xl shadow-sm text-stone-300 active:scale-90 transition-all border border-stone-600 hover:bg-amber-500 hover:text-black hover:border-amber-500"
                >
                   {detecting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Navigation className="w-5 h-5" />}
                </button>
              </div>
            </div>
          </div>
          <button 
            type="submit"
            disabled={loading || detecting}
            className="w-full bg-amber-600 text-black font-bold py-6 rounded-3xl shadow-lg shadow-amber-600/20 active:scale-[0.98] transition-all flex items-center justify-center gap-4 disabled:opacity-50 uppercase text-sm tracking-widest"
          >
            {loading ? <Loader2 className="animate-spin w-6 h-6" /> : <Zap className="w-6 h-6" />}
            Check Latest Rates
          </button>
        </form>

        {loading ? (
          <div className="py-32 flex flex-col items-center justify-center space-y-8 animate-in fade-in duration-700">
            <div className="relative">
                <div className="w-24 h-24 border-8 border-stone-800 border-t-amber-500 rounded-full animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                   <Landmark className="w-8 h-8 text-amber-500 animate-pulse" />
                </div>
            </div>
            <div className="text-center space-y-2">
              <p className="font-bold text-lg text-white">Fetching Market Data...</p>
              <p className="text-xs text-stone-500 font-medium uppercase tracking-widest">Connecting to Mandi servers</p>
            </div>
          </div>
        ) : results ? (
          <div className="space-y-12 animate-in slide-in-from-bottom-8 duration-1000 ease-out">
            {/* HERO PRICE CARD */}
            <div className="bg-black rounded-[3rem] p-10 md:p-16 text-white shadow-2xl border border-stone-800 relative overflow-hidden group">
               <div className="absolute top-0 right-0 p-12 opacity-5 rotate-12 scale-150 pointer-events-none">
                  <Landmark className="w-96 h-96 text-amber-500" />
               </div>
               
               <div className="relative z-10">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-8 mb-12">
                     <div className="flex items-center gap-6">
                        <div className="bg-amber-500/10 p-5 rounded-2xl border border-amber-500/20 shadow-sm">
                           <BadgeCheck className="w-8 h-8 text-amber-400" />
                        </div>
                        <div>
                           <p className="text-[10px] font-bold uppercase tracking-widest text-stone-500 mb-1">Verified Market</p>
                           <h3 className="text-3xl font-serif font-bold flex items-center gap-4 text-white">
                             {location} <ArrowUpRight className="w-6 h-6 text-amber-400" />
                           </h3>
                        </div>
                     </div>
                     <div className="flex flex-col items-end gap-3">
                        <div className="bg-amber-500/20 px-6 py-2 rounded-full border border-amber-500/30 flex items-center gap-3">
                           <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse" />
                           <span className="text-[10px] font-bold uppercase tracking-widest text-amber-400">Live Quote</span>
                        </div>
                        <button 
                          onClick={shareOnWhatsApp}
                          className="bg-[#25D366] text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-[#128C7E] transition-all"
                        >
                          <MessageCircle className="w-4 h-4" /> Share WhatsApp
                        </button>
                     </div>
                  </div>

                  <div className="flex flex-col gap-8">
                     <div className="flex items-baseline gap-4">
                        <span className="text-5xl font-serif font-bold text-amber-500">{results.data.currency || '₹'}</span>
                        <h1 className="text-7xl md:text-9xl font-serif font-bold tracking-tight text-white">
                          {results.data.currentPrice.toLocaleString()}
                        </h1>
                     </div>
                     
                     <div className="flex items-center gap-8">
                        <div className="bg-stone-900 px-8 py-4 rounded-2xl border border-stone-800 flex items-center gap-6">
                           <p className="text-[10px] font-bold uppercase tracking-widest text-stone-500">Per Unit</p>
                           <div className="h-6 w-px bg-stone-800"></div>
                           <p className="text-2xl font-bold uppercase tracking-tight text-white">{results.data.unit}</p>
                        </div>
                        
                        <div className="flex items-center gap-3 text-amber-400">
                           <TrendingUp className="w-8 h-8" />
                           <span className="text-2xl font-bold">+12.4%</span>
                        </div>
                     </div>
                  </div>
               </div>
            </div>

            <div className="grid grid-cols-1 gap-12">
              <TrendChart data={results.data.trend} />
              
              <div className="rounded-3xl p-10 border border-stone-800 shadow-sm bg-stone-900 relative overflow-hidden group">
                 <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4 text-white font-bold text-sm uppercase tracking-widest">
                       <div className="p-4 bg-stone-800 rounded-2xl border border-stone-700"><Info className="w-6 h-6 text-amber-500" /></div>
                       Market Analysis
                    </div>
                 </div>
                 <div className="prose prose-invert prose-stone max-w-none">
                    <div className="text-xl text-stone-300 leading-relaxed font-serif italic">
                      <ReactMarkdown>{results.data.summary}</ReactMarkdown>
                    </div>
                 </div>
              </div>
            </div>

            <div className="space-y-8">
               <h3 className="text-xs font-bold text-stone-500 uppercase tracking-widest flex items-center gap-4 ml-4">
                 <Globe className="w-5 h-5" /> Sources & Citations
               </h3>
               <div className="grid grid-cols-1 gap-4">
                  {results.sources.map((s, i) => s.web && (
                    <a key={i} href={s.web.uri} target="_blank" rel="noopener" className="p-6 bg-stone-900 border border-stone-800 rounded-3xl flex items-center justify-between group hover:border-amber-500/50 hover:bg-stone-800 transition-all">
                       <div className="flex flex-col truncate pr-8">
                          <span className="font-bold text-white text-lg truncate mb-2 group-hover:text-amber-500 transition-colors font-serif">{s.web.title}</span>
                          <div className="flex items-center gap-4">
                             <img src={`https://www.google.com/s2/favicons?domain=${new URL(s.web.uri).hostname}`} className="w-4 h-4 rounded-sm" alt="" />
                             <span className="text-[10px] font-medium text-stone-500 uppercase tracking-widest">{new URL(s.web.uri).hostname}</span>
                          </div>
                       </div>
                       <div className="p-4 bg-stone-800 rounded-xl group-hover:bg-amber-600 group-hover:text-black transition-all border border-stone-700 group-hover:border-transparent shadow-sm">
                        <ExternalLink className="w-5 h-5 text-stone-500 group-hover:text-black" />
                       </div>
                    </a>
                  ))}
               </div>
            </div>
          </div>
        ) : (
          <div className="py-40 text-center flex flex-col items-center animate-in fade-in duration-1000">
            <div className="p-16 bg-stone-800 rounded-[4rem] mb-12 shadow-sm relative group cursor-pointer hover:bg-stone-700 transition-all border border-stone-700">
              <Globe className="w-32 h-32 text-stone-600 group-hover:rotate-12 transition-transform duration-1000" />
              <div className="absolute -top-4 -right-4 bg-amber-600 p-6 rounded-3xl shadow-lg border-4 border-stone-900 animate-bounce">
                 <Search className="w-8 h-8 text-black" />
              </div>
            </div>
            <p className="font-serif font-bold text-2xl text-white leading-relaxed max-w-[400px]">
              Check the latest market rates for your crops
            </p>
            <p className="text-stone-500 text-xs font-medium mt-6 uppercase tracking-widest">Real-time price discovery for your region</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <section className="px-6 mt-20 mb-10 text-center">
        <div className="flex items-center justify-center gap-4 mb-4 opacity-20">
          <div className="h-px w-12 bg-stone-700" />
          <span className="text-[10px] font-medium text-stone-500 uppercase tracking-widest">End of Report</span>
          <div className="h-px w-12 bg-stone-700" />
        </div>
        <p className="text-[10px] font-medium text-stone-500 uppercase tracking-widest">
          © {new Date().getFullYear()} BHARAT KISAN SYSTEMS
        </p>
      </section>
    </div>
  );
};

export default MarketPrices;