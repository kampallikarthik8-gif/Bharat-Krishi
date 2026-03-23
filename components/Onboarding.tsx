
import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sprout, 
  ArrowRight, 
  User, 
  Home as HomeIcon, 
  ShieldCheck, 
  Sparkles, 
  Phone, 
  Languages as LangIcon, 
  Check, 
  MapPin, 
  Landmark,
  ChevronLeft,
  Wallet,
  Layers
} from 'lucide-react';

interface OnboardingProps {
  onComplete: (name: string, farm: string, phone: string, lang: string, state: string, district: string, mandal: string, revenue: string, farmSize: string) => void;
  onBackToLogin: () => void;
}

const LANGUAGES = [
  { name: "English", label: "English" },
  { name: "Hindi", label: "हिंदी" },
  { name: "Telugu", label: "తెలుగు" },
  { name: "Marathi", label: "मराठी" },
  { name: "Tamil", label: "தமிழ்" },
  { name: "Kannada", label: "ಕನ್ನಡ" },
  { name: "Bengali", label: "বাংলা" },
  { name: "Gujarati", label: "ગુજરાતી" },
  { name: "Punjabi", label: "ਪੰਜਾਬੀ" }
];

const STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat", "Haryana", 
  "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", 
  "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", 
  "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal"
];

