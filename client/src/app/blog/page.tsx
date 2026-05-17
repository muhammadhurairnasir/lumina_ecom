import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { Clock, Tag, ArrowRight } from 'lucide-react';

interface BlogPost {
  _id: string;
  title: string;
  slug: string;
  excerpt: string;
  coverImage: string;
  author: string;
  category: string;
  tags: string[];
  readTime: number;
  publishedAt: string;
}

export const metadata: Metadata = {
  title: 'Blog | Lumina — Style, Living & Tech Insights',
  description: 'Explore our curated blog for the latest trends in fashion, home living, and tech. Get style inspiration, buying guides, and expert tips from the Lumina team.',
};

async function getBlogPosts(): Promise<{ posts: BlogPost[]; total: number }> {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/blog?limit=12`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return { posts: [], total: 0 };
    const data = await res.json();
    return data.data;
  } catch {
    return { posts: [], total: 0 };
  }
}

const CATEGORY_COLORS: Record<string, string> = {
  'Lifestyle':   'bg-purple-100 text-purple-700',
  'Electronics': 'bg-blue-100 text-blue-700',
  'Fashion':     'bg-pink-100 text-pink-700',
  'Home & Living': 'bg-amber-100 text-amber-700',
  'Accessories': 'bg-emerald-100 text-emerald-700',
  'Guide':       'bg-indigo-100 text-indigo-700',
};

export default async function BlogPage() {
  const { posts } = await getBlogPosts();

  return (
    <div className="bg-white min-h-screen">
      {/* Hero */}
      <section className="bg-gradient-to-br from-gray-900 via-primary to-gray-800 text-white py-24 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <span className="inline-block bg-white/10 backdrop-blur-sm text-white text-sm font-semibold px-4 py-1.5 rounded-full mb-4">
            Lumina Journal
          </span>
          <h1 className="text-5xl md:text-6xl font-black tracking-tight mb-5 leading-tight">
            Ideas, Trends &<br />
            <span className="text-primary-light">Living Well</span>
          </h1>
          <p className="text-lg text-white/75 max-w-xl mx-auto leading-relaxed">
            Discover curated insights on style, technology, home décor, and mindful living — straight from the Lumina editorial team.
          </p>
        </div>
      </section>

      {/* Posts Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        {posts.length === 0 ? (
          <div className="text-center py-24">
            <p className="text-2xl font-bold text-text-primary mb-2">Coming Soon</p>
            <p className="text-text-secondary">Our editorial team is crafting beautiful stories. Check back soon!</p>
          </div>
        ) : (
          <>
            {/* Featured Post */}
            {posts[0] && (
              <Link href={`/blog/${posts[0].slug}`} className="group block mb-16">
                <div className="grid md:grid-cols-2 gap-8 bg-gray-50 rounded-3xl overflow-hidden hover:shadow-xl transition-shadow duration-300">
                  <div className="relative h-72 md:h-auto min-h-[300px]">
                    <Image
                      src={posts[0].coverImage || `https://picsum.photos/seed/${posts[0].slug}/800/500`}
                      alt={posts[0].title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                  <div className="p-8 md:p-12 flex flex-col justify-center">
                    <div className="flex items-center gap-3 mb-4">
                      <span className={`text-xs font-bold px-3 py-1 rounded-full ${CATEGORY_COLORS[posts[0].category] || 'bg-gray-100 text-gray-700'}`}>
                        {posts[0].category}
                      </span>
                      <span className="text-xs text-text-secondary flex items-center gap-1">
                        <Clock className="w-3 h-3" />{posts[0].readTime} min read
                      </span>
                    </div>
                    <h2 className="text-3xl font-black text-text-primary mb-3 leading-tight group-hover:text-primary transition-colors">
                      {posts[0].title}
                    </h2>
                    <p className="text-text-secondary leading-relaxed mb-6 line-clamp-3">{posts[0].excerpt}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-text-secondary">By {posts[0].author}</span>
                      <span className="text-primary font-semibold flex items-center gap-1 group-hover:gap-2 transition-all">
                        Read More <ArrowRight className="w-4 h-4" />
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            )}

            {/* Grid */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {posts.slice(1).map((post) => (
                <Link key={post._id} href={`/blog/${post.slug}`} className="group block">
                  <article className="bg-white border border-border rounded-2xl overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1 h-full flex flex-col">
                    <div className="relative h-52 overflow-hidden">
                      <Image
                        src={post.coverImage || `https://picsum.photos/seed/${post.slug}/600/400`}
                        alt={post.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                    <div className="p-6 flex flex-col flex-1">
                      <div className="flex items-center gap-2 mb-3">
                        <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${CATEGORY_COLORS[post.category] || 'bg-gray-100 text-gray-700'}`}>
                          {post.category}
                        </span>
                        <span className="text-[11px] text-text-secondary flex items-center gap-1">
                          <Clock className="w-3 h-3" />{post.readTime} min
                        </span>
                      </div>
                      <h3 className="font-bold text-lg text-text-primary mb-2 leading-snug group-hover:text-primary transition-colors line-clamp-2">
                        {post.title}
                      </h3>
                      <p className="text-sm text-text-secondary leading-relaxed line-clamp-3 flex-1">{post.excerpt}</p>
                      <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
                        <span className="text-xs text-text-secondary">{post.author}</span>
                        <div className="flex items-center gap-1 flex-wrap">
                          {post.tags?.slice(0, 2).map(tag => (
                            <span key={tag} className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full flex items-center gap-0.5">
                              <Tag className="w-2.5 h-2.5" />{tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </article>
                </Link>
              ))}
            </div>
          </>
        )}
      </section>
    </div>
  );
}
