import { LayoutDashboard, List, LogOut, Plus, Repeat, ShieldCheck, Tag, Wallet } from 'lucide-react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { periodSearch, readSelectedPeriod } from '../hooks/useSelectedPeriod';

export function Navbar() {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const period = readSelectedPeriod(new URLSearchParams(location.search));
  const periodQuery = periodSearch(period.year, period.month);

  async function handleSignOut() {
    await signOut();
    navigate('/login', { replace: true });
  }

  const desktopLinkClass = ({ isActive }: { isActive: boolean }) => `flex min-h-11 items-center gap-2 rounded-xl px-3 text-sm font-bold transition-colors ${isActive ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'}`;
  const mobileLinkClass = ({ isActive }: { isActive: boolean }) => `flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl px-1 text-xs font-semibold ${isActive ? 'text-indigo-700' : 'text-slate-500'}`;

  return (
    <>
      <nav className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur-xl" aria-label="เมนูหลัก">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
            <NavLink to={{ pathname: '/', search: periodQuery }} className="flex items-center gap-2 text-lg font-bold tracking-tight text-indigo-700" aria-label="CashFlow หน้าแรก">
            <span className="rounded-xl bg-indigo-600 p-2 text-white shadow-md shadow-indigo-600/15"><Wallet size={18} /></span>
            CashFlow
          </NavLink>

          <div className="hidden items-center gap-1 sm:flex">
            <NavLink to={{ pathname: '/', search: periodQuery }} end className={desktopLinkClass}><LayoutDashboard size={17} /> ภาพรวม</NavLink>
            <NavLink to={{ pathname: '/transactions', search: periodQuery }} className={desktopLinkClass}><List size={17} /> รายการ</NavLink>
            <NavLink to={{ pathname: '/recurring', search: periodQuery }} className={desktopLinkClass}><Repeat size={17} /> รายการประจำ</NavLink>
            <NavLink to={{ pathname: '/categories', search: periodQuery }} className={desktopLinkClass}><Tag size={17} /> หมวดหมู่</NavLink>
            {profile?.role === 'admin' && <NavLink to={{ pathname: '/admin', search: periodQuery }} className={desktopLinkClass}><ShieldCheck size={17} /> จัดการระบบ</NavLink>}
          </div>

          <div className="flex items-center gap-2">
            {profile?.role === 'admin' && <NavLink to={{ pathname: '/admin', search: periodQuery }} className="grid min-h-11 min-w-11 place-items-center rounded-xl text-indigo-600 hover:bg-indigo-50 sm:hidden" aria-label="จัดการระบบ"><ShieldCheck size={19} /></NavLink>}
            <div className="hidden text-right lg:block"><p className="max-w-40 truncate text-sm font-bold text-slate-700">{profile?.full_name}</p><p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">{profile?.role === 'admin' ? 'ผู้ดูแลระบบ' : 'สมาชิก'}</p></div>
            <button type="button" onClick={handleSignOut} className="grid min-h-11 min-w-11 place-items-center rounded-xl text-slate-400 hover:bg-rose-50 hover:text-rose-600" aria-label="ออกจากระบบ" title="ออกจากระบบ"><LogOut size={18} /></button>
          </div>
        </div>
      </nav>

      <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-slate-200 bg-white/95 px-2 pb-[max(0.35rem,env(safe-area-inset-bottom))] pt-1 shadow-[0_-8px_30px_rgba(15,23,42,0.08)] backdrop-blur-xl sm:hidden" aria-label="เมนูมือถือ">
        <div className="mx-auto grid max-w-lg grid-cols-5 gap-1">
          <NavLink to={{ pathname: '/', search: periodQuery }} end className={mobileLinkClass}><LayoutDashboard size={20} />ภาพรวม</NavLink>
          <NavLink to={{ pathname: '/transactions', search: periodQuery }} className={mobileLinkClass}><List size={20} />รายการ</NavLink>
          <NavLink to={{ pathname: '/transactions', search: periodSearch(period.year, period.month, true) }} className="flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl text-xs font-semibold text-indigo-700"><span className="grid h-9 w-9 place-items-center rounded-full bg-indigo-600 text-white shadow-md shadow-indigo-900/20"><Plus size={20} /></span>เพิ่ม</NavLink>
          <NavLink to={{ pathname: '/recurring', search: periodQuery }} className={mobileLinkClass}><Repeat size={20} />ประจำ</NavLink>
          <NavLink to={{ pathname: '/categories', search: periodQuery }} className={mobileLinkClass}><Tag size={20} />หมวดหมู่</NavLink>
        </div>
      </nav>
    </>
  );
}
