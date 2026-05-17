'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  createColumnHelper, flexRender, getCoreRowModel, useReactTable, getPaginationRowModel
} from '@tanstack/react-table';
import { Search, Loader2, Star, CheckCircle, Trash2 } from 'lucide-react';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const columnHelper = createColumnHelper<any>();

export default function AdminReviewsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  
  const { data, isLoading } = useQuery({
    queryKey: ['admin-reviews', search],
    queryFn: async () => {
      // Backend mock for reviews route
      const res = await api.get(`/admin/reviews?limit=50${search ? `&search=${search}` : ''}`);
      return res.data.data.reviews;
    }
  });

  const approveMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.patch(`/admin/reviews/${id}`, { isApproved: true });
    },
    onSuccess: () => {
      toast.success('Review approved');
      queryClient.invalidateQueries({ queryKey: ['admin-reviews'] });
    },
    onError: () => toast.error('Failed to approve review')
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/admin/reviews/${id}`);
    },
    onSuccess: () => {
      toast.success('Review deleted');
      queryClient.invalidateQueries({ queryKey: ['admin-reviews'] });
    },
    onError: () => toast.error('Failed to delete review')
  });

  const columns = [
    columnHelper.accessor('product', {
      header: 'Product',
      cell: info => <span className="font-medium text-text-primary line-clamp-1 max-w-[200px]">{info.row.original.productName || 'Unknown Product'}</span>
    }),
    columnHelper.accessor('rating', {
      header: 'Rating',
      cell: info => (
        <div className="flex items-center text-semantic-warning">
          {[...Array(5)].map((_, i) => (
             <Star key={i} className={`w-3.5 h-3.5 ${i < info.getValue() ? 'fill-current' : 'text-gray-300'}`} />
          ))}
        </div>
      )
    }),
    columnHelper.accessor('body', {
      header: 'Review',
      cell: info => <p className="text-sm text-text-secondary line-clamp-2 max-w-[300px] italic">"{info.getValue()}"</p>
    }),
    columnHelper.accessor('user', {
      header: 'Customer',
      cell: info => <span className="text-xs">{info.row.original.userName || 'Anonymous'}</span>
    }),
    columnHelper.accessor('createdAt', {
      header: 'Date',
      cell: info => <span className="text-xs">{format(new Date(info.getValue() || Date.now()), 'MMM dd, yyyy')}</span>
    }),
    columnHelper.display({
      id: 'actions',
      cell: info => (
        <div className="flex items-center space-x-2">
          {!info.row.original.isApproved && (
            <button 
              onClick={() => approveMutation.mutate(info.row.original._id)}
              className="p-1.5 text-text-secondary hover:text-semantic-success bg-gray-50 rounded hover:bg-green-50 transition-colors"
              title="Approve"
            >
              <CheckCircle className="w-4 h-4" />
            </button>
          )}
          <button 
            onClick={() => { if(confirm('Delete review?')) deleteMutation.mutate(info.row.original._id) }}
            className="p-1.5 text-text-secondary hover:text-semantic-error bg-gray-50 rounded hover:bg-red-50 transition-colors"
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )
    })
  ];

  const table = useReactTable({
    data: data || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-text-primary">Reviews</h1>
      </div>

      <div className="bg-white border border-border rounded-xl shadow-sm overflow-hidden">
        
        {/* Toolbar */}
        <div className="p-4 border-b border-border flex flex-col sm:flex-row gap-4 justify-between">
          <div className="relative max-w-md w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
            <input 
              type="text" 
              placeholder="Search reviews..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-border rounded-lg text-sm focus:ring-primary focus:border-primary"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-text-secondary uppercase text-xs border-b border-border">
              {table.getHeaderGroups().map(headerGroup => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map(header => (
                    <th key={header.id} className="px-6 py-3 font-medium">
                      {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <tr><td colSpan={columns.length} className="px-6 py-12 text-center text-text-secondary"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></td></tr>
              ) : table.getRowModel().rows.length === 0 ? (
                <tr><td colSpan={columns.length} className="px-6 py-12 text-center text-text-secondary">No reviews found.</td></tr>
              ) : (
                table.getRowModel().rows.map(row => (
                  <tr key={row.id} className={`hover:bg-gray-50 transition-colors ${!row.original.isApproved ? 'bg-orange-50/30' : ''}`}>
                    {row.getVisibleCells().map(cell => (
                      <td key={cell.id} className="px-6 py-4">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-4 border-t border-border flex items-center justify-between">
          <div className="text-sm text-text-secondary">
             Showing page {table.getState().pagination.pageIndex + 1} of {table.getPageCount() || 1}
          </div>
          <div className="flex space-x-2">
            <button onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()} className="px-3 py-1 border border-border rounded text-sm disabled:opacity-50 hover:bg-gray-50">Previous</button>
            <button onClick={() => table.nextPage()} disabled={!table.getCanNextPage()} className="px-3 py-1 border border-border rounded text-sm disabled:opacity-50 hover:bg-gray-50">Next</button>
          </div>
        </div>

      </div>
    </div>
  );
}
