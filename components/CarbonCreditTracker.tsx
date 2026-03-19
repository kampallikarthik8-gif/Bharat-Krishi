
import React from 'react';
import { motion } from 'motion/react';
import { 
  Leaf, 
  TrendingUp, 
  Globe, 
  ShieldCheck, 
  Info, 
  ArrowRight,
  Cloud,
  Zap,
  TreeDeciduous,
  Coins
} from 'lucide-react';

const CarbonCreditTracker: React.FC = () => {
  const [estimatedCredits, setEstimatedCredits] = React.useState(12.4);
  const [isCalculating, setIsCalculating] = React.useState(false);

  const stats = [
    { label: 'CO2 Sequestered', value: '45.2', unit: 'Metric Tons', icon: <Cloud className="w-5 h-5" />, color: 'text-blue-600' },
    { label: 'Market Value', value: '₹28,400', unit: 'Estimated', icon: <Coins className="w-5 h-5" />, color: 'text-emerald-600' },
    { label: 'Sustainability Score', value: '88', unit: '/100', icon: <Zap className="w-5 h-5" />, color: 'text-amber-600' },
  ];

  const practices = [
    { title: 'No-Till Farming', impact: '+2.4 Credits', status: 'Active', desc: 'Reducing soil disturbance to keep carbon trapped.' },
    { title: 'Cover Cropping', impact: '+1.8 Credits', status: 'Active', desc: 'Planting off-season crops to improve soil organic matter.' },
    { title: 'Agroforestry', impact: '+4.5 Credits', status: 'Pending', desc: 'Integrating trees into your crop fields.' },
  ];

  const handleRecalculate = () => {
    setIsCalculating(true);
    setTimeout(() => {
      setEstimatedCredits(prev => +(prev + 0.2).toFixed(1));
      setIsCalculating(false);
    }, 2000);
  };

  return (
    <div className="w-full flex flex-col pb-40 bg-stone-50 min-h-screen">
      {/* Header */}
      <section className="px-6 pt-12 pb-8 bg-emerald-950 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 p-12 opacity-10 rotate-12">
          <Globe className="w-64 h-64" />
        </div>
        <div className="relative z-10 space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-400/80">Sustainability Engine</span>
          </div>
          <h1 className="text-5xl font-black tracking-tighter uppercase leading-none">
            Carbon<br />
            <span className="text-emerald-400 italic">Credits.</span>
          </h1>
          <p className="text-[10px] font-bold text-emerald-200/50 uppercase tracking-widest max-w-[240px]">
            Monitor your farm's environmental impact and unlock green revenue.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <div className="px-6 -mt-8 space-y-8">
        
        {/* Credit Overview */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-[2.5rem] p-8 shadow-xl shadow-emerald-900/5 border border-emerald-100 flex flex-col items-center text-center gap-6"
        >
          <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600">
            <Leaf className="w-10 h-10" />
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-black text-stone-400 uppercase tracking-[0.3em]">Total Credits Earned</p>
            <h2 className="text-6xl font-black text-stone-900 tracking-tighter">{estimatedCredits}</h2>
            <p className="text-xs font-bold text-emerald-600 uppercase tracking-widest">Verified Carbon Units (VCU)</p>
          </div>
          <button 
            onClick={handleRecalculate}
            disabled={isCalculating}
            className="w-full bg-emerald-600 text-white py-5 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20 disabled:opacity-50"
          >
            {isCalculating ? 'Syncing with Satellite Data...' : 'Recalculate Impact'}
          </button>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 gap-4">
          {stats.map((stat, idx) => (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="bg-white p-6 rounded-[2rem] border border-stone-100 shadow-sm flex items-center gap-6"
            >
              <div className={`p-4 bg-stone-50 ${stat.color} rounded-2xl`}>
                {stat.icon}
              </div>
              <div>
                <p className="text-[9px] font-black text-stone-400 uppercase tracking-widest mb-1">{stat.label}</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black text-stone-900 tracking-tight">{stat.value}</span>
                  <span className="text-[10px] font-bold text-stone-400 uppercase">{stat.unit}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Practices Section */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-[10px] font-black text-stone-400 uppercase tracking-[0.3em]">Regenerative Practices</h3>
            <div className="h-px flex-1 bg-stone-200 ml-6" />
          </div>
          
          <div className="space-y-4">
            {practices.map((practice, idx) => (
              <div key={idx} className="bg-white p-6 rounded-[2rem] border border-stone-100 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${practice.status === 'Active' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                    <h4 className="font-black text-stone-900 uppercase tracking-tight">{practice.title}</h4>
                  </div>
                  <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full uppercase tracking-widest">
                    {practice.impact}
                  </span>
                </div>
                <p className="text-[10px] font-bold text-stone-400 uppercase leading-relaxed tracking-widest">
                  {practice.desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Info Card */}
        <div className="bg-emerald-50 p-8 rounded-[2.5rem] border border-emerald-100 space-y-4">
          <div className="flex items-center gap-3 text-emerald-700">
            <Info className="w-5 h-5" />
            <span className="text-[10px] font-black uppercase tracking-widest">How it works</span>
          </div>
          <p className="text-[10px] font-bold text-emerald-800/60 uppercase leading-relaxed tracking-widest">
            Carbon credits are generated by adopting farming practices that remove CO2 from the atmosphere. These credits can be sold to companies looking to offset their emissions.
          </p>
          <button className="flex items-center gap-2 text-[10px] font-black text-emerald-700 uppercase tracking-widest group">
            Learn more about verification <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

      </div>
    </div>
  );
};

export default CarbonCreditTracker;
