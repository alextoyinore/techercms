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
import { NewspaperHeader, NewspaperFooter } from './HomePage';

type Post = {
  id: string;
  title: string;
  excerpt: string;
  slug: string;
  featuredImageUrl: string;
  createdAt: Timestamp;
};

function PostCard({ post }: { post: Post }) {
    return (
        <div className="flex flex-col sm:flex-row gap-4 border-b pb-4">
            {post.featuredImageUrl && (
                <Link href={`/${post.slug}`} className="block sm:w-1/3 shrink-0">
                    <div className="relative aspect-video w-full overflow-hidden">
                        <Image
                            src={post.featuredImageUrl}
                            alt={post.title}
                            fill
                            className="object-cover"
                        />
                    </div>
                </Link>
            )}
            <div>
                <h3 className="font-bold font-headline text-2xl leading-tight">
                    <Link href={`/${post.slug}`} className="hover:underline">{post.title}</Link>
                </h3>
                <p className="text-sm text-muted-foreground mt-2 line-clamp-3">{post.excerpt}</p>
                 <Link href={`/archive/${format(post.createdAt.toDate(), 'yyyy/MM')}`}>
                    <time className="text-xs text-muted-foreground/80 mt-2 block hover:underline">
                        {format(post.createdAt.toDate(), 'PP')}
                    </time>
                </Link>
            </div>
        </div>
    );
}

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
    <ThemeLayout HeaderComponent={NewspaperHeader} FooterComponent={NewspaperFooter}>
        <div className="mb-8 pb-4 border-b">
            <h1 className="text-3xl font-black font-headline tracking-tight lg:text-4xl">Date: {title}</h1>
        </div>

        {!isLoadingPosts && (!posts || posts.length === 0) && (
            <div className="text-center py-16">
                <p className="text-muted-foreground">No posts were published on this date.</p>
            </div>
        )}

        <div className="space-y-6">
            {posts?.map((post) => (
                <PostCard key={post.id} post={post} />
            ))}
        </div>
    </ThemeLayout>
  );
}
