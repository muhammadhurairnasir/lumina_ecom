'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  LayoutDashboard, 
  Package, 
  Tags, 
  ShoppingCart, 
  Users, 
  Ticket, 
  Star, 
  Settings, 
  Bell, 
  LogOut,
  Menu,
  X,
  FileText
} from 'lucide-react';
import { useStore } from '@/store/useStore';
import { api } from '@/lib/api';

const navigation = [
  { name: 'Dashboard',  href: '/admin',           icon: LayoutDashboard },
  { name: 'Products',   href: '/admin/products',   icon: Package },
  { name: 'Categories', href: '/admin/categories', icon: Tags },
  { name: 'Orders',     href: '/admin/orders',     icon: ShoppingCart },
  { name: 'Customers',  href: '/admin/customers',  icon: Users },
  { name: 'Vouchers',   href: '/admin/vouchers',   icon: Ticket },
  { name: 'Reviews',    href: '/admin/reviews',    icon: Star },
  { name: 'Blog',       href: '/admin/blog',       icon: FileText },
  { name: 'Settings',   href: '/admin/settings',   icon: Settings },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
    } catch { /* ignore */ }
    logout();
    router.push('/admin/login');
    router.refresh();
  };

  // Generate simple breadcrumbs
  const pathSegments = pathname.split('/').filter(p => p !== '');
  const breadcrumbs = pathSegments.map((segment, index) => {
    const url = `/${pathSegments.slice(0, index + 1).join('/')}`;
    const name = segment.charAt(0).toUpperCase() + segment.slice(1);
    return { name, url, isLast: index === pathSegments.length - 1 };
  });

  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-[#F1F5F9] flex">
      
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-border transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:flex-shrink-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="h-16 flex items-center px-6 border-b border-border bg-white">
          <Link href="/admin" className="text-xl font-bold text-primary tracking-tight">
            LUMINA ADMIN
          </Link>
          <button onClick={() => setSidebarOpen(false)} className="ml-auto lg:hidden">
            <X className="w-5 h-5 text-text-secondary" />
          </button>
        </div>
        
        <nav className="p-4 space-y-1 overflow-y-auto h-[calc(100vh-64px)]">
          {navigation.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                  isActive 
                    ? 'bg-primary text-white shadow-sm' 
                    : 'text-text-secondary hover:bg-gray-100 hover:text-text-primary'
                }`}
              >
                <item.icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-text-secondary'}`} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        
        {/* Topbar */}
        <header className="h-16 bg-white border-b border-border flex items-center justify-between px-4 sm:px-6 lg:px-8 z-30">
          <div className="flex items-center">
            <button onClick={() => setSidebarOpen(true)} className="mr-4 lg:hidden">
              <Menu className="w-6 h-6 text-text-secondary" />
            </button>
            
            {/* Breadcrumbs */}
            <nav className="hidden sm:flex text-sm text-text-secondary">
              {breadcrumbs.map((crumb, i) => (
                <div key={crumb.url} className="flex items-center">
                  {i > 0 && <span className="mx-2">/</span>}
                  {crumb.isLast ? (
                    <span className="font-medium text-text-primary">{crumb.name}</span>
                  ) : (
                    <Link href={crumb.url} className="hover:text-primary transition-colors">
                      {crumb.name}
                    </Link>
                  )}
                </div>
              ))}
            </nav>
          </div>

          <div className="flex items-center space-x-4">
            <button className="text-text-secondary hover:text-primary transition-colors relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-0 right-0 w-2 h-2 bg-semantic-error rounded-full"></span>
            </button>
            
            <div className="h-8 w-px bg-border mx-2"></div>
            
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-full bg-primary-light text-primary flex items-center justify-center font-bold text-sm">
                {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
              </div>
              <span className="text-sm font-medium text-text-primary hidden md:block">
                {user?.firstName} {user?.lastName}
              </span>
              <button onClick={handleLogout} className="ml-2 text-text-secondary hover:text-semantic-error transition-colors" title="Logout">
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>

    </div>
  );
}
