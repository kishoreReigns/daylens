// ─────────────────────────────────────────────
//  ToastContext · Global toast notification state
//  Usage: const { showToast } = useToast();
//         showToast({ message: '...', variant: 'success' });
// ─────────────────────────────────────────────
import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
} from 'react';
import type { ToastConfig } from '../components/Toast';
import Toast from '../components/Toast';

interface ToastContextValue {
  showToast: (config: ToastConfig) => void;
}

const ToastContext = createContext<ToastContextValue>({
  showToast: () => {},
});

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [current, setCurrent] = useState<ToastConfig | null>(null);
  const queueRef = useRef<ToastConfig[]>([]);

  const showNext = useCallback(() => {
    const next = queueRef.current.shift();
    setCurrent(next ?? null);
  }, []);

  const showToast = useCallback((config: ToastConfig) => {
    if (current) {
      // Queue it — show after current one hides
      queueRef.current.push(config);
    } else {
      setCurrent(config);
    }
  }, [current]);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {current && (
        <Toast
          {...current}
          onHide={() => {
            setCurrent(null);
            // Small gap between toasts
            if (queueRef.current.length > 0) {
              setTimeout(showNext, 200);
            }
          }}
        />
      )}
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  return useContext(ToastContext);
}
