import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, List, ShieldCheck, LogOut, Menu, X, Wallet, Tag } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export function Navbar() {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  async function handleSignOut() {
    await signOut();
    navigate('/login');
  }

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
      isActive
        ? 'bg-indigo-100 text-indigo-700'
        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
    }`;

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-10">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <div className="flex items-center gap-2 font-bold text-indigo-700 text-lg">
            <Wallet size={20} />
            CashFlow
          </div>

          {/* Desktop nav */}
          <div className="hidden sm:flex items-center gap-1">
            <NavLink to="/" end className={linkClass}>
              <LayoutDashboard size={16} />
              Dashboard
            </NavLink>
            <NavLink to="/transactions" className={linkClass}>
              <List size={16} />
              Transactions
            </NavLink>
            <NavLink to="/categories" className={linkClass}>
              <Tag size={16} />
              Categories
            </NavLink>
            {profile?.role === 'admin' && (
              <NavLink to="/admin" className={linkClass}>
                <ShieldCheck size={16} />
                Admin
              </NavLink>
            )}
          </div>

          {/* User info + logout */}
          <div className="hidden sm:flex items-center gap-3">
            {profile && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-700 font-medium">{profile.full_name}</span>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    profile.role === 'admin'
                      ? 'bg-purple-100 text-purple-700'
                      : 'bg-blue-100 text-blue-700'
                  }`}
                >
                  {profile.role}
                </span>
              </div>
            )}
            <button
              onClick={handleSignOut}
              className="flex items-center gap-1 text-sm text-gray-500 hover:text-red-600 transition-colors"
            >
              <LogOut size={16} />
              Logout
            </button>
          </div>

          {/* Mobile hamburger */}
          <button
            className="sm:hidden p-2 rounded-md text-gray-500 hover:bg-gray-100"
            onClick={() => setMenuOpen((o) => !o)}
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="sm:hidden pb-3 space-y-1">
            <NavLink to="/" end className={linkClass} onClick={() => setMenuOpen(false)}>
              <LayoutDashboard size={16} />
              Dashboard
            </NavLink>
            <NavLink
              to="/transactions"
              className={linkClass}
              onClick={() => setMenuOpen(false)}
            >
              <List size={16} />
              Transactions
            </NavLink>
            <NavLink
              to="/categories"
              className={linkClass}
              onClick={() => setMenuOpen(false)}
            >
              <Tag size={16} />
              Categories
            </NavLink>
            {profile?.role === 'admin' && (
              <NavLink
                to="/admin"
                className={linkClass}
                onClick={() => setMenuOpen(false)}
              >
                <ShieldCheck size={16} />
                Admin
              </NavLink>
            )}
            <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
              {profile && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-700 font-medium">{profile.full_name}</span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      profile.role === 'admin'
                        ? 'bg-purple-100 text-purple-700'
                        : 'bg-blue-100 text-blue-700'
                    }`}
                  >
                    {profile.role}
                  </span>
                </div>
              )}
              <button
                onClick={handleSignOut}
                className="flex items-center gap-1 text-sm text-red-500"
              >
                <LogOut size={16} />
                Logout
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
