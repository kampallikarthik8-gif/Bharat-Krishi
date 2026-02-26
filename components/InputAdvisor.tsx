import React from 'react';
import { fetchInputPriceAdvisory } from '../services/geminiService';
import { 
  Tag, 
  Search, 
  Loader2, 
  ExternalLink, 
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
  TrendingUp,
  Landmark,
  Plus,
  X,
  Map as MapIcon,
  Store,
  Phone,
  Package,
  ArrowUpRight,
  Satellite,
  Layers,
  ArrowDownUp,
  Maximize2,
  Minimize2,
  Navigation2,
  Radar,
  ArrowRight
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import L from 'leaflet';

const WEATHER_API_KEY = "42d5aa17c7f2866670e62b4c77cb3d32";

const INPUT_SUGGESTIONS = ['DAP Fertilizer', 'Urea', 'Paddy Seeds', 'Tractor Rental', 'Neem Pesticide', 'Solar Pump'];

interface DealerInfo {
  title: string;
  uri: string;
  isMap: boolean;
  distance?: number; // in km
  distanceText?: string;
  types: string[];
}

const InputAdvisor: React.FC<{ language: string }> = ({ language }) => {
  const [location, setLocation] = React.useState(localStorage.getItem('agri_farm_location') || '');
  const [coords, setCoords] = React.useState<{lat: number, lon: number} | null>(null);
  const [inputs, setInputs] = React.useState<string[]>([]);
  const [inputValue, setInputValue] = React.useState('');
  const [results, setResults] = React.useState<{ text?: string, sources: any[] } | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [detecting, setDetecting] = React.useState(false);
  const [isSatellite, setIsSatellite] = React.useState(true);
  const [sortByDistance, setSortByDistance] = React.useState(false);
  const [processedDealers, setProcessedDealers] = React.useState<DealerInfo[]>([]);
  const [selectedFilter, setSelectedFilter] = React.useState<string>('All');
  const [isMapExpanded, setIsMapExpanded] = React.useState(false);

  const mapRef = React.useRef<L.Map | null>(null);
  const mapContainerRef = React.useRef<HTMLDivElement>(null);
  const markersLayerRef = React.useRef<L.LayerGroup | null>(null);
  const tileLayerRef = React.useRef<L.TileLayer | null>(null);

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
        } catch (err) { console.error(err); }
        finally { setDetecting(false); }
      },
      () => setDetecting(false)
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
    if (inputs.length === 0 || !location) return;
    setLoading(true);
    setProcessedDealers([]);
    try {
      const data = await fetchInputPriceAdvisory(location, inputs, language, coords || undefined);
      setResults(data);
      
      const parsed = parseDistances(data.text || '', data.sources);
      setProcessedDealers(parsed);
      
      updateMapMarkers(data.sources);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const updateMapMarkers = (sources: any[]) => {
    if (!mapRef.current || !markersLayerRef.current) return;
    markersLayerRef.current.clearLayers();

    if (coords) {
        const farmIcon = L.divIcon({
            html: `<div class="bg-stone-900 p-2 rounded-full shadow-[0_0_20px_rgba(0,0,0,0.4)] border-2 border-emerald-400 text-white animate-pulse"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9 12 2l9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg></div>`,
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
    const map = L.map(mapContainerRef.current, { zoomControl: false, attributionControl: false }).setView([initialLat, initialLon], 13);
    
    const tiles = L.tileLayer(isSatellite 
      ? 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}' 
      : 'https://{s}.basemaps.cartocdn.com/voyager/{z}/{x}/{y}{r}.png', 
      { maxZoom: 19 }
    ).addTo(map);
    
    tileLayerRef.current = tiles;
    markersLayerRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;
  };

  React.useEffect(() => {
    initMap();
    detectLocation();
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Sync map size on expansion
  React.useEffect(() => {
    if (mapRef.current) {
      setTimeout(() => mapRef.current?.invalidateSize(), 300);
    }
  }, [isMapExpanded]);

  const addInput = (val: string) => {
    if (!val.trim() || inputs.includes(val)) return;
    setInputs([...inputs, val.trim()]);
    setInputValue('');
  };

  const removeInput = (val: string) => {
    setInputs(inputs.filter(i => i !== val));
  };

  const displayedDealers = React.useMemo(() => {
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
    <div className="space-y-6 pb-24 animate-in fade-in slide-in-from-bottom-6 duration-700">
      <div className="bg-white rounded-[3.5rem] overflow-hidden shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] border border-stone-200">
        {/* Header Section */}
        <div className="p-8 md:p-10 bg-stone-900 text-white relative overflow-hidden">
           <div className="absolute top-0 right-0 p-10 opacity-10 rotate-12">
              <Satellite className="w-64 h-64" />
           </div>
           <div className="relative z-10">
              <div className="flex items-center gap-3 mb-4">
                 <div className="bg-emerald-500/20 p-3 rounded-2xl border border-emerald-500/30">
                    <ShoppingCart className="text-emerald-400 w-6 h-6" />
                 </div>
                 <div>
                    <h2 className="text-3xl font-black tracking-tighter leading-none">Supply Intel</h2>
                    <p className="text-[10px] font-black uppercase text-emerald-400 tracking-[0.3em] mt-2">Satellite Grounding Engine</p>
                 </div>
              </div>
              <p className="text-stone-400 text-sm font-medium max-w-sm leading-relaxed">
                Localized market audit for seeds, fertilizers, and machinery using real-time spatial intelligence.
              </p>
           </div>
        </div>

        {/* Local Network Map - Immersive Integration */}
        <div className={`transition-all duration-500 ease-in-out relative group ${isMapExpanded ? 'h-[450px]' : 'h-[220px]'} border-b border-stone-100`}>
           <div ref={mapContainerRef} className="w-full h-full bg-stone-100 z-0" />
           
           {/* Map Controls Floating Island */}
           <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-2">
              <button 
                onClick={toggleMapMode}
                className="p-3 bg-white/90 backdrop-blur-md rounded-2xl shadow-xl border border-stone-100 text-stone-700 active:scale-90 transition-all hover:bg-white"
                title="Toggle Satellite Imagery"
              >
                {isSatellite ? <Layers className="w-5 h-5" /> : <Satellite className="w-5 h-5" />}
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); setIsMapExpanded(!isMapExpanded); }}
                className="p-3 bg-white/90 backdrop-blur-md rounded-2xl shadow-xl border border-stone-100 text-stone-700 active:scale-90 transition-all hover:bg-white"
              >
                {isMapExpanded ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
              </button>
           </div>

           {/* Location Badge */}
           <div className="absolute top-4 left-4 z-[1000] pointer-events-none">
              <div className="bg-stone-900/90 backdrop-blur-md text-white px-4 py-2 rounded-2xl flex items-center gap-3 shadow-2xl border border-white/10">
                 <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_#10b981]" />
                 <span className="text-[10px] font-black uppercase tracking-widest">{location || 'Locating...'}</span>
              </div>
           </div>

           {!coords && (
              <div className="absolute inset-0 bg-stone-50/60 backdrop-blur-sm flex items-center justify-center z-[1000]">
                 <button onClick={() => detectLocation()} className="flex items-center gap-3 bg-stone-900 text-white px-8 py-4 rounded-2xl shadow-2xl font-black text-xs uppercase tracking-widest active:scale-95 transition-all">
                    <Navigation2 className="w-4 h-4 text-emerald-400" /> Triangulate GPS
                 </button>
              </div>
           )}
        </div>

        {/* Input Controls */}
        <div className="p-8 space-y-8">
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-2">
               <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-4 flex items-center gap-2">
                 <MapPin className="w-3 h-3" /> Target Cluster
               </label>
               <div className="relative">
                  <input 
                    placeholder="Enter district or market hub..." 
                    value={location}
                    onChange={e => setLocation(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-100 p-5 rounded-[1.75rem] outline-none focus:ring-2 focus:ring-stone-900 font-bold text-sm shadow-inner transition-all"
                  />
                  <button type="button" onClick={() => detectLocation()} className="absolute right-4 top-1/2 -translate-y-1/2 p-2.5 bg-white rounded-xl shadow-sm text-[#825500] hover:bg-stone-50 active:scale-90 transition-all">
                     {detecting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Navigation className="w-4 h-4" />}
                  </button>
               </div>
            </div>

            <div className="space-y-3">
               <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-4 flex items-center gap-2">
                 <Package className="w-3 h-3" /> Inventory Search
               </label>
               <div className="relative">
                  <input 
                    placeholder="Add item (e.g. Liquid Urea)..." 
                    value={inputValue}
                    onChange={e => setInputValue(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && addInput(inputValue)}
                    className="w-full bg-stone-50 border border-stone-100 p-5 pl-14 rounded-[1.75rem] outline-none focus:ring-2 focus:ring-stone-900 font-bold text-sm shadow-inner"
                  />
                  <Tag className="absolute left-5 top-1/2 -translate-y-1/2 text-stone-300 w-6 h-6" />
                  <button 
                    onClick={() => addInput(inputValue)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-2.5 bg-stone-900 text-white rounded-xl shadow-sm active:scale-90 transition-all"
                  >
                     <Plus className="w-4 h-4" />
                  </button>
               </div>
            </div>
          </div>

          <div className="space-y-4">
             <div className="flex flex-wrap gap-2">
                {inputs.map(i => (
                  <span key={i} className="bg-emerald-50 text-emerald-800 px-5 py-2.5 rounded-2xl text-[11px] font-black flex items-center gap-3 border border-emerald-100 animate-in zoom-in group">
                    {i} 
                    <X className="w-3.5 h-3.5 cursor-pointer text-emerald-300 group-hover:text-rose-500 transition-colors" onClick={() => removeInput(i)} />
                  </span>
                ))}
             </div>
             <div className="flex gap-2 overflow-x-auto no-scrollbar py-2">
                {INPUT_SUGGESTIONS.map(s => (
                  <button key={s} onClick={() => addInput(s)} className="shrink-0 px-5 py-2 bg-stone-50 text-[9px] font-black uppercase text-stone-400 rounded-xl border border-stone-100 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-100 transition-all">
                    + {s}
                  </button>
                ))}
             </div>
          </div>

          <button 
            onClick={handleSearch}
            disabled={loading || inputs.length === 0 || !location}
            className="w-full bg-stone-900 text-white font-black py-6 rounded-[2rem] shadow-2xl active:scale-[0.98] transition-all flex items-center justify-center gap-4 disabled:opacity-50 group overflow-hidden relative"
          >
            {loading ? <Loader2 className="animate-spin w-5 h-5" /> : <Radar className="w-5 h-5 text-emerald-400 group-hover:animate-pulse" />}
            <span className="text-sm uppercase tracking-[0.2em]">Scan Local Supply Grid</span>
          </button>
        </div>

        {/* Dynamic States View */}
        <div className="p-8 pt-0 min-h-[300px]">
          {loading ? (
            <div className="py-24 flex flex-col items-center justify-center space-y-8">
              <div className="relative">
                  <div className="w-24 h-24 border-8 border-stone-100 border-t-emerald-500 rounded-full animate-spin"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                     <Satellite className="w-8 h-8 text-emerald-500 animate-pulse" />
                  </div>
              </div>
              <div className="text-center">
                <p className="font-black text-xs uppercase tracking-[0.4em] text-stone-900 mb-2">Satellite Sweep in Progress...</p>
                <p className="text-[10px] text-stone-400 font-bold uppercase tracking-widest">Parsing grounded trade citations</p>
              </div>
            </div>
          ) : results ? (
            <div className="space-y-12 animate-in zoom-in-95 duration-500">
               {/* Synthesized Briefing Card */}
               <div className="bg-emerald-50/40 border-2 border-emerald-100 p-8 md:p-10 rounded-[3rem] shadow-sm relative overflow-hidden group">
                  <div className="absolute -top-12 -right-12 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                     <BadgePercent className="w-64 h-64 text-emerald-900" />
                  </div>
                  <div className="relative z-10">
                     <div className="flex items-center gap-3 text-emerald-700 font-black text-[10px] uppercase tracking-[0.3em] mb-10 bg-white/80 w-fit px-6 py-2 rounded-full border border-emerald-100 shadow-sm">
                       <CheckCircle2 className="w-4 h-4" /> Strategic Supply Brief
                     </div>
                     <div className="prose prose-stone max-w-none text-sm font-bold text-stone-700 leading-relaxed italic">
                       <ReactMarkdown>{results.text || ''}</ReactMarkdown>
                     </div>
                  </div>
               </div>

                {/* Verified Dealer Network Section */}
               <div className="space-y-8">
                 <div className="flex flex-col gap-6 px-4">
                   <div className="flex items-center justify-between">
                     <div>
                        <h3 className="text-xl font-black text-stone-900 tracking-tight flex items-center gap-3">
                          <Store className="w-6 h-6 text-emerald-600" /> Local Dealer Network
                        </h3>
                        <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest mt-1">Verified Trade Nodes</p>
                     </div>
                     
                     {coords && processedDealers.some(d => d.distance !== undefined) && (
                       <button 
                         onClick={() => setSortByDistance(!sortByDistance)}
                         className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-sm border ${sortByDistance ? 'bg-stone-900 text-white border-stone-900' : 'bg-white text-stone-500 border-stone-100'}`}
                       >
                         <ArrowDownUp className="w-3.5 h-3.5" /> {sortByDistance ? 'Nearest' : 'Distance'}
                       </button>
                     )}
                   </div>

                   {/* Filter Options */}
                   <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
                      {['All', 'Seeds', 'Fertilizers', 'Pesticides', 'Tools'].map(filter => (
                        <button
                          key={filter}
                          onClick={() => setSelectedFilter(filter)}
                          className={`shrink-0 px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border ${
                            selectedFilter === filter 
                              ? 'bg-emerald-600 text-white border-emerald-600 shadow-lg shadow-emerald-200' 
                              : 'bg-white text-stone-500 border-stone-100 hover:border-emerald-200'
                          }`}
                        >
                          {filter}
                        </button>
                      ))}
                   </div>
                 </div>
                 
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   {displayedDealers.map((dealer, i) => (
                     <div key={i} className="bg-white border border-stone-100 p-8 rounded-[3rem] flex flex-col justify-between shadow-[0_10px_30px_-10px_rgba(0,0,0,0.05)] hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)] hover:border-emerald-200 transition-all group">
                        <div>
                           <div className="flex justify-between items-start mb-8">
                              <div className={`p-5 rounded-[2rem] shadow-inner ${dealer.isMap ? 'bg-blue-50 text-blue-600' : 'bg-emerald-50 text-emerald-600'} group-hover:scale-110 transition-transform border border-transparent group-hover:border-current/10`}>
                                 {dealer.isMap ? <MapPin className="w-8 h-8" /> : <Store className="w-8 h-8" />}
                              </div>
                              <div className="flex flex-col items-end gap-2">
                                 <div className="flex gap-1.5">
                                   <div className="bg-stone-900 text-white px-3 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest shadow-lg">Verified</div>
                                   {dealer.isMap && <div className="bg-blue-500 text-white px-3 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest shadow-lg">Maps Hub</div>}
                                 </div>
                                 {dealer.distanceText && (
                                   <div className="bg-amber-100 text-amber-900 px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-sm animate-in fade-in slide-in-from-right-2">
                                     {dealer.distanceText} Away
                                   </div>
                                 )}
                              </div>
                           </div>

                           <h4 className="text-2xl font-black text-stone-900 mb-3 leading-none group-hover:text-emerald-700 transition-colors tracking-tight">
                              {dealer.title}
                           </h4>
                           
                           <div className="space-y-4 mb-10">
                              <div className="flex items-start gap-4">
                                 <MapPin className="w-4 h-4 text-stone-300 mt-0.5 shrink-0" />
                                 <p className="text-xs font-bold text-stone-500 leading-relaxed">
                                   {dealer.isMap ? 'Primary hub location verified via Google Maps' : new URL(dealer.uri).hostname}
                                 </p>
                              </div>
                              <div className="flex items-center gap-4 bg-stone-50/80 p-4 rounded-2xl border border-stone-100">
                                 <Package className="w-5 h-5 text-emerald-600 shrink-0" />
                                 <div className="flex flex-wrap gap-1.5">
                                    {dealer.types.map(type => (
                                      <span key={type} className="text-[9px] font-black uppercase tracking-tighter bg-white text-stone-500 px-2 py-0.5 rounded border border-stone-200">
                                        {type}
                                      </span>
                                    ))}
                                 </div>
                              </div>
                           </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 mt-auto">
                           <a 
                             href={`tel:+91`} 
                             className="flex items-center justify-center gap-3 py-4 bg-stone-50 border border-stone-100 rounded-2xl text-[10px] font-black uppercase tracking-widest text-stone-700 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-100 transition-all shadow-sm"
                           >
                              <Phone className="w-4 h-4" /> Call Dealer
                           </a>
                           <a 
                             href={dealer.uri} 
                             target="_blank" 
                             rel="noopener"
                             className="flex items-center justify-center gap-3 py-4 bg-stone-900 rounded-2xl text-[10px] font-black uppercase tracking-widest text-white hover:bg-black active:scale-95 transition-all shadow-xl"
                           >
                              <Navigation className="w-4 h-4 text-amber-400" /> Navigate
                           </a>
                        </div>
                     </div>
                   ))}
                 </div>
               </div>

               {/* Collaborative Buying Insight */}
               <div className="bg-gradient-to-br from-stone-900 to-stone-800 rounded-[3.5rem] p-10 text-white relative overflow-hidden shadow-2xl">
                  <div className="absolute -top-12 -right-12 p-8 opacity-5">
                     <Landmark className="w-64 h-64" />
                  </div>
                  <div className="relative z-10">
                     <div className="flex items-center gap-3 text-emerald-400 font-black text-[10px] uppercase tracking-[0.4em] mb-6">
                        <Info className="w-5 h-5" /> Subsidized Inventory Node
                     </div>
                     <p className="text-lg font-bold text-stone-200 leading-relaxed mb-6 italic">
                        "For mass procurement of Urea or DAP, prioritize PACS (Primary Agricultural Credit Societies). Their rates are grounded in central subsidies, often undercutting commercial retail by 15-20%."
                     </p>
                     <button className="flex items-center gap-2 text-white/40 hover:text-emerald-400 transition-colors text-[10px] font-black uppercase tracking-widest group">
                       View Subsidy Tracker <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                     </button>
                  </div>
               </div>
            </div>
          ) : (
            <div className="py-24 text-center text-stone-200 flex flex-col items-center animate-in fade-in duration-1000">
              <div className="bg-stone-50 p-10 rounded-full mb-8 shadow-inner">
                <ShoppingCart className="w-20 h-20 text-stone-200" />
              </div>
              <p className="text-sm font-black uppercase tracking-[0.3em] leading-relaxed max-w-[280px] text-stone-400">
                Synchronize GPS or select inventory items to reveal localized supply intel
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InputAdvisor;