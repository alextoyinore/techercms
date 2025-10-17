'use client';

import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";

type FeaturedAndListPreviewProps = {
    config: {
        showSmallImages?: boolean;
        showSmallExcerpts?: boolean;
    }
}

export function FeaturedAndListPreview({ config }: FeaturedAndListPreviewProps) {
    const { 
        showSmallImages = true, 
        showSmallExcerpts = true,
    } = config;

    return (
        <div className="space-y-4">
            {/* Featured Post */}
            <div className="space-y-2">
                 <Skeleton className="w-full aspect-video" />
                 <Skeleton className="w-4/5 h-5" />
                 <Skeleton className="w-full h-3 mt-2" />
                 <Skeleton className="w-full h-3" />
                 <Skeleton className="w-1/2 h-3" />
                 <Skeleton className="w-1/4 h-3 mt-1" />
            </div>
            
            <Separator />
            
            {/* List Posts */}
            <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, index) => (
                    <div key={index} className="flex gap-2 items-start">
                        {showSmallImages && <Skeleton className="h-12 w-16 shrink-0" />}
                        <div className="flex-1 space-y-1.5">
                            <Skeleton className="w-full h-4" />
                            {showSmallExcerpts && (
                                <div className="space-y-1.5 mt-1">
                                    <Skeleton className="w-full h-3" />
                                    <Skeleton className="w-4/5 h-3" />
                                </div>
                            )}
                            <Skeleton className="w-1/3 h-3 mt-1" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}

    