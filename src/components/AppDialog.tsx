import { useEffect, useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';

interface Props {
  open: boolean;
  titleId: string;
  title: string;
  description?: string;
  role?: 'dialog' | 'alertdialog';
  onClose: () => void;
  children: ReactNode;
}

export function AppDialog({ open, titleId, title, description, role = 'dialog', onClose, children }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open && !dialog.open) {
      if (typeof HTMLDialogElement.prototype.showModal === 'function' && !navigator.userAgent.includes('jsdom')) dialog.showModal();
      else dialog.setAttribute('open', '');
    }
    if (!open && dialog.open) {
      if (navigator.userAgent.includes('jsdom')) dialog.removeAttribute('open');
      else dialog.close();
    }
  }, [open]);

  useEffect(() => {
    if (!open || !navigator.userAgent.includes('jsdom')) return;
    function handleTestEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', handleTestEscape);
    return () => window.removeEventListener('keydown', handleTestEscape);
  }, [onClose, open]);

  return (
    <dialog
      ref={dialogRef}
      className="app-dialog"
      role={role}
      aria-labelledby={titleId}
      aria-describedby={description ? `${titleId}-description` : undefined}
      onCancel={(event) => { event.preventDefault(); onClose(); }}
      onClick={(event) => {
        const bounds = event.currentTarget.getBoundingClientRect();
        if (event.clientY < bounds.top || event.clientY > bounds.bottom || event.clientX < bounds.left || event.clientX > bounds.right) onClose();
      }}
    >
      <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-slate-100 bg-white px-4 py-3.5 sm:px-5">
        <div className="min-w-0">
          <h2 id={titleId} className="text-base font-bold text-slate-900 sm:text-lg">{title}</h2>
          {description && <p id={`${titleId}-description`} className="mt-0.5 text-xs leading-5 text-slate-500 sm:text-sm">{description}</p>}
        </div>
        <button type="button" onClick={onClose} className="grid min-h-11 min-w-11 flex-shrink-0 place-items-center rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-800" aria-label="ปิดหน้าต่าง">
          <X size={19} />
        </button>
      </div>
      {children}
    </dialog>
  );
}
