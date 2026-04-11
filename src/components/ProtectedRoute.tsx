import { Navigate, Outlet } from 'react-router-dom';
import { Wallet } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export function ProtectedRoute() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Navbar skeleton */}
        <nav className="bg-white border-b border-gray-200 sticky top-0 z-10">
          <div className="max-w-6xl mx-auto px-4">
            <div className="flex items-center justify-between h-14">
              <div className="flex items-center gap-2 font-bold text-indigo-700 text-lg">
                <Wallet size={20} />
                CashFlow
              </div>
              <div className="hidden sm:flex items-center gap-3">
                <div className="h-4 w-20 bg-gray-100 rounded animate-pulse" />
                <div className="h-4 w-24 bg-gray-100 rounded animate-pulse" />
              </div>
              <div className="h-4 w-16 bg-gray-100 rounded animate-pulse" />
            </div>
          </div>
        </nav>
        {/* Page skeleton */}
        <main className="max-w-6xl mx-auto px-4 py-6 space-y-4">
          <div className="h-6 w-32 bg-gray-200 rounded animate-pulse" />
          <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-10 bg-gray-100 rounded-lg animate-pulse" />
            ))}
          </div>
        </main>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
