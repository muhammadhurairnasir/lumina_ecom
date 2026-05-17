import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Skeleton } from '@/components/ui/Skeleton';

interface ChatProductCardProps {
  slug: string;
}

export default function ChatProductCard({ slug }: ChatProductCardProps) {
  const router = useRouter();

  const { data: product, isLoading } = useQuery({
    queryKey: ['product-compact', slug],
    queryFn: async () => {
      const res = await api.get(`/products/${slug}`);
      return res.data.data.product;
    },
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading) {
    return <Skeleton className="h-[100px] w-full rounded-xl my-2" />;
  }

  if (!product) return null;

  const isSale = product.compareAtPrice && product.compareAtPrice > product.price;

  return (
    <div className="flex bg-white border border-border rounded-xl p-2 my-2 shadow-sm max-w-[280px]">
      <div className="w-20 h-20 bg-gray-50 rounded-lg overflow-hidden relative flex-shrink-0">
        <Image 
          src={product.images[0]?.url || '/placeholder.png'} 
          alt={product.images[0]?.alt || product.name} 
          fill 
          className="object-cover"
        />
      </div>
      <div className="ml-3 flex flex-col justify-between flex-1 py-1">
        <div>
          <h4 className="text-sm font-semibold text-text-primary line-clamp-2 leading-tight">
            {product.name}
          </h4>
          <div className="flex items-center space-x-2 mt-1">
            <span className={`text-sm font-bold ${isSale ? 'text-semantic-error' : 'text-text-primary'}`}>
              ${product.price.toFixed(2)}
            </span>
            {isSale && (
              <span className="text-xs text-text-secondary line-through">
                ${product.compareAtPrice.toFixed(2)}
              </span>
            )}
          </div>
        </div>
        <button 
          onClick={() => router.push(`/products/${product.slug}`)}
          className="text-xs bg-primary text-white font-medium py-1.5 px-3 rounded-lg hover:bg-primary-light hover:text-primary transition-colors self-start mt-2"
        >
          View Product
        </button>
      </div>
    </div>
  );
}
