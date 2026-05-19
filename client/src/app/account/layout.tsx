'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Package, User as UserIcon, Heart, LogOut } from 'lucide-react';
import { useStore } from '@/store/useStore';
import toast from 'react-hot-toast';

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  const { user, accessToken, logout } = useStore();
  const router = useRouter();

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !accessToken && !user) {
      router.push('/login');
    }
  }, [mounted, accessToken, user, router]);

  if (!mounted || !user) return null;

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <div className="bg-background min-h-screen pb-20">
      <div className="bg-white border-b border-border py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-text-primary">My Account</h1>
          <p className="text-sm text-text-secondary mt-2">Welcome back, {user.firstName}!</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col md:flex-row gap-8">
        
        {/* Sidebar Navigation */}
        <aside className="w-full md:w-64 flex-shrink-0">
          <nav className="space-y-1 bg-white border border-border rounded-xl p-4 shadow-sm">
            <Link href="/account" className="flex items-center space-x-3 px-3 py-2 text-sm font-medium rounded-lg text-text-primary hover:bg-gray-50">
               <UserIcon className="w-5 h-5 text-text-secondary" />
               <span>Dashboard</span>
            </Link>
            <Link href="/account/orders" className="flex items-center space-x-3 px-3 py-2 text-sm font-medium rounded-lg text-text-primary hover:bg-gray-50">
               <Package className="w-5 h-5 text-text-secondary" />
               <span>Orders</span>
            </Link>
            <button onClick={() => toast('Wishlist coming soon', { icon: '🤍' })} className="w-full flex items-center space-x-3 px-3 py-2 text-sm font-medium rounded-lg text-text-primary hover:bg-gray-50">
               <Heart className="w-5 h-5 text-text-secondary" />
               <span>Wishlist</span>
            </button>
            <div className="border-t border-border mt-4 pt-4">
              <button onClick={handleLogout} className="w-full flex items-center space-x-3 px-3 py-2 text-sm font-medium rounded-lg text-semantic-error hover:bg-red-50 transition-colors">
                <LogOut className="w-5 h-5" />
                <span>Log out</span>
              </button>
            </div>
          </nav>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1">
          {children}
        </main>

      </div>
    </div>
  );
}
