
import React from 'react';
import { fetchAgriNews } from '../services/geminiService';
import { 
  Landmark, 
  Search, 
  Loader2, 
  ExternalLink, 
  Globe, 
  CheckCircle2, 
  Info,
  MapPin,
  Navigation,
  Sparkles,
  FileText,
  AlertCircle
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';

const WEATHER_API_KEY = "42d5aa17c7f2866670e62b4c77cb3d32";

// Fixed error: Added SubsidyTrackerProps and used language from props
interface SubsidyTrackerProps {
  language: string;
}

const SubsidyTracker: React.FC<SubsidyTrackerProps> = ({ language }) => {
  const [location, setLocation] = React.useState(localStorage.getItem('agri_farm_location') || '');
  const [results, setResults] = React.useState<{ text?: string, sources: any[] } | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [detecting, setDetecting] = React.useState(false);

  const detectLocation = () => {
    setDetecting(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const res = await fetch(
            `https://api.openweathermap.org/data/2.5/weather?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&appid=${WEATHER_API_KEY}&units=metric`
          );
          const data = await res.json();
          const cityRegion = data.name && data.sys?.country ? `${data.name}, ${data.sys.country}` : "My Region";
          setLocation(cityRegion);
          handleSearch(cityRegion);
        } catch (err) {
          console.error(err);
        } finally {
          setDetecting(false);
        }
      },
      () => setDetecting(false)
    );
  };

  const handleSearch = async (loc?: string) => {
    const searchLoc = loc || location;
    if (!searchLoc) return;
    setLoading(true);
    try {
      // Use language prop in news/subsidy search
      const data = await fetchAgriNews(searchLoc, language, "Focus on direct financial aid, PM-KISAN, and input subsidies.");
      setResults(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    if (location) handleSearch();
    else detectLocation();
  }, []);

  return (
    <div className="space-y-6 pb-12 animate-in fade-in slide-in-from-bottom-6 duration-700">
      <div className="bg-white rounded-[2.5rem] p-6 md:p-8 shadow-sm border border-stone-200">
        <h2 className="text-2xl font-black mb-2 flex items-center gap-3 text-stone-900">
          <div className="bg-amber-100 p-2.5 rounded-2xl">
            <Landmark className="text-amber-700 w-6 h-6" />
          </div>
          Subsidy Finder
        </h2>
        <p className="text-stone-500 text-sm font-medium mb-8 leading-relaxed">
          Grounded search for regional and national agricultural welfare schemes.
        </p>

        <form onSubmit={(e) => { e.preventDefault(); handleSearch(); }} className="space-y-4 mb-10">
          <div className="relative">
            <input 
              placeholder="Search region for schemes..." 
              className="w-full bg-stone-50 border border-stone-100 p-4 pl-12 rounded-[1.5rem] outline-none focus:ring-2 focus:ring-amber-500 transition-all font-semibold text-sm shadow-inner"
              value={location}
              onChange={e => setLocation(e.target.value)}
            />
            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-amber-600 w-5 h-5" />
            <button 
              type="button"
              onClick={detectLocation}
              disabled={detecting}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-2 hover:bg-stone-200 rounded-xl transition-colors text-stone-400"
            >
              <Navigation className={`w-4 h-4 ${detecting ? 'animate-spin' : ''}`} />
            </button>
          </div>
          <button 
            type="submit"
            disabled={loading || detecting}
            className="w-full bg-stone-900 text-white font-black py-4.5 rounded-[1.5rem] flex items-center justify-center gap-2 hover:bg-black transition-all disabled:opacity-50 shadow-xl active:scale-[0.98]"
          >
            {loading ? <Loader2 className="animate-spin w-5 h-5" /> : <Search className="w-5 h-5" />}
            Refresh Grounded Intel
          </button>
        </form>

        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center text-amber-600 space-y-5">
             <div className="relative">
                <div className="w-16 h-16 border-4 border-amber-50 rounded-full shadow-inner"></div>
                <div className="absolute inset-0 w-16 h-16 border-4 border-amber-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
            <p className="font-black uppercase tracking-[0.2em] text-[10px] animate-pulse text-center px-8 leading-relaxed">
               Polling Government Portals...
            </p>
          </div>
        ) : results ? (
          <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
            <div className="bg-stone-50 border border-stone-100 p-7 rounded-[2.5rem] shadow-inner relative overflow-hidden">
               <div className="absolute top-0 right-0 p-6 opacity-5">
                  <Landmark className="w-32 h-32" />
               </div>
               <div className="relative z-10">
                  <div className="flex items-center gap-2 text-amber-600 font-black text-[10px] uppercase tracking-[0.2em] mb-6">
                    <Sparkles className="w-4 h-4" /> Synthesized Discovery
                  </div>
                  <div className="prose prose-stone max-w-none text-sm font-medium text-stone-700 leading-relaxed">
                    <ReactMarkdown>{results.text || ''}</ReactMarkdown>
                  </div>
               </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-[10px] font-black text-stone-400 uppercase tracking-[0.2em] px-2 flex items-center gap-2">
                <Globe className="w-4 h-4" /> Official Web Sources
              </h3>
              <div className="grid grid-cols-1 gap-3">
                {results.sources.map((src, i) => src.web && (
                  <a 
                    key={i} 
                    href={src.web.uri} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center justify-between bg-white border border-stone-100 p-5 rounded-[1.5rem] hover:border-amber-500 hover:shadow-lg transition-all group"
                  >
                    <div className="flex-1 min-w-0 pr-4">
                      <div className="font-black text-xs text-stone-800 truncate mb-1">{src.web.title}</div>
                      <div className="text-[9px] font-bold text-stone-400 uppercase tracking-widest truncate">
                        Source: {new URL(src.web.uri).hostname}
                      </div>
                    </div>
                    <ExternalLink className="w-4 h-4 text-stone-300 group-hover:text-amber-500 transition-colors" />
                  </a>
                ))}
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-100 p-6 rounded-[2rem] flex gap-4 items-start shadow-sm">
               <div className="bg-white p-3 rounded-2xl text-blue-600 shadow-inner">
                  <AlertCircle className="w-6 h-6" />
               </div>
               <div>
                  <h4 className="text-sm font-black text-blue-900 uppercase tracking-widest leading-none mb-2">Eligibility Notice</h4>
                  <p className="text-xs text-blue-700 font-medium leading-relaxed">
                     Always verify scheme status at your local Agricultural Development Office (ADO) or Block Office before submitting documents.
                  </p>
               </div>
            </div>
          </div>
        ) : (
          <div className="py-24 text-center text-stone-300 opacity-30 flex flex-col items-center">
            <Landmark className="w-16 h-16 mb-4" />
            <p className="font-black text-sm uppercase tracking-widest">Search your region for welfare schemes</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SubsidyTracker;
