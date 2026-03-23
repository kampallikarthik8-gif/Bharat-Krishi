
import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sprout, ArrowRight, Phone, ShieldCheck, Sparkles, Languages as LangIcon, Lock, ChevronLeft, Loader2, Leaf } from 'lucide-react';
import { auth } from '../src/firebase';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';

interface LoginProps {
  onLogin: (phone: string) => void;
  onSwitchToRegister: () => void;
}

const Login: React.FC<LoginProps> = ({ onLogin, onSwitchToRegister }) => {
  const [phone, setPhone] = React.useState('');
  const [otp, setOtp] = React.useState(['', '', '', '']);
  const [showOtp, setShowOtp] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Error signing in with Google:", error);
    } finally {
      setIsLoading(false);
    }
  };

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
    <div className="min-h-screen bg-[var(--m3-background)] flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-sm space-y-12 relative z-10"
      >
        <div className="text-center space-y-4">
          <div className="inline-flex p-1 rounded-3xl bg-stone-950 shadow-lg overflow-hidden border-2 border-amber-500/20">
            <img 
              src="https://image2url.com/r2/default/images/1773645978799-968d61a0-3ceb-48da-814f-71deb5b97303.png" 
              alt="Bharat Kisan Logo" 
              className="w-20 h-20 object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
          <div className="space-y-1">
            <h1 className="text-4xl font-black text-white m3-headline-large uppercase tracking-tighter">
              Bharat <span className="text-amber-500">Kisan</span>
            </h1>
            <p className="text-[10px] font-black text-stone-500 uppercase tracking-[0.3em]">Precision Farming Hub</p>
            <div className="flex flex-wrap justify-center gap-2 mt-4">
              {['Paddy', 'Wheat', 'Sugarcane', 'Cotton', 'Maize'].map((crop) => (
                <span key={crop} className="px-3 py-1 bg-amber-500/10 text-amber-500 text-[10px] font-bold rounded-full uppercase tracking-wider border border-amber-500/20">
                  {crop}
                </span>
              ))}
              <span className="px-3 py-1 bg-stone-900 text-stone-500 text-[10px] font-bold rounded-full uppercase tracking-wider border border-stone-800">
                +15 More
              </span>
            </div>
          </div>
        </div>

        <div className="m3-card-elevated p-8 bg-stone-950 border border-amber-500/5">
          <AnimatePresence mode="wait">
            {!showOtp ? (
              <motion.div 
                key="phone"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div className="space-y-1">
                  <h2 className="text-2xl font-black text-white uppercase tracking-tight">Welcome</h2>
                  <p className="text-[10px] font-bold text-stone-500 uppercase tracking-widest">Sign in to continue</p>
                </div>

                <div className="space-y-6">
                  <motion.button 
                    whileTap={{ scale: 0.98 }}
                    onClick={handleGoogleSignIn}
                    disabled={isLoading}
                    className="w-full bg-stone-900 border border-stone-800 text-white font-bold py-4 rounded-full flex items-center justify-center gap-3 active:bg-stone-800 transition-all uppercase text-[10px] tracking-widest"
                  >
                    {isLoading ? <Loader2 className="w-5 h-5 animate-spin text-amber-500" /> : (
                      <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
                    )}
                    Continue with Google
                  </motion.button>

                  <div className="flex items-center gap-4 opacity-10">
                    <div className="h-px flex-1 bg-white" />
                    <span className="text-xs font-medium uppercase tracking-widest">OR</span>
                    <div className="h-px flex-1 bg-white" />
                  </div>

                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                      <span className="text-amber-500 font-black text-xs">+91</span>
                      <div className="w-px h-4 bg-amber-500/20" />
                    </div>
                    <input 
                      autoFocus
                      type="tel" 
                      placeholder="Mobile Number"
                      maxLength={10}
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                      className="w-full bg-stone-900 border-b-2 border-amber-500/20 p-4 pl-16 rounded-t-xl outline-none focus:border-amber-500 transition-all font-bold text-white placeholder:text-stone-700"
                    />
                  </div>

                  <motion.button 
                    whileTap={{ scale: 0.98 }}
                    onClick={handleSendOtp}
                    disabled={phone.length !== 10 || isLoading}
                    className="w-full bg-amber-600 text-black font-black py-4 rounded-full flex items-center justify-center gap-2 shadow-xl shadow-amber-900/20 disabled:opacity-40 transition-all uppercase text-[10px] tracking-widest"
                  >
                    {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Get OTP'}
                    {!isLoading && <ArrowRight className="w-5 h-5" />}
                  </motion.button>
                </div>
              </motion.div>
            ) : (
              <motion.div 
                key="otp"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <button 
                  onClick={() => setShowOtp(false)}
                  className="flex items-center gap-2 text-stone-500 hover:text-amber-500 transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Back</span>
                </button>

                <div className="space-y-1">
                  <h2 className="text-2xl font-black text-white uppercase tracking-tight">Verify</h2>
                  <p className="text-[10px] font-bold text-stone-500 uppercase tracking-widest">
                    Code sent to <span className="text-amber-500">+91 {phone}</span>
                  </p>
                </div>

                <div className="space-y-8">
                  <div className="flex justify-between gap-2">
                    {otp.map((digit, idx) => (
                      <input
                        key={idx}
                        id={`otp-${idx}`}
                        type="text"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpChange(idx, e.target.value)}
                        className="w-12 h-16 bg-stone-900 border-b-2 border-amber-500/20 rounded-t-xl text-center text-2xl font-black text-white outline-none focus:border-amber-500 transition-all"
                      />
                    ))}
                  </div>

                  <motion.button 
                    whileTap={{ scale: 0.98 }}
                    onClick={handleVerifyOtp}
                    disabled={otp.some(d => !d) || isLoading}
                    className="w-full bg-amber-600 text-black font-black py-4 rounded-full flex items-center justify-center gap-2 shadow-xl shadow-amber-900/20 disabled:opacity-40 transition-all uppercase text-[10px] tracking-widest"
                  >
                    {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Verify & Enter'}
                    {!isLoading && <Lock className="w-5 h-5" />}
                  </motion.button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="flex justify-center gap-4 opacity-50">
           <div className="flex flex-col items-center text-center">
              <ShieldCheck className="w-5 h-5 mb-1 text-[var(--m3-primary)]" />
              <p className="text-[10px] font-medium uppercase tracking-wider">Secure</p>
           </div>
           <div className="flex flex-col items-center text-center">
              <Sparkles className="w-5 h-5 mb-1 text-[var(--m3-primary)]" />
              <p className="text-[10px] font-medium uppercase tracking-wider">AI Ready</p>
           </div>
           <div className="flex flex-col items-center text-center">
              <Sprout className="w-5 h-5 mb-1 text-[var(--m3-primary)]" />
              <p className="text-[10px] font-medium uppercase tracking-wider">Farm Intel</p>
           </div>
           <div className="flex flex-col items-center text-center">
              <Leaf className="w-5 h-5 mb-1 text-[var(--m3-primary)]" />
              <p className="text-[10px] font-medium uppercase tracking-wider">Active Crops</p>
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
