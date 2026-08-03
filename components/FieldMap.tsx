import React from 'react';
import { getFertilizerAdvice, fetchFieldMap, analyzeFieldBoundary } from '../services/geminiService';
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
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ArrowUp,
  ArrowDown,
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
  Footprints,
  Wand2,
  Grid,
  Sparkles,
  Maximize2,
  Crosshair,
  ArrowUpRight,
  Settings2,
  Magnet,
  Share2,
  FileText
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { motion, AnimatePresence } from 'motion/react';
import L from 'leaflet';
import { db, auth } from '../src/firebase';
import { signInAnonymously } from 'firebase/auth';
import { collection, query, onSnapshot, addDoc, updateDoc, deleteDoc, doc, orderBy, setDoc, serverTimestamp } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../src/utils/firestoreErrorHandler';
import { useFirebase } from '../src/components/FirebaseProvider';

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
    type: 'Gate', label: 'Entry Gate', color: '#a8a29e',
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
  'Active': { color: '#10b981', bg: 'bg-emerald-500/10', text: 'text-emerald-400' },
  'Fallow': { color: '#FEB47B', bg: 'bg-orange-500/10', text: 'text-orange-400' },
  'Harvested': { color: '#FFD194', bg: 'bg-amber-500/10', text: 'text-amber-400' },
  'Prepping': { color: '#FF9A8B', bg: 'bg-rose-500/10', text: 'text-rose-400' }
};

const POI_STATUS_THEMES: Record<string, { ring: string, animate: string, label: string, badge: string }> = {
  'Operational': { ring: 'border-emerald-500', animate: '', label: 'Operational', badge: 'bg-emerald-500' },
  'Maintenance': { ring: 'border-amber-400', animate: 'animate-pulse', label: 'Needs Maint.', badge: 'bg-amber-500' },
  'Critical': { ring: 'border-rose-500', animate: 'animate-ping', label: 'Critical Issue', badge: 'bg-rose-500' }
};

const INDIAN_STATE_COORDINATES: Record<string, { lat: number; lon: number }> = {
  'andhra pradesh': { lat: 15.9129, lon: 79.7400 },
  'telangana': { lat: 18.1124, lon: 79.0193 },
  'maharashtra': { lat: 19.7515, lon: 75.7139 },
  'karnataka': { lat: 15.3173, lon: 75.7139 },
  'tamil nadu': { lat: 11.1271, lon: 78.6569 },
  'kerala': { lat: 10.8505, lon: 76.2711 },
  'gujarat': { lat: 22.2587, lon: 71.1924 },
  'rajasthan': { lat: 27.0238, lon: 74.2179 },
  'madhya pradesh': { lat: 22.9734, lon: 78.6569 },
  'uttar pradesh': { lat: 26.8467, lon: 80.9462 },
  'bihar': { lat: 25.0961, lon: 85.3131 },
  'west bengal': { lat: 22.9868, lon: 87.8550 },
  'punjab': { lat: 31.1471, lon: 75.3412 },
  'haryana': { lat: 29.0588, lon: 76.0856 },
  'himachal pradesh': { lat: 31.1048, lon: 77.1734 },
  'jammu and kashmir': { lat: 33.7782, lon: 76.5762 },
  'odisha': { lat: 20.9517, lon: 85.0985 },
  'assam': { lat: 26.2006, lon: 92.9376 },
  'chhattisgarh': { lat: 21.2787, lon: 81.8661 },
  'jharkhand': { lat: 23.6913, lon: 85.2722 },
  'uttarakhand': { lat: 30.0668, lon: 79.0193 },
  'delhi': { lat: 28.6139, lon: 77.2090 },
};

const getPincodeFallbackCoords = (pincodeStr: string) => {
  if (!pincodeStr || pincodeStr.length < 1) return null;
  const zone = pincodeStr[0];
  switch (zone) {
    case '1': return { lat: 30.12, lon: 76.53 };
    case '2': return { lat: 26.85, lon: 80.94 };
    case '3': return { lat: 25.10, lon: 73.50 };
    case '4': return { lat: 19.75, lon: 75.71 };
    case '5': return { lat: 15.00, lon: 78.00 };
    case '6': return { lat: 10.50, lon: 77.50 };
    case '7': return { lat: 23.50, lon: 87.50 };
    case '8': return { lat: 24.50, lon: 85.00 };
    default: return null;
  }
};

const getProfileFallbackCoords = (): { lat: number; lon: number } | null => {
  const state = (localStorage.getItem("agri_state") || "").trim().toLowerCase();
  if (!state) return null;
  if (INDIAN_STATE_COORDINATES[state]) {
    return INDIAN_STATE_COORDINATES[state];
  }
  for (const key of Object.keys(INDIAN_STATE_COORDINATES)) {
    if (state.includes(key) || key.includes(state)) {
      return INDIAN_STATE_COORDINATES[key];
    }
  }
  return null;
};

interface SnapResult {
  point: { lat: number; lng: number };
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
    className={`w-11 h-11 rounded-2xl shadow-lg border flex flex-col items-center justify-center transition-all active:scale-90 ${
      active 
        ? 'bg-amber-500 text-stone-950 border-amber-400' 
        : 'bg-stone-900/90 backdrop-blur-md text-stone-300 border-stone-800 hover:text-white'
    }`}
  >
    <Icon className="w-4 h-4" />
    <span className="text-[8px] font-bold uppercase tracking-tight mt-0.5">{label}</span>
  </button>
);

const formatArea = (hectares: number) => {
  const totalAcres = hectares * 2.47105;
  const wholeAcres = Math.floor(totalAcres);
  const gunthas = (totalAcres - wholeAcres) * 40;
  if (wholeAcres === 0) return `${gunthas.toFixed(1)} Gn`;
  return `${wholeAcres} Ac, ${gunthas.toFixed(0)} Gn`;
};

const calculateArea = (points: { lat: number; lng: number }[]) => {
  if (points.length < 3) return 0;
  const avgLat = points.reduce((s, p) => s + p.lat, 0) / points.length;
  const latFactor = 111132.92;
  const lonFactor = 111319.49 * Math.cos(avgLat * Math.PI / 180);
  let area = 0;
  for (let i = 0; i < points.length; i++) {
    const p1 = points[i];
    const p2 = points[(i + 1) % points.length];
    area += ((p1.lng * lonFactor) * (p2.lat * latFactor) - (p2.lng * lonFactor) * (p1.lat * latFactor));
  }
  return Math.abs(area / 2);
};

const calculateDistance = (p1: { lat: number; lng: number }, p2: { lat: number; lng: number }) => {
  return L.latLng(p1).distanceTo(L.latLng(p2));
};

const calculateBearing = (p1: { lat: number; lng: number }, p2: { lat: number; lng: number }) => {
  const dLng = (p2.lng - p1.lng) * Math.PI / 180;
  const lat1 = p1.lat * Math.PI / 180;
  const lat2 = p2.lat * Math.PI / 180;
  const y = Math.sin(dLng) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
  let brng = Math.atan2(y, x) * 180 / Math.PI;
  return (brng + 360) % 360;
};

const straightenPolygon = (points: { lat: number; lng: number }[]) => {
  if (points.length < 3) return points;
  const avgLat = points.reduce((s, p) => s + p.lat, 0) / points.length;
  const avgLng = points.reduce((s, p) => s + p.lng, 0) / points.length;
  const latFactor = 111132.92;
  const lonFactor = 111319.49 * Math.cos(avgLat * Math.PI / 180);

  const localMeters = points.map(p => ({
    x: (p.lng - avgLng) * lonFactor,
    y: (p.lat - avgLat) * latFactor
  }));

  const cleanedMeters = localMeters.map(m => ({ ...m }));
  for (let i = 0; i < cleanedMeters.length; i++) {
    const prev = cleanedMeters[(i - 1 + cleanedMeters.length) % cleanedMeters.length];
    const curr = cleanedMeters[i];
    const next = cleanedMeters[(i + 1) % cleanedMeters.length];

    const dx1 = curr.x - prev.x;
    const dy1 = curr.y - prev.y;
    const dx2 = next.x - curr.x;
    const dy2 = next.y - curr.y;

    const angle1 = Math.atan2(dy1, dx1) * 180 / Math.PI;
    const angle2 = Math.atan2(dy2, dx2) * 180 / Math.PI;
    let diff = Math.abs(angle2 - angle1);
    if (diff > 180) diff = 360 - diff;

    if (diff >= 70 && diff <= 110) {
      const perpAngle = angle1 + (angle2 > angle1 ? 90 : -90);
      const rad = perpAngle * Math.PI / 180;
      const len2 = Math.hypot(dx2, dy2);
      next.x = curr.x + Math.cos(rad) * len2;
      next.y = curr.y + Math.sin(rad) * len2;
    }
  }

  return cleanedMeters.map(m => ({
    lat: avgLat + (m.y / latFactor),
    lng: avgLng + (m.x / lonFactor)
  }));
};

