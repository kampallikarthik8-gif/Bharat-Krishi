import React from 'react';
import { motion } from 'motion/react';
import { 
  Sprout, 
  ShieldCheck, 
  Leaf, 
  Sun, 
  ArrowRight, 
  FileText, 
  Lock, 
  Globe, 
  CloudSun, 
  MessageSquare, 
  Smartphone, 
  CheckCircle2, 
  Mail, 
  ChevronLeft, 
  BarChart3, 
  Database,
  ExternalLink
} from 'lucide-react';

interface PublicPageProps {
  onGoToLogin?: () => void;
  onGoToPrivacy?: () => void;
  onGoToTerms?: () => void;
  onGoToHome?: () => void;
}

export const PublicLandingPage: React.FC<PublicPageProps> = ({
  onGoToLogin,
  onGoToPrivacy,
  onGoToTerms,
  onGoToHome,
}) => {
  return (
    <div className="min-h-screen bg-black text-stone-100 flex flex-col selection:bg-amber-500 selection:text-black">
      {/* Header / Navigation */}
      <header className="sticky top-0 z-50 bg-stone-950/90 backdrop-blur-md border-b border-amber-500/10 px-4 py-3.5">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div 
            onClick={onGoToHome}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center p-1 group-hover:border-amber-500 transition-all overflow-hidden">
              <img 
                src="https://image2url.com/r2/default/images/1773645978799-968d61a0-3ceb-48da-814f-71deb5b97303.png" 
                alt="Bharat Kisan Logo" 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <div>
              <h1 className="text-lg font-black text-white uppercase tracking-tight font-display">
                Bharat <span className="text-amber-500">Kisan</span>
              </h1>
              <p className="text-[9px] font-bold text-stone-400 uppercase tracking-widest">Smart Farming Companion</p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <button
              onClick={onGoToPrivacy}
              className="text-xs font-bold text-stone-400 hover:text-amber-500 uppercase tracking-wider px-2 py-1 transition-colors"
            >
              Privacy Policy
            </button>
            <button
              onClick={onGoToLogin}
              className="bg-amber-500 text-black font-black px-4 py-2 rounded-xl text-xs uppercase tracking-wider hover:bg-amber-400 active:scale-95 transition-all shadow-lg shadow-amber-500/20 flex items-center gap-1.5"
            >
              <span>Launch App</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative px-4 py-16 sm:py-24 bg-gradient-to-b from-stone-950 via-black to-stone-950 overflow-hidden">
        <div className="max-w-4xl mx-auto text-center space-y-8 relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 text-xs font-bold uppercase tracking-widest">
            <Sprout className="w-4 h-4 animate-pulse" />
            <span>AI-Powered Precision Agriculture Platform</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-black text-white uppercase tracking-tight leading-none font-display">
            Empowering Indian Farmers with <span className="text-amber-500 block sm:inline mt-1">Smart AI Intelligence</span>
          </h1>

          <p className="text-stone-300 text-sm sm:text-base max-w-2xl mx-auto font-medium leading-relaxed">
            <strong>Bharat Kisan</strong> is a comprehensive digital agricultural companion designed for farmers across India. Easily diagnose crop diseases, track hyper-local weather alerts, manage farm ledger financials, monitor soil health, and access live mandai market prices in real-time.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <button
              onClick={onGoToLogin}
              className="w-full sm:w-auto bg-amber-500 text-black font-black px-8 py-4 rounded-2xl text-sm uppercase tracking-widest hover:bg-amber-400 active:scale-95 transition-all shadow-xl shadow-amber-500/30 flex items-center justify-center gap-3"
            >
              <span>Get Started Free</span>
              <ArrowRight className="w-5 h-5" />
            </button>
            <button
              onClick={onGoToPrivacy}
              className="w-full sm:w-auto bg-stone-900 text-stone-300 border border-stone-800 font-bold px-6 py-4 rounded-2xl text-xs uppercase tracking-widest hover:bg-stone-800 transition-all flex items-center justify-center gap-2"
            >
              <FileText className="w-4 h-4 text-amber-500" />
              <span>Read Privacy Policy</span>
            </button>
          </div>

          <div className="pt-8 border-t border-stone-900 flex flex-wrap items-center justify-center gap-6 text-stone-500 text-xs font-bold uppercase tracking-wider">
            <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-amber-500" /> Multi-Language Support</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-amber-500" /> Real-Time Weather & Disease AI</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-amber-500" /> Secure Firebase Cloud Sync</span>
          </div>
        </div>
      </section>

      {/* App Purpose & Core Features */}
      <section className="px-4 py-16 bg-stone-950 border-t border-b border-stone-900">
        <div className="max-w-5xl mx-auto space-y-12">
          <div className="text-center space-y-3">
            <h2 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tight font-display">
              Why Use <span className="text-amber-500">Bharat Kisan</span>?
            </h2>
            <p className="text-stone-400 text-xs font-bold uppercase tracking-widest max-w-lg mx-auto">
              Everything you need for successful crop management, field operations, and economic prosperity
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <FeatureCard 
              icon={<Leaf className="w-6 h-6 text-amber-500" />}
              title="AI Crop Disease Scanner"
              description="Snap a picture of damaged leaves or crops to receive instant AI diagnosis, symptoms breakdown, organic remedies, and chemical treatment advice."
            />
            <FeatureCard 
              icon={<CloudSun className="w-6 h-6 text-amber-500" />}
              title="Hyper-Local Weather Hub"
              description="Get localized multi-day weather predictions, rainfall probabilities, humidity indexes, and automated frost or spray window alerts."
            />
            <FeatureCard 
              icon={<BarChart3 className="w-6 h-6 text-amber-500" />}
              title="Live Mandi Market Prices"
              description="Access updated daily commodity prices across national and regional agricultural markets to maximize your harvest sales."
            />
            <FeatureCard 
              icon={<Database className="w-6 h-6 text-amber-500" />}
              title="Soil Health & Input Advisor"
              description="Analyze soil test parameters (NPK, pH, organic carbon) and get personalized fertilizer recommendations tailored for your specific farm size."
            />
            <FeatureCard 
              icon={<FileText className="w-6 h-6 text-amber-500" />}
              title="Farm Financial Ledger"
              description="Track field expenditures, labor payments, seed & fertilizer inputs, and crop yields seamlessly with local and cloud backup."
            />
            <FeatureCard 
              icon={<MessageSquare className="w-6 h-6 text-amber-500" />}
              title="AgriVoice & AI Advisory"
              description="Ask agricultural questions in your local language via voice assistant or AI chatbot for immediate practical farming assistance."
            />
          </div>
        </div>
      </section>

      {/* Developer & Developer Identification Section */}
      <section className="px-4 py-12 bg-black">
        <div className="max-w-4xl mx-auto bg-stone-900/60 rounded-3xl p-6 sm:p-10 border border-amber-500/20 space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-stone-800 pb-6">
            <div>
              <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest block">Application & Authorization Details</span>
              <h3 className="text-xl font-black text-white uppercase tracking-tight">Bharat Kisan | Smart Farming Companion</h3>
              <p className="text-xs text-stone-400 mt-1">
                Official Google OAuth & Service Application Homepage
              </p>
            </div>
            <div className="bg-amber-500/10 px-4 py-2 rounded-2xl border border-amber-500/20 text-right">
              <span className="text-[9px] font-bold text-stone-400 uppercase tracking-widest block">Developer Email</span>
              <span className="text-xs font-mono font-bold text-amber-400">kampallikarthik8@gmail.com</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-stone-300">
            <div className="space-y-2">
              <h4 className="font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Lock className="w-4 h-4 text-amber-500" />
                <span>OAuth Scope Usage</span>
              </h4>
              <p className="text-stone-400 leading-relaxed">
                Bharat Kisan uses Google Sign-In strictly to authenticate farmers, create secure cloud profiles, and sync personal farm ledger data across devices. No unauthorized personal data is ever sold or shared.
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-amber-500" />
                <span>Data Security & Compliance</span>
              </h4>
              <p className="text-stone-400 leading-relaxed">
                All profile information, farm journals, and uploaded crop diagnostic images are stored in encrypted Google Firebase Firestore databases adhering to Google security guidelines.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto bg-stone-950 border-t border-stone-900 py-10 px-4">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6 text-center sm:text-left">
          <div>
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <span className="text-sm font-black text-white uppercase tracking-tight">Bharat <span className="text-amber-500">Kisan</span></span>
              <span className="text-[10px] text-stone-500 font-bold uppercase">v2.5</span>
            </div>
            <p className="text-[11px] text-stone-400 font-medium mt-1">
              Developed by <span className="text-amber-500 font-bold">kampallikarthik8@gmail.com</span>
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 text-xs font-bold uppercase tracking-wider">
            <button onClick={onGoToHome} className="text-stone-400 hover:text-white transition-colors">Home</button>
            <button onClick={onGoToPrivacy} className="text-stone-400 hover:text-amber-500 transition-colors">Privacy Policy</button>
            <button onClick={onGoToTerms} className="text-stone-400 hover:text-amber-500 transition-colors">Terms of Service</button>
            <button onClick={onGoToLogin} className="text-amber-500 hover:text-amber-400 transition-colors">Sign In</button>
          </div>
        </div>
        <div className="max-w-5xl mx-auto text-center text-[10px] text-stone-400 mt-8 pt-6 border-t border-stone-900/60 font-mono">
          &copy; {new Date().getFullYear()} Bharat Kisan | Smart Farming Companion. All rights reserved.
        </div>
      </footer>
    </div>
  );
};

