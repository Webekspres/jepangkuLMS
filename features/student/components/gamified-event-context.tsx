'use client';

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import type { GamifiedEvent } from '../types/gamified-event';

interface GamifiedEventContextType {
  toasts: GamifiedEvent[];
  triggerGamifiedEvent: (eventData: Omit<GamifiedEvent, 'id' | 'timestamp'>) => void;
  dismissGamifiedEvent: (id: string) => void;
}

const GamifiedEventContext = createContext<GamifiedEventContextType | undefined>(undefined);

export function GamifiedEventProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<GamifiedEvent[]>([]);

  const triggerGamifiedEvent = useCallback((eventData: Omit<GamifiedEvent, 'id' | 'timestamp'>) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast: GamifiedEvent = {
      id,
      timestamp: Date.now(),
      ...eventData,
    };
    setToasts((prev) => [...prev, newToast]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  }, []);

  const dismissGamifiedEvent = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleEvent = (e: Event) => {
      const customEvent = e as CustomEvent<Omit<GamifiedEvent, 'id' | 'timestamp'>>;
      if (customEvent.detail?.type) {
        triggerGamifiedEvent(customEvent.detail);
      }
    };

    window.addEventListener('gamified-event', handleEvent as EventListener);
    return () => {
      window.removeEventListener('gamified-event', handleEvent as EventListener);
    };
  }, [triggerGamifiedEvent]);

  return (
    <GamifiedEventContext.Provider value={{ toasts, triggerGamifiedEvent, dismissGamifiedEvent }}>
      {children}
    </GamifiedEventContext.Provider>
  );
}

export function useGamifiedEvent() {
  const context = useContext(GamifiedEventContext);
  if (!context) {
    throw new Error('useGamifiedEvent must be used within a GamifiedEventProvider');
  }
  return context;
}
