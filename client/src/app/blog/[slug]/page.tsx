import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Clock, Tag, ArrowLeft, Calendar } from 'lucide-react';
import { format } from 'date-fns';

interface BlogPost {
  _id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImage: string;
  author: string;
  category: string;
  tags: string[];
  readTime: number;
  publishedAt: string;
  seoTitle: string;
  seoDescription: string;
}

async function getPost(slug: string): Promise<BlogPost | null> {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/blog/${slug}`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.data.post;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const post = await getPost(params.slug);
  if (!post) return { title: 'Post Not Found | Lumina Blog' };
  return {
    title: post.seoTitle || `${post.title} | Lumina Blog`,
    description: post.seoDescription || post.excerpt,
    openGraph: {
      title: post.seoTitle || post.title,
      description: post.seoDescription || post.excerpt,
      images: [post.coverImage || `https://picsum.photos/seed/${post.slug}/1200/630`],
      type: 'article',
      publishedTime: post.publishedAt,
      authors: [post.author],
      tags: post.tags,
    },
  };
}

export default async function BlogPostPage({ params }: { params: { slug: string } }) {
  const post = await getPost(params.slug);
  if (!post) notFound();

  // JSON-LD structured data for SEO
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.excerpt,
    image: post.coverImage || `https://picsum.photos/seed/${post.slug}/1200/630`,
    author: { '@type': 'Person', name: post.author },
    datePublished: post.publishedAt,
    publisher: {
      '@type': 'Organization',
      name: 'Lumina Store',
      logo: { '@type': 'ImageObject', url: 'https://lumina-store.com/logo.png' },
    },
    keywords: post.tags?.join(', '),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="bg-white min-h-screen">
        {/* Hero image */}
        <div className="relative w-full h-[55vh] max-h-[520px] bg-gray-900">
          <Image
            src={post.coverImage || `https://picsum.photos/seed/${post.slug}/1200/630`}
            alt={post.title}
            fill
            priority
            className="object-cover opacity-60"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/40 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-8 md:p-16 max-w-4xl mx-auto">
            <Link href="/blog" className="inline-flex items-center gap-1.5 text-white/70 hover:text-white text-sm mb-6 transition-colors">
              <ArrowLeft className="w-4 h-4" /> Back to Blog
            </Link>
            <div className="flex items-center gap-3 mb-4">
              <span className="bg-primary text-white text-xs font-bold px-3 py-1 rounded-full">{post.category}</span>
              <span className="text-white/60 text-xs flex items-center gap-1"><Clock className="w-3 h-3" />{post.readTime} min read</span>
            </div>
            <h1 className="text-3xl md:text-5xl font-black text-white leading-tight">{post.title}</h1>
          </div>
        </div>

        {/* Article */}
        <article className="max-w-3xl mx-auto px-4 sm:px-6 py-14">
          {/* Meta */}
          <div className="flex items-center gap-4 pb-8 mb-8 border-b border-border text-sm text-text-secondary">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold text-xs">
                {post.author.charAt(0)}
              </div>
              <span className="font-medium text-text-primary">{post.author}</span>
            </div>
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              {format(new Date(post.publishedAt), 'MMMM d, yyyy')}
            </span>
          </div>

          {/* Excerpt */}
          <p className="text-xl text-text-secondary leading-relaxed mb-10 font-light italic border-l-4 border-primary pl-5">
            {post.excerpt}
          </p>

          {/* Content - rendered as HTML */}
          <div
            className="prose prose-lg max-w-none prose-headings:font-bold prose-headings:text-text-primary prose-p:text-text-secondary prose-p:leading-relaxed prose-a:text-primary prose-a:no-underline hover:prose-a:underline prose-img:rounded-xl prose-blockquote:border-primary prose-blockquote:text-text-secondary prose-strong:text-text-primary"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />

          {/* Tags */}
          {post.tags?.length > 0 && (
            <div className="mt-12 pt-8 border-t border-border">
              <p className="text-sm font-semibold text-text-secondary mb-3 uppercase tracking-wider">Topics</p>
              <div className="flex flex-wrap gap-2">
                {post.tags.map(tag => (
                  <span key={tag} className="inline-flex items-center gap-1 bg-gray-100 text-gray-600 text-sm px-3 py-1.5 rounded-full">
                    <Tag className="w-3 h-3" />{tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* CTA */}
          <div className="mt-14 bg-gradient-to-br from-primary to-primary/80 text-white rounded-3xl p-8 text-center">
            <h3 className="text-2xl font-black mb-2">Shop the Look</h3>
            <p className="text-white/80 mb-5">Discover the premium products mentioned in this article.</p>
            <Link
              href="/products"
              className="inline-block bg-white text-primary font-bold px-8 py-3 rounded-xl hover:bg-primary-light transition-colors"
            >
              Browse Lumina Store
            </Link>
          </div>
        </article>
      </div>
    </>
  );
}
