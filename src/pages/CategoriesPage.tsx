import { useEffect, useState } from 'react';
import { Tag, Plus, Pencil, Check, X, Trash2, Lock } from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { useCategories } from '../hooks/useCategories';
import type { TransactionType } from '../types';
import { getCategoryColor } from '../utils/categoryColors';

export function CategoriesPage() {
  const {
    loading,
    error,
    fetchCategories,
    addCategory,
    updateCategory,
    deleteCategory,
    getCategoriesByType,
  } = useCategories();

  const [activeTab, setActiveTab] = useState<TransactionType>('expense');
  const [newName, setNewName] = useState('');
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState('');

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const { system: systemCategories, custom: customCategories } = getCategoriesByType(activeTab);

  function switchTab(tab: TransactionType) {
    setActiveTab(tab);
    setAddError('');
    cancelEdit();
  }

  async function handleAdd(e: React.SyntheticEvent) {
    e.preventDefault();
    const name = newName.trim();
    if (!name) return;
    setAddError('');
    setAddLoading(true);
    try {
      await addCategory(activeTab, name);
      setNewName('');
      fetchCategories();
    } catch (err) {
      setAddError(err instanceof Error ? err.message : 'Failed to add category');
    } finally {
      setAddLoading(false);
    }
  }

  async function handleDelete(id: string, name: string) {
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
    setEditError('');
  }

  function cancelEdit() {
    setEditingId(null);
    setEditingName('');
    setEditError('');
  }

  async function handleSaveEdit(id: string) {
    const name = editingName.trim();
    if (!name) return;
    setEditError('');
    setEditLoading(true);
    try {
      await updateCategory(id, name);
      setEditingId(null);
      fetchCategories();
    } catch (err) {
      setEditError(err instanceof Error ? err.message : 'Failed to update category');
    } finally {
      setEditLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Page header */}
        <div className="flex items-center gap-2">
          <Tag className="text-indigo-600" size={22} />
          <h1 className="text-xl font-bold text-gray-900">My Categories</h1>
        </div>

        {/* Main card */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          {/* Expense / Income tabs */}
          <div className="flex border border-gray-200 rounded-lg overflow-hidden mb-5 w-fit">
            {(['expense', 'income'] as TransactionType[]).map((t) => (
              <button
                key={t}
                onClick={() => switchTab(t)}
                className={`px-5 py-1.5 text-sm font-medium transition-colors capitalize ${
                  activeTab === t
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

          {error && (
            <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-4">
              {error}
            </p>
          )}

          {loading ? (
            <div className="space-y-2 mb-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-9 bg-gray-100 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : (
            <>
              {/* System default categories (read-only) */}
              {systemCategories.length > 0 && (
                <div className="mb-5">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2 flex items-center gap-1.5">
                    <Lock size={12} />
                    Default Categories
                  </h3>
                  <div className="space-y-1">
                    {systemCategories.map((c, i) => (
                      <div
                        key={c.id}
                        className="flex items-center gap-3 px-3 py-2 rounded-lg bg-gray-50"
                      >
                        <div
                          className="w-3 h-3 rounded-full flex-shrink-0"
                          style={{ backgroundColor: getCategoryColor(c.name, i) }}
                        />
                        <span className="flex-1 text-sm text-gray-500">{c.name}</span>
                        <span className="text-[10px] text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full font-medium">
                          System
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* User's custom categories (editable) */}
              <div className="mb-4">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
                  My Custom Categories
                </h3>
                <div className="space-y-1.5">
                  {customCategories.length === 0 ? (
                    <p className="text-sm text-gray-400 py-2">
                      No custom categories yet. Add one below!
                    </p>
                  ) : (
                    customCategories.map((c, i) => (
                      <div key={c.id} className="rounded-lg">
                        {editingId === c.id ? (
                          <div className="flex items-center gap-2 px-3 py-2 bg-indigo-50 rounded-lg">
                            <div
                              className="w-3 h-3 rounded-full flex-shrink-0"
                              style={{
                                backgroundColor: getCategoryColor(
                                  c.name,
                                  systemCategories.length + i
                                ),
                              }}
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
                              disabled={editLoading || !editingName.trim()}
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
                              style={{
                                backgroundColor: getCategoryColor(
                                  c.name,
                                  systemCategories.length + i
                                ),
                              }}
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
                              onClick={() => handleDelete(c.id, c.name)}
                              className="text-gray-300 hover:text-red-500 transition-colors"
                              title="Delete category"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        )}
                        {editingId === c.id && editError && (
                          <p className="text-red-600 text-xs px-3 pt-1">{editError}</p>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          )}

          {/* Add category form */}
          <form onSubmit={handleAdd} className="flex gap-2">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder={`New ${activeTab} category…`}
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              maxLength={50}
            />
            <button
              type="submit"
              disabled={addLoading || !newName.trim()}
              className="flex items-center gap-1.5 bg-indigo-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              <Plus size={15} />
              Add
            </button>
          </form>
          {addError && (
            <p className="mt-2 text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {addError}
            </p>
          )}
        </div>
      </main>
    </div>
  );
}
