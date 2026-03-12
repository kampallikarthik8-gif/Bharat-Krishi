import React from 'react';
import { 
  Play, 
  BookOpen, 
  Search, 
  Filter, 
  Clock, 
  Star, 
  ChevronRight, 
  Award,
  Users,
  Zap,
  ArrowUpRight,
  Bookmark
} from 'lucide-react';
import { motion } from 'motion/react';

const COURSES = [
  {
    id: '1',
    title: 'Modern Hydroponics',
    instructor: 'Dr. Aruna Sharma',
    duration: '4.5 Hours',
    rating: 4.9,
    students: '1.2k',
    image: 'https://picsum.photos/seed/hydro/400/300',
    category: 'Advanced Farming',
    level: 'Intermediate'
  },
  {
    id: '2',
    title: 'Organic Pest Control',
    instructor: 'Prof. Vikram Seth',
    duration: '2.5 Hours',
    rating: 4.7,
    students: '3.4k',
    image: 'https://picsum.photos/seed/pest/400/300',
    category: 'Organic',
    level: 'Beginner'
  },
  {
    id: '3',
    title: 'Precision Irrigation',
    instructor: 'Eng. Rahul Varma',
    duration: '3.0 Hours',
    rating: 4.8,
    students: '2.1k',
    image: 'https://picsum.photos/seed/irrigation/400/300',
    category: 'Technology',
    level: 'Advanced'
  }
];

const AgriAcademy: React.FC = () => {
  return (
    <div className="space-y-6 pb-32 animate-in fade-in slide-in-from-bottom-6 duration-700">
      {/* Header */}
      <section className="px-6 pt-8 pb-4">
        <div className="flex flex-col gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-emerald-600 rounded-full shadow-sm"></div>
              <span className="text-[9px] font-bold text-stone-400 uppercase tracking-[0.2em]">Learning Hub</span>
            </div>
            <h2 className="text-4xl font-bold text-stone-900 tracking-tight font-serif leading-none">
              Kisan<br /><span className="text-emerald-700 italic">Academy.</span>
            </h2>
          </div>
          
          <div className="flex gap-3">
            <div className="relative flex-1 group">
              <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                <Search className="w-4 h-4 text-stone-300 group-focus-within:text-emerald-600 transition-colors" />
              </div>
              <input 
                type="text" 
                placeholder="Search for courses..." 
                className="w-full bg-white border border-stone-200 p-4 pl-10 rounded-2xl outline-none shadow-sm font-bold text-xs text-stone-900 focus:ring-4 focus:ring-emerald-50 transition-all placeholder:text-stone-300"
              />
            </div>
            <button className="bg-white border border-stone-200 p-4 rounded-2xl shadow-sm text-stone-400 hover:text-emerald-600 transition-colors">
              <Filter className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* Featured Course */}
      <section className="px-6">
        <motion.div 
          whileTap={{ scale: 0.98 }}
          className="bg-stone-900 rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden group"
        >
          <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
            <Award className="w-48 h-48 -mr-12 -mt-12 rotate-12" />
          </div>
          <div className="relative z-10 space-y-6">
            <div className="bg-emerald-600 w-fit px-3 py-1 rounded-full">
              <span className="text-[8px] font-bold text-white uppercase tracking-widest">Featured Course</span>
            </div>
            <div className="space-y-2">
              <h3 className="text-3xl font-bold tracking-tight font-serif leading-none text-emerald-400">Sustainable<br />Soil Health</h3>
              <p className="text-white/60 text-xs font-medium leading-tight max-w-[200px]">Master the art of soil regeneration and nutrient management.</p>
            </div>
            <div className="flex items-center gap-4">
              <button className="bg-white text-stone-900 px-6 py-3 rounded-xl font-bold text-[10px] uppercase tracking-widest shadow-xl active:scale-95 transition-all">
                Start Learning
              </button>
              <div className="flex items-center gap-2 text-white/40">
                <Clock className="w-3.5 h-3.5" />
                <span className="text-[9px] font-bold uppercase">6.5 Hours</span>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Course List */}
      <section className="px-6 space-y-4">
        <div className="flex items-center justify-between px-2">
          <h3 className="text-[10px] font-bold text-stone-400 uppercase tracking-[0.3em]">Popular Courses</h3>
          <div className="h-px flex-1 bg-stone-100 mx-4" />
        </div>

        {COURSES.map((course) => (
          <motion.div 
            key={course.id}
            whileTap={{ scale: 0.98 }}
            className="bg-white rounded-3xl border border-stone-200 p-4 shadow-sm flex gap-4 group hover:border-emerald-600/20 transition-colors"
          >
            <div className="w-24 h-24 rounded-2xl overflow-hidden shrink-0 relative">
              <img 
                src={course.image} 
                alt={course.title}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Play className="w-6 h-6 text-white fill-white" />
              </div>
            </div>
            
            <div className="flex-1 flex flex-col justify-between py-1">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[8px] font-bold text-emerald-700 uppercase tracking-widest">{course.category}</span>
                  <Bookmark className="w-3.5 h-3.5 text-stone-300 hover:text-emerald-600 transition-colors cursor-pointer" />
                </div>
                <h4 className="text-sm font-bold text-stone-900 tracking-tight uppercase mt-1">{course.title}</h4>
                <p className="text-[9px] font-bold text-stone-400 mt-0.5">{course.instructor}</p>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    <Star className="w-3 h-3 text-emerald-600 fill-emerald-600" />
                    <span className="text-[9px] font-bold text-stone-900">{course.rating}</span>
                  </div>
                  <div className="flex items-center gap-1 text-stone-400">
                    <Users className="w-3 h-3" />
                    <span className="text-[9px] font-bold">{course.students}</span>
                  </div>
                </div>
                <span className="text-[8px] font-bold text-stone-400 uppercase tracking-tighter">{course.level}</span>
              </div>
            </div>
          </motion.div>
        ))}
      </section>

      {/* Learning Progress */}
      <section className="px-6">
        <div className="bg-emerald-50 border border-emerald-100 rounded-3xl p-6 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[9px] font-bold text-emerald-700 uppercase tracking-widest">Your Progress</p>
            <h4 className="text-sm font-bold text-stone-900 uppercase">Continue: Soil Health</h4>
            <div className="w-32 h-1.5 bg-emerald-100 rounded-full mt-2 overflow-hidden">
              <div className="w-[65%] h-full bg-emerald-600 rounded-full" />
            </div>
          </div>
          <button className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-emerald-600 hover:bg-emerald-600 hover:text-white transition-colors">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </section>
    </div>
  );
};

export default AgriAcademy;
