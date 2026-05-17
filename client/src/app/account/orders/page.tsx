'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Skeleton } from '@/components/ui/Skeleton';
import { Package } from 'lucide-react';
import { format } from 'date-fns';

export default function OrdersPage() {
  const { data: orders, isLoading } = useQuery({
    queryKey: ['my-orders'],
    queryFn: async () => {
      const res = await api.get('/orders/my-orders');
      return res.data.data.orders;
    }
  });

  if (isLoading) {
    return <div className="space-y-4">{[1, 2, 3].map(i => <Skeleton key={i} className="h-24 w-full" />)}</div>;
  }

  if (!orders || orders.length === 0) {
    return (
      <div className="bg-white p-12 rounded-xl border border-border shadow-sm flex flex-col items-center justify-center text-center">
         <Package className="w-12 h-12 text-border mb-4" />
         <h2 className="text-xl font-bold mb-2">No orders found</h2>
         <p className="text-text-secondary">You haven't placed any orders yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-text-primary">Order History</h2>
      
      <div className="space-y-4">
        {orders.map((order: any) => (
          <div key={order._id} className="bg-white rounded-xl border border-border shadow-sm overflow-hidden">
            <div className="bg-[#F9FAFB] px-6 py-4 border-b border-border flex flex-wrap justify-between items-center gap-4 text-sm">
              <div>
                <p className="text-text-secondary mb-1">Order Number</p>
                <p className="font-medium text-text-primary">{order.orderNumber}</p>
              </div>
              <div>
                <p className="text-text-secondary mb-1">Date Placed</p>
                <p className="font-medium text-text-primary">{format(new Date(order.createdAt), 'MMM dd, yyyy')}</p>
              </div>
              <div>
                <p className="text-text-secondary mb-1">Total Amount</p>
                <p className="font-medium text-text-primary">${order.total.toFixed(2)}</p>
              </div>
              <div>
                <span className={`inline-flex px-3 py-1 rounded-full text-xs font-bold ${
                  order.orderStatus === 'delivered' ? 'bg-green-100 text-semantic-success' : 
                  order.orderStatus === 'cancelled' ? 'bg-red-100 text-semantic-error' : 
                  'bg-blue-100 text-primary'
                }`}>
                  {order.orderStatus.toUpperCase()}
                </span>
              </div>
            </div>
            
            <div className="p-6">
              <div className="flex space-x-4 overflow-x-auto pb-2">
                {order.items.map((item: any, i: number) => (
                  <div key={i} className="flex-shrink-0 flex items-center space-x-4">
                     <div className="w-16 h-16 bg-gray-50 rounded border border-border overflow-hidden">
                       {/* Image placeholder since we might not populate images deeply in list view */}
                       <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">IMG</div>
                     </div>
                     <div>
                       <p className="text-sm font-medium text-text-primary line-clamp-1 max-w-[150px]">{item.name}</p>
                       <p className="text-xs text-text-secondary">Qty: {item.quantity}</p>
                     </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