const Onboarding: React.FC<OnboardingProps> = ({ onComplete, onBackToLogin }) => {
  const [step, setStep] = React.useState(0);
  const [name, setName] = React.useState('');
  const [phone, setPhone] = React.useState('');
  const [farmName, setFarmName] = React.useState('');
  const [state, setState] = React.useState('');
  const [district, setDistrict] = React.useState('');
  const [mandal, setMandal] = React.useState('');
  const [revenue, setRevenue] = React.useState('');
  const [farmSize, setFarmSize] = React.useState('');
  const [selectedLang, setSelectedLang] = React.useState(localStorage.getItem('agri_language') || 'English');

  const handleNext = () => {
    if (step < 5) setStep(step + 1);
    else onComplete(name, farmName, phone, selectedLang, state, district, mandal, revenue, farmSize);
  };

  const handleBack = () => {
    if (step > 0) setStep(step - 1);
  };

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-sm space-y-8 relative z-10"
      >
        <div className="flex items-center justify-between">
          <button 
            onClick={step === 0 ? onBackToLogin : handleBack}
            className="w-12 h-12 rounded-full active:bg-stone-900 flex items-center justify-center transition-all border border-stone-800"
          >
            <ChevronLeft className="w-6 h-6 text-white" />
          </button>
          <div className="flex flex-col items-center gap-3">
            <img 
              src="https://image2url.com/r2/default/images/1773645978799-968d61a0-3ceb-48da-814f-71deb5b97303.png" 
              alt="Logo" 
              className="w-10 h-10 rounded-xl border border-amber-500/20"
              referrerPolicy="no-referrer"
            />
            <div className="flex gap-1.5">
              {[0, 1, 2, 3, 4, 5].map((s) => (
                <div 
                  key={s} 
                  className={`h-1.5 rounded-full transition-all duration-300 ${s === step ? 'w-6 bg-amber-500' : 'w-1.5 bg-stone-800'}`} 
                />
              ))}
            </div>
          </div>
          <div className="w-12" />
        </div>

        <div className="m3-card-elevated p-8 bg-stone-950 border border-amber-500/5">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              {step === 0 && (
                <div className="space-y-6">
                  <div className="space-y-1">
                    <h2 className="text-2xl font-black text-white uppercase tracking-tight">Language</h2>
                    <p className="text-[10px] font-bold text-stone-500 uppercase tracking-widest">Choose your primary dialect.</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2 max-h-[300px] overflow-y-auto pr-1 no-scrollbar">
                    {LANGUAGES.map(lang => (
                      <button
                        key={lang.name}
                        onClick={() => setSelectedLang(lang.name)}
                        className={`p-4 rounded-2xl border transition-all text-[10px] font-black uppercase tracking-widest flex items-center justify-between ${selectedLang === lang.name ? 'border-amber-500 bg-amber-500/10 text-amber-500' : 'border-stone-800 bg-stone-900 text-stone-500'}`}
                      >
                        {lang.label}
                        {selectedLang === lang.name && <Check className="w-4 h-4" />}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {step === 1 && (
                <div className="space-y-6">
                  <div className="space-y-1">
                    <h2 className="text-2xl font-black text-white uppercase tracking-tight">Identity</h2>
                    <p className="text-[10px] font-bold text-stone-500 uppercase tracking-widest">Enter your full name.</p>
                  </div>
                  <InputField icon={<User className="w-6 h-6" />} placeholder="Full Name" value={name} onChange={setName} />
                </div>
              )}

              {step === 2 && (
                <div className="space-y-6">
                  <div className="space-y-1">
                    <h2 className="text-2xl font-black text-white uppercase tracking-tight">Mobile</h2>
                    <p className="text-[10px] font-bold text-stone-500 uppercase tracking-widest">For alerts and updates.</p>
                  </div>
                  <InputField icon={<Phone className="w-6 h-6" />} placeholder="Mobile Number" value={phone} onChange={setPhone} type="tel" />
                </div>
              )}

              {step === 3 && (
                <div className="space-y-6">
                  <div className="space-y-1">
                    <h2 className="text-2xl font-black text-white uppercase tracking-tight">Farm</h2>
                    <p className="text-[10px] font-bold text-stone-500 uppercase tracking-widest">What is your farm's name?</p>
                  </div>
                  <InputField icon={<Sprout className="w-6 h-6" />} placeholder="Farm Name" value={farmName} onChange={setFarmName} />
                </div>
              )}

              {step === 4 && (
                <div className="space-y-6">
                  <div className="space-y-1">
                    <h2 className="text-2xl font-black text-white uppercase tracking-tight">Land Size</h2>
                    <p className="text-[10px] font-bold text-stone-500 uppercase tracking-widest">How much land do you farm? (Acres)</p>
                  </div>
                  <InputField icon={<Layers className="w-6 h-6" />} placeholder="Farm Size (e.g., 5.5)" value={farmSize} onChange={setFarmSize} type="number" />
                </div>
              )}

              {step === 5 && (
                <div className="space-y-6">
                  <div className="space-y-1">
                    <h2 className="text-2xl font-black text-white uppercase tracking-tight">Location</h2>
                    <p className="text-[10px] font-bold text-stone-500 uppercase tracking-widest">Localize your data.</p>
                  </div>
                  <div className="space-y-4">
                    <div className="relative">
                      <select 
                        value={state}
                        onChange={(e) => setState(e.target.value)}
                        className="w-full bg-stone-900 border-b-2 border-amber-500/20 p-4 pl-12 rounded-t-xl outline-none focus:border-amber-500 transition-all font-bold text-white appearance-none"
                      >
                        <option value="">Select State</option>
                        {STATES.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                      <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-amber-500 w-5 h-5" />
                    </div>
                    <InputField icon={<MapPin className="w-5 h-5" />} placeholder="District" value={district} onChange={setDistrict} />
                    <InputField icon={<Landmark className="w-5 h-5" />} placeholder="Mandal / Tehsil" value={mandal} onChange={setMandal} />
                    <InputField icon={<HomeIcon className="w-5 h-5" />} placeholder="Revenue Village" value={revenue} onChange={setRevenue} />
                  </div>
                </div>
              )}

              <motion.button 
                whileTap={{ scale: 0.98 }}
                onClick={handleNext}
                disabled={
                  step === 1 ? !name.trim() : 
                  step === 2 ? !phone.trim() : 
                  step === 3 ? !farmName.trim() : 
                  step === 4 ? !farmSize.trim() :
                  step === 5 ? (!state || !district.trim() || !mandal.trim() || !revenue.trim()) : 
                  false
                }
                className="w-full bg-amber-600 text-black font-black py-4 rounded-full flex items-center justify-center gap-2 shadow-xl shadow-amber-900/20 disabled:opacity-40 transition-all uppercase text-[10px] tracking-widest"
              >
                {step === 5 ? 'Start Farming' : 'Continue'}
                <ArrowRight className="w-5 h-5" />
              </motion.button>
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="text-center">
          <p className="text-[10px] font-black text-stone-500 uppercase tracking-widest opacity-40">
            © {new Date().getFullYear()} Nexus Creative Studio
          </p>
        </div>
      </motion.div>
    </div>
  );
};

const InputField: React.FC<{ icon: React.ReactNode, placeholder: string, value: string, onChange: (v: string) => void, type?: string }> = ({ icon, placeholder, value, onChange, type = "text" }) => (
  <div className="relative">
    <div className="absolute left-6 top-1/2 -translate-y-1/2 text-stone-600">
      {icon}
    </div>
    <input 
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full bg-stone-900 border-2 border-stone-800 p-6 pl-16 rounded-[2rem] outline-none focus:border-amber-500 transition-all font-bold text-white placeholder:text-stone-700"
    />
  </div>
);

export default Onboarding;
