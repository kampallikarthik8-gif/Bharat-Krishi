import React from 'react';
import { Field, FieldPOI, SoilReport } from '../types';
import L from 'leaflet';
import { analyzeFieldBoundary, analyzeSoil } from '../services/geminiService';
import ReactMarkdown from 'react-markdown';
import { 
  MapPin, 
  Trash2, 
  Save, 
  RefreshCw, 
  Navigation, 
  Maximize, 
  CheckCircle2, 
  Undo2,
  Map as MapIcon,
  Layers,
  Satellite,
  Signal,
  MousePointer2,
  Calendar,
  Sprout,
  Activity,
  Zap,
  Info,
  X,
  Droplets,
  Zap as Power,
  DoorOpen,
  Box,
  AlertTriangle,
  FlaskConical,
  Target,
  Ruler,
  TrendingUp,
  Archive,
  Compass,
  Loader2,
  ChevronLeft,
  ChevronRight,
  MapPinned,
  Magnet,
  Waypoints,
  CloudRain,
  Thermometer,
  Cloud
} from 'lucide-react';

const WEATHER_API_KEY = import.meta.env.VITE_WEATHER_API_KEY;

type IndianUnit = 'Ha' | 'Ac' | 'Bigha' | 'Guntha' | 'Ac-Gn';
type Mode = 'Boundary' | 'Infrastructure' | 'Ruler' | 'SoilSample';

interface SnapResult {
  point: [number, number];
  type: 'Vertex' | 'Segment' | 'Asset' | 'Self' | 'MapData';
  label: string;
}

const POI_CONFIG: Record<string, { icon: any, color: string, label: string }> = {
  'Well': { icon: Droplets, color: '#3b82f6', label: 'Well' },
  'Pump': { icon: Power, color: '#f97316', label: 'Pump' },
  'Gate': { icon: DoorOpen, color: '#44403c', label: 'Gate' },
  'Storage': { icon: Box, color: '#d97706', label: 'Storage' },
  'Fence_Issue': { icon: AlertTriangle, color: '#f43f5e', label: 'Issue' },
  'Other': { icon: MapPin, color: '#a8a29e', label: 'Mark' },
  'SoilSample': { icon: FlaskConical, color: '#059669', label: 'Soil' }
};

const FIELD_COLORS = ['#1B4332', '#22c55e', '#3b82f6', '#eab308', '#ef4444', '#a855f7', '#f97316'];

const STANDARD_URL = 'https://{s}.basemaps.cartocdn.com/voyager/{z}/{x}/{y}{r}.png';
const SATELLITE_URL = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';

interface LandMarkerProps {
  language: string;
  onBack: () => void;
}

