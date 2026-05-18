import Image from 'next/image';
import Link from 'next/link';
import { Heart, Star } from 'lucide-react';
import { useStore } from '@/store/useStore';
import toast from 'react-hot-toast';
import { api } from '@/lib/api';
import { useQueryClient } from '@tanstack/react-query';

interface ProductCardProps {
  product: {
    _id: string;
    name: string;
    slug: string;
    price: number;
    compareAtPrice?: number;
    images: { url: string; alt?: string }[];
    rating: number;
    reviewCount: number;
    isInStock: boolean;
    isFeatured?: boolean;
    tags?: string[];
  };
}

export default function ProductCard({ product }: ProductCardProps) {
  const { cart, setCart } = useStore();
  const queryClient = useQueryClient();

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent navigating to product page
    
    if (!product.isInStock) return;

    try {
      const res = await api.post('/cart/items', {
        productId: product._id,
        quantity: 1,
      });
      setCart(res.data.data.cart);
      queryClient.setQueryData(['cart'], res.data.data.cart);
      toast.success('Added to cart');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to add to cart');
    }
  };

  const isSale = product.compareAtPrice && product.compareAtPrice > product.price;
  const isNew = product.tags?.includes('new');

  return (
    <Link href={`/products/${product.slug}`} className="group relative block rounded-2xl bg-white border border-border shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer overflow-hidden">
      
      {/* Badges */}
      <div className="absolute top-3 left-3 z-10 flex flex-col gap-1">
        {!product.isInStock && (
          <span className="bg-semantic-error text-white text-xs font-bold px-2 py-1 rounded">Out of Stock</span>
        )}
        {isSale && product.isInStock && (
          <span className="bg-semantic-warning text-white text-xs font-bold px-2 py-1 rounded">Sale</span>
        )}
        {isNew && product.isInStock && (
          <span className="bg-primary text-white text-xs font-bold px-2 py-1 rounded">New</span>
        )}
      </div>

      {/* Wishlist Button */}
      <button className="absolute top-3 right-3 z-10 p-2 bg-white/80 backdrop-blur-sm rounded-full text-text-secondary hover:text-semantic-error transition-colors" onClick={(e) => { e.preventDefault(); toast('Added to wishlist', { icon: '🤍' })}}>
        <Heart className="w-5 h-5" />
      </button>

      {/* Image */}
      <div className="relative aspect-square w-full overflow-hidden bg-gray-50">
        <Image
          src={product.images[0]?.url || '/placeholder.png'}
          alt={product.images[0]?.alt || product.name}
          fill
          className="object-cover object-center group-hover:scale-105 transition-transform duration-500"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
        />
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col h-[160px]">
        
        {/* Rating */}
        {product.reviewCount > 0 && (
          <div className="flex items-center space-x-1 mb-1">
            <Star className="w-3.5 h-3.5 fill-semantic-warning text-semantic-warning" />
            <span className="text-xs text-text-secondary font-medium">{product.rating.toFixed(1)}</span>
            <span className="text-xs text-text-secondary">({product.reviewCount})</span>
          </div>
        )}

        {/* Title */}
        <h3 className="text-sm font-medium text-text-primary line-clamp-2 mb-auto group-hover:text-primary transition-colors">
          {product.name}
        </h3>

        {/* Price & Action */}
        <div className="mt-4 flex items-end justify-between">
          <div className="flex flex-col">
            {isSale && (
              <span className="text-xs text-text-secondary line-through">
                ${product.compareAtPrice?.toFixed(2)}
              </span>
            )}
            <span className={`text-lg font-bold ${isSale ? 'text-semantic-error' : 'text-text-primary'}`}>
              ${product.price.toFixed(2)}
            </span>
          </div>

          <button
            onClick={handleAddToCart}
            disabled={!product.isInStock}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
              product.isInStock 
                ? 'bg-primary text-white hover:bg-primary-light hover:text-primary hover:scale-105 active:scale-95' 
                : 'bg-border text-text-secondary cursor-not-allowed'
            }`}
          >
            {product.isInStock ? 'Add' : 'Empty'}
          </button>
        </div>

      </div>
    </Link>
  );
}
