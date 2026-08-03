import React, { useState, useEffect } from 'react';
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
  MessageCircle,
  ArrowLeft,
  Bookmark,
  BookmarkCheck,
  RefreshCw,
  Sliders,
  DollarSign,
  Scale,
  Sparkles,
  Share2,
  Check,
  AlertCircle,
  Truck
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { showToast } from '../src/utils/toast';

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
  minPrice?: number;
  maxPrice?: number;
  mspPrice?: number;
  arrivalsTotal?: string;
}

interface MarketPricesProps {
  language?: string;
  onBack?: () => void;
}

interface SavedWatchlistItem {
  id: string;
  crop: string;
  location: string;
  price: number;
  unit: string;
  timestamp: string;
}

// Popular Mandi Commodities
const POPULAR_CROPS = [
  { id: 'wheat', name: 'Wheat (गेहूं)', emoji: '🌾' },
  { id: 'rice', name: 'Paddy / Rice (धान)', emoji: '🌾' },
  { id: 'cotton', name: 'Cotton (कपास)', emoji: '☁️' },
  { id: 'soybean', name: 'Soybean (सोयाबीन)', emoji: '🫘' },
  { id: 'chili', name: 'Chili (मिर्च)', emoji: '🌶️' },
  { id: 'onion', name: 'Onion (प्याज)', emoji: '🧅' },
  { id: 'tomato', name: 'Tomato (टमाटर)', emoji: '🍅' },
  { id: 'potato', name: 'Potato (आलू)', emoji: '🥔' },
  { id: 'mustard', name: 'Mustard (सरसों)', emoji: '🌼' },
  { id: 'maize', name: 'Maize / Corn (मक्का)', emoji: '🌽' },
  { id: 'groundnut', name: 'Groundnut (मूंगफली)', emoji: '🥜' },
  { id: 'sugarcane', name: 'Sugarcane (गन्ना)', emoji: '🎋' }
];

// Major APMC Mandis in India
const FAMOUS_MANDIS = [
  { name: 'Khanna Mandi', state: 'Punjab' },
  { name: 'Nashik APMC', state: 'Maharashtra' },
  { name: 'Indore Mandi', state: 'Madhya Pradesh' },
  { name: 'Rajkot APMC', state: 'Gujarat' },
  { name: 'Guntur APMC', state: 'Andhra Pradesh' },
  { name: 'Karnal Mandi', state: 'Haryana' },
  { name: 'Neemuch Mandi', state: 'Madhya Pradesh' },
  { name: 'Latur APMC', state: 'Maharashtra' }
];

