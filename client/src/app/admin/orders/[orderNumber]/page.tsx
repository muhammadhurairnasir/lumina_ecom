'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';
import { ArrowLeft, Package, User, MapPin, CreditCard, Truck, Mail, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

export default function AdminOrderDetailPage({ params }: { params: { orderNumber: string } }) {
  const queryClient = useQueryClient();
  const [newStatus, setNewStatus] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [trackingUrl, setTrackingUrl] = useState('');
  const [statusNote, setStatusNote] = useState('');

  const { data: order, isLoading } = useQuery({
    queryKey: ['admin-order', params.orderNumber],
    queryFn: async () => {
      const res = await api.get(`/admin/orders/${params.orderNumber}`);
      return res.data.data.order;
    }
  });

  const updateStatusMutation = useMutation({
    mutationFn: async () => {
      await api.patch(`/admin/orders/${order._id}/status`, {
        status: newStatus || order.orderStatus,
        trackingNumber,
        trackingUrl,
        note: statusNote,
      });
    },
    onSuccess: () => {
      toast.success('Order status updated');
      queryClient.invalidateQueries({ queryKey: ['admin-order', params.orderNumber] });
      setNewStatus(''); setTrackingNumber(''); setTrackingUrl(''); setStatusNote('');
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to update order status')
  });

  if (isLoading) return <div className="flex justify-center items-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  if (!order) return <div className="text-center py-12 text-xl font-bold">Order not found</div>;

  const isDelivered = order.orderStatus === 'delivered';
  const isCancelled = order.orderStatus === 'cancelled';

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/admin/orders" className="p-2 border border-border rounded-lg bg-white hover:bg-gray-50">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-text-primary">Order #{order.orderNumber}</h1>
            <p className="text-sm text-text-secondary">{format(new Date(order.createdAt), 'MMM dd, yyyy HH:mm a')}</p>
          </div>
        </div>
        <div className="flex space-x-3">
          <span className={`inline-flex px-3 py-1.5 rounded-lg text-sm font-bold ${order.paymentStatus === 'paid' ? 'bg-green-100 text-semantic-success' : 'bg-yellow-100 text-semantic-warning'}`}>
            Payment: {order.paymentStatus.toUpperCase()}
          </span>
          <span className={`inline-flex px-3 py-1.5 rounded-lg text-sm font-bold ${isDelivered ? 'bg-green-100 text-semantic-success' : isCancelled ? 'bg-red-100 text-semantic-error' : 'bg-blue-100 text-primary'}`}>
            Status: {order.orderStatus.toUpperCase()}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Items */}
          <div className="bg-white p-6 rounded-xl border border-border shadow-sm">
            <h2 className="text-lg font-bold text-text-primary mb-4 flex items-center">
              <Package className="w-5 h-5 mr-2" /> Order Items
            </h2>
            <div className="space-y-4">
              {order.items.map((item: any, i: number) => (
                <div key={i} className="flex justify-between items-center py-4 border-b border-border last:border-0 last:pb-0">
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 bg-gray-50 rounded-lg overflow-hidden border border-border">
                       <img src={item.image || '/placeholder.png'} alt={item.name} className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <h4 className="font-medium text-text-primary">{item.name}</h4>
                      <p className="text-sm text-text-secondary">Qty: {item.quantity}</p>
                    </div>
                  </div>
                  <div className="font-bold text-text-primary">
                    ${(item.price * item.quantity).toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
            
            {/* Totals */}
            <div className="mt-6 pt-6 border-t border-border space-y-2 text-sm">
              <div className="flex justify-between text-text-secondary">
                <span>Subtotal</span>
                <span>${order.subtotal.toFixed(2)}</span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-semantic-success">
                  <span>Discount</span>
                  <span>-${order.discount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-lg text-text-primary pt-2">
                <span>Total</span>
                <span>${order.total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div className="bg-white p-6 rounded-xl border border-border shadow-sm">
            <h2 className="text-lg font-bold text-text-primary mb-6">Order Timeline</h2>
            <div className="space-y-6">
              <div className="flex space-x-4">
                <div className="flex flex-col items-center">
                  <div className="w-3 h-3 rounded-full bg-primary mt-1.5"></div>
                  <div className="w-0.5 h-full bg-border mt-2"></div>
                </div>
                <div className="pb-6">
                  <p className="font-bold text-sm text-text-primary">Order Placed</p>
                  <p className="text-xs text-text-secondary mt-1">{format(new Date(order.createdAt), 'MMM dd, yyyy HH:mm a')}</p>
                </div>
              </div>
              
              {order.paymentStatus === 'paid' && (
                <div className="flex space-x-4">
                  <div className="flex flex-col items-center">
                    <div className="w-3 h-3 rounded-full bg-semantic-success mt-1.5"></div>
                    <div className="w-0.5 h-full bg-border mt-2"></div>
                  </div>
                  <div className="pb-6">
                    <p className="font-bold text-sm text-text-primary">Payment Received</p>
                    <p className="text-xs text-text-secondary mt-1">Via Stripe (Intent: {order.paymentIntentId || 'N/A'})</p>
                  </div>
                </div>
              )}

              {/* In a real app, map through an order.history array here */}
              <div className="flex space-x-4">
                <div className="flex flex-col items-center">
                  <div className={`w-3 h-3 rounded-full mt-1.5 ${isDelivered ? 'bg-semantic-success' : 'bg-gray-300'}`}></div>
                </div>
                <div>
                  <p className="font-bold text-sm text-text-primary">Current Status: {order.orderStatus.toUpperCase()}</p>
                  {order.trackingNumber && <p className="text-xs text-text-secondary mt-1">Tracking: {order.trackingNumber}</p>}
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Right Column */}
        <div className="space-y-8">
          
          {/* Update Status Form */}
          <div className="bg-white p-6 rounded-xl border border-border shadow-sm">
            <h2 className="text-lg font-bold text-text-primary mb-4 flex items-center">
              <Truck className="w-5 h-5 mr-2" /> Update Fulfillment
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">Status</label>
                <select value={newStatus} onChange={e => setNewStatus(e.target.value)} className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:ring-primary bg-white">
                  <option value="">Select Status (Currently: {order.orderStatus})</option>
                  <option value="pending">Pending</option>
                  <option value="processing">Processing</option>
                  <option value="shipped">Shipped</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              {(newStatus === 'shipped' || order.orderStatus === 'shipped') && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-1">Tracking Number</label>
                    <input type="text" value={trackingNumber} onChange={e => setTrackingNumber(e.target.value)} placeholder={order.trackingNumber || ''} className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:ring-primary" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-1">Tracking URL</label>
                    <input type="url" value={trackingUrl} onChange={e => setTrackingUrl(e.target.value)} className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:ring-primary" />
                  </div>
                </>
              )}
              <div>
                 <label className="block text-sm font-medium text-text-primary mb-1">Add Note (Internal)</label>
                 <textarea value={statusNote} onChange={e => setStatusNote(e.target.value)} rows={2} className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:ring-primary resize-none" />
              </div>
              <button 
                onClick={() => updateStatusMutation.mutate()} 
                disabled={updateStatusMutation.isPending || (!newStatus && !trackingNumber && !statusNote)}
                className="w-full bg-primary text-white py-2 rounded-lg font-medium text-sm hover:bg-primary-light hover:text-primary transition-colors disabled:opacity-50"
              >
                {updateStatusMutation.isPending ? 'Updating...' : 'Update Status'}
              </button>
            </div>
            <div className="mt-4 pt-4 border-t border-border">
               <button className="w-full flex items-center justify-center space-x-2 bg-white border border-border text-text-primary py-2 rounded-lg font-medium text-sm hover:bg-gray-50 transition-colors">
                 <Mail className="w-4 h-4" /> <span>Send Status Email</span>
               </button>
            </div>
          </div>

          {/* Customer Details */}
          <div className="bg-white p-6 rounded-xl border border-border shadow-sm space-y-6">
            <div>
               <h2 className="text-lg font-bold text-text-primary mb-3 flex items-center">
                 <User className="w-5 h-5 mr-2" /> Customer
               </h2>
               <div className="text-sm">
                 <p className="font-medium text-text-primary">{order.user?.firstName} {order.user?.lastName}</p>
                 <p className="text-text-secondary text-primary hover:underline cursor-pointer">{order.user?.email}</p>
                 <p className="text-text-secondary mt-1">Customer ID: {order.user?._id || 'Guest'}</p>
               </div>
            </div>

            <div className="pt-4 border-t border-border">
               <h2 className="text-lg font-bold text-text-primary mb-3 flex items-center">
                 <MapPin className="w-5 h-5 mr-2" /> Shipping Address
               </h2>
               <div className="text-sm text-text-secondary">
                 <p>{order.shippingAddress?.street}</p>
                 <p>{order.shippingAddress?.city}, {order.shippingAddress?.state} {order.shippingAddress?.zip}</p>
                 <p>{order.shippingAddress?.country}</p>
               </div>
            </div>

             <div className="pt-4 border-t border-border">
               <h2 className="text-lg font-bold text-text-primary mb-3 flex items-center">
                 <CreditCard className="w-5 h-5 mr-2" /> Payment
               </h2>
               <div className="text-sm text-text-secondary flex justify-between">
                 <span>Method</span>
                 <span className="font-medium text-text-primary">Stripe</span>
               </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
