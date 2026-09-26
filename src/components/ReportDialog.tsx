import { useEffect, useMemo, useRef, useState } from 'react';
import { Printer, X } from 'lucide-react';
import type { Transaction } from '../types';
import { formatCurrency } from '../utils/formatCurrency';
import { formatDate, formatMonth, formatMonthYear } from '../utils/formatDate';
import { summarizeByCategory, summarizeByMonth, summarizeTransactions, sortTransactionsForReport } from '../utils/report';

export type ReportPeriod = 'month' | 'year';

interface Props {
  open: boolean;
  year: number;
  month: number;
  transactions: Transaction[];
  onClose: () => void;
  allowYear?: boolean;
  initialPeriod?: ReportPeriod;
  filters?: string[];
}

const MONTH_LABELS = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];

function typeLabel(type: 'income' | 'expense') {
  return type === 'income' ? 'รายรับ' : 'รายจ่าย';
}

function preparedAtLabel() {
  return new Intl.DateTimeFormat('th-TH-u-ca-gregory', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date());
}

export function ReportDialog({
  open,
  year,
  month,
  transactions,
  onClose,
  allowYear = false,
  initialPeriod = 'month',
  filters = [],
}: Props) {
  const [period, setPeriod] = useState<ReportPeriod>(initialPeriod);
  const originalTitleRef = useRef<string | null>(null);
  const createdLabel = preparedAtLabel();

  useEffect(() => {
    if (!open) {
      if (originalTitleRef.current !== null) {
        document.title = originalTitleRef.current;
        originalTitleRef.current = null;
      }
      return;
    }
    const handleKeyDown = (event: KeyboardEvent) => event.key === 'Escape' && onClose();
    window.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
      if (originalTitleRef.current !== null) {
        document.title = originalTitleRef.current;
        originalTitleRef.current = null;
      }
    };
  }, [onClose, open]);

  const reportTransactions = useMemo(() => {
    const scoped = period === 'month'
      ? transactions.filter((transaction) => Number(transaction.date.slice(5, 7)) === month)
      : transactions.filter((transaction) => Number(transaction.date.slice(0, 4)) === year);
    return sortTransactionsForReport(scoped);
  }, [month, period, transactions, year]);
  const summary = useMemo(() => summarizeTransactions(reportTransactions), [reportTransactions]);
  const categorySummary = useMemo(() => summarizeByCategory(reportTransactions), [reportTransactions]);
  const monthlySummary = useMemo(() => summarizeByMonth(transactions, year), [transactions, year]);
  const reportRows = useMemo(() => {
    return reportTransactions.reduce<Array<{ transaction: Transaction; index: number; balance: number }>>((rows, transaction, index) => {
      const previousBalance = rows.length > 0 ? rows[rows.length - 1].balance : 0;
      const balance = previousBalance + (transaction.type === 'income' ? Number(transaction.amount) : -Number(transaction.amount));
      return [...rows, { transaction, index: index + 1, balance }];
    }, []);
  }, [reportTransactions]);
  const periodLabel = period === 'month' ? formatMonthYear(year, month) : `ตลอดปี ค.ศ. ${year}`;
  const monthLabel = period === 'month' ? formatMonth(year, month) : 'ตลอดปี';

  function handlePrint() {
    const report = document.getElementById('report-print-area');
    if (!report) {
      window.print();
      return;
    }

    let printWindow: Window | null = null;
    try {
      printWindow = window.open('', '_blank', 'width=1024,height=768');
    } catch {
      printWindow = null;
    }

    if (!printWindow) {
      window.print();
      return;
    }

    if (originalTitleRef.current === null) originalTitleRef.current = document.title;
    const printTitle = `รายงานรายรับและรายจ่าย - ${periodLabel}`;
    const styles = Array.from(document.head.querySelectorAll('style, link[rel="stylesheet"]'))
      .map((style) => style.outerHTML)
      .join('');
    const printStyles = `
      <style>
        html, body { margin: 0; min-width: 0; background: #fff; }
        body { padding: 12mm; box-sizing: border-box; }
        #report-print-area { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        #report-print-area { width: 100% !important; max-width: none !important; padding: 0 !important; margin: 0 !important; box-shadow: none !important; }
        .report-paper { color: #0f172a !important; font-size: 9pt !important; line-height: 1.3 !important; }
        .report-paper .text-2xl { font-size: 16pt !important; }
        .report-paper .text-xl { font-size: 12pt !important; }
        .report-paper .text-sm { font-size: 8.5pt !important; }
        .report-paper .text-xs { font-size: 7.5pt !important; }
        .report-paper .report-table { font-size: 8.5pt !important; }
        .report-paper .report-table th, .report-paper .report-table td { font-size: 8.5pt !important; padding-top: 0.22rem !important; padding-bottom: 0.22rem !important; }
        @page { size: A4 portrait; margin: 12mm; }
        @media print {
          .report-section { break-inside: auto !important; page-break-inside: auto !important; }
          .report-document-header, .report-summary-grid { break-inside: avoid !important; page-break-inside: avoid !important; }
          .report-table thead { display: table-header-group; }
          .report-table tr { break-inside: avoid; }
        }
      </style>
    `;
    let printed = false;
    const restoreTitle = () => {
      if (originalTitleRef.current !== null) {
        document.title = originalTitleRef.current;
        originalTitleRef.current = null;
      }
    };
    const triggerPrint = () => {
      if (printed) return;
      printed = true;
      printWindow?.focus();
      printWindow?.addEventListener('afterprint', () => printWindow?.close(), { once: true });
      printWindow?.print();
      restoreTitle();
    };

    printWindow.document.open();
    printWindow.document.write(`<!doctype html><html lang="th"><head><meta charset="UTF-8"><title>${printTitle}</title>${styles}${printStyles}</head><body>${report.outerHTML}</body></html>`);
    printWindow.document.close();
    printWindow.addEventListener('load', triggerPrint, { once: true });
    window.setTimeout(triggerPrint, 500);
  }

  if (!open) return null;

  return (
    <div
      className="report-modal-overlay fixed inset-0 z-[70] flex items-end justify-center bg-slate-950/45 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
      role="presentation"
    >
      <div className="flex max-h-[96dvh] w-full flex-col overflow-hidden rounded-t-3xl bg-slate-100 shadow-2xl sm:max-w-5xl sm:rounded-2xl" role="dialog" aria-modal="true" aria-labelledby="report-dialog-title">
        <div className="no-print flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-3 sm:px-5">
          <div>
            <h2 id="report-dialog-title" className="text-lg font-extrabold text-slate-900">เตรียมรายงาน</h2>
            <p className="text-xs text-slate-500">ตรวจสอบตัวอย่าง แล้วเลือกพิมพ์และบันทึกเป็น PDF · หากเห็น URL หรือเวลา ให้ปิดหัวกระดาษและท้ายกระดาษในหน้าต่างพิมพ์</p>
          </div>
          <div className="flex items-center gap-2">
            {allowYear && (
              <div className="grid grid-cols-2 rounded-xl bg-slate-200/70 p-1" aria-label="ช่วงเวลารายงาน">
                <button type="button" onClick={() => setPeriod('month')} className={`min-h-10 rounded-lg px-3 text-xs font-bold ${period === 'month' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500'}`} aria-pressed={period === 'month'}>รายเดือน</button>
                <button type="button" onClick={() => setPeriod('year')} className={`min-h-10 rounded-lg px-3 text-xs font-bold ${period === 'year' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500'}`} aria-pressed={period === 'year'}>รายปี</button>
              </div>
            )}
            <button type="button" onClick={handlePrint} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-indigo-600 px-4 text-sm font-bold text-white shadow-lg shadow-indigo-600/15 hover:bg-indigo-700"><Printer size={17} /> พิมพ์ / บันทึก PDF</button>
            <button type="button" onClick={onClose} className="grid min-h-11 min-w-11 place-items-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-800" aria-label="ปิดรายงาน"><X size={20} /></button>
          </div>
        </div>

        <div className="overflow-y-auto p-3 sm:p-6">
          <article id="report-print-area" className="report-paper mx-auto max-w-4xl bg-white p-6 text-slate-900 shadow-sm sm:p-10">
            <header className="report-document-header border-b-2 border-slate-900 pb-5 text-center">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-indigo-700">CashFlow Home</p>
              <h1 className="mt-2 text-2xl font-black tracking-tight">รายงานรายรับและรายจ่าย</h1>
              <div className="mt-4 flex flex-wrap justify-center gap-x-10 gap-y-2 text-sm font-semibold text-slate-700">
                <span>เดือน: <span className="report-underline">{monthLabel}</span></span>
                <span>ปี: <span className="report-underline">{year}</span></span>
              </div>
              <p className="mt-3 text-xs text-slate-500">จัดทำเมื่อ {createdLabel} · รายการที่ถูกลบไม่รวมในรายงาน</p>
            </header>

            {filters.length > 0 && (
              <div className="mt-4 rounded-xl border border-indigo-100 bg-indigo-50 px-4 py-3 text-xs text-indigo-800">
                <span className="font-bold">ตัวกรอง: </span>{filters.join(' · ')}
              </div>
            )}

            <section className="report-section mt-6" aria-labelledby="report-summary-title">
              <h2 id="report-summary-title" className="text-center text-sm font-black uppercase tracking-wider text-slate-600">สรุปการเงิน{period === 'month' ? 'ประจำเดือน' : 'ประจำปี'}</h2>
              <div className="report-summary-grid mt-3 grid gap-3 sm:grid-cols-3">
                <div className="rounded-xl border border-emerald-300 bg-emerald-50 p-4"><p className="text-xs font-bold text-emerald-800">รายรับรวม</p><p className="mt-2 text-xl font-black text-emerald-800">{formatCurrency(summary.income)}</p></div>
                <div className="rounded-xl border border-rose-300 bg-rose-50 p-4"><p className="text-xs font-bold text-rose-800">รายจ่ายรวม</p><p className="mt-2 text-xl font-black text-rose-800">{formatCurrency(summary.expense)}</p></div>
                <div className={`rounded-xl border p-4 ${summary.net >= 0 ? 'border-indigo-300 bg-indigo-50' : 'border-amber-300 bg-amber-50'}`}><p className={`text-xs font-bold ${summary.net >= 0 ? 'text-indigo-800' : 'text-amber-800'}`}>คงเหลือสุทธิ</p><p className={`mt-2 text-xl font-black ${summary.net >= 0 ? 'text-indigo-800' : 'text-amber-800'}`}>{summary.net < 0 ? '-' : ''}{formatCurrency(Math.abs(summary.net))}</p></div>
              </div>
            </section>

            {period === 'year' && (
              <section className="report-section mt-7" aria-labelledby="report-monthly-title">
                <h2 id="report-monthly-title" className="text-sm font-black uppercase tracking-wider text-slate-600">สรุปยอดรายเดือน</h2>
                <div className="mt-3 overflow-hidden rounded-xl border border-slate-200">
                  <table className="report-table w-full table-fixed text-sm">
                    <thead className="bg-slate-100 text-left text-xs font-bold text-slate-600"><tr><th className="px-3 py-2">เดือน</th><th className="px-3 py-2 text-right">รายรับ</th><th className="px-3 py-2 text-right">รายจ่าย</th><th className="px-3 py-2 text-right">คงเหลือ</th></tr></thead>
                    <tbody className="divide-y divide-slate-100">{monthlySummary.map((row, index) => { const net = row.income - row.expense; return <tr key={row.month}><td className="px-3 py-2 font-semibold">{MONTH_LABELS[index]}</td><td className="px-3 py-2 text-right text-emerald-700">{formatCurrency(row.income)}</td><td className="px-3 py-2 text-right text-rose-700">{formatCurrency(row.expense)}</td><td className={`px-3 py-2 text-right font-bold ${net >= 0 ? 'text-indigo-700' : 'text-amber-700'}`}>{net < 0 ? '-' : ''}{formatCurrency(Math.abs(net))}</td></tr>; })}</tbody>
                  </table>
                </div>
              </section>
            )}

            <section className="report-section mt-7" aria-labelledby="report-details-title">
              <div className="flex items-baseline justify-between gap-3"><h2 id="report-details-title" className="text-sm font-black uppercase tracking-wider text-slate-600">รายละเอียดรายการ</h2><span className="text-xs text-slate-400">{reportTransactions.length} รายการ</span></div>
              {reportRows.length === 0 ? <p className="mt-3 rounded-xl border border-dashed border-slate-300 px-4 py-8 text-center text-sm text-slate-400">ไม่พบรายการในช่วงเวลานี้</p> : <div className="mt-3 overflow-hidden rounded-xl border border-slate-300"><table className="report-table w-full table-fixed text-sm"><colgroup><col className="w-[7%]" /><col className="w-[15%]" /><col className="w-[28%]" /><col className="w-[15%]" /><col className="w-[12%]" /><col className="w-[12%]" /><col className="w-[15%]" /></colgroup><thead className="bg-slate-100 text-left text-xs font-bold text-slate-700"><tr><th className="border-r border-slate-300 px-2 py-2 text-center">#</th><th className="border-r border-slate-300 px-2 py-2">วันที่</th><th className="border-r border-slate-300 px-2 py-2">รายละเอียดรายการ</th><th className="border-r border-slate-300 px-2 py-2">หมวดหมู่</th><th className="border-r border-slate-300 px-2 py-2 text-right">รายรับ</th><th className="border-r border-slate-300 px-2 py-2 text-right">รายจ่าย</th><th className="px-2 py-2 text-right">คงเหลือ</th></tr></thead><tbody>{reportRows.map(({ transaction, index, balance }) => <tr key={transaction.id} className="break-inside-avoid"><td className="border-r border-t border-slate-200 px-2 py-2 text-center text-slate-500">{index}</td><td className="border-r border-t border-slate-200 px-2 py-2 align-top whitespace-nowrap">{formatDate(transaction.date)}</td><td className="border-r border-t border-slate-200 px-2 py-2 align-top"><p className="font-semibold">{transaction.note || transaction.category}</p>{transaction.note && <p className="mt-0.5 text-xs text-slate-500">{transaction.category}</p>}</td><td className="border-r border-t border-slate-200 px-2 py-2 align-top">{transaction.category}</td><td className="border-r border-t border-slate-200 px-2 py-2 text-right align-top text-emerald-700">{transaction.type === 'income' ? formatCurrency(transaction.amount) : '-'}</td><td className="border-r border-t border-slate-200 px-2 py-2 text-right align-top text-rose-700">{transaction.type === 'expense' ? formatCurrency(transaction.amount) : '-'}</td><td className={`border-t border-slate-200 px-2 py-2 text-right align-top font-semibold ${balance >= 0 ? 'text-indigo-700' : 'text-amber-700'}`}>{balance < 0 ? '-' : ''}{formatCurrency(Math.abs(balance))}</td></tr>)}</tbody></table></div>}
            </section>

            {categorySummary.length > 0 && (
              <section className="report-section mt-7" aria-labelledby="report-category-title">
                <h2 id="report-category-title" className="text-sm font-black uppercase tracking-wider text-slate-600">สรุปตามหมวดหมู่</h2>
                <div className="mt-3 overflow-hidden rounded-xl border border-slate-200"><table className="report-table w-full text-sm"><thead className="bg-slate-100 text-left text-xs font-bold text-slate-600"><tr><th className="px-3 py-2">ประเภท</th><th className="px-3 py-2">หมวดหมู่</th><th className="px-3 py-2 text-right">จำนวนรายการ</th><th className="px-3 py-2 text-right">ยอดรวม</th></tr></thead><tbody className="divide-y divide-slate-100">{categorySummary.map((row) => <tr key={`${row.type}:${row.name}`}><td className={`px-3 py-2 font-semibold ${row.type === 'income' ? 'text-emerald-700' : 'text-rose-700'}`}>{typeLabel(row.type)}</td><td className="px-3 py-2 font-semibold">{row.name}</td><td className="px-3 py-2 text-right text-slate-500">{row.count}</td><td className={`px-3 py-2 text-right font-bold ${row.type === 'income' ? 'text-emerald-700' : 'text-rose-700'}`}>{formatCurrency(row.amount)}</td></tr>)}</tbody></table></div>
              </section>
            )}

            <footer className="mt-8 border-t border-slate-200 pt-3 text-center text-[10px] text-slate-400">รายงานนี้สร้างจาก CashFlow Home</footer>
          </article>
        </div>
      </div>
    </div>
  );
}
