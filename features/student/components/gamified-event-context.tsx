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

    // Auto dismiss after 5 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  }, []);

  const dismissGamifiedEvent = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Listen to custom window events
    const handleEvent = (e: Event) => {
      const customEvent = e as CustomEvent<Omit<GamifiedEvent, 'id' | 'timestamp'>>;
      if (customEvent.detail && customEvent.detail.type) {
        triggerGamifiedEvent(customEvent.detail);
      }
    };

    window.addEventListener('gamified-event', handleEvent as EventListener);

    // Global fetch interceptor for graceful degradation
    let lastAlertTime = 0;
    const alertCooldownMs = 10000; // 10 seconds cooldown between stability alerts

    const triggerStabilityAlert = () => {
      const now = Date.now();
      if (now - lastAlertTime < alertCooldownMs) return;
      lastAlertTime = now;

      triggerGamifiedEvent({
        type: 'SYSTEM_ALERT',
        payload: {
          title: 'Koneksi Tidak Stabil ⚠️',
          message:
            'Gagal terhubung ke server pusat JepangKu. Beberapa progres belajar Anda mungkin tidak tersimpan untuk sementara waktu.',
        },
      });
    };

    const originalFetch = window.fetch;
    (window as any).fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      try {
        const response = await originalFetch(input, init);
        if (response.status === 503 || response.status === 504) {
          triggerStabilityAlert();
        }
        return response;
      } catch (error) {
        if (
          error instanceof Error &&
          (error.name === 'TimeoutError' ||
            error.message.includes('timeout') ||
            error.message.includes('Failed to fetch') ||
            error.message.includes('NetworkError') ||
            error.message.includes('network'))
        ) {
          triggerStabilityAlert();
        }
        throw error;
      }
    };

    return () => {
      window.removeEventListener('gamified-event', handleEvent as EventListener);
      (window as any).fetch = originalFetch;
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
