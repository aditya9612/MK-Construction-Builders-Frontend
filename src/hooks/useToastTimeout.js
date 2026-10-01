import { useEffect } from 'react';
import { useUiStore } from '../store/uiStore';

export function useToastTimeout() {
  const toasts = useUiStore((s) => s.toasts);
  const removeToast = useUiStore((s) => s.removeToast);

  useEffect(() => {
    const timers = toasts.map((toast) => setTimeout(() => removeToast(toast.id), toast.duration || 3200));
    return () => timers.forEach(clearTimeout);
  }, [toasts, removeToast]);
}

export function useMediaQuery(query) {
  const get = () => (typeof window !== 'undefined' ? window.matchMedia(query).matches : false);
  const { useState } = require('react');
  const [matches, setMatches] = useState(get);
  useEffect(() => {
    const media = window.matchMedia(query);
    const onChange = () => setMatches(media.matches);
    onChange();
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, [query]);
  return matches;
}
