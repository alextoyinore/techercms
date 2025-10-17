'use client';

import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, orderBy, limit, Timestamp } from 'firebase/firestore';
import { useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';

type Post = {
    id: string;
    title: string;
    slug: string;
    excerpt: string;
    featuredImageUrl: string;
    createdAt: Timestamp;
};

type FeaturedTopAndGridWidgetProps = {
    title?: string;
    filterType?: 'latest' | 'category' | 'tag';
    sourceIds?: string[];
    tags?: string;
    postCount?: number;
    gridColumns?: number;
    showSmallExcerpts?: boolean;
    showSmallImages?: boolean;
    imagePosition?: 'before' | 'after';
}

export function FeaturedTopAndGridWidget({
    title,
    filterType = 'latest',
    sourceIds,
    tags,
    postCount = 5, // 1 featured + 4 grid
    gridColumns = 4,
    showSmallExcerpts = false,
    showSmallImages = true,
    imagePosition = 'before',
}: FeaturedTopAndGridWidgetProps) {
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

    const [featuredPost, ...gridPosts] = useMemo(() => {
        if (!posts || posts.length === 0) return [null, []];
        return posts;
    }, [posts]);
    
    const gridColsClass = {
        1: 'grid-cols-1',
        2: 'sm:grid-cols-2',
        3: 'sm:grid-cols-3',
        4: 'sm:grid-cols-2 md:grid-cols-4',
        5: 'sm:grid-cols-3 md:grid-cols-5',
        6: 'sm:grid-cols-3 md:grid-cols-6',
    }[gridColumns] || 'sm:grid-cols-3';


    if (isLoading) {
        return (
             <div className="w-full">
                {title && <h2 className="text-2xl font-bold font-headline mb-4">{title}</h2>}
                <div className="animate-pulse bg-muted h-96 rounded-md w-full"></div>
            </div>
        );
    }
    
    if (!featuredPost) {
        return null;
    }
    
    const imageOrder = imagePosition === 'after' ? 'md:order-2' : 'md:order-1';
    const contentOrder = imagePosition === 'after' ? 'md:order-1' : 'md:order-2';

    return (
        <div className="w-full">
            {title && <h2 className="text-2xl font-bold font-headline mb-4">{title}</h2>}
            <div className="space-y-8">
                {/* Featured Post */}
                <div className="group grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                    {featuredPost.featuredImageUrl && (
                        <Link href={`/${featuredPost.slug}`} className={imageOrder}>
                            <div className="relative aspect-video w-full overflow-hidden rounded-lg">
                                <Image
                                    src={featuredPost.featuredImageUrl}
                                    alt={featuredPost.title}
                                    fill
                                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                                />
                            </div>
                        </Link>
                    )}
                    <div className={contentOrder}>
                        <h3 className="text-2xl md:text-3xl font-bold font-headline leading-tight group-hover:underline">
                            <Link href={`/${featuredPost.slug}`}>{featuredPost.title}</Link>
                        </h3>
                        <p className="text-base text-muted-foreground mt-2 line-clamp-3">{featuredPost.excerpt}</p>
                        <time className="text-sm text-muted-foreground/80 mt-2 block">
                            {format(featuredPost.createdAt.toDate(), 'MMMM d, yyyy')}
                        </time>
                    </div>
                </div>

                {gridPosts.length > 0 && (
                    <>
                        <Separator />
                        {/* Grid Posts */}
                        <div className={cn('grid gap-6', gridColsClass)}>
                            {gridPosts.map(post => (
                                <div key={post.id} className="group">
                                    {showSmallImages && post.featuredImageUrl && (
                                        <Link href={`/${post.slug}`}>
                                            <div className="relative aspect-video w-full overflow-hidden mb-2 rounded-md">
                                                <Image
                                                    src={post.featuredImageUrl}
                                                    alt={post.title}
                                                    fill
                                                    className="object-cover"
                                                />
                                            </div>
                                        </Link>
                                    )}
                                    <h4 className="font-semibold leading-tight group-hover:underline">
                                        <Link href={`/${post.slug}`}>{post.title}</Link>
                                    </h4>
                                    {showSmallExcerpts && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{post.excerpt}</p>}
                                    <time className="text-xs text-muted-foreground/80 mt-1 block">
                                        {format(post.createdAt.toDate(), 'MMMM d, yyyy')}
                                    </time>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
