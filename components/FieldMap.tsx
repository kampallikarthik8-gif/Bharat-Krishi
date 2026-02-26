import React from 'react';
import { getFertilizerAdvice, fetchFieldMap } from '../services/geminiService';
import { Field, FertilizerPlan, SoilReport, FieldPOI, GroundingChunk } from '../types';
import { 
  Navigation, 
  Satellite, 
  Layers, 
  Target, 
  Droplets, 
  Sprout, 
  Zap, 
  X, 
  ChevronRight,
  ClipboardList,
  RefreshCw,
  Trash2,
  CheckCircle2,
  Activity,
  AlertTriangle,
  Box,
  Download,
  FileBadge,
  Plus,
  Save,
  MousePointer2,
  MapPin,
  Map as MapIcon,
  DoorOpen,
  Power,
  Search,
  Loader2,
  Info,
  PenTool,
  MapPinned,
  Edit3,
  Ruler,
  Eye,
  EyeOff,
  Compass,
  FileJson,
  Navigation2,
  ArrowUpRight,
  Settings2,
  Magnet
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { motion, AnimatePresence } from 'motion/react';
import L from 'leaflet';
// @ts-ignore
window.L = L;
import 'leaflet-geometryutil';

const FIELD_COLORS = [
  '#FF7E5F', '#FEB47B', '#FFD194', '#FF9A8B', '#FF6A88', '#FF99AC', '#FFC3A0'
];

const POI_TYPES: { type: FieldPOI['type'], label: string, color: string, svg: string }[] = [
  { 
    type: 'Well', label: 'Water Well', color: '#FF7E5F',
    svg: '<path d="M7 21s-2-1-4-5c-1-2.5 0-5 3-9 2-2.5 4-4.5 4-4.5s2 2 4 4.5c3 4 4 6.5 3 9-2 4-4 5-4 5H7Z"/>'
  },
  { 
    type: 'Pump', label: 'Motor Pump', color: '#FEB47B',
    svg: '<path d="M12 2v10m0 0l-4-4m4 4l4-4M4.93 4.93a10 10 0 1014.14 0"/>'
  },
  { 
    type: 'Irrigation', label: 'Irrigation Point', color: '#FFD194',
    svg: '<path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z"/>'
  },
  { 
    type: 'Fertilization', label: 'Fertilizer Spot', color: '#FF9A8B',
    svg: '<path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83"/>'
  },
  { 
    type: 'Pest_Control', label: 'Pest Alert', color: '#FF6A88',
    svg: '<path d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32l1.41 1.41M2 12h2m16 0h2M4.93 19.07l1.41-1.41m11.32-11.32l1.41-1.41M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10z"/>'
  },
  { 
    type: 'Gate', label: 'Entry Gate', color: '#44403c',
    svg: '<path d="M13 4h3a2 2 0 0 1 2 2v14M2 20h3M13 20h3M5 20V6a2 2 0 0 1 2-2h6M9 12v.01"/>'
  },
  { 
    type: 'Storage', label: 'Shed/Storage', color: '#FEB47B',
    svg: '<path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16ZM3.27 6.96L12 12.01l8.73-5.05M12 22.08V12"/>'
  },
  { 
    type: 'Fence_Issue', label: 'Fence Breach', color: '#FF6A88',
    svg: '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3ZM12 9v4m0 4h.01"/>'
  },
  { 
    type: 'Other', label: 'Landmark', color: '#a8a29e',
    svg: '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>'
  }
];

const ZONE_TYPES: { type: any, label: string, color: string, icon: any }[] = [
  { type: 'Irrigation', label: 'Irrigation Area', color: '#3b82f6', icon: Droplets },
  { type: 'Fertilization', label: 'Fertilizer Zone', color: '#f59e0b', icon: Sprout },
  { type: 'Pest_Control', label: 'Treatment Zone', color: '#ef4444', icon: AlertTriangle },
  { type: 'Harvest', label: 'Harvest Zone', color: '#10b981', icon: Target },
  { type: 'Other', label: 'Custom Zone', color: '#78716c', icon: Box }
];

const ZONE_COLORS = [
  '#3b82f6', '#f59e0b', '#ef4444', '#10b981', '#8b5cf6', '#ec4899', '#78716c'
];

const STATUS_CONFIG: Record<Field['status'], { color: string, bg: string, text: string }> = {
  'Active': { color: '#FF7E5F', bg: 'bg-amber-50', text: 'text-amber-700' },
  'Fallow': { color: '#FEB47B', bg: 'bg-orange-50', text: 'text-orange-700' },
  'Harvested': { color: '#FFD194', bg: 'bg-yellow-50', text: 'text-yellow-700' },
  'Prepping': { color: '#FF9A8B', bg: 'bg-rose-50', text: 'text-rose-700' }
};

const POI_STATUS_THEMES: Record<string, { ring: string, animate: string, label: string, badge: string }> = {
  'Operational': { ring: 'border-white', animate: '', label: 'Operational', badge: 'bg-amber-500' },
  'Maintenance': { ring: 'border-amber-400', animate: 'animate-pulse', label: 'Needs Maint.', badge: 'bg-amber-500' },
  'Critical': { ring: 'border-rose-500', animate: 'animate-ping', label: 'Critical Issue', badge: 'bg-rose-500' }
};

interface SnapResult {
  point: [number, number];
  type: 'Boundary' | 'Asset';
  label: string;
}

interface ContextMenuState {
  x: number;
  y: number;
  type: 'field' | 'poi' | 'discovery';
  data: any;
  fieldId?: string;
}

const ControlBtn: React.FC<{ active: boolean, onClick: () => void, icon: any, label: string }> = ({ active, onClick, icon: Icon, label }) => (
  <button 
    onClick={onClick} 
    className={`w-12 h-12 rounded-xl shadow-2xl border flex flex-col items-center justify-center transition-all group active:scale-90 ${active ? 'bg-amber-500 text-stone-950 border-amber-400' : 'bg-stone-950/80 backdrop-blur-xl text-stone-500 border-white/10 hover:text-white'}`}
  >
    <Icon className="w-5 h-5" />
    <span className="text-[7px] font-black uppercase tracking-tighter mt-0.5">{label}</span>
  </button>
);

const FieldMap = ({ language }: { language: string }) => {
  const [isSatellite, setIsSatellite] = React.useState(true);
  const [activeMode, setActiveMode] = React.useState<'Navigate' | 'Boundary' | 'Asset' | 'Ruler' | 'Zone'>('Navigate');
  const [showLabels, setShowLabels] = React.useState(true);
  const [snappingEnabled, setSnappingEnabled] = React.useState(true);
  
  const [drawingPoints, setDrawingPoints] = React.useState<[number, number][]>([]);
  const [tempMarkers, setTempMarkers] = React.useState<FieldPOI[]>([]);
  const [tempZones, setTempZones] = React.useState<any[]>([]);
  const [rulerPoints, setRulerPoints] = React.useState<[number, number][]>([]);
  const [discoveryQuery, setDiscoveryQuery] = React.useState('');
  const [discoveryResults, setDiscoveryResults] = React.useState<GroundingChunk[]>([]);
  const [isSearchingDiscovery, setIsSearchingDiscovery] = React.useState(false);
  const [snapIndicator, setSnapIndicator] = React.useState<SnapResult | null>(null);
  
  const [pincode, setPincode] = React.useState('');
  const [isSearchingPincode, setIsSearchingPincode] = React.useState(false);
  const [pincodeError, setPincodeError] = React.useState('');
  const [contextMenu, setContextMenu] = React.useState<ContextMenuState | null>(null);
  const [editingPOI, setEditingPOI] = React.useState<{ poi: FieldPOI, fieldId?: string } | null>(null);
  const [showSaveModal, setShowSaveModal] = React.useState(false);
  const [showZoneModal, setShowZoneModal] = React.useState(false);
  const [activeField, setActiveField] = React.useState<Field | null>(null);
  const [detailedAdvice, setDetailedAdvice] = React.useState<FertilizerPlan | null>(null);
  const [adviceLoading, setAdviceLoading] = React.useState(false);
  const [mapReady, setMapReady] = React.useState(false);

  const [formData, setFormData] = React.useState({
    name: '',
    crop: '',
    status: 'Active' as Field['status'],
    color: FIELD_COLORS[0]
  });

  const [zoneFormData, setZoneFormData] = React.useState({
    label: '',
    type: 'Irrigation' as any,
    color: ZONE_COLORS[0],
    notes: ''
  });

  const [savedFields, setSavedFields] = React.useState<Field[]>(() => {
    const saved = localStorage.getItem('agri_saved_fields');
    return saved ? JSON.parse(saved) : [];
  });

  const mapRef = React.useRef<L.Map | null>(null);
  const mapContainerRef = React.useRef<HTMLDivElement>(null);
  const fieldLayersRef = React.useRef<L.FeatureGroup | null>(null);
  const drawingLayersRef = React.useRef<L.FeatureGroup | null>(null);
  const discoveryLayersRef = React.useRef<L.FeatureGroup | null>(null);
  const snapLayersRef = React.useRef<L.FeatureGroup | null>(null);

  const stateRef = React.useRef({ activeMode, drawingPoints, savedFields, mapReady, rulerPoints, snappingEnabled, snapIndicator });
  React.useEffect(() => {
    stateRef.current = { activeMode, drawingPoints, savedFields, mapReady, rulerPoints, snappingEnabled, snapIndicator };
  }, [activeMode, drawingPoints, savedFields, mapReady, rulerPoints, snappingEnabled, snapIndicator]);

  const findSnapPoint = (latlng: L.LatLng): SnapResult | null => {
    const { snappingEnabled: enabled, savedFields: fields, drawingPoints: current } = stateRef.current;
    if (!enabled) return null;

    const threshold = 15; // pixels
    let best: SnapResult | null = null;
    let minDist = threshold;

    // Check existing fields
    fields.forEach(f => {
      f.points.forEach(p => {
        const d = mapRef.current!.latLngToContainerPoint(latlng).distanceTo(mapRef.current!.latLngToContainerPoint(L.latLng(p)));
        if (d < minDist) {
          minDist = d;
          best = { point: p, type: 'Boundary', label: f.name };
        }
      });
    });

    // Check current drawing
    current.forEach(p => {
      const d = mapRef.current!.latLngToContainerPoint(latlng).distanceTo(mapRef.current!.latLngToContainerPoint(L.latLng(p)));
      if (d < minDist) {
        minDist = d;
        best = { point: p, type: 'Boundary', label: 'Current Path' };
      }
    });

    return best;
  };

  const undoDrawingPoint = () => {
    if (activeMode === 'Boundary' || activeMode === 'Zone') {
      setDrawingPoints(prev => prev.slice(0, -1));
    } else if (activeMode === 'Ruler') {
      setRulerPoints(prev => prev.slice(0, -1));
    }
  };

  const clearDrawing = () => {
    setDrawingPoints([]);
    setRulerPoints([]);
    setTempMarkers([]);
    setTempZones([]);
    setSnapIndicator(null);
  };

  const handlePincodeSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pincode || pincode.length < 6) return;
    
    setIsSearchingPincode(true);
    setPincodeError('');
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&postalcode=${pincode}&country=India`);
      const data = await response.json();
      if (data && data.length > 0) {
        const { lat, lon } = data[0];
        if (mapRef.current) {
          mapRef.current.setView([parseFloat(lat), parseFloat(lon)], 16);
        }
      } else {
        setPincodeError('Location not found');
      }
    } catch (err) {
      console.error(err);
      setPincodeError('Search failed');
    } finally {
      setIsSearchingPincode(false);
    }
  };

  const getDrawingStats = () => {
    if (activeMode === 'Boundary' && drawingPoints.length > 2) {
      const area = (L as any).GeometryUtil.geodesicArea(drawingPoints.map(p => L.latLng(p))) / 10000;
      const perimeter = drawingPoints.reduce((acc, p, i) => acc + (i > 0 ? calculateDistance(drawingPoints[i-1], p) : 0), 0);
      return { area, perimeter };
    }
    if (activeMode === 'Ruler' && rulerPoints.length > 1) {
      const distance = rulerPoints.reduce((acc, p, i) => acc + (i > 0 ? calculateDistance(rulerPoints[i-1], p) : 0), 0);
      return { distance };
    }
    return null;
  };

  const stats = getDrawingStats();

  const initMap = (lat: number, lon: number) => {
    if (mapRef.current || !mapContainerRef.current) return;
    
    const map = L.map(mapContainerRef.current, { 
      zoomControl: false, 
      attributionControl: false 
    }).setView([lat, lon], 17);
    
    L.tileLayer(isSatellite 
      ? 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}' 
      : 'https://{s}.basemaps.cartocdn.com/voyager/{z}/{x}/{y}{r}.png', 
      { maxZoom: 20 }
    ).addTo(map);
    
    fieldLayersRef.current = L.featureGroup().addTo(map);
    drawingLayersRef.current = L.featureGroup().addTo(map);
    discoveryLayersRef.current = L.featureGroup().addTo(map);
    snapLayersRef.current = L.featureGroup().addTo(map);
    
    map.on('mousemove', (e) => {
      if (stateRef.current.activeMode !== 'Navigate') {
        setSnapIndicator(findSnapPoint(e.latlng));
      } else {
        setSnapIndicator(null);
      }
    });

    map.on('click', (e) => {
      setContextMenu(null);
      const { activeMode: mode, snapIndicator: snap } = stateRef.current;
      const pt: [number, number] = snap ? snap.point : [e.latlng.lat, e.latlng.lng];
      
      if (mode === 'Boundary' || mode === 'Zone') {
        setDrawingPoints(prev => [...prev, pt]);
      } else if (mode === 'Asset') {
        const typeObj = POI_TYPES[0]; 
        const newAsset: FieldPOI = {
          id: Date.now().toString(),
          type: typeObj.type,
          label: `Asset ${tempMarkers.length + 1}`,
          point: pt,
          status: 'Operational'
        };
        setTempMarkers(prev => [...prev, newAsset]);
        setEditingPOI({ poi: newAsset });
      } else if (mode === 'Ruler') {
        setRulerPoints(prev => [...prev, pt]);
      }
    });

    mapRef.current = map;
    setMapReady(true);
    setTimeout(() => map.invalidateSize(), 300);
  };

  const renderUserFields = React.useCallback(() => {
    if (!mapReady || !mapRef.current || !fieldLayersRef.current) return;
    
    fieldLayersRef.current.clearLayers();
    
    savedFields.forEach(field => {
      if (field.points && field.points.length > 2) {
        const poly = L.polygon(field.points, { 
          color: field.color || '#10b981', 
          fillOpacity: 0.3, 
          weight: 3 
        }).addTo(fieldLayersRef.current!);
        
        if (showLabels) {
          poly.bindTooltip(`${field.name}<br/>${formatArea(field.area)}`, { 
            permanent: true, 
            direction: 'center',
            className: 'bg-white/90 border-none shadow-xl px-2 py-1 rounded text-[10px] font-black uppercase text-stone-900'
          });
        }

        poly.on('click', (e) => {
          L.DomEvent.stopPropagation(e);
          setActiveField(field);
          const point = mapRef.current!.latLngToContainerPoint(e.latlng);
          setContextMenu({ x: point.x, y: point.y, type: 'field', data: field });
        });

        (field.zones || []).forEach(zone => {
          const zonePoly = L.polygon(zone.points, {
            color: zone.color,
            fillOpacity: 0.5,
            weight: 2,
            dashArray: '5, 5'
          }).addTo(fieldLayersRef.current!);

          if (showLabels) {
            zonePoly.bindTooltip(zone.label, {
              permanent: true,
              direction: 'center',
              className: 'bg-stone-900/80 border-none shadow-xl px-2 py-1 rounded text-[8px] font-black uppercase text-white'
            });
          }
        });
      }
      
      (field.markers || []).forEach(poi => {
        const typeInfo = POI_TYPES.find(t => t.type === poi.type) || POI_TYPES[0];
        const statusTheme = POI_STATUS_THEMES[poi.status || 'Operational'];
        
        const poiIcon = L.divIcon({
          html: `
            <div class="relative flex items-center justify-center">
              <div class="absolute inset-0 rounded-full border-4 ${statusTheme.ring} ${statusTheme.animate} opacity-40"></div>
              <div class="relative w-10 h-10 rounded-2xl border-2 border-white shadow-2xl flex items-center justify-center bg-white transition-all transform hover:scale-110" style="color: ${typeInfo.color}">
                 <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                   ${typeInfo.svg}
                 </svg>
                 <div class="absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${statusTheme.badge} shadow-sm"></div>
              </div>
            </div>
          `,
          className: '', iconSize: [40, 40], iconAnchor: [20, 20]
        });
        
        const marker = L.marker(poi.point, { icon: poiIcon }).addTo(fieldLayersRef.current!);
        if (showLabels) {
          marker.bindTooltip(`
            <div class="flex flex-col gap-0.5">
              <span class="font-black text-[10px] text-stone-900 uppercase leading-none">${poi.label}</span>
              <span class="text-[8px] font-bold text-stone-400 uppercase tracking-tighter">${statusTheme.label}</span>
            </div>
          `, { direction: 'top', className: 'bg-white border-none shadow-2xl rounded-lg px-2 py-1', offset: [0, -10] });
        }
        
        marker.on('click', (e) => {
          L.DomEvent.stopPropagation(e);
          const point = mapRef.current!.latLngToContainerPoint(e.latlng);
          setContextMenu({ x: point.x, y: point.y, type: 'poi', data: poi, fieldId: field.id });
        });
      });
    });
  }, [savedFields, mapReady, showLabels]);

  React.useEffect(() => { renderUserFields(); }, [renderUserFields]);

  const handlePOISave = (updatedPOI: FieldPOI) => {
    const updatedFields = savedFields.map(f => {
      if (f.id === editingPOI?.fieldId) {
        return { 
          ...f, 
          markers: (f.markers || []).map(m => m.id === updatedPOI.id ? updatedPOI : m) 
        };
      }
      return f;
    });
    
    if (!editingPOI?.fieldId) {
      setTempMarkers(prev => prev.map(m => m.id === updatedPOI.id ? updatedPOI : m));
    } else {
      setSavedFields(updatedFields);
      localStorage.setItem('agri_saved_fields', JSON.stringify(updatedFields));
    }
    setEditingPOI(null);
  };

  const toggleSatellite = () => {
    if (!mapRef.current) return;
    const newMode = !isSatellite;
    setIsSatellite(newMode);
    mapRef.current.eachLayer((layer) => {
      if (layer instanceof L.TileLayer) {
        layer.setUrl(newMode 
          ? 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}' 
          : 'https://{s}.basemaps.cartocdn.com/voyager/{z}/{x}/{y}{r}.png'
        );
      }
    });
  };

  const handleDiscoverySearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!discoveryQuery.trim() || !mapRef.current) return;
    
    setIsSearchingDiscovery(true);
    discoveryLayersRef.current?.clearLayers();
    
    try {
      const center = mapRef.current.getCenter();
      const results = await fetchFieldMap(center.lat, center.lng, discoveryQuery);
      setDiscoveryResults(results.sources);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSearchingDiscovery(false);
    }
  };

  const exportGeoJSON = () => {
    const geojson = {
      type: "FeatureCollection",
      features: savedFields.map(f => ({
        type: "Feature",
        properties: { name: f.name, crop: f.cropType, area: f.area, status: f.status },
        geometry: {
          type: "Polygon",
          coordinates: [f.points.map(p => [p[1], p[0]])]
        }
      }))
    };
    const blob = new Blob([JSON.stringify(geojson, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Farm_Registry_Export_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const fetchDetailedPlan = async (field: Field) => {
    if (!field.cropType) {
      alert("Please specify a focus crop for this parcel first.");
      return;
    }
    setAdviceLoading(true);
    try {
      const location = localStorage.getItem('agri_farm_location') || 'Local Farm';
      const advice = await getFertilizerAdvice(field.cropType, location, 'Alluvial', language);
      setDetailedAdvice(advice);
    } catch (err) {
      console.error("Fertilizer strategy retrieval failed:", err);
    } finally {
      setAdviceLoading(false);
    }
  };

  const formatArea = (hectares: number) => {
    const totalAcres = hectares * 2.47105;
    const wholeAcres = Math.floor(totalAcres);
    const gunthas = (totalAcres - wholeAcres) * 40;
    if (wholeAcres === 0) return `${gunthas.toFixed(1)} Gn`;
    return `${wholeAcres} Ac, ${gunthas.toFixed(0)} Gn`;
  };

  const calculateDistance = (p1: [number, number], p2: [number, number]) => {
    return L.latLng(p1).distanceTo(L.latLng(p2));
  };

  React.useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => initMap(pos.coords.latitude, pos.coords.longitude),
      () => initMap(20.5937, 78.9629)
    );
  }, []);

  React.useEffect(() => {
    if (!mapReady || !drawingLayersRef.current || !snapLayersRef.current) return;
    drawingLayersRef.current.clearLayers();
    snapLayersRef.current.clearLayers();
    
    if (snapIndicator) {
      L.circleMarker(snapIndicator.point, { 
        radius: 10, 
        color: '#f97316', 
        weight: 3, 
        fillOpacity: 0.2,
        className: 'animate-pulse'
      }).addTo(snapLayersRef.current);
    }

    if (activeMode === 'Ruler') {
      if (rulerPoints.length > 1) {
        L.polyline(rulerPoints, { color: '#f97316', weight: 4, dashArray: '8, 8' }).addTo(drawingLayersRef.current);
        for(let i=1; i<rulerPoints.length; i++) {
          const dist = calculateDistance(rulerPoints[i-1], rulerPoints[i]);
          L.marker([(rulerPoints[i-1][0]+rulerPoints[i][0])/2, (rulerPoints[i-1][1]+rulerPoints[i][1])/2], {
            icon: L.divIcon({ html: `<div class="bg-stone-900 text-white px-2 py-1 rounded-lg text-[9px] font-black shadow-xl border border-white/20 whitespace-nowrap">${dist.toFixed(1)}m</div>`, className: '' })
          }).addTo(drawingLayersRef.current);
        }
      }
      rulerPoints.forEach(p => L.circleMarker(p, { radius: 5, color: '#f97316', fillOpacity: 1, fillColor: 'white', weight: 2 }).addTo(drawingLayersRef.current!));
    }
    
    if (activeMode === 'Boundary' || activeMode === 'Zone') {
      if (drawingPoints.length > 1) L.polyline(drawingPoints, { color: activeMode === 'Zone' ? '#fbbf24' : 'white', weight: 4, dashArray: '5, 10' }).addTo(drawingLayersRef.current);
      drawingPoints.forEach(p => L.circleMarker(p, { radius: 6, color: activeMode === 'Zone' ? '#fbbf24' : '#10b981', fillOpacity: 1, fillColor: 'white', weight: 2 }).addTo(drawingLayersRef.current!));
    }
    
    tempMarkers.forEach(m => {
       const typeInfo = POI_TYPES.find(t => t.type === m.type) || POI_TYPES[0];
       const statusTheme = POI_STATUS_THEMES[m.status || 'Operational'];
       
       const icon = L.divIcon({ 
         html: `
            <div class="relative flex items-center justify-center">
              <div class="absolute inset-0 rounded-full border-4 ${statusTheme.ring} ${statusTheme.animate} opacity-40"></div>
              <div class="relative w-10 h-10 rounded-2xl border-2 border-white shadow-2xl flex items-center justify-center bg-white" style="color: ${typeInfo.color}">
                 <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                   ${typeInfo.svg}
                 </svg>
              </div>
            </div>
         `,
         className: '', iconSize: [40, 40], iconAnchor: [20, 20]
       });
       L.marker(m.point, { icon }).addTo(drawingLayersRef.current!);
    });
  }, [drawingPoints, tempMarkers, rulerPoints, activeMode, mapReady, snapIndicator]);

  return (
    <div className="min-h-screen bg-stone-50 space-y-0 pb-40 animate-in fade-in duration-700 relative flex flex-col">
      {/* Dramatic Header */}
      <section className="px-6 pt-8 pb-6 bg-stone-950 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12">
          <MapIcon className="w-48 h-48" />
        </div>
        <div className="relative z-10 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" />
            <span className="text-[8px] font-black uppercase tracking-[0.4em] text-amber-500/80">Geospatial Intelligence</span>
          </div>
          <h1 className="text-4xl font-black tracking-tighter uppercase leading-[0.85]">
            Field<br />
            <span className="text-amber-500 italic">Mapper.</span>
          </h1>
          <div className="flex items-center gap-6 pt-2">
            <div className="flex flex-col">
              <span className="text-[7px] font-black text-stone-500 uppercase tracking-widest">Active Parcels</span>
              <span className="text-lg font-black text-white">{savedFields.length}</span>
            </div>
            <div className="w-px h-6 bg-white/10" />
            <div className="flex flex-col">
              <span className="text-[7px] font-black text-stone-500 uppercase tracking-widest">Total Coverage</span>
              <span className="text-lg font-black text-white">
                {formatArea(savedFields.reduce((acc, f) => acc + f.area, 0))}
              </span>
            </div>
          </div>
        </div>
      </section>

      <div className="relative -mt-6 px-4 z-20">
      {contextMenu && (
        <div 
          className="fixed z-[2000] bg-white rounded-2xl shadow-2xl border border-stone-100 p-2 animate-in zoom-in-95"
          style={{ left: `${contextMenu.x}px`, top: `${contextMenu.y}px`, transform: 'translate(-50%, -100%) translateY(-20px)' }}
        >
          <div className="flex items-center gap-1">
             <button onClick={() => setContextMenu(null)} className="p-2 text-stone-400 hover:text-stone-900"><X className="w-4 h-4" /></button>
             {contextMenu.type === 'field' && (
                <div className="flex gap-1">
                  <button onClick={() => { setActiveField(contextMenu.data); setContextMenu(null); }} className="px-4 py-2 bg-orange-50 text-orange-700 rounded-xl font-black text-[10px] uppercase">Analyze</button>
                  <button onClick={() => { 
                    setDrawingPoints(contextMenu.data.points); 
                    setActiveMode('Boundary'); 
                    setContextMenu(null); 
                  }} className="px-4 py-2 bg-stone-900 text-white rounded-xl font-black text-[10px] uppercase">Redraw</button>
                </div>
             )}
             {contextMenu.type === 'poi' && (
                <button onClick={() => { setEditingPOI({ poi: contextMenu.data, fieldId: contextMenu.fieldId }); setContextMenu(null); }} className="px-4 py-2 bg-blue-50 text-blue-700 rounded-xl font-black text-[10px] uppercase">Refine</button>
             )}
          </div>
          <div className="absolute left-1/2 -bottom-2 -translate-x-1/2 w-4 h-4 bg-white border-b border-r border-stone-100 rotate-45" />
        </div>
      )}

      {editingPOI && (
        <div className="fixed inset-0 z-[6000] bg-black/85 backdrop-blur-2xl flex items-center justify-center p-6 animate-in fade-in">
           <div className="bg-white w-full max-w-sm rounded-[3.5rem] p-10 shadow-2xl relative">
              <div className="flex items-center gap-5 mb-10">
                 <div className="p-4 bg-blue-50 rounded-2xl text-blue-600 shadow-inner">
                    <Edit3 className="w-8 h-8" />
                 </div>
                 <div>
                    <h3 className="text-2xl font-black text-stone-900 leading-none">Asset Intel</h3>
                    <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mt-1.5">Configure Marker</p>
                 </div>
              </div>
              <div className="space-y-8 max-h-[60vh] overflow-y-auto no-scrollbar pr-2">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-4">Identifier</label>
                    <input 
                      value={editingPOI.poi.label}
                      onChange={e => setEditingPOI({ ...editingPOI, poi: { ...editingPOI.poi, label: e.target.value } })}
                      className="w-full bg-stone-50 border border-stone-100 p-5 rounded-3xl font-black text-sm outline-none shadow-inner focus:ring-2 focus:ring-blue-500" 
                    />
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-4">Status Severity</label>
                    <div className="grid grid-cols-3 gap-2">
                       {Object.keys(POI_STATUS_THEMES).map(status => (
                         <button 
                           key={status}
                           onClick={() => setEditingPOI({ ...editingPOI, poi: { ...editingPOI.poi, status: status as any } })}
                           className={`py-3 rounded-2xl text-[8px] font-black uppercase tracking-tighter transition-all border-2 ${editingPOI.poi.status === status ? 'bg-stone-900 border-stone-900 text-white' : 'bg-stone-50 border-stone-100 text-stone-400'}`}
                         >
                            {status}
                         </button>
                       ))}
                    </div>
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-4">Asset Type</label>
                    <div className="grid grid-cols-3 gap-2">
                      {POI_TYPES.map(type => (
                        <button 
                          key={type.type}
                          onClick={() => setEditingPOI({ ...editingPOI, poi: { ...editingPOI.poi, type: type.type } })}
                          className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all ${editingPOI.poi.type === type.type ? 'bg-stone-900 border-stone-900 text-white shadow-xl scale-105' : 'bg-stone-50 border-stone-100 text-stone-400'}`}
                        >
                          <div dangerouslySetInnerHTML={{ __html: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">${type.svg}</svg>` }} />
                          <span className="text-[7px] font-black uppercase tracking-tighter">{type.label}</span>
                        </button>
                      ))}
                    </div>
                 </div>
              </div>
              <div className="mt-8 flex gap-3">
                 <button onClick={() => setEditingPOI(null)} className="flex-1 py-4 bg-stone-100 text-stone-400 rounded-2xl font-black text-[10px] uppercase tracking-widest">Cancel</button>
                 <button onClick={() => handlePOISave(editingPOI.poi)} className="flex-[2] bg-stone-900 text-white font-black py-4 rounded-2xl shadow-xl active:scale-95">Finalize</button>
              </div>
           </div>
        </div>
      )}

        <div className="bg-stone-900 rounded-[2.5rem] overflow-hidden border-4 border-stone-900 shadow-2xl relative h-[480px] ring-1 ring-white/10">
          <div ref={mapContainerRef} className="w-full h-full z-0 grayscale-[0.2] contrast-[1.1]" />
          
          {/* Drawing Instructions Overlay */}
          <AnimatePresence>
            {activeMode !== 'Navigate' && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="absolute top-24 left-1/2 -translate-x-1/2 z-[1000] pointer-events-none"
              >
                <div className="bg-stone-950/90 backdrop-blur-xl px-6 py-3 rounded-2xl border border-white/10 shadow-2xl flex items-center gap-4 ring-1 ring-white/5">
                  <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center shadow-lg">
                    <MousePointer2 className="w-4 h-4 text-stone-950" />
                  </div>
                  <div>
                    <p className="text-[8px] font-black text-amber-500 uppercase tracking-widest leading-none mb-1">Drawing Active: {activeMode}</p>
                    <p className="text-[10px] font-black text-white uppercase tracking-tight">Click on the map to define points</p>
                  </div>
                  <button 
                    onClick={() => { setActiveMode('Navigate'); setDrawingPoints([]); }}
                    className="pointer-events-auto ml-2 p-2 bg-white/10 hover:bg-rose-500/20 text-white/60 hover:text-rose-500 rounded-xl transition-all"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Hardware Style Controls */}
          <div className="absolute top-6 inset-x-6 z-[1000] pointer-events-none flex justify-between items-start gap-4">
             <div className="flex flex-col gap-3 pointer-events-auto w-72">
                <div className="bg-stone-950/90 backdrop-blur-xl p-3 rounded-2xl border border-white/10 flex items-center gap-4 shadow-2xl">
                   <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/20">
                     <Compass className="w-5 h-5 text-stone-950" />
                   </div>
                   <div className="flex-1">
                      <p className="text-[7px] font-black uppercase text-amber-500 tracking-[0.2em] leading-none mb-1">Navigation Module</p>
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                        <span className="text-[10px] font-black text-white uppercase tracking-widest">System Online</span>
                      </div>
                   </div>
                </div>

                <form onSubmit={handlePincodeSearch} className="flex gap-2">
                  <div className="relative flex-1 group">
                    <input 
                      type="text" 
                      placeholder="LOCATE PINCODE..." 
                      value={pincode}
                      onChange={(e) => setPincode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      className="w-full bg-stone-950/90 backdrop-blur-xl border border-white/10 rounded-xl px-4 py-3 text-[10px] font-mono text-amber-500 placeholder:text-stone-600 outline-none focus:border-amber-500 transition-all shadow-2xl"
                    />
                    {isSearchingPincode && <Loader2 className="absolute right-3 top-3 w-4 h-4 text-amber-500 animate-spin" />}
                  </div>
                  <button type="submit" className="bg-amber-500 text-stone-950 p-3 rounded-xl hover:bg-amber-400 transition-all shadow-lg active:scale-90">
                    <Search className="w-5 h-5" />
                  </button>
                </form>
             </div>
             
             <div className="flex flex-col gap-2 pointer-events-auto">
                <ControlBtn 
                  active={snappingEnabled} 
                  onClick={() => setSnappingEnabled(!snappingEnabled)} 
                  icon={Magnet} 
                  label="Snap"
                />
                <ControlBtn 
                  active={isSatellite} 
                  onClick={toggleSatellite} 
                  icon={isSatellite ? Layers : Satellite} 
                  label="View"
                />
                <ControlBtn 
                  active={showLabels} 
                  onClick={() => setShowLabels(!showLabels)} 
                  icon={showLabels ? Eye : EyeOff} 
                  label="Tags"
                />
             </div>
          </div>

          {/* Bottom Toolbar - Hardware Style */}
          <div className="absolute bottom-8 inset-x-8 z-[1000] pointer-events-none flex flex-col items-center gap-6">
             {stats && (
               <motion.div 
                 initial={{ opacity: 0, y: 20 }}
                 animate={{ opacity: 1, y: 0 }}
                 className="bg-stone-950/95 backdrop-blur-2xl px-8 py-4 rounded-[2rem] border border-white/10 flex items-center gap-8 shadow-2xl ring-1 ring-white/5"
               >
                 {'area' in stats && (
                   <>
                     <div className="flex flex-col">
                       <span className="text-[8px] font-black text-amber-500 uppercase tracking-[0.3em] mb-1">Telemetry: Area</span>
                       <span className="text-lg font-mono text-white tracking-tighter">{formatArea(stats.area)}</span>
                     </div>
                     <div className="w-px h-8 bg-white/10" />
                     <div className="flex flex-col">
                       <span className="text-[8px] font-black text-amber-500 uppercase tracking-[0.3em] mb-1">Telemetry: Perimeter</span>
                       <span className="text-lg font-mono text-white tracking-tighter">{stats.perimeter.toFixed(1)}m</span>
                     </div>
                   </>
                 )}
                 {'distance' in stats && (
                   <div className="flex flex-col">
                     <span className="text-[8px] font-black text-amber-500 uppercase tracking-[0.3em] mb-1">Telemetry: Distance</span>
                     <span className="text-lg font-mono text-white tracking-tighter">{stats.distance.toFixed(1)}m</span>
                   </div>
                 )}
               </motion.div>
             )}

             <div className="bg-stone-950/90 backdrop-blur-2xl p-2 rounded-[2.5rem] border border-white/10 flex items-center gap-1 pointer-events-auto shadow-2xl ring-1 ring-white/5">
                <ModeBtn id="Navigate" icon={MousePointer2} active={activeMode === 'Navigate'} onClick={setActiveMode} />
                <div className="w-px h-6 bg-white/10 mx-1" />
                <ModeBtn id="Draw" icon={PenTool} active={activeMode === 'Boundary'} onClick={() => { setActiveMode('Boundary'); setDrawingPoints([]); }} />
                <ModeBtn id="Zone" icon={Layers} active={activeMode === 'Zone'} onClick={() => { setActiveMode('Zone'); setDrawingPoints([]); }} />
                <ModeBtn id="Asset" icon={MapPinned} active={activeMode === 'Asset'} onClick={setActiveMode} />
                <ModeBtn id="Ruler" icon={Ruler} active={activeMode === 'Ruler'} onClick={() => { setActiveMode('Ruler'); setRulerPoints([]); }} />
                
                {(drawingPoints.length > 0 || rulerPoints.length > 0) && (
                   <div className="flex items-center gap-1 ml-2 pl-2 border-l border-white/10">
                     <button onClick={undoDrawingPoint} className="p-3 text-stone-500 hover:text-amber-500 transition-colors"><RefreshCw className="w-4 h-4 -scale-x-100"/></button>
                     <button onClick={clearDrawing} className="p-3 text-stone-500 hover:text-rose-500 transition-colors"><Trash2 className="w-4 h-4"/></button>
                   </div>
                )}
                
                {(drawingPoints.length >= 3 || tempMarkers.length > 0) && activeMode !== 'Navigate' && (
                   <motion.button 
                     initial={{ scale: 0.9, opacity: 0 }}
                     animate={{ scale: 1, opacity: 1 }}
                     whileHover={{ scale: 1.05 }}
                     whileTap={{ scale: 0.95 }}
                     onClick={() => activeMode === 'Zone' ? setShowZoneModal(true) : setShowSaveModal(true)} 
                     className="bg-amber-500 text-stone-950 px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] ml-3 transition-all shadow-lg shadow-amber-500/40 animate-pulse"
                   >
                     Commit & Save
                   </motion.button>
                )}
             </div>
          </div>
        </div>
      </div>

      {/* Registry - Technical Data Grid Style */}
      <section className="px-6 py-8 space-y-6">
        <div className="flex items-end justify-between border-b-2 border-stone-200 pb-3">
           <div>
              <h2 className="text-3xl font-black text-stone-950 tracking-tighter uppercase leading-none">Registry.</h2>
              <p className="text-[9px] text-stone-400 font-black uppercase tracking-[0.4em] mt-1.5">Geospatial Asset Database</p>
           </div>
           <div className="flex items-center gap-3">
             <button 
               onClick={() => {
                 setActiveMode('Boundary');
                 setDrawingPoints([]);
                 if (mapContainerRef.current) {
                   mapContainerRef.current.scrollIntoView({ behavior: 'smooth' });
                 }
               }}
               className="flex items-center gap-2 px-4 py-2 bg-amber-500 rounded-xl text-[10px] font-black uppercase tracking-widest text-stone-950 hover:bg-amber-400 transition-all shadow-lg shadow-amber-500/20"
             >
               <Plus className="w-4 h-4" /> Draw New Parcel
             </button>
             <button onClick={exportGeoJSON} className="flex items-center gap-2 px-3 py-1.5 bg-stone-100 rounded-lg text-[9px] font-black uppercase tracking-widest text-stone-600 hover:bg-stone-200 transition-all">
               <Download className="w-3.5 h-3.5" /> Export
             </button>
             <div className="p-3 bg-amber-500 rounded-xl shadow-xl shadow-amber-500/20"><Activity className="w-5 h-5 text-stone-950" /></div>
           </div>
        </div>

        {savedFields.length === 0 ? (
          <div className="py-20 text-center border-2 border-dashed border-stone-200 rounded-[2.5rem] bg-stone-50/50">
             <div className="flex flex-col items-center gap-4 opacity-20">
               <MapPinned className="w-12 h-12 text-stone-400" />
               <p className="text-[10px] font-black uppercase tracking-[0.5em] text-stone-500">Awaiting Parcel Definitions</p>
             </div>
          </div>
        ) : (
          <div className="space-y-3">
             {/* Column Headers - Editorial Style */}
             <div className="grid grid-cols-[1fr_100px_100px_70px] px-6 text-[9px] font-serif italic text-stone-400 uppercase tracking-widest">
               <span>Parcel Identity</span>
               <span>Focus Crop</span>
               <span>Coverage</span>
               <span className="text-right">Status</span>
             </div>

             <div className="space-y-2">
               {savedFields.map(field => {
                  const isActive = activeField?.id === field.id;
                  const statusInfo = STATUS_CONFIG[field.status || 'Active'];
                  return (
                    <motion.div 
                      key={field.id} 
                      layout
                      className={`group relative bg-white border-2 transition-all rounded-[1.5rem] overflow-hidden ${isActive ? 'border-amber-500 shadow-xl' : 'border-stone-100 hover:border-stone-200 shadow-sm'}`}
                    >
                       <div className="grid grid-cols-[1fr_100px_100px_70px] items-center p-4 cursor-pointer" onClick={() => { setActiveField(field); if(mapRef.current) mapRef.current.fitBounds(L.latLngBounds(field.points), { padding: [50, 50] }); }}>
                          <div className="flex items-center gap-4">
                             <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-inner relative" style={{ background: `${field.color}15`, color: field.color }}>
                                <Target className="w-5 h-5" />
                                <div className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-white rounded-full border-2 border-current flex items-center justify-center">
                                  <div className="w-1 h-1 bg-current rounded-full" />
                                </div>
                             </div>
                             <div>
                                <h4 className="font-black text-stone-950 text-base tracking-tighter uppercase leading-none">{field.name}</h4>
                                <p className="text-[7px] font-mono text-stone-400 uppercase mt-1 tracking-widest">ID: {field.id.slice(-8)}</p>
                             </div>
                          </div>
                          
                          <div className="text-xs font-black text-stone-600 uppercase tracking-tight">
                            {field.cropType || '---'}
                          </div>

                          <div className="text-xs font-mono text-stone-900 font-black">
                            {formatArea(field.area)}
                          </div>

                          <div className="flex justify-end">
                            <span className={`text-[7px] font-black uppercase px-2 py-0.5 rounded-full ${statusInfo.bg} ${statusInfo.text} border border-current/10`}>
                              {field.status}
                            </span>
                          </div>
                       </div>

                       <AnimatePresence mode="wait">
                         {isActive && (
                           <motion.div 
                             initial={{ height: 0, opacity: 0 }}
                             animate={{ height: 'auto', opacity: 1 }}
                             exit={{ height: 0, opacity: 0 }}
                             className="border-t-2 border-stone-50 bg-stone-50/50"
                           >
                             <div className="p-8 grid grid-cols-1 md:grid-cols-3 gap-8">
                                <div className="space-y-4">
                                   <p className="text-[10px] font-black text-stone-400 uppercase tracking-[0.3em]">Spatial Metrics</p>
                                   <div className="grid grid-cols-2 gap-4">
                                      <div className="bg-white p-4 rounded-2xl border border-stone-100 shadow-sm">
                                         <p className="text-[8px] font-black text-stone-400 uppercase mb-1">Perimeter</p>
                                         <p className="text-lg font-mono font-black text-stone-950">{(field.perimeter || 0).toFixed(0)}m</p>
                                      </div>
                                      <div className="bg-white p-4 rounded-2xl border border-stone-100 shadow-sm">
                                         <p className="text-[8px] font-black text-stone-400 uppercase mb-1">Points</p>
                                         <p className="text-lg font-mono font-black text-stone-950">{field.points.length}</p>
                                      </div>
                                   </div>
                                </div>

                                <div className="space-y-4">
                                   <p className="text-[10px] font-black text-stone-400 uppercase tracking-[0.3em]">Infrastructure</p>
                                   <div className="flex flex-wrap gap-2">
                                      {(field.markers || []).map(m => (
                                        <div key={m.id} className="bg-white px-3 py-2 rounded-xl border border-stone-100 shadow-sm flex items-center gap-2">
                                          <div className="w-2 h-2 rounded-full bg-amber-500" />
                                          <span className="text-[9px] font-black uppercase text-stone-600">{m.label}</span>
                                        </div>
                                      ))}
                                      {(field.markers || []).length === 0 && <p className="text-[10px] italic text-stone-400">No assets registered</p>}
                                   </div>
                                </div>

                                <div className="space-y-4">
                                   <p className="text-[10px] font-black text-stone-400 uppercase tracking-[0.3em]">Operations</p>
                                   <div className="flex flex-col gap-2">
                                      <button onClick={() => fetchDetailedPlan(field)} disabled={adviceLoading} className="w-full bg-stone-950 text-white p-4 rounded-2xl flex items-center justify-between group active:scale-95 transition-all shadow-xl">
                                         <div className="flex items-center gap-3">
                                            <div className="p-2 bg-amber-500 rounded-xl text-stone-950">
                                               {adviceLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ClipboardList className="w-4 h-4" />}
                                            </div>
                                            <span className="text-[10px] font-black uppercase tracking-widest">Protocol Engine</span>
                                         </div>
                                         <ChevronRight className="w-4 h-4 text-stone-600 group-hover:text-amber-400" />
                                      </button>
                                      <div className="flex gap-2">
                                        <button className="flex-1 py-3 bg-white border border-stone-200 rounded-xl text-[9px] font-black uppercase text-stone-400 hover:text-rose-500 hover:border-rose-200 transition-all" onClick={() => { if(confirm("Delete parcel?")) setSavedFields(savedFields.filter(f => f.id !== field.id)); }}>Delete</button>
                                        <button className="flex-1 py-3 bg-white border border-stone-200 rounded-xl text-[9px] font-black uppercase text-stone-400 hover:text-amber-500 hover:border-amber-200 transition-all">Edit</button>
                                      </div>
                                   </div>
                                </div>
                             </div>
                           </motion.div>
                         )}
                       </AnimatePresence>
                    </motion.div>
                  );
               })}
             </div>
          </div>
        )}
      </section>

      {showZoneModal && (
        <div className="fixed inset-0 z-[4000] bg-black/80 backdrop-blur-xl flex items-center justify-center p-6 animate-in fade-in">
           <div className="bg-white w-full max-w-sm rounded-[3.5rem] p-10 shadow-2xl relative">
              <h3 className="text-3xl font-black text-stone-900 tracking-tighter mb-8 leading-none">Define Zone</h3>
              <div className="space-y-6">
                 <div className="space-y-1">
                    <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-4">Zone Label</label>
                    <input 
                      value={zoneFormData.label} 
                      onChange={e => setZoneFormData({...zoneFormData, label: e.target.value})} 
                      placeholder="e.g. High Moisture Area" 
                      className="w-full bg-stone-50 border border-stone-100 p-5 rounded-3xl font-bold text-sm outline-none" 
                    />
                 </div>
                 <div className="space-y-1">
                    <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-4">Zone Type</label>
                    <div className="grid grid-cols-2 gap-2">
                       {ZONE_TYPES.map(z => (
                         <button 
                           key={z.type}
                           onClick={() => setZoneFormData({...zoneFormData, type: z.type})}
                           className={`flex items-center gap-2 p-3 rounded-2xl border-2 transition-all ${zoneFormData.type === z.type ? 'bg-stone-900 border-stone-900 text-white' : 'bg-stone-50 border-stone-100 text-stone-400'}`}
                         >
                            <z.icon className="w-4 h-4" />
                            <span className="text-[8px] font-black uppercase tracking-tighter">{z.label}</span>
                         </button>
                       ))}
                    </div>
                 </div>
                 <div className="space-y-1">
                    <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-4">Zone Color</label>
                    <div className="flex gap-2 p-3 bg-stone-50 rounded-3xl border border-stone-100 justify-between">
                       {ZONE_COLORS.map(c => (
                         <button 
                           key={c} 
                           onClick={() => setZoneFormData({...zoneFormData, color: c})} 
                           className={`w-8 h-8 rounded-full border-2 transition-all ${zoneFormData.color === c ? 'border-stone-900 scale-110 shadow-md' : 'border-transparent'}`} 
                           style={{ background: c }} 
                         />
                       ))}
                    </div>
                 </div>
                 <div className="space-y-1">
                    <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-4">Notes</label>
                    <textarea 
                      value={zoneFormData.notes} 
                      onChange={e => setZoneFormData({...zoneFormData, notes: e.target.value})} 
                      placeholder="Special instructions..." 
                      className="w-full bg-stone-50 border border-stone-100 p-5 rounded-3xl font-bold text-sm outline-none h-24 resize-none" 
                    />
                 </div>
                 <div className="flex gap-3 pt-6">
                    <button onClick={() => setShowZoneModal(false)} className="px-6 py-4 bg-stone-100 text-stone-500 font-black rounded-2xl text-[10px] uppercase tracking-widest">Back</button>
                    <button onClick={() => {
                      if (!activeField) {
                        alert("Please select a field first to attach this zone.");
                        return;
                      }
                      const typeInfo = ZONE_TYPES.find(z => z.type === zoneFormData.type)!;
                      const newZone = {
                        id: Date.now().toString(),
                        type: zoneFormData.type,
                        label: zoneFormData.label || typeInfo.label,
                        points: drawingPoints,
                        color: zoneFormData.color,
                        notes: zoneFormData.notes
                      };
                      
                      const updatedFields = savedFields.map(f => {
                        if (f.id === activeField.id) {
                          return { ...f, zones: [...(f.zones || []), newZone] };
                        }
                        return f;
                      });
                      
                      setSavedFields(updatedFields);
                      localStorage.setItem('agri_saved_fields', JSON.stringify(updatedFields));
                      setDrawingPoints([]); 
                      setActiveMode('Navigate'); 
                      setShowZoneModal(false);
                      setZoneFormData({ label: '', type: 'Irrigation', color: ZONE_COLORS[0], notes: '' });
                    }} className="flex-1 bg-stone-900 text-white font-black py-4 rounded-2xl shadow-xl flex items-center justify-center gap-2"><CheckCircle2 className="w-5 h-5 text-emerald-400"/> Attach Zone</button>
                 </div>
              </div>
           </div>
        </div>
      )}

      {showSaveModal && (
        <div className="fixed inset-0 z-[4000] bg-black/80 backdrop-blur-xl flex items-center justify-center p-6 animate-in fade-in">
           <div className="bg-white w-full max-w-sm rounded-[3.5rem] p-10 shadow-2xl relative">
              <h3 className="text-3xl font-black text-stone-900 tracking-tighter mb-8 leading-none">Register Plot</h3>
              <div className="space-y-6">
                 <div className="space-y-1">
                    <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-4">Parcel Identifier</label>
                    <input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g. North Ridge" className="w-full bg-stone-50 border border-stone-100 p-5 rounded-3xl font-bold text-sm outline-none" />
                 </div>
                 <div className="space-y-1">
                    <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-4">Focus Crop</label>
                    <input value={formData.crop} onChange={e => setFormData({...formData, crop: e.target.value})} placeholder="e.g. Basmati Rice" className="w-full bg-stone-50 border border-stone-100 p-5 rounded-3xl font-bold text-sm outline-none" />
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                       <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-4">Current Status</label>
                       <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value as any})} className="w-full bg-stone-50 border border-stone-100 p-5 rounded-3xl font-black text-[10px] uppercase outline-none">
                          <option>Active</option><option>Fallow</option><option>Harvested</option><option>Prepping</option>
                       </select>
                    </div>
                    <div className="space-y-1">
                       <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-4">Color ID</label>
                       <div className="flex gap-2 p-1 bg-stone-50 rounded-2xl border border-stone-100 justify-between">
                          {FIELD_COLORS.slice(0, 4).map(c => (
                            <button key={c} onClick={() => setFormData({...formData, color: c})} className={`w-7 h-7 rounded-full border-2 transition-all ${formData.color === c ? 'border-stone-900 scale-110 shadow-md' : 'border-transparent'}`} style={{ background: c }} />
                          ))}
                       </div>
                    </div>
                 </div>
                 <div className="flex gap-3 pt-6">
                    <button onClick={() => setShowSaveModal(false)} className="px-6 py-4 bg-stone-100 text-stone-500 font-black rounded-2xl text-[10px] uppercase tracking-widest">Back</button>
                    <button onClick={() => {
                      const areaHectares = (L as any).GeometryUtil.geodesicArea(drawingPoints.map(p => L.latLng(p))) / 10000;
                      const perimeter = drawingPoints.reduce((acc, p, i) => acc + (i > 0 ? calculateDistance(drawingPoints[i-1], p) : 0), 0);
                      const newField: Field = {
                        id: Date.now().toString(),
                        name: formData.name || `Parcel ${savedFields.length + 1}`,
                        cropType: formData.crop,
                        points: drawingPoints,
                        markers: tempMarkers,
                        area: areaHectares,
                        perimeter,
                        createdAt: new Date().toISOString(),
                        color: formData.color,
                        status: formData.status
                      };
                      setSavedFields([newField, ...savedFields]);
                      localStorage.setItem('agri_saved_fields', JSON.stringify([newField, ...savedFields]));
                      setDrawingPoints([]); setTempMarkers([]); setActiveMode('Navigate'); setShowSaveModal(false);
                    }} className="flex-1 bg-stone-900 text-white font-black py-4 rounded-2xl shadow-xl flex items-center justify-center gap-2"><CheckCircle2 className="w-5 h-5 text-emerald-400"/> Confirm</button>
                 </div>
              </div>
           </div>
        </div>
      )}

      {detailedAdvice && (
        <div className="fixed inset-0 z-[5000] bg-stone-950/90 backdrop-blur-2xl flex flex-col animate-in slide-in-from-bottom-full duration-500">
           <header className="p-8 flex items-center justify-between border-b border-white/5">
              <div className="flex items-center gap-5">
                 <div className="p-4 bg-amber-500 rounded-2xl"><FileBadge className="w-7 h-7 text-stone-950" /></div>
                 <div>
                    <h2 className="text-2xl font-black text-white leading-none">Field Protocol</h2>
                    <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest mt-2">AI Agronomy Report</p>
                 </div>
              </div>
              <button onClick={() => setDetailedAdvice(null)} className="p-4 bg-white/10 text-white rounded-full"><X className="w-6 h-6" /></button>
           </header>
           <main className="flex-1 overflow-y-auto p-8 custom-scrollbar">
              <div className="max-w-3xl mx-auto space-y-8">
                 <div className="bg-white/5 border border-white/10 p-10 rounded-[3rem] shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-10 opacity-[0.03] rotate-12"><Sprout className="w-64 h-64" /></div>
                    <div className="relative z-10">
                       <h3 className="text-emerald-400 font-black text-[11px] uppercase tracking-[0.3em] mb-8 flex items-center gap-3">
                          <Target className="w-5 h-5" /> Biological Objectives
                       </h3>
                       <p className="text-white text-2xl font-black leading-tight mb-8">{detailedAdvice.cropRequirements}</p>
                       <div className="h-px bg-white/10 mb-8" />
                       <p className="text-stone-300 text-sm font-medium leading-relaxed italic">{detailedAdvice.soilAdjustments}</p>
                    </div>
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-20">
                    {detailedAdvice.fertilizers.map((f, i) => (
                      <div key={i} className="bg-white p-8 rounded-[2.5rem] shadow-lg flex flex-col justify-between group hover:shadow-2xl transition-all">
                         <div className="space-y-6">
                            <div className="flex justify-between items-start">
                               <div className="p-4 bg-stone-50 rounded-2xl"><Box className="w-7 h-7 text-stone-400" /></div>
                               <span className="bg-stone-900 text-white px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest">{f.npk}</span>
                            </div>
                            <div>
                               <h4 className="text-xl font-black text-stone-900 mb-2">{f.name}</h4>
                               <p className="text-sm font-medium text-stone-500 leading-relaxed italic">"{f.description}"</p>
                            </div>
                         </div>
                      </div>
                    ))}
                 </div>
              </div>
           </main>
        </div>
      )}
    </div>
  );
};

const ModeBtn: React.FC<{ id: any, icon: any, active: boolean, onClick: (m: any) => void }> = ({ id, icon: Icon, active, onClick }) => (
  <button
    onClick={() => onClick(id)}
    className={`w-12 h-12 rounded-2xl flex flex-col items-center justify-center transition-all gap-0.5 ${active ? 'bg-amber-500 text-stone-950 shadow-xl scale-110' : 'text-white/40 hover:text-white'}`}
  >
    <Icon className="w-5 h-5" />
    <span className="text-[7px] font-black uppercase tracking-tighter">{id}</span>
  </button>
);

export default FieldMap;