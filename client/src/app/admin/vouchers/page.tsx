'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, Loader2, X } from 'lucide-react';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const emptyForm = {
  code: '', type: 'percentage', value: '', minOrderAmount: '',
  maxDiscount: '', usageLimit: '', startDate: '', endDate: '', isActive: true,
};

export default function AdminVouchersPage() {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState<any>(emptyForm);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-vouchers'],
    queryFn: async () => {
      const res = await api.get('/admin/vouchers');
      return res.data.data.vouchers;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (payload: any) => {
      if (editing) return api.put(`/admin/vouchers/${editing._id}`, payload);
      return api.post('/admin/vouchers', payload);
    },
    onSuccess: () => {
      toast.success(editing ? 'Voucher updated' : 'Voucher created');
      queryClient.invalidateQueries({ queryKey: ['admin-vouchers'] });
      setShowModal(false);
      setEditing(null);
      setForm(emptyForm);
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to save voucher'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => api.delete(`/admin/vouchers/${id}`),
    onSuccess: () => {
      toast.success('Voucher deleted');
      queryClient.invalidateQueries({ queryKey: ['admin-vouchers'] });
    },
    onError: () => toast.error('Failed to delete'),
  });

  const openEdit = (v: any) => {
    setEditing(v);
    setForm({
      code: v.code, type: v.type, value: v.value, minOrderAmount: v.minOrderAmount || '',
      maxDiscount: v.maxDiscount || '', usageLimit: v.usageLimit || '',
      startDate: v.startDate ? v.startDate.split('T')[0] : '',
      endDate: v.endDate ? v.endDate.split('T')[0] : '',
      isActive: v.isActive,
    });
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload: any = {
      code: form.code.toUpperCase(),
      type: form.type,
      value: parseFloat(form.value),
      minOrderAmount: parseFloat(form.minOrderAmount) || 0,
      isActive: form.isActive,
      startDate: form.startDate || new Date().toISOString(),
      endDate: form.endDate,
    };
    if (form.maxDiscount) payload.maxDiscount = parseFloat(form.maxDiscount);
    if (form.usageLimit) payload.usageLimit = parseInt(form.usageLimit);
    saveMutation.mutate(payload);
  };

  const typeLabel = (v: any) => {
    if (v.type === 'percentage') return `${v.value}% off`;
    if (v.type === 'fixed') return `$${v.value} off`;
    return 'Free Shipping';
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Vouchers</h1>
          <p className="text-sm text-text-secondary mt-0.5">{data?.length || 0} voucher codes</p>
        </div>
        <button
          onClick={() => { setEditing(null); setForm(emptyForm); setShowModal(true); }}
          className="flex items-center px-4 py-2 bg-primary text-white font-medium rounded-lg hover:opacity-90 transition shadow-sm gap-1.5"
        >
          <Plus className="w-4 h-4" /> New Voucher
        </button>
      </div>

      <div className="bg-white border border-border rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-xs text-text-secondary uppercase border-b border-border">
              <tr>
                <th className="px-5 py-3 font-medium">Code</th>
                <th className="px-5 py-3 font-medium">Discount</th>
                <th className="px-5 py-3 font-medium">Min Order</th>
                <th className="px-5 py-3 font-medium">Used / Limit</th>
                <th className="px-5 py-3 font-medium">Expires</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                [...Array(4)].map((_, i) => (
                  <tr key={i}><td colSpan={7} className="px-5 py-4"><div className="h-5 bg-gray-100 rounded animate-pulse" /></td></tr>
                ))
              ) : (data || []).map((v: any) => (
                <tr key={v._id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-4">
                    <span className="font-mono font-bold text-text-primary bg-gray-100 px-2 py-0.5 rounded">{v.code}</span>
                  </td>
                  <td className="px-5 py-4 font-semibold text-green-600">{typeLabel(v)}</td>
                  <td className="px-5 py-4 text-text-secondary">{v.minOrderAmount > 0 ? `$${v.minOrderAmount}` : '—'}</td>
                  <td className="px-5 py-4 text-text-secondary">{v.usedCount} / {v.usageLimit || '∞'}</td>
                  <td className="px-5 py-4 text-text-secondary text-xs">{v.endDate ? format(new Date(v.endDate), 'MMM d, yyyy') : '—'}</td>
                  <td className="px-5 py-4">
                    <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full ${v.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {v.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => openEdit(v)} className="p-1.5 text-text-secondary hover:text-primary hover:bg-blue-50 rounded-lg transition">
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => { if (confirm(`Delete voucher ${v.code}?`)) deleteMutation.mutate(v._id); }}
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

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl">
            <div className="p-6 border-b border-border flex items-center justify-between">
              <h2 className="text-lg font-bold text-text-primary">{editing ? 'Edit Voucher' : 'Create Voucher'}</h2>
              <button onClick={() => setShowModal(false)} className="text-text-secondary hover:text-text-primary"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1">Code *</label>
                  <input
                    value={form.code} onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })}
                    placeholder="SUMMER20" required
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm font-mono uppercase focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1">Type *</label>
                  <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary">
                    <option value="percentage">Percentage %</option>
                    <option value="fixed">Fixed $ Amount</option>
                    <option value="free_shipping">Free Shipping</option>
                  </select>
                </div>
                {form.type !== 'free_shipping' && (
                  <div>
                    <label className="block text-xs font-medium text-text-secondary mb-1">Value *</label>
                    <input type="number" min="0" value={form.value} onChange={e => setForm({ ...form, value: e.target.value })}
                      placeholder={form.type === 'percentage' ? '10' : '20'} required
                      className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                  </div>
                )}
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1">Min Order ($)</label>
                  <input type="number" min="0" value={form.minOrderAmount} onChange={e => setForm({ ...form, minOrderAmount: e.target.value })}
                    placeholder="0"
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1">Usage Limit</label>
                  <input type="number" min="1" value={form.usageLimit} onChange={e => setForm({ ...form, usageLimit: e.target.value })}
                    placeholder="Unlimited"
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1">Start Date</label>
                  <input type="date" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })}
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1">End Date *</label>
                  <input type="date" value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })} required
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                </div>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.isActive} onChange={e => setForm({ ...form, isActive: e.target.checked })} className="rounded" />
                <span className="text-sm text-text-secondary">Active</span>
              </label>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border border-border rounded-lg text-sm hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={saveMutation.isPending} className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-60 flex items-center gap-2">
                  {saveMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editing ? 'Save Changes' : 'Create Voucher'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
