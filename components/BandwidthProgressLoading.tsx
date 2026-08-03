import React from 'react';
import { Loader2, WifiOff, RefreshCw, Signal } from 'lucide-react';

interface BandwidthProgressLoadingProps {
  label?: string;
  onRetry?: () => void;
  inline?: boolean;
}

export const BandwidthProgressLoading: React.FC<BandwidthProgressLoadingProps> = ({
  label = 'Processing request...',
  onRetry,
  inline = false
}) => {
  const [elapsedSeconds, setElapsedSeconds] = React.useState(0);

  React.useEffect(() => {
    const timer = setInterval(() => {
      setElapsedSeconds(prev => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const getStatusText = () => {
    if (elapsedSeconds < 4) return 'Connecting to server...';
    if (elapsedSeconds < 8) return 'Analyzing data (2G/3G signal)...';
    if (elapsedSeconds < 15) return 'Poor signal detected. Still processing, please stay on screen...';
    return 'Slow network connection. Retrying data pipeline...';
  };

  const getProgressPercentage = () => {
    // Smooth progress representation that asymptotic towards 95%
    return Math.min(95, Math.round((1 - Math.exp(-elapsedSeconds / 6)) * 100));
  };

  if (inline) {
    return (
      <div className="flex flex-col gap-2 p-4 bg-stone-900/90 border border-amber-500/20 rounded-2xl">
        <div className="flex items-center justify-between text-xs font-black uppercase tracking-wider text-amber-500">
          <span className="flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
            {label}
          </span>
          <span className="font-mono text-stone-400">{elapsedSeconds}s</span>
        </div>
        <div className="w-full bg-stone-800 h-2 rounded-full overflow-hidden">
          <div 
            className="bg-amber-500 h-full transition-all duration-500 ease-out" 
            style={{ width: `${getProgressPercentage()}%` }}
          />
        </div>
        <div className="flex items-center justify-between text-[11px] font-medium text-stone-400">
          <span className="flex items-center gap-1">
            <Signal className="w-3 h-3 text-amber-500/80" />
            {getStatusText()}
          </span>
          {elapsedSeconds > 12 && onRetry && (
            <button
              onClick={onRetry}
              className="text-amber-400 hover:text-amber-300 font-bold underline flex items-center gap-1 min-h-[44px] px-2"
            >
              <RefreshCw className="w-3 h-3" /> Retry
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center p-8 bg-black/95 border border-amber-500/20 rounded-3xl text-center space-y-4 max-w-sm mx-auto my-6 shadow-2xl">
      <div className="relative">
        <div className="w-16 h-16 rounded-full border-2 border-amber-500/20 flex items-center justify-center bg-stone-950">
          <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
        </div>
        {elapsedSeconds > 10 && (
          <div className="absolute -bottom-1 -right-1 bg-rose-500 text-black p-1 rounded-full">
            <WifiOff className="w-3.5 h-3.5" />
          </div>
        )}
      </div>

      <div className="space-y-1">
        <h4 className="text-base font-black text-white uppercase tracking-wider">{label}</h4>
        <p className="text-xs font-mono text-amber-500/80 font-bold">{getStatusText()}</p>
      </div>

      <div className="w-full bg-stone-900 h-2.5 rounded-full overflow-hidden border border-stone-800">
        <div 
          className="bg-gradient-to-r from-amber-600 via-amber-500 to-amber-400 h-full transition-all duration-300 ease-out" 
          style={{ width: `${getProgressPercentage()}%` }}
        />
      </div>

      <div className="flex items-center justify-between w-full text-xs text-stone-500 font-mono pt-1">
        <span>Elapsed: {elapsedSeconds}s</span>
        <span>{getProgressPercentage()}%</span>
      </div>

      {elapsedSeconds >= 12 && onRetry && (
        <button
          onClick={onRetry}
          className="mt-2 w-full min-h-[48px] px-4 py-2.5 bg-amber-500 text-stone-950 font-black text-xs uppercase tracking-widest rounded-full hover:bg-amber-400 transition-colors flex items-center justify-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Retry Request
        </button>
      )}
    </div>
  );
};

export default BandwidthProgressLoading;