export const PublicPrivacyPolicy: React.FC<PublicPageProps> = ({
  onGoToLogin,
  onGoToHome,
  onGoToTerms,
}) => {
  return (
    <div className="min-h-screen bg-black text-stone-100 flex flex-col selection:bg-amber-500 selection:text-black">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-stone-950/90 backdrop-blur-md border-b border-amber-500/10 px-4 py-3.5">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <button
            onClick={onGoToHome}
            className="flex items-center gap-2 text-stone-400 hover:text-amber-500 font-bold text-xs uppercase tracking-wider transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Back to Home</span>
          </button>
          
          <div className="flex items-center gap-3">
            <span className="text-xs font-black text-white uppercase tracking-tight">Bharat <span className="text-amber-500">Kisan</span></span>
            <button
              onClick={onGoToLogin}
              className="bg-amber-500 text-black font-black px-3.5 py-1.5 rounded-xl text-xs uppercase tracking-wider hover:bg-amber-400 transition-all"
            >
              Sign In
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-12 space-y-10 flex-1">
        <div className="border-b border-stone-800 pb-8 space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 text-amber-500 text-[10px] font-bold uppercase tracking-widest border border-amber-500/20">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Official Legal Document</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white uppercase tracking-tight font-display">
            Privacy Policy
          </h1>
          <p className="text-xs font-mono text-stone-400 uppercase tracking-widest">
            Application: Bharat Kisan | Smart Farming Companion &bull; Developer: kampallikarthik8@gmail.com &bull; Last Updated: July 2026
          </p>
        </div>

        <div className="prose prose-invert prose-amber max-w-none space-y-8 text-stone-300 text-sm leading-relaxed">
          <section className="bg-stone-950 p-6 rounded-2xl border border-stone-800 space-y-3">
            <h2 className="text-lg font-black text-amber-500 uppercase tracking-wider font-display">1. Overview & Purpose</h2>
            <p>
              This Privacy Policy applies to the <strong>Bharat Kisan | Smart Farming Companion</strong> application (&quot;the Service&quot;), developed and operated by <strong>kampallikarthik8@gmail.com</strong>.
            </p>
            <p>
              Bharat Kisan provides digital precision agricultural services, including crop disease diagnosis via image uploading, hyper-local weather alerts, mandi crop market prices, financial logs, and soil testing advisories. We are committed to maintaining the trust and privacy of all users.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-black text-white uppercase tracking-wider font-display">2. Information We Collect</h2>
            <p>When you register, sign in, or interact with Bharat Kisan, we may collect the following information:</p>
            <ul className="list-disc pl-5 space-y-2 text-stone-400">
              <li><strong>Account Information:</strong> Name, phone number, and Google Account email address provided during OAuth authentication.</li>
              <li><strong>Farm Profile Data:</strong> Farm location details (State, District, Mandal, Village), farm acreage, soil type preferences, and selected crop types.</li>
              <li><strong>Uploaded Media:</strong> Images of crop leaves uploaded for AI disease scanning and diagnosis.</li>
              <li><strong>Location Data:</strong> Approximate or exact device GPS coordinates (with explicit user permission) used exclusively to render hyper-local weather forecasts and nearby market prices.</li>
              <li><strong>Operational Logs:</strong> Farm journal entries, financial transaction summaries, and crop inventory records stored under your user profile.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-black text-white uppercase tracking-wider font-display">3. How We Use Your Information</h2>
            <p>We use the collected information solely for providing and improving agricultural features:</p>
            <ul className="list-disc pl-5 space-y-2 text-stone-400">
              <li>To deliver accurate AI-powered plant disease diagnoses and remedies.</li>
              <li>To present real-time weather forecasts, spray window alerts, and irrigation advisories.</li>
              <li>To allow seamless synchronization of your farm ledger across mobile and web devices using Google Firebase.</li>
              <li>To manage your account and authentication via Google OAuth and Firebase Auth.</li>
              <li>We <strong>NEVER</strong> sell, rent, or trade your personal data or farm records to third-party advertisers.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-black text-white uppercase tracking-wider font-display">4. Third-Party Integrations & Services</h2>
            <p>Bharat Kisan integrates with trusted cloud infrastructure and APIs:</p>
            <ul className="list-disc pl-5 space-y-2 text-stone-400">
              <li><strong>Google Firebase:</strong> Used for user authentication (Google Auth / Phone Auth) and database storage (Firestore).</li>
              <li><strong>Google Gemini AI:</strong> Used for crop disease analysis and natural language voice/chat assistant queries.</li>
              <li><strong>OpenWeatherMap API:</strong> Used for local weather predictions.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-black text-white uppercase tracking-wider font-display">5. Data Retention & User Rights</h2>
            <p>
              You maintain complete ownership of your farm data. You have the right to inspect, export, or delete your account records at any time directly through the app Settings menu or by contacting our developer support.
            </p>
          </section>

          <section className="bg-stone-900/60 p-6 rounded-2xl border border-amber-500/20 space-y-3">
            <h2 className="text-lg font-black text-amber-500 uppercase tracking-wider font-display">6. Developer Contact & Verification Support</h2>
            <p className="text-stone-300">
              If you have any questions regarding this Privacy Policy or data protection, please contact the developer:
            </p>
            <p className="font-mono text-sm font-bold text-white">
              Developer Email: <a href="mailto:kampallikarthik8@gmail.com" className="text-amber-400 underline">kampallikarthik8@gmail.com</a><br />
              App Name: Bharat Kisan | Smart Farming Companion
            </p>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-stone-950 border-t border-stone-900 py-8 px-4 text-center">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-stone-500 font-bold uppercase tracking-wider">
          <span>Bharat Kisan &copy; {new Date().getFullYear()}</span>
          <div className="flex gap-4">
            <button onClick={onGoToHome} className="hover:text-amber-500">Home</button>
            <button onClick={onGoToTerms} className="hover:text-amber-500">Terms of Service</button>
            <button onClick={onGoToLogin} className="hover:text-amber-500">Sign In</button>
          </div>
        </div>
      </footer>
    </div>
  );
};

