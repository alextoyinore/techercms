
'use client';

import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc, Timestamp } from 'firebase/firestore';
import Link from 'next/link';
import Image from 'next/image';
import { Skeleton } from '@/components/ui/skeleton';
import { PostAuthor } from './PostAuthor';
import { ArrowRight } from 'lucide-react';
import { Button } from '../ui/button';

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
    return <Skeleton className="h-48 w-full rounded-lg my-6" />;
  }

  if (!post) {
    return null;
  }

  return (
    <aside className="not-prose block my-8">
      <Link href={`/${post.slug}`} className="group block">
        <div className="flex flex-col md:flex-row items-center gap-6 rounded-lg border bg-card p-6 shadow-sm transition-all hover:border-primary/50 hover:shadow-md">
          {post.featuredImageUrl && (
            <div className="relative h-40 w-full md:h-32 md:w-48 shrink-0 overflow-hidden rounded-md">
              <Image
                src={post.featuredImageUrl}
                alt={post.title}
                fill
                className="object-cover"
              />
            </div>
          )}
          <div className="flex-1">
            <p className="text-sm font-semibold uppercase tracking-wider text-primary mb-1">Read Next</p>
            <h4 className="text-xl font-bold font-headline leading-tight group-hover:underline">{post.title}</h4>
            <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{post.excerpt}</p>
          </div>
          <ArrowRight className="h-6 w-6 text-muted-foreground transition-transform group-hover:translate-x-1 hidden md:block" />
        </div>
      </Link>
    </aside>
  );
}
