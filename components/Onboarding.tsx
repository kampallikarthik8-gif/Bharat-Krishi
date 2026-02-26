
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
  Wallet
} from 'lucide-react';

interface OnboardingProps {
  onComplete: (name: string, farm: string, phone: string, lang: string, state: string, district: string, mandal: string, revenue: string) => void;
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
  const [selectedLang, setSelectedLang] = React.useState(localStorage.getItem('agri_language') || 'English');

  const handleNext = () => {
    if (step < 4) setStep(step + 1);
    else onComplete(name, farmName, phone, selectedLang, state, district, mandal, revenue);
  };

  const handleBack = () => {
    if (step > 0) setStep(step - 1);
  };

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute inset-0 bg-stone-50/50" />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-sm space-y-10 relative z-10"
      >
        <div className="flex items-center justify-between">
          <button 
            onClick={step === 0 ? onBackToLogin : handleBack}
            className="w-10 h-10 bg-white rounded-xl shadow-sm border border-stone-100 flex items-center justify-center active:scale-90 transition-all"
          >
            <ChevronLeft className="w-5 h-5 text-stone-700" />
          </button>
          <div className="flex gap-1.5">
            {[0, 1, 2, 3, 4].map((s) => (
              <div 
                key={s} 
                className={`h-1.5 rounded-full transition-all duration-500 ${s === step ? 'w-8 bg-amber-500' : 'w-1.5 bg-stone-200'}`} 
              />
            ))}
          </div>
          <div className="w-10" />
        </div>

        <div className="bg-white rounded-[3rem] p-8 shadow-2xl shadow-stone-200 border border-stone-100">
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
                  <div className="space-y-2">
                    <h2 className="text-2xl font-black text-stone-950">Language</h2>
                    <p className="text-sm text-stone-500 font-medium">Choose your primary dialect.</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2 max-h-[300px] overflow-y-auto pr-2 no-scrollbar">
                    {LANGUAGES.map(lang => (
                      <button
                        key={lang.name}
                        onClick={() => setSelectedLang(lang.name)}
                        className={`p-4 rounded-2xl border-2 transition-all text-sm font-bold flex items-center justify-between ${selectedLang === lang.name ? 'border-amber-500 bg-amber-50 text-amber-600' : 'border-stone-50 bg-stone-50 text-stone-400'}`}
                      >
                        {lang.label}
                        {selectedLang === lang.name && <Check className="w-4 h-4" />}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {step === 1 && (
                <div className="space-y-8">
                  <div className="space-y-2">
                    <h2 className="text-2xl font-black text-stone-950">Identity</h2>
                    <p className="text-sm text-stone-500 font-medium">Enter your full name.</p>
                  </div>
                  <InputField icon={<User />} placeholder="Full Name" value={name} onChange={setName} />
                </div>
              )}

              {step === 2 && (
                <div className="space-y-8">
                  <div className="space-y-2">
                    <h2 className="text-2xl font-black text-stone-950">Mobile</h2>
                    <p className="text-sm text-stone-500 font-medium">For alerts and updates.</p>
                  </div>
                  <InputField icon={<Phone />} placeholder="Mobile Number" value={phone} onChange={setPhone} type="tel" />
                </div>
              )}

              {step === 3 && (
                <div className="space-y-8">
                  <div className="space-y-2">
                    <h2 className="text-2xl font-black text-stone-950">Farm</h2>
                    <p className="text-sm text-stone-500 font-medium">What is your farm's name?</p>
                  </div>
                  <InputField icon={<Sprout />} placeholder="Farm Name" value={farmName} onChange={setFarmName} />
                </div>
              )}

              {step === 4 && (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <h2 className="text-2xl font-black text-stone-950">Location</h2>
                    <p className="text-sm text-stone-500 font-medium">Localize your data.</p>
                  </div>
                  <div className="space-y-3">
                    <div className="relative">
                      <select 
                        value={state}
                        onChange={(e) => setState(e.target.value)}
                        className="w-full bg-stone-50 border-2 border-stone-100 p-5 pl-14 rounded-2xl outline-none focus:border-amber-500 transition-all font-bold text-stone-900 appearance-none"
                      >
                        <option value="">Select State</option>
                        {STATES.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                      <MapPin className="absolute left-5 top-1/2 -translate-y-1/2 text-stone-400 w-5 h-5" />
                    </div>
                    <InputField icon={<MapPin />} placeholder="District" value={district} onChange={setDistrict} />
                    <InputField icon={<Landmark />} placeholder="Mandal / Tehsil" value={mandal} onChange={setMandal} />
                    <InputField icon={<HomeIcon />} placeholder="Revenue Village" value={revenue} onChange={setRevenue} />
                  </div>
                </div>
              )}

              <motion.button 
                whileTap={{ scale: 0.95 }}
                onClick={handleNext}
                disabled={
                  step === 1 ? !name.trim() : 
                  step === 2 ? !phone.trim() : 
                  step === 3 ? !farmName.trim() : 
                  step === 4 ? (!state || !district.trim() || !mandal.trim() || !revenue.trim()) : 
                  false
                }
                className="w-full bg-stone-950 text-white font-black py-5 rounded-2xl flex items-center justify-center gap-3 shadow-xl disabled:opacity-20 transition-all"
              >
                {step === 4 ? 'Start Farming' : 'Continue'}
                <ArrowRight className="w-5 h-5" />
              </motion.button>
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};

const InputField: React.FC<{ icon: React.ReactNode, placeholder: string, value: string, onChange: (v: string) => void, type?: string }> = ({ icon, placeholder, value, onChange, type = "text" }) => (
  <div className="relative">
    <div className="absolute left-5 top-1/2 -translate-y-1/2 text-stone-400">
      {icon}
    </div>
    <input 
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full bg-stone-50 border-2 border-stone-100 p-5 pl-14 rounded-2xl outline-none focus:border-amber-500 transition-all font-bold text-stone-900"
    />
  </div>
);

export default Onboarding;
