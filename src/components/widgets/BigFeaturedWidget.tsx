'use client';

import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, orderBy, limit, Timestamp } from 'firebase/firestore';
import { useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

type Post = {
    id: string;
    title: string;
    slug: string;
    excerpt: string;
    featuredImageUrl: string;
    createdAt: Timestamp;
};

type BigFeaturedWidgetProps = {
    title?: string;
    filterType?: 'latest' | 'category' | 'tag';
    sourceIds?: string[];
    tags?: string;
    imagePosition?: 'left' | 'right';
    showExcerpt?: boolean;
    buttonText?: string;
}

export function BigFeaturedWidget({
    title,
    filterType = 'latest',
    sourceIds,
    tags,
    imagePosition = 'left',
    showExcerpt = true,
    buttonText = 'Read More'
}: BigFeaturedWidgetProps) {
    const firestore = useFirestore();

    const postsQuery = useMemoFirebase(() => {
        if (!firestore) return null;

        let q = query(
            collection(firestore, 'posts'),
            where('status', '==', 'published')
        );

        if (filterType === 'category' && sourceIds && sourceIds.length > 0) {
            q = query(q, where('categoryIds', 'array-contains-any', sourceIds));
        } else if (filterType === 'tag' && tags && tags.trim() !== '') {
            const tagArray = tags.split(',').map(t => t.trim()).filter(Boolean);
            if(tagArray.length > 0) {
                q = query(q, where('tagIds', 'array-contains-any', tagArray));
            }
        }

        return query(q, orderBy('createdAt', 'desc'), limit(1));
    }, [firestore, filterType, sourceIds, tags]);

    const { data: posts, isLoading } = useCollection<Post>(postsQuery);

    const post = useMemo(() => posts?.[0], [posts]);

    if (isLoading) {
        return <p>Loading story...</p>;
    }
    
    if (!post) {
        return null;
    }

    const imageOrder = imagePosition === 'right' ? 'md:order-2' : 'md:order-1';
    const contentOrder = imagePosition === 'right' ? 'md:order-1' : 'md:order-2';

    return (
        <div className="w-full">
            {title && <h2 className="text-2xl font-bold font-headline mb-6">{title}</h2>}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start group">
                {post.featuredImageUrl && (
                    <div className={cn("relative aspect-[4/3] w-full", imageOrder)}>
                        <Link href={`/${post.slug}`}>
                            <Image
                                src={post.featuredImageUrl}
                                alt={post.title}
                                fill
                                className="object-cover rounded-lg group-hover:scale-105 transition-transform duration-300"
                            />
                        </Link>
                    </div>
                )}
                <div className={cn("flex flex-col justify-center", contentOrder)}>
                    <h2 className="text-3xl md:text-4xl font-bold font-headline leading-tight">
                        <Link href={`/${post.slug}`} className="hover:underline">{post.title}</Link>
                    </h2>
                    <time className="text-sm text-muted-foreground/80 mt-2 block">
                        {format(post.createdAt.toDate(), 'MMMM d, yyyy')}
                    </time>
                    {showExcerpt && <p className="text-base text-muted-foreground mt-4 line-clamp-4">{post.excerpt}</p>}
                    {buttonText && (
                        <div className="mt-6">
                            <Button asChild>
                                <Link href={`/${post.slug}`}>{buttonText}</Link>
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
