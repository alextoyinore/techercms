'use client';

import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, orderBy, limit, Timestamp } from 'firebase/firestore';
import { useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

type Post = {
    id: string;
    title: string;
    slug: string;
    excerpt: string;
    featuredImageUrl: string;
    createdAt: Timestamp;
};

type PostGridWidgetProps = {
    title?: string;
    filterType?: 'latest' | 'category' | 'tag';
    sourceIds?: string[];
    tags?: string;
    postCount?: number;
    columns?: number;
    showExcerpts?: boolean;
    showImages?: boolean;
    imagePosition?: 'before' | 'after';
}

export function PostGridWidget({
    title,
    filterType = 'latest',
    sourceIds,
    tags,
    postCount = 6,
    columns = 3,
    showExcerpts = false,
    showImages = true,
    imagePosition = 'before',
}: PostGridWidgetProps) {
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

        return query(q, orderBy('createdAt', 'desc'), limit(postCount));
    }, [firestore, filterType, sourceIds, tags, postCount]);
    
    const { data: posts, isLoading } = useCollection<Post>(postsQuery);
    
    const gridCols = {
        1: 'grid-cols-1',
        2: 'grid-cols-2',
        3: 'grid-cols-2 md:grid-cols-3',
        4: 'grid-cols-2 md:grid-cols-4',
        5: 'grid-cols-2 md:grid-cols-5',
        6: 'grid-cols-2 md:grid-cols-6',
    }[columns] || 'md:grid-cols-3';

    const isImageAfter = imagePosition === 'after';


    if (isLoading) {
        return <div>Loading posts...</div>
    }

    if (!posts || posts.length === 0) {
        return null;
    }

    return (
        <div className="w-full">
            {title && <h2 className="text-2xl font-bold font-headline mb-4">{title}</h2>}
            <div className={cn('grid gap-6', gridCols)}>
                {posts.map(post => (
                    <div key={post.id} className={cn("grid gap-2 group", isImageAfter && "flex flex-col-reverse justify-end")}>
                        {showImages && post.featuredImageUrl && (
                            <Link href={`/${post.slug}`}>
                                <div className="relative aspect-video w-full overflow-hidden rounded-md">
                                    <Image 
                                        src={post.featuredImageUrl} 
                                        alt={post.title} 
                                        fill 
                                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                                    />
                                </div>
                            </Link>
                        )}
                        <div className="flex flex-col">
                            <h3 className="font-semibold leading-tight text-sm group-hover:underline">
                                <Link href={`/${post.slug}`}>{post.title}</Link>
                            </h3>
                            {showExcerpts && <p className="text-sm text-muted-foreground line-clamp-3 mt-1">{post.excerpt}</p>}
                             <time className="text-xs text-muted-foreground mt-1">
                                {format(post.createdAt.toDate(), 'MMMM d, yyyy')}
                            </time>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
