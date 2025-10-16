'use client';

import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, orderBy, limit, Timestamp } from 'firebase/firestore';
import { useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';

type Post = {
    id: string;
    title: string;
    slug: string;
    featuredImageUrl: string;
    createdAt: Timestamp;
};

type TabConfig = {
    id: string;
    title: string;
    filterType: 'latest' | 'category' | 'tag';
    category?: string;
    tag?: string;
}

type TabbedPostsWidgetProps = {
    title?: string;
    tabs?: TabConfig[];
    postCountPerTab?: number;
}

function TabContent({ filter, postCount }: { filter: TabConfig, postCount: number }) {
    const firestore = useFirestore();

     const postsQuery = useMemoFirebase(() => {
        if (!firestore) return null;

        let q = query(
            collection(firestore, 'posts'),
            where('status', '==', 'published')
        );

        if (filter.filterType === 'category' && filter.category) {
            q = query(q, where('categoryIds', 'array-contains', filter.category));
        } else if (filter.filterType === 'tag' && filter.tag) {
            q = query(q, where('tagIds', 'array-contains', filter.tag));
        }

        return query(q, orderBy('createdAt', 'desc'), limit(postCount));
    }, [firestore, filter, postCount]);
    
    const { data: posts, isLoading } = useCollection<Post>(postsQuery);

    if (isLoading) {
        return <p className="p-4 text-center">Loading posts...</p>;
    }
    
    if (!posts || posts.length === 0) {
        return <p className="p-4 text-center text-muted-foreground">No posts found.</p>;
    }

    return (
        <div className="space-y-4">
            {posts.map(post => (
                <div key={post.id} className="flex gap-4 items-center group">
                    {post.featuredImageUrl && (
                        <Link href={`/${post.slug}`} className="shrink-0">
                            <div className="relative h-16 w-24 overflow-hidden rounded-md">
                                <Image src={post.featuredImageUrl} alt={post.title} fill className="object-cover" />
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
    )
}

export function TabbedPostsWidget({
    tabs,
    postCountPerTab = 5
}: TabbedPostsWidgetProps) {
    
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
                            <TabContent filter={tab} postCount={postCountPerTab} />
                        </CardContent>
                    </Card>
                </TabsContent>
            ))}
        </Tabs>
    );
}