const LandMarker: React.FC<LandMarkerProps> = ({ language, onBack }) => {
  const [currentPoints, setCurrentPoints] = React.useState<[number, number][]>([]);
  const [currentMarkers, setCurrentMarkers] = React.useState<FieldPOI[]>([]);
  const [savedFields, setSavedFields] = React.useState<Field[]>(() => {
    const saved = localStorage.getItem('agri_saved_fields');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [loading, setLoading] = React.useState(false);
  const [isSatellite, setIsSatellite] = React.useState(true);
  const [activeMode, setActiveMode] = React.useState<Mode>('Boundary');
  const [snappingEnabled, setSnappingEnabled] = React.useState(true);
  const [mapSnappingEnabled, setMapSnappingEnabled] = React.useState(false);
  const [mapFeatures, setMapFeatures] = React.useState<[number, number][][]>([]);
  const [snapIndicator, setSnapIndicator] = React.useState<SnapResult | null>(null);
  const [fetchingMapData, setFetchingMapData] = React.useState(false);
  const [areaUnit, setAreaUnit] = React.useState<IndianUnit>(() => {
    return (localStorage.getItem('agri_preferred_land_unit') as IndianUnit) || 'Ac-Gn';
  });
  const [gpsAccuracy, setGpsAccuracy] = React.useState<number | null>(null);
  const [isLiveTracking, setIsLiveTracking] = React.useState(false);
  
  // Visibility Toggles
  const [showSavedFields, setShowSavedFields] = React.useState(true);
  const [showCurrentPath, setShowCurrentPath] = React.useState(true);
  const [showMapData, setShowMapData] = React.useState(true);
  const [showWeather, setShowWeather] = React.useState(false);
  const [showLayerControls, setShowLayerControls] = React.useState(false);
  const [weatherData, setWeatherData] = React.useState<{ temp: number, desc: string, icon: string } | null>(null);
  
  // Camera & Soil State
  const [showCamera, setShowCamera] = React.useState(false);
  const [facingMode, setFacingMode] = React.useState<'user' | 'environment'>('environment');
  const [analyzingSoilSample, setAnalyzingSoilSample] = React.useState(false);
  const [tempSoilPoint, setTempSoilPoint] = React.useState<[number, number] | null>(null);

  // Modals & UI
  const [showSaveModal, setShowSaveModal] = React.useState(false);
  const [showLedger, setShowLedger] = React.useState(false);
  const [showReport, setShowReport] = React.useState(false);
  const [aiReport, setAiReport] = React.useState<string | null>(null);
  const [reportLoading, setReportLoading] = React.useState(false);

  // Form
  const [fieldName, setFieldName] = React.useState('');
  const [fieldCrop, setFieldCrop] = React.useState('');
  const [fieldNotes, setFieldNotes] = React.useState('');

  const mapRef = React.useRef<L.Map | null>(null);
  const mapContainerRef = React.useRef<HTMLDivElement>(null);
  const layersRef = React.useRef<{
    current: L.FeatureGroup | null;
    saved: L.FeatureGroup | null;
    snap: L.FeatureGroup | null;
    ruler: L.FeatureGroup | null;
    features: L.FeatureGroup | null;
    tiles: L.TileLayer | null;
    weather: L.TileLayer | null;
  }>({ current: null, saved: null, snap: null, ruler: null, features: null, tiles: null, weather: null });
  
  const watchIdRef = React.useRef<number | null>(null);
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const streamRef = React.useRef<MediaStream | null>(null);

  // Synchronize refs for event handlers to avoid stale closures
  const stateRef = React.useRef({ 
    activeMode, 
    currentPoints, 
    currentMarkers, 
    savedFields, 
    snappingEnabled,
    mapSnappingEnabled,
    mapFeatures,
    snapIndicator 
  });
  
  React.useEffect(() => {
    stateRef.current = { 
      activeMode, 
      currentPoints, 
      currentMarkers, 
      savedFields, 
      snappingEnabled,
      mapSnappingEnabled,
      mapFeatures,
      snapIndicator 
    };
  }, [activeMode, currentPoints, currentMarkers, savedFields, snappingEnabled, mapSnappingEnabled, mapFeatures, snapIndicator]);

  const toggleMapMode = () => {
    if (!layersRef.current.tiles) return;
    const newMode = !isSatellite;
    setIsSatellite(newMode);
    layersRef.current.tiles.setUrl(newMode ? SATELLITE_URL : STANDARD_URL);
  };

  const fetchWeather = async () => {
    if (!mapRef.current) return;
    const center = mapRef.current.getCenter();
    try {
      const res = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${center.lat}&lon=${center.lng}&appid=${WEATHER_API_KEY}&units=metric`);
      const data = await res.json();
      if (data.main) {
        setWeatherData({
          temp: Math.round(data.main.temp),
          desc: data.weather[0].description,
          icon: data.weather[0].icon
        });
      }
    } catch (e) {
      console.error("Weather fetch failed", e);
    }
  };

  const toggleWeatherLayer = () => {
    if (!mapRef.current) return;
    const newState = !showWeather;
    setShowWeather(newState);
    
    if (newState) {
      if (!layersRef.current.weather) {
        layersRef.current.weather = L.tileLayer(`https://tile.openweathermap.org/map/precipitation_new/{z}/{x}/{y}.png?appid=${WEATHER_API_KEY}`, {
          maxZoom: 20,
          opacity: 0.6
        });
      }
      layersRef.current.weather.addTo(mapRef.current);
      fetchWeather();
    } else {
      if (layersRef.current.weather) {
        layersRef.current.weather.remove();
      }
    }
  };

  const fetchOSMFeatures = async () => {
    if (!mapRef.current) return;
    setFetchingMapData(true);
    const bounds = mapRef.current.getBounds();
    const bbox = `${bounds.getSouth()},${bounds.getWest()},${bounds.getNorth()},${bounds.getEast()}`;
    const query = `[out:json][timeout:25];(way["highway"](${bbox});way["waterway"](${bbox}););out body;>;out skel qt;`;
    
    try {
      const response = await fetch('https://overpass-api.de/api/interpreter', {
        method: 'POST',
        body: query
      });

      if (!response.ok) {
        throw new Error(`Overpass API error: ${response.status} ${response.statusText}`);
      }

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.warn("Received non-JSON response from Overpass:", text.substring(0, 200));
        throw new Error("Overpass API returned non-JSON data (likely an error page or XML)");
      }

      const data = await response.json();
      
      if (!data || !data.elements) {
        setMapFeatures([]);
        return;
      }

      const nodes: Record<number, [number, number]> = {};
      data.elements.forEach((el: any) => {
        if (el.type === 'node') nodes[el.id] = [el.lat, el.lon];
      });

      const ways: [number, number][][] = data.elements
        .filter((el: any) => el.type === 'way' && el.nodes)
        .map((way: any) => way.nodes.map((nodeId: number) => nodes[nodeId]).filter(Boolean));

      setMapFeatures(ways);
    } catch (err) {
      console.error("Failed to fetch OSM data", err);
    } finally {
      setFetchingMapData(false);
    }
  };

  const startCamera = async () => {
    try {
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facingMode },
        audio: false
      });
      streamRef.current = stream;
      setShowCamera(true);
      setTimeout(() => { if (videoRef.current) videoRef.current.srcObject = stream; }, 100);
    } catch (err) {
      alert("Camera access denied.");
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setShowCamera(false);
  };

  const handleCaptureSoil = async () => {
    if (videoRef.current && canvasRef.current && tempSoilPoint) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const base64 = canvas.toDataURL('image/jpeg').split(',')[1];
        stopCamera();
        setAnalyzingSoilSample(true);
        try {
          const report = await analyzeSoil(base64, language);
          const marker: FieldPOI = {
            id: Date.now().toString(),
            type: 'Other',
            label: `Soil Analysis: ${report.texture}`,
            point: tempSoilPoint,
            status: 'Operational'
          };
          setCurrentMarkers(prev => [...prev, marker]);
        } catch (e) {
          alert("Bio-analysis failed. Marking location as sampled.");
          setCurrentMarkers(prev => [...prev, { id: Date.now().toString(), type: 'Other', label: 'Soil Sample Point', point: tempSoilPoint }]);
        } finally {
          setAnalyzingSoilSample(false);
          setTempSoilPoint(null);
        }
      }
    }
  };

  const findSnapPoint = (latlng: L.LatLng): SnapResult | null => {
    const { 
      snappingEnabled: enabled, 
      mapSnappingEnabled: mapEnabled,
      savedFields: saved, 
      currentPoints: current,
      mapFeatures: osm
    } = stateRef.current;
    
    if (!enabled) return null;

    const zoom = mapRef.current?.getZoom() || 17;
    const threshold = Math.max(5, 50 / Math.pow(2, zoom - 15));
    let best: SnapResult | null = null;
    let minDist = threshold;

    // 1. Check current points (for closing loops)
    current.forEach((p, i) => {
      const d = latlng.distanceTo(L.latLng(p));
      if (d < minDist) {
        minDist = d;
        best = { point: p, type: i === 0 ? 'Self' : 'Vertex', label: i === 0 ? "Close Plot" : "Current Vertex" };
      }
    });

    // 2. Check saved fields
    saved.forEach(f => {
      f.points.forEach(p => {
        const d = latlng.distanceTo(L.latLng(p));
        if (d < minDist) {
          minDist = d;
          best = { point: p, type: 'Vertex', label: f.name };
        }
      });
    });

    // 3. Check OSM Map Data (Roads/Canals) if enabled
    if (mapEnabled) {
      osm.forEach(path => {
        path.forEach(p => {
          const d = latlng.distanceTo(L.latLng(p));
          if (d < minDist) {
            minDist = d;
            best = { point: p, type: 'MapData', label: "Map Feature" };
          }
        });
      });
    }

    return best;
  };

  const calculateArea = (points: [number, number][]) => {
    if (points.length < 3) return 0;
    const avgLat = points.reduce((s, p) => s + p[0], 0) / points.length;
    const latFactor = 111132.92;
    const lonFactor = 111319.49 * Math.cos(avgLat * Math.PI / 180);
    let area = 0;
    for (let i = 0; i < points.length; i++) {
      const p1 = points[i];
      const p2 = points[(i + 1) % points.length];
      area += ((p1[1] * lonFactor) * (p2[0] * latFactor) - (p2[1] * lonFactor) * (p1[0] * latFactor));
    }
    return Math.abs(area / 2);
  };

  const formatArea = (sqm: number, unit: IndianUnit) => {
    switch(unit) {
      case 'Ha': return `${(sqm / 10000).toFixed(3)} Ha`;
      case 'Ac': return `${(sqm / 4046.86).toFixed(3)} Ac`;
      case 'Ac-Gn': {
        const totalAc = sqm / 4046.86;
        const ac = Math.floor(totalAc);
        const gn = (totalAc - ac) * 40;
        return `${ac} Ac, ${gn.toFixed(2)} Gn`;
      }
      default: return `${(sqm / 4046.86).toFixed(2)} Ac`;
    }
  };

  const calculatePathLength = (points: [number, number][], close = false) => {
    if (points.length < 2) return 0;
    let len = 0;
    for (let i = 0; i < points.length - 1; i++) {
      len += L.latLng(points[i]).distanceTo(L.latLng(points[i+1]));
    }
    if (close && points.length > 2) len += L.latLng(points[points.length-1]).distanceTo(L.latLng(points[0]));
    return len;
  };

  const saveField = () => {
    if (currentPoints.length < 3 && activeMode === 'Boundary') return;
    const areaSqm = calculateArea(currentPoints);
    const newField: Field = {
      id: Date.now().toString(),
      name: fieldName || `Plot ${savedFields.length + 1}`,
      cropType: fieldCrop,
      points: currentPoints,
      markers: currentMarkers,
      area: areaSqm / 10000,
      perimeter: calculatePathLength(currentPoints, activeMode === 'Boundary'),
      createdAt: new Date().toISOString(),
      color: FIELD_COLORS[savedFields.length % FIELD_COLORS.length],
      status: 'Active'
    };
    const updated = [newField, ...savedFields];
    setSavedFields(updated);
    localStorage.setItem('agri_saved_fields', JSON.stringify(updated));
    setCurrentPoints([]);
    setCurrentMarkers([]);
    setShowSaveModal(false);
  };

  const startTracking = () => {
    if (watchIdRef.current) return;
    setIsLiveTracking(true);
    watchIdRef.current = navigator.geolocation.watchPosition((pos) => {
      setGpsAccuracy(pos.coords.accuracy);
      const pt: [number, number] = [pos.coords.latitude, pos.coords.longitude];
      if (stateRef.current.activeMode === 'Boundary' || stateRef.current.activeMode === 'Ruler') {
        setCurrentPoints(prev => {
          if (prev.length === 0) return [pt];
          const last = prev[prev.length - 1];
          if (L.latLng(last).distanceTo(L.latLng(pt)) > 2) return [...prev, pt];
          return prev;
        });
      }
      mapRef.current?.setView(pt, 19);
    }, null, { enableHighAccuracy: true });
  };

  const stopTracking = () => {
    if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current);
    watchIdRef.current = null;
    setIsLiveTracking(false);
  };

  React.useEffect(() => {
    if (mapContainerRef.current && !mapRef.current) {
      const map = L.map(mapContainerRef.current, { zoomControl: false, attributionControl: false }).setView([20.5937, 78.9629], 5);
      const tiles = L.tileLayer(SATELLITE_URL, { maxZoom: 20 }).addTo(map);
      
      layersRef.current = {
        current: L.featureGroup().addTo(map),
        saved: L.featureGroup().addTo(map),
        snap: L.featureGroup().addTo(map),
        ruler: L.featureGroup().addTo(map),
        features: L.featureGroup().addTo(map),
        tiles,
        weather: null
      };

      map.on('mousemove', (e) => setSnapIndicator(findSnapPoint(e.latlng)));
      
      map.on('click', (e) => {
        const { activeMode: mode, snapIndicator: snap } = stateRef.current;
        const pt: [number, number] = snap ? snap.point : [e.latlng.lat, e.latlng.lng];
        
        if (mode === 'Boundary' || mode === 'Ruler') {
          setCurrentPoints(prev => [...prev, pt]);
        } else if (mode === 'Infrastructure') {
          const label = prompt("Marker Label (e.g. Borewell):", "Borewell");
          if (label) setCurrentMarkers(prev => [...prev, { id: Date.now().toString(), type: 'Well', label, point: pt }]);
        } else if (mode === 'SoilSample') {
          setTempSoilPoint(pt);
          startCamera();
        }
      });

      map.on('moveend', () => {
        if (stateRef.current.mapSnappingEnabled) {
          fetchOSMFeatures();
        }
        if (showWeather) {
          fetchWeather();
        }
      });

      mapRef.current = map;
      navigator.geolocation.getCurrentPosition(p => map.setView([p.coords.latitude, p.coords.longitude], 17));
    }
    return () => stopTracking();
  }, []);

  React.useEffect(() => {
    const { current: cL, ruler: rL, snap: sL, saved: svL, features: fL } = layersRef.current;
    if (!cL || !rL || !sL || !svL || !fL) return;

    cL.clearLayers();
    rL.clearLayers();
    sL.clearLayers();
    fL.clearLayers();

    // Render Saved Fields
    if (showSavedFields) {
      savedFields.forEach(f => {
        if (f.points.length >= 3) {
          L.polygon(f.points, { color: f.color, fillOpacity: 0.1, weight: 2 }).addTo(svL).bindPopup(f.name);
        }
      });
    }

    // Render OSM Features if map snapping is on and visibility is enabled
    if (mapSnappingEnabled && showMapData) {
      mapFeatures.forEach(path => {
        L.polyline(path, { color: '#3b82f6', weight: 1, opacity: 0.3, dashArray: '4,4' }).addTo(fL);
      });
    }

    // Render Snap Indicator
    if (snapIndicator) {
      const snapColor = snapIndicator.type === 'MapData' ? '#3b82f6' : '#f97316';
      L.circleMarker(snapIndicator.point, { radius: 10, color: snapColor, weight: 3, fillOpacity: 0.2 }).addTo(sL);
    }

    // Render Draft
    if (showCurrentPath) {
      if (activeMode === 'Ruler') {
        currentPoints.forEach((p, i) => {
          L.circleMarker(p, { radius: 5, color: '#f97316', fillOpacity: 1 }).addTo(rL);
          if (i > 0) {
            const dist = L.latLng(currentPoints[i-1]).distanceTo(L.latLng(p));
            L.polyline([currentPoints[i-1], p], { color: '#f97316', dashArray: '5,5' }).addTo(rL);
            L.marker([(currentPoints[i-1][0]+p[0])/2, (currentPoints[i-1][1]+p[1])/2], {
              icon: L.divIcon({ html: `<span class="bg-black text-white px-1 rounded text-[8px]">${dist.toFixed(1)}m</span>`, className: '' })
            }).addTo(rL);
          }
        });
      } else {
        currentPoints.forEach(p => L.circleMarker(p, { radius: 6, color: '#10b981', weight: 3, fillOpacity: 1, fillColor: 'white' }).addTo(cL));
        if (currentPoints.length >= 3 && activeMode === 'Boundary') {
          L.polygon(currentPoints, { color: 'white', weight: 4, fillColor: '#1B4332', fillOpacity: 0.3, dashArray: '10,10' }).addTo(cL);
        }
        currentMarkers.forEach(m => {
          L.circleMarker(m.point, { radius: 8, color: '#3b82f6', fillOpacity: 1 }).addTo(cL).bindPopup(m.label);
        });
      }
    }
  }, [currentPoints, currentMarkers, activeMode, snapIndicator, savedFields, mapFeatures, mapSnappingEnabled, showSavedFields, showCurrentPath, showMapData]);

  return (
    <div className="fixed inset-0 z-50 bg-[#0a0a0a] flex flex-col overflow-hidden animate-in fade-in duration-500 font-sans">
      <div ref={mapContainerRef} className="absolute inset-0 z-0" />

      {/* Top Navigation & Status */}
      <div className="absolute top-6 inset-x-6 z-10 pointer-events-none flex items-start justify-between">
        <div className="flex flex-col gap-4 pointer-events-auto">
          <button onClick={onBack} className="w-14 h-14 bg-black/60 backdrop-blur-2xl rounded-3xl flex items-center justify-center shadow-2xl border border-white/10 active:scale-90 transition-all hover:bg-black/80 group">
            <ChevronLeft className="w-7 h-7 text-white group-hover:-translate-x-1 transition-transform"/>
          </button>
          
          <div className="bg-black/60 backdrop-blur-2xl p-6 rounded-[2.5rem] border border-white/10 shadow-2xl min-w-[220px] relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)]" />
            <div className="flex items-center gap-3 mb-2">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.8)]" />
              <p className="text-[9px] font-black text-emerald-500 uppercase tracking-[0.3em]">System Active</p>
            </div>
            <h2 className="text-2xl font-black text-white tracking-tighter leading-none font-display">FieldMapper <span className="text-emerald-500 font-mono text-lg">v2.4</span></h2>
            <div className="flex items-center gap-2 mt-3">
              <Activity className="w-3 h-3 text-white/20" />
              <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">{activeMode} Mode Engaged</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 pointer-events-auto items-end">
          <div className="flex gap-3">
            <ToolBtn 
              active={mapSnappingEnabled} 
              onClick={() => {
                const newState = !mapSnappingEnabled;
                setMapSnappingEnabled(newState);
                if (newState) fetchOSMFeatures();
              }}
              icon={Magnet}
              label="Snap"
            />
            <ToolBtn 
              active={isSatellite} 
              onClick={toggleMapMode} 
              icon={isSatellite ? Layers : Satellite}
              label="View"
            />
            <ToolBtn 
              active={showLayerControls} 
              onClick={() => setShowLayerControls(!showLayerControls)} 
              icon={Waypoints}
              label="Layers"
            />
            <ToolBtn 
              active={false} 
              onClick={() => setShowLedger(true)} 
              icon={Archive}
              label="Archive"
            />
          </div>

          {/* Real-time Stats HUD - Instrument Style */}
          {(currentPoints.length > 0) && (
            <div className="bg-black/80 backdrop-blur-3xl p-6 rounded-[3rem] border border-white/10 shadow-[0_40px_80px_-15px_rgba(0,0,0,0.9)] min-w-[240px] animate-in slide-in-from-right-full duration-700 ease-out relative overflow-hidden">
               <div className="absolute top-0 right-0 p-4 opacity-5">
                 <Target className="w-24 h-24 text-white" />
               </div>
               
               <div className="grid grid-cols-1 gap-6 relative z-10">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <p className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em]">Surface Area</p>
                      <TrendingUp className="w-3 h-3 text-emerald-500/40" />
                    </div>
                    <p className="text-4xl font-black text-white tracking-tighter leading-none font-mono">
                      {formatArea(calculateArea(currentPoints), areaUnit).split(' ')[0]}
                      <span className="text-sm ml-2 text-emerald-500 uppercase font-sans">{formatArea(calculateArea(currentPoints), areaUnit).split(' ')[1]}</span>
                    </p>
                  </div>
                  
                  <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-[8px] font-black text-white/30 uppercase tracking-widest mb-1">Perimeter</p>
                      <p className="text-xl font-black text-white tracking-tighter leading-none font-mono">
                        {Math.round(calculatePathLength(currentPoints, activeMode === 'Boundary'))}
                        <span className="text-[10px] ml-1 text-white/40 font-sans">m</span>
                      </p>
                    </div>
                    <div>
                      <p className="text-[8px] font-black text-white/30 uppercase tracking-widest mb-1">Vertices</p>
                      <p className="text-xl font-black text-white tracking-tighter leading-none font-mono">
                        {currentPoints.length.toString().padStart(2, '0')}
                        <span className="text-[10px] ml-1 text-white/40 font-sans">pts</span>
                      </p>
                    </div>
                  </div>
               </div>
               
               <div className="mt-6 flex items-center justify-between">
                  <button onClick={() => setAreaUnit(u => u === 'Ac-Gn' ? 'Ha' : u === 'Ha' ? 'Ac' : 'Ac-Gn')} className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-full transition-all group">
                    <RefreshCw className="w-3 h-3 text-emerald-500 group-hover:rotate-180 transition-transform duration-500" />
                    <span className="text-[9px] font-black text-white/60 uppercase tracking-widest">Cycle Units</span>
                  </button>
                  <div className="flex gap-1">
                    {[1,2,3].map(i => <div key={i} className="w-1 h-1 bg-emerald-500/40 rounded-full" />)}
                  </div>
               </div>
            </div>
          )}
        </div>
      </div>

      {/* Layer Visibility Controls Popover */}
      {showLayerControls && (
        <div className="absolute top-24 right-6 z-50 w-64 bg-black/80 backdrop-blur-3xl rounded-[2.5rem] p-6 border border-white/10 shadow-2xl animate-in zoom-in-95 duration-200">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.2em]">Layer Management</h3>
            <button onClick={() => setShowLayerControls(false)}><X className="w-4 h-4 text-white/20 hover:text-white transition-colors"/></button>
          </div>
          <div className="space-y-2">
            <VisibilityToggle 
              label="Saved Fields" 
              active={showSavedFields} 
              onToggle={() => setShowSavedFields(!showSavedFields)} 
              icon={MapIcon}
            />
            <VisibilityToggle 
              label="Current Path" 
              active={showCurrentPath} 
              onToggle={() => setShowCurrentPath(!showCurrentPath)} 
              icon={Waypoints}
            />
            <VisibilityToggle 
              label="OSM Map Data" 
              active={showMapData} 
              onToggle={() => setShowMapData(!showMapData)} 
              icon={Magnet}
            />
            <VisibilityToggle 
              label="Weather Radar" 
              active={showWeather} 
              onToggle={toggleWeatherLayer} 
              icon={CloudRain}
            />
          </div>
        </div>
      )}

      {/* Weather HUD Overlay */}
      {showWeather && weatherData && (
        <div className="absolute top-24 left-6 z-10 pointer-events-none animate-in slide-in-from-left-8 duration-500">
          <div className="bg-black/60 backdrop-blur-2xl p-5 rounded-[2rem] border border-white/10 shadow-2xl flex items-center gap-5">
            <div className="w-12 h-12 bg-emerald-500/20 rounded-2xl flex items-center justify-center border border-emerald-500/20">
              <img src={`https://openweathermap.org/img/wn/${weatherData.icon}@2x.png`} className="w-10 h-10" alt="Weather" />
            </div>
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-white tracking-tighter">{weatherData.temp}°</span>
                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">{weatherData.desc}</span>
              </div>
              <p className="text-[8px] font-black text-white/30 uppercase tracking-[0.2em] mt-1">Map Center Conditions</p>
            </div>
          </div>
        </div>
      )}

      {/* System Status HUD - Technical Style */}
      <div className="absolute top-64 left-6 z-10 pointer-events-none flex flex-col gap-3">
         {fetchingMapData && (
            <div className="bg-black/60 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10 flex items-center gap-3 shadow-2xl animate-in fade-in slide-in-from-left-4">
              <div className="w-1 h-1 bg-blue-400 rounded-full animate-ping" />
              <RefreshCw className="w-4 h-4 text-blue-400 animate-spin" />
              <span className="text-[9px] font-black text-white uppercase tracking-[0.2em]">Vector Sync</span>
            </div>
         )}
         {gpsAccuracy !== null && (
           <div className="bg-black/60 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10 flex items-center gap-3 shadow-2xl animate-in fade-in slide-in-from-left-4 delay-75">
             <Signal className={`w-4 h-4 ${gpsAccuracy < 10 ? 'text-emerald-400' : 'text-amber-400'}`} />
             <div className="flex flex-col">
               <span className="text-[7px] font-black text-white/30 uppercase tracking-widest">GPS Precision</span>
               <span className="text-[10px] font-black text-white uppercase tracking-widest">±{gpsAccuracy.toFixed(1)}m</span>
             </div>
           </div>
         )}
         {isLiveTracking && (
           <div className="bg-rose-600/90 backdrop-blur-md px-4 py-2 rounded-xl flex items-center gap-3 shadow-[0_0_20px_rgba(225,29,72,0.3)] animate-pulse">
             <div className="w-2 h-2 bg-white rounded-full" />
             <span className="text-[9px] font-black text-white uppercase tracking-[0.2em]">Live Trace</span>
           </div>
         )}
      </div>

      {/* Main Bottom Control Island */}
      <div className="absolute bottom-10 inset-x-6 z-20 pointer-events-none flex flex-col items-center">
        {/* Contextual Action Bar */}
        {(currentPoints.length > 0 || currentMarkers.length > 0) && (
          <div className="flex gap-3 mb-8 animate-in slide-in-from-bottom-8 duration-500 pointer-events-auto">
             <button 
               onClick={() => {
                 if (currentPoints.length > 0) setCurrentPoints(prev => prev.slice(0, -1));
                 else if (currentMarkers.length > 0) setCurrentMarkers(prev => prev.slice(0, -1));
               }}
               className="h-16 px-8 bg-black/80 backdrop-blur-2xl text-white rounded-3xl border border-white/10 shadow-2xl flex items-center gap-4 active:scale-95 transition-all hover:bg-black/90 group"
             >
               <Undo2 className="w-6 h-6 text-amber-500 group-hover:-rotate-45 transition-transform" />
               <span className="text-[11px] font-black uppercase tracking-[0.2em]">Undo Last</span>
             </button>
             
             <button 
               onClick={() => { setCurrentPoints([]); setCurrentMarkers([]); }}
               className="h-16 px-8 bg-black/80 backdrop-blur-2xl text-white rounded-3xl border border-white/10 shadow-2xl flex items-center gap-4 active:scale-95 transition-all hover:bg-black/90 group"
             >
               <Trash2 className="w-6 h-6 text-rose-500 group-hover:scale-110 transition-transform" />
               <span className="text-[11px] font-black uppercase tracking-[0.2em]">Purge Draft</span>
             </button>

             <button 
               onClick={() => setShowSaveModal(true)}
               className="h-16 px-10 bg-emerald-500 text-black rounded-3xl shadow-[0_25px_50px_-12px_rgba(16,185,129,0.5)] flex items-center gap-4 active:scale-95 transition-all hover:bg-emerald-400 border border-emerald-400/30 group"
             >
               <Save className="w-6 h-6 group-hover:bounce" />
               <span className="text-[11px] font-black uppercase tracking-[0.2em]">Commit Survey</span>
             </button>
          </div>
        )}

        {/* Mode Selector - Hardware Style */}
        <div className="bg-black/80 backdrop-blur-3xl p-3 rounded-[3rem] border border-white/10 shadow-[0_40px_80px_-20px_rgba(0,0,0,1)] flex items-center gap-2 pointer-events-auto ring-1 ring-white/5 relative">
           <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-emerald-500/10 backdrop-blur-md px-4 py-1 rounded-full border border-emerald-500/20">
             <p className="text-[8px] font-black text-emerald-500 uppercase tracking-[0.4em]">Control Matrix</p>
           </div>
           
           <ModeBtn id="Boundary" icon={MapPinned} active={activeMode === 'Boundary'} onClick={setActiveMode} label="Plot" />
           <ModeBtn id="Infrastructure" icon={MapPin} active={activeMode === 'Infrastructure'} onClick={setActiveMode} label="Asset" />
           <ModeBtn id="SoilSample" icon={FlaskConical} active={activeMode === 'SoilSample'} onClick={setActiveMode} label="Soil" />
           <ModeBtn id="Ruler" icon={Ruler} active={activeMode === 'Ruler'} onClick={setActiveMode} label="Meas." />
           
           <div className="w-px h-10 bg-white/10 mx-3" />
           
           <button 
             onClick={isLiveTracking ? stopTracking : startTracking}
             className={`w-16 h-16 rounded-[2rem] flex items-center justify-center transition-all relative group ${isLiveTracking ? 'bg-rose-600 text-white shadow-[0_0_30px_rgba(225,29,72,0.6)]' : 'bg-white/5 text-white/40 hover:text-white hover:bg-white/10'}`}
           >
             <Compass className={`w-8 h-8 ${isLiveTracking ? 'animate-spin' : 'group-hover:rotate-45 transition-transform'}`} />
             {isLiveTracking && (
               <div className="absolute -top-1 -right-1 w-4 h-4 bg-white rounded-full flex items-center justify-center">
                 <div className="w-2 h-2 bg-rose-600 rounded-full animate-ping" />
               </div>
             )}
           </button>
        </div>
      </div>

      {/* Ledger Drawer */}
      {showLedger && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-md flex items-end animate-in fade-in duration-300">
           <div className="absolute inset-0" onClick={() => setShowLedger(false)} />
           <div className="bg-[#0a0c10] w-full max-w-md mx-auto rounded-t-[3.5rem] p-10 animate-in slide-in-from-bottom-full relative shadow-2xl border-t border-white/10">
              <div className="flex justify-between items-start mb-8">
                 <div>
                    <h3 className="text-3xl font-black text-white tracking-tighter font-display">Field Registry</h3>
                    <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mt-1">Grounded Survey Archive</p>
                 </div>
                 <button onClick={() => setShowLedger(false)} className="p-3 bg-white/5 hover:bg-white/10 rounded-full transition-colors"><X className="w-5 h-5 text-white"/></button>
              </div>
              <div className="space-y-3 max-h-[50vh] overflow-y-auto no-scrollbar pb-10">
                 {savedFields.length === 0 ? <p className="text-center py-10 opacity-30 text-xs font-black uppercase text-white">No Land Records</p> : 
                   savedFields.map(f => (
                     <div key={f.id} className="p-5 bg-white/5 border border-white/10 rounded-[2rem] flex items-center gap-4 group hover:bg-white/10 transition-colors">
                        <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner shrink-0" style={{ backgroundColor: `${f.color}20`, color: f.color }}>
                           <MapIcon className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                           <h4 className="font-black text-white text-sm leading-none mb-1">{f.name}</h4>
                           <p className="text-[9px] font-black text-white/40 uppercase">{formatArea(f.area * 10000, areaUnit)} • {f.cropType}</p>
                        </div>
                        <button onClick={() => { setSavedFields(savedFields.filter(x=>x.id!==f.id)); localStorage.setItem('agri_saved_fields', JSON.stringify(savedFields.filter(x=>x.id!==f.id))); }} className="p-2 text-white/20 hover:text-rose-500 transition-colors"><Trash2 className="w-4 h-4"/></button>
                     </div>
                   ))
                 }
              </div>
           </div>
        </div>
      )}

      {/* Save Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 z-[110] bg-black/60 backdrop-blur-xl flex items-center justify-center p-6 animate-in fade-in duration-300">
           <div className="bg-[#0a0c10] w-full max-w-sm rounded-[3.5rem] p-10 shadow-2xl relative border border-white/10">
              <h3 className="text-3xl font-black text-white tracking-tighter mb-8 leading-none font-display">Commit Survey</h3>
              <div className="space-y-6">
                 <div className="bg-white/5 p-4 rounded-2xl flex justify-between items-center border border-white/10 shadow-inner">
                    <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Survey Area</span>
                    <span className="text-sm font-black text-emerald-500">{formatArea(calculateArea(currentPoints), areaUnit)}</span>
                 </div>
                 <div className="space-y-1">
                    <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-4">Parcel Name</label>
                    <input value={fieldName} onChange={e => setFieldName(e.target.value)} placeholder="e.g. North Ridge" className="w-full bg-white/5 border border-white/10 p-5 rounded-3xl font-black text-sm text-white outline-none focus:border-emerald-500/50 transition-colors placeholder:text-white/20" />
                 </div>
                 <div className="space-y-1">
                    <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-4">Crop</label>
                    <input value={fieldCrop} onChange={e => setFieldCrop(e.target.value)} placeholder="e.g. Basmati Rice" className="w-full bg-white/5 border border-white/10 p-5 rounded-3xl font-black text-sm text-white outline-none focus:border-emerald-500/50 transition-colors placeholder:text-white/20" />
                 </div>
                 <div className="flex gap-3 pt-6">
                    <button onClick={() => setShowSaveModal(false)} className="px-6 py-4 bg-white/5 text-white/40 hover:text-white font-black rounded-2xl text-[10px] uppercase tracking-widest border border-white/10 transition-colors">Back</button>
                    <button onClick={saveField} className="flex-1 bg-emerald-500 text-black font-black py-4 rounded-2xl shadow-[0_15px_30px_-10px_rgba(16,185,129,0.5)] flex items-center justify-center gap-2 hover:bg-emerald-400 transition-colors"><CheckCircle2 className="w-5 h-5"/> Confirm</button>
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* Camera View for Soil */}
      {showCamera && (
        <div className="fixed inset-0 z-[200] bg-black flex flex-col items-center justify-center">
          <div className="absolute top-8 inset-x-6 flex justify-between items-center z-10">
             <button onClick={stopCamera} className="p-4 bg-black/40 backdrop-blur-xl rounded-full text-white border border-white/10"><X className="w-8 h-8"/></button>
             <div className="flex flex-col items-center">
               <span className="text-emerald-500 text-[10px] font-black uppercase tracking-[0.4em]">AI Soil Probe</span>
               <div className="w-12 h-0.5 bg-emerald-500 mt-1 shadow-[0_0_10px_rgba(16,185,129,0.8)]" />
             </div>
             <button onClick={() => setFacingMode(f => f === 'user' ? 'environment' : 'user')} className="p-4 bg-black/40 backdrop-blur-xl rounded-full text-white border border-white/10"><RefreshCw className="w-8 h-8"/></button>
          </div>
          
          <div className="absolute inset-0 border-[40px] border-black/40 pointer-events-none z-0">
            <div className="w-full h-full border border-white/20 relative">
              <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-emerald-500" />
              <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-emerald-500" />
              <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-emerald-500" />
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-emerald-500" />
            </div>
          </div>

          <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
          <canvas ref={canvasRef} className="hidden" />
          
          <div className="absolute bottom-12 z-10">
             <button onClick={handleCaptureSoil} className="w-24 h-24 rounded-full bg-white/10 border-8 border-white/5 p-1 active:scale-90 transition-all shadow-2xl group">
                <div className="w-full h-full rounded-full border-4 border-emerald-500 flex items-center justify-center bg-emerald-500/20 group-hover:bg-emerald-500/40 transition-colors">
                  <div className="w-4 h-4 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_15px_rgba(16,185,129,1)]"/>
                </div>
             </button>
          </div>
        </div>
      )}

      {analyzingSoilSample && (
        <div className="fixed inset-0 z-[210] bg-[#0a0c10]/95 backdrop-blur-3xl flex flex-col items-center justify-center gap-6">
           <div className="relative">
             <div className="w-24 h-24 border-4 border-white/5 border-t-emerald-500 rounded-full animate-spin shadow-[0_0_30px_rgba(16,185,129,0.2)]" />
             <FlaskConical className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 text-emerald-500 animate-pulse" />
           </div>
           <div className="flex flex-col items-center gap-2">
             <p className="font-black text-emerald-500 uppercase tracking-[0.3em] text-xs">Analyzing Mineral Matrix...</p>
             <div className="w-48 h-1 bg-white/5 rounded-full overflow-hidden">
               <div className="h-full bg-emerald-500 animate-progress shadow-[0_0_10px_rgba(16,185,129,0.8)]" />
             </div>
           </div>
        </div>
      )}
    </div>
  );
};

