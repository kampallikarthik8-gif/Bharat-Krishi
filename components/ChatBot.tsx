
import React from 'react';
import { chatWithExpert } from '../services/geminiService';
import { MessageSquare, Send, User, Bot, Loader2 } from 'lucide-react';

interface ChatBotProps {
  language: string;
}

const ChatBot: React.FC<ChatBotProps> = ({ language }) => {
  const [messages, setMessages] = React.useState<{role: 'user' | 'bot', text: string}[]>([
    { role: 'bot', text: 'Hello! I am your AgriAssist expert. How can I help you in your farm today?' }
  ]);
  const [input, setInput] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setLoading(true);

    try {
      const profile = {
        farmerName: localStorage.getItem('agri_farmer_name') || 'John Doe',
        farmName: localStorage.getItem('agri_farm_name') || 'Sunrise Acres',
        location: localStorage.getItem('agri_farm_location') || 'N/A',
        state: localStorage.getItem('agri_state') || 'N/A',
        district: localStorage.getItem('agri_district') || 'N/A',
        farmSize: localStorage.getItem('agri_farm_size') || 'N/A',
        sizeUnit: localStorage.getItem('agri_units') === 'Imperial' ? 'Acres' : 'Hectares',
        mainCrops: JSON.parse(localStorage.getItem('agri_main_crops') || '[]'),
        soilType: localStorage.getItem('agri_soil_type') || 'N/A',
        irrigation: localStorage.getItem('agri_irrigation') || 'N/A',
        terrain: localStorage.getItem('agri_terrain') || 'N/A',
        cropHistory: JSON.parse(localStorage.getItem('agri_crop_history') || '[]'),
        pastIssues: JSON.parse(localStorage.getItem('agri_past_issues') || '[]')
      };
      const response = await chatWithExpert(userMsg, messages, language, profile);
      setMessages(prev => [...prev, { role: 'bot', text: response || "I'm sorry, I couldn't process that." }]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-[calc(100vh-200px)] flex flex-col bg-white rounded-3xl border border-stone-200 overflow-hidden shadow-sm">
      <div className="p-6 bg-emerald-900 text-white flex items-center gap-3">
        <div className="bg-emerald-500 p-2 rounded-full">
          <Bot className="w-5 h-5" />
        </div>
        <div>
          <h2 className="font-bold">AgriExpert Advisor ({language})</h2>
          <p className="text-xs text-emerald-300">Always active • 20+ years experience</p>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-4 bg-stone-50">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`
              max-w-[80%] flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}
            `}>
              <div className={`
                shrink-0 w-8 h-8 rounded-full flex items-center justify-center
                ${msg.role === 'user' ? 'bg-stone-200 text-stone-600' : 'bg-emerald-100 text-emerald-600'}
              `}>
                {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>
              <div className={`
                p-4 rounded-2xl text-sm leading-relaxed shadow-sm
                ${msg.role === 'user' ? 'bg-stone-900 text-white' : 'bg-white text-stone-800'}
              `}>
                {msg.text}
              </div>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="flex gap-3 items-center text-emerald-600">
              <div className="bg-emerald-100 p-2 rounded-full animate-pulse">
                <Loader2 className="w-4 h-4 animate-spin" />
              </div>
              <span className="text-xs font-medium italic">Expert is typing...</span>
            </div>
          </div>
        )}
      </div>

      <form onSubmit={handleSend} className="p-4 bg-white border-t border-stone-100">
        <div className="relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask anything about pests, planting, or harvests..."
            className="w-full bg-stone-100 border-none rounded-2xl py-4 pl-6 pr-14 focus:ring-2 focus:ring-emerald-500 outline-none"
          />
          <button 
            type="submit"
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-emerald-600 text-white p-2.5 rounded-xl hover:bg-emerald-700 transition-colors"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChatBot;
