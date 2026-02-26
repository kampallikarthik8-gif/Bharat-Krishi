import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LayoutDashboard, 
  Map as MapIcon, 
  Bell, 
  BookOpen, 
  ChevronRight, 
  X,
  Sparkles,
  ArrowRight
} from 'lucide-react';

interface TourStep {
  title: string;
  desc: string;
  icon: React.ReactNode;
  color: string;
}

const TOUR_STEPS: TourStep[] = [
  {
    title: "Farm Command Center",
    desc: "Your dashboard provides a real-time overview of weather, soil health, and active tasks.",
    icon: <LayoutDashboard className="w-8 h-8" />,
    color: "bg-amber-500"
  },
  {
    title: "Digital Field Mapper",
    desc: "Draw and manage your parcels with precision. Track treatments and crop cycles for each plot.",
    icon: <MapIcon className="w-8 h-8" />,
    color: "bg-rose-500"
  },
  {
    title: "Intelligence Alerts",
    desc: "Stay ahead with smart reminders for spraying, weather warnings, and market price drops.",
    icon: <Bell className="w-8 h-8" />,
    color: "bg-blue-500"
  },
  {
    title: "Agri Academy",
    desc: "Access expert-led courses to master sustainable farming and modern agricultural technology.",
    icon: <BookOpen className="w-8 h-8" />,
    color: "bg-emerald-500"
  }
];

interface FeatureTourProps {
  onComplete: () => void;
}

const FeatureTour: React.FC<FeatureTourProps> = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = React.useState(0);

  const handleNext = () => {
    if (currentStep < TOUR_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const step = TOUR_STEPS[currentStep];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-stone-950/80 backdrop-blur-xl"
      />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="relative w-full max-w-sm bg-white rounded-[3rem] overflow-hidden shadow-2xl"
      >
        <div className="absolute top-6 right-6 z-10">
          <button 
            onClick={onComplete}
            className="p-2 bg-stone-100 rounded-full text-stone-400 hover:text-stone-900 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-10 space-y-10">
          <div className="flex justify-center">
            <motion.div 
              key={currentStep}
              initial={{ scale: 0.5, rotate: -10, opacity: 0 }}
              animate={{ scale: 1, rotate: 0, opacity: 1 }}
              className={`w-24 h-24 ${step.color} rounded-[2rem] flex items-center justify-center text-white shadow-2xl shadow-${step.color.split('-')[1]}-200`}
            >
              {step.icon}
            </motion.div>
          </div>

          <div className="space-y-4 text-center">
            <div className="flex justify-center gap-1.5 mb-6">
              {TOUR_STEPS.map((_, i) => (
                <div 
                  key={i}
                  className={`h-1.5 rounded-full transition-all duration-500 ${i === currentStep ? 'w-8 bg-amber-500' : 'w-1.5 bg-stone-200'}`}
                />
              ))}
            </div>
            <motion.h3 
              key={`title-${currentStep}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-2xl font-black text-stone-950 uppercase tracking-tighter leading-none"
            >
              {step.title}
            </motion.h3>
            <motion.p 
              key={`desc-${currentStep}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-sm font-medium text-stone-500 leading-relaxed"
            >
              {step.desc}
            </motion.p>
          </div>

          <div className="pt-4">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleNext}
              className="w-full bg-stone-950 text-white font-black py-5 rounded-2xl flex items-center justify-center gap-3 shadow-xl hover:bg-stone-800 transition-all"
            >
              {currentStep === TOUR_STEPS.length - 1 ? 'Get Started' : 'Next Feature'}
              <ArrowRight className="w-5 h-5" />
            </motion.button>
          </div>
        </div>

        <div className="bg-stone-50 p-6 flex items-center justify-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-500" />
          <span className="text-[10px] font-black text-stone-400 uppercase tracking-widest">AgriAssist Intelligence v2.5</span>
        </div>
      </motion.div>
    </div>
  );
};

export default FeatureTour;
