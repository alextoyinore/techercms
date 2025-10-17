'use client';

import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type BigFeaturedPreviewProps = {
    config: {
        imagePosition?: 'left' | 'right';
        showExcerpt?: boolean;
    }
}

export function BigFeaturedPreview({ config }: BigFeaturedPreviewProps) {
    const { 
        imagePosition = 'left',
        showExcerpt = true,
    } = config;

    const imageOrder = imagePosition === 'right' ? 'md:order-2' : 'md:order-1';
    const contentOrder = imagePosition === 'right' ? 'md:order-1' : 'md:order-2';
    
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div className={cn("relative aspect-[4/3] w-full", imageOrder)}>
                 <Skeleton className="w-full h-full" />
            </div>
            <div className={cn("flex flex-col justify-center space-y-3", contentOrder)}>
                <Skeleton className="w-4/5 h-6" />
                <Skeleton className="w-2/3 h-6" />
                <Skeleton className="w-1/3 h-4 mt-1" />
                 {showExcerpt && (
                    <div className="space-y-1.5 pt-2">
                        <Skeleton className="w-full h-3" />
                        <Skeleton className="w-full h-3" />
                        <Skeleton className="w-5/6 h-3" />
                    </div>
                )}
                 <Skeleton className="w-24 h-8 mt-3" />
            </div>
        </div>
    )
}
