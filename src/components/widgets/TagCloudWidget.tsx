'use client';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { useMemo } from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Cloud } from 'lucide-react';

type Post = {
    tagIds?: string[];
};

type TagCount = {
    name: string;
    count: number;
};

type TagCloudWidgetProps = {
    title?: string;
}

export function TagCloudWidget({ title = 'Tag Cloud' }: TagCloudWidgetProps) {
    const firestore = useFirestore();

    const postsQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(
            collection(firestore, 'posts'), 
            where('status', '==', 'published')
        );
    }, [firestore]);

    const { data: posts, isLoading } = useCollection<Post>(postsQuery);

    const tagCounts = useMemo(() => {
        if (!posts) return [];
        const counts: Record<string, number> = {};
        posts.forEach(post => {
            post.tagIds?.forEach(tag => {
                counts[tag] = (counts[tag] || 0) + 1;
            });
        });
        return Object.entries(counts).map(([name, count]) => ({ name, count }));
    }, [posts]);

    const getTagSize = (count: number, maxCount: number) => {
        if (maxCount <= 1) return 'text-sm';
        const percentage = (count / maxCount) * 100;
        if (percentage > 80) return 'text-xl';
        if (percentage > 60) return 'text-lg';
        if (percentage > 40) return 'text-base';
        if (percentage > 20) return 'text-sm';
        return 'text-xs';
    }
    
    const maxCount = useMemo(() => Math.max(...tagCounts.map(t => t.count), 0), [tagCounts]);


    return (
        <Card>
            <CardHeader>
                <CardTitle className="font-headline text-lg flex items-center gap-2">
                    <Cloud className="h-4 w-4" />
                    {title}
                </CardTitle>
            </CardHeader>
            <CardContent>
                {isLoading && <p className="text-sm text-muted-foreground">Loading tags...</p>}
                <div className="flex flex-wrap gap-2">
                    {tagCounts.map(tag => (
                        <Link href={`/tag/${tag.name}`} key={tag.name}>
                            <span className={`${getTagSize(tag.count, maxCount)} text-primary hover:underline`}>
                                {tag.name}
                            </span>
                        </Link>
                    ))}
                </div>
                 {!isLoading && tagCounts.length === 0 && (
                    <p className="text-sm text-muted-foreground">No tags found.</p>
                )}
            </CardContent>
        </Card>
    );
}
