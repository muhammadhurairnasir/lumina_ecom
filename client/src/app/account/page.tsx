'use client';

import { useStore } from '@/store/useStore';
import Link from 'next/link';

export default function AccountDashboard() {
  const { user } = useStore();

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl border border-border shadow-sm">
        <h2 className="text-xl font-bold text-text-primary mb-4">Profile Information</h2>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-text-secondary mb-1">First Name</p>
            <p className="font-medium text-text-primary">{user?.firstName}</p>
          </div>
          <div>
            <p className="text-text-secondary mb-1">Last Name</p>
            <p className="font-medium text-text-primary">{user?.lastName}</p>
          </div>
          <div className="col-span-2">
            <p className="text-text-secondary mb-1">Email Address</p>
            <p className="font-medium text-text-primary">{user?.email}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl border border-border shadow-sm flex flex-col justify-center items-center text-center">
           <h3 className="font-bold text-lg mb-2">Track Your Orders</h3>
           <p className="text-sm text-text-secondary mb-4">View your recent orders, download invoices, and track shipments.</p>
           <Link href="/account/orders" className="px-6 py-2 border border-primary text-primary font-medium rounded-lg hover:bg-primary-light transition-colors">
             View Orders
           </Link>
        </div>
      </div>
    </div>
  );
}
