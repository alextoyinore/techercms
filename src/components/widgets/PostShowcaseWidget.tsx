'use client';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, orderBy, limit, Timestamp, WhereFilterOp } from 'firebase/firestore';
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
    sourceIds?: string[];
    tags?: string;
    count?: number;
    layout?: 'list' | 'grid';
    gridColumns?: number;
}

export function PostShowcaseWidget({ 
    title = 'Post Showcase',
    sourceType,
    sourceIds,
    tags,
    count = 3,
    layout = 'list',
    gridColumns = 2,
}: PostShowcaseWidgetProps) {
    const firestore = useFirestore();

    const postsQuery = useMemoFirebase(() => {
        if (!firestore) return null;

        const hasCategories = sourceType === 'category' && sourceIds && sourceIds.length > 0;
        const hasTags = sourceType === 'tag' && tags && tags.trim() !== '';

        if (!hasCategories && !hasTags) return null;
        
        let q = query(
            collection(firestore, 'posts'),
            where('status', '==', 'published')
        );

        if (hasCategories) {
            q = query(q, where('categoryIds', 'array-contains-any', sourceIds));
        } else if (hasTags) {
            const tagArray = tags.split(',').map(t => t.trim()).filter(Boolean);
            if (tagArray.length > 0) {
                 q = query(q, where('tagIds', 'array-contains-any', tagArray));
            } else {
                return null;
            }
        }

        return query(q, orderBy('createdAt', 'desc'), limit(count));
    }, [firestore, sourceType, sourceIds, tags, count]);

    const { data: posts, isLoading } = useCollection<Post>(postsQuery);
    
    const sourceNotConfigured = useMemo(() => {
        if (sourceType === 'category') return !sourceIds || sourceIds.length === 0;
        if (sourceType === 'tag') return !tags || tags.trim() === '';
        return true;
    }, [sourceType, sourceIds, tags]);

    if (sourceNotConfigured) {
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
    
    const gridTemplateColumns = layout === 'grid' ? `repeat(${gridColumns}, minmax(0, 1fr))` : undefined;

    return (
        <Card>
            <CardHeader>
                <CardTitle className="font-headline text-lg">{title}</CardTitle>
            </CardHeader>
            <CardContent>
                {isLoading && <p className="text-sm text-muted-foreground">Loading posts...</p>}
                
                {!isLoading && posts && posts.length > 0 && (
                     <div 
                        className={cn('grid gap-4', layout === 'list' && 'grid-cols-1')}
                        style={{ gridTemplateColumns }}
                    >
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
