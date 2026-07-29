import React, { createContext, useContext, useState, ReactNode } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertCircle, Trash2, Info } from 'lucide-react';

interface ConfirmDialogOptions {
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel?: () => void;
  type?: 'danger' | 'info';
}

interface AlertDialogOptions {
  title: string;
  message: string;
  onClose?: () => void;
}

interface PromptDialogOptions {
  title: string;
  message: string;
  placeholder?: string;
  defaultValue?: string;
  onConfirm: (value: string) => void;
  onCancel?: () => void;
}

interface DialogContextType {
  confirm: (options: ConfirmDialogOptions) => void;
  alert: (options: AlertDialogOptions) => void;
  prompt: (options: PromptDialogOptions) => void;
}

const DialogContext = createContext<DialogContextType | undefined>(undefined);

export const DialogProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogOptions | null>(null);
  const [alertDialog, setAlertDialog] = useState<AlertDialogOptions | null>(null);
  const [promptDialog, setPromptDialog] = useState<PromptDialogOptions | null>(null);
  const [promptValue, setPromptValue] = useState('');

  const confirm = (options: ConfirmDialogOptions) => {
    setConfirmDialog(options);
  };

  const alert = (options: AlertDialogOptions) => {
    setAlertDialog(options);
  };

  const prompt = (options: PromptDialogOptions) => {
    setPromptValue(options.defaultValue || '');
    setPromptDialog(options);
  };

  const closeConfirm = () => {
    confirmDialog?.onCancel?.();
    setConfirmDialog(null);
  };

  const handleConfirm = () => {
    confirmDialog?.onConfirm();
    setConfirmDialog(null);
  };

  const closeAlert = () => {
    alertDialog?.onClose?.();
    setAlertDialog(null);
  };

  const closePrompt = () => {
    promptDialog?.onCancel?.();
    setPromptDialog(null);
  };

  const handlePromptConfirm = () => {
    promptDialog?.onConfirm(promptValue);
    setPromptDialog(null);
  };

  return (
    <DialogContext.Provider value={{ confirm, alert, prompt }}>
      {children}
      
      {/* Global Confirmation Dialog */}
      <AnimatePresence>
        {confirmDialog && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white rounded-[2.5rem] p-8 max-w-sm w-full shadow-2xl border border-stone-200"
            >
              <div className="text-center">
                <div className={`w-16 h-16 ${confirmDialog.type === 'danger' ? 'bg-rose-500/10 text-rose-500' : 'bg-amber-500/10 text-amber-500'} rounded-2xl flex items-center justify-center mb-6 mx-auto`}>
                  {confirmDialog.type === 'danger' ? <Trash2 className="w-8 h-8" /> : <Info className="w-8 h-8" />}
                </div>
                <h3 className="text-xl font-black text-stone-900 uppercase tracking-tighter mb-2">{confirmDialog.title}</h3>
                <p className="text-sm font-medium text-stone-500 leading-relaxed mb-8">{confirmDialog.message}</p>
                <div className="flex gap-3">
                  <button 
                    onClick={closeConfirm}
                    className="flex-1 py-4 bg-stone-100 text-stone-500 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-stone-200 transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleConfirm}
                    className={`flex-1 py-4 ${confirmDialog.type === 'danger' ? 'bg-rose-500' : 'bg-stone-900'} text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg hover:opacity-90 transition-all`}
                  >
                    Confirm
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Global Alert Dialog */}
      <AnimatePresence>
        {alertDialog && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white rounded-[2.5rem] p-8 max-w-sm w-full shadow-2xl border border-stone-200"
            >
              <div className="text-center">
                <div className="w-16 h-16 bg-amber-500/10 text-amber-500 rounded-2xl flex items-center justify-center mb-6 mx-auto">
                  <AlertCircle className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-black text-stone-900 uppercase tracking-tighter mb-2">{alertDialog.title}</h3>
                <p className="text-sm font-medium text-stone-500 leading-relaxed mb-8">{alertDialog.message}</p>
                <button 
                  onClick={closeAlert}
                  className="w-full py-4 bg-stone-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg hover:opacity-90 transition-all"
                >
                  Understood
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Global Prompt Dialog */}
      <AnimatePresence>
        {promptDialog && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white rounded-[2.5rem] p-8 max-w-sm w-full shadow-2xl border border-stone-200"
            >
              <div className="text-center">
                <div className="w-16 h-16 bg-emerald-500/10 text-emerald-500 rounded-2xl flex items-center justify-center mb-6 mx-auto">
                  <Info className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-black text-stone-900 uppercase tracking-tighter mb-2">{promptDialog.title}</h3>
                <p className="text-sm font-medium text-stone-500 leading-relaxed mb-4">{promptDialog.message}</p>
                
                <input 
                  autoFocus
                  type="text"
                  value={promptValue}
                  onChange={(e) => setPromptValue(e.target.value)}
                  placeholder={promptDialog.placeholder}
                  className="w-full bg-stone-100 border border-stone-200 p-4 rounded-2xl outline-none font-medium text-stone-900 mb-6 focus:border-stone-400 transition-all"
                  onKeyPress={(e) => e.key === 'Enter' && handlePromptConfirm()}
                />

                <div className="flex gap-3">
                  <button 
                    onClick={closePrompt}
                    className="flex-1 py-4 bg-stone-100 text-stone-500 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-stone-200 transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handlePromptConfirm}
                    className="flex-1 py-4 bg-stone-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg hover:opacity-90 transition-all"
                  >
                    Submit
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </DialogContext.Provider>
  );
};

export const useDialogs = () => {
  const context = useContext(DialogContext);
  if (context === undefined) {
    throw new Error('useDialogs must be used within a DialogProvider');
  }
  return context;
};
