'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, Users } from 'lucide-react';
import { api } from '@/lib/api';
import { format } from 'date-fns';

export default function AdminCustomersPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-customers', search, page],
    queryFn: async () => {
      const res = await api.get(`/admin/customers?limit=20&page=${page}${search ? `&search=${search}` : ''}`);
      return res.data.data;
    },
  });

  const customers = data?.customers || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Customers</h1>
        <p className="text-sm text-text-secondary mt-0.5">{data?.total || 0} registered customers</p>
      </div>

      <div className="bg-white border border-border rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-border">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
            <input
              type="text"
              placeholder="Search customers..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-9 pr-4 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-xs text-text-secondary uppercase border-b border-border">
              <tr>
                <th className="px-5 py-3 font-medium">Customer</th>
                <th className="px-5 py-3 font-medium">Email</th>
                <th className="px-5 py-3 font-medium">Orders</th>
                <th className="px-5 py-3 font-medium">Total Spent</th>
                <th className="px-5 py-3 font-medium">Verified</th>
                <th className="px-5 py-3 font-medium">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                [...Array(8)].map((_, i) => (
                  <tr key={i}><td colSpan={6} className="px-5 py-4"><div className="h-5 bg-gray-100 rounded animate-pulse" /></td></tr>
                ))
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center">
                    <Users className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                    <p className="text-text-secondary">No customers yet</p>
                  </td>
                </tr>
              ) : (
                customers.map((c: any) => (
                  <tr key={c._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                          {c.firstName?.charAt(0)}{c.lastName?.charAt(0)}
                        </div>
                        <span className="font-medium text-text-primary">{c.firstName} {c.lastName}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-text-secondary">{c.email}</td>
                    <td className="px-5 py-4 font-semibold">{c.orders}</td>
                    <td className="px-5 py-4 font-semibold text-green-600">${(c.totalSpent || 0).toFixed(2)}</td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full ${c.isEmailVerified ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                        {c.isEmailVerified ? 'Verified' : 'Pending'}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-text-secondary text-xs">
                      {format(new Date(c.createdAt), 'MMM d, yyyy')}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="px-5 py-4 border-t border-border flex items-center justify-between">
          <p className="text-sm text-text-secondary">Page {page} of {data?.pages || 1}</p>
          <div className="flex gap-2">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1.5 border border-border rounded-lg text-sm disabled:opacity-40 hover:bg-gray-50">Previous</button>
            <button onClick={() => setPage(p => Math.min(data?.pages || 1, p + 1))} disabled={page >= (data?.pages || 1)} className="px-3 py-1.5 border border-border rounded-lg text-sm disabled:opacity-40 hover:bg-gray-50">Next</button>
          </div>
        </div>
      </div>
    </div>
  );
}
