import React from 'react';
import { 
  Truck, 
  Search, 
  Filter, 
  MapPin, 
  Calendar, 
  ChevronRight, 
  Star, 
  ShieldCheck, 
  Plus,
  ArrowUpRight,
  Clock,
  Zap,
  RefreshCw
} from 'lucide-react';
import { motion } from 'motion/react';

const EQUIPMENT_LIST = [
  {
    id: '1',
    name: 'John Deere 5050D',
    type: 'Tractor',
    price: '₹800/day',
    location: '2.4 km away',
    rating: 4.8,
    reviews: 124,
    image: 'https://picsum.photos/seed/tractor1/400/300',
    owner: 'Rajesh Kumar',
    verified: true
  },
  {
    id: '2',
    name: 'Mahindra Arjun 555',
    type: 'Tractor',
    price: '₹750/day',
    location: '4.1 km away',
    rating: 4.6,
    reviews: 89,
    image: 'https://picsum.photos/seed/tractor2/400/300',
    owner: 'Suresh Singh',
    verified: true
  },
  {
    id: '3',
    name: 'Kubota Harvester',
    type: 'Harvester',
    price: '₹2500/day',
    location: '7.8 km away',
    rating: 4.9,
    reviews: 45,
    image: 'https://picsum.photos/seed/harvester1/400/300',
    owner: 'Amit Patel',
    verified: true
  }
];

const EquipmentMarket: React.FC = () => {
  const [isConnecting, setIsConnecting] = React.useState(false);
  const [isConnected, setIsConnected] = React.useState(false);

  const handleConnect = () => {
    setIsConnecting(true);
    setTimeout(() => {
      setIsConnecting(false);
      setIsConnected(true);
    }, 2000);
  };

  return (
    <div className="space-y-6 pb-32 animate-in fade-in slide-in-from-bottom-6 duration-700">
      {/* Header */}
      <section className="px-6 pt-8 pb-4">
        <div className="flex flex-col gap-6">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse"></div>
                <span className="text-[9px] font-black text-stone-400 uppercase tracking-[0.3em]">Sharing Economy</span>
              </div>
              <h2 className="text-4xl font-black text-stone-950 tracking-tighter uppercase leading-none">
                Equipment<br /><span className="text-amber-600 italic">Market.</span>
              </h2>
            </div>
            <button 
              onClick={handleConnect}
              disabled={isConnecting || isConnected}
              className={`px-4 py-2 rounded-xl text-[8px] font-black uppercase tracking-widest transition-all ${isConnected ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-stone-950 text-white shadow-lg active:scale-95'}`}
            >
              {isConnecting ? (
                <div className="flex items-center gap-2">
                  <RefreshCw className="w-3 h-3 animate-spin" />
                  <span>Syncing...</span>
                </div>
              ) : isConnected ? (
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-3 h-3" />
                  <span>Connected</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Zap className="w-3 h-3 fill-amber-400 text-amber-400" />
                  <span>Connect Local</span>
                </div>
              )}
            </button>
          </div>
          
          <div className="flex gap-3">
            <div className="relative flex-1 group">
              <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                <Search className="w-4 h-4 text-stone-300 group-focus-within:text-amber-500 transition-colors" />
              </div>
              <input 
                type="text" 
                placeholder="Search Equipment..." 
                className="w-full bg-white border border-stone-100 p-4 pl-10 rounded-2xl outline-none shadow-sm font-bold text-xs text-stone-950 focus:ring-4 focus:ring-amber-500/10 transition-all placeholder:text-stone-300"
              />
            </div>
            <button className="bg-white border border-stone-100 p-4 rounded-2xl shadow-sm text-stone-400 hover:text-amber-500 transition-colors">
              <Filter className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="px-6 overflow-x-auto no-scrollbar">
        <div className="flex gap-3 pb-2">
          {['All', 'Tractors', 'Harvesters', 'Ploughs', 'Sprayers'].map((cat, i) => (
            <button 
              key={cat}
              className={`px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${i === 0 ? 'bg-stone-950 text-white shadow-lg' : 'bg-white text-stone-400 border border-stone-100 hover:border-amber-200'}`}
            >
              {cat}
            </button>
          ))}
        </div>
      </section>

      {/* Listings */}
      <section className="px-6 space-y-4">
        <div className="flex items-center justify-between px-2">
          <h3 className="text-[10px] font-black text-stone-400 uppercase tracking-[0.4em]">Nearby Listings</h3>
          <div className="h-px flex-1 bg-stone-100 mx-4" />
        </div>

        {EQUIPMENT_LIST.map((item) => (
          <motion.div 
            key={item.id}
            whileTap={{ scale: 0.98 }}
            className="bg-white rounded-[2rem] border border-stone-100 shadow-sm overflow-hidden group"
          >
            <div className="relative h-48">
              <img 
                src={item.image} 
                alt={item.name}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                referrerPolicy="no-referrer"
              />
              <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-xl flex items-center gap-1.5 shadow-lg">
                <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                <span className="text-[10px] font-black text-stone-950">{item.rating}</span>
              </div>
              <div className="absolute bottom-4 left-4 bg-stone-950/80 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10">
                <p className="text-[8px] font-black text-amber-400 uppercase tracking-widest leading-none mb-1">Daily Rate</p>
                <p className="text-sm font-black text-white leading-none">{item.price}</p>
              </div>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="text-lg font-black text-stone-950 tracking-tight leading-none uppercase">{item.name}</h4>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-[8px] font-black text-stone-400 uppercase tracking-widest">{item.type}</span>
                    <div className="w-1 h-1 bg-stone-200 rounded-full" />
                    <div className="flex items-center gap-1 text-stone-400">
                      <MapPin className="w-3 h-3" />
                      <span className="text-[8px] font-black uppercase tracking-widest">{item.location}</span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[9px] font-black text-stone-950 uppercase">{item.owner}</span>
                    {item.verified && <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />}
                  </div>
                  <span className="text-[8px] font-bold text-stone-400 uppercase mt-1">{item.reviews} Reviews</span>
                </div>
              </div>

              <div className="flex gap-2">
                <button className="flex-1 bg-stone-950 text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl active:scale-95 transition-all">
                  Book Now
                </button>
                <button className="p-4 bg-stone-50 text-stone-400 rounded-2xl border border-stone-100 hover:text-amber-500 transition-colors">
                  <Clock className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </section>

      {/* Floating Action Button */}
      <div className="fixed bottom-24 right-6 z-50">
        <motion.button 
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className="w-14 h-14 bg-amber-500 text-stone-950 rounded-2xl shadow-2xl flex items-center justify-center border-4 border-white"
        >
          <Plus className="w-6 h-6" />
        </motion.button>
      </div>
    </div>
  );
};

export default EquipmentMarket;
