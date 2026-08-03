import React, { useState, useEffect, useRef, useMemo } from 'react';
import { fetchInputPriceAdvisory } from '../services/geminiService';
import { 
  Tag, 
  Search, 
  Loader2, 
  Globe, 
  MapPin, 
  Navigation, 
  Sparkles, 
  ChevronRight, 
  Info,
  BadgePercent,
  ShoppingCart,
  Zap,
  CheckCircle2,
  Plus,
  X,
  Store,
  Phone,
  Package,
  Satellite,
  Layers,
  ArrowDownUp,
  Maximize2,
  Minimize2,
  Navigation2,
  Radar,
  ArrowRight,
  ArrowLeft,
  Filter,
  Check,
  Compass,
  Building2,
  Share2
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import L from 'leaflet';
import { showToast } from '../src/utils/toast';

const WEATHER_API_KEY = import.meta.env.VITE_WEATHER_API_KEY;

const INPUT_SUGGESTIONS = [
  { name: 'DAP Fertilizer', emoji: '🧪' },
  { name: 'Urea', emoji: '🌾' },
  { name: 'Paddy Seeds', emoji: '🌱' },
  { name: 'Tractor Rental', emoji: '🚜' },
  { name: 'Neem Pesticide', emoji: '🛡️' },
  { name: 'Solar Pump', emoji: '☀️' }
];

interface DealerInfo {
  title: string;
  uri: string;
  isMap: boolean;
  distance?: number;
  distanceText?: string;
  types: string[];
}

interface InputAdvisorProps {
  language?: string;
  onBack?: () => void;
}

const InputAdvisor: React.FC<InputAdvisorProps> = ({ language = 'English', onBack }) => {
  const [location, setLocation] = useState(localStorage.getItem('agri_farm_location') || '');
  const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [inputs, setInputs] = useState<string[]>(['DAP Fertilizer', 'Urea']);
  const [inputValue, setInputValue] = useState('');
  const [results, setResults] = useState<{ text?: string; sources: any[] } | null>(null);
  const [loading, setLoading] = useState(false);
  const [detecting, setDetecting] = useState(false);
  const [isSatellite, setIsSatellite] = useState(true);
  const [sortByDistance, setSortByDistance] = useState(false);
  const [processedDealers, setProcessedDealers] = useState<DealerInfo[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<string>('All');
  const [isMapExpanded, setIsMapExpanded] = useState(false);
  
  // Mobile Tab navigation
  const [activeTab, setActiveTab] = useState<'search' | 'map' | 'dealers' | 'brief'>('search');

  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);

  const toggleMapMode = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!tileLayerRef.current) return;
    const newMode = !isSatellite;
    setIsSatellite(newMode);
    tileLayerRef.current.setUrl(newMode 
      ? 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}' 
      : 'https://{s}.basemaps.cartocdn.com/voyager/{z}/{x}/{y}{r}.png'
    );
  };

  const detectLocation = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setDetecting(true);
    if (!navigator.geolocation) {
      showToast('Geolocation not supported by browser');
      setDetecting(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const res = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&appid=${WEATHER_API_KEY}&units=metric`);
          if (!res.ok) throw new Error(`Weather API error: ${res.status}`);
          const data = await res.json();
          const cityRegion = data.name || "My Region";
          setLocation(cityRegion);
          setCoords({ lat: pos.coords.latitude, lon: pos.coords.longitude });
          if (mapRef.current) {
            mapRef.current.setView([pos.coords.latitude, pos.coords.longitude], 13);
          }
          showToast(`GPS Position Locked: ${cityRegion}`);
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

  const parseDistances = (text: string, sources: any[]) => {
    const dealers: DealerInfo[] = [];
    
    const inferTypes = (title: string): string[] => {
      const types: string[] = [];
      const lowerTitle = title.toLowerCase();
      if (lowerTitle.includes('seed')) types.push('Seeds');
      if (lowerTitle.includes('fertilizer') || lowerTitle.includes('urea') || lowerTitle.includes('dap')) types.push('Fertilizers');
      if (lowerTitle.includes('pesticide') || lowerTitle.includes('insecticide') || lowerTitle.includes('fungicide') || lowerTitle.includes('neem')) types.push('Pesticides');
      if (lowerTitle.includes('tool') || lowerTitle.includes('machinery') || lowerTitle.includes('tractor') || lowerTitle.includes('pump') || lowerTitle.includes('rental')) types.push('Tools');
      
      if (types.length === 0) types.push('General');
      return types;
    };

    sources.forEach(src => {
      if (!src.web && !src.maps) return;
      
      const title = src.web?.title || src.maps?.title;
      const uri = src.web?.uri || src.maps?.uri;
      const isMap = !!src.maps;

      let distanceValue: number | undefined = undefined;
      let distanceStr: string | undefined = undefined;

      if (text && title) {
        const safeTitle = title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`${safeTitle}[\\s\\S]{0,200}Distance:\\s*(\\d*\\.?\\d+)\\s*km`, 'i');
        const match = text.match(regex);
        
        if (match && match[1]) {
          distanceValue = parseFloat(match[1]);
          distanceStr = `${match[1]} km`;
        }
      }

      dealers.push({
        title,
        uri,
        isMap,
        distance: distanceValue,
        distanceText: distanceStr,
        types: inferTypes(title || '')
      });
    });

    return dealers;
  };

  const handleSearch = async () => {
    if (inputs.length === 0 || !location.trim()) {
      showToast('Please add items and enter target location');
      return;
    }
    setLoading(true);
    setProcessedDealers([]);
    try {
      const data = await fetchInputPriceAdvisory(location, inputs, language, coords || undefined);
      setResults(data);
      
      const parsed = parseDistances(data.text || '', data.sources);
      setProcessedDealers(parsed);
      
      updateMapMarkers(data.sources);
      setActiveTab('dealers');
    } catch (err) {
      console.error(err);
      showToast('Failed to scan local supply grid');
    } finally {
      setLoading(false);
    }
  };

  const updateMapMarkers = (sources: any[]) => {
    if (!mapRef.current || !markersLayerRef.current) return;
    markersLayerRef.current.clearLayers();

    if (coords) {
      const farmIcon = L.divIcon({
        html: `<div class="bg-stone-900 p-2 rounded-full shadow-[0_0_20px_rgba(16,185,129,0.5)] border-2 border-emerald-400 text-white animate-pulse"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9 12 2l9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg></div>`,
        className: 'custom-farm-icon',
        iconSize: [36, 36],
        iconAnchor: [18, 18]
      });
      L.marker([coords.lat, coords.lon], { icon: farmIcon })
        .addTo(markersLayerRef.current)
        .bindPopup(`<b>Primary Farm Hub</b><br/>Syncing satellite dealer data.`);
    }
  };

  const initMap = () => {
    if (mapRef.current || !mapContainerRef.current) return;
    const initialLat = coords?.lat || 20.5937;
    const initialLon = coords?.lon || 78.9629;
    const map = L.map(mapContainerRef.current, { zoomControl: false, attributionControl: false }).setView([initialLat, initialLon], 12);
    
    const tiles = L.tileLayer(isSatellite 
      ? 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}' 
      : 'https://{s}.basemaps.cartocdn.com/voyager/{z}/{x}/{y}{r}.png', 
      { maxZoom: 19 }
    ).addTo(map);
    
    tileLayerRef.current = tiles;
    markersLayerRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;
  };

  useEffect(() => {
    initMap();
    detectLocation();
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (mapRef.current) {
      setTimeout(() => mapRef.current?.invalidateSize(), 200);
    }
  }, [isMapExpanded, activeTab]);

  const addInput = (val: string) => {
    if (!val.trim() || inputs.includes(val.trim())) return;
    setInputs([...inputs, val.trim()]);
    setInputValue('');
  };

  const removeInput = (val: string) => {
    setInputs(inputs.filter(i => i !== val));
  };

  const displayedDealers = useMemo(() => {
    let filtered = processedDealers;
    if (selectedFilter !== 'All') {
      filtered = processedDealers.filter(d => d.types.includes(selectedFilter));
    }

    if (!sortByDistance) return filtered;
    return [...filtered].sort((a, b) => {
      const distA = a.distance ?? Infinity;
      const distB = b.distance ?? Infinity;
      return distA - distB;
    });
  }, [processedDealers, sortByDistance, selectedFilter]);

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
          <div className="p-2 bg-emerald-500/20 rounded-xl border border-emerald-500/30 text-emerald-400">
            <Satellite className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-black text-white tracking-tight leading-none">Supply Intel</h1>
            <p className="text-[10px] text-emerald-400 font-mono mt-0.5 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block" />
              Satellite Grounding Engine
            </p>
          </div>
        </div>

        <button
          onClick={detectLocation}
          disabled={detecting}
          className="p-2.5 rounded-xl bg-stone-900 border border-stone-800 text-emerald-400 hover:text-white active:scale-90 transition-all min-w-[44px] min-h-[44px] flex items-center justify-center"
          title="Detect GPS"
        >
          {detecting ? <Loader2 className="w-4 h-4 animate-spin text-emerald-400" /> : <Navigation className="w-4 h-4" />}
        </button>
      </header>

      {/* Android Top Segmented Navigation Tabs */}
      <div className="px-3 py-2 bg-stone-950/80 border-b border-stone-850 sticky top-[57px] z-40 overflow-x-auto no-scrollbar">
        <div className="flex items-center gap-1.5 min-w-max">
          
          <button
            onClick={() => setActiveTab('search')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 min-h-[44px] ${
              activeTab === 'search'
                ? 'bg-emerald-500 text-stone-950 shadow-md shadow-emerald-950/50'
                : 'bg-stone-900 text-stone-400 hover:text-stone-200 border border-stone-800'
            }`}
          >
            <Radar className="w-4 h-4" />
            <span>Search & Radar</span>
          </button>

          <button
            onClick={() => setActiveTab('map')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 min-h-[44px] ${
              activeTab === 'map'
                ? 'bg-emerald-500 text-stone-950 shadow-md shadow-emerald-950/50'
                : 'bg-stone-900 text-stone-400 hover:text-stone-200 border border-stone-800'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Satellite Map</span>
          </button>

          <button
            onClick={() => setActiveTab('dealers')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 min-h-[44px] ${
              activeTab === 'dealers'
                ? 'bg-emerald-500 text-stone-950 shadow-md shadow-emerald-950/50'
                : 'bg-stone-900 text-stone-400 hover:text-stone-200 border border-stone-800'
            }`}
          >
            <Store className="w-4 h-4" />
            <span>Verified Dealers ({processedDealers.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('brief')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 min-h-[44px] ${
              activeTab === 'brief'
                ? 'bg-emerald-400 text-stone-950 shadow-md shadow-emerald-950/50'
                : 'bg-stone-900 text-stone-400 hover:text-stone-200 border border-stone-800'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Supply Brief</span>
          </button>

        </div>
      </div>

      <main className="px-3.5 sm:px-6 mt-4 space-y-5 max-w-3xl mx-auto w-full">

        {/* TAB 1: SEARCH & INPUT CONTROLS */}
        {activeTab === 'search' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            
            <div className="bg-stone-900/90 border border-stone-800 rounded-2xl p-4 space-y-4 shadow-xl">
              
              <div className="flex items-center justify-between border-b border-stone-800 pb-2.5">
                <div className="flex items-center gap-2">
                  <Compass className="w-4 h-4 text-emerald-400" />
                  <h2 className="text-xs font-black uppercase tracking-wider text-white">Spatial Inventory Scanner</h2>
                </div>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-500/30">
                  {location || 'GPS Triangulating'}
                </span>
              </div>

              {/* Target Cluster Location Input */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">Target Cluster / District</label>
                <div className="relative flex items-center gap-1.5">
                  <div className="relative flex-1">
                    <input 
                      type="text"
                      placeholder="e.g. Indore APMC, Nashik, Guntur..." 
                      value={location}
                      onChange={e => setLocation(e.target.value)}
                      className="w-full bg-stone-950 border border-stone-800 rounded-xl p-3 pl-8 text-xs text-white outline-none focus:border-emerald-500 font-bold"
                    />
                    <MapPin className="w-3.5 h-3.5 text-emerald-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  </div>

                  <button
                    type="button"
                    onClick={detectLocation}
                    disabled={detecting}
                    className="p-3 bg-stone-950 border border-stone-800 rounded-xl text-emerald-400 active:scale-90 transition-all hover:bg-stone-850 shrink-0 min-w-[44px] min-h-[44px] flex items-center justify-center"
                    title="Detect GPS"
                  >
                    {detecting ? <Loader2 className="w-4 h-4 animate-spin text-emerald-400" /> : <Navigation className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Inventory Search Input */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">Add Required Farming Inputs</label>
                <div className="relative flex items-center gap-1.5">
                  <div className="relative flex-1">
                    <input 
                      type="text"
                      placeholder="e.g. Liquid Urea, Pesticides, DAP..." 
                      value={inputValue}
                      onChange={e => setInputValue(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && addInput(inputValue)}
                      className="w-full bg-stone-950 border border-stone-800 rounded-xl p-3 pl-8 text-xs text-white outline-none focus:border-emerald-500 font-bold"
                    />
                    <Tag className="w-3.5 h-3.5 text-stone-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  </div>

                  <button
                    type="button"
                    onClick={() => addInput(inputValue)}
                    className="p-3 bg-emerald-500 text-stone-950 rounded-xl font-bold active:scale-90 transition-all hover:bg-emerald-400 shrink-0 min-w-[44px] min-h-[44px] flex items-center justify-center"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Active Selected Tags */}
              {inputs.length > 0 && (
                <div className="space-y-1.5 pt-1 border-t border-stone-850">
                  <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">Selected Items ({inputs.length})</span>
                  <div className="flex flex-wrap gap-1.5">
                    {inputs.map(i => (
                      <span key={i} className="bg-emerald-950 text-emerald-300 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 border border-emerald-500/30">
                        <span>{i}</span>
                        <X 
                          className="w-3.5 h-3.5 cursor-pointer text-emerald-400 hover:text-rose-400 transition-colors" 
                          onClick={() => removeInput(i)} 
                        />
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Quick Suggestion Chips */}
              <div className="space-y-1.5 pt-1 border-t border-stone-850">
                <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">Popular Input Suggestions</span>
                <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1">
                  {INPUT_SUGGESTIONS.map(s => (
                    <button
                      key={s.name}
                      onClick={() => addInput(s.name)}
                      className="px-2.5 py-1.5 bg-stone-950 text-stone-300 border border-stone-800 hover:border-emerald-500/40 rounded-lg text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1 active:scale-95"
                    >
                      <span>{s.emoji}</span>
                      <span>+ {s.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Scan CTA Button */}
              <button
                onClick={handleSearch}
                disabled={loading || inputs.length === 0 || !location.trim()}
                className="w-full py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/50 transition-all active:scale-98 disabled:opacity-50 min-h-[48px]"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Radar className="w-4 h-4 text-stone-950" />}
                <span>{loading ? 'Scanning Local Supply Grid...' : 'Scan Local Dealer Network'}</span>
              </button>

            </div>

            {/* Quick Map Preview Teaser Card */}
            <div 
              onClick={() => setActiveTab('map')}
              className="bg-stone-900/90 border border-stone-800 hover:border-emerald-500/40 rounded-2xl p-4 flex items-center justify-between cursor-pointer group transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-emerald-950 text-emerald-400 border border-emerald-500/30">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-white group-hover:text-emerald-300">Satellite Spatial Grounding Map</h3>
                  <p className="text-[10px] text-stone-400 font-mono">View dealer pins & terrain context</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-stone-500 group-hover:text-emerald-400 group-hover:translate-x-1 transition-all" />
            </div>

          </div>
        )}

        {/* TAB 2: SATELLITE MAP */}
        {(activeTab === 'map' || activeTab === 'search') && (
          <div className={`${activeTab !== 'map' ? 'hidden' : 'block'} space-y-4 animate-in fade-in duration-200`}>
            
            <div className={`transition-all duration-300 relative rounded-2xl overflow-hidden border border-stone-800 shadow-2xl ${isMapExpanded ? 'h-[460px]' : 'h-[280px]'}`}>
              <div ref={mapContainerRef} className="w-full h-full bg-stone-950 z-0" />

              {/* Floating Map Controls */}
              <div className="absolute top-3 right-3 z-[1000] flex flex-col gap-2">
                <button 
                  onClick={toggleMapMode}
                  className="p-2.5 bg-stone-900/90 backdrop-blur-md rounded-xl border border-stone-700 text-stone-200 active:scale-90 transition-all min-w-[40px] min-h-[40px] flex items-center justify-center"
                  title="Toggle Satellite Imagery"
                >
                  {isSatellite ? <Layers className="w-4 h-4 text-emerald-400" /> : <Satellite className="w-4 h-4 text-emerald-400" />}
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); setIsMapExpanded(!isMapExpanded); }}
                  className="p-2.5 bg-stone-900/90 backdrop-blur-md rounded-xl border border-stone-700 text-stone-200 active:scale-90 transition-all min-w-[40px] min-h-[40px] flex items-center justify-center"
                >
                  {isMapExpanded ? <Minimize2 className="w-4 h-4 text-emerald-400" /> : <Maximize2 className="w-4 h-4 text-emerald-400" />}
                </button>
              </div>

              {/* Location Badge */}
              <div className="absolute top-3 left-3 z-[1000]">
                <div className="bg-stone-900/90 backdrop-blur-md text-white px-3 py-1.5 rounded-xl flex items-center gap-2 border border-stone-700 shadow-lg">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-[10px] font-bold font-mono text-emerald-300">{location || 'Grounded GPS'}</span>
                </div>
              </div>

              {!coords && (
                <div className="absolute inset-0 bg-stone-950/70 backdrop-blur-sm flex items-center justify-center z-[1000] p-4">
                  <button 
                    onClick={() => detectLocation()} 
                    className="flex items-center gap-2 bg-emerald-500 text-stone-950 px-5 py-3 rounded-xl font-black text-xs uppercase tracking-wider active:scale-95 transition-all shadow-xl min-h-[44px]"
                  >
                    <Navigation2 className="w-4 h-4" /> Triangulate Farm GPS
                  </button>
                </div>
              )}
            </div>

            <div className="bg-stone-900/90 border border-stone-800 rounded-2xl p-4 space-y-2 text-xs">
              <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block flex items-center gap-1">
                <Info className="w-3.5 h-3.5" /> Spatial Resolution Tip
              </span>
              <p className="text-stone-300 leading-relaxed">
                Toggle between high-resolution ESRI World Imagery satellite tiles and CartoDB Voyager map layers to inspect transport access roads and agricultural trade nodes.
              </p>
            </div>

          </div>
        )}

        {/* LOADING STATE */}
        {loading && (
          <div className="py-12 bg-stone-900/60 rounded-2xl border border-stone-800 text-center space-y-3">
            <div className="relative w-12 h-12 mx-auto">
              <div className="w-12 h-12 border-4 border-stone-800 border-t-emerald-500 rounded-full animate-spin" />
              <Satellite className="w-5 h-5 text-emerald-500 absolute inset-0 m-auto animate-pulse" />
            </div>
            <p className="text-xs font-bold text-stone-200">Satellite Sweep & Local Grid Scan in Progress...</p>
            <p className="text-[10px] text-stone-500 font-mono">Querying verified agricultural input dealers in {location}</p>
          </div>
        )}

        {/* TAB 3: VERIFIED DEALERS LIST */}
        {!loading && activeTab === 'dealers' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            
            <div className="flex items-center justify-between bg-stone-900/90 p-3.5 rounded-2xl border border-stone-800">
              <div>
                <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Store className="w-4 h-4 text-emerald-400" /> Local Verified Dealers
                </h3>
                <p className="text-[10px] text-stone-400 font-mono">Found {processedDealers.length} trade nodes in {location}</p>
              </div>

              {coords && processedDealers.some(d => d.distance !== undefined) && (
                <button 
                  onClick={() => setSortByDistance(!sortByDistance)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase transition-all border min-h-[36px] ${
                    sortByDistance 
                      ? 'bg-emerald-500 text-stone-950 border-emerald-400 font-extrabold' 
                      : 'bg-stone-950 text-stone-300 border border-stone-800'
                  }`}
                >
                  <ArrowDownUp className="w-3.5 h-3.5" />
                  <span>{sortByDistance ? 'Nearest First' : 'Sort Distance'}</span>
                </button>
              )}
            </div>

            {/* Dealer Type Filter Pills */}
            <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1">
              {['All', 'Seeds', 'Fertilizers', 'Pesticides', 'Tools'].map(filter => (
                <button
                  key={filter}
                  onClick={() => setSelectedFilter(filter)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all active:scale-95 min-h-[36px] ${
                    selectedFilter === filter 
                      ? 'bg-emerald-500 text-stone-950 font-extrabold shadow-sm' 
                      : 'bg-stone-900 text-stone-400 border border-stone-800 hover:text-white'
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>

            {/* Dealers Grid / List */}
            {displayedDealers.length === 0 ? (
              <div className="text-center py-10 px-4 bg-stone-900/80 rounded-2xl border border-stone-800 space-y-2">
                <Store className="w-8 h-8 text-stone-600 mx-auto" />
                <h4 className="text-xs font-bold text-stone-300">No dealers found for filter</h4>
                <p className="text-[11px] text-stone-500">
                  Try running a new scan or changing input tags under the Search tab.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {displayedDealers.map((dealer, i) => (
                  <div key={i} className="bg-stone-900/90 border border-stone-800 rounded-2xl p-4 space-y-3 hover:border-emerald-500/40 transition-all shadow-lg">
                    
                    <div className="flex items-start justify-between gap-2 border-b border-stone-800 pb-2.5">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[9px] font-bold text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-500/30 uppercase">
                            Verified Trade Node
                          </span>
                          {dealer.isMap && (
                            <span className="text-[9px] font-bold text-sky-400 bg-sky-950 px-2 py-0.5 rounded border border-sky-500/30 uppercase">
                              Google Maps
                            </span>
                          )}
                        </div>
                        <h4 className="text-sm font-bold text-white leading-tight">{dealer.title}</h4>
                      </div>

                      {dealer.distanceText && (
                        <span className="px-2.5 py-1 bg-amber-950 text-amber-300 border border-amber-500/30 rounded-xl font-mono text-[10px] font-bold shrink-0">
                          📍 {dealer.distanceText}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-xs text-stone-400">
                      <Package className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <div className="flex flex-wrap gap-1">
                        {dealer.types.map(type => (
                          <span key={type} className="text-[9px] font-bold text-stone-300 bg-stone-950 px-2 py-0.5 rounded border border-stone-800">
                            {type}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <a 
                        href={`tel:+91`} 
                        className="py-2.5 bg-stone-950 border border-stone-800 hover:border-emerald-500/40 rounded-xl text-xs font-bold text-stone-200 flex items-center justify-center gap-1.5 transition-all active:scale-95 min-h-[44px]"
                      >
                        <Phone className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Call Dealer</span>
                      </a>

                      <a 
                        href={dealer.uri} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="py-2.5 bg-emerald-500 hover:bg-emerald-400 text-stone-950 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all active:scale-95 min-h-[44px]"
                      >
                        <Navigation className="w-3.5 h-3.5 text-stone-950" />
                        <span>Navigate</span>
                      </a>
                    </div>

                  </div>
                ))}
              </div>
            )}

          </div>
        )}

        {/* TAB 4: SUPPLY BRIEF & AI ADVICE */}
        {(!loading && activeTab === 'brief') || (!loading && results && activeTab === 'search') ? (
          <div className="space-y-4 animate-in fade-in duration-200">
            
            {results && results.text ? (
              <div className="bg-gradient-to-br from-stone-900 via-stone-900 to-emerald-950/40 border border-emerald-500/30 rounded-2xl p-4 space-y-3 shadow-xl">
                <div className="flex items-center gap-2 border-b border-stone-800 pb-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <h3 className="text-xs font-black text-white uppercase tracking-wider">Strategic Supply Brief</h3>
                </div>

                <div className="text-xs text-stone-300 leading-relaxed font-sans pt-1">
                  <ReactMarkdown>{results.text}</ReactMarkdown>
                </div>
              </div>
            ) : (
              <div className="text-center py-10 px-4 bg-stone-900/80 rounded-2xl border border-stone-800 space-y-2">
                <Sparkles className="w-8 h-8 text-emerald-400 mx-auto animate-pulse" />
                <h4 className="text-xs font-bold text-stone-200">No Supply Brief generated yet</h4>
                <p className="text-[11px] text-stone-500">
                  Run a local supply grid scan under Search to generate localized pricing & supply intelligence.
                </p>
              </div>
            )}

            {/* PACS Subsidized Inventory Card */}
            <div className="bg-stone-900/90 border border-stone-800 rounded-2xl p-4 space-y-2.5">
              <div className="flex items-center gap-2 border-b border-stone-800 pb-2">
                <Building2 className="w-4 h-4 text-amber-400" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">Primary Agricultural Credit Societies (PACS)</h3>
              </div>

              <p className="text-xs text-stone-300 leading-relaxed">
                For bulk procurement of Urea or DAP, prioritize government PACS centers. Their rates are locked under central fertilizer subsidies, often saving 15–20% compared to private retail stockists.
              </p>
            </div>

          </div>
        ) : null}

      </main>

    </div>
  );
};

export default InputAdvisor;
