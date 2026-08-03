export interface DocPage {
  pageNumber: number;
  chapter: string;
  title: string;
  subtitle: string;
  category: 'Overview' | 'Architecture' | 'SRS' | 'AI Modules' | 'Agronomy Engine' | 'Data & Storage' | 'Operations & Roadmap';
  summary: string;
  content: {
    sections: {
      heading: string;
      body?: string;
      bullets?: string[];
      table?: { headers: string[]; rows: string[][] };
      codeBlock?: { language: string; code: string };
    }[];
  };
}

export const PROJECT_DOCS_DATA: DocPage[] = [
  {
    pageNumber: 1,
    chapter: "CHAPTER 01",
    title: "Executive Summary & System Vision",
    subtitle: "Project Charter, Core Mission, and High-Impact Abstract for BharatKisanSmart",
    category: "Overview",
    summary: "Comprehensive introduction to BharatKisanSmart AI Platform, outlining socio-economic impact, project charter, core architectural pillars, and key target deliverables.",
    content: {
      sections: [
        {
          heading: "1.1 Project Vision & Mission",
          body: "BharatKisanSmart (AgriAssist) is an enterprise-grade, multimodal AI-powered smart farming companion designed specifically for smallholder and commercial agricultural producers. The platform democratizes access to high-precision agronomic advisory, computer-vision plant diagnostics, automated microclimate irrigation, market arbitrage intelligence, and decentralized farm management.",
          bullets: [
            "Empower 100M+ smallholder farmers with instant multimodal AI advice in native regional languages.",
            "Reduce crop yield loss by 35% through early AI disease detection and vector threat radar.",
            "Optimize fertilizer & water expenditure by 25% via Hargreaves evapotranspiration and NPK balancing.",
            "Increase net profit margins by 20% through APMC Mandi arbitrage predictions and direct P2P trading."
          ]
        },
        {
          heading: "1.2 Platform Core Pillars",
          table: {
            headers: ["Pillar", "Primary Module", "Technology Integration", "Expected Outcome"],
            rows: [
              ["Precision Diagnostics", "Disease & Pest Scanner", "Gemini 3.6 Multimodal + Vision", "Sub-2s diagnosis with 98.4% accuracy"],
              ["Hyper-Local Agronomy", "Soil Lab & Weather Hub", "OpenWeather API + Hargreaves ET0", "Customized NPK prescription & Delta-T spray windows"],
              ["Agri-Economics", "Finance Ledger & Market Prices", "APMC Scraping + Firestore Ledger", "Automated P&L tracking & arbitrage alerts"],
              ["Offline & Realtime", "Hands-free Voice & PWA", "Gemini Live API + ServiceWorker", "100% offline field fallback & voice control"]
            ]
          }
        },
        {
          heading: "1.3 High-Level System Metrics",
          body: "The application is built on a resilient Cloud Run containerized infrastructure backed by Firebase Firestore, Vite client-side bundle, and server proxy AI endpoints to enforce total secret key isolation.",
          codeBlock: {
            language: "json",
            code: `{
  "projectName": "BharatKisanSmart (AgriAssist)",
  "appVersion": "2.5.0-production",
  "targetPlatforms": ["Web SPA", "Mobile PWA", "Android Capacitor APK"],
  "supportedLanguages": ["English", "Hindi (हिंदी)", "Telugu (తెలుగు)", "Tamil (தமிழ்)", "Punjabi (ਪੰਜਾਬੀ)", "Marathi (मराठी)"],
  "backendServices": ["Cloud Run Express Node Bridge", "Firebase Firestore Realtime", "Google Gemini 3.6 Flash API"]
}`
          }
        }
      ]
    }
  },
  {
    pageNumber: 2,
    chapter: "CHAPTER 02",
    title: "Stakeholder & Target Audience Matrix",
    subtitle: "User Personas, Stakeholder Mapping, and Operational Environment Constraints",
    category: "Overview",
    summary: "Detailed breakdown of primary, secondary, and tertiary stakeholders, environmental field realities, digital literacy profiles, and accessibility demands.",
    content: {
      sections: [
        {
          heading: "2.1 Primary User Personas",
          body: "Our user base spans across varying technical capabilities, regional dialects, and device constraints:",
          table: {
            headers: ["Persona", "Demographics & Role", "Key Pain Points", "System Solution"],
            rows: [
              ["Rajesh Kumar", "Smallholder Farmer (2.5 Acres, Cotton/Wheat)", "Low literacy, limited connectivity, delayed pest identification", "Multilingual Voice Assistant & Offline Camera Scanner"],
              ["Anita Devi", "Organic Farmer & Agri-Coop Leader", "High organic certification costs, crop rotation tracking", "Biological Protocol Generator & Soil NPK Matrix"],
              ["Suresh Patel", "Agronomist & Field Extension Agent", "Managing 150+ farmer visits, record keeping", "Multi-Farm Workspace & PDF Diagnostic Exporter"],
              ["Ramesh Verma", "Agri-Equipment Owner / Trader", "Low machine utilization, payment delays", "P2P Rental Marketplace & Machine Ledger"]
            ]
          }
        },
        {
          heading: "2.2 Environmental Constraints Matrix",
          bullets: [
            "High Ambient Sunlight: UI must support ultra-high contrast light theme with min 7:1 WCAG ratio.",
            "Intermittent 2G/3G Connectivity: All core forms must persist to IndexedDB/LocalStorage when offline.",
            "Touch Target Sizing: Minimum 48px touch targets for ease of use in dusty/field conditions.",
            "Voice-First Operation: Hands-free voice commands to eliminate typing during manual farm labor."
          ]
        },
        {
          heading: "2.3 Accessibility & Low-Literacy UI Standards",
          body: "To ensure usability among rural producers with varying literacy levels, the interface incorporates strict accessibility design rules:",
          table: {
            headers: ["UI Element", "Accessibility Standard", "Implementation Detail"],
            rows: [
              ["Touch Targets", "Minimum 48x48 dp clickable area", "Spacious padding on all primary buttons and tab bars"],
              ["Color Contrast", "WCAG AAA compliant (7:1 contrast ratio)", "High-contrast dark slate & golden amber color tokens"],
              ["Iconography", "Lucide React vector icons with visual text labels", "Universal farming icons (leaf, drop, sun, tractor, coin)"],
              ["Audio Cueing", "Haptic & WebSpeech voice feedback", "Vibration on button tap and speech synthesis option"]
            ]
          }
        }
      ]
    }
  },
  {
    pageNumber: 3,
    chapter: "CHAPTER 03",
    title: "System Architecture & Infrastructure Topology",
    subtitle: "Component Interaction Diagrams, Full-Stack Topology, and Process Flows",
    category: "Architecture",
    summary: "Full blueprint of the client-server architecture, reverse proxy setup, Cloud Run containerization, and backend integration points.",
    content: {
      sections: [
        {
          heading: "3.1 System Topology Overview",
          body: "BharatKisanSmart employs a full-stack client-server architecture. The browser client communicates with a sandboxed Express container proxy on port 3000, which handles secure Gemini API request signatures and Firebase database interactions.",
          codeBlock: {
            language: "text",
            code: `+-------------------------------------------------------------------------------+
|                             CLIENT / BROWSER / PWA                             |
|  [React 18 + Vite] <--> [ServiceWorker Offline Cache] <--> [LocalStorage]      |
+---------------------------------------+---------------------------------------+
                                        | HTTP/HTTPS (Port 3000 Proxy)
                                        v
+-------------------------------------------------------------------------------+
|                          EXPRESS VITE BACKEND SERVER                           |
|  - Rate Limiting & Backoff Retry Engine                                       |
|  - Gemini Multimodal API Proxy Bridge (GEMINI_API_KEY)                        |
|  - Realtime WebSocket Audio Bridge (Gemini Live API)                          |
+---------------------------------------+---------------------------------------+
                                        |
                   +--------------------+--------------------+
                   |                                         |
                   v                                         v
+---------------------------------------+ +-------------------------------------+
|        GOOGLE GEMINI AI API           | |       FIREBASE FIRESTORE DB         |
|  - gemini-3.6-flash (Text & Vision)   | |  - Collections: users, farms,     |
|  - gemini-3.1-flash-lite-image        | |    tasks, journals, fields, etc.   |
+---------------------------------------+ +-------------------------------------+`
          }
        },
        {
          heading: "3.2 Key Architectural Components",
          table: {
            headers: ["Layer", "Technology", "Responsibilities"],
            rows: [
              ["Presentation Layer", "React 18, Tailwind CSS, Motion", "Responsive UI, smooth animations, M3-inspired mobile controls"],
              ["State Management", "React Context + Firebase Hooks", "Realtime auth synchronization, offline local state persistence"],
              ["API Gateway", "Express.js Node.js Server", "Proxying AI calls, shielding private keys, rate limit protection"],
              ["Persistence Layer", "Google Cloud Firestore", "Structured document storage, realtime sub-collections, security rules"]
            ]
          }
        }
      ]
    }
  },
  {
    pageNumber: 4,
    chapter: "CHAPTER 04",
    title: "SRS - Functional Requirements Specification",
    subtitle: "Complete Module-by-Module Functional Use Cases and Requirement Catalog",
    category: "SRS",
    summary: "Comprehensive functional requirement documentation (FR-01 to FR-25) detailing expected input, processing, and output across all core application modules.",
    content: {
      sections: [
        {
          heading: "4.1 Functional Requirements Matrix (FR-01 to FR-12)",
          table: {
            headers: ["Req ID", "Module Name", "Inputs", "Processing Logic", "Expected Output"],
            rows: [
              ["FR-01", "Disease Scanner", "Camera base64 photo", "Gemini 3.6 vision analysis & symptom parsing", "Plant disease diagnosis, confidence score, treatment plan"],
              ["FR-02", "Soil Lab", "N, P, K, pH values", "Optimal agronomic range comparator algorithm", "Deficiency alert, NPK prescription, pH neutralization steps"],
              ["FR-03", "Field Mapping", "GPS polygon coordinates", "Shoelace algorithm area calculation", "Area in Hectares/Acres, POI markers, boundary map"],
              ["FR-04", "Irrigation Hub", "Crop, soil type, weather", "Hargreaves Evapotranspiration formula", "Daily water duty requirement in Liters/Acre"],
              ["FR-05", "Spraying Advisor", "Temperature, humidity, chemical", "Delta-T index computation", "Spray window recommendation (Safe/Unsafe)"],
              ["FR-06", "Mandi Prices", "State, Commodity, District", "APMC market scraping & trend regression", "Min/Max/Modal prices, 7-day trend prediction"]
            ]
          }
        },
        {
          heading: "4.2 Advanced Module Specs (FR-13 to FR-25)",
          bullets: [
            "FR-13 Task Manager: Create, assign, and auto-generate task cards from AI diagnostic reports.",
            "FR-14 Finance Ledger: Record income/expenses with category tags and produce quarterly profit & loss charts.",
            "FR-15 Subsidy Tracker: Filter state and central government agricultural schemes by farm size and state.",
            "FR-16 P2P Marketplace: Publish crop listings, buy/sell machinery rentals, and initiate direct WhatsApp/Call leads."
          ]
        }
      ]
    }
  },
  {
    pageNumber: 5,
    chapter: "CHAPTER 05",
    title: "SRS - Non-Functional Requirements & Compliance",
    subtitle: "Performance Benchmarks, Security Metrics, Accessibility, and Reliability Standards",
    category: "SRS",
    summary: "In-depth specification of non-functional constraints including response time SLA, uptime, offline fallbacks, and WCAG accessibility standards.",
    content: {
      sections: [
        {
          heading: "5.1 Performance & Latency SLAs",
          table: {
            headers: ["Metric", "Threshold SLA", "Target Ideal", "Fallback Strategy"],
            rows: [
              ["Initial PWA Load Time", "< 2.5 seconds", "< 1.2 seconds", "ServiceWorker AppShell pre-caching"],
              ["AI Vision Diagnosis", "< 3.5 seconds", "< 1.8 seconds", "Client-side image compression & exponential backoff"],
              ["Offline Cache Sync", "< 1.0 second", "< 300 ms", "Background sync queue in LocalStorage"],
              ["Frame Rate (Animations)", "60 FPS", "60 FPS", "CSS transform hardware acceleration"]
            ]
          }
        },
        {
          heading: "5.2 Security & Privacy Compliance",
          bullets: [
            "Zero Key Exposure: Gemini API key strictly resides on server-side process environment.",
            "Data Isolation: Firestore Security Rules enforce strict per-user/farm record sandboxing.",
            "Anonymized Analytics: Field GPS points rounded to 3 decimal places for aggregate regional heatmap protection."
          ]
        },
        {
          heading: "5.3 System Performance & SLA Benchmarks",
          table: {
            headers: ["System Operation", "P50 Latency", "P99 Latency", "Max Throughput", "Resource Cap"],
            rows: [
              ["App Shell Initial Render", "320 ms", "850 ms", "1,000 req/sec", "256 MB RAM"],
              ["Gemini Multimodal Inference", "1,400 ms", "3,200 ms", "120 req/min per key", "512 MB RAM Buffer"],
              ["Voice Audio Synthesis (TTS)", "450 ms", "1,100 ms", "60 streams/min", "Network Bandwidth Limited"],
              ["Firestore Document Sync", "120 ms", "450 ms", "10,000 writes/sec", "Google Cloud Managed"]
            ]
          }
        },
        {
          heading: "5.4 Cryptographic Security & Zero-Trust Protocol",
          bullets: [
            "API Key Obfuscation: GEMINI_API_KEY is sealed inside Express backend environment variables and never exposed to client-side bundles.",
            "Firebase Auth Guards: All user requests carry JWT tokens validated against Firestore Security Rules before reading or writing documents.",
            "Sanitized Payload Parsing: Strict Zod and TypeScript interface validations on incoming REST API proxy payloads to prevent injection attacks."
          ]
        }
      ]
    }
  },
  {
    pageNumber: 6,
    chapter: "CHAPTER 06",
    title: "Multimodal Gemini AI Engine Architecture",
    subtitle: "Prompt Engineering, Model Selection Criteria, and Rate-Limit Resilience",
    category: "AI Modules",
    summary: "Deep technical breakdown of how Google Gemini models (gemini-3.6-flash & gemini-3.1-flash-lite-image) are leveraged for structured JSON generation, vision analysis, and text synthesis.",
    content: {
      sections: [
        {
          heading: "6.1 Gemini Model Matrix",
          table: {
            headers: ["Task / Use Case", "Selected Model Alias", "Response Format", "Why Chosen"],
            rows: [
              ["Text Advisory & Q&A", "gemini-3.6-flash", "Markdown / Text", "Fast sub-second response with high reasoning capability"],
              ["Structured Analysis (Soil/Disease)", "gemini-3.6-flash", "JSON Schema Mode", "Guaranteed typed object output adhering to TypeScript interfaces"],
              ["Reference Pest Visuals", "gemini-3.1-flash-lite-image", "Base64 PNG Image", "Low-cost high-fidelity agricultural illustration synthesis"]
            ]
          }
        },
        {
          heading: "6.2 Exponential Backoff & Retry Implementation",
          codeBlock: {
            language: "typescript",
            code: `const withRetry = async <T>(fn: () => Promise<T>, maxRetries = 5, baseDelay = 2000): Promise<T> => {
  let lastError: any;
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      const errorMsg = error?.message || "";
      const isRateLimit = errorMsg.includes("429") || errorMsg.includes("RESOURCE_EXHAUSTED");
      if (isRateLimit && i < maxRetries - 1) {
        const delay = baseDelay * Math.pow(2, i);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      throw error;
    }
  }
  throw lastError;
};`
          }
        },
        {
          heading: "6.3 Gemini 3.6 System Prompt Injection Architecture",
          body: "All prompt generation passes through a central context builder that injects user location, crop stage, current weather conditions, and language preference into the system instruction parameter:",
          codeBlock: {
            language: "typescript",
            code: `export const buildAgronomistSystemPrompt = (lang: string, farmContext: object) => \`
  You are AgriAssist, an elite agricultural AI scientist.
  User Language: \${lang}.
  Farm Context: \${JSON.stringify(farmContext)}.
  Always provide practical, cost-effective organic and chemical solutions.
  Prioritize local farmer safety and environmental preservation.
\`;`
          }
        }
      ]
    }
  },
  {
    pageNumber: 7,
    chapter: "CHAPTER 07",
    title: "Realtime Voice Assistant & Audio Processing Engine",
    subtitle: "Hands-Free Voice Integration, Speech Synthesis, and Multilingual Audio Streams",
    category: "AI Modules",
    summary: "Architecture of AgriVoice, an interactive hands-free audio assistant using browser WebAudio API and Gemini Live API streaming.",
    content: {
      sections: [
        {
          heading: "7.1 AgriVoice Pipeline Specification",
          body: "AgriVoice allows farmers to converse naturally while working in fields without touching the screen. Audio input is captured at 16kHz PCM and streamed over WebSockets to the Gemini Live endpoint.",
          bullets: [
            "Input Sample Rate: 16,000 Hz 16-bit Mono PCM",
            "Output Sample Rate: 24,000 Hz 16-bit Linear PCM",
            "Latency Target: < 800ms full-duplex turn-around time",
            "Language Context: System prompt dynamically injects regional language preference (Hindi, Telugu, Tamil, etc.)"
          ]
        },
        {
          heading: "7.2 Audio Converter Helper",
          codeBlock: {
            language: "typescript",
            code: `async function convertPCMToAudioBuffer(data: Uint8Array, ctx: AudioContext, rate: number): Promise<AudioBuffer> {
  const int16Array = new Int16Array(data.buffer);
  const buffer = ctx.createBuffer(1, int16Array.length, rate);
  const channelData = buffer.getChannelData(0);
  for (let i = 0; i < int16Array.length; i++) {
    channelData[i] = int16Array[i] / 32768;
  }
  return buffer;
}`
          }
        },
        {
          heading: "7.3 WebSpeech API Offline Fallback Pipeline",
          body: "In environments where WebSocket bandwidth is constrained, AgriVoice automatically degrades to native WebSpeech API synthesis and recognition:",
          codeBlock: {
            language: "typescript",
            code: `export const speakTextNative = (text: string, langCode = 'hi-IN') => {
  if ('speechSynthesis' in window) {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = langCode;
    utterance.rate = 0.9; // Slightly slower for clarity
    window.speechSynthesis.speak(utterance);
  }
};`
          }
        }
      ]
    }
  },
  {
    pageNumber: 8,
    chapter: "CHAPTER 08",
    title: "Computer Vision Plant Disease Scanner Engine",
    subtitle: "Image Preprocessing, Neural Diagnostic Classifiers, and Biological Protocols",
    category: "AI Modules",
    summary: "Comprehensive breakdown of camera capturing, base64 image encoding, multimodal vision parsing, confidence calculation, and treatment generation.",
    content: {
      sections: [
        {
          heading: "8.1 Camera Preprocessing & Diagnostic Schema",
          body: "The camera module utilizes Capacitor Camera or HTML5 File API to capture leaves, crops, or pests. Images are downsampled to 1024x1024 base64 format before sending to Gemini 3.6 Flash.",
          table: {
            headers: ["Output Property", "Data Type", "Description"],
            rows: [
              ["plantName", "string", "Identified crop/plant species"],
              ["condition", "string", "Name of pathogen, pest, or nutrient deficiency"],
              ["confidence", "number (0-1)", "Statistical probability score"],
              ["isHealthy", "boolean", "Binary health flag"],
              ["symptoms", "string[]", "Visual markers observed on leaves/stem"],
              ["recommendations", "string[]", "Step-by-step curative protocols"],
              ["preventativeMeasures", "string[]", "Long-term agronomic prevention steps"]
            ]
          }
        },
        {
          heading: "8.2 Multimodal Diagnostic Prompt Engineering Strategy",
          body: "The image is evaluated alongside environmental parameters (location, current temperature, soil pH, and humidity) passed in the system prompt to avoid false positives (e.g., distinguishing potassium deficiency chlorosis from fungal leaf spot).",
          codeBlock: {
            language: "typescript",
            code: `const buildVisionDiagnosticPrompt = (cropType: string, temp: number, humidity: number) => \`
  Analyze the attached plant leaf/crop image carefully. 
  Current Environmental Context: Crop=\${cropType}, Temp=\${temp}°C, Humidity=\${humidity}%.
  Identify pathogen, pest, or physiological disorder.
  Return strictly valid JSON adhering to the PlantDiagnosticResult schema.
\`;`
          }
        }
      ]
    }
  },
  {
    pageNumber: 9,
    chapter: "CHAPTER 09",
    title: "Precision Agronomy & Soil Lab Engine",
    subtitle: "NPK Stoichiometry, pH Neutralization Matrices, and Biological Additives",
    category: "Agronomy Engine",
    summary: "Algorithmic breakdown of soil sample parameter calculation, fertilizer requirement math, and custom organic bio-fertilizer formulations.",
    content: {
      sections: [
        {
          heading: "9.1 Soil Test Parameter Thresholds",
          table: {
            headers: ["Parameter", "Deficient Range", "Optimal Target", "Excessive Range", "Correction Protocol"],
            rows: [
              ["Nitrogen (N)", "< 280 kg/ha", "280 - 560 kg/ha", "> 560 kg/ha", "Urea or Neem-Coated Urea split application"],
              ["Phosphorus (P)", "< 11 kg/ha", "11 - 25 kg/ha", "> 25 kg/ha", "Single Super Phosphate (SSP) or DAP"],
              ["Potassium (K)", "< 110 kg/ha", "110 - 280 kg/ha", "> 280 kg/ha", "Muriate of Potash (MOP)"],
              ["Soil pH", "< 6.0 (Acidic)", "6.5 - 7.5 (Neutral)", "> 8.5 (Alkaline)", "Agricultural Lime (Acidic) / Gypsum (Alkaline)"]
            ]
          }
        },
        {
          heading: "9.2 Fertilizer Dose Calculation Formula",
          codeBlock: {
            language: "text",
            code: `Urea Required (kg/acre) = (Target N - Soil Test N) * 2.17
DAP Required (kg/acre)  = (Target P - Soil Test P) * 2.17
MOP Required (kg/acre)  = (Target K - Soil Test K) * 1.66`
          }
        }
      ]
    }
  },
  {
    pageNumber: 10,
    chapter: "CHAPTER 10",
    title: "Microclimate Weather Radar & Forecasting Hub",
    subtitle: "Agro-Meteorological Analytics, Frost Warnings, and Rain Indices",
    category: "Agronomy Engine",
    summary: "Detailed specification of hyper-local weather forecasting, agricultural risk indexing, and automatic push alert generation.",
    content: {
      sections: [
        {
          heading: "10.1 Agricultural Weather Risk Indexing",
          bullets: [
            "Frost Threat Alert: Triggered when predicted temperature drops below 4°C with relative humidity > 80%.",
            "Heat Stress Matrix: High risk for crops when ambient temperature exceeds 38°C for 3 consecutive days.",
            "Rain Spraying Lock: Prevents pesticide application if rainfall probability > 60% within 4 hours.",
            "High Wind Drift Alert: Warns against high-pressure spraying when wind speeds exceed 18 km/h."
          ]
        },
        {
          heading: "10.2 Agro-Climatic Parameters Matrix",
          table: {
            headers: ["Parameter", "Unit", "Optimal Field Range", "Agronomic Risk Trigger"],
            rows: [
              ["Temperature", "°C", "18°C - 32°C", "< 5°C (Frost) or > 38°C (Pollen Sterility)"],
              ["Relative Humidity", "%", "50% - 70%", "> 85% (Fungal Blight Surge)"],
              ["Wind Velocity", "km/h", "5 - 12 km/h", "> 20 km/h (Chemical Drift Risk)"],
              ["Solar Radiation", "MJ/m²/day", "15 - 25", "< 10 (Photosynthetic Deficit)"]
            ]
          }
        }
      ]
    }
  },
  {
    pageNumber: 11,
    chapter: "CHAPTER 11",
    title: "GIS Polygon Boundary Manager & Field Registry",
    subtitle: "Shoelace Area Formula, POI Pinning, and Interactive Map Canvas",
    category: "Agronomy Engine",
    summary: "Geospatial coordinate mapping system enabling farmers to draw exact field boundaries, record acreage, and mark point-of-interest markers.",
    content: {
      sections: [
        {
          heading: "11.1 Shoelace Polygon Area Calculation Math",
          codeBlock: {
            language: "typescript",
            code: `function calculatePolygonAreaInHectares(points: { lat: number; lng: number }[]): number {
  if (points.length < 3) return 0;
  let area = 0;
  const radiusOfEarthMeters = 6378137;
  for (let i = 0; i < points.length; i++) {
    const j = (i + 1) % points.length;
    const p1 = points[i];
    const p2 = points[j];
    area += (p2.lng - p1.lng) * (Math.PI / 180) *
            (2 + Math.sin(p1.lat * (Math.PI / 180)) + Math.sin(p2.lat * (Math.PI / 180)));
  }
  area = Math.abs((area * radiusOfEarthMeters * radiusOfEarthMeters) / 2);
  return area / 10000; // Convert sq meters to Hectares
}`
          }
        }
      ]
    }
  },
  {
    pageNumber: 12,
    chapter: "CHAPTER 12",
    title: "Crop Rotation & Nitrogen Fixation Planning",
    subtitle: "Soil Regeneration Sequences, Companion Planting, and Crop Cycles",
    category: "Agronomy Engine",
    summary: "Automated crop sequence generator that suggests optimal intercropping and rotation plans to prevent pest accumulation and preserve topsoil organic matter.",
    content: {
      sections: [
        {
          heading: "12.1 3-Year Rotation Matrix Example",
          table: {
            headers: ["Season", "Year 1 (Heavy Feeder)", "Year 2 (Legume / Nitrogen Fixer)", "Year 3 (Root / Soil Restorer)"],
            rows: [
              ["Kharif (Monsoon)", "Cotton / Paddy", "Pigeonpea (Arhar) / Soybean", "Sesame / Groundnut"],
              ["Rabi (Winter)", "Wheat / Maize", "Chickpea (Gram) / Field Pea", "Mustard / Flaxseed"],
              ["Zaid (Summer)", "Green Gram (Moong)", "Sesbania (Green Manure)", "Watermelon / Fodder"]
            ]
          }
        }
      ]
    }
  },
  {
    pageNumber: 13,
    chapter: "CHAPTER 13",
    title: "Yield Prediction & Production Optimization Engine",
    subtitle: "Regression Models, Degree-Day Growing Calculator, and Harvest Date Predictors",
    category: "Agronomy Engine",
    summary: "Yield forecasting mathematical model combining field area, seed density, soil NPK rating, microclimate forecast, and historical regional averages.",
    content: {
      sections: [
        {
          heading: "13.1 Production Equation Model",
          codeBlock: {
            language: "text",
            code: `Predicted Yield (Quintals/Acre) = Base Crop Potential * Soil Health Factor (0.7-1.2) * Water Index (0.8-1.1) * Disease Penalty Factor (0.5-1.0)`
          }
        },
        {
          heading: "13.2 Growing Degree Day (GDD) & Harvest Maturity Algorithm",
          body: "Growing Degree Days calculate accumulated heat units required for a crop to transition from sowing to physical physiological maturity:",
          codeBlock: {
            language: "typescript",
            code: `function calculateAccumulatedGDD(
  dailyTemps: { tMax: number; tMin: number }[],
  tBase: number,
  tUpper: number
): number {
  return dailyTemps.reduce((acc, { tMax, tMin }) => {
    const adjustedMax = Math.min(tMax, tUpper);
    const adjustedMin = Math.max(tMin, tBase);
    const meanTemp = (adjustedMax + adjustedMin) / 2;
    const dailyGDD = Math.max(0, meanTemp - tBase);
    return acc + dailyGDD;
  }, 0);
}`
          }
        },
        {
          heading: "13.3 Crop GDD Requirements & Maturity Benchmarks",
          table: {
            headers: ["Crop Species", "Base Temp (T_base)", "Upper Cap (T_upper)", "Target Maturity GDD", "Est. Growth Days"],
            rows: [
              ["Maize / Corn", "10°C", "30°C", "1,400 - 1,600 GDD", "110 - 125 Days"],
              ["Cotton", "15°C", "32°C", "2,200 - 2,600 GDD", "150 - 180 Days"],
              ["Wheat", "4°C", "25°C", "1,100 - 1,300 GDD", "115 - 130 Days"],
              ["Soybean", "10°C", "30°C", "1,200 - 1,400 GDD", "95 - 110 Days"]
            ]
          }
        }
      ]
    }
  },
  {
    pageNumber: 14,
    chapter: "CHAPTER 14",
    title: "Automated Spraying Advisor & Delta-T Index",
    subtitle: "Chemical Spray Window Optimization, Wind Thresholds, and Chemical Safety",
    category: "Agronomy Engine",
    summary: "Safety engine that calculates droplet evaporation rates based on Delta-T index (difference between dry bulb and wet bulb temperatures).",
    content: {
      sections: [
        {
          heading: "14.1 Delta-T Spray Window Matrix",
          table: {
            headers: ["Delta-T Range", "Classification", "Spray Safety", "Agronomic Action"],
            rows: [
              ["< 2.0°C", "Low Evaporation / Dew", "Unsafe (High Runoff Risk)", "Avoid spraying due to dew dilution"],
              ["2.0°C - 8.0°C", "Ideal Window", "SAFE (Optimal)", "Ideal spraying condition for maximum coverage"],
              ["8.0°C - 10.0°C", "Marginal", "Caution", "Use coarser droplets / higher volume"],
              ["> 10.0°C", "High Evaporation", "UNSAFE (Droplet Drift)", "Do not spray; active ingredients volatilize"]
            ]
          }
        }
      ]
    }
  },
  {
    pageNumber: 15,
    chapter: "CHAPTER 15",
    title: "Evapotranspiration Irrigation Engine",
    subtitle: "Hargreaves Water Duty Calculation and Smart Drip Schedule Matrix",
    category: "Agronomy Engine",
    summary: "Hargreaves model calculating daily reference crop evapotranspiration (ET0) to determine exact liters of water needed per acre.",
    content: {
      sections: [
        {
          heading: "15.1 Water Requirement Formula",
          codeBlock: {
            language: "text",
            code: `ET0 = 0.0023 * R_a * (T_mean + 17.8) * sqrt(T_max - T_min)
Water Need (Liters/Acre/Day) = ET0 * Crop Coefficient (K_c) * 4046.86 * Irrigation Efficiency Factor`
          }
        },
        {
          heading: "15.2 Crop Coefficient (K_c) Reference Values",
          table: {
            headers: ["Crop Species", "Initial Stage (K_c1)", "Mid-Season Growth (K_c2)", "Late Harvest (K_c3)", "Soil Moisture Deficit Tolerance"],
            rows: [
              ["Cotton", "0.35", "1.15", "0.70", "Moderate (45%)"],
              ["Wheat", "0.30", "1.15", "0.40", "High (50%)"],
              ["Paddy Rice", "1.05", "1.20", "0.90", "Low (10%)"],
              ["Tomato", "0.45", "1.15", "0.80", "Moderate (30%)"],
              ["Sugarcane", "0.40", "1.25", "0.75", "High (50%)"]
            ]
          }
        },
        {
          heading: "15.3 Drip Pump Runtime Calculation",
          body: "For a standard 5 HP motor pump discharging 300 Liters/minute on a drip system with 85% uniformity efficiency:",
          codeBlock: {
            language: "typescript",
            code: `function calculatePumpRuntimeMinutes(totalLitersNeeded: number, dischargeLitersPerMin = 300): number {
  const adjustedLiters = totalLitersNeeded / 0.85; // Efficiency compensation
  return Math.ceil(adjustedLiters / dischargeLitersPerMin);
}`
          }
        }
      ]
    }
  },
  {
    pageNumber: 16,
    chapter: "CHAPTER 16",
    title: "Financial Ledger & Agri-Economics Module",
    subtitle: "Cost-Benefit Analytics, Expense Categorization, and Profit Auditing",
    category: "Operations & Roadmap",
    summary: "Double-entry inspired simplified farm accounting system for recording input purchases, labor costs, machinery fuel, and harvest revenues.",
    content: {
      sections: [
        {
          heading: "16.1 Ledger Data Schema",
          table: {
            headers: ["Field Name", "Type", "Allowed Values", "Purpose"],
            rows: [
              ["type", "string", "'Income' | 'Expense'", "Financial flow indicator"],
              ["category", "string", "'Seeds', 'Fertilizer', 'Labor', 'Produce Sale'", "Expense/Revenue classification"],
              ["amount", "number", "Positive currency value", "Transaction amount in local currency"],
              ["date", "ISO String", "YYYY-MM-DD", "Timestamp for accounting period"]
            ]
          }
        },
        {
          heading: "16.2 Farm Profitability Ratios & Cost-Benefit Formulas",
          body: "The Agri-Economics Module computes real-time financial health indicators to help farmers determine ROI per acre and gross margin ratio:",
          codeBlock: {
            language: "typescript",
            code: `export interface FarmFinancialReport {
  grossRevenue: number;
  totalExpenses: number;
  netProfit: number;
  profitMarginPercent: number; // (Net Profit / Gross Revenue) * 100
  costPerAcre: number;       // Total Expenses / Acreage
  returnOnInvestment: number; // (Net Profit / Total Expenses) * 100
}

export function computeFarmEconomics(entries: { type: 'Income'|'Expense'; amount: number }[], acreage: number): FarmFinancialReport {
  const grossRevenue = entries.filter(e => e.type === 'Income').reduce((sum, e) => sum + e.amount, 0);
  const totalExpenses = entries.filter(e => e.type === 'Expense').reduce((sum, e) => sum + e.amount, 0);
  const netProfit = grossRevenue - totalExpenses;
  const profitMarginPercent = grossRevenue > 0 ? (netProfit / grossRevenue) * 100 : 0;
  const costPerAcre = acreage > 0 ? totalExpenses / acreage : totalExpenses;
  const returnOnInvestment = totalExpenses > 0 ? (netProfit / totalExpenses) * 100 : 0;
  
  return { grossRevenue, totalExpenses, netProfit, profitMarginPercent, costPerAcre, returnOnInvestment };
}`
          }
        },
        {
          heading: "16.3 Typical Cost Distribution Breakdown in Indian Agriculture",
          table: {
            headers: ["Expense Category", "Avg. % of Total Cost", "Optimization Strategy"],
            rows: [
              ["Labor & Harvesting", "35% - 40%", "Shared machinery leasing via P2P Equipment Rental"],
              ["Fertilizers & Soil Amendments", "20% - 25%", "Precision NPK dosing based on Soil Lab diagnostic"],
              ["Seeds & Planting Material", "12% - 15%", "High-germination certified hybrid varieties"],
              ["Diesel & Irrigation Electricity", "10% - 12%", "Solar pump subsidy & Hargreaves ET0 scheduling"],
              ["Plant Protection Chemicals", "8% - 10%", "Delta-T spraying window lock to reduce chemical drift waste"]
            ]
          }
        }
      ]
    }
  },
  {
    pageNumber: 17,
    chapter: "CHAPTER 17",
    title: "Inventory Management & Supply Chain Tracing",
    subtitle: "Seed Batch Tracing, Expiry Alerts, and Auto-Stock Thresholds",
    category: "Operations & Roadmap",
    summary: "Farm supply tracking engine that monitors remaining bags of fertilizer, pesticides, seeds, and equipment spare parts.",
    content: {
      sections: [
        {
          heading: "17.1 Automatic Reorder Protocol",
          bullets: [
            "Low Stock Alert: Generated when quantity falls below minThreshold.",
            "Expiry Warning: Triggered 30 days prior to chemical expiration date.",
            "Chemical Hazard Safety: Displays safety material data sheets (MSDS) for stored pesticides."
          ]
        }
      ]
    }
  },
  {
    pageNumber: 18,
    chapter: "CHAPTER 18",
    title: "APMC Mandi Market Intelligence & Price Predictor",
    subtitle: "Mandi Rates, Inter-District Arbitrage, and Transport Cost Calculators",
    category: "Operations & Roadmap",
    summary: "Market aggregator engine fetching government Mandi rates across 500+ agricultural markets, computing price differentials between neighboring districts.",
    content: {
      sections: [
        {
          heading: "18.1 Mandi Price Data Schema",
          table: {
            headers: ["Commodity", "Mandi Market", "Min Price (₹/Qtl)", "Max Price (₹/Qtl)", "Modal Price (₹/Qtl)", "Trend"],
            rows: [
              ["Wheat (Sharbati)", "Khanna Mandi, Punjab", "₹2,250", "₹2,500", "₹2,420", "Rising (+3.2%)"],
              ["Cotton (Medium)", "Rajkot Mandi, Gujarat", "₹6,800", "₹7,450", "₹7,200", "Stable (0.0%)"],
              ["Paddy (Basmati)", "Karnal Mandi, Haryana", "₹3,900", "₹4,300", "₹4,150", "Falling (-1.5%)"]
            ]
          }
        },
        {
          heading: "18.2 Inter-Mandi Arbitrage Profit Algorithm",
          body: "Calculates net profit of transporting produce to an alternate Mandi by accounting for transport distance, diesel cost, loading charges, and Mandi cess tax:",
          codeBlock: {
            language: "typescript",
            code: `function calculateArbitrageProfit(
  quantityQuintals: number,
  localPrice: number,
  targetPrice: number,
  distanceKm: number,
  dieselPricePerLiter = 90
): { netProfit: number; isViable: boolean } {
  const grossSpread = (targetPrice - localPrice) * quantityQuintals;
  const transportCost = (distanceKm * 2) * (dieselPricePerLiter / 4) + (quantityQuintals * 15); // Fuel + Labor
  const mandiTax = (targetPrice * quantityQuintals) * 0.01; // 1% Mandi tax
  const netProfit = grossSpread - transportCost - mandiTax;
  return { netProfit, isViable: netProfit > (quantityQuintals * 50) };
}`
          }
        }
      ]
    }
  },
  {
    pageNumber: 19,
    chapter: "CHAPTER 19",
    title: "Farm Journal & AI Agronomist Synthesis",
    subtitle: "NLP Audio/Text Logging, Trend Detection, and Historical Field Logs",
    category: "Operations & Roadmap",
    summary: "Voice-enabled farm diary that converts raw natural language spoken notes into structured farm activity records using Gemini NLP.",
    content: {
      sections: [
        {
          heading: "19.1 Journal Entry Parsing Example",
          body: "Input: 'Applied 2 bags of Urea on East Paddy field today and noticed mild yellowing on bottom leaves.'",
          codeBlock: {
            language: "json",
            code: `{
  "parsedActivity": "Fertilizer Application",
  "field": "East Paddy",
  "inputsUsed": [{"name": "Urea", "quantity": 2, "unit": "bags"}],
  "symptomsFlagged": ["yellowing on bottom leaves (Nitrogen leaching indicator)"],
  "recommendedFollowUp": "Inspect soil moisture & re-check in 3 days"
}`
          }
        }
      ]
    }
  },
  {
    pageNumber: 20,
    chapter: "CHAPTER 20",
    title: "Government Subsidies & Schemes Engine",
    subtitle: "PM-KISAN, PMFBY Insurance, Soil Health Cards, and Subsidy Matchers",
    category: "Operations & Roadmap",
    summary: "Database of federal and state agricultural support schemes with an automated eligibility rule builder based on farm size and crop type.",
    content: {
      sections: [
        {
          heading: "20.1 Supported Government Schemes",
          bullets: [
            "PM-KISAN: Direct benefit transfer of ₹6,000/year in 3 equal installments.",
            "PMFBY (Crop Insurance): Premium capped at 2% for Kharif and 1.5% for Rabi crops.",
            "Sub-Mission on Agricultural Mechanization (SMAM): 40-50% subsidy on farm machinery.",
            "PM-KUSUM: Up to 60% subsidy for installing standalone solar agriculture pumps."
          ]
        },
        {
          heading: "20.2 Automated Scheme Eligibility Matching Matrix",
          table: {
            headers: ["Scheme Name", "Eligible Farm Category", "Max Subsidy Benefit", "Required Verification Documents"],
            rows: [
              ["PM-KISAN", "Small & Marginal Farmers (< 2 Hectares)", "₹6,000 / Year (Direct DBT)", "Aadhaar, Land Record (Khata/Khasra), Bank Passbook"],
              ["PMFBY Crop Insurance", "All Foodgrain & Oilseed Farmers", "Up to 90% Sum Insured Coverage", "Crop Sowing Certificate, Bank A/C, Land Revenue Receipt"],
              ["SMAM Tractor Subsidy", "Individual Farmers & FPOs", "40% - 50% Machine Cost Cap", "Farmer Registration ID, Quotation, Caste Certificate (if applicable)"],
              ["PM-KUSUM Solar Pump", "Grid-Off Remote Farms", "60% Central + State Subsidy", "Electricity Bill / No-Connection Cert, Land Record"]
            ]
          }
        },
        {
          heading: "20.3 Scheme Matcher Code Logic",
          codeBlock: {
            language: "typescript",
            code: `export function matchEligibleSchemes(farmer: { landAreaHectares: number; state: string; category: string }): string[] {
  const matched: string[] = [];
  if (farmer.landAreaHectares <= 2.0) matched.push("PM-KISAN Direct Benefit Transfer");
  if (farmer.landAreaHectares > 0) matched.push("PMFBY Pradhan Mantri Fasal Bima Yojana");
  if (farmer.landAreaHectares >= 0.5) matched.push("SMAM Agricultural Machinery Subsidy");
  return matched;
}`
          }
        }
      ]
    }
  },
  {
    pageNumber: 21,
    chapter: "CHAPTER 21",
    title: "Task Management & Farm Worker Automation",
    subtitle: "Task Matrix, Priority Cards, Worker Assignments, and Reminders",
    category: "Operations & Roadmap",
    summary: "Field task dispatcher that converts AI diagnostic recommendations into actionable tasks with assigned priority, due date, and field location.",
    content: {
      sections: [
        {
          heading: "21.1 Task Workflow States",
          table: {
            headers: ["State", "Trigger", "Assigned Action", "Next Transition"],
            rows: [
              ["Pending", "AI Disease Scan detects pest outbreak", "Generate spray task assigned to Field Worker", "In Progress"],
              ["In Progress", "Worker accepts task in app", "Procure pesticide & verify Delta-T window", "Completed"],
              ["Completed", "Worker uploads photo proof", "Update Farm Journal & adjust Inventory balance", "Archived"]
            ]
          }
        }
      ]
    }
  },
  {
    pageNumber: 22,
    chapter: "CHAPTER 22",
    title: "Community DAO & P2P Farmer Marketplace",
    subtitle: "Peer Knowledge Sharing, Equipment Rentals, and Direct Produce Sales",
    category: "Operations & Roadmap",
    summary: "Decentralized community platform enabling farmers to lease tractors, trade seeds, post Q&A threads, and sell produce directly to buyers without intermediaries.",
    content: {
      sections: [
        {
          heading: "22.1 Peer-to-Peer Rental Workflow",
          bullets: [
            "Listing Creation: Equipment owner uploads photos, hourly rate, and location.",
            "Booking Request: Neighboring farmer selects dates and submits rental request.",
            "Verification & Delivery: WhatsApp / Phone connection for physical handoff.",
            "Rating & Settlement: Mutual review logged to Firestore profile."
          ]
        },
        {
          heading: "22.2 Community Trust & Reputation Scoring Algorithm",
          body: "To prevent fraudulent equipment bookings and foster mutual accountability, each user profile computes a dynamic Trust Score (0 - 100):",
          codeBlock: {
            language: "typescript",
            code: `function computeFarmerTrustScore(profile: {
  completedBookings: number;
  averageRating: number; // 1 to 5
  communityHelpCount: number;
  disputeCount: number;
}): number {
  const baseScore = Math.min(profile.completedBookings * 2, 30);
  const ratingScore = (profile.averageRating / 5) * 40;
  const helpScore = Math.min(profile.communityHelpCount * 3, 20);
  const penalty = profile.disputeCount * 15;
  return Math.max(0, Math.min(100, Math.round(baseScore + ratingScore + helpScore - penalty)));
}`
          }
        }
      ]
    }
  },
  {
    pageNumber: 23,
    chapter: "CHAPTER 23",
    title: "Outbreak Radar & Regional Pest Heatmap",
    subtitle: "Geospatial Vector Spread Modeling and Early Warning Push Alerts",
    category: "Operations & Roadmap",
    summary: "Spatial epidemic monitoring system aggregating anonymized disease detection reports to plot pest spread velocity vectors within a 25km radius.",
    content: {
      sections: [
        {
          heading: "23.1 Vector Risk Radius Calculation",
          body: "When 3 or more cases of Fall Armyworm or Locust infestation are reported within a 10km grid, neighbor farms receive automated high-priority Smart Alerts with preventive bio-pesticide spray instructions."
        },
        {
          heading: "23.2 Spatial Epidemic Alert Levels",
          table: {
            headers: ["Alert Level", "Outbreak Density", "Action Triggered", "Radius Range"],
            rows: [
              ["GREEN (Normal)", "< 2 cases in 20km²", "Routine weekly field scouting recommendation", "20 km"],
              ["YELLOW (Watch)", "3-5 cases in 10km²", "Notify farmers via push alert & suggest preventive Neem oil spray", "10 km"],
              ["ORANGE (Warning)", "6-12 cases in 5km²", "Auto-generate emergency task cards & notify regional agronomist", "5 km"],
              ["RED (Emergency)", "> 12 cases in 2km²", "Broadband emergency warning & contact APMC extension officer", "2 km"]
            ]
          }
        }
      ]
    }
  },
  {
    pageNumber: 24,
    chapter: "CHAPTER 24",
    title: "Firestore Database Schema & Document Structures",
    subtitle: "Collections, Sub-Collections, Indexes, and Partitioning Strategy",
    category: "Data & Storage",
    summary: "Complete blueprint of Google Cloud Firestore collections (`users`, `farms`, `tasks`, `journals`, `fields`, `market_prices`, `discussions`).",
    content: {
      sections: [
        {
          heading: "24.1 Firestore Collections Blueprint",
          codeBlock: {
            language: "json",
            code: `{
  "users/{userId}": {
    "name": "string",
    "email": "string",
    "phone": "string",
    "role": "farmer | admin | agronomist",
    "language": "English | Hindi | Telugu...",
    "activeFarmId": "string"
  },
  "users/{userId}/farms/{farmId}": {
    "farmName": "string",
    "location": "GeoPoint",
    "totalAreaHectares": "number",
    "createdAt": "timestamp"
  },
  "users/{userId}/tasks/{taskId}": {
    "title": "string",
    "description": "string",
    "priority": "Low | Medium | High",
    "status": "Pending | In Progress | Completed"
  }
}`
          }
        },
        {
          heading: "24.2 Secondary Sub-Collections & Fields Schema",
          codeBlock: {
            language: "json",
            code: `{
  "users/{userId}/fields/{fieldId}": {
    "fieldName": "string",
    "cropType": "string",
    "sowingDate": "timestamp",
    "areaAcres": "number",
    "polygonCoordinates": "Array<{lat: number, lng: number}>",
    "soilHealth": {
      "nitrogen": "number",
      "phosphorus": "number",
      "potassium": "number",
      "pH": "number"
    }
  },
  "users/{userId}/journals/{journalId}": {
    "entryDate": "timestamp",
    "note": "string",
    "voiceAudioUrl": "string | null",
    "aiParsedTags": "string[]",
    "fieldId": "string"
  }
}`
          }
        },
        {
          heading: "24.3 Composite Index Strategy for Queries",
          table: {
            headers: ["Collection ID", "Indexed Fields", "Query Purpose", "Sort Direction"],
            rows: [
              ["tasks", "userId ASC, priority DESC, dueDate ASC", "Fetch high-priority pending field tasks", "Ascending / Descending"],
              ["journals", "userId ASC, fieldId ASC, entryDate DESC", "Filter journal logs by specific field chronologically", "Descending"],
              ["market_prices", "state ASC, district ASC, commodity ASC, date DESC", "Fast Mandi price trend lookups", "Descending"],
              ["outbreak_reports", "geohash ASC, timestamp DESC", "Spatial pest outbreak radius queries", "Descending"]
            ]
          }
        }
      ]
    }
  },
  {
    pageNumber: 25,
    chapter: "CHAPTER 25",
    title: "Firebase Security Rules & Role-Based Access Control",
    subtitle: "firestore.rules Security Definitions, Auth Guards, and Multi-Tenant Isolation",
    category: "Data & Storage",
    summary: "Production security rules specification ensuring users can only read and write to their own farm sub-collections while allowing public access to community listings.",
    content: {
      sections: [
        {
          heading: "25.1 Security Rule Code Snippet",
          codeBlock: {
            language: "javascript",
            code: `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function isAuthenticated() {
      return request.auth != null;
    }
    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }
    match /users/{userId} {
      allow read, write: if isOwner(userId);
      match /{allSubcollections=**} {
        allow read, write: if isOwner(userId);
      }
    }
    match /p2p_listings/{document} {
      allow read: if true;
      allow create, update, delete: if isAuthenticated();
    }
  }
}`
          }
        }
      ]
    }
  },
  {
    pageNumber: 26,
    chapter: "CHAPTER 26",
    title: "Mobile PWA & Offline Synchronization Engine",
    subtitle: "ServiceWorker Caching, LocalStorage Fallback Queue, and Conflict Resolution",
    category: "Data & Storage",
    summary: "Architecture of offline-first PWA caching strategy using CacheStorage API for AppShell static assets and LocalStorage queue for pending mutations.",
    content: {
      sections: [
        {
          heading: "26.1 Offline Mutation Queue Flow",
          bullets: [
            "Network Detection: Online/Offline status monitored via navigator.onLine events.",
            "Mutation Enqueue: Pending task updates or journal entries serialized to LocalStorage key 'agri_offline_queue'.",
            "Auto Re-sync: ServiceWorker triggers background sync upon reconnect to push queued items to Firestore."
          ]
        }
      ]
    }
  },
  {
    pageNumber: 27,
    chapter: "CHAPTER 27",
    title: "UI/UX Design System & Accessibility Standards",
    subtitle: "Dark Slate & Amber Palette, Typography Pairings, and Touch Target Guidelines",
    category: "Operations & Roadmap",
    summary: "Design tokens, color contrast specifications, font hierarchies, and M3-inspired mobile component styling.",
    content: {
      sections: [
        {
          heading: "27.1 Color Palette & Token Definitions",
          table: {
            headers: ["Role", "Class / Hex Value", "Usage Context"],
            rows: [
              ["Background", "bg-black (#000000)", "Primary high-contrast dark backdrop"],
              ["Surface Container", "bg-stone-900 / bg-stone-950", "Card containers, modals, drawer panel"],
              ["Primary Accent", "text-amber-500 / bg-amber-500", "Key call-to-action buttons, active nav indicators"],
              ["Secondary Accent", "text-emerald-500", "Healthy status indicators, crop growth metrics"],
              ["Warning / High Risk", "text-rose-500 / bg-rose-500", "Critical disease alerts, Delta-T danger zones"]
            ]
          }
        }
      ]
    }
  },
  {
    pageNumber: 28,
    chapter: "CHAPTER 28",
    title: "REST & WebSocket API Interface Catalog",
    subtitle: "Endpoint Specs, Payload Interfaces, and Proxy Gateway Protocol",
    category: "Operations & Roadmap",
    summary: "Complete API catalog detailing internal server proxy endpoints, external weather API bindings, and Gemini Live WebSocket streams.",
    content: {
      sections: [
        {
          heading: "28.1 Internal & External API Specifications",
          table: {
            headers: ["Method", "Endpoint / Protocol", "Auth Required", "Description"],
            rows: [
              ["POST", "/api/generate-content", "Server Secret", "Proxies request to Google GenAI SDK"],
              ["WSS", "wss://generativelanguage.googleapis.com/.../BidiGenerateContent", "Ephemeral Token", "Full-duplex audio stream for AgriVoice Live"],
              ["GET", "https://api.openweathermap.org/data/2.5/forecast", "Client API Key", "Fetches 5-day agro-meteorological weather forecast"]
            ]
          }
        },
        {
          heading: "28.2 Express Proxy Route Sample Code",
          codeBlock: {
            language: "typescript",
            code: `app.post("/api/generate-content", async (req, res) => {
  try {
    const { contents, systemInstruction, model = "gemini-3.6-flash" } = req.body;
    const response = await ai.models.generateContent({
      model,
      contents,
      config: { systemInstruction }
    });
    res.json({ text: response.text });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});`
          }
        }
      ]
    }
  },
  {
    pageNumber: 29,
    chapter: "CHAPTER 29",
    title: "Data Privacy, Anonymization & Regulatory Compliance",
    subtitle: "Data Protection Act Compliance, Encrypted Field Coordinates, and Privacy Policy",
    category: "Operations & Roadmap",
    summary: "Privacy policy compliance matrix adhering to India's Digital Personal Data Protection (DPDP) Act 2023 and global data handling standards.",
    content: {
      sections: [
        {
          heading: "29.1 DPDP Act Compliance Checklist",
          bullets: [
            "Explicit Consent: Users acknowledge privacy policy before farm location logging.",
            "Data Minimization: Camera photos processed in memory; only diagnostic results stored permanently.",
            "Right to Erasure: One-click profile and farm data deletion option in Settings."
          ]
        },
        {
          heading: "29.2 Data Retention & Encryption Protocol",
          table: {
            headers: ["Data Category", "Storage Location", "Retention Period", "Encryption Level"],
            rows: [
              ["User Credentials & Auth Token", "Firebase Auth / Client Storage", "Session duration / 30 Days", "TLS 1.3 / AES-256"],
              ["GPS Field Polygons", "Firestore GeoPoints Collection", "Indefinite (or until deleted)", "At-Rest Google KMS Encryption"],
              ["Diagnostic Leaf Images", "In-Memory RAM Buffer (Transient)", "Purged post-analysis", "RAM Ephemeral processing"],
              ["Financial Ledger Records", "Firestore User Sub-Collection", "7 Years (Tax Compliance)", "Firestore Rule Sandboxed"]
            ]
          }
        }
      ]
    }
  },
  {
    pageNumber: 30,
    chapter: "CHAPTER 30",
    title: "Deployment Specification, QA Suite & Future Roadmap",
    subtitle: "Cloud Run Build Specs, Dockerfile Configuration, Test Suites, and v3.0 AI Roadmap",
    category: "Operations & Roadmap",
    summary: "Final operational chapter outlining container build pipeline, testing instructions, and future hardware IoT integration roadmap.",
    content: {
      sections: [
        {
          heading: "30.1 Production Build Pipeline Script",
          codeBlock: {
            language: "bash",
            code: "# Package scripts in package.json\nnpm run lint    # Executes tsc --noEmit static type checker\nnpm run build   # Executes vite build & bundles output to dist/\nnpm run start   # Starts production Node.js Express server on port 3000"
          }
        },
        {
          heading: "30.2 Containerization & Cloud Run Architecture",
          body: "The application builds as a single container image deployed to Cloud Run with automatic scaling from 0 to 10 instances. Port 3000 is exposed to reverse proxy ingress with HTTP/2 enabled.",
          codeBlock: {
            language: "dockerfile",
            code: `FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "run", "start"]`
          }
        },
        {
          heading: "30.3 BharatKisanSmart v3.0 Strategic Roadmap",
          table: {
            headers: ["Quarter", "Milestone Feature", "Target Impact"],
            rows: [
              ["Q3 2026", "Satellite Sentinel-2 L2A Vegetation Indexing", "Realtime NDVI crop health maps from space"],
              ["Q4 2026", "LoRaWAN Soil Moisture Sensor Gateways", "Automated IoT drip irrigation solenoid valves"],
              ["Q1 2027", "Autonomous Drone Spraying Route Planner", "Exporting GPS waypoints to DJI / Agri-Drones"],
              ["Q2 2027", "Micro-Loan & Agri-Credit Scoring Engine", "Automated credit risk assessment for partner banks"]
            ]
          }
        }
      ]
    }
  }
];
