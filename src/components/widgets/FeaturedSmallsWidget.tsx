'use client';

import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, orderBy, limit, Timestamp } from 'firebase/firestore';
import { useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';

type Post = {
    id: string;
    title: string;
    slug: string;
    excerpt: string;
    featuredImageUrl: string;
    createdAt: Timestamp;
};

type FeaturedSmallsWidgetProps = {
    title?: string;
    filterType?: 'latest' | 'category' | 'tag';
    categoryIds?: string[];
    tagIds?: string[];
    smallPostCount?: number;
}

export function FeaturedSmallsWidget({
    title = 'Top Stories',
    filterType = 'latest',
    categoryIds,
    tagIds,
    smallPostCount = 4
}: FeaturedSmallsWidgetProps) {
    const firestore = useFirestore();

    const totalPostsToFetch = smallPostCount + 1;

    const postsQuery = useMemoFirebase(() => {
        if (!firestore) return null;

        let q = query(
            collection(firestore, 'posts'),
            where('status', '==', 'published')
        );

        if (filterType === 'category' && categoryIds && categoryIds.length > 0) {
            q = query(q, where('categoryIds', 'array-contains-any', categoryIds));
        } else if (filterType === 'tag' && tagIds && tagIds.length > 0) {
            q = query(q, where('tagIds', 'array-contains-any', tagIds));
        }

        return query(q, orderBy('createdAt', 'desc'), limit(totalPostsToFetch));
    }, [firestore, filterType, categoryIds, tagIds, totalPostsToFetch]);

    const { data: posts, isLoading } = useCollection<Post>(postsQuery);

    const [featuredPost, ...smallPosts] = useMemo(() => {
        if (!posts) return [null, []];
        return [posts[0] || null, posts.slice(1)];
    }, [posts]);

    if (isLoading) {
        return <p>Loading stories...</p>;
    }
    
    if (!featuredPost) {
        return null; // Or some placeholder
    }

    return (
        <div className="w-full">
            <h2 className="text-2xl font-bold font-headline mb-4">{title}</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="md:col-span-2 group">
                    <Link href={`/${featuredPost.slug}`}>
                        {featuredPost.featuredImageUrl && (
                            <div className="relative aspect-video w-full overflow-hidden mb-4 rounded-lg">
                                <Image
                                    src={featuredPost.featuredImageUrl}
                                    alt={featuredPost.title}
                                    fill
                                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                                />
                            </div>
                        )}
                        <h3 className="text-3xl font-bold font-headline leading-tight group-hover:underline">{featuredPost.title}</h3>
                        <p className="text-muted-foreground mt-2">{featuredPost.excerpt}</p>
                    </Link>
                </div>
                <div className="md:col-span-1 space-y-4">
                    {smallPosts.map(post => (
                        <div key={post.id} className="flex gap-4 items-center group">
                            {post.featuredImageUrl && (
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
                             <div>
                                <h4 className="font-semibold leading-tight group-hover:underline">
                                    <Link href={`/${post.slug}`}>{post.title}</Link>
                                </h4>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
