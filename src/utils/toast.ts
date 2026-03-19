import { Toast } from '@capacitor/toast';
import { Capacitor } from '@capacitor/core';

export const showToast = async (text: string, duration: 'short' | 'long' = 'short') => {
  if (Capacitor.isNativePlatform()) {
    await Toast.show({
      text,
      duration,
      position: 'bottom'
    });
  } else {
    // Fallback for web
    console.log(`[Toast] ${text}`);
    // You could implement a simple web toast here if needed
  }
};
