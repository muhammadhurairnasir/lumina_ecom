'use client';

import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-surface border-t border-border mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <Link href="/" className="font-bold text-2xl tracking-tighter text-text-primary">
              LUMINA
            </Link>
            <p className="mt-4 text-sm text-text-secondary">
              Premium quality essentials designed for everyday living. Built to last, styled to impress.
            </p>
          </div>
          
          <div>
            <h3 className="font-semibold text-text-primary mb-4">Shop</h3>
            <ul className="space-y-3 text-sm text-text-secondary">
              <li><Link href="/products" className="hover:text-primary transition-colors">All Products</Link></li>
              <li><Link href="/products?category=new" className="hover:text-primary transition-colors">New Arrivals</Link></li>
              <li><Link href="/products?category=sale" className="hover:text-primary transition-colors">Sale</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-text-primary mb-4">Support</h3>
            <ul className="space-y-3 text-sm text-text-secondary">
              <li><Link href="/faq" className="hover:text-primary transition-colors">FAQ</Link></li>
              <li><Link href="/shipping" className="hover:text-primary transition-colors">Shipping & Returns</Link></li>
              <li><Link href="/contact" className="hover:text-primary transition-colors">Contact Us</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-text-primary mb-4">Newsletter</h3>
            <p className="text-sm text-text-secondary mb-4">Subscribe to receive updates, access to exclusive deals, and more.</p>
            <form className="flex" onSubmit={(e) => e.preventDefault()}>
              <input 
                type="email" 
                placeholder="Enter your email" 
                className="w-full px-4 py-2 text-sm border border-border rounded-l-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
              <button 
                type="submit" 
                className="px-4 py-2 bg-primary text-white text-sm font-medium rounded-r-md hover:bg-primary-light hover:text-primary transition-colors"
              >
                Subscribe
              </button>
            </form>
          </div>
        </div>
        
        <div className="mt-12 pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center">
          <p className="text-sm text-text-secondary">
            &copy; {new Date().getFullYear()} Lumina Store. All rights reserved.
          </p>
          <div className="flex space-x-6 mt-4 md:mt-0 text-sm text-text-secondary">
            <Link href="/privacy" className="hover:text-primary transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-primary transition-colors">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
