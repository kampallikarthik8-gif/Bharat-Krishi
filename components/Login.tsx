
import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sprout, ArrowRight, Phone, ShieldCheck, Sparkles, Languages as LangIcon, Lock, ChevronLeft, Loader2 } from 'lucide-react';

interface LoginProps {
  onLogin: (phone: string) => void;
  onSwitchToRegister: () => void;
}

const Login: React.FC<LoginProps> = ({ onLogin, onSwitchToRegister }) => {
  const [phone, setPhone] = React.useState('');
  const [otp, setOtp] = React.useState(['', '', '', '']);
  const [showOtp, setShowOtp] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);

  const handleSendOtp = () => {
    if (phone.length === 10) {
      setIsLoading(true);
      setTimeout(() => {
        setIsLoading(false);
        setShowOtp(true);
      }, 1500);
    }
  };

  const handleVerifyOtp = () => {
    if (otp.every(digit => digit !== '')) {
      setIsLoading(true);
      setTimeout(() => {
        setIsLoading(false);
        onLogin(phone);
      }, 1500);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (value.length <= 1 && /^\d*$/.test(value)) {
      const newOtp = [...otp];
      newOtp[index] = value;
      setOtp(newOtp);
      
      if (value && index < 3) {
        const nextInput = document.getElementById(`otp-${index + 1}`);
        nextInput?.focus();
      }
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Native App Background */}
      <div className="absolute inset-0 bg-stone-50/50" />
      <div className="absolute top-0 left-0 right-0 h-64 bg-gradient-to-b from-amber-100/50 to-transparent" />

      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-sm space-y-12 relative z-10"
      >
        <div className="text-center space-y-6">
          <motion.div 
            initial={{ y: -20 }}
            animate={{ y: 0 }}
            className="inline-flex p-6 rounded-[3rem] bg-stone-950 shadow-2xl"
          >
            <Sprout className="w-14 h-14 text-amber-500" />
          </motion.div>
          <div className="space-y-2">
            <h1 className="text-5xl font-light serif text-stone-950 tracking-tight">
              Bharat<span className="text-amber-600">Krishi</span>
            </h1>
            <p className="label-micro">Precision Farming</p>
          </div>
        </div>

        <div className="card-crafted p-10">
          <AnimatePresence mode="wait">
            {!showOtp ? (
              <motion.div 
                key="phone"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-10"
              >
                <div className="space-y-3">
                  <h2 className="text-3xl font-light serif text-stone-950">Welcome</h2>
                  <p className="text-sm text-stone-500 font-medium">Enter your mobile to sign in.</p>
                </div>

                <div className="space-y-8">
                  <div className="relative">
                    <div className="absolute left-6 top-1/2 -translate-y-1/2 flex items-center gap-3">
                      <span className="text-stone-400 font-bold">+91</span>
                      <div className="w-px h-5 bg-stone-200" />
                    </div>
                    <input 
                      autoFocus
                      type="tel" 
                      placeholder="Mobile Number"
                      maxLength={10}
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                      className="w-full bg-stone-50 border-2 border-stone-100 p-6 pl-24 rounded-[2rem] outline-none focus:border-amber-500 transition-all font-bold text-stone-900"
                    />
                  </div>

                  <motion.button 
                    whileTap={{ scale: 0.95 }}
                    onClick={handleSendOtp}
                    disabled={phone.length !== 10 || isLoading}
                    className="w-full bg-stone-950 text-white font-bold py-6 rounded-[2rem] flex items-center justify-center gap-4 shadow-2xl disabled:opacity-20 transition-all uppercase tracking-widest text-[11px]"
                  >
                    {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Get OTP'}
                    {!isLoading && <ArrowRight className="w-6 h-6" />}
                  </motion.button>

                  <div className="text-center">
                    <button 
                      onClick={onSwitchToRegister}
                      className="label-micro text-amber-600 hover:underline"
                    >
                      New here? Create Account
                    </button>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div 
                key="otp"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-10"
              >
                <button 
                  onClick={() => setShowOtp(false)}
                  className="flex items-center gap-3 text-stone-400"
                >
                  <ChevronLeft className="w-5 h-5" />
                  <span className="label-micro">Back</span>
                </button>

                <div className="space-y-3">
                  <h2 className="text-3xl font-light serif text-stone-950">Verify</h2>
                  <p className="text-sm text-stone-500 font-medium">
                    Code sent to <span className="text-stone-950 font-bold">+91 {phone}</span>
                  </p>
                </div>

                <div className="space-y-10">
                  <div className="flex justify-between gap-4">
                    {otp.map((digit, idx) => (
                      <input
                        key={idx}
                        id={`otp-${idx}`}
                        type="text"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpChange(idx, e.target.value)}
                        className="w-16 h-20 bg-stone-50 border-2 border-stone-100 rounded-[2rem] text-center text-3xl font-light serif text-stone-950 outline-none focus:border-amber-500 transition-all"
                      />
                    ))}
                  </div>

                  <motion.button 
                    whileTap={{ scale: 0.95 }}
                    onClick={handleVerifyOtp}
                    disabled={otp.some(d => !d) || isLoading}
                    className="w-full bg-stone-950 text-white font-bold py-6 rounded-[2rem] flex items-center justify-center gap-4 shadow-2xl disabled:opacity-20 transition-all uppercase tracking-widest text-[11px]"
                  >
                    {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Verify & Enter'}
                    {!isLoading && <Lock className="w-6 h-6 text-amber-400" />}
                  </motion.button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Native Trust Badges */}
        <div className="flex justify-center gap-12 opacity-40">
           <div className="flex flex-col items-center text-center">
              <ShieldCheck className="w-6 h-6 mb-2" />
              <p className="label-micro">Secure</p>
           </div>
           <div className="flex flex-col items-center text-center">
              <Sparkles className="w-6 h-6 mb-2" />
              <p className="label-micro">AI Ready</p>
           </div>
        </div>

        <div className="text-center pt-8">
          <p className="label-micro opacity-40">
            © {new Date().getFullYear()} Nexus Creative Studio
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
