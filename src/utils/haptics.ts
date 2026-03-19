import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { Capacitor } from '@capacitor/core';

export const triggerHaptic = async (style: ImpactStyle = ImpactStyle.Light) => {
  if (Capacitor.isNativePlatform()) {
    try {
      await Haptics.impact({ style });
    } catch (e) {
      console.warn('Haptics not available', e);
    }
  } else if ('vibrate' in navigator) {
    // Fallback for web
    navigator.vibrate(10);
  }
};

export const triggerSelectionHaptic = async () => {
  if (Capacitor.isNativePlatform()) {
    try {
      await Haptics.selectionStart();
      await Haptics.selectionChanged();
      await Haptics.selectionEnd();
    } catch (e) {
      console.warn('Selection haptics not available', e);
    }
  } else if ('vibrate' in navigator) {
    navigator.vibrate(5);
  }
};

export const triggerSuccessHaptic = async () => {
  if (Capacitor.isNativePlatform()) {
    try {
      await Haptics.notification({ type: 'SUCCESS' as any });
    } catch (e) {
      console.warn('Success haptics not available', e);
    }
  } else if ('vibrate' in navigator) {
    navigator.vibrate([10, 30, 10]);
  }
};
