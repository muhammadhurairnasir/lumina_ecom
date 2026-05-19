'use client';

import { useState } from 'react';
import { Heart, Minus, Plus } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';
import { useQueryClient } from '@tanstack/react-query';

export default function AddToCartForm({ product }: { product: any }) {
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);
  const { setCart } = useStore();
  const queryClient = useQueryClient();

  const handleAddToCart = async () => {
    if (!product.isInStock) return;
    
    setLoading(true);
    try {
      const res = await api.post('/cart/items', {
        productId: product._id || product.id,
        slug: product.slug,
        quantity,
      });
      setCart(res.data.data.cart);
      queryClient.setQueryData(['cart'], res.data.data.cart);
      toast.success('Added to cart successfully');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to add to cart');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Variants could go here if we expand the model */}
      
      {/* Actions */}
      <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
        
        {/* Quantity */}
        <div className="flex items-center border border-border rounded-lg bg-white overflow-hidden h-12 w-32">
          <button 
            onClick={() => setQuantity(Math.max(1, quantity - 1))}
            className="px-3 h-full hover:bg-gray-50 text-text-secondary transition-colors"
            disabled={!product.isInStock}
          >
            <Minus className="w-4 h-4" />
          </button>
          <span className="flex-1 text-center font-medium text-text-primary">{quantity}</span>
          <button 
            onClick={() => setQuantity(Math.min(product.stock || 10, quantity + 1))}
            className="px-3 h-full hover:bg-gray-50 text-text-secondary transition-colors"
            disabled={!product.isInStock}
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* Add to Cart */}
        <button 
          onClick={handleAddToCart}
          disabled={!product.isInStock || loading}
          className={`flex-1 h-12 font-bold rounded-lg transition-colors flex items-center justify-center ${
            product.isInStock 
              ? 'bg-primary text-white hover:bg-primary-light hover:text-primary shadow-sm' 
              : 'bg-border text-text-secondary cursor-not-allowed'
          }`}
        >
          {loading ? 'Adding...' : product.isInStock ? 'Add to Cart' : 'Out of Stock'}
        </button>

        {/* Wishlist */}
        <button 
          onClick={() => toast('Added to wishlist', { icon: '🤍' })}
          className="h-12 w-12 flex items-center justify-center border border-border rounded-lg text-text-secondary hover:text-semantic-error hover:border-semantic-error transition-colors bg-white shadow-sm"
          aria-label="Add to wishlist"
        >
          <Heart className="w-5 h-5" />
        </button>
      </div>

      {!product.isInStock && (
        <p className="text-sm text-semantic-error font-medium">
          This item is currently out of stock. Check back later!
        </p>
      )}
    </div>
  );
}