const FieldMap = ({ language, onBack }: { language: string, onBack: () => void }) => {
  const { activeFarmId } = useFirebase();
  const [isSatellite, setIsSatellite] = React.useState(true);
  const [activeMode, setActiveMode] = React.useState<'Navigate' | 'Boundary' | 'WalkTrace' | 'Asset' | 'Ruler' | 'Zone' | 'Discovery'>('Navigate');
  const [isWalkTracing, setIsWalkTracing] = React.useState(false);
  const [walkStats, setWalkStats] = React.useState<{ accuracy: number; distance: number; speed: number; count: number } | null>(null);
  const [userGpsLocation, setUserGpsLocation] = React.useState<{ lat: number; lng: number } | null>(null);
  const [showPresetModal, setShowPresetModal] = React.useState(false);
  const [showLabels, setShowLabels] = React.useState(true);
  const [snappingEnabled, setSnappingEnabled] = React.useState(true);
  const [mobileTab, setMobileTab] = React.useState<'map' | 'parcels' | 'khasra' | 'export'>('map');
  const [showSearchInput, setShowSearchInput] = React.useState(false);

  const [drawingPoints, setDrawingPoints] = React.useState<{ lat: number; lng: number }[]>([]);
  const [tempMarkers, setTempMarkers] = React.useState<FieldPOI[]>([]);
  const [tempZones, setTempZones] = React.useState<any[]>([]);
  const [rulerPoints, setRulerPoints] = React.useState<{ lat: number; lng: number }[]>([]);
  const [discoveryQuery, setDiscoveryQuery] = React.useState('');
  const [discoveryResults, setDiscoveryResults] = React.useState<GroundingChunk[]>([]);
  const [fieldAnalysis, setFieldAnalysis] = React.useState<{ fieldId: string, report: string } | null>(null);
  const [isAnalyzingField, setIsAnalyzingField] = React.useState(false);
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

  // Indian Land Khasra Record State
  const [khasraDetails, setKhasraDetails] = React.useState(() => {
    try {
      return JSON.parse(localStorage.getItem('agri_khasra_survey_records') || '{}');
    } catch {
      return {};
    }
  });

  const registryRef = React.useRef<HTMLElement>(null);
  const hasCenteredOnFields = React.useRef(false);

  const [formData, setFormData] = React.useState({
    name: '',
    crop: '',
    status: 'Active' as Field['status'],
    color: FIELD_COLORS[0],
    khasraNo: '',
    subDivision: ''
  });

  const [zoneFormData, setZoneFormData] = React.useState({
    label: '',
    type: 'Irrigation' as any,
    color: ZONE_COLORS[0],
    notes: ''
  });

  const [savedFields, setSavedFields] = React.useState<Field[]>([]);
  const [loading, setLoading] = React.useState(true);

  const [confirmDialog, setConfirmDialog] = React.useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    type: 'danger' | 'info';
  }>({ isOpen: false, title: '', message: '', onConfirm: () => {}, type: 'info' });

  const [alertDialog, setAlertDialog] = React.useState<{
    isOpen: boolean;
    title: string;
    message: string;
  }>({ isOpen: false, title: '', message: '' });

  React.useEffect(() => {
    const effectiveFarmId = activeFarmId || auth.currentUser?.uid || localStorage.getItem('agri_simulated_uid') || 'demo_user_123';

    const path = `users/${effectiveFarmId}/fields`;
    const q = query(collection(db, path), orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fields: Field[] = [];
      snapshot.forEach((doc) => {
        fields.push({ id: doc.id, ...doc.data() } as Field);
      });
      setSavedFields(fields);
      try {
        localStorage.setItem('agri_cached_fields', JSON.stringify(fields));
      } catch (e) {}
      setLoading(false);
    }, (error) => {
      console.warn("Firestore subscription error, loading cached fields:", error);
      try {
        const cached = localStorage.getItem('agri_cached_fields');
        if (cached) {
          setSavedFields(JSON.parse(cached));
        }
      } catch (e) {}
      setLoading(false);
    });

    return () => unsubscribe();
  }, [activeFarmId]);

  const mapRef = React.useRef<L.Map | null>(null);
  const mapContainerRef = React.useRef<HTMLDivElement>(null);
  const fieldLayersRef = React.useRef<L.FeatureGroup | null>(null);
  const drawingLayersRef = React.useRef<L.FeatureGroup | null>(null);
  const discoveryLayersRef = React.useRef<L.FeatureGroup | null>(null);
  const snapLayersRef = React.useRef<L.FeatureGroup | null>(null);

  const stateRef = React.useRef({ activeMode, drawingPoints, savedFields, mapReady, rulerPoints, snappingEnabled, snapIndicator, discoveryResults });
  React.useEffect(() => {
    stateRef.current = { activeMode, drawingPoints, savedFields, mapReady, rulerPoints, snappingEnabled, snapIndicator, discoveryResults };
  }, [activeMode, drawingPoints, savedFields, mapReady, rulerPoints, snappingEnabled, snapIndicator, discoveryResults]);

  const findSnapPoint = (latlng: L.LatLng): SnapResult | null => {
    const { snappingEnabled: enabled, savedFields: fields, drawingPoints: current } = stateRef.current;
    if (!enabled) return null;

    const threshold = 15; // pixels
    let best: SnapResult | null = null;
    let minDist = threshold;

    fields.forEach(f => {
      f.points.forEach(p => {
        if (!mapRef.current) return;
        const d = mapRef.current.latLngToContainerPoint(latlng).distanceTo(mapRef.current.latLngToContainerPoint(L.latLng(p)));
        if (d < minDist) {
          minDist = d;
          best = { point: p, type: 'Boundary', label: f.name };
        }
      });
    });

    current.forEach(p => {
      if (!mapRef.current) return;
      const d = mapRef.current.latLngToContainerPoint(latlng).distanceTo(mapRef.current.latLngToContainerPoint(L.latLng(p)));
      if (d < minDist) {
        minDist = d;
        best = { point: p, type: 'Boundary', label: 'Current Path' };
      }
    });

    return best;
  };

  const undoDrawingPoint = () => {
    if (activeMode === 'Boundary' || activeMode === 'Zone' || activeMode === 'WalkTrace') {
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
    setIsWalkTracing(false);
    setWalkStats(null);
  };

  const createQuickPresetPlot = (acres: number) => {
    if (!mapRef.current) return;
    const center = mapRef.current.getCenter();
    const sideMeters = Math.sqrt(acres * 4046.86);
    const latFactor = 111132.92;
    const lonFactor = 111319.49 * Math.cos(center.lat * Math.PI / 180);

    const halfLat = (sideMeters / 2) / latFactor;
    const halfLng = (sideMeters / 2) / lonFactor;

    const points = [
      { lat: center.lat + halfLat, lng: center.lng - halfLng },
      { lat: center.lat + halfLat, lng: center.lng + halfLng },
      { lat: center.lat - halfLat, lng: center.lng + halfLng },
      { lat: center.lat - halfLat, lng: center.lng - halfLng },
    ];

    setDrawingPoints(points);
    setActiveMode('Boundary');
    setShowPresetModal(false);
  };

  const handleAIStraighten = () => {
    if (drawingPoints.length < 3) return;
    const cleaned = straightenPolygon(drawingPoints);
    setDrawingPoints(cleaned);
  };

  React.useEffect(() => {
    if (!isWalkTracing) return;
    if (!navigator.geolocation) {
      alert('GPS Geolocation is not supported on this device.');
      setIsWalkTracing(false);
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude, accuracy, speed } = pos.coords;
        const newPt = { lat: latitude, lng: longitude };
        setUserGpsLocation(newPt);

        if (mapRef.current) {
          mapRef.current.panTo([latitude, longitude]);
        }

        setDrawingPoints(prev => {
          if (prev.length === 0) return [newPt];
          const lastPt = prev[prev.length - 1];
          const dist = calculateDistance(lastPt, newPt);
          if (dist >= 3.5) {
            const totalDist = prev.reduce((acc, p, i) => acc + (i > 0 ? calculateDistance(prev[i-1], p) : 0), 0) + dist;
            setWalkStats({
              accuracy: Math.round(accuracy),
              distance: Math.round(totalDist),
              speed: Math.round((speed || 0) * 3.6),
              count: prev.length + 1
            });
            return [...prev, newPt];
          } else {
            const totalDist = prev.reduce((acc, p, i) => acc + (i > 0 ? calculateDistance(prev[i-1], p) : 0), 0);
            setWalkStats({
              accuracy: Math.round(accuracy),
              distance: Math.round(totalDist),
              speed: Math.round((speed || 0) * 3.6),
              count: prev.length
            });
            return prev;
          }
        });
      },
      (err) => {
        console.warn("GPS Walk trace error:", err);
      },
      { enableHighAccuracy: true, maximumAge: 1000, timeout: 10000 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [isWalkTracing]);

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
        const fallback = getPincodeFallbackCoords(pincode);
        if (fallback && mapRef.current) {
          mapRef.current.setView([fallback.lat, fallback.lon], 13);
          setPincodeError('Exact pincode not found; showing region');
        } else {
          setPincodeError('Location not found');
        }
      }
    } catch (err) {
      console.error(err);
      const fallback = getPincodeFallbackCoords(pincode);
      if (fallback && mapRef.current) {
        mapRef.current.setView([fallback.lat, fallback.lon], 13);
        setPincodeError('Offline/Network block: showing region');
      } else {
        setPincodeError('Search failed (Offline)');
      }
    } finally {
      setIsSearchingPincode(false);
    }
  };

  const getResilientPosition = (
    onSuccess: (lat: number, lon: number) => void,
    onFailure: (err?: any) => void
  ) => {
    if (!('geolocation' in navigator)) {
      onFailure('Geolocation not supported');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => onSuccess(pos.coords.latitude, pos.coords.longitude),
      (err) => {
        console.warn("High accuracy GPS lookup failed, attempting low accuracy fallback", err);
        navigator.geolocation.getCurrentPosition(
          (pos) => onSuccess(pos.coords.latitude, pos.coords.longitude),
          (err2) => {
            console.warn("Low accuracy GPS lookup failed, falling back", err2);
            onFailure(err2);
          },
          { enableHighAccuracy: false, timeout: 6000, maximumAge: 600000 }
        );
      },
      { enableHighAccuracy: true, timeout: 4000, maximumAge: 60000 }
    );
  };

  const recenterMap = () => {
    setIsSearchingPincode(true);
    getResilientPosition(
      (lat, lon) => {
        if (mapRef.current) {
          mapRef.current.setView([lat, lon], 17);
        }
        setIsSearchingPincode(false);
      },
      () => {
        setIsSearchingPincode(false);
        const state = localStorage.getItem("agri_state") || "";
        const district = localStorage.getItem("agri_district") || "";
        const mandal = localStorage.getItem("agri_mandal") || "";
        const village = localStorage.getItem("agri_revenue_village") || "";
        
        const locFallback = getProfileFallbackCoords();
        const queryParts = [village, mandal, district, state, "India"].filter(Boolean);
        if (queryParts.length > 1) {
          const searchStr = queryParts.join(", ");
          fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchStr)}&limit=1`)
            .then(res => res.json())
            .then(data => {
              if (data && data.length > 0 && mapRef.current) {
                const { lat, lon } = data[0];
                mapRef.current.setView([parseFloat(lat), parseFloat(lon)], 15);
              } else if (locFallback && mapRef.current) {
                mapRef.current.setView([locFallback.lat, locFallback.lon], 12);
              } else {
                setAlertDialog({
                  isOpen: true,
                  title: 'GPS Offline',
                  message: 'Unable to fix location. Please enter a pincode or verify your GPS settings.'
                });
              }
            })
            .catch(() => {
              if (locFallback && mapRef.current) {
                mapRef.current.setView([locFallback.lat, locFallback.lon], 12);
              } else {
                setAlertDialog({
                  isOpen: true,
                  title: 'GPS Offline',
                  message: 'Unable to fix location. Please enter a pincode or verify your GPS settings.'
                });
              }
            });
        } else {
          if (locFallback && mapRef.current) {
            mapRef.current.setView([locFallback.lat, locFallback.lon], 12);
          } else {
            setAlertDialog({
              isOpen: true,
              title: 'GPS Offline',
              message: 'Unable to fix location. Please search using a pincode or configure your profile location.'
            });
          }
        }
      }
    );
  };

  const getDrawingStats = () => {
    if ((activeMode === 'Boundary' || activeMode === 'Zone' || activeMode === 'WalkTrace') && drawingPoints.length > 2) {
      const area = calculateArea(drawingPoints) / 10000;
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
      const { activeMode: mode, snapIndicator: snap, drawingPoints: currentPoints } = stateRef.current;
      const pt: { lat: number; lng: number } = snap ? snap.point : { lat: e.latlng.lat, lng: e.latlng.lng };
      
      if (mode === 'Boundary' || mode === 'Zone') {
        if (currentPoints.length >= 3) {
          const firstPt = currentPoints[0];
          const dist = calculateDistance(pt, firstPt);
          if (dist < 10) {
            if (mode === 'Boundary') setShowSaveModal(true);
            else setShowZoneModal(true);
            return;
          }
        }
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
        
        if (activeField) {
          setEditingPOI({ poi: newAsset, fieldId: activeField.id });
        } else {
          setTempMarkers(prev => [...prev, newAsset]);
          setEditingPOI({ poi: newAsset });
        }
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
          fillOpacity: 0.35, 
          weight: 3 
        }).addTo(fieldLayersRef.current!);
        
        if (showLabels) {
          poly.bindTooltip(`${field.name}<br/>${formatArea(field.area)}`, { 
            permanent: true, 
            direction: 'center',
            className: 'bg-stone-900/90 text-white border border-stone-700 shadow-xl px-2 py-1 rounded-lg text-[10px] font-bold uppercase'
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
              <div class="relative w-9 h-9 rounded-2xl border-2 border-white shadow-2xl flex items-center justify-center bg-stone-900 text-white transition-all transform hover:scale-110" style="color: ${typeInfo.color}">
                 <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                   ${typeInfo.svg}
                 </svg>
                 <div class="absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${statusTheme.badge} shadow-sm"></div>
              </div>
            </div>
          `,
          className: '', iconSize: [36, 36], iconAnchor: [18, 18]
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

  const handlePOISave = async (updatedPOI: FieldPOI) => {
    const effectiveFarmId = activeFarmId || auth.currentUser?.uid || localStorage.getItem('agri_simulated_uid') || 'demo_user_123';
    if (!auth.currentUser) {
      try { await signInAnonymously(auth); } catch (e) {}
    }

    if (editingPOI?.fieldId) {
      const path = `users/${effectiveFarmId}/fields/${editingPOI.fieldId}`;
      const field = savedFields.find(f => f.id === editingPOI.fieldId);
      if (field) {
        const existingMarkerIdx = (field.markers || []).findIndex(m => m.id === updatedPOI.id);
        let updatedMarkers = [...(field.markers || [])];
        
        if (existingMarkerIdx > -1) {
          updatedMarkers[existingMarkerIdx] = updatedPOI;
        } else {
          updatedMarkers.push(updatedPOI);
        }

        try {
          await updateDoc(doc(db, path), { markers: updatedMarkers });
        } catch (error) {
          console.warn("Update POI in Firestore failed, applying locally:", error);
        }
        setSavedFields(prev => prev.map(f => f.id === editingPOI.fieldId ? { ...f, markers: updatedMarkers } : f));
      }
    } else {
      setTempMarkers(prev => prev.map(m => m.id === updatedPOI.id ? updatedPOI : m));
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

  const handleFieldAnalysis = async (field: Field) => {
    setIsAnalyzingField(true);
    try {
      const report = await analyzeFieldBoundary(field.points, field.name, language);
      setFieldAnalysis({ fieldId: field.id, report });
    } catch (err) {
      console.error("Analysis failed", err);
    } finally {
      setIsAnalyzingField(false);
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
          coordinates: [f.points.map(p => [p.lng, p.lat])]
        }
      }))
    };
    const blob = new Blob([JSON.stringify(geojson, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `BharatKisan_FieldRegistry_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const shareParcelWhatsApp = (field: Field) => {
    const text = `🌾 *Bharat Kisan Land Parcel Details* (${field.name})\n\n📏 Coverage: ${formatArea(field.area)}\n🌱 Crop: ${field.cropType || 'N/A'}\n📍 Status: ${field.status}\n\n_Shared via Bharat Kisan Smart Farming Companion_`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
  };

  const fetchDetailedPlan = async (field: Field) => {
    if (!field.cropType) {
      setAlertDialog({
        isOpen: true,
        title: 'Missing Crop Name',
        message: 'Please specify a target crop for this parcel first.'
      });
      return;
    }
    setAdviceLoading(true);
    try {
      const location = localStorage.getItem('agri_farm_location') || 'Local Farm';
      const advice = await getFertilizerAdvice(field.cropType, location, 'Alluvial', language);
      setDetailedAdvice(advice);
      
      if (activeFarmId) {
        const path = `users/${activeFarmId}/fields/${field.id}`;
        try {
          await updateDoc(doc(db, path), {
            lastAdvice: advice,
            updatedAt: serverTimestamp()
          });
        } catch (error) {
          handleFirestoreError(error, OperationType.UPDATE, path);
        }
      }
    } catch (err) {
      console.error("Fertilizer strategy retrieval failed:", err);
    } finally {
      setAdviceLoading(false);
    }
  };

  React.useEffect(() => {
    if (loading) return;

    getResilientPosition(
      (lat, lon) => initMap(lat, lon),
      () => {
        const state = localStorage.getItem("agri_state") || "";
        const district = localStorage.getItem("agri_district") || "";
        const mandal = localStorage.getItem("agri_mandal") || "";
        const village = localStorage.getItem("agri_revenue_village") || "";
        
        const locFallback = getProfileFallbackCoords();
        const queryParts = [village, mandal, district, state, "India"].filter(Boolean);
        if (queryParts.length > 1) {
          const searchStr = queryParts.join(", ");
          fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchStr)}&limit=1`)
            .then(res => res.json())
            .then(data => {
              if (data && data.length > 0) {
                const { lat, lon } = data[0];
                initMap(parseFloat(lat), parseFloat(lon));
              } else if (locFallback) {
                initMap(locFallback.lat, locFallback.lon);
              } else {
                initMap(20.5937, 78.9629);
              }
            })
            .catch(() => {
              if (locFallback) {
                initMap(locFallback.lat, locFallback.lon);
              } else {
                initMap(20.5937, 78.9629);
              }
            });
        } else {
          if (locFallback) {
            initMap(locFallback.lat, locFallback.lon);
          } else {
            initMap(20.5937, 78.9629);
          }
        }
      }
    );

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [loading]);

  React.useEffect(() => {
    if (!mapReady || !mapRef.current || !mapContainerRef.current) return;
    
    const resizeObserver = new ResizeObserver(() => {
      if (mapRef.current) {
        mapRef.current.invalidateSize();
      }
    });
    
    resizeObserver.observe(mapContainerRef.current);
    
    return () => {
      resizeObserver.disconnect();
    };
  }, [mapReady]);

  React.useEffect(() => {
    if (mapReady && mapRef.current && savedFields.length > 0 && !hasCenteredOnFields.current) {
      hasCenteredOnFields.current = true;
      try {
        const bounds = L.latLngBounds([]);
        savedFields.forEach(f => {
          if (f.points && f.points.length > 0) {
            f.points.forEach(p => bounds.extend(p));
          }
        });
        if (bounds.isValid()) {
          mapRef.current.fitBounds(bounds, { padding: [40, 40], maxZoom: 18 });
        }
      } catch (err) {
        console.error("Error fitting bounds to saved fields:", err);
      }
    }
  }, [mapReady, savedFields]);

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
          L.marker([(rulerPoints[i-1].lat + rulerPoints[i].lat) / 2, (rulerPoints[i-1].lng + rulerPoints[i].lng) / 2], {
            icon: L.divIcon({ html: `<div class="bg-stone-900 text-white px-2 py-1 rounded-lg text-[9px] font-black shadow-xl border border-white/20 whitespace-nowrap">${dist.toFixed(1)}m</div>`, className: '' })
          }).addTo(drawingLayersRef.current);
        }
      }
      rulerPoints.forEach(p => L.circleMarker(p, { radius: 5, color: '#f97316', fillOpacity: 1, fillColor: 'white', weight: 2 }).addTo(drawingLayersRef.current!));
    }
    
    if (activeMode === 'Boundary' || activeMode === 'Zone' || activeMode === 'WalkTrace') {
      const polyColor = activeMode === 'Zone' ? '#fbbf24' : (activeMode === 'WalkTrace' ? '#06b6d4' : '#10b981');
      
      if (drawingPoints.length > 1) {
        if (drawingPoints.length >= 3) {
          L.polygon(drawingPoints, { 
            color: polyColor, 
            fillColor: polyColor,
            fillOpacity: 0.25, 
            weight: 3, 
            dashArray: '6, 6' 
          }).addTo(drawingLayersRef.current!);

          const avgLat = drawingPoints.reduce((s, p) => s + p.lat, 0) / drawingPoints.length;
          const avgLng = drawingPoints.reduce((s, p) => s + p.lng, 0) / drawingPoints.length;
          const areaHectares = calculateArea(drawingPoints) / 10000;

          L.marker([avgLat, avgLng], {
            icon: L.divIcon({
              html: `<div class="bg-stone-900/95 text-amber-400 px-2.5 py-1 rounded-xl text-[10px] font-black shadow-2xl border border-amber-500/40 whitespace-nowrap flex items-center gap-1">✨ ${formatArea(areaHectares)}</div>`,
              className: ''
            })
          }).addTo(drawingLayersRef.current!);
        } else {
          L.polyline(drawingPoints, { color: polyColor, weight: 3, dashArray: '5, 8' }).addTo(drawingLayersRef.current!);
        }

        for (let i = 1; i < drawingPoints.length; i++) {
          const p1 = drawingPoints[i - 1];
          const p2 = drawingPoints[i];
          const dist = calculateDistance(p1, p2);
          const bearing = Math.round(calculateBearing(p1, p2));
          const midLat = (p1.lat + p2.lat) / 2;
          const midLng = (p1.lng + p2.lng) / 2;

          L.marker([midLat, midLng], {
            icon: L.divIcon({
              html: `<div class="bg-stone-950/90 text-stone-200 px-2 py-0.5 rounded-lg text-[8px] font-bold border border-stone-700 shadow-md whitespace-nowrap">${dist.toFixed(1)}m · ${bearing}°</div>`,
              className: ''
            })
          }).addTo(drawingLayersRef.current!);
        }
      }

      drawingPoints.forEach((p, idx) => {
        L.circleMarker(p, { 
          radius: 7, 
          color: polyColor, 
          fillOpacity: 1, 
          fillColor: '#ffffff', 
          weight: 3 
        }).addTo(drawingLayersRef.current!);

        L.marker(p, {
          icon: L.divIcon({
            html: `<div class="w-4 h-4 bg-stone-950 text-emerald-400 text-[8px] font-black rounded-full flex items-center justify-center border border-emerald-500 shadow -translate-x-2 -translate-y-2">#${idx + 1}</div>`,
            className: ''
          })
        }).addTo(drawingLayersRef.current!);
      });
    }

    if (userGpsLocation || isWalkTracing) {
      if (userGpsLocation) {
        const gpsIcon = L.divIcon({
          html: `
            <div class="relative flex items-center justify-center">
              <div class="absolute inset-0 w-8 h-8 rounded-full bg-cyan-500/40 animate-ping"></div>
              <div class="w-4 h-4 rounded-full bg-cyan-400 border-2 border-white shadow-xl"></div>
            </div>
          `,
          className: '', iconSize: [32, 32], iconAnchor: [16, 16]
        });
        L.marker([userGpsLocation.lat, userGpsLocation.lng], { icon: gpsIcon }).addTo(drawingLayersRef.current!);
      }
    }

    if (discoveryResults.length > 0) {
      discoveryResults.forEach(async (result) => {
        if (result.maps?.title) {
          let exists = false;
          discoveryLayersRef.current?.eachLayer((layer: any) => {
            if (layer.options?.title === result.maps?.title) exists = true;
          });
          if (exists) return;

          try {
            const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(result.maps.title)}&limit=1`);
            const data = await response.json();
            if (data && data.length > 0 && discoveryLayersRef.current) {
              const { lat, lon } = data[0];
              const marker = L.marker([parseFloat(lat), parseFloat(lon)], {
                title: result.maps.title,
                icon: L.divIcon({
                  html: `
                    <div class="relative flex items-center justify-center">
                      <div class="absolute inset-0 rounded-full bg-amber-500 animate-ping opacity-20"></div>
                      <div class="relative w-8 h-8 rounded-xl border-2 border-white shadow-2xl flex items-center justify-center bg-amber-500 text-stone-950">
                         <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
                      </div>
                    </div>
                  `,
                  className: '', iconSize: [32, 32], iconAnchor: [16, 16]
                })
              }).addTo(discoveryLayersRef.current);
              
              marker.bindPopup(`
                <div class="p-3 bg-white rounded-xl">
                  <h3 class="font-black text-[10px] uppercase text-stone-900 mb-2 tracking-tight">${result.maps.title}</h3>
                  <a href="${result.maps.uri}" target="_blank" class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 text-stone-950 rounded-lg text-[8px] font-black uppercase tracking-widest no-underline">
                    View on Maps
                  </a>
                </div>
              `, { className: 'custom-popup' });
            }
          } catch (err) {
            console.error("Geocoding failed", err);
          }
        }
      });
    }
    
    tempMarkers.forEach(m => {
       const typeInfo = POI_TYPES.find(t => t.type === m.type) || POI_TYPES[0];
       const statusTheme = POI_STATUS_THEMES[m.status || 'Operational'];
       
       const icon = L.divIcon({ 
         html: `
            <div class="relative flex items-center justify-center">
              <div class="absolute inset-0 rounded-full border-4 ${statusTheme.ring} ${statusTheme.animate} opacity-40"></div>
              <div class="relative w-9 h-9 rounded-2xl border-2 border-white shadow-2xl flex items-center justify-center bg-white" style="color: ${typeInfo.color}">
                 <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                   ${typeInfo.svg}
                 </svg>
              </div>
            </div>
         `,
         className: '', iconSize: [36, 36], iconAnchor: [18, 18]
       });
       L.marker(m.point, { icon }).addTo(drawingLayersRef.current!);
    });
  }, [drawingPoints, tempMarkers, rulerPoints, activeMode, mapReady, snapIndicator, discoveryResults]);

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-950 flex flex-col items-center justify-center gap-4 text-white">
        <Loader2 className="w-10 h-10 animate-spin text-amber-500" />
        <p className="text-xs font-bold text-stone-400 uppercase tracking-widest">Loading Field GIS Engine...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-950 text-white flex flex-col pb-28">
      {/* Android Top Navigation Header */}
      <header className="sticky top-0 z-50 bg-stone-950/95 backdrop-blur-md border-b border-stone-800 px-4 py-3 flex items-center justify-between gap-3 shadow-md">
        <div className="flex items-center gap-3">
          <button 
            onClick={onBack}
            className="w-10 h-10 bg-stone-900 border border-stone-800 rounded-xl flex items-center justify-center active:scale-90 transition-all text-stone-300 hover:text-white"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              <h1 className="text-base font-serif font-bold text-white leading-tight">Field Mapper</h1>
            </div>
            <p className="text-[10px] text-stone-400 font-bold uppercase tracking-wider">
              {savedFields.length} Parcels • {formatArea(savedFields.reduce((acc, f) => acc + f.area, 0))} Total
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSearchInput(!showSearchInput)}
            className="p-2.5 bg-stone-900 border border-stone-800 rounded-xl text-stone-300 hover:text-amber-400 active:scale-95 transition-all"
            title="Search Pincode"
          >
            <Search className="w-4 h-4" />
          </button>
          <button
            onClick={recenterMap}
            className="p-2.5 bg-amber-500 text-stone-950 font-bold rounded-xl active:scale-95 transition-all flex items-center gap-1.5 text-xs"
          >
            <Navigation2 className="w-4 h-4" />
            <span className="hidden sm:inline">GPS</span>
          </button>
        </div>
      </header>

      {/* Search Bar Slide Down (Mobile Friendly) */}
      <AnimatePresence>
        {showSearchInput && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-stone-900 border-b border-stone-800 px-4 py-3"
          >
            <form onSubmit={handlePincodeSearch} className="flex gap-2">
              <input 
                type="text" 
                placeholder="Enter 6-digit Indian Pincode (e.g. 500001)..." 
                value={pincode}
                onChange={(e) => setPincode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="flex-1 bg-stone-950 border border-stone-800 rounded-xl px-4 py-2.5 text-xs text-amber-400 placeholder:text-stone-600 outline-none focus:border-amber-500"
              />
              <button 
                type="submit" 
                className="bg-amber-500 text-stone-950 px-4 py-2.5 rounded-xl text-xs font-bold active:scale-95"
              >
                Find
              </button>
            </form>
            {pincodeError && <p className="text-[10px] text-amber-400 mt-1 font-bold">{pincodeError}</p>}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Map Canvas Area */}
      <div className="relative w-full h-[58vh] sm:h-[65vh] bg-stone-900 overflow-hidden">
        <div ref={mapContainerRef} className="w-full h-full z-0" />

        {/* Floating Right Controls (Layer, Snap, Tags, Recenter) */}
        <div className="absolute top-4 right-3 z-[1000] flex flex-col gap-2">
          <ControlBtn 
            active={isSatellite} 
            onClick={toggleSatellite} 
            icon={isSatellite ? Layers : Satellite} 
            label={isSatellite ? "Map" : "Sat"}
          />
          <ControlBtn 
            active={snappingEnabled} 
            onClick={() => setSnappingEnabled(!snappingEnabled)} 
            icon={Magnet} 
            label="Snap"
          />
          <ControlBtn 
            active={showLabels} 
            onClick={() => setShowLabels(!showLabels)} 
            icon={showLabels ? Eye : EyeOff} 
            label="Tags"
          />
          <ControlBtn 
            active={false} 
            onClick={recenterMap} 
            icon={Compass} 
            label="Center"
          />
        </div>

        {/* Top-Left Drawing Telemetry & Overlay Notice */}
        {activeMode !== 'Navigate' && (
          <div className="absolute top-4 left-3 z-[1000] max-w-[240px]">
            <div className="bg-stone-950/90 backdrop-blur-md border border-amber-500/30 px-3.5 py-2 rounded-2xl shadow-xl space-y-1">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">
                  Mode: {activeMode}
                </span>
                <button 
                  onClick={() => { setActiveMode('Navigate'); setDrawingPoints([]); }}
                  className="p-1 text-stone-400 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {stats && (
                <div className="pt-1 border-t border-stone-800 text-xs font-mono text-white flex items-center gap-3">
                  {'area' in stats && (
                    <>
                      <div>
                        <p className="text-[8px] text-stone-400 uppercase">Area</p>
                        <p className="font-bold text-amber-300">{formatArea(stats.area)}</p>
                      </div>
                      <div>
                        <p className="text-[8px] text-stone-400 uppercase">Perimeter</p>
                        <p className="font-bold">{stats.perimeter.toFixed(0)}m</p>
                      </div>
                    </>
                  )}
                  {'distance' in stats && (
                    <div>
                      <p className="text-[8px] text-stone-400 uppercase">Distance</p>
                      <p className="font-bold text-amber-300">{stats.distance.toFixed(1)}m</p>
                    </div>
                  )}
                </div>
              )}

              <p className="text-[9px] text-stone-300 leading-tight">
                {drawingPoints.length >= 3 
                  ? "Tap first point or 'Save' to close polygon" 
                  : "Tap on map to add corner points"}
              </p>
            </div>
          </div>
        )}

        {/* Floating Discovery Search Box */}
        <AnimatePresence>
          {activeMode === 'Discovery' && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute top-4 left-3 right-16 z-[1000]"
            >
              <form onSubmit={handleDiscoverySearch} className="flex gap-2">
                <input 
                  type="text" 
                  placeholder="Search nearby Mandi, Well, Seed shop..." 
                  value={discoveryQuery}
                  onChange={(e) => setDiscoveryQuery(e.target.value)}
                  className="w-full bg-stone-950/90 backdrop-blur-md border border-stone-700 rounded-xl px-3.5 py-2.5 text-xs text-amber-400 placeholder:text-stone-500 outline-none"
                />
                <button type="submit" className="bg-amber-500 text-stone-950 px-3.5 py-2.5 rounded-xl font-bold text-xs">
                  {isSearchingDiscovery ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bottom Floating Mode Selector Bar (Android Optimized Touch Target >= 48px) */}
        <div className="absolute bottom-3 inset-x-3 z-[1000] flex flex-col items-center gap-2">
          {/* Advanced Plot Drawing Technology Toolbar */}
          {(activeMode === 'Boundary' || activeMode === 'Zone' || activeMode === 'WalkTrace') && (
            <motion.div 
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="bg-stone-950/95 backdrop-blur-md p-1.5 rounded-2xl border border-stone-800 shadow-2xl flex items-center gap-1.5 max-w-md w-full justify-around overflow-x-auto"
            >
              <button
                onClick={() => {
                  const nextState = !isWalkTracing;
                  setIsWalkTracing(nextState);
                  if (nextState) {
                    setActiveMode('WalkTrace');
                  } else if (activeMode === 'WalkTrace') {
                    setActiveMode('Boundary');
                  }
                }}
                className={`px-3 py-1.5 rounded-xl flex items-center gap-1.5 text-[10px] font-bold transition-all min-h-[38px] whitespace-nowrap ${
                  isWalkTracing ? 'bg-cyan-500 text-stone-950 shadow-lg animate-pulse' : 'bg-stone-900 text-stone-300 hover:bg-stone-800'
                }`}
              >
                <Footprints className="w-3.5 h-3.5" />
                <span>{isWalkTracing ? 'Walk GPS Tracing...' : 'Walk & Trace GPS'}</span>
              </button>

              <button
                onClick={handleAIStraighten}
                disabled={drawingPoints.length < 3}
                className="px-3 py-1.5 bg-stone-900 hover:bg-stone-800 disabled:opacity-40 text-stone-300 rounded-xl flex items-center gap-1.5 text-[10px] font-bold transition-all min-h-[38px] whitespace-nowrap"
              >
                <Wand2 className="w-3.5 h-3.5 text-amber-400" />
                <span>AI Straighten</span>
              </button>

              <button
                onClick={() => setShowPresetModal(true)}
                className="px-3 py-1.5 bg-stone-900 hover:bg-stone-800 text-stone-300 rounded-xl flex items-center gap-1.5 text-[10px] font-bold transition-all min-h-[38px] whitespace-nowrap"
              >
                <Box className="w-3.5 h-3.5 text-emerald-400" />
                <span>Quick Preset</span>
              </button>
            </motion.div>
          )}

          {/* GPS Walk Telemetry Pill */}
          {isWalkTracing && walkStats && (
            <div className="bg-cyan-950/90 border border-cyan-500/40 px-3 py-1 rounded-xl text-[10px] text-cyan-300 font-mono flex items-center gap-3">
              <span>🎯 GPS Accuracy: ±{walkStats.accuracy}m</span>
              <span>📍 Walked: {walkStats.distance}m</span>
              <span>⚡ Waypoints: {walkStats.count}</span>
            </div>
          )}

          {/* Action buttons when drawing */}
          <div className="flex items-center gap-2">
            {(drawingPoints.length > 0 || rulerPoints.length > 0) && (
              <div className="bg-stone-900/90 backdrop-blur-md px-3 py-1.5 rounded-2xl border border-stone-800 flex items-center gap-2">
                <button 
                  onClick={undoDrawingPoint} 
                  className="p-2 text-stone-300 hover:text-amber-400 text-xs flex items-center gap-1 font-bold"
                >
                  <RefreshCw className="w-3.5 h-3.5 -scale-x-100"/> Undo
                </button>
                <div className="w-px h-4 bg-stone-800" />
                <button 
                  onClick={clearDrawing} 
                  className="p-2 text-stone-300 hover:text-rose-400 text-xs flex items-center gap-1 font-bold"
                >
                  <Trash2 className="w-3.5 h-3.5"/> Clear
                </button>
              </div>
            )}

            {(drawingPoints.length >= 3 || tempMarkers.length > 0) && activeMode !== 'Navigate' && (
              <motion.button 
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                onClick={() => activeMode === 'Zone' ? setShowZoneModal(true) : setShowSaveModal(true)} 
                className="bg-amber-500 text-stone-950 px-5 py-2.5 rounded-2xl font-bold text-xs uppercase tracking-wider shadow-lg flex items-center gap-1.5 active:scale-95"
              >
                <CheckCircle2 className="w-4 h-4" /> Commit & Save
              </motion.button>
            )}
          </div>

          {/* Mode Selector Strip */}
          <div className="w-full max-w-md bg-stone-950/95 backdrop-blur-md p-1.5 rounded-2xl border border-stone-800 flex items-center justify-around shadow-2xl">
            <button
              onClick={() => setActiveMode('Navigate')}
              className={`flex-1 py-2 rounded-xl flex flex-col items-center gap-0.5 text-[9px] font-bold transition-all min-h-[44px] justify-center ${
                activeMode === 'Navigate' ? 'bg-amber-500 text-stone-950' : 'text-stone-400 hover:text-white'
              }`}
            >
              <MousePointer2 className="w-4 h-4" />
              <span>Navigate</span>
            </button>

            <button
              onClick={() => { setActiveMode('Boundary'); setDrawingPoints([]); }}
              className={`flex-1 py-2 rounded-xl flex flex-col items-center gap-0.5 text-[9px] font-bold transition-all min-h-[44px] justify-center ${
                activeMode === 'Boundary' ? 'bg-amber-500 text-stone-950' : 'text-stone-400 hover:text-white'
              }`}
            >
              <PenTool className="w-4 h-4" />
              <span>Draw Plot</span>
            </button>

            <button
              onClick={() => { setActiveMode('Zone'); setDrawingPoints([]); }}
              className={`flex-1 py-2 rounded-xl flex flex-col items-center gap-0.5 text-[9px] font-bold transition-all min-h-[44px] justify-center ${
                activeMode === 'Zone' ? 'bg-amber-500 text-stone-950' : 'text-stone-400 hover:text-white'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Zones</span>
            </button>

            <button
              onClick={() => setActiveMode('Asset')}
              className={`flex-1 py-2 rounded-xl flex flex-col items-center gap-0.5 text-[9px] font-bold transition-all min-h-[44px] justify-center ${
                activeMode === 'Asset' ? 'bg-amber-500 text-stone-950' : 'text-stone-400 hover:text-white'
              }`}
            >
              <MapPinned className="w-4 h-4" />
              <span>Asset Pin</span>
            </button>

            <button
              onClick={() => setActiveMode('Discovery')}
              className={`flex-1 py-2 rounded-xl flex flex-col items-center gap-0.5 text-[9px] font-bold transition-all min-h-[44px] justify-center ${
                activeMode === 'Discovery' ? 'bg-amber-500 text-stone-950' : 'text-stone-400 hover:text-white'
              }`}
            >
              <Search className="w-4 h-4" />
              <span>Nearby</span>
            </button>

            <button
              onClick={() => { setActiveMode('Ruler'); setRulerPoints([]); }}
              className={`flex-1 py-2 rounded-xl flex flex-col items-center gap-0.5 text-[9px] font-bold transition-all min-h-[44px] justify-center ${
                activeMode === 'Ruler' ? 'bg-amber-500 text-stone-950' : 'text-stone-400 hover:text-white'
              }`}
            >
              <Ruler className="w-4 h-4" />
              <span>Ruler</span>
            </button>
          </div>
        </div>
      </div>

      {/* Android Segmented Bottom Tabs */}
      <div className="bg-stone-900 border-t border-b border-stone-800 px-2 flex items-center justify-around">
        <button
          onClick={() => setMobileTab('map')}
          className={`flex-1 py-3 text-xs font-bold flex items-center justify-center gap-1.5 border-b-2 transition-all ${
            mobileTab === 'map' ? 'border-amber-500 text-amber-400' : 'border-transparent text-stone-400'
          }`}
        >
          <Target className="w-4 h-4" />
          <span>My Parcels ({savedFields.length})</span>
        </button>

        <button
          onClick={() => setMobileTab('khasra')}
          className={`flex-1 py-3 text-xs font-bold flex items-center justify-center gap-1.5 border-b-2 transition-all ${
            mobileTab === 'khasra' ? 'border-amber-500 text-amber-400' : 'border-transparent text-stone-400'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Khasra Registry</span>
        </button>

        <button
          onClick={() => setMobileTab('export')}
          className={`flex-1 py-3 text-xs font-bold flex items-center justify-center gap-1.5 border-b-2 transition-all ${
            mobileTab === 'export' ? 'border-amber-500 text-amber-400' : 'border-transparent text-stone-400'
          }`}
        >
          <Download className="w-4 h-4" />
          <span>Export Options</span>
        </button>
      </div>

      {/* TAB 1: PARCELS REGISTRY */}
      {mobileTab === 'map' && (
        <section className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-stone-400 uppercase tracking-widest">
              Registered Land Parcels
            </h3>
            <button 
              onClick={() => {
                setActiveMode('Boundary');
                setDrawingPoints([]);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="flex items-center gap-1.5 bg-amber-500 text-stone-950 px-3 py-1.5 rounded-xl text-xs font-bold active:scale-95 transition-all"
            >
              <Plus className="w-4 h-4" /> Add Plot
            </button>
          </div>

          {savedFields.length === 0 ? (
            <div className="p-8 text-center border border-dashed border-stone-800 rounded-2xl bg-stone-900/40 space-y-2">
              <MapPinned className="w-10 h-10 text-stone-600 mx-auto" />
              <p className="text-xs font-bold text-stone-300">No Land Parcels Mapped Yet</p>
              <p className="text-[10px] text-stone-500">Tap 'Draw Plot' above to start mapping field boundaries on satellite map.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {savedFields.map(field => {
                const isActive = activeField?.id === field.id;
                const statusInfo = STATUS_CONFIG[field.status || 'Active'];
                return (
                  <div
                    key={field.id}
                    className={`bg-stone-900 border rounded-2xl p-4 space-y-3 transition-all ${
                      isActive ? 'border-amber-500 bg-stone-900/90' : 'border-stone-800'
                    }`}
                  >
                    <div 
                      className="flex items-center justify-between cursor-pointer"
                      onClick={() => {
                        setActiveField(field);
                        if (mapRef.current) {
                          mapRef.current.fitBounds(L.latLngBounds(field.points), { padding: [30, 30] });
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-10 h-10 rounded-xl flex items-center justify-center font-bold"
                          style={{ backgroundColor: `${field.color}20`, color: field.color }}
                        >
                          <Target className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-white">{field.name}</h4>
                          <p className="text-[10px] text-stone-400">
                            {field.cropType ? `Crop: ${field.cropType}` : 'No crop specified'} • {field.points.length} boundary points
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <p className="text-sm font-mono font-bold text-amber-400">{formatArea(field.area)}</p>
                        <span className={`inline-block text-[8px] font-bold uppercase px-2 py-0.5 rounded-full ${statusInfo.bg} ${statusInfo.text}`}>
                          {field.status}
                        </span>
                      </div>
                    </div>

                    {/* Quick Actions Bar */}
                    <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-stone-800/80">
                      <button
                        onClick={() => handleFieldAnalysis(field)}
                        disabled={isAnalyzingField}
                        className="flex-1 py-2 px-3 bg-stone-950 hover:bg-stone-800 text-amber-400 border border-stone-800 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-amber-400" /> AI Report
                      </button>

                      <button
                        onClick={() => fetchDetailedPlan(field)}
                        disabled={adviceLoading}
                        className="flex-1 py-2 px-3 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
                      >
                        <ClipboardList className="w-3.5 h-3.5" /> Protocol
                      </button>

                      <button
                        onClick={() => shareParcelWhatsApp(field)}
                        className="p-2 bg-stone-950 text-stone-400 hover:text-emerald-400 border border-stone-800 rounded-xl transition-all"
                        title="Share on WhatsApp"
                      >
                        <Share2 className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => {
                          setConfirmDialog({
                            isOpen: true,
                            title: 'Delete Parcel',
                            message: `Are you sure you want to delete ${field.name}? This action cannot be undone.`,
                            type: 'danger',
                            onConfirm: async () => {
                              const effectiveFarmId = activeFarmId || auth.currentUser?.uid || localStorage.getItem('agri_simulated_uid') || 'demo_user_123';
                              if (!auth.currentUser) {
                                try { await signInAnonymously(auth); } catch (e) {}
                              }
                              const path = `users/${effectiveFarmId}/fields/${field.id}`;
                              try {
                                if (!field.id.startsWith('local_')) {
                                  await deleteDoc(doc(db, path));
                                }
                              } catch (error) {
                                console.warn("Delete parcel error:", error);
                              }
                              setSavedFields(prev => prev.filter(f => f.id !== field.id));
                              if (activeField?.id === field.id) setActiveField(null);
                            }
                          });
                        }}
                        className="p-2 bg-rose-500/10 text-rose-400 hover:bg-rose-500 hover:text-white rounded-xl transition-all"
                        title="Delete Parcel"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* TAB 2: KHASRA / SURVEY NUMBER REGISTRY */}
      {mobileTab === 'khasra' && (
        <section className="p-4 space-y-4">
          <div className="bg-stone-900 border border-stone-800 rounded-2xl p-4 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-amber-500/10 text-amber-400 rounded-xl">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Indian Revenue Land Khasra Logger</h3>
                <p className="text-[10px] text-stone-400">Link survey numbers & Khatoni references to mapped plots.</p>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              {savedFields.length === 0 ? (
                <p className="text-xs text-stone-500 italic">Please draw at least one field plot first to attach survey numbers.</p>
              ) : (
                savedFields.map(field => {
                  const currentKhasra = khasraDetails[field.id] || '';
                  return (
                    <div key={field.id} className="p-3 bg-stone-950 rounded-xl border border-stone-800 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-amber-300">{field.name}</span>
                        <span className="text-[10px] text-stone-500">{formatArea(field.area)}</span>
                      </div>
                      <div className="flex gap-2">
                        <input 
                          type="text" 
                          placeholder="e.g. Khasra 142/3A, Khatauni 88" 
                          value={currentKhasra}
                          onChange={(e) => {
                            const updated = { ...khasraDetails, [field.id]: e.target.value };
                            setKhasraDetails(updated);
                            localStorage.setItem('agri_khasra_survey_records', JSON.stringify(updated));
                          }}
                          className="flex-1 bg-stone-900 border border-stone-800 rounded-lg px-3 py-1.5 text-xs text-stone-200 outline-none focus:border-amber-500"
                        />
                        <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-1.5 rounded-lg flex items-center">
                          Saved
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </section>
      )}

      {/* TAB 3: EXPORT & GEOJSON */}
      {mobileTab === 'export' && (
        <section className="p-4 space-y-4">
          <div className="bg-stone-900 border border-stone-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl">
                <Download className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Geospatial Data Export</h3>
                <p className="text-[10px] text-stone-400">Export field boundaries to standard GeoJSON for GIS software.</p>
              </div>
            </div>

            <button
              onClick={exportGeoJSON}
              className="w-full py-3.5 bg-amber-500 text-stone-950 font-bold rounded-xl text-xs uppercase tracking-wider flex items-center justify-center gap-2 active:scale-95 transition-all shadow-md"
            >
              <Download className="w-4 h-4" /> Download GeoJSON Export
            </button>
          </div>
        </section>
      )}

      {/* CONTEXT MENU MODAL FOR MAP */}
      {contextMenu && (
        <div 
          className="fixed z-[2000] bg-stone-900 rounded-2xl shadow-2xl border border-stone-700 p-2"
          style={{ left: `${contextMenu.x}px`, top: `${contextMenu.y}px`, transform: 'translate(-50%, -100%) translateY(-10px)' }}
        >
          <div className="flex items-center gap-1">
             <button onClick={() => setContextMenu(null)} className="p-2 text-stone-400 hover:text-white"><X className="w-4 h-4" /></button>
             {contextMenu.type === 'field' && (
                <div className="flex gap-1">
                  <button onClick={() => { setActiveField(contextMenu.data); setContextMenu(null); handleFieldAnalysis(contextMenu.data); }} className="px-3 py-1.5 bg-amber-500/20 text-amber-300 rounded-xl font-bold text-xs">AI Report</button>
                  <button onClick={() => { 
                    setDrawingPoints(contextMenu.data.points); 
                    setActiveMode('Boundary'); 
                    setContextMenu(null); 
                  }} className="px-3 py-1.5 bg-amber-500 text-stone-950 rounded-xl font-bold text-xs">Redraw</button>
                </div>
             )}
             {contextMenu.type === 'poi' && (
                <button onClick={() => { setEditingPOI({ poi: contextMenu.data, fieldId: contextMenu.fieldId }); setContextMenu(null); }} className="px-3 py-1.5 bg-amber-500 text-stone-950 rounded-xl font-bold text-xs">Edit Asset</button>
             )}
          </div>
        </div>
      )}

      {/* EDIT ASSET POI MODAL SHEET */}
      <AnimatePresence>
        {editingPOI && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[6000] bg-black/80 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4"
          >
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              className="bg-stone-900 border border-stone-800 w-full max-w-md rounded-t-3xl sm:rounded-3xl p-6 space-y-6 max-h-[85vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between pb-3 border-b border-stone-800">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-amber-500/10 text-amber-400 rounded-xl">
                    <Edit3 className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-bold text-white">Configure Asset Pin</h3>
                </div>
                <button onClick={() => setEditingPOI(null)} className="p-2 text-stone-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4 text-xs">
                <div>
                  <label className="block text-stone-400 font-bold mb-1">Asset Name / Tag</label>
                  <input 
                    value={editingPOI.poi.label}
                    onChange={e => setEditingPOI({ ...editingPOI, poi: { ...editingPOI.poi, label: e.target.value } })}
                    className="w-full bg-stone-950 border border-stone-800 p-3 rounded-xl font-bold text-white outline-none focus:border-amber-500" 
                  />
                </div>

                <div>
                  <label className="block text-stone-400 font-bold mb-1">Status Condition</label>
                  <div className="grid grid-cols-3 gap-2">
                     {Object.keys(POI_STATUS_THEMES).map(status => (
                       <button 
                         key={status}
                         onClick={() => setEditingPOI({ ...editingPOI, poi: { ...editingPOI.poi, status: status as any } })}
                         className={`py-2 rounded-xl text-[10px] font-bold transition-all border ${
                           editingPOI.poi.status === status ? 'bg-amber-500 border-amber-400 text-stone-950' : 'bg-stone-950 border-stone-800 text-stone-400'
                         }`}
                       >
                          {status}
                       </button>
                     ))}
                  </div>
                </div>

                <div>
                  <label className="block text-stone-400 font-bold mb-1">Select Asset Type</label>
                  <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto p-1">
                    {POI_TYPES.map(type => (
                      <button 
                        key={type.type}
                        onClick={() => setEditingPOI({ ...editingPOI, poi: { ...editingPOI.poi, type: type.type } })}
                        className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all ${
                          editingPOI.poi.type === type.type ? 'bg-amber-500/20 border-amber-500 text-amber-300' : 'bg-stone-950 border-stone-800 text-stone-400'
                        }`}
                      >
                        <div dangerouslySetInnerHTML={{ __html: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">${type.svg}</svg>` }} />
                        <span className="text-[9px] font-bold">{type.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button onClick={() => setEditingPOI(null)} className="py-3 px-4 bg-stone-800 text-stone-300 rounded-xl font-bold text-xs">
                  Cancel
                </button>
                <button 
                  onClick={() => handlePOISave(editingPOI.poi)} 
                  className="flex-1 py-3 bg-amber-500 text-stone-950 font-bold rounded-xl text-xs uppercase"
                >
                  Save Asset
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* SAVE FIELD MODAL SHEET */}
      <AnimatePresence>
        {showSaveModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[6000] bg-black/80 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4"
          >
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              className="bg-stone-900 border border-stone-800 w-full max-w-md rounded-t-3xl sm:rounded-3xl p-6 space-y-6"
            >
              <div className="flex items-center justify-between pb-3 border-b border-stone-800">
                <h3 className="text-base font-bold text-white">Register Mapped Plot</h3>
                <button onClick={() => setShowSaveModal(false)} className="p-2 text-stone-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4 text-xs">
                <div>
                  <label className="block text-stone-400 font-bold mb-1">Parcel Name / Identifier</label>
                  <input 
                    value={formData.name} 
                    onChange={e => setFormData({...formData, name: e.target.value})} 
                    placeholder="e.g. North Field / Borwell Plot" 
                    className="w-full bg-stone-950 border border-stone-800 p-3 rounded-xl font-bold text-white outline-none focus:border-amber-500" 
                  />
                </div>

                <div>
                  <label className="block text-stone-400 font-bold mb-1">Target / Focus Crop</label>
                  <input 
                    value={formData.crop} 
                    onChange={e => setFormData({...formData, crop: e.target.value})} 
                    placeholder="e.g. Paddy, Cotton, Wheat" 
                    className="w-full bg-stone-950 border border-stone-800 p-3 rounded-xl font-bold text-white outline-none focus:border-amber-500" 
                  />
                </div>

                <div>
                  <label className="block text-stone-400 font-bold mb-1">Khasra / Survey No (Optional)</label>
                  <input 
                    value={formData.khasraNo} 
                    onChange={e => setFormData({...formData, khasraNo: e.target.value})} 
                    placeholder="e.g. 142/2A or Survey 88" 
                    className="w-full bg-stone-950 border border-stone-800 p-3 rounded-xl font-bold text-white outline-none focus:border-amber-500" 
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-stone-400 font-bold mb-1">Current Status</label>
                    <select 
                      value={formData.status} 
                      onChange={e => setFormData({...formData, status: e.target.value as any})} 
                      className="w-full bg-stone-950 border border-stone-800 p-3 rounded-xl font-bold text-white outline-none"
                    >
                      <option>Active</option>
                      <option>Fallow</option>
                      <option>Harvested</option>
                      <option>Prepping</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-stone-400 font-bold mb-1">Map ID Color</label>
                    <div className="flex gap-2 p-2 bg-stone-950 rounded-xl border border-stone-800 justify-between">
                      {FIELD_COLORS.slice(0, 4).map(c => (
                        <button 
                          key={c} 
                          onClick={() => setFormData({...formData, color: c})} 
                          className={`w-6 h-6 rounded-full border-2 transition-all ${formData.color === c ? 'border-white scale-110' : 'border-transparent'}`} 
                          style={{ background: c }} 
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowSaveModal(false)} className="py-3 px-4 bg-stone-800 text-stone-300 rounded-xl font-bold text-xs">
                  Back
                </button>
                <button 
                  onClick={async () => {
                    if (drawingPoints.length < 3) {
                      setAlertDialog({
                        isOpen: true,
                        title: 'Incomplete Boundary',
                        message: 'Please tap at least 3 corner points on the map to form a plot boundary before saving.'
                      });
                      return;
                    }

                    const effectiveFarmId = activeFarmId || auth.currentUser?.uid || localStorage.getItem('agri_simulated_uid') || 'demo_user_123';
                    if (!auth.currentUser) {
                      try { await signInAnonymously(auth); } catch (e) {}
                    }

                    const areaHectares = calculateArea(drawingPoints) / 10000;
                    const perimeter = drawingPoints.reduce((acc, p, i) => acc + (i > 0 ? calculateDistance(drawingPoints[i-1], p) : 0), 0);
                    
                    const path = `users/${effectiveFarmId}/fields`;
                    const fieldName = formData.name.trim() || `Parcel ${savedFields.length + 1}`;
                    const fieldData = {
                      name: fieldName,
                      cropType: formData.crop.trim(),
                      points: drawingPoints,
                      markers: tempMarkers,
                      area: areaHectares,
                      perimeter,
                      createdAt: new Date().toISOString(),
                      color: formData.color,
                      status: formData.status,
                      khasraNo: formData.khasraNo ? formData.khasraNo.trim() : undefined
                    };

                    try {
                      const docRef = await addDoc(collection(db, path), fieldData);
                      const newFieldWithId = { id: docRef.id, ...fieldData };
                      setSavedFields(prev => {
                        const exists = prev.some(f => f.id === docRef.id);
                        return exists ? prev : [newFieldWithId, ...prev];
                      });
                    } catch (error) {
                      console.warn("Firestore save error, saving locally:", error);
                      const localField = { id: `local_${Date.now()}`, ...fieldData };
                      setSavedFields(prev => [localField, ...prev]);
                    }

                    setDrawingPoints([]); 
                    setTempMarkers([]); 
                    setActiveMode('Navigate'); 
                    setShowSaveModal(false);
                    setFormData({ name: '', crop: '', status: 'Active', color: FIELD_COLORS[0], khasraNo: '', subDivision: '' });
                    
                    setAlertDialog({
                      isOpen: true,
                      title: 'Plot Registered Successfully! 🌾',
                      message: `${fieldName} (${formatArea(areaHectares)}) has been registered to your farm.`
                    });
                  }} 
                  className="flex-1 py-3 bg-amber-500 text-stone-950 font-bold rounded-xl text-xs uppercase flex items-center justify-center gap-1.5 active:scale-95 transition-all"
                >
                  <CheckCircle2 className="w-4 h-4" /> Save Field
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* DEFINE ZONE MODAL SHEET */}
      <AnimatePresence>
        {showZoneModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[6000] bg-black/80 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4"
          >
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              className="bg-stone-900 border border-stone-800 w-full max-w-md rounded-t-3xl sm:rounded-3xl p-6 space-y-6 max-h-[85vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between pb-3 border-b border-stone-800">
                <h3 className="text-base font-bold text-white">Attach Sub-Zone to Parcel</h3>
                <button onClick={() => setShowZoneModal(false)} className="p-2 text-stone-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4 text-xs">
                <div>
                  <label className="block text-stone-400 font-bold mb-1">Zone Label</label>
                  <input 
                    value={zoneFormData.label} 
                    onChange={e => setZoneFormData({...zoneFormData, label: e.target.value})} 
                    placeholder="e.g. High Moisture Area / Drip Sub-line" 
                    className="w-full bg-stone-950 border border-stone-800 p-3 rounded-xl font-bold text-white outline-none focus:border-amber-500" 
                  />
                </div>

                <div>
                  <label className="block text-stone-400 font-bold mb-1">Zone Type</label>
                  <div className="grid grid-cols-2 gap-2">
                     {ZONE_TYPES.map(z => (
                       <button 
                         key={z.type}
                         onClick={() => setZoneFormData({...zoneFormData, type: z.type})}
                         className={`flex items-center gap-2 p-2.5 rounded-xl border transition-all ${
                           zoneFormData.type === z.type ? 'bg-amber-500/20 border-amber-500 text-amber-300' : 'bg-stone-950 border-stone-800 text-stone-400'
                         }`}
                       >
                          <z.icon className="w-4 h-4" />
                          <span className="text-[10px] font-bold">{z.label}</span>
                       </button>
                     ))}
                  </div>
                </div>

                <div>
                  <label className="block text-stone-400 font-bold mb-1">Zone Color</label>
                  <div className="flex gap-2 p-2 bg-stone-950 rounded-xl border border-stone-800 justify-between">
                     {ZONE_COLORS.map(c => (
                       <button 
                         key={c} 
                         onClick={() => setZoneFormData({...zoneFormData, color: c})} 
                         className={`w-6 h-6 rounded-full border-2 transition-all ${zoneFormData.color === c ? 'border-white scale-110' : 'border-transparent'}`} 
                         style={{ background: c }} 
                       />
                     ))}
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowZoneModal(false)} className="py-3 px-4 bg-stone-800 text-stone-300 rounded-xl font-bold text-xs">
                  Back
                </button>
                <button 
                  onClick={async () => {
                    if (!activeField) {
                      setAlertDialog({
                        isOpen: true,
                        title: 'Select Field First',
                        message: 'Please tap a parcel on the map to select it before attaching a zone.'
                      });
                      return;
                    }

                    if (drawingPoints.length < 3) {
                      setAlertDialog({
                        isOpen: true,
                        title: 'Incomplete Zone',
                        message: 'Please tap at least 3 points on the map to define the zone boundary.'
                      });
                      return;
                    }

                    const effectiveFarmId = activeFarmId || auth.currentUser?.uid || localStorage.getItem('agri_simulated_uid') || 'demo_user_123';
                    if (!auth.currentUser) {
                      try { await signInAnonymously(auth); } catch (e) {}
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
                    
                    const path = `users/${effectiveFarmId}/fields/${activeField.id}`;
                    const updatedZones = [...(activeField.zones || []), newZone];
                    try {
                      if (!activeField.id.startsWith('local_')) {
                        await updateDoc(doc(db, path), { zones: updatedZones });
                      }
                    } catch (error) {
                      console.warn("Zone update error in Firestore:", error);
                    }
                    setSavedFields(prev => prev.map(f => f.id === activeField.id ? { ...f, zones: updatedZones } : f));
                    setDrawingPoints([]); 
                    setActiveMode('Navigate'); 
                    setShowZoneModal(false);
                    setZoneFormData({ label: '', type: 'Irrigation', color: ZONE_COLORS[0], notes: '' });
                    setAlertDialog({
                      isOpen: true,
                      title: 'Zone Attached 📍',
                      message: `New ${newZone.label} attached to ${activeField.name}.`
                    });
                  }} 
                  className="flex-1 py-3 bg-amber-500 text-stone-950 font-bold rounded-xl text-xs uppercase flex items-center justify-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" /> Attach Zone
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* AI FIELD ANALYSIS REPORT MODAL */}
      <AnimatePresence>
        {fieldAnalysis && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[7000] bg-black/85 backdrop-blur-md flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-stone-900 border border-stone-800 w-full max-w-xl max-h-[85vh] rounded-3xl overflow-hidden flex flex-col shadow-2xl"
            >
              <div className="p-4 border-b border-stone-800 flex items-center justify-between bg-stone-950">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-500/10 text-amber-400 rounded-xl">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <h3 className="text-sm font-bold text-white">AI Spatial Field Report</h3>
                </div>
                <button onClick={() => setFieldAnalysis(null)} className="p-2 text-stone-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 text-xs text-stone-300 leading-relaxed space-y-4">
                <div className="prose prose-invert max-w-none">
                  <div className="markdown-body">
                    <ReactMarkdown>{fieldAnalysis.report}</ReactMarkdown>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-stone-950 border-t border-stone-800 text-right">
                <button 
                  onClick={() => setFieldAnalysis(null)} 
                  className="px-6 py-2.5 bg-amber-500 text-stone-950 font-bold rounded-xl text-xs uppercase"
                >
                  Done
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FERTILIZER PROTOCOL MODAL */}
      <AnimatePresence>
        {detailedAdvice && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[7000] bg-black/85 backdrop-blur-md flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-stone-900 border border-stone-800 w-full max-w-xl max-h-[85vh] rounded-3xl overflow-hidden flex flex-col shadow-2xl"
            >
              <div className="p-4 border-b border-stone-800 flex items-center justify-between bg-stone-950">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl">
                    <ClipboardList className="w-5 h-5" />
                  </div>
                  <h3 className="text-sm font-bold text-white">Agronomic Field Protocol</h3>
                </div>
                <button onClick={() => setDetailedAdvice(null)} className="p-2 text-stone-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 text-xs text-stone-300 space-y-4">
                <div className="p-4 bg-stone-950 rounded-2xl border border-stone-800 space-y-2">
                  <p className="font-bold text-emerald-400">Crop Requirements & Goals:</p>
                  <p className="text-white font-medium">{detailedAdvice.cropRequirements}</p>
                </div>

                <div className="p-4 bg-stone-950 rounded-2xl border border-stone-800 space-y-2">
                  <p className="font-bold text-amber-400">Soil Adjustments:</p>
                  <p className="text-stone-300">{detailedAdvice.soilAdjustments}</p>
                </div>

                <div className="space-y-2">
                  <p className="font-bold text-stone-400 uppercase text-[10px]">Recommended Fertilizers</p>
                  {detailedAdvice.fertilizers.map((f, i) => (
                    <div key={i} className="p-3 bg-stone-950 rounded-xl border border-stone-800 flex items-center justify-between">
                      <div>
                        <p className="font-bold text-white">{f.name}</p>
                        <p className="text-[10px] text-stone-400">{f.description}</p>
                      </div>
                      <span className="px-2 py-1 bg-stone-800 text-amber-400 rounded-lg font-mono font-bold text-[10px]">
                        {f.npk}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-4 bg-stone-950 border-t border-stone-800 text-right">
                <button 
                  onClick={() => setDetailedAdvice(null)} 
                  className="px-6 py-2.5 bg-amber-500 text-stone-950 font-bold rounded-xl text-xs uppercase"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ALERT DIALOG */}
      <AnimatePresence>
        {alertDialog.isOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[10000] bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
          >
            <div className="bg-stone-900 border border-stone-800 w-full max-w-sm rounded-2xl p-6 text-center space-y-4">
              <Info className="w-10 h-10 text-amber-400 mx-auto" />
              <h3 className="text-base font-bold text-white">{alertDialog.title}</h3>
              <p className="text-xs text-stone-300">{alertDialog.message}</p>
              <button 
                onClick={() => setAlertDialog({ ...alertDialog, isOpen: false })}
                className="w-full py-3 bg-amber-500 text-stone-950 font-bold rounded-xl text-xs uppercase"
              >
                Understood
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* QUICK PRESET PLOT MODAL */}
      <AnimatePresence>
        {showPresetModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[10000] bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
          >
            <div className="bg-stone-900 border border-stone-800 w-full max-w-sm rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-stone-800 pb-3">
                <div className="flex items-center gap-2">
                  <Box className="w-5 h-5 text-emerald-400" />
                  <h3 className="text-base font-bold text-white">Quick Preset Plot</h3>
                </div>
                <button 
                  onClick={() => setShowPresetModal(false)}
                  className="p-1 text-stone-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <p className="text-xs text-stone-300">
                Select a standard plot area to drop a precision geometric rectangular parcel directly on your map center:
              </p>

              <div className="grid grid-cols-2 gap-2.5">
                <button
                  onClick={() => createQuickPresetPlot(0.5)}
                  className="p-3.5 bg-stone-950 hover:bg-stone-800 border border-stone-800 rounded-xl text-left space-y-1 active:scale-95 transition-all"
                >
                  <p className="text-xs font-bold text-amber-400">0.5 Acre</p>
                  <p className="text-[10px] text-stone-400">20 Gunthas (45m × 45m)</p>
                </button>

                <button
                  onClick={() => createQuickPresetPlot(1.0)}
                  className="p-3.5 bg-stone-950 hover:bg-stone-800 border border-stone-800 rounded-xl text-left space-y-1 active:scale-95 transition-all"
                >
                  <p className="text-xs font-bold text-emerald-400">1.0 Acre</p>
                  <p className="text-[10px] text-stone-400">40 Gunthas (63.6m × 63.6m)</p>
                </button>

                <button
                  onClick={() => createQuickPresetPlot(2.0)}
                  className="p-3.5 bg-stone-950 hover:bg-stone-800 border border-stone-800 rounded-xl text-left space-y-1 active:scale-95 transition-all"
                >
                  <p className="text-xs font-bold text-cyan-400">2.0 Acres</p>
                  <p className="text-[10px] text-stone-400">80 Gunthas (90m × 90m)</p>
                </button>

                <button
                  onClick={() => createQuickPresetPlot(5.0)}
                  className="p-3.5 bg-stone-950 hover:bg-stone-800 border border-stone-800 rounded-xl text-left space-y-1 active:scale-95 transition-all"
                >
                  <p className="text-xs font-bold text-indigo-400">5.0 Acres</p>
                  <p className="text-[10px] text-stone-400">200 Gunthas (142m × 142m)</p>
                </button>
              </div>

              <button
                onClick={() => setShowPresetModal(false)}
                className="w-full py-2.5 bg-stone-800 text-stone-300 font-bold rounded-xl text-xs uppercase"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CONFIRM DIALOG */}
      <AnimatePresence>
        {confirmDialog.isOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[10000] bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
          >
            <div className="bg-stone-900 border border-stone-800 w-full max-w-sm rounded-2xl p-6 text-center space-y-4">
              <AlertTriangle className={`w-10 h-10 mx-auto ${confirmDialog.type === 'danger' ? 'text-rose-400' : 'text-amber-400'}`} />
              <h3 className="text-base font-bold text-white">{confirmDialog.title}</h3>
              <p className="text-xs text-stone-300">{confirmDialog.message}</p>
              <div className="flex gap-2">
                <button 
                  onClick={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
                  className="flex-1 py-3 bg-stone-800 text-stone-300 font-bold rounded-xl text-xs"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => {
                    confirmDialog.onConfirm();
                    setConfirmDialog({ ...confirmDialog, isOpen: false });
                  }}
                  className={`flex-1 py-3 font-bold rounded-xl text-xs text-white ${
                    confirmDialog.type === 'danger' ? 'bg-rose-500' : 'bg-amber-500 text-stone-950'
                  }`}
                >
                  Confirm
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FieldMap;
