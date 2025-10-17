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
import { PublicHeader, PublicFooter } from './HomePage';
import { cn } from '@/lib/utils';

type Post = {
  id: string;
  title: string;
  excerpt: string;
  slug: string;
  featuredImageUrl: string;
  createdAt: Timestamp;
};

function PostCard({ post, className, titleSize = 'text-xl' }: { post: Post, className?: string, titleSize?: string }) {
    return (
        <div className={cn("group flex flex-col", className)}>
             {post.featuredImageUrl && (
                <Link href={`/${post.slug}`}>
                    <div className="relative aspect-video w-full overflow-hidden bg-muted">
                        <Image
                            src={post.featuredImageUrl}
                            alt={post.title}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                    </div>
                </Link>
            )}
            <div className="py-3 flex-grow flex flex-col">
                <h3 className={cn("font-extrabold font-headline leading-tight group-hover:underline", titleSize)}>
                    <Link href={`/${post.slug}`}>{post.title}</Link>
                </h3>
                <p className="text-sm text-muted-foreground mt-2 line-clamp-2 flex-grow">{post.excerpt}</p>
                <Link href={`/archive/${format(post.createdAt.toDate(), 'yyyy/MM')}`}>
                    <time className="text-xs text-muted-foreground/80 mt-2 block hover:underline">
                        {format(post.createdAt.toDate(), 'MMM d, yyyy')}
                    </time>
                </Link>
            </div>
        </div>
    )
}

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
    <ThemeLayout HeaderComponent={PublicHeader} FooterComponent={PublicFooter} className="bg-background text-foreground font-sans">
        <div className="mb-8 pb-4 border-b">
            <h1 className="text-3xl font-black font-headline tracking-tight lg:text-4xl">Date: {title}</h1>
        </div>

        {!isLoadingPosts && (!posts || posts.length === 0) && (
            <div className="text-center py-16">
                <p className="text-muted-foreground">No posts were published on this date.</p>
            </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {posts?.map((post) => (
                <PostCard key={post.id} post={post} />
            ))}
        </div>
    </ThemeLayout>
  );
}
