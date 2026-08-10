import { useEffect, useState } from 'react';
import { Archive, Check, MailPlus, Pencil, Plus, RotateCcw, ShieldCheck, Trash2, UserRound, X } from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { useToast } from '../hooks/useToast';
import { useAdmin } from '../hooks/useAdmin';
import { useCategories } from '../hooks/useCategories';
import { useAuth } from '../hooks/useAuth';
import type { AdminUser, Category, TransactionType, UserRole } from '../types';
import { formatDate } from '../utils/formatDate';
import { getCategoryColor } from '../utils/categoryColors';
import { getThaiErrorMessage } from '../utils/errors';

export function AdminPage() {
  const { user: currentUser } = useAuth();
  const { showToast } = useToast();
  const { users, loading, error, fetchUsers, updateUserRole, toggleUserActive, deleteUser, inviteUser } = useAdmin();
  const { categories, loading: categoryLoading, error: categoryError, fetchCategories, addSystemCategory, updateCategory, archiveCategory, restoreCategory } = useCategories();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>('member');
  const [inviteLoading, setInviteLoading] = useState(false);
  const [busyUserId, setBusyUserId] = useState<string | null>(null);
  const [deleteUserTarget, setDeleteUserTarget] = useState<AdminUser | null>(null);
  const [categoryTab, setCategoryTab] = useState<TransactionType>('expense');
  const [newCategoryName, setNewCategoryName] = useState('');
  const [addCategoryLoading, setAddCategoryLoading] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [editingCategoryName, setEditingCategoryName] = useState('');
  const [categoryActionLoading, setCategoryActionLoading] = useState(false);
  const [archiveTarget, setArchiveTarget] = useState<Category | null>(null);

  useEffect(() => { void fetchUsers(); void fetchCategories(); }, [fetchCategories, fetchUsers]);

  const visibleCategories = categories.filter((category) => category.user_id === null && category.type === categoryTab);
  const activeCategories = visibleCategories.filter((category) => category.is_active);
  const archivedCategories = visibleCategories.filter((category) => !category.is_active);

  async function handleInvite(event: React.SyntheticEvent) {
    event.preventDefault();
    if (!fullName.trim() || !email.trim()) return;
    setInviteLoading(true);
    try {
      await inviteUser({ full_name: fullName.trim(), email: email.trim().toLowerCase(), role });
      showToast(`ส่งคำเชิญไปที่ ${email.trim().toLowerCase()} แล้ว`);
      setFullName(''); setEmail(''); setRole('member');
      await fetchUsers();
    } catch (inviteError) {
      showToast(getThaiErrorMessage(inviteError, 'ส่งคำเชิญไม่สำเร็จ'), { tone: 'error' });
    } finally {
      setInviteLoading(false);
    }
  }

  async function handleRoleChange(user: AdminUser, nextRole: UserRole) {
    if (user.id === currentUser?.id) return;
    setBusyUserId(user.id);
    try {
      await updateUserRole(user.id, nextRole);
      await fetchUsers();
      showToast(`เปลี่ยนสิทธิ์ของ ${user.full_name} แล้ว`);
    } catch (updateError) {
      showToast(getThaiErrorMessage(updateError, 'เปลี่ยนสิทธิ์ไม่สำเร็จ'), { tone: 'error' });
    } finally {
      setBusyUserId(null);
    }
  }

  async function handleToggleActive(user: AdminUser) {
    if (user.id === currentUser?.id) return;
    setBusyUserId(user.id);
    try {
      await toggleUserActive(user.id, !user.is_active);
      await fetchUsers();
      showToast(user.is_active ? `ปิดบัญชี ${user.full_name} แล้ว` : `เปิดบัญชี ${user.full_name} แล้ว`);
    } catch (toggleError) {
      showToast(getThaiErrorMessage(toggleError, 'เปลี่ยนสถานะไม่สำเร็จ'), { tone: 'error' });
    } finally {
      setBusyUserId(null);
    }
  }

  async function confirmDeleteUser() {
    if (!deleteUserTarget) return;
    const target = deleteUserTarget;
    setBusyUserId(target.id);
    try {
      await deleteUser(target.id);
      setDeleteUserTarget(null);
      await fetchUsers();
      showToast(`ลบบัญชี ${target.full_name || target.email} แล้ว`);
    } catch (deleteError) {
      showToast(getThaiErrorMessage(deleteError, 'ลบบัญชีไม่สำเร็จ'), { tone: 'error' });
    } finally {
      setBusyUserId(null);
    }
  }

  async function handleAddCategory(event: React.SyntheticEvent) {
    event.preventDefault();
    if (!newCategoryName.trim()) return;
    setAddCategoryLoading(true);
    try {
      await addSystemCategory(categoryTab, newCategoryName.trim());
      setNewCategoryName('');
      await fetchCategories();
      showToast('เพิ่มหมวดหมู่มาตรฐานแล้ว');
    } catch (addError) {
      showToast(getThaiErrorMessage(addError, 'เพิ่มหมวดหมู่ไม่สำเร็จ'), { tone: 'error' });
    } finally {
      setAddCategoryLoading(false);
    }
  }

  async function handleSaveCategory(id: string) {
    if (!editingCategoryName.trim()) return;
    setCategoryActionLoading(true);
    try {
      await updateCategory(id, editingCategoryName.trim());
      setEditingCategoryId(null);
      await fetchCategories();
      showToast('เปลี่ยนชื่อหมวดหมู่มาตรฐานแล้ว');
    } catch (updateError) {
      showToast(getThaiErrorMessage(updateError, 'แก้ไขหมวดหมู่ไม่สำเร็จ'), { tone: 'error' });
    } finally {
      setCategoryActionLoading(false);
    }
  }

  async function confirmArchiveCategory() {
    if (!archiveTarget) return;
    const target = archiveTarget;
    setCategoryActionLoading(true);
    try {
      await archiveCategory(target.id);
      setArchiveTarget(null);
      await fetchCategories();
      showToast('เก็บหมวดหมู่มาตรฐานแล้ว', { actionLabel: 'เลิกทำ', onAction: async () => { await restoreCategory(target.id); await fetchCategories(); showToast('กู้คืนหมวดหมู่แล้ว'); } });
    } catch (archiveError) {
      showToast(getThaiErrorMessage(archiveError, 'เก็บหมวดหมู่ไม่สำเร็จ'), { tone: 'error' });
    } finally {
      setCategoryActionLoading(false);
    }
  }

  async function handleRestoreCategory(category: Category) {
    try {
      await restoreCategory(category.id);
      await fetchCategories();
      showToast(`กู้คืนหมวด “${category.name}” แล้ว`);
    } catch (restoreError) {
      showToast(getThaiErrorMessage(restoreError, 'กู้คืนหมวดหมู่ไม่สำเร็จ'), { tone: 'error' });
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-24 sm:pb-0">
      <Navbar />
      <main className="mx-auto max-w-6xl space-y-6 px-4 py-6">
        <div className="flex items-center gap-2"><ShieldCheck className="text-indigo-600" size={23} /><div><h1 className="text-2xl font-black text-slate-900">จัดการระบบ</h1><p className="text-sm text-slate-500">เชิญสมาชิกและดูแลหมวดหมู่มาตรฐาน</p></div></div>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2"><MailPlus size={19} className="text-indigo-600" /><h2 className="font-bold text-slate-800">เชิญสมาชิก</h2></div>
          <form onSubmit={handleInvite} className="grid gap-3 md:grid-cols-[1fr_1.2fr_150px_auto] md:items-end">
            <label className="text-sm font-semibold text-slate-700">ชื่อ–นามสกุล<input required value={fullName} onChange={(event) => setFullName(event.target.value)} className="mt-1.5 min-h-12 w-full rounded-xl border border-slate-300 px-3 text-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100" placeholder="สมชาย ใจดี" /></label>
            <label className="text-sm font-semibold text-slate-700">อีเมล<input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="mt-1.5 min-h-12 w-full rounded-xl border border-slate-300 px-3 text-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100" placeholder="name@example.com" /></label>
            <label className="text-sm font-semibold text-slate-700">สิทธิ์<select value={role} onChange={(event) => setRole(event.target.value as UserRole)} className="mt-1.5 min-h-12 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"><option value="member">สมาชิก</option><option value="admin">ผู้ดูแลระบบ</option></select></label>
            <button type="submit" disabled={inviteLoading || !fullName.trim() || !email.trim()} className="min-h-12 rounded-xl bg-indigo-600 px-5 text-sm font-bold text-white hover:bg-indigo-700 disabled:opacity-50">{inviteLoading ? 'กำลังส่ง…' : 'ส่งคำเชิญ'}</button>
          </form>
          <p className="mt-3 text-xs text-slate-400">ระบบเปิดให้ใช้งานเฉพาะอีเมลที่ได้รับคำเชิญเท่านั้น</p>
        </section>

        <section>
          <div className="mb-3 flex items-center justify-between"><div><h2 className="font-bold text-slate-800">สมาชิก ({users.length})</h2><p className="text-xs text-slate-400">ข้อมูลทางการเงินของสมาชิกแต่ละคนแยกจากกัน</p></div>{error && <button type="button" onClick={() => void fetchUsers()} className="flex min-h-11 items-center gap-2 rounded-xl px-3 text-sm font-bold text-rose-600"><RotateCcw size={15} /> ลองใหม่</button>}</div>
          {error && <p className="mb-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}
          {loading ? <div className="grid gap-3 md:grid-cols-2">{Array.from({ length: 4 }, (_, index) => <div key={index} className="h-44 animate-pulse rounded-2xl bg-slate-200" />)}</div> : <div className="grid gap-3 md:grid-cols-2">{users.map((user) => { const isSelf = user.id === currentUser?.id; return <article key={user.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><div className="flex items-start gap-3"><span className="grid h-11 w-11 flex-shrink-0 place-items-center rounded-full bg-indigo-50 font-black text-indigo-700">{user.full_name?.charAt(0).toUpperCase() || <UserRound size={18} />}</span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h3 className="truncate font-bold text-slate-800">{user.full_name || 'ยังไม่ระบุชื่อ'}</h3>{isSelf && <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-700">บัญชีของคุณ</span>}</div><p className="truncate text-sm text-slate-500">{user.email}</p><p className="mt-1 text-xs text-slate-400">เข้าร่วม {formatDate(user.created_at)}</p></div></div><div className="mt-4 grid grid-cols-[1fr_1fr_auto] gap-2"><select aria-label={`สิทธิ์ของ ${user.full_name}`} value={user.role} onChange={(event) => void handleRoleChange(user, event.target.value as UserRole)} disabled={isSelf || busyUserId === user.id} className="min-h-11 min-w-0 rounded-xl border border-slate-200 bg-white px-2 text-xs font-bold text-slate-600 disabled:bg-slate-50 disabled:text-slate-400"><option value="member">สมาชิก</option><option value="admin">ผู้ดูแลระบบ</option></select><button type="button" onClick={() => void handleToggleActive(user)} disabled={isSelf || busyUserId === user.id} className={`min-h-11 rounded-xl px-2 text-xs font-bold disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400 ${user.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>{user.is_active ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}</button><button type="button" onClick={() => setDeleteUserTarget(user)} disabled={isSelf || busyUserId === user.id} className="grid min-h-11 min-w-11 place-items-center rounded-xl text-slate-300 hover:bg-rose-50 hover:text-rose-600 disabled:cursor-not-allowed disabled:text-slate-200" aria-label={`ลบบัญชี ${user.full_name}`}><Trash2 size={17} /></button></div></article>; })}</div>}
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4"><h2 className="font-bold text-slate-800">หมวดหมู่มาตรฐาน</h2><p className="text-xs text-slate-400">สมาชิกทุกคนมองเห็น แต่ข้อมูลรายการยังแยกกัน</p></div>
          <div className="mb-5 grid max-w-sm grid-cols-2 rounded-xl bg-slate-100 p-1"><button type="button" onClick={() => setCategoryTab('expense')} className={`min-h-11 rounded-lg text-sm font-bold ${categoryTab === 'expense' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-500'}`}>รายจ่าย</button><button type="button" onClick={() => setCategoryTab('income')} className={`min-h-11 rounded-lg text-sm font-bold ${categoryTab === 'income' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500'}`}>รายรับ</button></div>
          {categoryError && <p className="mb-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{categoryError}</p>}
          {categoryLoading ? <div className="space-y-2">{Array.from({ length: 4 }, (_, index) => <div key={index} className="h-12 animate-pulse rounded-xl bg-slate-100" />)}</div> : <div className="grid gap-2 md:grid-cols-2">{activeCategories.map((category, index) => <div key={category.id} className="flex min-h-12 items-center gap-3 rounded-xl border border-slate-100 px-3"><span className="h-3 w-3 rounded-full" style={{ backgroundColor: getCategoryColor(category.name, index) }} />{editingCategoryId === category.id ? <><label className="sr-only" htmlFor={`admin-category-${category.id}`}>ชื่อหมวดหมู่</label><input id={`admin-category-${category.id}`} autoFocus value={editingCategoryName} onChange={(event) => setEditingCategoryName(event.target.value)} className="min-h-10 min-w-0 flex-1 rounded-lg border border-indigo-300 px-2 text-sm" /><button type="button" onClick={() => void handleSaveCategory(category.id)} disabled={categoryActionLoading} className="grid min-h-11 min-w-11 place-items-center text-indigo-600" aria-label="บันทึก"><Check size={16} /></button><button type="button" onClick={() => setEditingCategoryId(null)} className="grid min-h-11 min-w-11 place-items-center text-slate-400" aria-label="ยกเลิก"><X size={16} /></button></> : <><span className="min-w-0 flex-1 truncate text-sm font-semibold text-slate-700">{category.name}</span><button type="button" onClick={() => { setEditingCategoryId(category.id); setEditingCategoryName(category.name); }} className="grid min-h-11 min-w-11 place-items-center rounded-lg text-slate-300 hover:text-indigo-600" aria-label={`แก้ไข ${category.name}`}><Pencil size={15} /></button><button type="button" onClick={() => setArchiveTarget(category)} className="grid min-h-11 min-w-11 place-items-center rounded-lg text-slate-300 hover:text-amber-600" aria-label={`เก็บ ${category.name}`}><Archive size={16} /></button></>}</div>)}</div>}
          {archivedCategories.length > 0 && <div className="mt-4 rounded-xl bg-slate-50 p-3"><p className="mb-2 text-xs font-bold text-slate-400">เก็บไว้แล้ว</p>{archivedCategories.map((category) => <div key={category.id} className="flex min-h-11 items-center gap-2"><span className="min-w-0 flex-1 truncate text-sm text-slate-400">{category.name}</span><button type="button" onClick={() => void handleRestoreCategory(category)} className="flex min-h-11 items-center gap-1.5 rounded-lg px-3 text-xs font-bold text-indigo-600 hover:bg-indigo-50"><RotateCcw size={14} /> กู้คืน</button></div>)}</div>}
          <form onSubmit={handleAddCategory} className="mt-5 flex flex-col gap-2 border-t border-slate-100 pt-5 sm:flex-row"><label htmlFor="admin-new-category" className="sr-only">ชื่อหมวดหมู่ใหม่</label><input id="admin-new-category" value={newCategoryName} onChange={(event) => setNewCategoryName(event.target.value)} className="min-h-12 min-w-0 flex-1 rounded-xl border border-slate-300 px-3 text-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100" placeholder={`เพิ่มหมวด${categoryTab === 'expense' ? 'รายจ่าย' : 'รายรับ'}มาตรฐาน`} maxLength={50} /><button type="submit" disabled={addCategoryLoading || !newCategoryName.trim()} className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 text-sm font-bold text-white disabled:opacity-50"><Plus size={17} /> {addCategoryLoading ? 'กำลังเพิ่ม…' : 'เพิ่มหมวดหมู่'}</button></form>
        </section>
      </main>
      <ConfirmDialog open={Boolean(deleteUserTarget)} title="ลบบัญชีสมาชิกหรือไม่?" description={deleteUserTarget ? `บัญชี ${deleteUserTarget.full_name || deleteUserTarget.email} และข้อมูลทั้งหมดจะถูกลบถาวร การดำเนินการนี้เลิกทำไม่ได้` : ''} confirmLabel="ลบบัญชี" loading={Boolean(busyUserId)} onClose={() => setDeleteUserTarget(null)} onConfirm={confirmDeleteUser} />
      <ConfirmDialog open={Boolean(archiveTarget)} title="เก็บหมวดหมู่นี้หรือไม่?" description={archiveTarget ? `หมวด “${archiveTarget.name}” จะไม่แสดงสำหรับรายการใหม่ แต่ประวัติเดิมยังอยู่ครบ` : ''} confirmLabel="เก็บหมวดหมู่" loading={categoryActionLoading} destructive={false} onClose={() => setArchiveTarget(null)} onConfirm={confirmArchiveCategory} />
    </div>
  );
}
