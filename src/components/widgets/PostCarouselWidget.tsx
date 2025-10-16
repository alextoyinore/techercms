'use client';

import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, orderBy, limit, Timestamp } from 'firebase/firestore';
import { useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';

type Post = {
    id: string;
    title: string;
    slug: string;
    featuredImageUrl: string;
    createdAt: Timestamp;
};

type PostCarouselWidgetProps = {
    title?: string;
    filterType?: 'latest' | 'category' | 'tag';
    categoryIds?: string[];
    tagIds?: string[];
    postCount?: number;
}

export function PostCarouselWidget({
    title = 'Featured Posts',
    filterType = 'latest',
    categoryIds,
    tagIds,
    postCount = 8
}: PostCarouselWidgetProps) {
    const firestore = useFirestore();

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

        return query(q, orderBy('createdAt', 'desc'), limit(postCount));
    }, [firestore, filterType, categoryIds, tagIds, postCount]);

    const { data: posts, isLoading } = useCollection<Post>(postsQuery);

    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="font-headline text-lg">{title}</CardTitle>
                </CardHeader>
                <CardContent>
                    <p>Loading posts...</p>
                </CardContent>
            </Card>
        );
    }
    
    if (!posts || posts.length === 0) {
        return null;
    }

    return (
        <div className="w-full">
            <h2 className="text-2xl font-bold font-headline mb-4">{title}</h2>
            <Carousel
                opts={{
                    align: "start",
                    loop: true,
                }}
                 className="w-full"
            >
                <CarouselContent>
                    {posts.map((post) => (
                        <CarouselItem key={post.id} className="md:basis-1/2 lg:basis-1/3 xl:basis-1/4">
                             <div className="p-1">
                                <Link href={`/${post.slug}`} className="block group">
                                    <Card className="overflow-hidden">
                                        <CardContent className="p-0">
                                            <div className="relative aspect-video">
                                                <Image 
                                                    src={post.featuredImageUrl || 'https://picsum.photos/seed/carousel-post/600/400'}
                                                    alt={post.title}
                                                    fill
                                                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                                                />
                                            </div>
                                            <div className="p-4">
                                                <h3 className="font-semibold leading-tight line-clamp-2">{post.title}</h3>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </Link>
                            </div>
                        </CarouselItem>
                    ))}
                </CarouselContent>
                <CarouselPrevious className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4" />
                <CarouselNext className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4"/>
            </Carousel>
        </div>
    );
}
