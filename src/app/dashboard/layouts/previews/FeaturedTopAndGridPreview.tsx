'use client';

import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type FeaturedTopAndGridPreviewProps = {
    config: {
        gridColumns?: number;
        showSmallImages?: boolean;
        showSmallExcerpts?: boolean;
    }
}

export function FeaturedTopAndGridPreview({ config }: FeaturedTopAndGridPreviewProps) {
    const { 
        gridColumns = 3, 
        showSmallImages = true, 
        showSmallExcerpts = false,
    } = config;
    
    const gridColsClass = {
        1: 'grid-cols-1',
        2: 'grid-cols-2',
        3: 'grid-cols-3',
        4: 'grid-cols-4',
        5: 'grid-cols-5',
        6: 'grid-cols-6',
    }[gridColumns] || 'grid-cols-3';

    return (
        <div className="space-y-4">
            {/* Featured Post */}
            <div className="grid grid-cols-2 gap-4">
                 <Skeleton className="w-full aspect-video" />
                 <div className="space-y-2">
                    <Skeleton className="w-full h-5" />
                    <Skeleton className="w-3/4 h-5" />
                    <Skeleton className="w-full h-3 mt-2" />
                    <Skeleton className="w-full h-3" />
                    <Skeleton className="w-1/2 h-3" />
                    <Skeleton className="w-1/4 h-3 mt-1" />
                 </div>
            </div>
            
            {/* Grid Posts */}
            <div className={cn("grid gap-4 pt-4 border-t", gridColsClass)}>
                {Array.from({ length: gridColumns }).map((_, index) => (
                    <div key={index} className="space-y-2">
                        {showSmallImages && <Skeleton className="w-full aspect-video" />}
                        <Skeleton className="w-full h-4" />
                        <Skeleton className="w-5/6 h-4" />
                        {showSmallExcerpts && (
                            <div className="space-y-1 pt-1">
                                <Skeleton className="w-full h-3" />
                                <Skeleton className="w-2/3 h-3" />
                            </div>
                        )}
                        <Skeleton className="w-1/3 h-3 pt-1" />
                    </div>
                ))}
            </div>
        </div>
    )
}
