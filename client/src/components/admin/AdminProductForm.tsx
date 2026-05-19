'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery } from '@tanstack/react-query';
import dynamic from 'next/dynamic';
import { useDropzone } from 'react-dropzone';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';
import { Sparkles, Loader2, X, UploadCloud, Save, ArrowLeft, Plus } from 'lucide-react';
import Link from 'next/link';

const ReactQuill = dynamic(() => import('react-quill'), { ssr: false, loading: () => <p className="text-sm text-text-secondary">Loading editor...</p> });
import 'react-quill/dist/quill.snow.css';

type SpecRow = { key: string; value: string };

interface ProductFormValues {
  name: string;
  brand: string;
  category: string;
  price: number;
  compareAtPrice: number;
  stock: number;
  sku: string;
  seoTitle: string;
  seoDescription: string;
  seoKeywords: string;
  tags: string;
  isActive: boolean;
  isFeatured: boolean;
}

export default function AdminProductForm({ productId }: { productId?: string }) {
  const router = useRouter();
  const isEdit = Boolean(productId);

  const [description, setDescription] = useState('');
  const [imageUrls, setImageUrls] = useState('');
  const [specs, setSpecs] = useState<SpecRow[]>([{ key: '', value: '' }]);
  const [isGeneratingSEO, setIsGeneratingSEO] = useState(false);

  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<ProductFormValues>({
    defaultValues: {
      name: '',
      brand: '',
      category: '',
      price: 0,
      compareAtPrice: 0,
      stock: 0,
      sku: '',
      seoTitle: '',
      seoDescription: '',
      seoKeywords: '',
      tags: '',
      isActive: true,
      isFeatured: false,
    },
  });

  const { data: categories } = useQuery({
    queryKey: ['admin-categories'],
    queryFn: async () => {
      const res = await api.get('/admin/categories');
      return res.data.data.categories;
    },
  });

  const { data: existingProduct, isLoading: loadingProduct } = useQuery({
    queryKey: ['admin-product', productId],
    queryFn: async () => {
      const res = await api.get(`/admin/products/${productId}`);
      return res.data.data.product;
    },
    enabled: isEdit,
  });

  useEffect(() => {
    if (!existingProduct) return;
    reset({
      name: existingProduct.name || '',
      brand: existingProduct.brand || '',
      category: existingProduct.category?._id || existingProduct.category || '',
      price: existingProduct.price || 0,
      compareAtPrice: existingProduct.compareAtPrice || 0,
      stock: existingProduct.stock || 0,
      sku: existingProduct.sku || '',
      seoTitle: existingProduct.seoTitle || '',
      seoDescription: existingProduct.seoDescription || '',
      seoKeywords: (existingProduct.seoKeywords || []).join(', '),
      tags: (existingProduct.tags || []).join(', '),
      isActive: existingProduct.isActive !== false,
      isFeatured: Boolean(existingProduct.isFeatured),
    });
    setDescription(existingProduct.description || '');
    setImageUrls((existingProduct.images || []).map((img: { url: string }) => img.url).join('\n'));
    setSpecs(
      existingProduct.specifications?.length
        ? existingProduct.specifications
        : [{ key: '', value: '' }]
    );
  }, [existingProduct, reset]);

  const onDrop = (acceptedFiles: File[]) => {
    acceptedFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = typeof reader.result === 'string' ? reader.result : '';
        if (!dataUrl) return;
        setImageUrls((prev) => (prev ? `${prev}\n${dataUrl}` : dataUrl));
      };
      reader.readAsDataURL(file);
    });
  };
  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, accept: { 'image/*': [] } });

  const handleGenerateSEO = async () => {
    const name = watch('name');
    if (!name || !description) {
      toast.error('Please fill out Name and Description first');
      return;
    }
    setIsGeneratingSEO(true);
    try {
      await new Promise((r) => setTimeout(r, 800));
      setValue('seoTitle', `Buy ${name} | Premium Quality | Lumina Store`);
      setValue(
        'seoDescription',
        `Discover ${name}. ${description.replace(/<[^>]*>?/gm, '').substring(0, 120)}...`
      );
      setValue('seoKeywords', `${name.toLowerCase()}, premium, lumina`);
      toast.success('SEO fields generated');
    } finally {
      setIsGeneratingSEO(false);
    }
  };

  const saveMutation = useMutation({
    mutationFn: async (data: ProductFormValues) => {
      const images = imageUrls
        .split('\n')
        .map((url) => url.trim())
        .filter(Boolean)
        .map((url) => ({ url, publicId: url, alt: data.name }));

      const payload = {
        ...data,
        description,
        images,
        specifications: specs.filter((s) => s.key && s.value),
        seoKeywords: data.seoKeywords,
        tags: data.tags ? data.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
        compareAtPrice: data.compareAtPrice || undefined,
      };

      if (isEdit) {
        await api.put(`/admin/products/${productId}`, payload);
      } else {
        await api.post('/admin/products', payload);
      }
    },
    onSuccess: () => {
      toast.success(isEdit ? 'Product updated' : 'Product created');
      router.push('/admin/products');
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to save product'),
  });

  if (isEdit && loadingProduct) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/admin/products" className="p-2 border border-border rounded-lg bg-white/80 backdrop-blur hover:bg-white">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-2xl font-bold text-text-primary">{isEdit ? 'Edit Product' : 'Add New Product'}</h1>
        </div>
        <button
          onClick={handleSubmit((data) => saveMutation.mutate(data))}
          disabled={saveMutation.isPending}
          className="flex items-center px-6 py-2.5 bg-primary text-white font-medium rounded-lg hover:opacity-90 transition shadow-sm disabled:opacity-50"
        >
          {saveMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Save className="w-5 h-5 mr-2" /> Save Product</>}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <section className="bg-white/80 backdrop-blur p-6 rounded-xl border border-border shadow-sm space-y-4">
            <h2 className="text-lg font-bold text-text-primary">Basic Information</h2>
            <div>
              <label className="block text-sm font-medium mb-1">Product Name</label>
              <input {...register('name', { required: true })} className="w-full border border-border rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-primary" />
              {errors.name && <p className="text-xs text-red-500 mt-1">Name is required</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <div className="h-64 mb-12">
                <ReactQuill theme="snow" value={description} onChange={setDescription} />
              </div>
            </div>
          </section>

          <section className="bg-white/80 backdrop-blur p-6 rounded-xl border border-border shadow-sm space-y-4">
            <h2 className="text-lg font-bold text-text-primary">Product Images</h2>
            <div {...getRootProps()} className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer ${isDragActive ? 'border-primary bg-primary/5' : 'border-border hover:bg-gray-50'}`}>
              <input {...getInputProps()} />
              <UploadCloud className="w-10 h-10 text-text-secondary mx-auto mb-2" />
              <p className="text-sm">Drop images or paste URLs below (one per line)</p>
            </div>
            <textarea
              value={imageUrls}
              onChange={(e) => setImageUrls(e.target.value)}
              rows={4}
              placeholder="https://images.unsplash.com/..."
              className="w-full border border-border rounded-lg px-3 py-2 text-sm font-mono"
            />
          </section>

          <section className="bg-white/80 backdrop-blur p-6 rounded-xl border border-border shadow-sm space-y-4">
            <h2 className="text-lg font-bold text-text-primary">Specifications</h2>
            {specs.map((spec, i) => (
              <div key={i} className="grid grid-cols-2 gap-3">
                <input
                  value={spec.key}
                  onChange={(e) => {
                    const next = [...specs];
                    next[i] = { ...next[i], key: e.target.value };
                    setSpecs(next);
                  }}
                  placeholder="Key (e.g. Material)"
                  className="border border-border rounded-lg px-3 py-2 text-sm"
                />
                <div className="flex gap-2">
                  <input
                    value={spec.value}
                    onChange={(e) => {
                      const next = [...specs];
                      next[i] = { ...next[i], value: e.target.value };
                      setSpecs(next);
                    }}
                    placeholder="Value"
                    className="flex-1 border border-border rounded-lg px-3 py-2 text-sm"
                  />
                  {specs.length > 1 && (
                    <button type="button" onClick={() => setSpecs(specs.filter((_, idx) => idx !== i))} className="p-2 text-red-500">
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
            <button type="button" onClick={() => setSpecs([...specs, { key: '', value: '' }])} className="text-sm text-primary flex items-center gap-1">
              <Plus className="w-4 h-4" /> Add specification
            </button>
          </section>

          <section className="bg-white/80 backdrop-blur p-6 rounded-xl border border-border shadow-sm">
            <h2 className="text-lg font-bold text-text-primary mb-4">Pricing & Inventory</h2>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-1">Price ($)</label>
                <input type="number" step="0.01" {...register('price', { required: true, valueAsNumber: true, min: 0 })} className="w-full border border-border rounded-lg px-4 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Compare at Price ($)</label>
                <input type="number" step="0.01" {...register('compareAtPrice', { valueAsNumber: true, min: 0 })} className="w-full border border-border rounded-lg px-4 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Stock</label>
                <input type="number" {...register('stock', { required: true, valueAsNumber: true, min: 0 })} className="w-full border border-border rounded-lg px-4 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">SKU</label>
                <input type="text" {...register('sku')} className="w-full border border-border rounded-lg px-4 py-2 text-sm" />
              </div>
            </div>
          </section>
        </div>

        <div className="space-y-8">
          <section className="bg-white/80 backdrop-blur p-6 rounded-xl border border-border shadow-sm space-y-4">
            <h2 className="text-lg font-bold text-text-primary">Organization</h2>
            <div>
              <label className="block text-sm font-medium mb-1">Category</label>
              <select {...register('category', { required: true })} className="w-full border border-border rounded-lg px-4 py-2 text-sm bg-white">
                <option value="">Select category</option>
                {categories?.map((c: { _id: string; name: string }) => (
                  <option key={c._id} value={c._id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Brand</label>
              <input type="text" {...register('brand')} className="w-full border border-border rounded-lg px-4 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Tags</label>
              <input type="text" {...register('tags')} placeholder="summer, evergreen, electronics" className="w-full border border-border rounded-lg px-4 py-2 text-sm" />
              <p className="text-xs text-text-secondary mt-1.5 leading-relaxed bg-blue-50/50 p-2 rounded border border-blue-100">
                💡 <strong>Tags power the AI stock forecast system.</strong><br/>
                Seasonal tags: <em>'summer', 'winter', 'holiday', 'electronics', 'accessories'</em> trigger demand multipliers automatically.<br/>
                Use <em>'evergreen'</em> or <em>'all-season'</em> for products that sell consistently year-round. Applied automatically to all future products.
              </p>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" {...register('isActive')} className="rounded" />
              Active on storefront
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" {...register('isFeatured')} className="rounded" />
              Featured product
            </label>
          </section>

          <section className="bg-white/80 backdrop-blur p-6 rounded-xl border border-border shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-text-primary">SEO</h2>
              <button type="button" onClick={handleGenerateSEO} disabled={isGeneratingSEO} className="text-primary p-2 rounded-full hover:bg-primary/10">
                {isGeneratingSEO ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
              </button>
            </div>
            <input type="text" {...register('seoTitle')} placeholder="SEO title" className="w-full border border-border rounded-lg px-4 py-2 text-sm" />
            <textarea {...register('seoDescription')} rows={3} placeholder="SEO description" className="w-full border border-border rounded-lg px-4 py-2 text-sm resize-none" />
            <input type="text" {...register('seoKeywords')} placeholder="keyword1, keyword2" className="w-full border border-border rounded-lg px-4 py-2 text-sm" />
          </section>
        </div>
      </div>
    </div>
  );
}
