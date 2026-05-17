'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ShoppingBag, User, Search, Menu, X } from 'lucide-react';
import { useStore } from '@/store/useStore';

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const cartItemsCount = useStore((state) => state.cart.items.reduce((acc, item) => acc + item.quantity, 0));
  const user = useStore((state) => state.user);

  // Determine if we should be transparent at top. Usually only on homepage.
  const isHomePage = pathname === '/';

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const headerClass = `fixed w-full top-0 z-50 transition-colors duration-300 ${
    isScrolled || !isHomePage ? 'bg-surface shadow-sm text-text-primary' : 'bg-transparent text-white'
  }`;

  return (
    <header className={headerClass}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="font-bold text-2xl tracking-tighter">
            LUMINA
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex space-x-8">
            <Link href="/products?category=new" className="hover:text-primary transition-colors">New Arrivals</Link>
            <Link href="/products" className="hover:text-primary transition-colors">Shop All</Link>
            <Link href="/products?category=sale" className="hover:text-primary transition-colors text-semantic-error">Sale</Link>
          </nav>

          {/* Icons */}
          <div className="hidden md:flex items-center space-x-6">
            <Link href="/search" aria-label="Search" className="hover:text-primary transition-colors">
              <Search className="w-5 h-5" />
            </Link>
            <Link href={user ? "/account" : "/login"} aria-label="Account" className="hover:text-primary transition-colors">
              <User className="w-5 h-5" />
            </Link>
            <Link href="/cart" aria-label="Cart" className="relative hover:text-primary transition-colors">
              <ShoppingBag className="w-5 h-5" />
              {cartItemsCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-primary text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                  {cartItemsCount}
                </span>
              )}
            </Link>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center space-x-4">
             <Link href="/cart" aria-label="Cart" className="relative">
              <ShoppingBag className="w-5 h-5" />
              {cartItemsCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-primary text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                  {cartItemsCount}
                </span>
              )}
            </Link>
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Nav */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-surface text-text-primary absolute w-full border-b border-border shadow-lg">
          <div className="px-4 pt-2 pb-6 space-y-4">
            <Link href="/products" className="block px-3 py-2 text-base font-medium hover:bg-border rounded-md" onClick={() => setMobileMenuOpen(false)}>Shop</Link>
            <Link href="/search" className="block px-3 py-2 text-base font-medium hover:bg-border rounded-md" onClick={() => setMobileMenuOpen(false)}>Search</Link>
            <Link href={user ? "/account" : "/login"} className="block px-3 py-2 text-base font-medium hover:bg-border rounded-md" onClick={() => setMobileMenuOpen(false)}>
              {user ? 'My Account' : 'Sign In'}
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
