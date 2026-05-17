'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, ShoppingBag, ChevronDown, ChevronUp, Package } from 'lucide-react';
import Image from 'next/image';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const STATUS_OPTIONS = ['all', 'pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'];

const statusStyles: Record<string, string> = {
  pending:    'bg-yellow-100 text-yellow-700',
  processing: 'bg-blue-100 text-blue-700',
  shipped:    'bg-purple-100 text-purple-700',
  delivered:  'bg-green-100 text-green-700',
  cancelled:  'bg-red-100 text-red-700',
  confirmed:  'bg-indigo-100 text-indigo-700',
  refunded:   'bg-gray-100 text-gray-600',
};

export default function AdminOrdersPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

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

  const toggleExpand = (orderId: string) => {
    setExpandedOrderId(prev => prev === orderId ? null : orderId);
  };

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
                <th className="px-5 py-3 font-medium w-8"></th>
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
                  <tr key={i}><td colSpan={7} className="px-5 py-4"><div className="h-5 bg-gray-100 rounded animate-pulse" /></td></tr>
                ))
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center">
                    <ShoppingBag className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                    <p className="text-text-secondary">No orders found</p>
                  </td>
                </tr>
              ) : (
                orders.map((order: any) => {
                  const isExpanded = expandedOrderId === order._id;
                  return (
                    <>
                      {/* Main Row */}
                      <tr
                        key={order._id}
                        onClick={() => toggleExpand(order._id)}
                        className="hover:bg-gray-50 transition-colors cursor-pointer select-none"
                      >
                        <td className="pl-5 py-4">
                          {isExpanded
                            ? <ChevronUp className="w-4 h-4 text-primary" />
                            : <ChevronDown className="w-4 h-4 text-text-secondary" />
                          }
                        </td>
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
                        <td className="px-5 py-4" onClick={e => e.stopPropagation()}>
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

                      {/* Expanded Row */}
                      {isExpanded && (
                        <tr key={`${order._id}-expanded`} className="bg-blue-50/40">
                          <td colSpan={7} className="px-6 pb-5 pt-2">
                            <div className="rounded-xl border border-blue-100 bg-white shadow-sm overflow-hidden">
                              {/* Header */}
                              <div className="px-5 py-3 bg-gray-50 border-b border-border flex items-center justify-between">
                                <span className="text-xs font-bold text-text-secondary uppercase tracking-wider flex items-center gap-1.5">
                                  <Package className="w-3.5 h-3.5" /> Order Items
                                </span>
                                <div className="flex items-center gap-4 text-xs text-text-secondary">
                                  {order.discount > 0 && (
                                    <span className="text-emerald-600 font-semibold">
                                      Voucher Discount: -${order.discount?.toFixed(2)}
                                    </span>
                                  )}
                                  <span>Subtotal: <strong>${order.subtotal?.toFixed(2)}</strong></span>
                                  <span>Tax: <strong>${order.tax?.toFixed(2)}</strong></span>
                                  <span>Shipping: <strong>{order.shippingFee === 0 ? 'Free' : `$${order.shippingFee?.toFixed(2)}`}</strong></span>
                                  <span className="text-primary font-bold text-sm">Total: ${order.total?.toFixed(2)}</span>
                                </div>
                              </div>

                              {/* Items */}
                              <div className="divide-y divide-border">
                                {order.items?.map((item: any, idx: number) => (
                                  <div key={idx} className="flex items-center gap-4 px-5 py-3">
                                    {/* Thumbnail */}
                                    <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0 relative border border-border">
                                      {item.image ? (
                                        <Image src={item.image} alt={item.name} fill className="object-cover" />
                                      ) : (
                                        <Package className="w-5 h-5 text-gray-300 m-auto mt-3" />
                                      )}
                                    </div>

                                    {/* Name / Variant */}
                                    <div className="flex-1 min-w-0">
                                      <p className="font-medium text-text-primary text-sm truncate">{item.name}</p>
                                      {item.variant && (
                                        <p className="text-xs text-text-secondary mt-0.5">Variant: {item.variant}</p>
                                      )}
                                    </div>

                                    {/* Qty */}
                                    <div className="text-center w-20">
                                      <p className="text-xs text-text-secondary">Qty</p>
                                      <p className="font-semibold text-sm">{item.quantity}</p>
                                    </div>

                                    {/* Unit Price */}
                                    <div className="text-center w-24">
                                      <p className="text-xs text-text-secondary">Unit Price</p>
                                      <p className="font-semibold text-sm">${item.price?.toFixed(2)}</p>
                                    </div>

                                    {/* Line Total */}
                                    <div className="text-right w-24">
                                      <p className="text-xs text-text-secondary">Line Total</p>
                                      <p className="font-bold text-sm text-primary">${(item.price * item.quantity)?.toFixed(2)}</p>
                                    </div>
                                  </div>
                                ))}
                              </div>

                              {/* Shipping Address */}
                              {order.shippingAddress && (
                                <div className="px-5 py-3 bg-gray-50 border-t border-border">
                                  <p className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-1">Shipping Address</p>
                                  <p className="text-sm text-text-primary">
                                    {order.shippingAddress.street}, {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zip}, {order.shippingAddress.country}
                                  </p>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })
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
