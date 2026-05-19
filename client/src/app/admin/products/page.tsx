'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Pencil, Trash2, Loader2, PackageX, ToggleLeft, ToggleRight } from 'lucide-react';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';

export default function AdminProductsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-products', search, page],
    queryFn: async () => {
      const res = await api.get(`/admin/products?limit=20&page=${page}${search ? `&search=${search}` : ''}`);
      return res.data.data;
    },
  });

  const { data: forecastData } = useQuery({
    queryKey: ['admin-stock-forecast'],
    queryFn: async () => {
      const res = await api.get('/admin/stock/forecast');
      return res.data.data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => api.delete(`/admin/products/${id}`),
    onSuccess: () => {
      toast.success('Product deleted');
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
    },
    onError: () => toast.error('Failed to delete product'),
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) =>
      api.put(`/admin/products/${id}`, { isActive }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-products'] }),
    onError: () => toast.error('Failed to update product'),
  });

  const products = data?.products || [];
  const totalPages = data?.pages || 1;
  const forecastMap = new Map(
    forecastData?.products?.map((f: any) => [f.productId, f]) || []
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Products</h1>
          <p className="text-sm text-text-secondary mt-0.5">{data?.total || 0} total products</p>
        </div>
        <Link
          href="/admin/products/new"
          className="flex items-center px-4 py-2 bg-primary text-white font-medium rounded-lg hover:opacity-90 transition shadow-sm gap-1.5"
        >
          <Plus className="w-4 h-4" /> Add Product
        </Link>
      </div>

      <div className="bg-white border border-border rounded-xl shadow-sm overflow-hidden">
        {/* Search bar */}
        <div className="p-4 border-b border-border">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
            <input
              type="text"
              placeholder="Search by name or SKU..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-9 pr-4 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-xs text-text-secondary uppercase border-b border-border">
              <tr>
                <th className="px-5 py-3 font-medium">Product</th>
                <th className="px-5 py-3 font-medium">Category</th>
                <th className="px-5 py-3 font-medium">Price</th>
                <th className="px-5 py-3 font-medium">Stock</th>
                <th className="px-5 py-3 font-medium">AI Forecast</th>
                <th className="px-5 py-3 font-medium">Stock Forecast</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                [...Array(8)].map((_, i) => (
                  <tr key={i}>
                    <td colSpan={7} className="px-5 py-4">
                      <div className="h-5 bg-gray-100 rounded animate-pulse w-full" />
                    </td>
                  </tr>
                ))
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-16 text-center">
                    <PackageX className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                    <p className="text-text-secondary">No products found</p>
                  </td>
                </tr>
              ) : (
                products.map((product: any) => (
                  <tr key={product._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        {product.images?.[0]?.url ? (
                          <img src={product.images[0].url} alt={product.name} className="w-10 h-10 rounded-lg object-cover border border-border" />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-gray-100 border border-border flex items-center justify-center text-gray-300">
                            <PackageX className="w-4 h-4" />
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-text-primary line-clamp-1">{product.name}</p>
                          <p className="text-xs text-text-secondary">{product.sku || 'No SKU'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-text-secondary">{(product.category as any)?.name || '—'}</td>
                    <td className="px-5 py-4">
                      <div>
                        <span className="font-semibold">${product.price?.toFixed(2)}</span>
                        {product.compareAtPrice && (
                          <span className="ml-1.5 text-xs text-text-secondary line-through">${product.compareAtPrice.toFixed(2)}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full ${
                        product.stock > 10 ? 'bg-green-100 text-green-700' :
                        product.stock > 0 ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {product.stock === 0 ? 'Out of stock' : `${product.stock} left`}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      {product.aiForecast ? (
                        <div className="flex flex-col gap-1">
                          <span className={`inline-flex w-fit px-2 py-0.5 text-[10px] uppercase tracking-wider font-bold rounded-full ${
                            product.aiForecast.status === 'Critical' ? 'bg-red-100 text-red-700' :
                            product.aiForecast.status === 'Warning' ? 'bg-amber-100 text-amber-700' :
                            'bg-emerald-100 text-emerald-700'
                          }`}>
                            {product.aiForecast.daysRemaining} Days Left
                          </span>
                          <span className="text-[10px] text-text-secondary">Vel: {product.aiForecast.velocity}/d</span>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">Loading...</span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      {(() => {
                        const forecast = forecastMap.get(product._id);
                        if (!forecast) return <span className="text-xs text-gray-400">Loading...</span>;
                        return (
                          <div className="flex flex-col gap-1.5 items-start">
                            <span className={`inline-flex px-2 py-0.5 text-[10px] uppercase tracking-wider font-bold rounded-md ${
                              forecast.status === 'critical' ? 'bg-red-100 text-red-700' :
                              forecast.status === 'low' ? 'bg-orange-100 text-orange-700' :
                              forecast.status === 'healthy' ? 'bg-green-100 text-green-700' :
                              forecast.status === 'overstocked' ? 'bg-blue-100 text-blue-700' :
                              'bg-gray-100 text-gray-600'
                            }`}>
                              {forecast.daysOfStockLeft} Days Left
                            </span>
                            <div className="flex flex-wrap gap-1">
                              {forecast.isEvergreen && (
                                <span className="text-[10px] uppercase tracking-wider font-bold px-1.5 py-0.5 bg-green-100 text-green-700 rounded-full flex items-center gap-0.5">
                                  🌿
                                </span>
                              )}
                              {forecast.seasonalMultiplier > 1.0 && (
                                <span className="text-[10px] uppercase tracking-wider font-bold px-1.5 py-0.5 bg-purple-100 text-purple-700 rounded-full">
                                  {forecast.seasonalMultiplier}x
                                </span>
                              )}
                              {(forecast.status === 'critical' || forecast.status === 'low') && (
                                <span className="text-[10px] text-text-secondary font-medium">
                                  Restock: {forecast.recommendedRestockQty}
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })()}
                    </td>
                    <td className="px-5 py-4">
                      <button
                        onClick={() => toggleMutation.mutate({ id: product._id, isActive: !product.isActive })}
                        className="flex items-center gap-1.5 text-xs font-medium"
                      >
                        {product.isActive ? (
                          <><ToggleRight className="w-5 h-5 text-green-500" /><span className="text-green-600">Active</span></>
                        ) : (
                          <><ToggleLeft className="w-5 h-5 text-gray-400" /><span className="text-gray-500">Inactive</span></>
                        )}
                      </button>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/admin/products/${product._id}/edit`}
                          className="p-1.5 text-text-secondary hover:text-primary hover:bg-blue-50 rounded-lg transition"
                        >
                          <Pencil className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => { if (confirm(`Delete "${product.name}"?`)) deleteMutation.mutate(product._id); }}
                          disabled={deleteMutation.isPending}
                          className="p-1.5 text-text-secondary hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                        >
                          {deleteMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                        </button>
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
          <p className="text-sm text-text-secondary">Page {page} of {totalPages}</p>
          <div className="flex gap-2">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1.5 border border-border rounded-lg text-sm disabled:opacity-40 hover:bg-gray-50">Previous</button>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="px-3 py-1.5 border border-border rounded-lg text-sm disabled:opacity-40 hover:bg-gray-50">Next</button>
          </div>
        </div>
      </div>
    </div>
  );
}
