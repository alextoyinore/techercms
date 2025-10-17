'use client';
import { useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, Timestamp, orderBy } from 'firebase/firestore';
import { format, startOfDay, endOfDay, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loading } from '@/components/loading';
import { ThemeLayout } from '../ThemeLayout';
import { MagazineProHeader, MagazineProFooter } from './HomePage';

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
  const dateParams = params.date as string[]; // e.g., ['2024', '07', '18']

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
    <ThemeLayout HeaderComponent={MagazineProHeader} FooterComponent={MagazineProFooter}>
        <div className="text-center mb-12">
            <h1 className="text-4xl font-bold font-headline tracking-tight lg:text-5xl">Date Archive: {title}</h1>
            {posts && posts.length > 0 ? (
                <p className="mt-4 text-lg text-muted-foreground">Found {posts.length} post{posts.length > 1 ? 's' : ''}.</p>
            ) : null}
        </div>

        {!isLoadingPosts && (!posts || posts.length === 0) && (
            <div className="text-center py-16">
                <p className="text-muted-foreground">No posts were published on this date.</p>
            </div>
        )}

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {posts?.map((post) => (
                <Card key={post.id} className="flex flex-col overflow-hidden rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300">
                     <Link href={`/${post.slug}`} className="block">
                        <div className="relative aspect-video">
                            <Image 
                                src={post.featuredImageUrl || 'https://picsum.photos/seed/placeholder/600/400'} 
                                alt={post.title}
                                fill
                                className="object-cover"
                            />
                        </div>
                    </Link>
                    <CardHeader>
                        <CardTitle className="font-headline text-xl leading-snug">
                            <Link href={`/${post.slug}`}>{post.title}</Link>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="flex-grow">
                        <p className="text-muted-foreground line-clamp-3">{post.excerpt}</p>
                    </CardContent>
                    <div className="p-4 pt-0 text-xs text-muted-foreground">
                        <Link href={`/archive/${format(post.createdAt.toDate(), 'yyyy/MM/dd')}`}>
                            <span className="hover:underline">{post.createdAt ? format(post.createdAt.toDate(), 'PP') : 'N/A'}</span>
                        </Link>
                    </div>
                </Card>
            ))}
        </div>
    </ThemeLayout>
  );
}