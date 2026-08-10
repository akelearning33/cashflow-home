import { useCallback, useMemo, useRef, useState, type ReactNode } from 'react';
import { CheckCircle2, CircleAlert, Info, X } from 'lucide-react';
import { ToastContext, type ToastOptions } from '../hooks/useToast';

type ToastTone = 'success' | 'error' | 'info';

interface ToastState extends ToastOptions {
  id: number;
  message: string;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastState | null>(null);
  const timerRef = useRef<number | null>(null);

  const dismiss = useCallback(() => {
    if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    timerRef.current = null;
    setToast(null);
  }, []);

  const showToast = useCallback((message: string, options: ToastOptions = {}) => {
    if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    const next = { id: Date.now(), message, tone: 'success' as ToastTone, duration: 5500, ...options };
    setToast(next);
    timerRef.current = window.setTimeout(() => setToast(null), next.duration);
  }, []);

  const value = useMemo(() => ({ showToast }), [showToast]);
  const Icon = toast?.tone === 'error' ? CircleAlert : toast?.tone === 'info' ? Info : CheckCircle2;

  return (
    <ToastContext.Provider value={value}>
      {children}
      {toast && (
        <div
          className="fixed inset-x-4 bottom-24 z-[70] mx-auto flex max-w-md items-center gap-3 rounded-2xl border border-slate-200 bg-slate-900 px-4 py-3 text-white shadow-2xl sm:bottom-6"
          role={toast.tone === 'error' ? 'alert' : 'status'}
          aria-live="polite"
        >
          <Icon size={19} className={toast.tone === 'error' ? 'text-rose-300' : 'text-emerald-300'} />
          <span className="min-w-0 flex-1 text-sm font-medium">{toast.message}</span>
          {toast.actionLabel && toast.onAction && (
            <button
              type="button"
              className="min-h-11 rounded-lg px-2 text-sm font-bold text-indigo-300 hover:text-white"
              onClick={async () => {
                const action = toast.onAction;
                dismiss();
                try {
                  await action?.();
                } catch {
                  showToast('ดำเนินการไม่สำเร็จ กรุณาลองอีกครั้ง', { tone: 'error' });
                }
              }}
            >
              {toast.actionLabel}
            </button>
          )}
          <button type="button" onClick={dismiss} className="grid min-h-11 min-w-11 place-items-center rounded-lg text-slate-400 hover:text-white" aria-label="ปิดข้อความ">
            <X size={18} />
          </button>
        </div>
      )}
    </ToastContext.Provider>
  );
}
