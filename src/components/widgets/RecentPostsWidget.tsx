'use client';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, orderBy, limit, Timestamp } from 'firebase/firestore';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { format } from 'date-fns';

type Post = {
    id: string;
    title: string;
    slug: string;
    createdAt: Timestamp;
}

type RecentPostsWidgetProps = {
    title?: string;
    count?: number;
}

export function RecentPostsWidget({ title = 'Recent Posts', count = 5 }: RecentPostsWidgetProps) {
    const firestore = useFirestore();

    const postsQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(
            collection(firestore, 'posts'), 
            where('status', '==', 'published'),
            orderBy('createdAt', 'desc'),
            limit(count)
        );
    }, [firestore, count]);

    const { data: posts, isLoading } = useCollection<Post>(postsQuery);

    return (
        <Card>
            <CardHeader>
                <CardTitle className="font-headline text-lg">{title}</CardTitle>
            </CardHeader>
            <CardContent>
                {isLoading && <p className="text-sm text-muted-foreground">Loading posts...</p>}
                <div className="space-y-4">
                    {posts && posts.map(post => (
                        <div key={post.id} className="text-sm">
                            <Link href={`/${post.slug}`} className="font-medium hover:underline leading-tight block">
                                {post.title}
                            </Link>
                            <p className="text-xs text-muted-foreground mt-1">
                                {post.createdAt ? format(post.createdAt.toDate(), 'MMM d, yyyy') : ''}
                            </p>
                        </div>
                    ))}
                    {!isLoading && posts?.length === 0 && (
                        <p className="text-sm text-muted-foreground">No recent posts found.</p>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
