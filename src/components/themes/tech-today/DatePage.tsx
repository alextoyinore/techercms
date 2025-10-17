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
    <ThemeLayout HeaderComponent={PublicHeader} FooterComponent={PublicFooter} className="bg-gray-900 text-gray-200 min-h-screen">
        <div className="mb-12">
            <h1 className="text-4xl font-extrabold font-headline tracking-tight text-cyan-300">Date Archive: {title}</h1>
        </div>

        {!isLoadingPosts && (!posts || posts.length === 0) && (
            <div className="text-center py-16">
                <p className="text-gray-500">No articles were published on this date.</p>
            </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {posts?.map((post) => (
                <PostCard key={post.id} post={post} />
            ))}
        </div>
    </ThemeLayout>
  );
}