export const PublicTermsOfService: React.FC<PublicPageProps> = ({
  onGoToLogin,
  onGoToHome,
  onGoToPrivacy,
}) => {
  return (
    <div className="min-h-screen bg-black text-stone-100 flex flex-col selection:bg-amber-500 selection:text-black">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-stone-950/90 backdrop-blur-md border-b border-amber-500/10 px-4 py-3.5">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <button
            onClick={onGoToHome}
            className="flex items-center gap-2 text-stone-400 hover:text-amber-500 font-bold text-xs uppercase tracking-wider transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Back to Home</span>
          </button>
          
          <div className="flex items-center gap-3">
            <span className="text-xs font-black text-white uppercase tracking-tight">Bharat <span className="text-amber-500">Kisan</span></span>
            <button
              onClick={onGoToLogin}
              className="bg-amber-500 text-black font-black px-3.5 py-1.5 rounded-xl text-xs uppercase tracking-wider hover:bg-amber-400 transition-all"
            >
              Sign In
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-12 space-y-10 flex-1">
        <div className="border-b border-stone-800 pb-8 space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 text-amber-500 text-[10px] font-bold uppercase tracking-widest border border-amber-500/20">
            <FileText className="w-3.5 h-3.5" />
            <span>Terms & Conditions</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white uppercase tracking-tight font-display">
            Terms of Service
          </h1>
          <p className="text-xs font-mono text-stone-400 uppercase tracking-widest">
            Bharat Kisan | Smart Farming Companion &bull; Developer: kampallikarthik8@gmail.com
          </p>
        </div>

        <div className="prose prose-invert prose-amber max-w-none space-y-8 text-stone-300 text-sm leading-relaxed">
          <section className="space-y-3">
            <h2 className="text-lg font-black text-amber-500 uppercase tracking-wider font-display">1. Acceptance of Terms</h2>
            <p>
              By accessing or using <strong>Bharat Kisan | Smart Farming Companion</strong>, you agree to be bound by these Terms of Service. If you do not agree, please do not use the application.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-black text-white uppercase tracking-wider font-display">2. Agricultural Advisory Disclaimer</h2>
            <p>
              Bharat Kisan provides AI-powered disease recommendations, weather alerts, fertilizer inputs, and market price data for informational and guidance purposes only. Farmers should combine application insights with local agricultural extensions and professional agronomic evaluation.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-black text-white uppercase tracking-wider font-display">3. User Conduct & Accounts</h2>
            <p>
              Users are responsible for maintaining the confidentiality of their authentication credentials. You agree not to misuse the platform, upload malicious media, or disrupt network infrastructure.
            </p>
          </section>

          <section className="bg-stone-900/60 p-6 rounded-2xl border border-stone-800 space-y-2">
            <h2 className="text-lg font-black text-white uppercase tracking-wider font-display">4. Contact Information</h2>
            <p className="text-stone-400 text-xs">
              For questions regarding these Terms, contact: <span className="text-amber-400 font-mono font-bold">kampallikarthik8@gmail.com</span>
            </p>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-stone-950 border-t border-stone-900 py-8 px-4 text-center">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-stone-500 font-bold uppercase tracking-wider">
          <span>Bharat Kisan &copy; {new Date().getFullYear()}</span>
          <div className="flex gap-4">
            <button onClick={onGoToHome} className="hover:text-amber-500">Home</button>
            <button onClick={onGoToPrivacy} className="hover:text-amber-500">Privacy Policy</button>
            <button onClick={onGoToLogin} className="hover:text-amber-500">Sign In</button>
          </div>
        </div>
      </footer>
    </div>
  );
};

const FeatureCard: React.FC<{ icon: React.ReactNode; title: string; description: string }> = ({
  icon,
  title,
  description,
}) => (
  <div className="bg-stone-900/70 border border-stone-800 p-6 rounded-3xl space-y-3 hover:border-amber-500/30 transition-all hover:bg-stone-900">
    <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
      {icon}
    </div>
    <h3 className="text-base font-black text-white uppercase tracking-tight">{title}</h3>
    <p className="text-xs text-stone-400 leading-relaxed font-medium">{description}</p>
  </div>
);
