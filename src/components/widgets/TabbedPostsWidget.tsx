'use client';

import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, orderBy, limit, Timestamp } from 'firebase/firestore';
import { useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { PostAuthor } from '../themes/PostAuthor';

type Post = {
    id: string;
    title: string;
    slug: string;
    excerpt: string;
    featuredImageUrl: string;
    createdAt: Timestamp;
    authorId: string;
};

type TabConfig = {
    id: string;
    title: string;
    filterType?: 'latest' | 'category' | 'tag';
    sourceIds?: string[]; // For categories
    tags?: string; // For tags
}

type TabbedPostsWidgetProps = {
    title?: string;
    tabs?: TabConfig[];
    postCountPerTab?: number;
    showExcerpts?: boolean;
    showImages?: boolean;
}

function TabContent({ filter, postCount, showImages, showExcerpts }: { filter: TabConfig, postCount: number, showImages?: boolean, showExcerpts?: boolean }) {
    const firestore = useFirestore();

     const postsQuery = useMemoFirebase(() => {
        if (!firestore) return null;

        let q = query(
            collection(firestore, 'posts'),
            where('status', '==', 'published')
        );

        if (filter.filterType === 'category' && filter.sourceIds && filter.sourceIds.length > 0) {
            q = query(q, where('categoryIds', 'array-contains-any', filter.sourceIds));
        } else if (filter.filterType === 'tag' && filter.tags && filter.tags.trim() !== '') {
            const tagArray = filter.tags.split(',').map(t => t.trim()).filter(Boolean);
            if(tagArray.length > 0) {
                q = query(q, where('tagIds', 'array-contains-any', tagArray));
            }
        }

        return query(q, orderBy('createdAt', 'desc'), limit(postCount));
    }, [firestore, filter, postCount]);
    
    const { data: posts, isLoading } = useCollection<Post>(postsQuery);

    if (isLoading) {
        return <p className="p-4 text-center">Loading posts...</p>;
    }
    
    if (!posts || posts.length === 0) {
        return <p className="p-4 text-center text-muted-foreground">No posts found for this tab.</p>;
    }

    return (
        <div className="space-y-4">
            {posts.map(post => (
                <div key={post.id} className="flex gap-4 items-center group">
                    {showImages && post.featuredImageUrl && (
                        <Link href={`/${post.slug}`} className="shrink-0">
                            <div className="relative h-16 w-24 overflow-hidden rounded-md">
                                <Image src={post.featuredImageUrl} alt={post.title} fill className="object-cover" />
                            </div>
                        </Link>
                    )}
                    <div>
                        <h4 className="font-semibold leading-tight group-hover:underline text-sm">
                            <Link href={`/${post.slug}`}>{post.title}</Link>
                        </h4>
                        {showExcerpts && <p className="text-xs text-muted-foreground line-clamp-2">{post.excerpt}</p>}
                         <div className="text-xs text-muted-foreground/80 mt-1">
                            <PostAuthor authorId={post.authorId} />
                        </div>
                    </div>
                </div>
            ))}
        </div>
    )
}

export function TabbedPostsWidget({
    title,
    tabs: instanceTabs,
    postCountPerTab = 5,
    showExcerpts = true,
    showImages = true,
}: TabbedPostsWidgetProps) {
    
    const tabs = instanceTabs || [];
    const defaultTab = useMemo(() => tabs?.[0]?.id, [tabs]);

    if (!tabs || tabs.length === 0) {
        return (
            <Card>
                <CardContent className="p-4">
                    <p className="text-sm text-muted-foreground">Please configure tabs for this widget.</p>
                </CardContent>
            </Card>
        )
    }

    return (
        <div className="w-full">
            {title && <h2 className="text-2xl font-bold font-headline mb-4">{title}</h2>}
            <Tabs defaultValue={defaultTab} className="w-full">
                <TabsList>
                    {tabs.map(tab => (
                        <TabsTrigger key={tab.id} value={tab.id}>{tab.title}</TabsTrigger>
                    ))}
                </TabsList>
                {tabs.map(tab => (
                    <TabsContent key={tab.id} value={tab.id}>
                        <Card>
                            <CardContent className="p-4">
                                <TabContent 
                                    filter={tab} 
                                    postCount={postCountPerTab}
                                    showImages={showImages}
                                    showExcerpts={showExcerpts}
                                />
                            </CardContent>
                        </Card>
                    </TabsContent>
                ))}
            </Tabs>
        </div>
    );
}
