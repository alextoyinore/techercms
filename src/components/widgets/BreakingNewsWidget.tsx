
'use client';
import { useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import Link from 'next/link';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, orderBy, limit, Timestamp } from 'firebase/firestore';
import { Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

type Post = {
    id: string;
    title: string;
    slug: string;
    createdAt: Timestamp;
}

type BreakingNewsWidgetProps = {
    title?: string;
    postCount?: number;
    filterType?: 'category' | 'tag';
    sourceIds?: string[];
    tags?: string;
}

export function BreakingNewsWidget({ 
    title = 'Breaking News', 
    postCount = 5,
    filterType,
    sourceIds,
    tags
}: BreakingNewsWidgetProps) {
    const firestore = useFirestore();

    const breakingNewsQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        
        let q = query(
            collection(firestore, 'posts'),
            where('status', '==', 'published')
        );

        const hasCategoryFilter = filterType === 'category' && sourceIds && sourceIds.length > 0;
        const hasTagFilter = filterType === 'tag' && tags && tags.trim() !== '';

        if (hasCategoryFilter) {
            q = query(q, where('categoryIds', 'array-contains-any', sourceIds));
        } else if (hasTagFilter) {
            const tagArray = tags.split(',').map(t => t.trim()).filter(Boolean);
            if (tagArray.length > 0) {
                q = query(q, where('tagIds', 'array-contains-any', tagArray));
            }
        } else {
            // Default behavior
            q = query(q, where('isBreaking', '==', true));
        }

        return query(q, orderBy('createdAt', 'desc'), limit(postCount));
    }, [firestore, postCount, filterType, sourceIds, tags]);

    const { data: posts, isLoading } = useCollection<Post>(breakingNewsQuery);

    return (
        <Card>
            <CardHeader>
                <CardTitle className="font-headline text-lg text-primary">{title}</CardTitle>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <div className="flex justify-center items-center h-24">
                        <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                ) : posts && posts.length > 0 ? (
                    <ul className="space-y-3">
                        {posts.map(item => (
                            <li key={item.id} className="text-sm border-b border-border/50 pb-2 last:border-b-0">
                                <Link href={`/${item.slug}`} className="font-medium hover:underline block">
                                    {item.title}
                                </Link>
                                <span className="text-xs text-muted-foreground">
                                    {formatDistanceToNow(item.createdAt.toDate(), { addSuffix: true })}
                                </span>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-sm text-muted-foreground">No breaking news at the moment.</p>
                )}
            </CardContent>
        </Card>
    );
}
