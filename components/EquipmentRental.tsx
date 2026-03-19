
import React from 'react';
import { motion } from 'motion/react';
import { 
  Truck, 
  Search, 
  Filter, 
  Star, 
  MapPin, 
  Calendar, 
  ChevronRight,
  Info,
  Clock,
  ShieldCheck
} from 'lucide-react';

const EquipmentRental: React.FC = () => {
  const [searchQuery, setSearchQuery] = React.useState('');

  const categories = ['Tractors', 'Harvesters', 'Ploughs', 'Seeders', 'Drones'];
  
  const equipment = [
    {
      id: '1',
      name: 'John Deere 5050D',
      type: 'Tractor',
      price: '₹1,200',
      unit: 'per day',
      rating: 4.8,
      distance: '2.4 km',
      image: 'https://picsum.photos/seed/tractor1/400/300',
      owner: 'Kisan Seva Kendra'
    },
    {
      id: '2',
      name: 'Mahindra Arjun 555',
      type: 'Tractor',
      price: '₹1,100',
      unit: 'per day',
      rating: 4.6,
      distance: '4.1 km',
      image: 'https://picsum.photos/seed/tractor2/400/300',
      owner: 'Ram Singh Rentals'
    },
    {
      id: '3',
      name: 'DJI Agras T30',
      type: 'Drone',
      price: '₹2,500',
      unit: 'per acre',
      rating: 4.9,
      distance: '1.2 km',
      image: 'https://picsum.photos/seed/drone/400/300',
      owner: 'TechAgri Solutions'
    }
  ];

  return (
    <div className="w-full flex flex-col pb-40 bg-stone-50 min-h-screen">
      {/* Header */}
      <section className="px-6 pt-12 pb-8 bg-white border-b border-stone-100">
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-orange-500 shadow-sm" />
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-stone-400">Shared Economy</span>
          </div>
          <h1 className="text-5xl font-black tracking-tighter uppercase leading-none text-stone-900">
            Equipment<br />
            <span className="text-orange-500 italic">Rental.</span>
          </h1>
          
          <div className="relative group w-full">
            <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none">
              <Search className="w-5 h-5 text-stone-300 group-focus-within:text-orange-500 transition-colors" />
            </div>
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search equipment..."
              className="w-full bg-stone-50 border border-stone-200 p-6 pl-16 rounded-[2rem] outline-none shadow-sm text-sm text-stone-900 focus:border-orange-500/50 focus:ring-4 focus:ring-orange-50/50 transition-all placeholder:text-stone-300"
            />
          </div>
        </div>
      </section>

      {/* Categories */}
      <div className="px-6 py-8 overflow-x-auto flex gap-3 no-scrollbar">
        {categories.map((cat, idx) => (
          <button 
            key={idx}
            className={`px-6 py-3 rounded-full text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${idx === 0 ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20' : 'bg-white text-stone-400 border border-stone-100'}`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Equipment List */}
      <div className="px-6 space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-[10px] font-black text-stone-400 uppercase tracking-[0.3em]">Available Nearby</h3>
          <button className="flex items-center gap-2 text-[10px] font-black text-orange-500 uppercase tracking-widest">
            <Filter className="w-4 h-4" /> Filter
          </button>
        </div>

        <div className="space-y-6">
          {equipment.map((item, idx) => (
            <motion.div 
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="bg-white rounded-[2.5rem] overflow-hidden border border-stone-100 shadow-sm group active:scale-[0.98] transition-all"
            >
              <div className="relative h-48">
                <img 
                  src={item.image} 
                  alt={item.name} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm">
                  <Star className="w-3 h-3 text-orange-500 fill-orange-500" />
                  <span className="text-[10px] font-black text-stone-900">{item.rating}</span>
                </div>
                <div className="absolute bottom-4 left-4 bg-orange-500 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg">
                  {item.price} <span className="opacity-60 font-bold">/ {item.unit}</span>
                </div>
              </div>
              
              <div className="p-8 space-y-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-2xl font-black text-stone-900 tracking-tight uppercase">{item.name}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <MapPin className="w-3 h-3 text-stone-300" />
                      <span className="text-[9px] font-bold text-stone-400 uppercase tracking-widest">{item.distance} • {item.owner}</span>
                    </div>
                  </div>
                  <div className="w-12 h-12 bg-stone-50 rounded-2xl flex items-center justify-center text-stone-400 group-hover:bg-orange-50 group-hover:text-orange-500 transition-colors">
                    <ChevronRight className="w-6 h-6" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-stone-50">
                  <div className="flex items-center gap-3">
                    <Clock className="w-4 h-4 text-stone-300" />
                    <span className="text-[9px] font-bold text-stone-500 uppercase tracking-widest">Instant Booking</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <ShieldCheck className="w-4 h-4 text-stone-300" />
                    <span className="text-[9px] font-bold text-stone-500 uppercase tracking-widest">Insured</span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Booking Notice */}
      <div className="px-6 mt-12">
        <div className="bg-stone-900 p-8 rounded-[2.5rem] text-white flex items-center gap-6">
          <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center text-orange-400">
            <Truck className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-black text-orange-400 uppercase tracking-[0.3em]">Logistics Support</p>
            <p className="text-[10px] font-bold text-white/60 uppercase leading-relaxed tracking-widest">
              Need transport for your rented equipment? We provide low-cost logistics to your farm gate.
            </p>
          </div>
        </div>
      </div>

    </div>
  );
};

export default EquipmentRental;
