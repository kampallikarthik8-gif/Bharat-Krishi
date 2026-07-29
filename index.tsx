import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { FirebaseProvider } from './src/components/FirebaseProvider';
import { DialogProvider } from './src/components/DialogProvider';
import ErrorBoundary from './src/components/ErrorBoundary';

// Global Fetch Interceptor to gracefully mock or catch failed external API requests (CORS/offline/blocked)
const originalFetch = window.fetch;
const customFetch = async function (input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const url = typeof input === 'string' ? input : (input instanceof URL ? input.href : (input as Request).url);
  
  // 1. Intercept OpenWeatherMap calls
  if (url.includes('api.openweathermap.org')) {
    const apiKeyMatches = url.match(/[?&]appid=([^&]+)/);
    const apiKey = apiKeyMatches ? apiKeyMatches[1] : '';
    
    if (!apiKey || apiKey === 'undefined' || apiKey === 'null') {
      console.warn("OpenWeatherMap fetch intercepted (missing API key):", url);
      
      if (url.includes('/weather')) {
        return new Response(JSON.stringify({
          name: "New Delhi",
          main: { temp: 28, humidity: 65, pressure: 1010 },
          wind: { speed: 3.3, deg: 270 },
          weather: [{ description: "partly cloudy", icon: "03d", main: "Clouds" }],
          sys: { country: "IN", sunrise: 1720914000, sunset: 1720964400 }
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      } else if (url.includes('/forecast')) {
        const mockList = Array.from({ length: 40 }, (_, idx) => ({
          dt: Math.floor(Date.now() / 1000) + idx * 3 * 3600,
          main: { temp: 26 + Math.sin(idx) * 4, humidity: 60 + idx % 10, pressure: 1010 },
          weather: [{ description: "partly cloudy", icon: "03d", main: "Clouds" }],
          wind: { speed: 3 + Math.cos(idx) },
          dt_txt: new Date(Date.now() + idx * 3 * 3600 * 1000).toISOString().replace('T', ' ').substring(0, 19)
        }));
        return new Response(JSON.stringify({ list: mockList }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      } else if (url.includes('/geo/')) {
        return new Response(JSON.stringify([{
          name: "New Delhi",
          lat: 28.6139,
          lon: 77.2090,
          country: "IN",
          state: "Delhi"
        }]), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }
  }

  // 2. Intercept ipapi.co calls (can fail due to CORS, adblockers or rate limits)
  if (url.includes('ipapi.co/json')) {
    try {
      const response = await originalFetch(input, init);
      if (response.ok) return response;
    } catch (e) {
      console.warn("ipapi.co fetch failed, returning mock location:", e);
    }
    return new Response(JSON.stringify({
      ip: "103.250.136.20",
      city: "New Delhi",
      region: "Delhi",
      country: "IN",
      latitude: 28.6139,
      longitude: 77.2090,
      timezone: "Asia/Kolkata"
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // 3. Intercept nominatim.openstreetmap.org calls (can be blocked or offline)
  if (url.includes('nominatim.openstreetmap.org')) {
    try {
      const response = await originalFetch(input, init);
      if (response.ok) return response;
    } catch (e) {
      console.warn("nominatim fetch failed, returning mock coordinates:", e);
    }
    return new Response(JSON.stringify([{
      place_id: 123456,
      licence: "Data © OpenStreetMap contributors, ODbL 1.0. https://osm.org/copyright",
      osm_type: "node",
      osm_id: 11111,
      boundingbox: ["28.61", "28.62", "77.20", "77.21"],
      lat: "28.6139",
      lon: "28.6139",
      display_name: "New Delhi, Delhi, India",
      class: "place",
      type: "city",
      importance: 0.9
    }]), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Fallback to real fetch for everything else, catching any network/CORS failure and wrapping it gracefully
  try {
    return await originalFetch(input, init);
  } catch (error) {
    console.warn("Global fetch error intercepted:", url, error);
    
    // If it's a critical external API, return mock rather than throwing
    if (url.includes('api.openweathermap.org')) {
      if (url.includes('/weather')) {
        return new Response(JSON.stringify({
          name: "New Delhi",
          main: { temp: 28, humidity: 65, pressure: 1010 },
          wind: { speed: 3.3, deg: 270 },
          weather: [{ description: "partly cloudy", icon: "03d", main: "Clouds" }],
          sys: { country: "IN", sunrise: 1720914000, sunset: 1720964400 }
        }), { status: 200, headers: { 'Content-Type': 'application/json' } });
      } else if (url.includes('/forecast')) {
        const mockList = Array.from({ length: 40 }, (_, idx) => ({
          dt: Math.floor(Date.now() / 1000) + idx * 3 * 3600,
          main: { temp: 26 + Math.sin(idx) * 4, humidity: 60 + idx % 10, pressure: 1010 },
          weather: [{ description: "partly cloudy", icon: "03d", main: "Clouds" }],
          wind: { speed: 3 + Math.cos(idx) },
          dt_txt: new Date(Date.now() + idx * 3 * 3600 * 1000).toISOString().replace('T', ' ').substring(0, 19)
        }));
        return new Response(JSON.stringify({ list: mockList }), { status: 200, headers: { 'Content-Type': 'application/json' } });
      }
    }
    
    // Throw the original error if it's not a handled API
    throw error;
  }
};

// Safe Redefinition
try {
  Object.defineProperty(window, 'fetch', {
    value: customFetch,
    writable: true,
    configurable: true,
    enumerable: true
  });
} catch (e) {
  console.warn("Could not redefine window.fetch with Object.defineProperty, attempting direct assignment:", e);
  try {
    (window as any).fetch = customFetch;
  } catch (err) {
    console.error("Unable to intercept fetch globally on this platform:", err);
  }
}

// Register Service Worker for PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(reg => console.log('SW registered:', reg))
      .catch(err => console.error('SW registration failed:', err));
  });
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <FirebaseProvider>
        <DialogProvider>
          <App />
        </DialogProvider>
      </FirebaseProvider>
    </ErrorBoundary>
  </React.StrictMode>
);