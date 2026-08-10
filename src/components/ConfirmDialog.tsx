import { useEffect } from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface Props {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  loading?: boolean;
  destructive?: boolean;
  onConfirm: () => void | Promise<void>;
  onClose: () => void;
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'ยืนยัน',
  loading = false,
  destructive = true,
  onConfirm,
  onClose,
}: Props) {
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !loading) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [loading, onClose, open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-slate-950/45 p-0 backdrop-blur-sm sm:items-center sm:p-4" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && !loading && onClose()}>
      <div className="w-full rounded-t-3xl bg-white p-5 shadow-2xl sm:max-w-md sm:rounded-2xl" role="alertdialog" aria-modal="true" aria-labelledby="confirm-title" aria-describedby="confirm-description">
        <div className="flex items-start gap-3">
          <div className={`rounded-xl p-2.5 ${destructive ? 'bg-rose-50 text-rose-600' : 'bg-indigo-50 text-indigo-600'}`}>
            <AlertTriangle size={20} />
          </div>
          <div className="min-w-0 flex-1">
            <h2 id="confirm-title" className="font-bold text-slate-900">{title}</h2>
            <p id="confirm-description" className="mt-1 text-sm leading-6 text-slate-600">{description}</p>
          </div>
          <button type="button" onClick={onClose} disabled={loading} className="grid min-h-11 min-w-11 place-items-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700" aria-label="ปิด">
            <X size={19} />
          </button>
        </div>
        <div className="mt-5 flex gap-3">
          <button type="button" onClick={onClose} disabled={loading} className="min-h-11 flex-1 rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50">ยกเลิก</button>
          <button type="button" onClick={() => void onConfirm()} disabled={loading} className={`min-h-11 flex-1 rounded-xl px-4 text-sm font-semibold text-white disabled:opacity-50 ${destructive ? 'bg-rose-600 hover:bg-rose-700' : 'bg-indigo-600 hover:bg-indigo-700'}`}>
            {loading ? 'กำลังดำเนินการ…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