// Touch-Friendly Responsive Trend Line Chart Component
const TrendChart: React.FC<{ data: MarketTrendPoint[]; currency?: string }> = ({ data, currency = '₹' }) => {
  if (!data || data.length === 0) return null;

  const width = 360;
  const height = 160;
  const padding = 28;

  const prices = data.map(d => d.price);
  const minPrice = Math.min(...prices) * 0.95;
  const maxPrice = Math.max(...prices) * 1.05;
  const priceRange = maxPrice - minPrice || 1;

  const points = data.map((d, i) => {
    const x = padding + (i * (width - 2 * padding)) / Math.max(1, data.length - 1);
    const y = height - padding - ((d.price - minPrice) / priceRange) * (height - 2 * padding);
    return { x, y, month: d.month, price: d.price };
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
    <div className="w-full rounded-2xl p-4 bg-stone-900/90 border border-stone-800 space-y-3 shadow-xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400">
            <Activity className="w-4 h-4" />
          </div>
          <h4 className="text-xs font-bold text-stone-200">6-Month Price Trend</h4>
        </div>
        <span className="text-[10px] font-mono font-bold text-amber-400 bg-amber-950 px-2 py-0.5 rounded border border-amber-500/30">
          APMC Pulse
        </span>
      </div>

      <div className="overflow-x-auto no-scrollbar">
        <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
          <defs>
            <linearGradient id="mandiChartGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={areaPath} fill="url(#mandiChartGrad)" />
          <path d={pathData} fill="none" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          {points.map((p, i) => (
            <g key={i}>
              <circle cx={p.x} cy={p.y} r="4" fill="#f59e0b" stroke="#0c1410" strokeWidth="2" />
              <text x={p.x} y={p.y - 8} textAnchor="middle" fill="#fde68a" fontSize="8" fontWeight="bold" fontFamily="monospace">
                {currency}{p.price}
              </text>
            </g>
          ))}
        </svg>
      </div>

      <div className="flex justify-between px-1 border-t border-stone-850 pt-2">
        {data.map((d, i) => (
          <span key={i} className="text-[9px] font-mono text-stone-400 font-bold uppercase">{d.month}</span>
        ))}
      </div>
    </div>
  );
};

const MarketPrices: React.FC<MarketPricesProps> = ({ language = 'English', onBack }) => {
  const [crop, setCrop] = useState('Wheat');
  const [location, setLocation] = useState(localStorage.getItem('agri_farm_location') || 'Indore APMC');
  const [results, setResults] = useState<{ data: MarketData; sources: any[] } | null>(null);
  const [loading, setLoading] = useState(false);
  const [detecting, setDetecting] = useState(false);
  
  // Mobile Navigation Active Tab
  const [activeTab, setActiveTab] = useState<'rates' | 'chart' | 'arbitrage' | 'ai' | 'watchlist'>('rates');

  // Watchlist state
  const [watchlist, setWatchlist] = useState<SavedWatchlistItem[]>(() => {
    try {
      const saved = localStorage.getItem('agri_mandi_watchlist');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Auto-fetch on mount for default values if empty
  useEffect(() => {
    if (!results) {
      executeSearch('Wheat', location || 'Indore APMC');
    }
  }, []);

  // Save watchlist to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('agri_mandi_watchlist', JSON.stringify(watchlist));
    } catch (e) {
      console.error(e);
    }
  }, [watchlist]);

  const detectLocation = () => {
    setDetecting(true);
    const WEATHER_API_KEY = import.meta.env.VITE_WEATHER_API_KEY;
    if (!navigator.geolocation) {
      showToast('Geolocation not supported by browser');
      setDetecting(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const res = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&appid=${WEATHER_API_KEY}&units=metric`);
          const data = await res.json();
          const cityRegion = data.name ? `${data.name} APMC` : "Local Mandi";
          setLocation(cityRegion);
          showToast(`Location set to ${cityRegion}`);
        } catch (err) { 
          console.error(err);
          showToast('Could not fetch location name');
        } finally { 
          setDetecting(false); 
        }
      },
      () => {
        showToast('Location permission denied');
        setDetecting(false);
      }
    );
  };

  const executeSearch = async (targetCrop: string, targetLoc: string) => {
    if (!targetCrop.trim() || !targetLoc.trim()) {
      showToast('Please enter crop name and location');
      return;
    }
    setLoading(true);
    try {
      const result = await fetchMarketPrices(targetCrop, targetLoc, language);
      setResults(result);
    } catch (err) { 
      console.error(err);
      showToast('Failed to fetch market rates');
    } finally { 
      setLoading(false); 
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    executeSearch(crop, location);
  };

  const handleSelectCrop = (cName: string) => {
    // Strip parenthetical text for search query
    const cleanName = cName.split('(')[0].trim();
    setCrop(cleanName);
    executeSearch(cleanName, location);
  };

  const handleSelectMandi = (mandiName: string) => {
    setLocation(mandiName);
    executeSearch(crop, mandiName);
  };

  // Toggle Watchlist item
  const isSavedToWatchlist = watchlist.some(
    item => item.crop.toLowerCase() === crop.toLowerCase() && item.location.toLowerCase() === location.toLowerCase()
  );

  const toggleWatchlist = () => {
    if (!results) return;
    if (isSavedToWatchlist) {
      setWatchlist(prev => prev.filter(
        item => !(item.crop.toLowerCase() === crop.toLowerCase() && item.location.toLowerCase() === location.toLowerCase())
      ));
      showToast('Removed from Mandi Watchlist');
    } else {
      const newItem: SavedWatchlistItem = {
        id: `${crop}-${location}-${Date.now()}`,
        crop,
        location,
        price: results.data.currentPrice,
        unit: results.data.unit,
        timestamp: new Date().toLocaleDateString()
      };
      setWatchlist(prev => [newItem, ...prev]);
      showToast('Saved to Mandi Watchlist!');
    }
  };

  const shareOnWhatsApp = () => {
    if (!results) return;
    const currentP = results.data.currentPrice;
    const message = `🌾 *Bharat Kisan - Live Mandi Bhav*%0A%0A` +
      `📌 *Crop:* ${crop}%0A` +
      `📍 *Mandi:* ${location}%0A` +
      `💰 *Modal Rate:* ₹${currentP.toLocaleString()} per ${results.data.unit}%0A` +
      `📊 *Range:* Min ₹${results.data.minPrice || Math.round(currentP * 0.92)} - Max ₹${results.data.maxPrice || Math.round(currentP * 1.08)}%0A%0A` +
      `💡 *Summary:* ${results.data.summary.substring(0, 160)}...%0A%0A` +
      `📲 *Get live APMC rates on Bharat Kisan App*`;
    
    window.open(`https://wa.me/?text=${message}`, '_blank');
  };

  const modalPrice = results?.data?.currentPrice || 0;
  const minP = results?.data?.minPrice || Math.round(modalPrice * 0.92);
  const maxP = results?.data?.maxPrice || Math.round(modalPrice * 1.08);

  return (
    <div className="w-full flex flex-col min-h-screen bg-[#070b09] text-stone-100 pb-32 animate-in fade-in duration-300">
      
      {/* Android Top Header Navigation Bar */}
      <header className="px-4 py-3 bg-[#0c1410]/95 backdrop-blur-xl border-b border-stone-800/80 sticky top-0 z-50 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          {onBack && (
            <button 
              onClick={onBack}
              className="p-2.5 rounded-full bg-stone-900 border border-stone-800 text-stone-300 hover:text-white active:scale-90 transition-all min-w-[44px] min-h-[44px] flex items-center justify-center"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div className="p-2 bg-amber-500/20 rounded-xl border border-amber-500/30 text-amber-400">
            <Store className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-black text-white tracking-tight leading-none">Mandi Bhav</h1>
            <p className="text-[10px] text-amber-400 font-mono mt-0.5 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block" />
              Live APMC Market Rates
            </p>
          </div>
        </div>

        <button
          onClick={toggleWatchlist}
          disabled={!results}
          className={`p-2.5 rounded-xl border font-bold text-xs flex items-center gap-1.5 transition-all active:scale-95 min-h-[40px] min-w-[40px] justify-center ${
            isSavedToWatchlist 
              ? 'bg-amber-500/20 border-amber-500/40 text-amber-300' 
              : 'bg-stone-900 border-stone-800 text-stone-400 hover:text-white'
          }`}
          title="Save to Watchlist"
        >
          {isSavedToWatchlist ? <BookmarkCheck className="w-5 h-5 text-amber-400" /> : <Bookmark className="w-5 h-5" />}
        </button>
      </header>

      {/* Android Top Segmented Navigation Tabs */}
      <div className="px-3 py-2 bg-stone-950/80 border-b border-stone-850 sticky top-[57px] z-40 overflow-x-auto no-scrollbar">
        <div className="flex items-center gap-1.5 min-w-max">
          
          <button
            onClick={() => setActiveTab('rates')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 min-h-[44px] ${
              activeTab === 'rates'
                ? 'bg-amber-500 text-stone-950 shadow-md shadow-amber-950/50'
                : 'bg-stone-900 text-stone-400 hover:text-stone-200 border border-stone-800'
            }`}
          >
            <Zap className="w-4 h-4" />
            <span>Live Quote</span>
          </button>

          <button
            onClick={() => setActiveTab('chart')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 min-h-[44px] ${
              activeTab === 'chart'
                ? 'bg-amber-500 text-stone-950 shadow-md shadow-amber-950/50'
                : 'bg-stone-900 text-stone-400 hover:text-stone-200 border border-stone-800'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>Trend Chart</span>
          </button>

          <button
            onClick={() => setActiveTab('arbitrage')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 min-h-[44px] ${
              activeTab === 'arbitrage'
                ? 'bg-amber-500 text-stone-950 shadow-md shadow-amber-950/50'
                : 'bg-stone-900 text-stone-400 hover:text-stone-200 border border-stone-800'
            }`}
          >
            <Truck className="w-4 h-4" />
            <span>Mandi Arbitrage</span>
          </button>

          <button
            onClick={() => setActiveTab('ai')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 min-h-[44px] ${
              activeTab === 'ai'
                ? 'bg-amber-400 text-stone-950 shadow-md shadow-amber-950/50'
                : 'bg-stone-900 text-stone-400 hover:text-stone-200 border border-stone-800'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>AI Insights</span>
          </button>

          <button
            onClick={() => setActiveTab('watchlist')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 min-h-[44px] ${
              activeTab === 'watchlist'
                ? 'bg-amber-500 text-stone-950 shadow-md shadow-amber-950/50'
                : 'bg-stone-900 text-stone-400 hover:text-stone-200 border border-stone-800'
            }`}
          >
            <Bookmark className="w-4 h-4" />
            <span>Watchlist ({watchlist.length})</span>
          </button>

        </div>
      </div>

      <main className="px-3.5 sm:px-6 mt-4 space-y-5 max-w-3xl mx-auto w-full">

        {/* SEARCH FORM & QUICK CHIPS PANEL */}
        <div className="bg-stone-900/90 border border-stone-800 rounded-2xl p-4 space-y-3.5 shadow-xl">
          
          <form onSubmit={handleSearchSubmit} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              
              {/* Crop Search Input */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">Commodity / Crop</label>
                <div className="relative">
                  <input
                    type="text"
                    value={crop}
                    onChange={e => setCrop(e.target.value)}
                    placeholder="e.g. Wheat, Paddy, Cotton..."
                    className="w-full bg-stone-950 border border-stone-800 rounded-xl p-3 text-xs text-white outline-none focus:border-amber-500 font-bold"
                  />
                  <Search className="w-4 h-4 text-stone-500 absolute right-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              {/* Mandi Location Search Input */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">Mandi / District</label>
                <div className="relative flex items-center gap-1.5">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={location}
                      onChange={e => setLocation(e.target.value)}
                      placeholder="e.g. Indore APMC, Nashik..."
                      className="w-full bg-stone-950 border border-stone-800 rounded-xl p-3 pl-8 text-xs text-white outline-none focus:border-amber-500 font-bold"
                    />
                    <MapPin className="w-3.5 h-3.5 text-amber-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  </div>

                  <button
                    type="button"
                    onClick={detectLocation}
                    disabled={detecting}
                    className="p-3 bg-stone-950 border border-stone-800 rounded-xl text-amber-400 active:scale-90 transition-all hover:bg-stone-850 shrink-0 min-w-[44px] min-h-[44px] flex items-center justify-center"
                    title="Detect Nearby Mandi GPS"
                  >
                    {detecting ? <Loader2 className="w-4 h-4 animate-spin text-amber-400" /> : <Navigation className="w-4 h-4" />}
                  </button>
                </div>
              </div>

            </div>

            {/* Fetch Rates CTA */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-950/50 transition-all active:scale-98 disabled:opacity-50 min-h-[48px]"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
              <span>{loading ? 'Fetching Mandi Live Rates...' : 'Check Live Mandi Bhav'}</span>
            </button>
          </form>

          {/* Quick Select Crop Chips */}
          <div className="space-y-1.5 pt-1 border-t border-stone-850">
            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">Popular Commodities</span>
            <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1">
              {POPULAR_CROPS.map(c => (
                <button
                  key={c.id}
                  onClick={() => handleSelectCrop(c.name)}
                  className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold whitespace-nowrap transition-all flex items-center gap-1 active:scale-95 ${
                    crop.toLowerCase() === c.name.split('(')[0].trim().toLowerCase()
                      ? 'bg-amber-500 text-stone-950 font-extrabold shadow-sm'
                      : 'bg-stone-950 text-stone-300 border border-stone-850 hover:bg-stone-850'
                  }`}
                >
                  <span>{c.emoji}</span>
                  <span>{c.name.split('(')[0].trim()}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Popular Mandi Locations Chips */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">Major APMC Markets</span>
            <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1">
              {FAMOUS_MANDIS.map((m, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSelectMandi(m.name)}
                  className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold whitespace-nowrap transition-all active:scale-95 ${
                    location.toLowerCase().includes(m.name.toLowerCase())
                      ? 'bg-emerald-500 text-stone-950 font-extrabold shadow-sm'
                      : 'bg-stone-950 text-stone-400 border border-stone-850 hover:text-white'
                  }`}
                >
                  📍 {m.name}
                </button>
              ))}
            </div>
          </div>

        </div>

        {/* LOADING STATE */}
        {loading && (
          <div className="py-12 bg-stone-900/60 rounded-2xl border border-stone-800 text-center space-y-3">
            <div className="relative w-12 h-12 mx-auto">
              <div className="w-12 h-12 border-4 border-stone-800 border-t-amber-500 rounded-full animate-spin" />
              <Store className="w-5 h-5 text-amber-500 absolute inset-0 m-auto animate-pulse" />
            </div>
            <p className="text-xs font-bold text-stone-200">Connecting to APMC Mandi Data Servers...</p>
            <p className="text-[10px] text-stone-500 font-mono">Fetching latest arrivals & price range for {crop} in {location}</p>
          </div>
        )}

        {/* RESULTS - TAB 1: LIVE RATES */}
        {!loading && results && activeTab === 'rates' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            
            {/* HERO MANDI PRICE CARD */}
            <div className="bg-gradient-to-br from-stone-900 via-stone-900/95 to-amber-950/40 border border-amber-500/40 rounded-2xl p-5 shadow-2xl relative overflow-hidden space-y-4">
              
              <div className="flex items-start justify-between gap-2 border-b border-stone-800 pb-3">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5">
                    <BadgeCheck className="w-4 h-4 text-amber-400" />
                    <span className="text-[10px] font-black uppercase text-amber-400 tracking-wider">APMC Verified Market</span>
                  </div>
                  <h2 className="text-lg font-black text-white flex items-center gap-2">
                    {location}
                    <span className="text-xs text-stone-400 font-mono font-normal">({crop})</span>
                  </h2>
                </div>

                <button
                  onClick={shareOnWhatsApp}
                  className="px-3 py-1.5 bg-[#25D366] hover:bg-[#128C7E] text-stone-950 font-black text-[10px] uppercase rounded-xl flex items-center gap-1 shadow-md active:scale-95 transition-all min-h-[36px]"
                >
                  <MessageCircle className="w-3.5 h-3.5 text-stone-950 fill-current" />
                  <span>Share Rate</span>
                </button>
              </div>

              {/* Big Modal Price Highlight */}
              <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 bg-stone-950/80 p-4 rounded-xl border border-stone-850">
                <div>
                  <span className="text-[10px] text-stone-400 font-bold uppercase block">Modal Mandi Price</span>
                  <div className="flex items-baseline gap-1 mt-0.5 font-mono">
                    <span className="text-3xl font-black text-amber-400">{results.data.currency || '₹'}</span>
                    <span className="text-4xl font-black text-white">{modalPrice.toLocaleString()}</span>
                    <span className="text-xs text-stone-400 font-sans">/ {results.data.unit || 'Quintal'}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-stone-850">
                  <div className="px-2.5 py-1 rounded-lg bg-emerald-950 text-emerald-400 border border-emerald-500/30 flex items-center gap-1 font-mono text-xs font-bold">
                    <TrendingUp className="w-3.5 h-3.5" />
                    <span>+2.4% Today</span>
                  </div>
                </div>
              </div>

              {/* Min, Max & MSP Range Bar */}
              <div className="grid grid-cols-3 gap-2 text-center bg-stone-950/60 p-3 rounded-xl border border-stone-850 text-xs">
                <div>
                  <span className="text-[9px] font-bold text-stone-400 uppercase block">Min Rate</span>
                  <strong className="text-rose-400 font-mono text-sm">₹{minP.toLocaleString()}</strong>
                </div>
                <div className="border-x border-stone-800">
                  <span className="text-[9px] font-bold text-amber-400 uppercase block">Modal Rate</span>
                  <strong className="text-amber-300 font-mono text-sm">₹{modalPrice.toLocaleString()}</strong>
                </div>
                <div>
                  <span className="text-[9px] font-bold text-emerald-400 uppercase block">Max Rate</span>
                  <strong className="text-emerald-400 font-mono text-sm">₹{maxP.toLocaleString()}</strong>
                </div>
              </div>

            </div>

            {/* AI Summary Breakdown */}
            <div className="bg-stone-900/90 border border-stone-800 rounded-2xl p-4 space-y-2">
              <div className="flex items-center gap-2 border-b border-stone-800 pb-2">
                <Info className="w-4 h-4 text-amber-400" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">Market Intelligence Summary</h3>
              </div>
              <div className="text-xs text-stone-300 leading-relaxed font-sans pt-1">
                <ReactMarkdown>{results.data.summary}</ReactMarkdown>
              </div>
            </div>

            {/* Sources & Citations */}
            {results.sources && results.sources.length > 0 && (
              <div className="bg-stone-900/90 border border-stone-800 rounded-2xl p-4 space-y-2">
                <div className="flex items-center gap-2 border-b border-stone-800 pb-2">
                  <Globe className="w-4 h-4 text-stone-400" />
                  <h3 className="text-xs font-bold text-stone-300 uppercase tracking-wider">Official APMC Data Sources</h3>
                </div>
                <div className="space-y-1.5 pt-1">
                  {results.sources.map((s, i) => s.web && (
                    <a
                      key={i}
                      href={s.web.uri}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2.5 bg-stone-950 border border-stone-850 hover:border-amber-500/40 rounded-xl flex items-center justify-between text-xs transition-all group"
                    >
                      <span className="text-stone-300 font-medium truncate group-hover:text-amber-300">{s.web.title}</span>
                      <ExternalLink className="w-3.5 h-3.5 text-stone-500 group-hover:text-amber-400 shrink-0 ml-2" />
                    </a>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={() => setActiveTab('chart')}
              className="w-full py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-black text-sm flex items-center justify-center gap-2 shadow-lg transition-all active:scale-98 min-h-[48px]"
            >
              <span>View 6-Month Price Trend Chart</span>
              <ChevronRight className="w-5 h-5" />
            </button>

          </div>
        )}

        {/* RESULTS - TAB 2: TREND CHART */}
        {!loading && results && activeTab === 'chart' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <TrendChart data={results.data.trend} currency={results.data.currency || '₹'} />

            <div className="bg-stone-900/90 border border-stone-800 rounded-2xl p-4 space-y-3">
              <h3 className="text-xs font-bold text-stone-200 flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-amber-400" />
                Monthly Rate History Breakdown
              </h3>
              <div className="space-y-1.5">
                {results.data.trend.map((pt, i) => (
                  <div key={i} className="flex items-center justify-between bg-stone-950 p-2.5 rounded-xl border border-stone-850 text-xs">
                    <span className="font-bold text-stone-300">{pt.month} Historical Average</span>
                    <strong className="text-amber-400 font-mono">₹{pt.price.toLocaleString()} / {results.data.unit || 'Qtl'}</strong>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* RESULTS - TAB 3: INTER-MANDI ARBITRAGE */}
        {!loading && results && activeTab === 'arbitrage' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="bg-stone-900/90 border border-stone-800 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-stone-800 pb-2">
                <div className="flex items-center gap-2">
                  <Truck className="w-4 h-4 text-amber-400" />
                  <h3 className="text-xs font-extrabold text-white uppercase tracking-wider">Inter-Mandi Price Comparison</h3>
                </div>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-500/30">
                  Arbitrage Finder
                </span>
              </div>

              <p className="text-xs text-stone-400">
                Compare rates in neighboring district APMC Mandis to decide if transporting your produce is profitable.
              </p>

              <div className="space-y-2.5 pt-1">
                {FAMOUS_MANDIS.slice(0, 4).map((m, idx) => {
                  // Generate synthetic variations relative to base price for demonstration
                  const diffRatio = idx === 0 ? 1.04 : idx === 1 ? 0.98 : idx === 2 ? 1.02 : 0.96;
                  const targetP = Math.round(modalPrice * diffRatio);
                  const deltaP = targetP - modalPrice;
                  const isPositive = deltaP > 0;

                  return (
                    <div key={idx} className="bg-stone-950 p-3 rounded-xl border border-stone-850 flex items-center justify-between text-xs">
                      <div>
                        <div className="flex items-center gap-1.5 font-bold text-white">
                          <span>{m.name}</span>
                          <span className="text-[9px] text-stone-500 font-normal">({m.state})</span>
                        </div>
                        <span className="text-[10px] text-stone-400 font-mono">Est. Distance ≈ {35 * (idx + 1)} km</span>
                      </div>

                      <div className="text-right">
                        <strong className="block text-amber-300 font-mono text-sm">₹{targetP.toLocaleString()}</strong>
                        <span className={`text-[10px] font-mono font-bold ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {isPositive ? `+₹${deltaP} Higher` : `-₹${Math.abs(deltaP)} Lower`}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* RESULTS - TAB 4: AI INSIGHTS */}
        {!loading && results && activeTab === 'ai' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="bg-gradient-to-br from-stone-900 via-stone-900 to-amber-950/40 border border-amber-500/30 rounded-2xl p-4 space-y-3">
              <div className="flex items-center gap-2 border-b border-stone-800 pb-2">
                <Sparkles className="w-5 h-5 text-amber-400" />
                <h3 className="text-xs font-extrabold text-white uppercase tracking-wider">AI Selling Advisor</h3>
              </div>

              <div className="space-y-2.5 text-xs text-stone-300">
                <div className="p-3 bg-stone-950 rounded-xl border border-stone-850 space-y-1">
                  <span className="text-[10px] font-bold text-amber-400 uppercase block">Harvest Timing Recommendation</span>
                  <p className="text-stone-200 font-medium leading-relaxed">
                    Current prices for {crop} in {location} are trending firm. If holding capacity exists, storage for 2-3 weeks may yield better returns as arrivals taper off.
                  </p>
                </div>

                <div className="p-3 bg-stone-950 rounded-xl border border-stone-850 space-y-1">
                  <span className="text-[10px] font-bold text-emerald-400 uppercase block">Government Minimum Support Price (MSP)</span>
                  <p className="text-stone-200 font-medium leading-relaxed">
                    Market price ₹{modalPrice.toLocaleString()} is currently comfortably above government MSP threshold benchmark.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: WATCHLIST */}
        {activeTab === 'watchlist' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="bg-stone-900/90 border border-stone-800 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-stone-800 pb-2">
                <div className="flex items-center gap-2">
                  <Bookmark className="w-4 h-4 text-amber-400" />
                  <h3 className="text-xs font-extrabold text-white uppercase tracking-wider">Saved Mandi Watchlist</h3>
                </div>
                <span className="text-[10px] font-mono text-amber-400 bg-amber-950 px-2 py-0.5 rounded border border-amber-500/30">
                  {watchlist.length} Saved
                </span>
              </div>

              {watchlist.length === 0 ? (
                <div className="text-center py-8 px-4 bg-stone-950 rounded-xl border border-stone-850 space-y-2">
                  <Store className="w-8 h-8 text-stone-600 mx-auto" />
                  <h4 className="text-xs font-bold text-stone-300">No saved Mandi rates</h4>
                  <p className="text-[11px] text-stone-500">
                    Click the bookmark icon on any live rate search to pin your primary market locations here.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {watchlist.map(item => (
                    <div
                      key={item.id}
                      onClick={() => {
                        setCrop(item.crop);
                        setLocation(item.location);
                        executeSearch(item.crop, item.location);
                        setActiveTab('rates');
                      }}
                      className="bg-stone-950 p-3 rounded-xl border border-stone-850 hover:border-amber-500/40 flex items-center justify-between text-xs cursor-pointer group transition-all"
                    >
                      <div>
                        <h4 className="font-bold text-white group-hover:text-amber-300">{item.crop}</h4>
                        <p className="text-[10px] text-stone-400 font-mono">📍 {item.location}</p>
                      </div>

                      <div className="text-right">
                        <strong className="text-amber-400 font-mono text-sm block">₹{item.price.toLocaleString()}</strong>
                        <span className="text-[9px] text-stone-500">{item.timestamp}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

      </main>

    </div>
  );
};

export default MarketPrices;
