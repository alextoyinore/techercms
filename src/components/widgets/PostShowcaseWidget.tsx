'use client';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, orderBy, limit, Timestamp } from 'firebase/firestore';
import { useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
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

type PostShowcaseWidgetProps = {
    title?: string;
    sourceType?: 'category' | 'tag';
    sourceId?: string;
    count?: number;
    layout?: 'list' | 'grid-2' | 'grid-3';
}

export function PostShowcaseWidget({ 
    title = 'Post Showcase',
    sourceType,
    sourceId,
    count = 3,
    layout = 'list'
}: PostShowcaseWidgetProps) {
    const firestore = useFirestore();

    const postsQuery = useMemoFirebase(() => {
        if (!firestore || !sourceType || !sourceId) return null;
        
        let q = query(
            collection(firestore, 'posts'),
            where('status', '==', 'published')
        );

        if (sourceType === 'category') {
            q = query(q, where('categoryIds', 'array-contains', sourceId));
        } else if (sourceType === 'tag') {
            q = query(q, where('tagIds', 'array-contains', sourceId));
        }

        return query(q, orderBy('createdAt', 'desc'), limit(count));
    }, [firestore, sourceType, sourceId, count]);

    const { data: posts, isLoading } = useCollection<Post>(postsQuery);

    if (!sourceType || !sourceId) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="font-headline text-lg">{title}</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">Please configure this widget by selecting a source.</p>
                </CardContent>
            </Card>
        );
    }
    
    const gridClasses = {
        'list': 'grid-cols-1 gap-4',
        'grid-2': 'grid-cols-1 md:grid-cols-2 gap-4',
        'grid-3': 'grid-cols-1 md:grid-cols-3 gap-4',
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="font-headline text-lg">{title}</CardTitle>
            </CardHeader>
            <CardContent>
                {isLoading && <p className="text-sm text-muted-foreground">Loading posts...</p>}
                
                {!isLoading && posts && posts.length > 0 && (
                     <div className={cn('grid', gridClasses[layout])}>
                        {posts.map(post => (
                             <div key={post.id} className="grid gap-2">
                                {post.featuredImageUrl && (
                                    <Link href={`/${post.slug}`}>
                                        <div className="relative aspect-video w-full overflow-hidden rounded-md">
                                            <Image 
                                                src={post.featuredImageUrl} 
                                                alt={post.title} 
                                                fill 
                                                className="object-cover" 
                                            />
                                        </div>
                                    </Link>
                                )}
                                <h3 className="font-semibold leading-tight">
                                    <Link href={`/${post.slug}`} className="hover:underline">
                                        {post.title}
                                    </Link>
                                </h3>
                                <p className="text-sm text-muted-foreground line-clamp-2">{post.excerpt}</p>
                                <time className="text-xs text-muted-foreground">
                                    {format(post.createdAt.toDate(), 'MMMM d, yyyy')}
                                </time>
                            </div>
                        ))}
                    </div>
                )}

                {!isLoading && (!posts || posts.length === 0) && (
                    <p className="text-sm text-muted-foreground">No posts found for the selected criteria.</p>
                )}
            </CardContent>
        </Card>
    );
}
