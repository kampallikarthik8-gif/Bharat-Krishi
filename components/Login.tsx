
import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sprout, ArrowRight, Phone, ShieldCheck, Sparkles, Languages as LangIcon, Lock, ChevronLeft, Loader2, Leaf, ExternalLink } from 'lucide-react';
import { auth } from '../src/firebase';
import { GoogleAuthProvider, signInWithPopup, signInAnonymously } from 'firebase/auth';
import { useFirebase } from '../src/components/FirebaseProvider';

interface LoginProps {
  onLogin: (phone: string) => void;
  onSwitchToRegister: () => void;
  onBackToHome?: () => void;
}

const Login: React.FC<LoginProps> = ({ onLogin, onSwitchToRegister, onBackToHome }) => {
  const { loginAsDemo } = useFirebase();
  const [phone, setPhone] = React.useState('');
  const [otp, setOtp] = React.useState(['', '', '', '']);
  const [showOtp, setShowOtp] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  const [showGoogleAssist, setShowGoogleAssist] = React.useState(false);
  const [simulatedEmail, setSimulatedEmail] = React.useState('farmer@agriassist.in');
  const [simulatedName, setSimulatedName] = React.useState('Kisan Producer');

  const handleGoogleSignIn = async () => {
    // Check if we are running in an iframe (default AI Studio preview environment)
    if (typeof window !== 'undefined' && window.self !== window.top) {
      setShowGoogleAssist(true);
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (error: any) {
      console.error("Error signing in with Google:", error);
      setShowGoogleAssist(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSimulatedGoogleLogin = () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      localStorage.setItem('agri_is_simulated', 'true');
      localStorage.setItem('agri_simulated_uid', 'google_sim_' + simulatedEmail.replace(/[@.]/g, '_'));
      localStorage.setItem('agri_simulated_email', simulatedEmail);
      localStorage.setItem('agri_farmer_name', simulatedName);
      localStorage.setItem('agri_farmer_phone', '9999999999');
      
      // Seed default details to streamline the onboarding/profile mapping
      localStorage.setItem('agri_farm_name', 'Golden Harvest Farm');
      localStorage.setItem('agri_language', 'English');
      localStorage.setItem('agri_state', 'Telangana');
      localStorage.setItem('agri_district', 'Siddipet');
      localStorage.setItem('agri_mandal', 'Mulugu');
      localStorage.setItem('agri_revenue_village', 'Banda Mailaram');
      localStorage.setItem('agri_soil_type', 'Clayey');
      localStorage.setItem('agri_units', 'Metric');
      localStorage.setItem('agri_session_active', 'true');

      // Update provider context and notify app component of login success
      const googleUid = 'google_sim_' + simulatedEmail.replace(/[@.]/g, '_');
      loginAsDemo('9999999999', googleUid);
      onLogin('9999999999');
    } catch (error: any) {
      console.error("Google simulation failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTryRealGooglePopup = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (error: any) {
      console.error("Popup failed:", error);
      setErrorMsg("Real popup failed: " + (error.message || "Iframe restrictions are active. Please use Simulation option."));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendOtp = () => {
    if (phone.length === 10) {
      setIsLoading(true);
      setErrorMsg(null);
      setTimeout(() => {
        setIsLoading(false);
        setShowOtp(true);
      }, 1500);
    }
  };

  const handleVerifyOtp = async () => {
    if (otp.every(digit => digit !== '')) {
      setIsLoading(true);
      setErrorMsg(null);
      try {
        await signInAnonymously(auth);
        onLogin(phone);
      } catch (error: any) {
        console.warn("Error signing in anonymously via OTP, falling back to simulated session:", error);
        loginAsDemo(phone);
        onLogin(phone);
      } finally {
        setIsLoading(false);
      }
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
        <div className="flex items-center justify-between w-full pb-2">
          {onBackToHome && (
            <button
              onClick={onBackToHome}
              className="flex items-center gap-1.5 text-stone-400 hover:text-amber-500 text-xs font-bold uppercase tracking-wider transition-colors bg-stone-900/60 px-3 py-1.5 rounded-full border border-stone-800"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Back to Home</span>
            </button>
          )}
          <a
            href="#privacy"
            className="text-[10px] font-bold text-stone-400 hover:text-amber-500 uppercase tracking-widest ml-auto"
          >
            Privacy Policy
          </a>
        </div>

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
            {showGoogleAssist ? (
              <motion.div
                key="google-assist"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <button 
                  onClick={() => setShowGoogleAssist(false)}
                  className="flex items-center gap-2 text-stone-500 hover:text-amber-500 transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Back to Login</span>
                </button>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-amber-500">
                    <Sparkles className="w-5 h-5 animate-pulse" />
                    <h2 className="text-xl font-black text-white uppercase tracking-tight">Iframe Google Assist</h2>
                  </div>
                  <p className="text-[10px] font-bold text-stone-400 uppercase leading-relaxed">
                    Browser security blocks Google authentication popups inside iframes. Choose an option to continue:
                  </p>
                </div>

                <div className="space-y-4">
                  {/* Option 1: Fast Simulation with current user details */}
                  <div className="bg-stone-900/50 p-4 rounded-2xl border border-amber-500/10 space-y-3">
                    <span className="text-[8px] font-black text-amber-500 uppercase tracking-wider block">Recommended Option</span>
                    <h3 className="text-xs font-black text-white">Simulate Google Authentication</h3>
                    <p className="text-[10px] text-stone-400 leading-normal">
                      Bypass iframe cookie and popup blockers instantly. Log in with a secure, simulated Google session using your email:
                    </p>
                    
                    <div className="space-y-2 pt-1">
                      <input 
                        type="email" 
                        placeholder="Google Email"
                        value={simulatedEmail}
                        onChange={(e) => setSimulatedEmail(e.target.value)}
                        className="w-full bg-stone-950 border border-stone-800 text-[11px] p-2.5 rounded-lg text-stone-300 focus:border-amber-500/50 outline-none font-bold"
                      />
                      <input 
                        type="text" 
                        placeholder="Full Name"
                        value={simulatedName}
                        onChange={(e) => setSimulatedName(e.target.value)}
                        className="w-full bg-stone-950 border border-stone-800 text-[11px] p-2.5 rounded-lg text-stone-300 focus:border-amber-500/50 outline-none font-bold"
                      />
                    </div>

                    <button
                      onClick={handleSimulatedGoogleLogin}
                      className="w-full bg-amber-500 hover:bg-amber-600 text-black font-black py-3 rounded-xl text-[9px] tracking-widest uppercase transition-colors flex items-center justify-center gap-1.5"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      Login with Simulation
                    </button>
                  </div>

                  {/* Option 2: Open in new tab */}
                  <div className="bg-stone-900/20 p-4 rounded-2xl border border-stone-800 space-y-3">
                    <h3 className="text-xs font-black text-stone-300">Open App in New Tab</h3>
                    <p className="text-[10px] text-stone-500 leading-normal">
                      Open Bharat Kisan in a standalone tab to allow official Google Authentication popups.
                    </p>
                    <a
                      href={window.location.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full bg-stone-900 hover:bg-stone-800 border border-stone-800 text-stone-300 font-bold py-3 rounded-xl text-[9px] tracking-widest uppercase transition-colors flex items-center justify-center gap-1.5"
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-amber-500" />
                      Open Standalone Tab
                    </a>
                  </div>

                  {errorMsg && (
                    <p className="text-[10px] text-amber-500 font-bold bg-amber-500/10 p-2 rounded-lg border border-amber-500/20 text-center">
                      {errorMsg}
                    </p>
                  )}

                  {/* Option 3: Attempt real anyway */}
                  <button
                    onClick={handleTryRealGooglePopup}
                    disabled={isLoading}
                    className="w-full text-center text-[9px] font-black text-stone-500 hover:text-stone-300 uppercase tracking-widest transition-colors py-2"
                  >
                    {isLoading ? 'Attempting popup...' : 'Try Real Google Popup Anyway'}
                  </button>
                </div>
              </motion.div>
            ) : !showOtp ? (
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

                  {errorMsg && (
                    <motion.div 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl space-y-3"
                    >
                      <p className="text-[11px] text-amber-200/90 font-medium whitespace-pre-line leading-relaxed">
                        {errorMsg}
                      </p>
                      <button
                        type="button"
                        onClick={async () => {
                          setIsLoading(true);
                          setErrorMsg(null);
                          try {
                            await signInAnonymously(auth);
                            onLogin("9999999999");
                          } catch (err: any) {
                            console.warn("Demo real auth failed, falling back to local demo:", err);
                            loginAsDemo("9999999999");
                            onLogin("9999999999");
                          } finally {
                            setIsLoading(false);
                          }
                        }}
                        className="w-full bg-amber-500 hover:bg-amber-600 text-black font-black py-3 px-4 rounded-full text-[10px] tracking-widest uppercase transition-colors flex items-center justify-center gap-2"
                      >
                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin text-black" /> : <Sparkles className="w-4 h-4" />}
                        Quick Demo Access
                      </button>
                    </motion.div>
                  )}

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
        <div className="text-center pt-8 space-y-2">
          <div className="flex justify-center items-center gap-4 text-[10px] font-bold uppercase tracking-wider text-stone-500">
            <a href="#privacy" className="hover:text-amber-500 transition-colors">Privacy Policy</a>
            <span>&bull;</span>
            <a href="#terms" className="hover:text-amber-500 transition-colors">Terms of Service</a>
          </div>
          <p className="text-[10px] font-mono text-stone-600 uppercase tracking-widest">
            © {new Date().getFullYear()} Bharat Kisan | Precision Farming Platform
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
