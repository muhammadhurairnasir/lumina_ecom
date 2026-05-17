'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, Loader2, X, Tags } from 'lucide-react';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';

const emptyForm = { name: '', slug: '', description: '', isActive: true, sortOrder: 0 };

export default function AdminCategoriesPage() {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState<any>(emptyForm);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-categories'],
    queryFn: async () => {
      const res = await api.get('/admin/categories');
      return res.data.data.categories;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (payload: any) => {
      if (editing) return api.put(`/admin/categories/${editing._id}`, payload);
      return api.post('/admin/categories', payload);
    },
    onSuccess: () => {
      toast.success(editing ? 'Category updated' : 'Category created');
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
      setShowModal(false);
      setEditing(null);
      setForm(emptyForm);
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to save'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => api.delete(`/admin/categories/${id}`),
    onSuccess: () => {
      toast.success('Category deleted');
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to delete'),
  });

  const openEdit = (cat: any) => {
    setEditing(cat);
    setForm({ name: cat.name, slug: cat.slug, description: cat.description || '', isActive: cat.isActive, sortOrder: cat.sortOrder || 0 });
    setShowModal(true);
  };

  const handleNameChange = (name: string) => {
    setForm({ ...form, name, slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Categories</h1>
          <p className="text-sm text-text-secondary mt-0.5">{data?.length || 0} categories</p>
        </div>
        <button
          onClick={() => { setEditing(null); setForm(emptyForm); setShowModal(true); }}
          className="flex items-center px-4 py-2 bg-primary text-white font-medium rounded-lg hover:opacity-90 transition shadow-sm gap-1.5"
        >
          <Plus className="w-4 h-4" /> New Category
        </button>
      </div>

      <div className="bg-white border border-border rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-xs text-text-secondary uppercase border-b border-border">
              <tr>
                <th className="px-5 py-3 font-medium">Name</th>
                <th className="px-5 py-3 font-medium">Slug</th>
                <th className="px-5 py-3 font-medium">Products</th>
                <th className="px-5 py-3 font-medium">Order</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                [...Array(4)].map((_, i) => (
                  <tr key={i}><td colSpan={6} className="px-5 py-4"><div className="h-5 bg-gray-100 rounded animate-pulse" /></td></tr>
                ))
              ) : (data || []).map((cat: any) => (
                <tr key={cat._id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Tags className="w-4 h-4 text-primary" />
                      </div>
                      <span className="font-medium text-text-primary">{cat.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4 font-mono text-xs text-text-secondary">{cat.slug}</td>
                  <td className="px-5 py-4 font-semibold">{cat.productCount}</td>
                  <td className="px-5 py-4 text-text-secondary">{cat.sortOrder}</td>
                  <td className="px-5 py-4">
                    <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full ${cat.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {cat.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => openEdit(cat)} className="p-1.5 text-text-secondary hover:text-primary hover:bg-blue-50 rounded-lg transition">
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => { if (confirm(`Delete "${cat.name}"? This will fail if products exist.`)) deleteMutation.mutate(cat._id); }}
                        className="p-1.5 text-text-secondary hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl">
            <div className="p-6 border-b border-border flex items-center justify-between">
              <h2 className="text-lg font-bold text-text-primary">{editing ? 'Edit Category' : 'New Category'}</h2>
              <button onClick={() => setShowModal(false)}><X className="w-5 h-5 text-text-secondary" /></button>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); saveMutation.mutate(form); }} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">Name *</label>
                <input value={form.name} onChange={e => handleNameChange(e.target.value)} placeholder="Electronics" required
                  className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
              </div>
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">Slug</label>
                <input value={form.slug} onChange={e => setForm({ ...form, slug: e.target.value })} placeholder="electronics"
                  className="w-full border border-border rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary" />
              </div>
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">Description</label>
                <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={2} placeholder="Category description..."
                  className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none" />
              </div>
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">Sort Order</label>
                <input type="number" value={form.sortOrder} onChange={e => setForm({ ...form, sortOrder: parseInt(e.target.value) })}
                  className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.isActive} onChange={e => setForm({ ...form, isActive: e.target.checked })} className="rounded" />
                <span className="text-sm text-text-secondary">Active</span>
              </label>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border border-border rounded-lg text-sm hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={saveMutation.isPending} className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-60 flex items-center gap-2">
                  {saveMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editing ? 'Save' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
