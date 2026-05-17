'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, Loader2, FileText, Eye, EyeOff } from 'lucide-react';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const EMPTY_FORM = {
  title: '', slug: '', excerpt: '', content: '',
  coverImage: '', author: 'Lumina Editorial', category: 'Lifestyle',
  tags: '', readTime: 5, isPublished: true, seoTitle: '', seoDescription: '',
};

const CATEGORIES = ['Lifestyle', 'Electronics', 'Fashion', 'Home & Living', 'Accessories', 'Guide'];

export default function AdminBlogPage() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });

  const { data, isLoading } = useQuery({
    queryKey: ['admin-blog'],
    queryFn: async () => {
      const res = await api.get('/admin/blog?limit=50');
      return res.data.data;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (payload: any) => {
      if (editing) return api.put(`/admin/blog/${editing}`, payload);
      return api.post('/admin/blog', payload);
    },
    onSuccess: () => {
      toast.success(editing ? 'Post updated!' : 'Post created!');
      queryClient.invalidateQueries({ queryKey: ['admin-blog'] });
      setShowForm(false);
      setEditing(null);
      setForm({ ...EMPTY_FORM });
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to save post'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => api.delete(`/admin/blog/${id}`),
    onSuccess: () => {
      toast.success('Post deleted');
      queryClient.invalidateQueries({ queryKey: ['admin-blog'] });
    },
  });

  const handleEdit = async (post: any) => {
    const res = await api.get(`/admin/blog/${post._id}`);
    const p = res.data.data.post;
    setForm({
      title: p.title, slug: p.slug, excerpt: p.excerpt, content: p.content,
      coverImage: p.coverImage || '', author: p.author, category: p.category,
      tags: p.tags?.join(', ') || '', readTime: p.readTime, isPublished: p.isPublished,
      seoTitle: p.seoTitle || '', seoDescription: p.seoDescription || '',
    });
    setEditing(post._id);
    setShowForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate({
      ...form,
      tags: form.tags.split(',').map((t: string) => t.trim()).filter(Boolean),
    });
  };

  const posts = data?.posts || [];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Blog Posts</h1>
          <p className="text-sm text-text-secondary mt-0.5">{data?.total || 0} posts</p>
        </div>
        <button
          onClick={() => { setShowForm(true); setEditing(null); setForm({ ...EMPTY_FORM }); }}
          className="flex items-center gap-1.5 px-4 py-2 bg-primary text-white font-medium rounded-lg hover:opacity-90 transition shadow-sm"
        >
          <Plus className="w-4 h-4" /> New Post
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-white border border-border rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-bold mb-5">{editing ? 'Edit Post' : 'New Blog Post'}</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Title *</label>
                <input required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
                  className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:ring-primary focus:border-primary" placeholder="How to Style a Minimalist Home..." />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Slug (auto-filled)</label>
                <input value={form.slug} onChange={e => setForm({ ...form, slug: e.target.value })}
                  className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:ring-primary focus:border-primary" placeholder="how-to-style-minimalist-home" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Excerpt *</label>
              <textarea required rows={2} value={form.excerpt} onChange={e => setForm({ ...form, excerpt: e.target.value })}
                className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:ring-primary focus:border-primary resize-none" placeholder="A short summary shown on the blog listing page..." />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Content (HTML) *</label>
              <textarea required rows={10} value={form.content} onChange={e => setForm({ ...form, content: e.target.value })}
                className="w-full border border-border rounded-lg px-3 py-2 text-sm font-mono focus:ring-primary focus:border-primary resize-y"
                placeholder="<h2>Introduction</h2><p>Your blog content here...</p>" />
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Category</label>
                <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
                  className="w-full border border-border rounded-lg px-3 py-2 text-sm">
                  {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Author</label>
                <input value={form.author} onChange={e => setForm({ ...form, author: e.target.value })}
                  className="w-full border border-border rounded-lg px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Read Time (min)</label>
                <input type="number" min={1} value={form.readTime} onChange={e => setForm({ ...form, readTime: parseInt(e.target.value) })}
                  className="w-full border border-border rounded-lg px-3 py-2 text-sm" />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Cover Image URL</label>
                <input value={form.coverImage} onChange={e => setForm({ ...form, coverImage: e.target.value })}
                  className="w-full border border-border rounded-lg px-3 py-2 text-sm" placeholder="https://..." />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Tags (comma separated)</label>
                <input value={form.tags} onChange={e => setForm({ ...form, tags: e.target.value })}
                  className="w-full border border-border rounded-lg px-3 py-2 text-sm" placeholder="fashion, minimalism, tips" />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">SEO Title</label>
                <input value={form.seoTitle} onChange={e => setForm({ ...form, seoTitle: e.target.value })}
                  className="w-full border border-border rounded-lg px-3 py-2 text-sm" placeholder="Auto-generated if left blank" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">SEO Description</label>
                <input value={form.seoDescription} onChange={e => setForm({ ...form, seoDescription: e.target.value })}
                  className="w-full border border-border rounded-lg px-3 py-2 text-sm" placeholder="Auto-generated from excerpt if blank" />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input type="checkbox" id="pub" checked={form.isPublished} onChange={e => setForm({ ...form, isPublished: e.target.checked })} className="rounded" />
              <label htmlFor="pub" className="text-sm font-medium">Published (visible on blog)</label>
            </div>

            <div className="flex gap-3 pt-2">
              <button type="submit" disabled={saveMutation.isPending}
                className="px-6 py-2.5 bg-primary text-white font-medium rounded-lg hover:opacity-90 disabled:opacity-50 flex items-center gap-2">
                {saveMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                {editing ? 'Update Post' : 'Create Post'}
              </button>
              <button type="button" onClick={() => { setShowForm(false); setEditing(null); setForm({ ...EMPTY_FORM }); }}
                className="px-6 py-2.5 border border-border rounded-lg text-sm hover:bg-gray-50">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Posts Table */}
      <div className="bg-white border border-border rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50 text-xs text-text-secondary uppercase border-b border-border">
            <tr>
              <th className="px-5 py-3">Title</th>
              <th className="px-5 py-3">Category</th>
              <th className="px-5 py-3">Author</th>
              <th className="px-5 py-3">Published</th>
              <th className="px-5 py-3">Date</th>
              <th className="px-5 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading ? (
              [...Array(5)].map((_, i) => (
                <tr key={i}><td colSpan={6} className="px-5 py-4"><div className="h-5 bg-gray-100 rounded animate-pulse" /></td></tr>
              ))
            ) : posts.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-16 text-center">
                  <FileText className="w-10 h-10 text-gray-200 mx-auto mb-2" />
                  <p className="text-text-secondary">No posts yet. Create your first one!</p>
                </td>
              </tr>
            ) : (
              posts.map((post: any) => (
                <tr key={post._id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-4">
                    <p className="font-medium text-text-primary line-clamp-1">{post.title}</p>
                    <p className="text-xs text-text-secondary font-mono">/blog/{post.slug}</p>
                  </td>
                  <td className="px-5 py-4 text-text-secondary">{post.category}</td>
                  <td className="px-5 py-4 text-text-secondary">{post.author}</td>
                  <td className="px-5 py-4">
                    {post.isPublished
                      ? <span className="flex items-center gap-1 text-emerald-600 text-xs font-semibold"><Eye className="w-3.5 h-3.5" />Live</span>
                      : <span className="flex items-center gap-1 text-gray-400 text-xs"><EyeOff className="w-3.5 h-3.5" />Draft</span>
                    }
                  </td>
                  <td className="px-5 py-4 text-text-secondary text-xs">
                    {format(new Date(post.createdAt), 'MMM d, yyyy')}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => handleEdit(post)}
                        className="p-1.5 text-text-secondary hover:text-primary hover:bg-blue-50 rounded-lg transition">
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button onClick={() => { if (confirm(`Delete "${post.title}"?`)) deleteMutation.mutate(post._id); }}
                        disabled={deleteMutation.isPending}
                        className="p-1.5 text-text-secondary hover:text-red-500 hover:bg-red-50 rounded-lg transition">
                        {deleteMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
