import { AlertTriangle } from 'lucide-react';
import { AppDialog } from './AppDialog';

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
  return (
    <AppDialog open={open} titleId="confirm-title" title={title} description={description} role="alertdialog" onClose={() => { if (!loading) onClose(); }}>
      <div className="p-4 sm:p-5">
        <div className="flex items-start gap-3"><div className={`rounded-xl p-2.5 ${destructive ? 'bg-rose-50 text-rose-700' : 'bg-indigo-50 text-indigo-700'}`}><AlertTriangle size={20} /></div><p className="min-w-0 flex-1 text-sm leading-6 text-slate-700">{description}</p></div>
        <div className="mt-5 flex gap-2">
          <button type="button" onClick={onClose} disabled={loading} className="min-h-12 flex-1 rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50">ยกเลิก</button>
          <button type="button" onClick={() => void onConfirm()} disabled={loading} className={`min-h-12 flex-1 rounded-xl px-4 text-sm font-semibold text-white disabled:opacity-50 ${destructive ? 'bg-rose-700 hover:bg-rose-800' : 'bg-indigo-700 hover:bg-indigo-800'}`}>
            {loading ? 'กำลังดำเนินการ…' : confirmLabel}
          </button>
        </div>
      </div>
    </AppDialog>
  );
}
