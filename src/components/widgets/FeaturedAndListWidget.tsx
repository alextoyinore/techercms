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

type FeaturedAndListWidgetProps = {
    title?: string;
    filterType?: 'latest' | 'category' | 'tag';
    sourceIds?: string[];
    tags?: string;
    postCount?: number;
    showSmallExcerpts?: boolean;
    showSmallImages?: boolean;
    imagePosition?: 'before' | 'after';
}

export function FeaturedAndListWidget({
    title,
    filterType = 'latest',
    sourceIds,
    tags,
    postCount = 5, // 1 featured + 4 in list
    showSmallExcerpts = true,
    showSmallImages = true,
    imagePosition = 'before'
}: FeaturedAndListWidgetProps) {
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

    const [featuredPost, ...listPosts] = useMemo(() => {
        if (!posts || posts.length === 0) return [null, []];
        return posts;
    }, [posts]);
    

    if (isLoading) {
        return <p>Loading stories...</p>;
    }
    
    if (!featuredPost) {
        return null;
    }
    
    const isImageAfter = imagePosition === 'after';

    return (
        <div className="w-full">
            {title && <h2 className="text-2xl font-bold font-headline mb-4">{title}</h2>}
            <div className="space-y-8">
                {/* Featured Post */}
                <div className={cn("group flex flex-col gap-4", isImageAfter && "flex-col-reverse")}>
                    <Link href={`/${featuredPost.slug}`}>
                        {featuredPost.featuredImageUrl && (
                            <div className="relative aspect-video w-full overflow-hidden rounded-lg">
                                <Image
                                    src={featuredPost.featuredImageUrl}
                                    alt={featuredPost.title}
                                    fill
                                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                                />
                            </div>
                        )}
                    </Link>
                    <div>
                        <h3 className="text-2xl md:text-3xl font-bold font-headline leading-tight group-hover:underline">
                            <Link href={`/${featuredPost.slug}`}>{featuredPost.title}</Link>
                        </h3>
                        <p className="text-base text-muted-foreground mt-2 line-clamp-3">{featuredPost.excerpt}</p>
                        <time className="text-sm text-muted-foreground/80 mt-2 block">
                            {format(featuredPost.createdAt.toDate(), 'MMMM d, yyyy')}
                        </time>
                    </div>
                </div>

                {listPosts.length > 0 && (
                    <>
                        <Separator />
                        {/* List Posts */}
                        <div className="space-y-6">
                            {listPosts.map(post => (
                                <div key={post.id} className="flex gap-4 items-start group">
                                    {showSmallImages && post.featuredImageUrl && (
                                        <Link href={`/${post.slug}`} className="shrink-0">
                                            <div className="relative h-16 w-24 overflow-hidden rounded-md">
                                                <Image
                                                    src={post.featuredImageUrl}
                                                    alt={post.title}
                                                    fill
                                                    className="object-cover"
                                                />
                                            </div>
                                        </Link>
                                    )}
                                    <div className="flex-1">
                                        <h4 className="font-semibold leading-tight group-hover:underline">
                                            <Link href={`/${post.slug}`}>{post.title}</Link>
                                        </h4>
                                        {showSmallExcerpts && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{post.excerpt}</p>}
                                        <time className="text-xs text-muted-foreground/80 mt-1 block">
                                            {format(post.createdAt.toDate(), 'MMMM d, yyyy')}
                                        </time>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
