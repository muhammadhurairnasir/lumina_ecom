'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import Image from 'next/image';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import { api } from '@/lib/api';
import ProductCard from '@/components/products/ProductCard';
import { Skeleton } from '@/components/ui/Skeleton';
import { ShieldCheck, Truck, RotateCcw, Star } from 'lucide-react';

export default function Home() {
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const { data: categories, isLoading: catsLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await api.get('/products'); // Assuming categories are accessible or we mock for now
      return res.data; // Note: Need a proper category endpoint, but we'll mock the UI below
    }
  });

  const { data: featuredData, isLoading: featLoading } = useQuery({
    queryKey: ['featured-products'],
    queryFn: async () => {
      const res = await api.get('/products?limit=8&sort=-rating');
      return res.data.data.products;
    }
  });

  const { data: newArrivalsData, isLoading: newLoading } = useQuery({
    queryKey: ['new-arrivals'],
    queryFn: async () => {
      const res = await api.get('/products?limit=8&sort=-createdAt');
      return res.data.data.products;
    }
  });

  return (
    <div className="flex flex-col min-h-screen">
      {/* 1. Hero Banner */}
      <section className="relative w-full h-[600px] bg-[#F1F5F9] overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center">
          <div className="z-10 max-w-xl">
            <span className="text-primary font-semibold tracking-wider uppercase text-sm mb-4 block">Summer Collection 2026</span>
            <h1 className="text-5xl md:text-6xl font-bold text-text-primary mb-6 leading-tight">
              Essentials for <br />
              <span className="block md:hidden">Everyday Living</span>
              <span className="hidden md:desktop-typing">Everyday Living</span>
            </h1>
            <p className="text-lg text-text-secondary mb-8 md:animate-fade-slide-up-delay">
              Discover our new range of premium quality products designed to elevate your daily routine. Uncompromising quality meets timeless design.
            </p>
            <div className="flex space-x-4 md:animate-fade-slide-up-delay-2">
              <Link href="/products" className="px-8 py-3 bg-primary text-white font-medium rounded-lg hover:bg-primary-light hover:text-primary transition-all duration-200 hover:shadow-md active:scale-95">
                Shop Now
              </Link>
              <Link href="/products?category=new" className="px-8 py-3 bg-white text-text-primary border border-border font-medium rounded-lg hover:bg-gray-50 transition-all duration-200 hover:shadow-md active:scale-95">
                Explore New
              </Link>
            </div>
          </div>
        </div>
        {/* Abstract/Placeholder Hero Image */}
        <div className="absolute right-0 top-0 w-1/2 h-full hidden md:block">
           <div className="w-full h-full bg-gradient-to-l from-white to-transparent opacity-20 absolute z-10"></div>
           <Image
             src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=70&w=1000&auto=format&fit=crop"
             alt="Summer Collection Hero"
             fill
             priority={true}
             loading="eager"
             className="object-cover object-center"
             sizes="50vw"
           />
        </div>
      </section>

      {/* 2. Trust Badges */}
      <section className="py-12 bg-white border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div className="flex flex-col items-center transition-all duration-300 hover:scale-105 hover:shadow-sm p-4 rounded-xl">
              <Truck className="w-8 h-8 text-primary mb-3" />
              <h3 className="font-semibold text-text-primary">Free Global Shipping</h3>
              <p className="text-sm text-text-secondary mt-1">On all orders over $100</p>
            </div>
            <div className="flex flex-col items-center transition-all duration-300 hover:scale-105 hover:shadow-sm p-4 rounded-xl">
              <RotateCcw className="w-8 h-8 text-primary mb-3" />
              <h3 className="font-semibold text-text-primary">30-Day Easy Returns</h3>
              <p className="text-sm text-text-secondary mt-1">No questions asked return policy</p>
            </div>
            <div className="flex flex-col items-center transition-all duration-300 hover:scale-105 hover:shadow-sm p-4 rounded-xl">
              <ShieldCheck className="w-8 h-8 text-primary mb-3" />
              <h3 className="font-semibold text-text-primary">Secure Payments</h3>
              <p className="text-sm text-text-secondary mt-1">100% secure checkout via Stripe</p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Featured Categories (Mocked for UI aesthetics as per requirements) */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full md:animate-fade-in">
        <h2 className="text-3xl font-bold text-text-primary mb-8 text-center">Shop by Category</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { name: 'Electronics', img: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?q=60&w=400&auto=format&fit=crop' },
            { name: 'Fashion', img: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?q=60&w=400&auto=format&fit=crop' },
            { name: 'Home & Living', img: 'https://images.unsplash.com/photo-1484101403633-562f891dc89a?q=60&w=400&auto=format&fit=crop' },
            { name: 'Accessories', img: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=60&w=400&auto=format&fit=crop' }
          ].map((cat, i) => (
            <Link 
              href={`/products?category=${cat.name.toLowerCase()}`} 
              key={i} 
              className="group relative h-64 rounded-2xl overflow-hidden bg-gray-100 flex items-center justify-center transition-transform duration-300 ease-in-out hover:scale-105"
            >
              <div className="absolute inset-0 bg-black/25 group-hover:bg-black/45 transition-colors duration-300 z-10"></div>
              <Image
                src={cat.img}
                alt={cat.name}
                fill
                loading="lazy"
                className="object-cover transition-transform duration-500 group-hover:scale-110"
                sizes="(max-width: 768px) 50vw, 25vw"
              />
              <h3 className="relative z-20 text-white font-bold text-xl tracking-wide">{cat.name}</h3>
            </Link>
          ))}
        </div>
      </section>

      {/* 4. Best Sellers (Featured Products) */}
      <section className="py-16 bg-[#FAFAF9] md:animate-fade-in">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-end mb-8">
            <div>
              <h2 className="text-3xl font-bold text-text-primary">Best Sellers</h2>
              <p className="text-text-secondary mt-2">Our most popular products based on sales.</p>
            </div>
            <Link href="/products" className="hidden md:block text-primary font-medium hover:underline">View All</Link>
          </div>
          
          {featLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-80 w-full" />)}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {featuredData?.slice(0, 4).map((product: any) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* 5. Promo Banner */}
      <section className="py-20 bg-primary text-white text-center">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="text-4xl font-bold mb-4">Get 10% Off Your First Order</h2>
          <p className="text-lg text-primary-light mb-8">Join our community and elevate your lifestyle with premium essentials.</p>
          <div className="inline-block bg-white text-text-primary px-6 py-4 rounded-xl font-mono text-xl font-bold shadow-lg border-2 border-dashed border-gray-300">
            USE CODE: <span className="text-semantic-error">WELCOME10</span>
          </div>
        </div>
      </section>

      {/* 6. New Arrivals (Swiper Horizontal Scroll) */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full overflow-hidden md:animate-fade-in">
        <div className="flex justify-between items-end mb-8">
          <h2 className="text-3xl font-bold text-text-primary">New Arrivals</h2>
        </div>
        
        {newLoading || !isMounted ? (
          <div className="flex space-x-6 overflow-hidden">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-80 w-64 flex-shrink-0" />)}
          </div>
        ) : (
          <Swiper
            modules={[Navigation, Pagination]}
            spaceBetween={24}
            slidesPerView={1.2}
            breakpoints={{
              640: { slidesPerView: 2.5 },
              1024: { slidesPerView: 4 },
            }}
            navigation
            className="pb-12"
          >
            {newArrivalsData?.map((product: any) => (
              <SwiperSlide key={product._id}>
                <ProductCard product={product} />
              </SwiperSlide>
            ))}
          </Swiper>
        )}
      </section>

      {/* 7. Testimonials */}
      <section className="py-16 bg-[#F9FAFB] border-t border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-text-primary mb-12 text-center">Loved by Thousands</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { name: 'Sarah J.', review: 'Absolutely love the quality. Fast shipping and the packaging felt so premium. Will buy again!', stars: 5 },
              { name: 'Michael T.', review: 'The design is minimal but the functionality is exactly what I needed. Customer support was incredibly helpful.', stars: 5 },
              { name: 'Emma R.', review: 'I used the welcome voucher and got a great deal. The items look even better in person. Highly recommended.', stars: 4 },
            ].map((t, i) => (
              <div key={i} className="bg-white p-6 rounded-2xl shadow-sm border border-border">
                <div className="flex text-semantic-warning mb-4">
                  {[...Array(t.stars)].map((_, j) => <Star key={j} className="w-4 h-4 fill-current" />)}
                </div>
                <p className="text-text-secondary italic mb-4">"{t.review}"</p>
                <p className="font-semibold text-text-primary">- {t.name}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

    </div>
  );
}
