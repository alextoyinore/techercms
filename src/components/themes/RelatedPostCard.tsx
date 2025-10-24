'use client';

import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc, Timestamp } from 'firebase/firestore';
import Link from 'next/link';
import Image from 'next/image';
import { Skeleton } from '@/components/ui/skeleton';
import { PostAuthor } from './PostAuthor';

type Post = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  featuredImageUrl: string;
  createdAt: Timestamp;
  authorId: string;
};

export function RelatedPostCard({ postId }: { postId: string }) {
  const firestore = useFirestore();
  const postRef = useMemoFirebase(() => {
    if (!firestore || !postId) return null;
    return doc(firestore, 'posts', postId);
  }, [firestore, postId]);

  const { data: post, isLoading } = useDoc<Post>(postRef);

  if (isLoading) {
    return <Skeleton className="h-28 w-full rounded-lg" />;
  }

  if (!post) {
    return null;
  }

  return (
    <div className="block my-6">
      <Link href={`/${post.slug}`} className="group">
        <div className="flex items-center gap-4 rounded-lg border p-4 bg-primary/5 transition-colors group-hover:bg-primary/10">
          {post.featuredImageUrl && (
            <div className="relative h-24 w-32 shrink-0 overflow-hidden rounded-md">
              <Image
                src={post.featuredImageUrl}
                alt={post.title}
                fill
                className="object-cover"
              />
            </div>
          )}
          <div className="flex-1">
            <p className="text-xs font-semibold uppercase text-primary tracking-wider mb-1">Related Post</p>
            <h4 className="font-semibold leading-tight group-hover:underline">{post.title}</h4>
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{post.excerpt}</p>
            <div className="text-xs text-muted-foreground mt-2">
              By <PostAuthor authorId={post.authorId} />
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
}
