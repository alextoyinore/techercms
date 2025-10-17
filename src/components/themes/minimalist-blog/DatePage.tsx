'use client';
import { useMemo } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, Timestamp, orderBy } from 'firebase/firestore';
import { format, startOfDay, endOfDay, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns';
import { Loading } from '@/components/loading';
import { ThemeLayout } from '../ThemeLayout';
import { MinimalistHeader, MinimalistFooter } from './HomePage';

type Post = {
  id: string;
  title: string;
  excerpt: string;
  slug: string;
  createdAt: Timestamp;
};

export default function DatePage() {
  const firestore = useFirestore();
  const params = useParams();
  const dateParams = params.date as string[];

  const { startDate, endDate, title } = useMemo(() => {
    if (!dateParams) return { startDate: null, endDate: null, title: 'Archive' };
    const [year, month, day] = dateParams.map(p => parseInt(p, 10));

    if (year && month && day) {
        const date = new Date(year, month - 1, day);
        return { 
            startDate: startOfDay(date), 
            endDate: endOfDay(date),
            title: format(date, 'MMMM d, yyyy')
        };
    }
    if (year && month) {
        const date = new Date(year, month - 1);
        return { 
            startDate: startOfMonth(date), 
            endDate: endOfMonth(date),
            title: format(date, 'MMMM yyyy')
        };
    }
    if (year) {
        const date = new Date(year, 0);
        return { 
            startDate: startOfYear(date), 
            endDate: endOfYear(date),
            title: format(date, 'yyyy')
        };
    }
    return { startDate: null, endDate: null, title: 'Invalid Date' };
  }, [dateParams]);

  const postsQuery = useMemoFirebase(() => {
    if (!firestore || !startDate || !endDate) return null;
    return query(
      collection(firestore, 'posts'),
      where('status', '==', 'published'),
      where('createdAt', '>=', startDate),
      where('createdAt', '<=', endDate),
      orderBy('createdAt', 'desc')
    );
  }, [firestore, startDate, endDate]);

  const { data: posts, isLoading: isLoadingPosts } = useCollection<Post>(postsQuery);

  if (isLoadingPosts) {
    return <Loading />;
  }

  return (
    <ThemeLayout HeaderComponent={MinimalistHeader} FooterComponent={MinimalistFooter}>
        <div className="text-center mb-12 max-w-3xl mx-auto">
            <h1 className="text-4xl font-bold font-headline tracking-tight">Date: {title}</h1>
        </div>
        
        {!isLoadingPosts && (!posts || posts.length === 0) && (
            <div className="text-center py-16 max-w-3xl mx-auto">
                <p className="text-muted-foreground">No posts were published on this date.</p>
            </div>
        )}

        <div className="space-y-12 max-w-3xl mx-auto">
            {posts?.map((post) => (
                <article key={post.id}>
                    <header>
                        <time className="text-sm text-muted-foreground">
                            {post.createdAt ? format(post.createdAt.toDate(), 'MMMM d, yyyy') : 'N/A'}
                        </time>
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
