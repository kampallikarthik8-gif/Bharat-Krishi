
import React from 'react';
import { 
  HelpCircle, 
  MessageSquare, 
  Send, 
  ChevronDown, 
  ChevronUp, 
  Star, 
  Mail, 
  Phone, 
  Globe, 
  CheckCircle2, 
  AlertCircle,
  ThumbsUp,
  ThumbsDown,
  Info,
  Code,
  ExternalLink
} from 'lucide-react';

const FAQS = [
  {
    q: "How does the Disease Scanner work?",
    a: "Our scanner uses advanced Gemini AI vision models to analyze patterns on leaves and stems. For best results, ensure the plant is well-lit and the camera is focused on the affected area."
  },
  {
    q: "Can I use the app offline?",
    a: "Most AI features require an internet connection to sync with our cloud-based agronomy database. However, your Farm Journal is saved locally and can be accessed anytime."
  },
  {
    q: "How accurate are the harvest predictions?",
    a: "Predictions are based on typical GDD (Growing Degree Day) logic for your variety and current weather trends. They should be used as a guide alongside physical maturity checks."
  },
  {
    q: "Where does the market data come from?",
    a: "AgriAssist uses real-time Google Search grounding to find the most recent prices from official agricultural boards and news sources in your region."
  }
];

const HelpFeedback: React.FC = () => {
  const [openFaq, setOpenFaq] = React.useState<number | null>(0);
  const [rating, setRating] = React.useState(0);
  const [feedback, setFeedback] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isSubmitted, setIsSubmitted] = React.useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedback.trim() && rating === 0) return;
    setIsSubmitting(true);
    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSubmitted(true);
      setFeedback('');
      setRating(0);
    }, 1500);
  };

  return (
    <div className="space-y-8 pb-12 animate-in fade-in slide-in-from-bottom-6 duration-700">
      {/* Header Info */}
      <div className="bg-[#ffddb3] rounded-[2.5rem] p-8 shadow-sm relative overflow-hidden">
        <div className="relative z-10">
          <h2 className="text-3xl font-black text-[#291800] mb-2">Help Center</h2>
          <p className="text-[#825500] text-sm font-bold uppercase tracking-widest">Support Hub & Feedback</p>
          <div className="mt-6 flex items-center gap-4">
             <div className="bg-white/40 p-3 rounded-2xl backdrop-blur-sm border border-white/20">
                <Info className="w-5 h-5 text-[#825500]" />
             </div>
             <p className="text-[11px] font-medium text-[#554433] leading-snug">
               Our community experts and AI support are here to help you optimize your farm operations 24/7.
             </p>
          </div>
        </div>
        <HelpCircle className="absolute top-0 right-0 w-48 h-48 text-[#825500] opacity-10 -mr-12 -mt-12" />
      </div>

      {/* FAQ Section */}
      <div className="px-2">
        <h3 className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-4 mb-4 flex items-center gap-2">
          <HelpCircle className="w-4 h-4" /> Frequently Asked Questions
        </h3>
        <div className="space-y-3">
          {FAQS.map((faq, i) => (
            <div 
              key={i} 
              className="bg-white rounded-3xl border border-stone-100 overflow-hidden transition-all shadow-sm"
            >
              <button 
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="w-full flex items-center justify-between p-5 text-left active:bg-stone-50 transition-colors"
              >
                <span className="text-sm font-black text-stone-800 pr-4">{faq.q}</span>
                {openFaq === i ? <ChevronUp className="w-4 h-4 text-[#825500]" /> : <ChevronDown className="w-4 h-4 text-stone-300" />}
              </button>
              {openFaq === i && (
                <div className="px-5 pb-6 pt-0 animate-in fade-in slide-in-from-top-2 duration-300">
                  <p className="text-xs text-stone-500 font-medium leading-relaxed">{faq.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Feedback Form */}
      <div className="px-2">
        <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-stone-200">
           {isSubmitted ? (
             <div className="py-12 flex flex-col items-center text-center animate-in zoom-in-95 duration-500">
                <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mb-6">
                   <CheckCircle2 className="w-10 h-10 text-emerald-600" />
                </div>
                <h3 className="text-xl font-black text-stone-900 mb-2">Thank You, Farmer!</h3>
                <p className="text-sm text-stone-500 font-medium mb-8 max-w-[220px]">
                  Your feedback helps us build a stronger AgriAssist for everyone.
                </p>
                <button 
                  onClick={() => setIsSubmitted(false)}
                  className="px-8 py-3 bg-stone-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest active:scale-95 transition-all"
                >
                  Send More Feedback
                </button>
             </div>
           ) : (
             <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                   <h3 className="text-xl font-black text-stone-900 mb-1 flex items-center gap-3">
                      <MessageSquare className="w-6 h-6 text-[#825500]" />
                      Share Your Thoughts
                   </h3>
                   <p className="text-xs text-stone-400 font-medium tracking-tight">How is your experience with AgriAssist so far?</p>
                </div>

                <div className="flex flex-col items-center gap-4 py-4 bg-stone-50 rounded-3xl border border-stone-100">
                   <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Rate the app</p>
                   <div className="flex gap-3">
                      {[1, 2, 3, 4, 5].map(star => (
                        <button 
                          key={star}
                          type="button"
                          onClick={() => setRating(star)}
                          className={`transition-all ${rating >= star ? 'scale-110 text-amber-500' : 'text-stone-200 hover:text-amber-200'}`}
                        >
                          <Star className={`w-8 h-8 ${rating >= star ? 'fill-current' : ''}`} />
                        </button>
                      ))}
                   </div>
                </div>

                <div className="space-y-1">
                   <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-3">Message</label>
                   <textarea 
                     value={feedback}
                     onChange={e => setFeedback(e.target.value)}
                     rows={4}
                     placeholder="Bugs found, feature requests, or praise..."
                     className="w-full bg-stone-50 border border-stone-200 rounded-3xl p-5 text-sm font-medium outline-none focus:ring-2 focus:ring-[#825500] focus:bg-white transition-all resize-none shadow-inner"
                   />
                </div>

                <button 
                  type="submit"
                  disabled={isSubmitting || (!feedback.trim() && rating === 0)}
                  className="w-full bg-[#825500] text-white font-black py-4.5 rounded-[1.5rem] flex items-center justify-center gap-3 shadow-xl active:scale-95 transition-all disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <><div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" /> Sending...</>
                  ) : (
                    <><Send className="w-5 h-5" /> Submit Feedback</>
                  )}
                </button>
             </form>
           )}
        </div>
      </div>

      {/* Support Channels */}
      <div className="px-2 space-y-3">
         <h3 className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-4">Official Links & Support</h3>
         <div className="grid grid-cols-1 gap-3">
            <a href="https://meebhoomi.ap.gov.in/" target="_blank" rel="noopener" className="bg-emerald-50 p-5 rounded-[2rem] border border-stone-100 flex items-center justify-between active:scale-[0.98] transition-all shadow-sm group">
               <div className="flex items-center gap-5">
                  <div className="bg-white p-3 rounded-2xl shadow-sm text-emerald-600">
                     <Globe className="w-5 h-5" />
                  </div>
                  <div>
                     <p className="text-[9px] font-black uppercase tracking-widest text-emerald-600 opacity-60 mb-0.5">MeeBhoomi Portal</p>
                     <p className="text-sm font-bold text-emerald-800">Verify Official Land Records</p>
                  </div>
               </div>
               <ExternalLink className="w-4 h-4 text-emerald-300 group-hover:text-emerald-600" />
            </a>
            <SupportCard 
              icon={<Mail />} 
              label="Email Support" 
              value="support@agriassist.ai" 
              color="bg-blue-50" 
              textColor="text-blue-700" 
            />
            <SupportCard 
              icon={<Phone />} 
              label="Farmer Helpline" 
              value="+1 800-AGRI-HELP" 
              color="bg-emerald-50" 
              textColor="text-emerald-700" 
            />
            <SupportCard 
              icon={<Globe />} 
              label="Web Knowledge Base" 
              value="docs.agriassist.ai" 
              color="bg-stone-100" 
              textColor="text-stone-700" 
            />
         </div>
      </div>

      {/* Footer Branding & Developer Credit */}
      <div className="py-12 text-center opacity-40">
         <div className="flex items-center justify-center gap-2 mb-3">
            <AlertCircle className="w-4 h-4" />
            <span className="text-[10px] font-black uppercase tracking-widest">AgriAssist Bharat v2.5</span>
         </div>
         <div className="flex flex-col items-center gap-1.5 mb-4">
            <p className="text-[9px] font-medium max-w-[240px] mx-auto leading-relaxed italic">
              AI-powered decisions should be verified with local agronomy experts.
            </p>
         </div>
         <div className="inline-flex items-center gap-2 px-4 py-2 bg-stone-100 rounded-2xl border border-stone-200">
            <Code className="w-3 h-3 text-stone-400" />
            <span className="text-[10px] font-black uppercase text-stone-600 tracking-wider">
              Developed by Kampalli Karthik
            </span>
         </div>
      </div>
    </div>
  );
};

const SupportCard: React.FC<{ icon: React.ReactNode, label: string, value: string, color: string, textColor: string }> = ({ icon, label, value, color, textColor }) => (
  <button className={`${color} p-5 rounded-[2rem] border border-stone-100 flex items-center gap-5 active:scale-[0.98] transition-all shadow-sm group w-full text-left`}>
     <div className="bg-white/60 p-3 rounded-2xl shadow-sm text-stone-500 group-hover:text-[#825500] transition-colors">
        {React.cloneElement(icon as React.ReactElement<any>, { className: 'w-5 h-5' })}
     </div>
     <div>
        <p className={`text-[9px] font-black uppercase tracking-widest opacity-60 mb-0.5 ${textColor}`}>{label}</p>
        <p className={`text-sm font-bold ${textColor}`}>{value}</p>
     </div>
  </button>
);

export default HelpFeedback;
