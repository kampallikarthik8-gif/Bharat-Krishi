import React from 'react';
import { motion } from 'motion/react';

const SplashScreen: React.FC = () => {
  return (
    <div className="fixed inset-0 z-[100] bg-[var(--m3-background)] flex flex-col items-center justify-center p-6">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.8, ease: [0.2, 0, 0, 1] }}
        className="flex flex-col items-center"
      >
        <div className="w-24 h-24 bg-[var(--m3-primary-container)] rounded-[2rem] flex items-center justify-center mb-8 shadow-lg overflow-hidden">
          <img 
            src="https://image2url.com/r2/default/images/1773645978799-968d61a0-3ceb-48da-814f-71deb5b97303.png" 
            alt="Bharat Kisan Logo" 
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        </div>
        
        <motion.h1 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="text-3xl font-bold text-[var(--m3-on-surface)] mb-2"
        >
          Bharat Kisan
        </motion.h1>
        
        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="text-[var(--m3-on-surface-variant)] text-center max-w-[240px]"
        >
          Your AI-Powered Farming Companion
        </motion.p>
      </motion.div>
      
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2, duration: 0.8 }}
        className="absolute bottom-12 flex flex-col items-center gap-4"
      >
        <div className="flex gap-1">
          <div className="w-2 h-2 rounded-full bg-[var(--m3-primary)] animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="w-2 h-2 rounded-full bg-[var(--m3-primary)] animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="w-2 h-2 rounded-full bg-[var(--m3-primary)] animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
        <span className="text-[10px] font-bold text-[var(--m3-on-surface-variant)] uppercase tracking-[0.2em] opacity-40">
          Empowering Indian Farmers
        </span>
      </motion.div>
    </div>
  );
};

export default SplashScreen;
