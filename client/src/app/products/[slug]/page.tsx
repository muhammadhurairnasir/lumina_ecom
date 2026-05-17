import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { Star, ShieldCheck, Truck, RotateCcw, Heart } from 'lucide-react';
import AddToCartForm from './AddToCartForm'; // Client component

// Define backend API base URL
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

// Generate Static Params for top 100 products
export async function generateStaticParams() {
  try {
    const res = await fetch(`${API_URL}/products?limit=100&sort=-rating`);
    const json = await res.json();
    return json.data.products.map((p: any) => ({
      slug: p.slug,
    }));
  } catch (error) {
    return [];
  }
}

// Generate SSR Metadata
export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  try {
    const res = await fetch(`${API_URL}/products/${params.slug}`);
    const json = await res.json();
    const product = json.data.product;

    return {
      title: product.seoTitle || product.name,
      description: product.seoDescription || product.description.substring(0, 160),
      keywords: product.seoKeywords?.join(', '),
      openGraph: {
        title: product.seoTitle || product.name,
        description: product.seoDescription,
        images: product.images.map((img: any) => img.url),
      },
    };
  } catch (error) {
    return { title: 'Product Not Found' };
  }
}

export default async function ProductDetailPage({ params }: { params: { slug: string } }) {
  // Fetch product data SSR
  let product: any = null;
  let relatedProducts: any[] = [];
  
  try {
    const res = await fetch(`${API_URL}/products/${params.slug}`, { next: { revalidate: 60 } });
    if (!res.ok) throw new Error('Failed to fetch');
    const json = await res.json();
    product = json.data.product;

    // Fetch related products (same category)
    if (product?.category) {
      const relRes = await fetch(`${API_URL}/products?category=${product.category._id || product.category}&limit=4`);
      const relJson = await relRes.json();
      relatedProducts = relJson.data.products.filter((p: any) => p._id !== product._id);
    }
  } catch (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <h1 className="text-2xl font-bold">Product not found.</h1>
      </div>
    );
  }

  const isSale = product.compareAtPrice && product.compareAtPrice > product.price;

  return (
    <div className="bg-background min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Breadcrumb */}
        <nav className="text-sm text-text-secondary mb-8">
          <Link href="/" className="hover:text-primary">Home</Link>
          <span className="mx-2">/</span>
          <Link href="/products" className="hover:text-primary">Products</Link>
          <span className="mx-2">/</span>
          <span className="text-text-primary">{product.name}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          
          {/* Image Gallery */}
          <div className="space-y-4">
            <div className="relative aspect-square w-full bg-white rounded-2xl overflow-hidden border border-border">
              <Image 
                src={product.images[0]?.url || '/placeholder.png'} 
                alt={product.images[0]?.alt || product.name}
                fill
                priority
                className="object-cover"
              />
            </div>
            <div className="flex space-x-4 overflow-x-auto pb-2">
              {product.images.map((img: any, i: number) => (
                <div key={i} className={`relative w-24 h-24 rounded-lg overflow-hidden border-2 flex-shrink-0 cursor-pointer ${i === 0 ? 'border-primary' : 'border-transparent'}`}>
                   <Image src={img.url} alt={img.alt || ''} fill className="object-cover" />
                </div>
              ))}
            </div>
          </div>

          {/* Product Info */}
          <div className="flex flex-col">
            <h1 className="text-3xl sm:text-4xl font-bold text-text-primary mb-2">{product.name}</h1>
            
            {product.reviewCount > 0 && (
              <div className="flex items-center space-x-2 mb-6">
                <div className="flex text-semantic-warning">
                   {[...Array(Math.round(product.rating || 5))].map((_, i) => <Star key={i} className="w-5 h-5 fill-current" />)}
                </div>
                <span className="text-sm text-text-secondary underline cursor-pointer">{product.reviewCount} reviews</span>
              </div>
            )}

            <div className="mb-6 flex items-end space-x-4">
              <span className={`text-4xl font-bold ${isSale ? 'text-semantic-error' : 'text-text-primary'}`}>
                ${product.price.toFixed(2)}
              </span>
              {isSale && (
                <span className="text-xl text-text-secondary line-through mb-1">
                  ${product.compareAtPrice.toFixed(2)}
                </span>
              )}
            </div>

            <p className="text-text-secondary mb-8 leading-relaxed">
              {product.description}
            </p>

            {/* Client Component for Cart Interactions */}
            <AddToCartForm product={product} />

            <div className="mt-8 border-t border-border pt-8 grid grid-cols-1 sm:grid-cols-3 gap-6">
               <div className="flex items-center space-x-3 text-sm text-text-primary">
                 <Truck className="w-5 h-5 text-primary" />
                 <span>Free Shipping<br/>Over $100</span>
               </div>
               <div className="flex items-center space-x-3 text-sm text-text-primary">
                 <RotateCcw className="w-5 h-5 text-primary" />
                 <span>30 Days<br/>Easy Returns</span>
               </div>
               <div className="flex items-center space-x-3 text-sm text-text-primary">
                 <ShieldCheck className="w-5 h-5 text-primary" />
                 <span>Secure<br/>Checkout</span>
               </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
