
import React from 'react';
import { Mic, MicOff, Loader2, Volume2, MessageSquare, AlertCircle, Sunrise, ChevronLeft } from 'lucide-react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';

const decode = (base64: string) => {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
  return bytes;
};

const encode = (bytes: Uint8Array) => {
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
};

async function decodeAudioData(data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
  }
  return buffer;
}

interface VoiceAssistantProps {
  language: string;
}

const VoiceAssistant: React.FC<VoiceAssistantProps> = ({ language }) => {
  const [isActive, setIsActive] = React.useState(false);
  const [transcription, setTranscription] = React.useState('');
  const [aiTranscription, setAiTranscription] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);

  const audioRefs = React.useRef({
    inputCtx: null as AudioContext | null,
    outputCtx: null as AudioContext | null,
    nextStartTime: 0,
    sources: new Set<AudioBufferSourceNode>(),
    stream: null as MediaStream | null,
    session: null as any
  });

  const stopSession = () => {
    if (audioRefs.current.session) {
      audioRefs.current.session.close();
      audioRefs.current.session = null;
    }
    if (audioRefs.current.stream) {
      audioRefs.current.stream.getTracks().forEach(t => t.stop());
      audioRefs.current.stream = null;
    }
    audioRefs.current.sources.forEach(s => s.stop());
    audioRefs.current.sources.clear();
    setIsActive(false);
  };

  const startSession = async () => {
    try {
      setError(null);
      const tokenRes = await fetch('/api/gemini/token');
      if (!tokenRes.ok) throw new Error("Failed to initialize AI connection");
      const { token } = await tokenRes.json();
      const ai = new GoogleGenAI({ apiKey: token });
      const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      const outputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioRefs.current.inputCtx = inputCtx;
      audioRefs.current.outputCtx = outputCtx;
      audioRefs.current.stream = stream;

      const sessionPromise = ai.live.connect({
        model: 'gemini-3.1-flash-live-preview',
        callbacks: {
          onopen: () => {
            setIsActive(true);
            const source = inputCtx.createMediaStreamSource(stream);
            const processor = inputCtx.createScriptProcessor(4096, 1, 1);
            processor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const int16 = new Int16Array(inputData.length);
              for (let i = 0; i < inputData.length; i++) int16[i] = inputData[i] * 32768;
              sessionPromise.then(s => s.sendRealtimeInput({
                media: { data: encode(new Uint8Array(int16.buffer)), mimeType: 'audio/pcm;rate=16000' }
              }));
            };
            source.connect(processor);
            processor.connect(inputCtx.destination);
          },
          onmessage: async (msg: LiveServerMessage) => {
            if (msg.serverContent?.inputTranscription?.text) setTranscription(msg.serverContent.inputTranscription.text);
            if (msg.serverContent?.outputTranscription?.text) setAiTranscription(msg.serverContent.outputTranscription.text);
            if (msg.serverContent?.turnComplete) { 
              setTranscription(''); 
              setAiTranscription(''); 
            }
            const audioData = msg.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (audioData) {
              const buf = await decodeAudioData(decode(audioData), outputCtx, 24000, 1);
              const source = outputCtx.createBufferSource();
              source.buffer = buf;
              source.connect(outputCtx.destination);
              audioRefs.current.nextStartTime = Math.max(audioRefs.current.nextStartTime, outputCtx.currentTime);
              source.start(audioRefs.current.nextStartTime);
              audioRefs.current.nextStartTime += buf.duration;
              audioRefs.current.sources.add(source);
            }
          },
          onerror: (e) => { setError("Connection Error"); stopSession(); },
          onclose: () => setIsActive(false)
        },
        config: {
          responseModalities: [Modality.AUDIO],
          inputAudioTranscription: {},
          outputAudioTranscription: {},
          systemInstruction: `You are AgriVoice, a helpful hands-free assistant for farmers. CRITICAL: Always respond and converse in ${language}. Be brief and practical.`
        }
      });
      audioRefs.current.session = await sessionPromise;
    } catch (err) { setError("Microphone denied."); }
  };

  return (
    <div className="flex flex-col h-full items-center justify-center gap-12 py-10 animate-in fade-in zoom-in-95 text-white">
      <div className="text-center space-y-4">
        <h2 className="text-2xl font-black text-white uppercase tracking-tight font-display">AgriVoice Live ({language})</h2>
        <p className="text-xs text-stone-400 font-bold uppercase tracking-wider px-8 leading-relaxed">
            {isActive ? 'Speak naturally about your farm concerns' : 'Hands-free voice assistance for field operations'}
        </p>
      </div>

      <div className="relative">
        {isActive && (
          <div className="absolute inset-0 rounded-full bg-amber-500/30 animate-ping"></div>
        )}
        <button
          onClick={isActive ? stopSession : startSession}
          className={`
            relative z-10 w-44 h-44 rounded-full flex items-center justify-center transition-all duration-500 shadow-2xl
            ${isActive 
              ? 'bg-amber-500 text-black rotate-180 scale-110 shadow-amber-500/50' 
              : 'bg-stone-900 border-8 border-amber-500/20 hover:scale-105 text-amber-500'}
          `}
        >
          {isActive ? (
            <div className="flex items-center gap-1">
                {[1,2,3,4].map(i => <div key={i} className={`w-1.5 bg-black rounded-full animate-[bounce_1s_infinite]`} style={{animationDelay: `${i*0.1}s`, height: `${12+i*6}px`}}></div>)}
            </div>
          ) : <Mic className="w-16 h-16 text-amber-500" />}
        </button>
      </div>

      <div className="w-full max-w-sm px-4 space-y-4">
        {isActive && (
          <div className="bg-stone-900 p-6 rounded-[2rem] border border-amber-500/20 min-h-[120px] flex flex-col justify-center animate-in slide-in-from-bottom-4 shadow-xl">
             <p className="text-amber-400 text-sm font-bold text-center italic leading-relaxed">
                {aiTranscription || transcription || "Listening for your query..."}
             </p>
          </div>
        )}

        {!isActive && (
          <div className="grid grid-cols-2 gap-3">
             {["Blight advice", "Market prices", "Irrigation stats"].map((q, i) => (
               <button key={i} onClick={startSession} className="bg-stone-900 p-3.5 rounded-2xl border border-stone-800 text-[11px] font-bold text-stone-300 shadow-sm flex items-center gap-2 hover:bg-stone-800 active:scale-95 transition-all">
                 <Sunrise className="w-3.5 h-3.5 text-amber-500" /> {q}
               </button>
             ))}
          </div>
        )}
        
        {error && <p className="text-rose-400 text-[10px] font-bold text-center bg-rose-950/60 border border-rose-500/30 py-2 rounded-full">{error}</p>}
      </div>
    </div>
  );
};

export default VoiceAssistant;
