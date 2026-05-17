'use client';

import AdminProductForm from '@/components/admin/AdminProductForm';

export default function EditProductPage({ params }: { params: { id: string } }) {
  return <AdminProductForm productId={params.id} />;
}
