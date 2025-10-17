'use client';

import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type FeaturedSmallsPreviewProps = {
    config: {
        smallPostCount?: number;
        featuredWidth?: number;
        showSmallImages?: boolean;
        showSmallExcerpts?: boolean;
        featuredPosition?: 'left' | 'right';
    }
}

export function FeaturedSmallsPreview({ config }: FeaturedSmallsPreviewProps) {
    const { 
        smallPostCount = 4, 
        featuredWidth = 50, 
        showSmallImages = true, 
        showSmallExcerpts = false,
        featuredPosition = 'left',
    } = config;

    const featuredColSpan = "md:col-span-1";
    const smallColSpan = "md:col-span-1";
    const gridCols = "md:grid-cols-2";

    const featuredOrder = featuredPosition === 'right' ? 'md:order-2' : 'md:order-1';
    const smallsOrder = featuredPosition === 'right' ? 'md:order-1' : 'md:order-2';
    
    return (
        <div className={cn("grid grid-cols-1 gap-8", gridCols)}>
            <div className={cn("space-y-2", featuredColSpan, featuredOrder)} style={{ flexBasis: `${featuredWidth}%`}}>
                 <Skeleton className="w-full aspect-video" />
                 <Skeleton className="w-4/5 h-5" />
                 <Skeleton className="w-full h-4" />
                 <div className="space-y-1.5">
                    <Skeleton className="w-full h-3" />
                    <Skeleton className="w-full h-3" />
                    <Skeleton className="w-5/6 h-3" />
                 </div>
                 <Skeleton className="w-1/4 h-3 mt-1" />
            </div>
            <div className={cn("space-y-4", smallColSpan, smallsOrder)} style={{ flexBasis: `${100-featuredWidth}%` }}>
                {Array.from({ length: smallPostCount }).map((_, index) => (
                    <div key={index} className="flex gap-2 items-start">
                        {showSmallImages && <Skeleton className="h-12 w-16 shrink-0" />}
                        <div className="flex-1 space-y-1.5">
                            <Skeleton className="w-full h-4" />
                            <Skeleton className="w-full h-3" />
                            {showSmallExcerpts && <Skeleton className="w-4/5 h-3 mt-1" />}
                            <Skeleton className="w-1/3 h-3 mt-1" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
