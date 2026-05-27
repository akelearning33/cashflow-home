import { useEffect, useState } from 'react';
import { UserPlus, Trash2, ToggleLeft, ToggleRight, ShieldCheck, Tag, Plus, Pencil, Check, X } from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { useAdmin } from '../hooks/useAdmin';
import { useCategories } from '../hooks/useCategories';
import type { UserRole, TransactionType } from '../types';
import { formatDate } from '../utils/formatDate';
import { getCategoryColor } from '../utils/categoryColors';
import { useAuth } from '../hooks/useAuth';

export function AdminPage() {
  const { user: currentUser } = useAuth();
  const { users, loading, error, fetchUsers, updateUserRole, toggleUserActive, deleteUser, inviteUser } =
    useAdmin();
  const { categories, loading: catLoading, error: catError, fetchCategories, addSystemCategory, updateCategory, deleteCategory } =
    useCategories();

  // Invite form state
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>('member');
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState('');
  const [inviteSuccess, setInviteSuccess] = useState('');

  // User action loading guards
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
  const [updatingRoleId, setUpdatingRoleId] = useState<string | null>(null);
  const [userActionError, setUserActionError] = useState('');
  const [userActionSuccess, setUserActionSuccess] = useState('');

  // Category state
  const [catTab, setCatTab] = useState<TransactionType>('expense');
  const [newCatName, setNewCatName] = useState('');
  const [addCatLoading, setAddCatLoading] = useState(false);
  const [addCatError, setAddCatError] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [editCatLoading, setEditCatLoading] = useState(false);
  const [editCatError, setEditCatError] = useState('');

  useEffect(() => { fetchUsers(); }, [fetchUsers]);
  useEffect(() => { fetchCategories(); }, [fetchCategories]);

  async function handleInvite(e: React.SyntheticEvent) {
    e.preventDefault();
    const trimmedFullName = fullName.trim();
    const normalizedEmail = email.trim().toLowerCase();
    if (!trimmedFullName || !normalizedEmail) return;

    setInviteError('');
    setInviteSuccess('');
    setInviteLoading(true);
    try {
      await inviteUser({ full_name: trimmedFullName, email: normalizedEmail, role });
      setInviteSuccess(`Invitation sent to ${normalizedEmail}`);
      setFullName('');
      setEmail('');
      setRole('member');
      await fetchUsers();
    } catch (err) {
      setInviteError(err instanceof Error ? err.message : 'Failed to invite user');
    } finally {
      setInviteLoading(false);
    }
  }

  async function handleRoleChange(id: string, newRole: UserRole) {
    if (updatingRoleId) return;
    if (id === currentUser?.id) { alert("You can't change your own role."); return; }
    setUserActionError('');
    setUserActionSuccess('');
    setUpdatingRoleId(id);
    try {
      await updateUserRole(id, newRole);
      await fetchUsers();
    } catch (err) {
      setUserActionError(err instanceof Error ? err.message : 'Failed to update role');
    } finally {
      setUpdatingRoleId(null);
    }
  }

  async function handleToggleActive(id: string, current: boolean) {
    if (togglingId) return;
    setUserActionError('');
    setUserActionSuccess('');
    setTogglingId(id);
    try {
      await toggleUserActive(id, !current);
      await fetchUsers();
    } catch (err) {
      setUserActionError(err instanceof Error ? err.message : 'Failed to toggle status');
    } finally {
      setTogglingId(null);
    }
  }

  async function handleDeleteUser(id: string, name: string, userEmail: string) {
    if (deletingUserId) return;
    if (id === currentUser?.id) { alert("You can't delete your own account."); return; }
    const displayName = name || userEmail;
    if (!window.confirm(`Delete user "${displayName}"? This cannot be undone.`)) return;
    setUserActionError('');
    setUserActionSuccess('');
    setDeletingUserId(id);
    try {
      await deleteUser(id);
      await fetchUsers();
      setUserActionSuccess(`Deleted ${displayName}`);
    } catch (err) {
      setUserActionError(err instanceof Error ? err.message : 'Failed to delete user');
    } finally {
      setDeletingUserId(null);
    }
  }

  async function handleAddCategory(e: React.SyntheticEvent) {
    e.preventDefault();
    const name = newCatName.trim();
    if (!name) return;
    setAddCatError('');
    setAddCatLoading(true);
    try {
      await addSystemCategory(catTab, name);
      setNewCatName('');
      fetchCategories();
    } catch (err) {
      setAddCatError(err instanceof Error ? err.message : 'Failed to add category');
    } finally {
      setAddCatLoading(false);
    }
  }

  async function handleDeleteCategory(id: string, name: string) {
    if (!window.confirm(`Delete category "${name}"?`)) return;
    try {
      await deleteCategory(id);
      if (editingId === id) setEditingId(null);
      fetchCategories();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete category');
    }
  }

  function startEdit(id: string, name: string) {
    setEditingId(id);
    setEditingName(name);
    setEditCatError('');
  }

  function cancelEdit() {
    setEditingId(null);
    setEditingName('');
    setEditCatError('');
  }

  async function handleSaveEdit(id: string) {
    const name = editingName.trim();
    if (!name) return;
    setEditCatError('');
    setEditCatLoading(true);
    try {
      await updateCategory(id, name);
      setEditingId(null);
      fetchCategories();
    } catch (err) {
      setEditCatError(err instanceof Error ? err.message : 'Failed to update category');
    } finally {
      setEditCatLoading(false);
    }
  }

  const visibleCategories = categories.filter((c) => c.type === catTab && c.user_id === null);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        <div className="flex items-center gap-2">
          <ShieldCheck className="text-indigo-600" size={22} />
          <h1 className="text-xl font-bold text-gray-900">Admin</h1>
        </div>

        {/* Invite user form */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <div className="flex items-center gap-2 mb-4">
            <UserPlus size={18} className="text-indigo-600" />
            <h2 className="text-sm font-semibold text-gray-700">Invite User</h2>
          </div>
          <form onSubmit={handleInvite} className="flex flex-wrap gap-3 items-end">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Full Name</label>
              <input
                required
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-44 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Jane Doe"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Email</label>
              <input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-52 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="jane@example.com"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="member">Member</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <button
              type="submit"
              disabled={inviteLoading || !fullName.trim() || !email.trim()}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-60 transition-colors"
            >
              {inviteLoading ? 'Sending…' : 'Send Invite'}
            </button>
          </form>
          {inviteError && (
            <p className="mt-3 text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {inviteError}
            </p>
          )}
          {inviteSuccess && (
            <p className="mt-3 text-green-600 text-sm bg-green-50 border border-green-200 rounded-lg px-3 py-2">
              {inviteSuccess}
            </p>
          )}
        </div>

        {/* User table */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          {error && (
            <p className="text-red-600 text-sm px-4 py-3 border-b border-red-100 bg-red-50">
              {error}
            </p>
          )}
          {userActionError && (
            <p className="text-red-600 text-sm px-4 py-3 border-b border-red-100 bg-red-50">
              {userActionError}
            </p>
          )}
          {userActionSuccess && (
            <p className="text-green-600 text-sm px-4 py-3 border-b border-green-100 bg-green-50">
              {userActionSuccess}
            </p>
          )}
          {loading ? (
            <div className="p-4 space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-10 bg-gray-100 rounded animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Name</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Email</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Role</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Joined</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-gray-400">
                        No users found
                      </td>
                    </tr>
                  ) : (
                    users.map((user) => (
                      <tr key={user.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 font-medium text-gray-800">{user.full_name}</td>
                        <td className="px-4 py-3 text-gray-600">{user.email}</td>
                        <td className="px-4 py-3">
                          <select
                            value={user.role}
                            onChange={(e) => handleRoleChange(user.id, e.target.value as UserRole)}
                            disabled={updatingRoleId === user.id}
                            className="border border-gray-200 rounded px-2 py-1 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-50"
                          >
                            <option value="member">Member</option>
                            <option value="admin">Admin</option>
                          </select>
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => handleToggleActive(user.id, user.is_active)}
                            disabled={togglingId === user.id}
                            className={`flex items-center gap-1 text-xs font-medium disabled:opacity-50 ${
                              user.is_active ? 'text-green-600' : 'text-gray-400'
                            }`}
                          >
                            {user.is_active ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                            {user.is_active ? 'Active' : 'Inactive'}
                          </button>
                        </td>
                        <td className="px-4 py-3 text-gray-500">{formatDate(user.created_at)}</td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => handleDeleteUser(user.id, user.full_name, user.email)}
                            disabled={deletingUserId === user.id || user.id === currentUser?.id}
                            className="text-gray-300 hover:text-red-500 transition-colors disabled:opacity-40 disabled:hover:text-gray-300"
                            title="Delete user"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Categories management */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Tag size={18} className="text-indigo-600" />
            <h2 className="text-sm font-semibold text-gray-700">System Default Categories</h2>
          </div>

          {/* Expense / Income tabs */}
          <div className="flex border border-gray-200 rounded-lg overflow-hidden mb-4 w-fit">
            {(['expense', 'income'] as TransactionType[]).map((t) => (
              <button
                key={t}
                onClick={() => { setCatTab(t); setAddCatError(''); cancelEdit(); }}
                className={`px-5 py-1.5 text-sm font-medium transition-colors capitalize ${
                  catTab === t
                    ? t === 'expense'
                      ? 'bg-red-500 text-white'
                      : 'bg-green-500 text-white'
                    : 'bg-white text-gray-500 hover:bg-gray-50'
                }`}
              >
                {t === 'expense' ? 'Expense' : 'Income'}
              </button>
            ))}
          </div>

          {catError && (
            <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-3">
              {catError}
            </p>
          )}

          {/* Category list */}
          {catLoading ? (
            <div className="space-y-2 mb-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-9 bg-gray-100 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="space-y-1.5 mb-4">
              {visibleCategories.length === 0 ? (
                <p className="text-sm text-gray-400 py-2">No categories yet.</p>
              ) : (
                visibleCategories.map((c, i) => (
                  <div key={c.id} className="rounded-lg">
                    {editingId === c.id ? (
                      <div className="flex items-center gap-2 px-3 py-2 bg-indigo-50 rounded-lg">
                        <div
                          className="w-3 h-3 rounded-full flex-shrink-0"
                          style={{ backgroundColor: getCategoryColor(c.name, i) }}
                        />
                        <input
                          autoFocus
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveEdit(c.id);
                            if (e.key === 'Escape') cancelEdit();
                          }}
                          className="flex-1 border border-indigo-300 rounded px-2 py-0.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          maxLength={50}
                        />
                        <button
                          onClick={() => handleSaveEdit(c.id)}
                          disabled={editCatLoading || !editingName.trim()}
                          className="text-indigo-600 hover:text-indigo-800 disabled:opacity-40 transition-colors"
                          title="Save"
                        >
                          <Check size={15} />
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="text-gray-400 hover:text-gray-600 transition-colors"
                          title="Cancel"
                        >
                          <X size={15} />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 group">
                        <div
                          className="w-3 h-3 rounded-full flex-shrink-0"
                          style={{ backgroundColor: getCategoryColor(c.name, i) }}
                        />
                        <span className="flex-1 text-sm text-gray-700">{c.name}</span>
                        <button
                          onClick={() => startEdit(c.id, c.name)}
                          className="text-gray-300 hover:text-indigo-500 transition-colors"
                          title="Edit category"
                        >
                          <Pencil size={13} />
                        </button>
                        <button
                          onClick={() => handleDeleteCategory(c.id, c.name)}
                          className="text-gray-300 hover:text-red-500 transition-colors"
                          title="Delete category"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    )}
                    {editingId === c.id && editCatError && (
                      <p className="text-red-600 text-xs px-3 pt-1">{editCatError}</p>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {/* Add category form */}
          <form onSubmit={handleAddCategory} className="flex gap-2">
            <input
              type="text"
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
              placeholder={`New ${catTab} category…`}
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              maxLength={50}
            />
            <button
              type="submit"
              disabled={addCatLoading || !newCatName.trim()}
              className="flex items-center gap-1.5 bg-indigo-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              <Plus size={15} />
              Add
            </button>
          </form>
          {addCatError && (
            <p className="mt-2 text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {addCatError}
            </p>
          )}
        </div>
      </main>
    </div>
  );
}
