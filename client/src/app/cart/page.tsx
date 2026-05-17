'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Minus, Plus, Trash2, ArrowRight, ShoppingBag, X } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { api } from '@/lib/api';
import { useStore } from '@/store/useStore';
import { Skeleton } from '@/components/ui/Skeleton';

export default function CartPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { cart, setCart } = useStore();
  const [voucherCode, setVoucherCode] = useState('');

  // Fetch Cart
  const { isLoading } = useQuery({
    queryKey: ['cart'],
    queryFn: async () => {
      const res = await api.get('/cart');
      setCart(res.data.data.cart);
      return res.data.data.cart;
    }
  });

  // Mutations
  const updateQuantity = useMutation({
    mutationFn: async ({ productId, quantity }: { productId: string, quantity: number }) => {
      const res = await api.patch(`/cart/items/${productId}`, { quantity });
      return res.data.data.cart;
    },
    onSuccess: (newCart) => {
      setCart(newCart);
      queryClient.setQueryData(['cart'], newCart);
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to update quantity')
  });

  const removeItem = useMutation({
    mutationFn: async (productId: string) => {
      const res = await api.delete(`/cart/items/${productId}`);
      return res.data.data.cart;
    },
    onSuccess: (newCart) => {
      setCart(newCart);
      queryClient.setQueryData(['cart'], newCart);
      toast.success('Item removed');
    }
  });

  const applyVoucher = useMutation({
    mutationFn: async (code: string) => {
      const res = await api.post('/cart/voucher', { code });
      return res.data.data.cart;
    },
    onSuccess: (newCart) => {
      setCart(newCart);
      queryClient.setQueryData(['cart'], newCart);
      setVoucherCode('');
      toast.success('Voucher applied successfully!');
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Invalid or expired voucher')
  });

  const removeVoucher = useMutation({
    mutationFn: async () => {
      const res = await api.delete('/cart/voucher');
      return res.data.data.cart;
    },
    onSuccess: (newCart) => {
      setCart(newCart);
      queryClient.setQueryData(['cart'], newCart);
      toast.success('Voucher removed');
    }
  });

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex flex-col lg:flex-row gap-12">
        <div className="flex-1 space-y-6">
          <Skeleton className="h-8 w-48 mb-8" />
          {[1, 2].map(i => <Skeleton key={i} className="h-32 w-full" />)}
        </div>
        <div className="w-full lg:w-[400px]">
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  // Use Zustand store for rendering to prevent stale React Query cache issues
  const cartData = cart;
  const isEmpty = cartData.items.length === 0;

  if (isEmpty) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-4">
        <div className="w-24 h-24 bg-primary-light rounded-full flex items-center justify-center mb-6 text-primary">
          <ShoppingBag className="w-10 h-10" />
        </div>
        <h1 className="text-3xl font-bold text-text-primary mb-2">Your cart is empty</h1>
        <p className="text-text-secondary mb-8 text-center max-w-md">
          Looks like you haven't added anything to your cart yet. Discover our premium collection and find something you love.
        </p>
        <Link href="/products" className="px-8 py-3 bg-primary text-white font-medium rounded-lg hover:bg-primary-light hover:text-primary transition-colors flex items-center">
          Continue Shopping <ArrowRight className="ml-2 w-4 h-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold text-text-primary mb-8">Shopping Cart</h1>
      
      <div className="flex flex-col lg:flex-row gap-12">
        {/* Cart Items */}
        <div className="flex-1">
          <div className="space-y-6">
            {cartData.items.map((item: any) => (
              <div key={item.product._id || item.product} className="flex flex-col sm:flex-row gap-6 py-6 border-b border-border bg-white rounded-xl p-4 shadow-sm">
                
                {/* Image */}
                <div className="w-24 h-24 sm:w-32 sm:h-32 bg-gray-50 rounded-lg overflow-hidden relative flex-shrink-0">
                  <Image 
                    src={item.image || '/placeholder.png'} 
                    alt={item.name} 
                    fill 
                    className="object-cover"
                  />
                </div>

                {/* Details */}
                <div className="flex-1 flex flex-col justify-between">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-lg text-text-primary line-clamp-1">{item.name}</h3>
                      {item.variant && <p className="text-sm text-text-secondary mt-1">Variant: {item.variant}</p>}
                    </div>
                    <span className="font-bold text-lg">${item.price.toFixed(2)}</span>
                  </div>

                  <div className="flex justify-between items-center mt-4">
                    {/* Quantity Stepper */}
                    <div className="flex items-center border border-border rounded-lg bg-white overflow-hidden h-10 w-28">
                      <button 
                        onClick={() => updateQuantity.mutate({ productId: item.product._id || item.product, quantity: Math.max(1, item.quantity - 1) })}
                        disabled={updateQuantity.isPending}
                        className="px-2 h-full hover:bg-gray-50 text-text-secondary disabled:opacity-50"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="flex-1 text-center font-medium text-sm">{item.quantity}</span>
                      <button 
                        onClick={() => updateQuantity.mutate({ productId: item.product._id || item.product, quantity: item.quantity + 1 })}
                        disabled={updateQuantity.isPending}
                        className="px-2 h-full hover:bg-gray-50 text-text-secondary disabled:opacity-50"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>

                    <button 
                      onClick={() => removeItem.mutate(item.product._id || item.product)}
                      disabled={removeItem.isPending}
                      className="text-text-secondary hover:text-semantic-error flex items-center text-sm font-medium transition-colors"
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Order Summary */}
        <div className="w-full lg:w-[400px]">
          <div className="bg-white border border-border rounded-2xl p-6 shadow-sm sticky top-24">
            <h2 className="text-xl font-bold text-text-primary mb-6">Order Summary</h2>
            
            <div className="space-y-4 text-sm text-text-secondary mb-6 border-b border-border pb-6">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-medium text-text-primary">${cartData.subtotal.toFixed(2)}</span>
              </div>
              
              {cartData.discount > 0 && (
                <div className="flex justify-between text-semantic-success font-medium">
                  <span>Discount ({cartData.appliedVoucher?.code})</span>
                  <span>-${cartData.discount.toFixed(2)}</span>
                </div>
              )}
              
              <div className="flex justify-between">
                <span>Shipping</span>
                <span>Calculated at checkout</span>
              </div>
            </div>

            <div className="flex justify-between items-end mb-6">
              <span className="text-lg font-bold text-text-primary">Total</span>
              <span className="text-2xl font-bold text-text-primary">${cartData.total.toFixed(2)}</span>
            </div>

            {/* Voucher Input */}
            <div className="mb-6">
              {cartData.appliedVoucher ? (
                <div className="flex items-center justify-between bg-primary-light text-primary px-4 py-3 rounded-lg text-sm border border-primary/20">
                  <span className="font-bold">Code: {cartData.appliedVoucher.code} applied</span>
                  <button onClick={() => removeVoucher.mutate()} disabled={removeVoucher.isPending} className="hover:text-primary-dark">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex space-x-2">
                  <input 
                    type="text" 
                    value={voucherCode}
                    onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
                    placeholder="Enter voucher code" 
                    className="flex-1 border border-border rounded-lg px-3 py-2 text-sm focus:ring-primary focus:border-primary uppercase"
                  />
                  <button 
                    onClick={() => applyVoucher.mutate(voucherCode)}
                    disabled={!voucherCode || applyVoucher.isPending}
                    className="px-4 py-2 bg-surface border border-border text-text-primary text-sm font-medium rounded-lg hover:bg-gray-50 disabled:opacity-50"
                  >
                    Apply
                  </button>
                </div>
              )}
            </div>

            <button 
              onClick={() => router.push('/checkout')}
              className="w-full py-4 bg-primary text-white font-bold rounded-xl hover:bg-primary-light hover:text-primary transition-colors flex items-center justify-center shadow-md"
            >
              Proceed to Checkout
            </button>
            
            <Link href="/products" className="mt-4 block text-center text-sm text-primary hover:underline font-medium">
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
