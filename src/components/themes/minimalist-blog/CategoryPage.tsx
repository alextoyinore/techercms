'use client';
import { useMemo } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, Timestamp } from 'firebase/firestore';
import { format } from 'date-fns';
import { Loading } from '@/components/loading';
import { ThemeLayout } from '../ThemeLayout';
import { MinimalistHeader, MinimalistFooter } from './HomePage';

type Post = {
  id: string;
  title: string;
  excerpt: string;
  slug: string;
  categoryIds: string[];
  createdAt: Timestamp;
};

type Category = {
    id: string;
    name: string;
    slug: string;
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
    <ThemeLayout HeaderComponent={MinimalistHeader} FooterComponent={MinimalistFooter}>
        <div className="text-center mb-12 max-w-3xl mx-auto">
            <h1 className="text-4xl font-bold font-headline tracking-tight">Category: {category?.name || 'Archive'}</h1>
        </div>

        {!isLoading && (!sortedPosts || sortedPosts.length === 0) && (
            <div className="text-center py-16 max-w-3xl mx-auto">
                <p className="text-muted-foreground">No posts found in this category.</p>
            </div>
        )}

        <div className="space-y-12 max-w-3xl mx-auto">
            {sortedPosts.map((post) => (
                <article key={post.id}>
                    <header>
                         <Link href={`/archive/${format(post.createdAt.toDate(), 'yyyy/MM')}`}>
                            <time className="text-sm text-muted-foreground hover:underline">
                                {post.createdAt ? format(post.createdAt.toDate(), 'MMMM d, yyyy') : 'N/A'}
                            </time>
                        </Link>
                        <h2 className="text-3xl font-bold font-headline mt-1">
                            <Link href={`/${post.slug}`} className='hover:text-primary transition-colors'>{post.title}</Link>
                        </h2>
                    </header>
                    <div className="mt-4 text-foreground/80">
                        <p>{post.excerpt}</p>
                    </div>
                    <footer className='mt-4'>
                        <Link href={`/${post.slug}`} className='text-sm font-semibold text-primary hover:underline'>
                            Read more &rarr;
                        </Link>
                    </footer>
                </article>
            ))}
        </div>
    </ThemeLayout>
  );
}
