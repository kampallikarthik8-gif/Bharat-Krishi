
export enum AppView {
  DASHBOARD = 'DASHBOARD',
  DISEASE_SCANNER = 'DISEASE_SCANNER',
  MARKET_PRICES = 'MARKET_PRICES',
  CROP_ADVISOR = 'CROP_ADVISOR',
  COMMUNITY_CHAT = 'COMMUNITY_CHAT',
  VOICE_ASSISTANT = 'VOICE_ASSISTANT',
  FARM_JOURNAL = 'FARM_JOURNAL',
  PEST_LIBRARY = 'PEST_LIBRARY',
  SOIL_LAB = 'SOIL_LAB',
  YIELD_PREDICTOR = 'YIELD_PREDICTOR',
  AGRI_NEWS = 'AGRI_NEWS',
  IRRIGATION_HUB = 'IRRIGATION_HUB',
  FIELD_MAP = 'FIELD_MAP',
  SPRAYING_ADVISOR = 'SPRAYING_ADVISOR',
  SETTINGS = 'SETTINGS',
  PROFILE = 'PROFILE',
  HARVEST_SCHEDULER = 'HARVEST_SCHEDULER',
  LIVESTOCK_ASSISTANT = 'LIVESTOCK_ASSISTANT',
  SUSTAINABILITY_HUB = 'SUSTAINABILITY_HUB',
  HELP_FEEDBACK = 'HELP_FEEDBACK',
  TASK_MANAGER = 'TASK_MANAGER',
  TOOLS_HUB = 'TOOLS_HUB',
  WEATHER_HUB = 'WEATHER_HUB',
  INVENTORY_HUB = 'INVENTORY_HUB',
  FINANCE_LEDGER = 'FINANCE_LEDGER',
  SUBSIDY_TRACKER = 'SUBSIDY_TRACKER',
  SEASONAL_PLANNER = 'SEASONAL_PLANNER',
  INPUT_ADVISOR = 'INPUT_ADVISOR',
  EQUIPMENT_MARKET = 'EQUIPMENT_MARKET',
  AGRI_ACADEMY = 'AGRI_ACADEMY',
  SMART_ALERTS = 'SMART_ALERTS',
  CROP_ROTATION_ADVISOR = 'CROP_ROTATION_ADVISOR',
  CARBON_CREDIT_TRACKER = 'CARBON_CREDIT_TRACKER',
  EQUIPMENT_RENTAL = 'EQUIPMENT_RENTAL',
  CROP_HEALTH_MONITOR = 'CROP_HEALTH_MONITOR',
  ADMIN_PANEL = 'ADMIN_PANEL'
}

export interface InventoryItem {
  id: string;
  name: string;
  category: 'Seeds' | 'Fertilizer' | 'Pesticide' | 'Tools' | 'Fuel' | 'Other';
  quantity: number;
  unit: string;
  minThreshold: number;
  expiryDate?: string;
}

export interface Transaction {
  id: string;
  type: 'Income' | 'Expense';
  category: string;
  amount: number;
  date: string;
  note: string;
}

export interface FieldPOI {
  id: string;
  type: 'Well' | 'Pump' | 'Gate' | 'Storage' | 'Fence_Issue' | 'Irrigation' | 'Fertilization' | 'Pest_Control' | 'Other';
  label: string;
  point: { lat: number; lng: number };
  status?: 'Operational' | 'Maintenance' | 'Critical';
}

export interface FieldZone {
  id: string;
  type: 'Irrigation' | 'Fertilization' | 'Pest_Control' | 'Other';
  label: string;
  points: { lat: number; lng: number }[];
  color: string;
  notes?: string;
}

export interface Field {
  id: string;
  name: string;
  cropType?: string;
  season?: string;
  points: { lat: number; lng: number }[]; // [{lat, lng}]
  markers?: FieldPOI[];
  zones?: FieldZone[];
  area: number; // In Hectares
  perimeter: number; // In Meters
  createdAt: string;
  color: string;
  notes?: string;
  status: 'Active' | 'Fallow' | 'Harvested' | 'Prepping';
  tags?: string[];
  fertilizerNeeds?: {
    urea: number;
    dap: number;
    mop: number;
  };
}

export interface Task {
  id: string;
  title: string;
  description: string;
  priority: 'Low' | 'Medium' | 'High';
  status: 'Pending' | 'Completed';
  category: string;
  createdAt: string;
}

export interface DiseaseDiagnosis {
  plantName: string;
  condition: string;
  confidence: number;
  symptoms: string[];
  recommendations: string[];
  isHealthy: boolean;
}

export interface PestIdentification {
  pestName: string;
  scientificName: string;
  description: string;
  confidence: number;
  damageSymptoms: string[];
  controlMeasures: string[];
  threatLevel: 'Low' | 'Moderate' | 'High' | 'Critical';
  hostCrops: string[];
  lifecycleStage: string;
}

export interface SoilReport {
  texture: string;
  estimatedPh: string;
  organicMatter: string;
  drainage: string;
  recommendations: string[];
  n: 'Low' | 'Medium' | 'High';
  p: 'Low' | 'Medium' | 'High';
  k: 'Low' | 'Medium' | 'High';
}

export interface FertilizerPlan {
  cropRequirements: string;
  soilAdjustments: string;
  fertilizers: {
    name: string;
    npk: string;
    description: string;
    isOrganic: boolean;
  }[];
  schedule: {
    stage: string;
    timing: string;
    dosage: string;
    method: string;
  }[];
  micronutrients: string[];
  tips: string[];
}

export interface JournalEntry {
  id: string;
  date: string;
  category: 'Planting' | 'Irrigation' | 'Fertilizer' | 'Pest Control' | 'Harvest';
  notes: string;
  crop: string;
}

export interface GroundingChunk {
  web?: {
    uri?: string;
    title?: string;
  };
  maps?: {
    uri?: string;
    title?: string;
  };
}

export interface WeatherData {
  temp: number;
  humidity: number;
  wind: number;
  description: string;
  city: string;
  lat: number;
  lon: number;
}

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: 'Owner' | 'Manager' | 'Worker';
  joinedAt: string;
  status: 'Active' | 'Pending';
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  farmName: string;
  role: 'admin' | 'farmer';
  onboardingComplete: boolean;
  createdAt?: string;
  phone?: string;
}
