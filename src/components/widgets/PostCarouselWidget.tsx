'use client';

import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, orderBy, limit, Timestamp } from 'firebase/firestore';
import { useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { cn } from '@/lib/utils';

type Post = {
    id: string;
    title: string;
    slug: string;
    excerpt: string;
    featuredImageUrl: string;
    createdAt: Timestamp;
};

type PostCarouselWidgetProps = {
    title?: string;
    filterType?: 'latest' | 'category' | 'tag';
    sourceIds?: string[];
    tags?: string;
    postCount?: number;
    showExcerpts?: boolean;
    showImages?: boolean;
    imagePosition?: 'before' | 'after';
}

export function PostCarouselWidget({
    title = 'Featured Posts',
    filterType = 'latest',
    sourceIds,
    tags,
    postCount = 8,
    showExcerpts = false,
    showImages = true,
    imagePosition = 'before',
}: PostCarouselWidgetProps) {
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
    
    const isImageAfter = imagePosition === 'after';

    if (isLoading) {
        return (
             <div className="w-full">
                {title && <h2 className="text-2xl font-bold font-headline mb-4">{title}</h2>}
                <p>Loading posts...</p>
            </div>
        );
    }
    
    if (!posts || posts.length === 0) {
        return null;
    }

    return (
        <div className="w-full">
            {title && <h2 className="text-2xl font-bold font-headline mb-4">{title}</h2>}
            <Carousel
                opts={{
                    align: "start",
                    loop: posts.length > 3,
                }}
                 className="w-full"
            >
                <CarouselContent>
                    {posts.map((post) => (
                        <CarouselItem key={post.id} className="md:basis-1/2 lg:basis-1/3 xl:basis-1/4">
                             <div className="p-1 h-full">
                                <Link href={`/${post.slug}`} className="block group h-full">
                                    <Card className="overflow-hidden h-full flex flex-col">
                                        <CardContent className={cn("p-0 flex-grow flex flex-col", isImageAfter && "flex-col-reverse")}>
                                            {showImages && post.featuredImageUrl && (
                                                <div className="relative aspect-video">
                                                    <Image 
                                                        src={post.featuredImageUrl}
                                                        alt={post.title}
                                                        fill
                                                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                                                    />
                                                </div>
                                            )}
                                            <div className="p-4 flex-grow flex flex-col">
                                                <h3 className="font-semibold leading-tight line-clamp-2 flex-grow text-sm">{post.title}</h3>
                                                {showExcerpts && <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{post.excerpt}</p>}
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
