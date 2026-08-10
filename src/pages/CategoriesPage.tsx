import { useEffect, useState } from 'react';
import { Archive, Check, ChevronDown, ChevronUp, Lock, Pencil, Plus, RotateCcw, Tag, X } from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { useToast } from '../hooks/useToast';
import { useCategories } from '../hooks/useCategories';
import type { Category, TransactionType } from '../types';
import { getCategoryColor } from '../utils/categoryColors';
import { getThaiErrorMessage } from '../utils/errors';

export function CategoriesPage() {
  const { loading, error, fetchCategories, addCategory, updateCategory, archiveCategory, restoreCategory, getCategoriesByType } = useCategories();
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<TransactionType>('expense');
  const [newName, setNewName] = useState('');
  const [addLoading, setAddLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [editLoading, setEditLoading] = useState(false);
  const [archiveTarget, setArchiveTarget] = useState<Category | null>(null);
  const [archiving, setArchiving] = useState(false);
  const [showArchived, setShowArchived] = useState(false);

  useEffect(() => { void fetchCategories(); }, [fetchCategories]);

  const { system, custom } = getCategoriesByType(activeTab, true);
  const activeSystem = system.filter((category) => category.is_active);
  const activeCustom = custom.filter((category) => category.is_active);
  const archivedCustom = custom.filter((category) => !category.is_active);

  async function handleAdd(event: React.SyntheticEvent) {
    event.preventDefault();
    const name = newName.trim();
    if (!name) return;
    setAddLoading(true);
    try {
      await addCategory(activeTab, name);
      setNewName('');
      await fetchCategories();
      showToast('เพิ่มหมวดหมู่แล้ว');
    } catch (addError) {
      showToast(getThaiErrorMessage(addError, 'เพิ่มหมวดหมู่ไม่สำเร็จ'), { tone: 'error' });
    } finally {
      setAddLoading(false);
    }
  }

  async function handleSaveEdit(id: string) {
    const name = editingName.trim();
    if (!name) return;
    setEditLoading(true);
    try {
      await updateCategory(id, name);
      setEditingId(null);
      await fetchCategories();
      showToast('เปลี่ยนชื่อหมวดหมู่แล้ว รายการเก่าจะแสดงชื่อใหม่ด้วย');
    } catch (editError) {
      showToast(getThaiErrorMessage(editError, 'แก้ไขหมวดหมู่ไม่สำเร็จ'), { tone: 'error' });
    } finally {
      setEditLoading(false);
    }
  }

  async function confirmArchive() {
    if (!archiveTarget) return;
    const target = archiveTarget;
    setArchiving(true);
    try {
      await archiveCategory(target.id);
      setArchiveTarget(null);
      await fetchCategories();
      showToast('เก็บหมวดหมู่แล้ว ประวัติรายการยังอยู่ครบ', {
        actionLabel: 'เลิกทำ',
        onAction: async () => { await restoreCategory(target.id); await fetchCategories(); showToast('กู้คืนหมวดหมู่แล้ว'); },
      });
    } catch (archiveError) {
      showToast(getThaiErrorMessage(archiveError, 'เก็บหมวดหมู่ไม่สำเร็จ'), { tone: 'error' });
    } finally {
      setArchiving(false);
    }
  }

  async function handleRestore(category: Category) {
    try {
      await restoreCategory(category.id);
      await fetchCategories();
      showToast(`กู้คืนหมวด “${category.name}” แล้ว`);
    } catch (restoreError) {
      showToast(getThaiErrorMessage(restoreError, 'กู้คืนหมวดหมู่ไม่สำเร็จ'), { tone: 'error' });
    }
  }

  function cancelEdit() {
    setEditingId(null);
    setEditingName('');
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-24 sm:pb-0">
      <Navbar />
      <main className="mx-auto max-w-3xl space-y-6 px-4 py-6">
        <div><div className="flex items-center gap-2"><Tag className="text-indigo-600" size={22} /><h1 className="text-2xl font-black tracking-tight text-slate-900">หมวดหมู่ของฉัน</h1></div><p className="mt-1 text-sm text-slate-500">ตั้งชื่อหมวดให้ตรงกับรูปแบบการใช้เงินของคุณ</p></div>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-5 grid grid-cols-2 rounded-xl bg-slate-100 p-1">
            <button type="button" onClick={() => { setActiveTab('expense'); cancelEdit(); }} className={`min-h-11 rounded-lg text-sm font-bold ${activeTab === 'expense' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-500'}`} aria-pressed={activeTab === 'expense'}>รายจ่าย</button>
            <button type="button" onClick={() => { setActiveTab('income'); cancelEdit(); }} className={`min-h-11 rounded-lg text-sm font-bold ${activeTab === 'income' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500'}`} aria-pressed={activeTab === 'income'}>รายรับ</button>
          </div>

          {error && <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 p-4 text-center"><p className="text-sm text-rose-700">{error}</p><button type="button" onClick={() => void fetchCategories()} className="mt-2 inline-flex min-h-11 items-center gap-2 rounded-lg px-3 text-sm font-bold text-rose-700"><RotateCcw size={15} /> ลองใหม่</button></div>}
          {loading ? <div className="space-y-2">{Array.from({ length: 5 }, (_, index) => <div key={index} className="h-12 animate-pulse rounded-xl bg-slate-100" />)}</div> : <>
            {activeSystem.length > 0 && <div className="mb-6"><h2 className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-400"><Lock size={13} /> หมวดหมู่มาตรฐาน</h2><div className="grid gap-2 sm:grid-cols-2">{activeSystem.map((category, index) => <div key={category.id} className="flex min-h-11 items-center gap-3 rounded-xl bg-slate-50 px-3"><span className="h-3 w-3 rounded-full" style={{ backgroundColor: getCategoryColor(category.name, index) }} /><span className="flex-1 text-sm font-semibold text-slate-600">{category.name}</span><span className="text-[10px] font-bold text-slate-400">ระบบ</span></div>)}</div></div>}

            <div className="mb-5"><h2 className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-400">หมวดหมู่ที่สร้างเอง</h2>{activeCustom.length === 0 ? <p className="rounded-xl border border-dashed border-slate-200 py-8 text-center text-sm text-slate-400">ยังไม่มีหมวดหมู่ที่สร้างเอง</p> : <div className="space-y-2">{activeCustom.map((category, index) => <div key={category.id} className="rounded-xl border border-transparent hover:border-slate-100 hover:bg-slate-50">{editingId === category.id ? <div className="flex items-center gap-2 p-2"><span className="h-3 w-3 rounded-full" style={{ backgroundColor: getCategoryColor(category.name, activeSystem.length + index) }} /><label className="sr-only" htmlFor={`category-${category.id}`}>ชื่อหมวดหมู่</label><input id={`category-${category.id}`} autoFocus value={editingName} onChange={(event) => setEditingName(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') void handleSaveEdit(category.id); if (event.key === 'Escape') cancelEdit(); }} className="min-h-11 min-w-0 flex-1 rounded-lg border border-indigo-300 px-3 text-sm outline-none focus:ring-4 focus:ring-indigo-100" maxLength={50} /><button type="button" onClick={() => void handleSaveEdit(category.id)} disabled={editLoading || !editingName.trim()} className="grid min-h-11 min-w-11 place-items-center rounded-lg text-indigo-600 hover:bg-indigo-50 disabled:opacity-40" aria-label="บันทึกชื่อ"><Check size={17} /></button><button type="button" onClick={cancelEdit} className="grid min-h-11 min-w-11 place-items-center rounded-lg text-slate-400 hover:bg-slate-100" aria-label="ยกเลิก"><X size={17} /></button></div> : <div className="flex min-h-12 items-center gap-3 px-3"><span className="h-3 w-3 rounded-full" style={{ backgroundColor: getCategoryColor(category.name, activeSystem.length + index) }} /><span className="min-w-0 flex-1 truncate text-sm font-semibold text-slate-700">{category.name}</span><button type="button" onClick={() => { setEditingId(category.id); setEditingName(category.name); }} className="grid min-h-11 min-w-11 place-items-center rounded-lg text-slate-300 hover:bg-indigo-50 hover:text-indigo-600" aria-label={`แก้ไขหมวด ${category.name}`}><Pencil size={15} /></button><button type="button" onClick={() => setArchiveTarget(category)} className="grid min-h-11 min-w-11 place-items-center rounded-lg text-slate-300 hover:bg-amber-50 hover:text-amber-600" aria-label={`เก็บหมวด ${category.name}`}><Archive size={16} /></button></div>}</div>)}</div>}</div>

            {archivedCustom.length > 0 && <div className="mb-5 rounded-xl border border-slate-200"><button type="button" onClick={() => setShowArchived((value) => !value)} className="flex min-h-12 w-full items-center gap-2 px-3 text-left text-sm font-bold text-slate-600" aria-expanded={showArchived}><Archive size={16} /><span className="flex-1">หมวดที่เก็บไว้ ({archivedCustom.length})</span>{showArchived ? <ChevronUp size={17} /> : <ChevronDown size={17} />}</button>{showArchived && <div className="border-t border-slate-100 p-2">{archivedCustom.map((category) => <div key={category.id} className="flex min-h-12 items-center gap-3 rounded-lg px-2"><span className="min-w-0 flex-1 truncate text-sm text-slate-400">{category.name}</span><button type="button" onClick={() => void handleRestore(category)} className="flex min-h-11 items-center gap-1.5 rounded-lg px-3 text-xs font-bold text-indigo-600 hover:bg-indigo-50"><RotateCcw size={14} /> กู้คืน</button></div>)}</div>}</div>}
          </>}

          <form onSubmit={handleAdd} className="flex flex-col gap-2 border-t border-slate-100 pt-5 sm:flex-row"><label className="sr-only" htmlFor="new-category">ชื่อหมวดหมู่ใหม่</label><input id="new-category" type="text" value={newName} onChange={(event) => setNewName(event.target.value)} placeholder={`เพิ่มหมวด${activeTab === 'expense' ? 'รายจ่าย' : 'รายรับ'}ใหม่`} className="min-h-12 min-w-0 flex-1 rounded-xl border border-slate-300 px-3 text-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100" maxLength={50} /><button type="submit" disabled={addLoading || !newName.trim()} className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 text-sm font-bold text-white hover:bg-indigo-700 disabled:opacity-50"><Plus size={17} /> {addLoading ? 'กำลังเพิ่ม…' : 'เพิ่มหมวดหมู่'}</button></form>
        </section>
      </main>
      <ConfirmDialog open={Boolean(archiveTarget)} title="เก็บหมวดหมู่นี้หรือไม่?" description={archiveTarget ? `หมวด “${archiveTarget.name}” จะหายจากตัวเลือกใหม่ แต่รายการเก่าทั้งหมดยังคงอยู่` : ''} confirmLabel="เก็บหมวดหมู่" loading={archiving} destructive={false} onClose={() => setArchiveTarget(null)} onConfirm={confirmArchive} />
    </div>
  );
}
