import { useMemo, useState, type FormEvent } from 'react';
import { Eye, EyeOff, KeyRound, Wallet } from 'lucide-react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export function LoginPage() {
  const { user, loading: authLoading, notice, signIn, signInWithGoogle, resetPassword } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [forgotMode, setForgotMode] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const oauthError = useMemo(() => {
    const params = new URLSearchParams(window.location.hash.replace(/^#/, '') || window.location.search);
    return params.get('error_description') ? 'ไม่สามารถเข้าสู่ระบบได้ อีเมลนี้อาจยังไม่ได้รับคำเชิญ' : '';
  }, []);

  async function handleSignIn(event: FormEvent) {
    event.preventDefault();
    setError(''); setSuccess(''); setLoading(true);
    const result = await signIn(email, password);
    setLoading(false);
    if (result.error) setError(result.error);
    else navigate('/');
  }

  async function handleResetPassword(event: FormEvent) {
    event.preventDefault();
    if (!email.trim()) { setError('กรุณากรอกอีเมล'); return; }
    setError(''); setSuccess(''); setLoading(true);
    const result = await resetPassword(email);
    setLoading(false);
    if (result.error) setError(result.error);
    else setSuccess('ส่งลิงก์ตั้งรหัสผ่านใหม่แล้ว กรุณาตรวจสอบอีเมล');
  }

  async function handleGoogleSignIn() {
    setError(''); setSuccess(''); setGoogleLoading(true);
    const result = await signInWithGoogle();
    if (result.error) { setError(result.error); setGoogleLoading(false); }
  }

  if (!authLoading && user) return <Navigate to="/" replace />;

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-slate-50 via-indigo-50/40 to-purple-50/60 px-4 py-8">
      <div className="pointer-events-none absolute -left-[10%] -top-[10%] h-[50%] w-[50%] rounded-full bg-indigo-200/30 blur-[100px]" />
      <div className="pointer-events-none absolute -bottom-[10%] -right-[10%] h-[50%] w-[50%] rounded-full bg-purple-200/30 blur-[100px]" />
      <div className="relative z-10 w-full max-w-sm">
        <div className="mb-7 flex flex-col items-center">
          <div className="mb-3 rounded-2xl bg-gradient-to-tr from-indigo-600 to-indigo-500 p-3 text-white shadow-lg shadow-indigo-500/20"><Wallet size={28} /></div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900">CashFlow</h1>
          <p className="mt-1.5 text-sm font-medium text-slate-500">บันทึกรายรับ–รายจ่ายสำหรับทุกคนในบ้าน</p>
        </div>

        <form onSubmit={forgotMode ? handleResetPassword : handleSignIn} className="space-y-4 rounded-3xl border border-white/80 bg-white/90 p-6 shadow-2xl shadow-slate-900/10 backdrop-blur-xl">
          {forgotMode && <div className="rounded-2xl bg-indigo-50 p-4"><div className="flex items-center gap-2 font-bold text-indigo-800"><KeyRound size={18} /> ตั้งรหัสผ่านใหม่</div><p className="mt-1 text-sm leading-6 text-indigo-700/70">กรอกอีเมลที่ได้รับคำเชิญ ระบบจะส่งลิงก์ให้คุณ</p></div>}
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-600" htmlFor="email">อีเมล<input id="email" type="email" required autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} className="mt-1.5 min-h-12 w-full rounded-xl border border-slate-200 bg-white/80 px-3.5 text-sm normal-case tracking-normal outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100" placeholder="you@example.com" /></label>
          {!forgotMode && <label className="block text-xs font-bold uppercase tracking-wider text-slate-600" htmlFor="password">รหัสผ่าน<div className="relative mt-1.5"><input id="password" type={showPassword ? 'text' : 'password'} required autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} className="min-h-12 w-full rounded-xl border border-slate-200 bg-white/80 px-3.5 pr-12 text-sm normal-case tracking-normal outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100" placeholder="••••••••" /><button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute right-1 top-1/2 grid min-h-11 min-w-11 -translate-y-1/2 place-items-center rounded-lg text-slate-400 hover:text-slate-700" aria-label={showPassword ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}>{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button></div></label>}

          {(error || oauthError || notice) && <p className="rounded-xl border border-rose-100 bg-rose-50 px-3.5 py-3 text-sm font-medium text-rose-700" role="alert">{error || oauthError || notice}</p>}
          {success && <p className="rounded-xl border border-emerald-100 bg-emerald-50 px-3.5 py-3 text-sm font-medium text-emerald-700" role="status">{success}</p>}

          <button type="submit" disabled={loading || googleLoading} className="min-h-12 w-full rounded-xl bg-indigo-600 text-sm font-bold text-white shadow-md shadow-indigo-600/15 transition hover:bg-indigo-700 active:scale-[0.99] disabled:opacity-60">{loading ? 'กำลังดำเนินการ…' : forgotMode ? 'ส่งลิงก์ตั้งรหัสผ่าน' : 'เข้าสู่ระบบ'}</button>

          <button type="button" onClick={() => { setForgotMode((value) => !value); setError(''); setSuccess(''); }} className="min-h-11 w-full text-sm font-bold text-indigo-600 hover:text-indigo-800">{forgotMode ? 'กลับไปเข้าสู่ระบบ' : 'ลืมรหัสผ่าน?'}</button>

          {!forgotMode && <><div className="relative flex items-center justify-center py-1"><div className="absolute inset-x-0 border-t border-slate-100" /><span className="relative bg-white px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">หรือ</span></div><button type="button" onClick={handleGoogleSignIn} disabled={loading || googleLoading} className="flex min-h-12 w-full items-center justify-center gap-2.5 rounded-xl border border-slate-200 bg-white text-sm font-bold text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-60"><svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true"><path d="M21.35 11.1H12v2.7h5.38a4.6 4.6 0 0 1-2.04 3.1v2.58h3.3c1.93-1.78 3.04-4.4 3.04-7.48 0-.61-.06-1.2-.16-1.72Z" fill="#4285F4"/><path d="M12 20.6c2.59 0 4.77-.86 6.36-2.32l-3.3-2.58a5.6 5.6 0 0 1-8.13-2.74H3.5v2.66A9.6 9.6 0 0 0 12 20.6Z" fill="#34A853"/><path d="M6.93 12.96A5.2 5.2 0 0 1 6.65 11c0-.59.1-1.17.28-1.71V6.88H3.5A9.6 9.6 0 0 0 2.5 11c0 1.51.36 2.94 1 4.22Z" fill="#FBBC05"/><path d="M12 6.58c1.41 0 2.68.49 3.68 1.44l2.76-2.76A9.5 9.5 0 0 0 3.5 8.53l3.43 2.66A5.4 5.4 0 0 1 12 6.58Z" fill="#EA4335"/></svg>{googleLoading ? 'กำลังเชื่อมต่อ…' : 'เข้าสู่ระบบด้วย Google'}</button></>}
        </form>
        <p className="mt-4 text-center text-xs text-slate-400">ใช้งานได้เฉพาะอีเมลที่ผู้ดูแลระบบเชิญแล้ว</p>
      </div>
    </div>
  );
}
