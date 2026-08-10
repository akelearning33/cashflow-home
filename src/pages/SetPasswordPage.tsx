import { useMemo, useState, type FormEvent } from 'react';
import { CheckCircle2, Eye, EyeOff, KeyRound, Wallet } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../hooks/useAuth';
import { getThaiErrorMessage } from '../utils/errors';

export function SetPasswordPage() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [saving, setSaving] = useState(false);
  const linkError = useMemo(() => new URLSearchParams(window.location.hash.replace(/^#/, '') || window.location.search).get('error_description'), []);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault(); setError('');
    if (password.length < 8) { setError('รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร'); return; }
    if (password !== confirmPassword) { setError('รหัสผ่านทั้งสองช่องไม่ตรงกัน'); return; }
    setSaving(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setSaving(false);
    if (updateError) { setError(getThaiErrorMessage(updateError, 'บันทึกรหัสผ่านไม่สำเร็จ')); return; }
    setSuccess(true);
    window.setTimeout(() => navigate('/', { replace: true }), 900);
  }

  if (authLoading) return <div className="grid min-h-screen place-items-center bg-slate-50"><div className="h-9 w-9 animate-spin rounded-full border-2 border-slate-200 border-t-indigo-600" aria-label="กำลังโหลด" /></div>;

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-indigo-50/40 to-purple-50/60 px-4 py-8">
      <div className="w-full max-w-sm">
        <div className="mb-7 flex flex-col items-center"><div className="mb-3 rounded-2xl bg-indigo-600 p-3 text-white shadow-lg shadow-indigo-500/20"><Wallet size={28} /></div><h1 className="text-3xl font-black text-slate-900">CashFlow</h1><p className="mt-1.5 text-sm font-medium text-slate-500">ตั้งรหัสผ่านสำหรับบัญชีของคุณ</p></div>
        {!user ? <div className="rounded-3xl border border-rose-100 bg-white p-6 text-center shadow-xl"><KeyRound size={28} className="mx-auto text-rose-500" /><h2 className="mt-3 font-bold text-slate-800">ลิงก์นี้ใช้ไม่ได้หรือหมดอายุแล้ว</h2><p className="mt-2 text-sm leading-6 text-slate-500">{linkError ? 'กรุณาขอลิงก์ใหม่จากหน้าเข้าสู่ระบบ หรือติดต่อผู้ดูแลระบบให้ส่งคำเชิญอีกครั้ง' : 'กรุณาเปิดลิงก์ล่าสุดจากอีเมลของคุณ'}</p><Link to="/login" className="mt-4 inline-flex min-h-11 items-center rounded-xl bg-indigo-600 px-4 text-sm font-bold text-white">กลับหน้าเข้าสู่ระบบ</Link></div> : <form onSubmit={handleSubmit} className="space-y-4 rounded-3xl border border-white/80 bg-white/90 p-6 shadow-xl backdrop-blur"><div className="flex items-center gap-2 text-indigo-700"><KeyRound size={18} /><h2 className="font-bold">สร้างรหัสผ่านใหม่</h2></div><label className="block text-xs font-bold uppercase tracking-wider text-slate-600" htmlFor="new-password">รหัสผ่านใหม่<div className="relative mt-1.5"><input id="new-password" type={showPassword ? 'text' : 'password'} required minLength={8} autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} className="min-h-12 w-full rounded-xl border border-slate-200 px-3.5 pr-12 text-sm normal-case tracking-normal outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100" placeholder="อย่างน้อย 8 ตัวอักษร" /><button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute right-1 top-1/2 grid min-h-11 min-w-11 -translate-y-1/2 place-items-center rounded-lg text-slate-400" aria-label={showPassword ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}>{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button></div></label><label className="block text-xs font-bold uppercase tracking-wider text-slate-600" htmlFor="confirm-password">ยืนยันรหัสผ่าน<input id="confirm-password" type={showPassword ? 'text' : 'password'} required minLength={8} autoComplete="new-password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} className="mt-1.5 min-h-12 w-full rounded-xl border border-slate-200 px-3.5 text-sm normal-case tracking-normal outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100" placeholder="กรอกรหัสผ่านอีกครั้ง" /></label>{error && <p className="rounded-xl border border-rose-100 bg-rose-50 px-3.5 py-3 text-sm font-medium text-rose-700" role="alert">{error}</p>}{success && <p className="flex items-center gap-2 rounded-xl border border-emerald-100 bg-emerald-50 px-3.5 py-3 text-sm font-medium text-emerald-700" role="status"><CheckCircle2 size={16} /> บันทึกรหัสผ่านแล้ว กำลังเปิดหน้าหลัก…</p>}<button type="submit" disabled={saving || success} className="min-h-12 w-full rounded-xl bg-indigo-600 text-sm font-bold text-white hover:bg-indigo-700 disabled:opacity-60">{saving ? 'กำลังบันทึก…' : 'บันทึกรหัสผ่าน'}</button></form>}
      </div>
    </div>
  );
}
