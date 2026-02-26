
import React from 'react';
import { getAIClient } from '../services/geminiService';
import { Mic, MicOff, Loader2, Volume2, MessageSquare, AlertCircle, Sunrise, ChevronLeft } from 'lucide-react';
import { LiveServerMessage, Modality } from '@google/genai';

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
      const ai = getAIClient();
      const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      const outputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioRefs.current.inputCtx = inputCtx;
      audioRefs.current.outputCtx = outputCtx;
      audioRefs.current.stream = stream;

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
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
    <div className="flex flex-col h-full items-center justify-center gap-12 py-10 animate-in fade-in zoom-in-95">
      <div className="text-center space-y-4">
        <h2 className="text-2xl font-bold text-stone-900">AgriVoice Live ({language})</h2>
        <p className="text-sm text-stone-500 font-medium px-8 leading-relaxed">
            {isActive ? 'Speak naturally about your farm concerns' : 'Hands-free assistance for field work'}
        </p>
      </div>

      <div className="relative">
        {isActive && (
          <div className="absolute inset-0 rounded-full bg-orange-400/30 animate-ping"></div>
        )}
        <button
          onClick={isActive ? stopSession : startSession}
          className={`
            relative z-10 w-44 h-44 rounded-full flex items-center justify-center transition-all duration-500 shadow-2xl
            ${isActive 
              ? 'bg-[#825500] rotate-180 scale-110' 
              : 'bg-white border-8 border-orange-100 hover:scale-105'}
          `}
        >
          {isActive ? (
            <div className="flex items-center gap-1">
                {[1,2,3,4].map(i => <div key={i} className={`w-1 bg-white rounded-full animate-[bounce_1s_infinite]`} style={{animationDelay: `${i*0.1}s`, height: `${10+i*5}px`}}></div>)}
            </div>
          ) : <Mic className="w-16 h-16 text-[#825500]" />}
        </button>
      </div>

      <div className="w-full max-w-sm px-4 space-y-4">
        {isActive && (
          <div className="bg-[#ffddb3]/40 p-6 rounded-[2rem] border border-[#ffddb3] min-h-[120px] flex flex-col justify-center animate-in slide-in-from-bottom-4">
             <p className="text-[#825500] text-sm font-bold text-center italic leading-relaxed">
                {aiTranscription || transcription || "Listening for your query..."}
             </p>
          </div>
        )}

        {!isActive && (
          <div className="grid grid-cols-2 gap-3">
             {["Blight advice", "Market prices", "Irrigation stats"].map((q, i) => (
               <button key={i} onClick={startSession} className="bg-white p-3 rounded-2xl border border-stone-100 text-[11px] font-bold text-stone-500 shadow-sm flex items-center gap-2">
                 <Sunrise className="w-3 h-3 text-orange-400" /> {q}
               </button>
             ))}
          </div>
        )}
        
        {error && <p className="text-rose-600 text-[10px] font-bold text-center bg-rose-50 py-2 rounded-full">{error}</p>}
      </div>
    </div>
  );
};

export default VoiceAssistant;
