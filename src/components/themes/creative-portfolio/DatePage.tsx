'use client';
import { useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, Timestamp, orderBy } from 'firebase/firestore';
import { format, startOfDay, endOfDay, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns';
import { Loading } from '@/components/loading';
import { ThemeLayout } from '../ThemeLayout';
import { CreativeHeader, CreativeFooter } from './HomePage';

type Post = {
  id: string;
  title: string;
  excerpt: string;
  slug: string;
  featuredImageUrl: string;
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
    <ThemeLayout HeaderComponent={CreativeHeader} FooterComponent={CreativeFooter}>
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold font-headline tracking-tight">Date Archive: {title}</h1>
      </div>

      {!isLoadingPosts && (!posts || posts.length === 0) && (
        <div className="text-center py-16">
          <p className="text-muted-foreground">No projects were published on this date.</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {posts?.map((post) => (
          <Link href={`/${post.slug}`} key={post.id}>
            <div className="block relative aspect-square group overflow-hidden rounded-lg">
              <Image 
                src={post.featuredImageUrl || 'https://picsum.photos/seed/placeholder/600/600'} 
                alt={post.title}
                fill
                className="object-cover w-full h-full transition-transform duration-500 ease-in-out group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-black/40 group-hover:bg-black/60 transition-colors duration-300 flex items-end p-6">
                <div className="text-white">
                  <h2 className="font-headline text-2xl font-bold">{post.title}</h2>
                  <p className="text-sm opacity-80">{post.excerpt}</p>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </ThemeLayout>
  );
}
