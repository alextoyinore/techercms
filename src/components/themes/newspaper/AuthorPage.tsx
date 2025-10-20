'use client';
import { useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import { useFirestore, useCollection, useDoc, useMemoFirebase } from '@/firebase';
import { collection, query, where, Timestamp, doc } from 'firebase/firestore';
import { format } from 'date-fns';
import { Loading } from '@/components/loading';
import { ThemeLayout } from '../ThemeLayout';
import { NewspaperHeader, NewspaperFooter } from './HomePage';

type Post = {
  id: string;
  title: string;
  excerpt: string;
  slug: string;
  featuredImageUrl: string;
  authorId: string;
  createdAt: Timestamp;
};

type User = {
    id: string;
    displayName?: string;
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

export default function AuthorPage() {
  const firestore = useFirestore();
  const params = useParams();
  const authorId = params.id as string;

  const authorRef = useMemoFirebase(() => {
    if (!firestore || !authorId) return null;
    return doc(firestore, 'users', authorId);
  }, [firestore, authorId]);
  const { data: author, isLoading: isLoadingAuthor } = useDoc<User>(authorRef);

  const postsQuery = useMemoFirebase(() => {
    if (!firestore || !authorId) return null;
    return query(
      collection(firestore, 'posts'),
      where('status', '==', 'published'),
      where('authorId', '==', authorId)
    );
  }, [firestore, authorId]);

  const { data: posts, isLoading: isLoadingPosts } = useCollection<Post>(postsQuery);

  const sortedPosts = useMemo(() => {
    if (!posts) return [];
    return [...posts].sort((a, b) => (b.createdAt?.toDate() ?? 0) > (a.createdAt?.toDate() ?? 0) ? 1 : -1);
  }, [posts]);

  if (isLoadingPosts || isLoadingAuthor) {
    return <Loading />;
  }

  return (
    <ThemeLayout HeaderComponent={NewspaperHeader} FooterComponent={NewspaperFooter}>
        <div className="mb-8 pb-4 border-b">
            <h1 className="text-3xl font-black font-headline tracking-tight lg:text-4xl">Author Archives</h1>
            <p className="text-sm text-muted-foreground mt-1">Showing posts by: {author?.displayName || 'Unknown Author'}</p>
        </div>

        {!isLoadingPosts && (!sortedPosts || sortedPosts.length === 0) && (
            <div className="text-center py-16">
                <p className="text-muted-foreground">This author has not published any posts yet.</p>
            </div>
        )}

        <div className="space-y-6">
            {sortedPosts.map((post) => (
                <PostCard key={post.id} post={post} />
            ))}
        </div>
    </ThemeLayout>
  );
}
