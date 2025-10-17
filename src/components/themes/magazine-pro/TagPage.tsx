'use client';
import { useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, Timestamp } from 'firebase/firestore';
import { format } from 'date-fns';
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
  tagIds: string[];
  createdAt: Timestamp;
};

export default function TagPage() {
  const firestore = useFirestore();
  const params = useParams();
  const slug = params.slug as string;

  const postsQuery = useMemoFirebase(() => {
    if (!firestore || !slug) return null;
    return query(
      collection(firestore, 'posts'),
      where('status', '==', 'published'),
      where('tagIds', 'array-contains', slug)
    );
  }, [firestore, slug]);

  const { data: posts, isLoading: isLoadingPosts } = useCollection<Post>(postsQuery);

  const sortedPosts = useMemo(() => {
    if (!posts) return [];
    return [...posts].sort((a, b) => (b.createdAt?.toDate() ?? 0) > (a.createdAt?.toDate() ?? 0) ? 1 : -1);
  }, [posts]);

  if (isLoadingPosts) {
    return <Loading />;
  }

  return (
    <ThemeLayout HeaderComponent={MagazineProHeader} FooterComponent={MagazineProFooter}>
        <div className="text-center mb-12">
            <h1 className="text-4xl font-bold font-headline tracking-tight lg:text-5xl">Tag: {slug}</h1>
             {sortedPosts.length > 0 ? (
                <p className="mt-4 text-lg text-muted-foreground">Showing {sortedPosts.length} post{sortedPosts.length > 1 ? 's' : ''} with this tag.</p>
            ) : null}
        </div>

        {!isLoadingPosts && (!sortedPosts || sortedPosts.length === 0) && (
            <div className="text-center py-16">
                <p className="text-muted-foreground">No posts found with this tag.</p>
            </div>
        )}

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {sortedPosts.map((post) => (
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
                        <Link href={`/archive/${format(post.createdAt.toDate(), 'yyyy/MM')}`}>
                            <span className="hover:underline">{post.createdAt ? format(post.createdAt.toDate(), 'PP') : 'N/A'}</span>
                        </Link>
                    </div>
                </Card>
            ))}
        </div>
    </ThemeLayout>
  );
}