'use client';

import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type FeaturedSmallsPreviewProps = {
    config: {
        smallPostCount?: number;
        featuredWidth?: number;
        showSmallImages?: boolean;
        showSmallExcerpts?: boolean;
    }
}

export function FeaturedSmallsPreview({ config }: FeaturedSmallsPreviewProps) {
    const { smallPostCount = 4, featuredWidth = 66, showSmallImages = true, showSmallExcerpts = false } = config;

    const featuredColSpan = featuredWidth > 60 ? "md:col-span-2" : "md:col-span-1";
    const smallColSpan = featuredWidth > 60 ? "md:col-span-1" : "md:col-span-1";
    const gridCols = featuredWidth > 60 ? "md:grid-cols-3" : "md:grid-cols-2";
    
    return (
        <div className={cn("grid grid-cols-1 gap-8", gridCols)}>
            <div className={cn("space-y-2", featuredColSpan)}>
                 <Skeleton className="w-full aspect-video" />
                 <Skeleton className="w-4/5 h-5" />
                 <Skeleton className="w-full h-4" />
                 <div className="space-y-1.5">
                    <Skeleton className="w-full h-3" />
                    <Skeleton className="w-full h-3" />
                    <Skeleton className="w-5/6 h-3" />
                 </div>
            </div>
            <div className={cn("space-y-4", smallColSpan)}>
                {Array.from({ length: smallPostCount }).map((_, index) => (
                    <div key={index} className="flex gap-2 items-start">
                        {showSmallImages && <Skeleton className="h-12 w-16 shrink-0" />}
                        <div className="flex-1 space-y-1.5">
                            <Skeleton className="w-full h-4" />
                            <Skeleton className="w-full h-3" />
                            {showSmallExcerpts && <Skeleton className="w-4/5 h-3 mt-1" />}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
