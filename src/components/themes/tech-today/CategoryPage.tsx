'use client';
import { useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, Timestamp } from 'firebase/firestore';
import { format } from 'date-fns';
import { Loading } from '@/components/loading';
import { ThemeLayout } from '../ThemeLayout';
import { PublicHeader, PublicFooter } from './HomePage';

type Post = {
  id: string;
  title: string;
  excerpt: string;
  slug: string;
  featuredImageUrl: string;
  categoryIds: string[];
  createdAt: Timestamp;
};

type Category = {
    id: string;
    name: string;
    slug: string;
}

function PostCard({ post }: { post: Post }) {
    return (
        <div className="bg-gray-800/50 rounded-lg overflow-hidden flex flex-col group border border-gray-700/50 hover:border-cyan-400/50 transition-colors">
            <Link href={`/${post.slug}`} className="block">
                <div className="relative aspect-video">
                    <Image
                        src={post.featuredImageUrl || 'https://picsum.photos/seed/tech-post/600/338'}
                        alt={post.title}
                        fill
                        className="object-cover"
                    />
                </div>
            </Link>
            <div className="p-6 flex-grow flex flex-col">
                <h3 className="font-bold font-headline text-xl leading-tight">
                    <Link href={`/${post.slug}`} className="group-hover:text-cyan-400 transition-colors">{post.title}</Link>
                </h3>
                <p className="text-sm text-gray-400 mt-2 flex-grow line-clamp-3">{post.excerpt}</p>
                <time className="text-xs text-gray-500 mt-4 block">
                    {post.createdAt ? format(post.createdAt.toDate(), 'PP') : ''}
                </time>
            </div>
        </div>
    );
}

export default function CategoryPage() {
  const firestore = useFirestore();
  const params = useParams();
  const slug = params.slug as string;

  const categoriesQuery = useMemoFirebase(() => {
    if (!firestore || !slug) return null;
    return query(collection(firestore, 'categories'), where('slug', '==', slug));
  }, [firestore, slug]);

  const { data: categories, isLoading: isLoadingCategories } = useCollection<Category>(categoriesQuery);
  const category = useMemo(() => categories?.[0], [categories]);

  const postsQuery = useMemoFirebase(() => {
    if (!firestore || !category) return null;
    return query(
      collection(firestore, 'posts'),
      where('status', '==', 'published'),
      where('categoryIds', 'array-contains', category.id)
    );
  }, [firestore, category]);

  const { data: posts, isLoading: isLoadingPosts } = useCollection<Post>(postsQuery);

  const sortedPosts = useMemo(() => {
    if (!posts) return [];
    return [...posts].sort((a, b) => (b.createdAt?.toDate() ?? 0) > (a.createdAt?.toDate() ?? 0) ? 1 : -1);
  }, [posts]);

  const isLoading = isLoadingCategories || isLoadingPosts;

  if (isLoading) {
    return <Loading />;
  }

  return (
    <ThemeLayout HeaderComponent={PublicHeader} FooterComponent={PublicFooter} className="bg-gray-900 text-gray-200 min-h-screen">
        <div className="mb-12">
            <h1 className="text-4xl font-extrabold font-headline tracking-tight text-cyan-300">Category: {category?.name || 'Archive'}</h1>
        </div>

        {!isLoading && (!sortedPosts || sortedPosts.length === 0) && (
            <div className="text-center py-16">
                <p className="text-gray-500">No articles found in this category.</p>
            </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {sortedPosts.map((post) => (
                <PostCard key={post.id} post={post} />
            ))}
        </div>
    </ThemeLayout>
  );
}
