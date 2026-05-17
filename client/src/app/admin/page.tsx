'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar
} from 'recharts';
import { DollarSign, ShoppingCart, Package, Users, AlertTriangle, TrendingUp, TrendingDown, ArrowUpRight, Sparkles } from 'lucide-react';
import { api } from '@/lib/api';
import { format } from 'date-fns';

const COLORS = ['#F59E0B', '#3B82F6', '#8B5CF6', '#10B981', '#EF4444'];

const StatCard = ({ title, value, icon: Icon, color, growth }: any) => (
  <div className="bg-white p-6 rounded-xl border border-border shadow-sm">
    <div className="flex items-center justify-between mb-4">
      <p className="text-sm font-medium text-text-secondary">{title}</p>
      <div className={`p-2 rounded-lg ${color}`}><Icon className="w-5 h-5" /></div>
    </div>
    <h3 className="text-2xl font-bold text-text-primary">{value}</h3>
    {growth !== undefined && growth !== null && (
      <p className={`text-xs mt-1 flex items-center gap-1 ${parseFloat(growth) >= 0 ? 'text-green-600' : 'text-red-500'}`}>
        {parseFloat(growth) >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
        {Math.abs(parseFloat(growth))}% vs last month
      </p>
    )}
  </div>
);

export default function AdminDashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const res = await api.get('/admin/stats');
      return res.data.data;
    },
    refetchInterval: 30000, // Refresh every 30 seconds for real-time feel
  });

  const { data: recentOrders } = useQuery({
    queryKey: ['admin-recent-orders'],
    queryFn: async () => {
      const res = await api.get('/admin/orders?limit=8');
      return res.data.data.orders;
    },
    refetchInterval: 15000,
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white p-6 rounded-xl border border-border animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-24 mb-4" />
              <div className="h-8 bg-gray-200 rounded w-32" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const statusColorMap: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-700',
    processing: 'bg-blue-100 text-blue-700',
    shipped: 'bg-purple-100 text-purple-700',
    delivered: 'bg-green-100 text-green-700',
    cancelled: 'bg-red-100 text-red-700',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-text-primary">Dashboard</h1>
        <span className="text-xs text-text-secondary bg-gray-100 px-3 py-1.5 rounded-full">
          Auto-refreshes every 30s
        </span>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Revenue"
          value={`$${(stats?.revenue?.total || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          icon={DollarSign}
          color="bg-blue-50 text-blue-600"
          growth={stats?.revenue?.growth}
        />
        <StatCard
          title="Total Orders"
          value={(stats?.orders?.total || 0).toLocaleString()}
          icon={ShoppingCart}
          color="bg-green-50 text-green-600"
        />
        <StatCard
          title="Active Products"
          value={(stats?.products?.total || 0).toLocaleString()}
          icon={Package}
          color="bg-purple-50 text-purple-600"
        />
        <StatCard
          title="Customers"
          value={(stats?.customers?.total || 0).toLocaleString()}
          icon={Users}
          color="bg-orange-50 text-orange-600"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Line Chart */}
        <div className="bg-white p-6 rounded-xl border border-border shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-base font-bold text-text-primary">Revenue (Last 14 Days)</h3>
            <span className="text-sm font-semibold text-blue-600">
              ${(stats?.revenue?.thisMonth || 0).toFixed(2)} this month
            </span>
          </div>
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stats?.charts?.revenueByDay || []}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 11 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 11 }} tickFormatter={v => `$${v}`} />
                <RechartsTooltip contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.15)' }} formatter={(v: any) => [`$${v.toFixed(2)}`, 'Revenue']} />
                <Line type="monotone" dataKey="total" stroke="#3B82F6" strokeWidth={2.5} dot={{ r: 3, fill: '#3B82F6', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Orders by Status Pie */}
        <div className="bg-white p-6 rounded-xl border border-border shadow-sm">
          <h3 className="text-base font-bold text-text-primary mb-6">Orders by Status</h3>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats?.charts?.ordersByStatus || []}
                  cx="50%" cy="50%"
                  innerRadius={55} outerRadius={80}
                  paddingAngle={4} dataKey="value"
                >
                  {(stats?.charts?.ordersByStatus || []).map((_: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            {(stats?.charts?.ordersByStatus || []).map((entry: any, i: number) => (
              <div key={entry.name} className="flex items-center gap-1.5 text-xs text-text-secondary">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                {entry.name} ({entry.value})
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Recent Orders */}
        <div className="bg-white rounded-xl border border-border shadow-sm lg:col-span-2 overflow-hidden">
          <div className="p-5 border-b border-border flex justify-between items-center">
            <h3 className="font-bold text-text-primary">Recent Orders</h3>
            <Link href="/admin/orders" className="text-sm text-blue-600 hover:underline flex items-center gap-1">
              View all <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs text-text-secondary uppercase border-b border-border">
                <tr>
                  <th className="px-5 py-3 text-left font-medium">Order</th>
                  <th className="px-5 py-3 text-left font-medium">Customer</th>
                  <th className="px-5 py-3 text-left font-medium">Total</th>
                  <th className="px-5 py-3 text-left font-medium">Status</th>
                  <th className="px-5 py-3 text-left font-medium">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {(recentOrders || []).length === 0 ? (
                  <tr><td colSpan={5} className="px-5 py-8 text-center text-text-secondary text-sm">No orders yet</td></tr>
                ) : (
                  (recentOrders || []).map((order: any) => (
                    <tr key={order._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-3.5 font-medium text-blue-600">
                        <Link href={`/admin/orders/${order.orderNumber || order._id}`}>#{order.orderNumber || order._id.slice(-6)}</Link>
                      </td>
                      <td className="px-5 py-3.5 text-text-secondary">
                        {order.user ? `${order.user.firstName} ${order.user.lastName}` : order.shippingAddress?.firstName || 'Guest'}
                      </td>
                      <td className="px-5 py-3.5 font-semibold">${order.total?.toFixed(2)}</td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${statusColorMap[order.orderStatus] || 'bg-gray-100 text-gray-600'}`}>
                          {order.orderStatus}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-text-secondary text-xs">
                        {format(new Date(order.createdAt), 'MMM d, h:mm a')}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Low Stock + Quick Stats */}
        <div className="space-y-6">
          {/* Low Stock */}
          {stats?.products?.lowStock > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <h4 className="font-semibold text-amber-800 text-sm">{stats.products.lowStock} Low Stock Items</h4>
              </div>
              <Link href="/admin/products?filter=lowstock" className="text-xs text-amber-700 font-medium hover:underline">
                Review inventory →
              </Link>
            </div>
          )}

          {/* Top Products */}
          <div className="bg-white border border-border rounded-xl shadow-sm overflow-hidden">
            <div className="p-5 border-b border-border">
              <h3 className="font-bold text-text-primary text-sm">Top Products by Revenue</h3>
            </div>
            <div className="p-5 space-y-3">
              {(stats?.topProducts || []).length === 0 ? (
                <p className="text-text-secondary text-sm text-center py-4">No sales data yet</p>
              ) : (
                (stats?.topProducts || []).map((p: any, i: number) => (
                  <div key={p._id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold text-text-secondary w-4">{i + 1}</span>
                      <span className="text-sm font-medium text-text-primary line-clamp-1">{p.name}</span>
                    </div>
                    <span className="text-sm font-semibold text-green-600">${p.revenue?.toFixed(0)}</span>
                  </div>
                ))
              )}
            </div>
          </div>
          {/* AI Stock Forecast */}
          <div className="bg-white border border-border rounded-xl shadow-sm overflow-hidden mt-6">
            <div className="p-5 border-b border-border bg-gradient-to-r from-indigo-50 to-purple-50 flex items-center justify-between">
              <h3 className="font-bold text-indigo-900 text-sm flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                AI Stock Forecast
              </h3>
            </div>
            <div className="p-5 space-y-4">
              {(stats?.stockPredictions || []).length === 0 ? (
                <p className="text-text-secondary text-sm text-center py-4">Analyzing sales velocity...</p>
              ) : (
                (stats?.stockPredictions || []).map((p: any) => (
                  <div key={p.id} className="flex flex-col gap-1.5 border-b border-gray-50 pb-3 last:border-0 last:pb-0">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-text-primary line-clamp-1 pr-2">{p.name}</span>
                      <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${
                        p.status === 'Critical' ? 'bg-red-100 text-red-700' :
                        p.status === 'Warning' ? 'bg-amber-100 text-amber-700' :
                        'bg-emerald-100 text-emerald-700'
                      }`}>
                        {p.estimatedDaysRemaining} days left
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-text-secondary bg-gray-50 px-2 py-1 rounded-md">
                      <span>Stock: <strong className="text-text-primary">{p.currentStock}</strong></span>
                      <span>Velocity: <strong className="text-text-primary">{p.dailyVelocity}/day</strong></span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
