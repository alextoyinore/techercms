'use client';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, orderBy, limit, Timestamp } from 'firebase/firestore';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { format } from 'date-fns';
import Image from 'next/image';

type Post = {
    id: string;
    title: string;
    slug: string;
    excerpt: string;
    featuredImageUrl: string;
    createdAt: Timestamp;
}

type RecentPostsWidgetProps = {
    title?: string;
    filterType?: 'latest' | 'category' | 'tag';
    sourceIds?: string[];
    tags?: string;
    postCount?: number;
    showExcerpts?: boolean;
    showImages?: boolean;
}

export function RecentPostsWidget({ 
    title = 'Recent Posts',
    filterType = 'latest',
    sourceIds,
    tags,
    postCount = 5,
    showExcerpts = true,
    showImages = true,
}: RecentPostsWidgetProps) {
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

    if (isLoading) {
        return (
             <Card>
                <CardHeader>
                    <CardTitle className="font-headline text-lg">{title}</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">Loading posts...</p>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="font-headline text-lg">{title}</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {posts && posts.length > 0 ? posts.map(post => (
                        <div key={post.id} className="flex items-start gap-4">
                           {showImages && post.featuredImageUrl && (
                                <Link href={`/${post.slug}`} className="block shrink-0">
                                    <div className="relative h-16 w-24 rounded-md overflow-hidden">
                                        <Image
                                            src={post.featuredImageUrl}
                                            alt={post.title}
                                            fill
                                            className="object-cover"
                                        />
                                    </div>
                                </Link>
                           )}
                           <div className="flex-grow">
                                <Link href={`/${post.slug}`} className="font-medium hover:underline leading-tight block text-sm">
                                    {post.title}
                                </Link>
                                {showExcerpts && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{post.excerpt}</p>}
                                <p className="text-xs text-muted-foreground/80 mt-1">
                                    {post.createdAt ? format(post.createdAt.toDate(), 'MMM d, yyyy') : ''}
                                </p>
                           </div>
                        </div>
                    )) : (
                        <p className="text-sm text-muted-foreground">No recent posts found.</p>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
