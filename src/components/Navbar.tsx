import { LayoutDashboard, List, LogOut, Plus, ShieldCheck, Tag, Wallet } from 'lucide-react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export function Navbar() {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();

  async function handleSignOut() {
    await signOut();
    navigate('/login', { replace: true });
  }

  const desktopLinkClass = ({ isActive }: { isActive: boolean }) => `flex min-h-11 items-center gap-2 rounded-xl px-3 text-sm font-bold transition-colors ${isActive ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'}`;
  const mobileLinkClass = ({ isActive }: { isActive: boolean }) => `flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl px-2 text-[10px] font-bold ${isActive ? 'text-indigo-700' : 'text-slate-400'}`;

  return (
    <>
      <nav className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur-xl" aria-label="เมนูหลัก">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <NavLink to="/" className="flex items-center gap-2 text-lg font-black tracking-tight text-indigo-700" aria-label="CashFlow หน้าแรก">
            <span className="rounded-xl bg-indigo-600 p-2 text-white shadow-md shadow-indigo-600/15"><Wallet size={18} /></span>
            CashFlow
          </NavLink>

          <div className="hidden items-center gap-1 sm:flex">
            <NavLink to="/" end className={desktopLinkClass}><LayoutDashboard size={17} /> ภาพรวม</NavLink>
            <NavLink to="/transactions" className={desktopLinkClass}><List size={17} /> รายการ</NavLink>
            <NavLink to="/categories" className={desktopLinkClass}><Tag size={17} /> หมวดหมู่</NavLink>
            {profile?.role === 'admin' && <NavLink to="/admin" className={desktopLinkClass}><ShieldCheck size={17} /> จัดการระบบ</NavLink>}
          </div>

          <div className="flex items-center gap-2">
            {profile?.role === 'admin' && <NavLink to="/admin" className="grid min-h-11 min-w-11 place-items-center rounded-xl text-indigo-600 hover:bg-indigo-50 sm:hidden" aria-label="จัดการระบบ"><ShieldCheck size={19} /></NavLink>}
            <div className="hidden text-right lg:block"><p className="max-w-40 truncate text-sm font-bold text-slate-700">{profile?.full_name}</p><p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">{profile?.role === 'admin' ? 'ผู้ดูแลระบบ' : 'สมาชิก'}</p></div>
            <button type="button" onClick={handleSignOut} className="grid min-h-11 min-w-11 place-items-center rounded-xl text-slate-400 hover:bg-rose-50 hover:text-rose-600" aria-label="ออกจากระบบ" title="ออกจากระบบ"><LogOut size={18} /></button>
          </div>
        </div>
      </nav>

      <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-slate-200 bg-white/95 px-2 pb-[max(0.35rem,env(safe-area-inset-bottom))] pt-1 shadow-[0_-8px_30px_rgba(15,23,42,0.08)] backdrop-blur-xl sm:hidden" aria-label="เมนูมือถือ">
        <div className="mx-auto grid max-w-md grid-cols-4 gap-1">
          <NavLink to="/" end className={mobileLinkClass}><LayoutDashboard size={20} />ภาพรวม</NavLink>
          <NavLink to="/transactions" className={mobileLinkClass}><List size={20} />รายการ</NavLink>
          <NavLink to="/transactions?add=1" className="flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl text-[10px] font-bold text-indigo-700"><span className="grid h-9 w-9 place-items-center rounded-full bg-indigo-600 text-white shadow-lg shadow-indigo-600/25"><Plus size={20} /></span>เพิ่ม</NavLink>
          <NavLink to="/categories" className={mobileLinkClass}><Tag size={20} />หมวดหมู่</NavLink>
        </div>
      </nav>
    </>
  );
}
