'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, ShoppingBag, ChevronDown } from 'lucide-react';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const STATUS_OPTIONS = ['all', 'pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'];

const statusStyles: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  processing: 'bg-blue-100 text-blue-700',
  shipped: 'bg-purple-100 text-purple-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
  confirmed: 'bg-indigo-100 text-indigo-700',
  refunded: 'bg-gray-100 text-gray-600',
};

export default function AdminOrdersPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-orders', search, statusFilter, page],
    queryFn: async () => {
      const res = await api.get(`/admin/orders?limit=20&page=${page}${search ? `&search=${search}` : ''}${statusFilter !== 'all' ? `&status=${statusFilter}` : ''}`);
      return res.data.data;
    },
    refetchInterval: 20000,
  });

  const statusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) =>
      api.patch(`/admin/orders/${id}/status`, { status }),
    onSuccess: () => {
      toast.success('Order status updated');
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
    },
    onError: () => toast.error('Failed to update status'),
  });

  const orders = data?.orders || [];
  const totalPages = data?.pages || 1;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Orders</h1>
        <p className="text-sm text-text-secondary mt-0.5">{data?.total || 0} total orders · Auto-refreshes</p>
      </div>

      <div className="bg-white border border-border rounded-xl shadow-sm overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-border flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
            <input
              type="text"
              placeholder="Search order # or customer..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-9 pr-4 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {STATUS_OPTIONS.map(s => (
              <button
                key={s}
                onClick={() => { setStatusFilter(s); setPage(1); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition ${
                  statusFilter === s ? 'bg-primary text-white' : 'bg-gray-100 text-text-secondary hover:bg-gray-200'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-xs text-text-secondary uppercase border-b border-border">
              <tr>
                <th className="px-5 py-3 font-medium">Order #</th>
                <th className="px-5 py-3 font-medium">Customer</th>
                <th className="px-5 py-3 font-medium">Items</th>
                <th className="px-5 py-3 font-medium">Total</th>
                <th className="px-5 py-3 font-medium">Date</th>
                <th className="px-5 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                [...Array(8)].map((_, i) => (
                  <tr key={i}><td colSpan={6} className="px-5 py-4"><div className="h-5 bg-gray-100 rounded animate-pulse" /></td></tr>
                ))
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center">
                    <ShoppingBag className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                    <p className="text-text-secondary">No orders found</p>
                  </td>
                </tr>
              ) : (
                orders.map((order: any) => (
                  <tr key={order._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-4 font-mono font-medium text-blue-600 text-xs">
                      #{order.orderNumber || order._id.slice(-8).toUpperCase()}
                    </td>
                    <td className="px-5 py-4">
                      <p className="font-medium text-text-primary">
                        {order.user ? `${order.user.firstName} ${order.user.lastName}` : order.shippingAddress?.firstName || 'Guest'}
                      </p>
                      <p className="text-xs text-text-secondary">{order.user?.email || '—'}</p>
                    </td>
                    <td className="px-5 py-4 text-text-secondary">{order.items?.length} item{order.items?.length !== 1 ? 's' : ''}</td>
                    <td className="px-5 py-4 font-bold">${order.total?.toFixed(2)}</td>
                    <td className="px-5 py-4 text-text-secondary text-xs">
                      {format(new Date(order.createdAt), 'MMM d, yyyy')}
                    </td>
                    <td className="px-5 py-4">
                      <div className="relative inline-block">
                        <select
                          value={order.orderStatus}
                          onChange={e => statusMutation.mutate({ id: order._id, status: e.target.value })}
                          className={`appearance-none pl-2.5 pr-7 py-1 rounded-full text-xs font-semibold cursor-pointer border-0 focus:ring-2 focus:ring-primary ${statusStyles[order.orderStatus] || 'bg-gray-100 text-gray-600'}`}
                        >
                          {STATUS_OPTIONS.filter(s => s !== 'all').map(s => (
                            <option key={s} value={s} className="bg-white text-text-primary capitalize">{s}</option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 pointer-events-none" />
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-5 py-4 border-t border-border flex items-center justify-between">
          <p className="text-sm text-text-secondary">Page {page} of {totalPages} · {data?.total || 0} orders</p>
          <div className="flex gap-2">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1.5 border border-border rounded-lg text-sm disabled:opacity-40 hover:bg-gray-50">Previous</button>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="px-3 py-1.5 border border-border rounded-lg text-sm disabled:opacity-40 hover:bg-gray-50">Next</button>
          </div>
        </div>
      </div>
    </div>
  );
}
