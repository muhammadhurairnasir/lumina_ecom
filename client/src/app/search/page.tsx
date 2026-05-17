'use client';

import { useState, useEffect, Suspense } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { api } from '@/lib/api';
import ProductCard from '@/components/products/ProductCard';
import { Skeleton } from '@/components/ui/Skeleton';
import { SlidersHorizontal, X } from 'lucide-react';

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="bg-background min-h-screen pb-20" />}>
      <SearchContent />
    </Suspense>
  );
}

function SearchContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // State for filters
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [minPrice, setMinPrice] = useState(searchParams.get('minPrice') || '');
  const [maxPrice, setMaxPrice] = useState(searchParams.get('maxPrice') || '');
  const [sort, setSort] = useState(searchParams.get('sort') || '-createdAt');
  const [page, setPage] = useState(Number(searchParams.get('page')) || 1);

  // Debounced Search Input
  const [inputValue, setInputValue] = useState(searchQuery);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (inputValue !== searchQuery) {
        setSearchQuery(inputValue);
        setPage(1); // Reset page on new search
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [inputValue, searchQuery]);

  // Update URL when filters change
  const applyFilters = () => {
    const params = new URLSearchParams();
    if (searchQuery) params.set('q', searchQuery);
    if (minPrice) params.set('minPrice', minPrice);
    if (maxPrice) params.set('maxPrice', maxPrice);
    if (sort) params.set('sort', sort);
    if (page > 1) params.set('page', page.toString());
    
    router.push(`${pathname}?${params.toString()}`);
    setMobileFiltersOpen(false);
  };

  // Sync state with URL params
  useEffect(() => {
    const q = searchParams.get('q') || '';
    setSearchQuery(q);
    setInputValue(q);
    setMinPrice(searchParams.get('minPrice') || '');
    setMaxPrice(searchParams.get('maxPrice') || '');
    setSort(searchParams.get('sort') || '-createdAt');
    setPage(Number(searchParams.get('page')) || 1);
  }, [searchParams]);

  // Fetch Products
  const { data, isLoading, error } = useQuery({
    queryKey: ['search', searchQuery, minPrice, maxPrice, sort, page],
    queryFn: async () => {
      const params = new URLSearchParams({
        limit: '12',
        page: page.toString(),
      });
      if (searchQuery) params.append('search', searchQuery);
      if (minPrice) params.append('minPrice', minPrice);
      if (maxPrice) params.append('maxPrice', maxPrice);
      if (sort) params.append('sort', sort);
      
      const res = await api.get(`/products?${params.toString()}`);
      if (!res.data?.success) throw new Error(res.data?.message || 'Search failed');
      const payload = res.data.data;
      const pagination = res.data.pagination;
      return {
        products: payload.products ?? [],
        total: payload.total ?? pagination?.total ?? 0,
        totalPages: payload.totalPages ?? pagination?.pages ?? 1,
      };
    },
    enabled: !!searchQuery // Only search if query exists
  });

  const totalPages = data?.totalPages || 1;

  return (
    <div className="bg-background min-h-screen pb-20">
      
      {/* Page Header */}
      <div className="bg-white border-b border-border py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto text-center">
            <h1 className="text-3xl font-bold text-text-primary mb-4">Search</h1>
            <input 
              type="text" 
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Search for products, brands, and more..."
              className="w-full text-lg px-6 py-4 border border-border rounded-full shadow-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
              autoFocus
            />
          </div>
          
          {searchQuery && (
            <div className="flex justify-between items-end mt-8">
              <p className="text-sm text-text-secondary">
                {isLoading ? 'Searching...' : `Found ${data?.total || 0} results for "${searchQuery}"`}
              </p>
              
              <button 
                className="md:hidden flex items-center space-x-2 text-sm font-medium border border-border px-4 py-2 rounded-md bg-white"
                onClick={() => setMobileFiltersOpen(true)}
              >
                <SlidersHorizontal className="w-4 h-4" />
                <span>Filters</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {searchQuery && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex gap-8">
          
          {/* Desktop Sidebar */}
          <div className="hidden md:block w-64 flex-shrink-0">
            <div className="sticky top-24 space-y-8">
              {/* Sort */}
              <div>
                <h3 className="font-semibold text-text-primary mb-4 pb-2 border-b border-border">Sort By</h3>
                <select 
                  value={sort} 
                  onChange={(e) => { setSort(e.target.value); setTimeout(applyFilters, 0); }}
                  className="w-full border border-border rounded-md text-sm py-2 px-3 focus:ring-primary focus:border-primary"
                >
                  <option value="-createdAt">Newest Arrivals</option>
                  <option value="price">Price: Low to High</option>
                  <option value="-price">Price: High to Low</option>
                  <option value="-rating">Top Rated</option>
                </select>
              </div>

              {/* Price Filter */}
              <div>
                <h3 className="font-semibold text-text-primary mb-4 pb-2 border-b border-border">Price Range</h3>
                <div className="flex items-center space-x-2">
                  <input type="number" placeholder="Min" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} className="w-full border border-border rounded-md px-3 py-2 text-sm focus:ring-primary" />
                  <span className="text-text-secondary">-</span>
                  <input type="number" placeholder="Max" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} className="w-full border border-border rounded-md px-3 py-2 text-sm focus:ring-primary" />
                </div>
                <button 
                  onClick={applyFilters}
                  className="mt-4 w-full bg-surface border border-border text-text-primary py-2 text-sm font-medium rounded-md hover:bg-gray-50 transition-colors"
                >
                  Apply Filters
                </button>
              </div>
            </div>
          </div>

          {/* Product Grid */}
          <div className="flex-1">
            {isLoading ? (
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-[340px] w-full" />)}
              </div>
            ) : error ? (
              <div className="text-center py-20 text-semantic-error">Failed to load search results.</div>
            ) : data?.products?.length === 0 ? (
              <div className="text-center py-20">
                <h2 className="text-2xl font-bold mb-2">No products found</h2>
                <p className="text-text-secondary mb-6">We couldn't find anything matching "{searchQuery}". Try different keywords.</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
                  {data?.products.map((product: any) => (
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
                    <span className="text-sm text-text-secondary px-4">Page {page} of {totalPages}</span>
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
      )}

      {/* Mobile Drawer (Truncated for brevity, similar to ProductsPage) */}
    </div>
  );
}
