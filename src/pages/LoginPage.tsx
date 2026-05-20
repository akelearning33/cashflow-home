import { useState, type FormEvent } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Wallet } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export function LoginPage() {
  const { user, loading: authLoading, signIn, signInWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    const { error: signInError } = await signIn(email, password);
    setLoading(false);
    if (signInError) {
      setError(signInError);
    } else {
      navigate('/');
    }
  }

  async function handleGoogleSignIn() {
    setError('');
    setGoogleLoading(true);
    const { error: signInError } = await signInWithGoogle();
    if (signInError) {
      setError(signInError);
      setGoogleLoading(false);
    }
  }

  if (!authLoading && user) return <Navigate to="/" replace />;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-indigo-50/30 to-purple-50/50 px-4 relative overflow-hidden">
      {/* Dynamic blurred ambient backgrounds for a premium feel */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-200/30 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-purple-200/30 blur-[100px] pointer-events-none" />

      <div className="w-full max-w-sm relative z-10">
        <div className="flex flex-col items-center mb-8">
          <div className="bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white p-3 rounded-2xl mb-3 shadow-lg shadow-indigo-500/20 hover:scale-105 transition-transform duration-300 cursor-default">
            <Wallet size={28} className="animate-pulse" style={{ animationDuration: '3s' }} />
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">CashFlow</h1>
          <p className="text-gray-500 text-sm mt-1.5 font-medium">Family Income & Expense Tracker</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white/85 backdrop-blur-md rounded-2xl shadow-xl border border-gray-100 p-6 space-y-4 hover:shadow-2xl transition-shadow duration-300"
        >
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1.5" htmlFor="email">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all bg-white/70"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1.5" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all bg-white/70"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <p className="text-red-600 text-sm bg-red-50 border border-red-100 rounded-xl px-3.5 py-2.5 font-medium">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || googleLoading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-xl font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200 shadow-md shadow-indigo-600/10 cursor-pointer"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Signing in...
              </span>
            ) : (
              'Sign In'
            )}
          </button>

          <div className="relative flex items-center justify-center py-2">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-100"></div>
            </div>
            <div className="relative px-3 text-[11px] font-bold uppercase tracking-wider text-gray-400 bg-white/0 select-none">
              Or continue with
            </div>
          </div>

          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading || googleLoading}
            className="w-full flex items-center justify-center gap-2.5 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 py-2.5 rounded-xl font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/10 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200 shadow-sm cursor-pointer"
          >
            {googleLoading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Connecting to Google...
              </span>
            ) : (
              <>
                <svg className="w-4 h-4" viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
                  <g transform="matrix(1, 0, 0, 1, 0, 0)">
                    <path d="M21.35,11.1H12v2.7h5.38c-0.24,1.28 -0.96,2.37 -2.04,3.1v2.58h3.3c1.93,-1.78 3.04,-4.4 3.04,-7.48c0,-0.61 -0.06,-1.2 -0.16,-1.72Z" fill="#4285F4" />
                    <path d="M12,20.6c2.59,0 4.77,-0.86 6.36,-2.32l-3.3,-2.58c-0.91,0.61 -2.08,0.98 -3.06,0.98c-2.36,0 -4.36,-1.59 -5.07,-3.72H3.5v2.66c1.62,3.22 4.96,5.43 8.5,5.43Z" fill="#34A853" />
                    <path d="M6.93,12.96c-0.18,-0.54 -0.28,-1.12 -0.28,-1.71c0,-0.59 0.1,-1.17 0.28,-1.71V6.88H3.5C2.86,8.16 2.5,9.59 2.5,11.1c0,1.51 0.36,2.94 1,4.22l3.43,-2.66Z" fill="#FBBC05" />
                    <path d="M12,6.58c1.41,0 2.68,0.49 3.68,1.44l2.76,-2.76C16.77,3.75 14.59,3.1 12,3.1C8.46,3.1 5.12,5.31 3.5,8.53l3.43,2.66c0.71,-2.13 2.71,-3.72 5.07,-3.72Z" fill="#EA4335" />
                  </g>
                </svg>
                Sign in with Google
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

