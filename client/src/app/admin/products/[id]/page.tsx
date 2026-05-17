import { redirect } from 'next/navigation';

export default function ProductDetailsRedirect({ params }: { params: { id: string } }) {
  redirect(`/admin/products/${params.id}/edit`);
}