const ModeBtn: React.FC<{ id: Mode, icon: any, active: boolean, onClick: (m: Mode) => void, label: string }> = ({ id, icon: Icon, active, onClick, label }) => (
  <button
    onClick={() => onClick(id)}
    className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center transition-all gap-0.5 ${active ? 'bg-emerald-500 text-black shadow-[0_10px_20px_rgba(16,185,129,0.3)] scale-110' : 'text-white/40 hover:text-white hover:bg-white/5'}`}
  >
    <Icon className="w-5 h-5" />
    <span className="text-[7px] font-black uppercase tracking-tighter">{label}</span>
  </button>
);

const ToolBtn: React.FC<{ active: boolean, onClick: () => void, icon: any, label: string }> = ({ active, onClick, icon: Icon, label }) => (
  <button 
    onClick={onClick} 
    className={`w-12 h-12 rounded-2xl flex flex-col items-center justify-center shadow-2xl border transition-all active:scale-90 ${active ? 'bg-emerald-500 text-black border-emerald-400/50 shadow-[0_0_15px_rgba(16,185,129,0.3)]' : 'bg-black/40 backdrop-blur-xl text-white/60 border-white/10 hover:bg-black/60'}`}
  >
    <Icon className="w-4 h-4 mb-0.5"/>
    <span className="text-[6px] font-black uppercase tracking-widest">{label}</span>
  </button>
);

const VisibilityToggle: React.FC<{ label: string, active: boolean, onToggle: () => void, icon: any }> = ({ label, active, onToggle, icon: Icon }) => (
  <button 
    onClick={onToggle}
    className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all ${active ? 'bg-white/5 text-white border border-white/10' : 'text-white/30 border border-transparent hover:bg-white/5'}`}
  >
    <div className="flex items-center gap-3">
      <div className={`p-2 rounded-lg ${active ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/5 text-white/20'}`}>
        <Icon className="w-4 h-4" />
      </div>
      <span className="text-[10px] font-black uppercase tracking-widest">{label}</span>
    </div>
    <div className={`w-10 h-5 rounded-full p-1 transition-colors ${active ? 'bg-emerald-600' : 'bg-white/10'}`}>
      <div className={`w-3 h-3 bg-white rounded-full transition-transform ${active ? 'translate-x-5' : 'translate-x-0'}`} />
    </div>
  </button>
);

export default LandMarker;
