'use client';

import { useState, useEffect, Suspense } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { api } from '@/lib/api';
import ProductCard from '@/components/products/ProductCard';
import { Skeleton } from '@/components/ui/Skeleton';
import { SlidersHorizontal, X } from 'lucide-react';

export default function ProductsPage() {
  return (
    <Suspense fallback={<div className="bg-background min-h-screen pb-20" />}>
      <ProductsContent />
    </Suspense>
  );
}

function ProductsContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // State for filters
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [category, setCategory] = useState(searchParams.get('category') || '');
  const [minPrice, setMinPrice] = useState(searchParams.get('minPrice') || '');
  const [maxPrice, setMaxPrice] = useState(searchParams.get('maxPrice') || '');
  const [sort, setSort] = useState(searchParams.get('sort') || '-createdAt');
  const [page, setPage] = useState(Number(searchParams.get('page')) || 1);

  // Update URL when filters change
  const applyFilters = () => {
    const params = new URLSearchParams();
    if (category) params.set('category', category);
    if (minPrice) params.set('minPrice', minPrice);
    if (maxPrice) params.set('maxPrice', maxPrice);
    if (sort) params.set('sort', sort);
    if (page > 1) params.set('page', page.toString());
    
    router.push(`${pathname}?${params.toString()}`);
    setMobileFiltersOpen(false);
  };

  // Sync state with URL params on load/popstate
  useEffect(() => {
    setCategory(searchParams.get('category') || '');
    setMinPrice(searchParams.get('minPrice') || '');
    setMaxPrice(searchParams.get('maxPrice') || '');
    setSort(searchParams.get('sort') || '-createdAt');
    setPage(Number(searchParams.get('page')) || 1);
  }, [searchParams]);

  // Fetch Products
  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['products', category, minPrice, maxPrice, sort, page],
    queryFn: async () => {
      const params = new URLSearchParams({
        limit: '12',
        page: page.toString(),
      });
      if (category) params.append('category', category.toLowerCase());
      if (minPrice) params.append('minPrice', minPrice);
      if (maxPrice) params.append('maxPrice', maxPrice);
      if (sort) params.append('sort', sort);

      const res = await api.get(`/products?${params.toString()}`);
      if (!res.data?.success) {
        throw new Error(res.data?.message || 'Failed to load products');
      }
      const payload = res.data.data;
      const pagination = res.data.pagination;
      return {
        products: payload.products ?? [],
        total: payload.total ?? pagination?.total ?? 0,
        totalPages: payload.totalPages ?? pagination?.pages ?? 1,
        filters: payload.filters,
      };
    },
    retry: 1,
  });

  // Fetch Categories for Sidebar
  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await api.get('/categories');
      return res.data.data.categories;
    }
  });

  const totalPages = data?.totalPages || 1;

  return (
    <div className="bg-background min-h-screen pb-20">
      
      {/* Page Header */}
      <div className="bg-white border-b border-border py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-bold text-text-primary">All Products</h1>
            <p className="text-sm text-text-secondary mt-2">
              Showing {data?.products?.length || 0} of {data?.total || 0} results
            </p>
          </div>
          
          {/* Desktop Sort */}
          <div className="hidden md:flex items-center space-x-2">
            <span className="text-sm text-text-secondary">Sort by:</span>
            <select 
              value={sort} 
              onChange={(e) => { setSort(e.target.value); setTimeout(applyFilters, 0); }}
              className="border border-border rounded-md text-sm py-1.5 pl-3 pr-8 focus:ring-primary focus:border-primary"
            >
              <option value="-createdAt">Newest Arrivals</option>
              <option value="price">Price: Low to High</option>
              <option value="-price">Price: High to Low</option>
              <option value="-rating">Top Rated</option>
            </select>
          </div>

          {/* Mobile Filter Toggle */}
          <button 
            className="md:hidden flex items-center space-x-2 text-sm font-medium border border-border px-4 py-2 rounded-md bg-white"
            onClick={() => setMobileFiltersOpen(true)}
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span>Filters</span>
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex gap-8">
        
        {/* Desktop Sidebar */}
        <div className="hidden md:block w-64 flex-shrink-0">
          <div className="sticky top-24 space-y-8">
            
            {/* Category Filter */}
            <div>
              <h3 className="font-semibold text-text-primary mb-4 pb-2 border-b border-border">Categories</h3>
              <div className="space-y-2">
                <button 
                  onClick={() => { setCategory(''); setTimeout(applyFilters, 0); }}
                  className={`block text-sm ${!category ? 'text-primary font-medium' : 'text-text-secondary hover:text-text-primary'}`}
                >
                  All Categories
                </button>
                {(Array.isArray(categoriesData) ? categoriesData : []).map((cat: { _id: string; name: string; slug: string }) => (
                  <button
                    key={cat._id}
                    onClick={() => { setCategory(cat.slug); setTimeout(applyFilters, 0); }}
                    className={`block text-sm ${category === cat.slug ? 'text-primary font-medium' : 'text-text-secondary hover:text-text-primary'}`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Price Filter */}
            <div>
              <h3 className="font-semibold text-text-primary mb-4 pb-2 border-b border-border">Price Range</h3>
              <div className="flex items-center space-x-2">
                <input 
                  type="number" 
                  placeholder="Min" 
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  className="w-full border border-border rounded-md px-3 py-2 text-sm focus:ring-primary focus:border-primary"
                />
                <span className="text-text-secondary">-</span>
                <input 
                  type="number" 
                  placeholder="Max" 
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  className="w-full border border-border rounded-md px-3 py-2 text-sm focus:ring-primary focus:border-primary"
                />
              </div>
              <button 
                onClick={applyFilters}
                className="mt-4 w-full bg-surface border border-border text-text-primary py-2 text-sm font-medium rounded-md hover:bg-gray-50 transition-colors"
              >
                Apply
              </button>
            </div>

          </div>
        </div>

        {/* Product Grid */}
        <div className="flex-1">
          {isLoading ? (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(12)].map((_, i) => <Skeleton key={i} className="h-[340px] w-full" />)}
            </div>
          ) : error ? (
            <div className="text-center py-20">
              <p className="text-semantic-error font-medium">Failed to load products.</p>
              <p className="text-sm text-text-secondary mt-2 max-w-md mx-auto">
                {(error as Error).message?.includes('Network')
                  ? 'Cannot reach the API. Make sure the server is running on port 5000.'
                  : (error as Error).message || 'Please try again.'}
              </p>
              <button
                type="button"
                onClick={() => refetch()}
                disabled={isFetching}
                className="mt-4 px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:opacity-90 disabled:opacity-50"
              >
                {isFetching ? 'Retrying…' : 'Retry'}
              </button>
            </div>
          ) : data?.products?.length === 0 ? (
            <div className="text-center py-20">
              <h2 className="text-2xl font-bold mb-2">No products found</h2>
              <p className="text-text-secondary mb-6">Try adjusting your filters to find what you're looking for.</p>
              <button onClick={() => { setCategory(''); setMinPrice(''); setMaxPrice(''); setTimeout(applyFilters, 0); }} className="text-primary font-medium hover:underline">
                Clear all filters
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
                {(Array.isArray(data?.products) ? data.products : []).map((product: any) => (
                  <ProductCard key={product._id} product={product} />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-12 flex justify-center items-center space-x-2">
                  <button 
                    disabled={page === 1}
                    onClick={() => { setPage(p => p - 1); setTimeout(applyFilters, 0); }}
                    className="px-4 py-2 border border-border rounded-md text-sm font-medium disabled:opacity-50 hover:bg-gray-50"
                  >
                    Previous
                  </button>
                  <span className="text-sm text-text-secondary px-4">
                    Page {page} of {totalPages}
                  </span>
                  <button 
                    disabled={page === totalPages}
                    onClick={() => { setPage(p => p + 1); setTimeout(applyFilters, 0); }}
                    className="px-4 py-2 border border-border rounded-md text-sm font-medium disabled:opacity-50 hover:bg-gray-50"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Mobile Filters Drawer */}
      {mobileFiltersOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div className="fixed inset-0 bg-black/50" onClick={() => setMobileFiltersOpen(false)} />
          <div className="mt-auto w-full max-h-[85vh] bg-white rounded-t-2xl p-6 relative flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">Filters</h2>
              <button onClick={() => setMobileFiltersOpen(false)} className="p-2"><X className="w-5 h-5" /></button>
            </div>
            
            <div className="flex-1 overflow-y-auto space-y-6">
               {/* Sort */}
              <div>
                <h3 className="font-semibold mb-3">Sort By</h3>
                <select 
                  value={sort} 
                  onChange={(e) => setSort(e.target.value)}
                  className="w-full border border-border rounded-md text-sm py-2 px-3 focus:ring-primary"
                >
                  <option value="-createdAt">Newest Arrivals</option>
                  <option value="price">Price: Low to High</option>
                  <option value="-price">Price: High to Low</option>
                  <option value="-rating">Top Rated</option>
                </select>
              </div>

              {/* Price */}
              <div>
                <h3 className="font-semibold mb-3">Price Range</h3>
                <div className="flex items-center space-x-2">
                  <input type="number" placeholder="Min" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} className="w-full border border-border rounded-md px-3 py-2 text-sm focus:ring-primary" />
                  <span>-</span>
                  <input type="number" placeholder="Max" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} className="w-full border border-border rounded-md px-3 py-2 text-sm focus:ring-primary" />
                </div>
              </div>
            </div>

            <div className="mt-6 border-t border-border pt-4">
              <button onClick={applyFilters} className="w-full bg-primary text-white py-3 rounded-xl font-medium hover:bg-primary-light hover:text-primary transition-colors">
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
