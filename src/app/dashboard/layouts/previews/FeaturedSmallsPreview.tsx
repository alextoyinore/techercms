'use client';

import { Skeleton } from "@/components/ui/skeleton";

type FeaturedSmallsPreviewProps = {
    config: {
        smallPostCount?: number;
    }
}

export function FeaturedSmallsPreview({ config }: FeaturedSmallsPreviewProps) {
    const { smallPostCount = 4 } = config;
    return (
        <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2 space-y-2">
                 <Skeleton className="w-full aspect-video" />
                 <Skeleton className="w-4/5 h-5" />
                 <div className="space-y-1.5">
                    <Skeleton className="w-full h-3" />
                    <Skeleton className="w-full h-3" />
                    <Skeleton className="w-5/6 h-3" />
                 </div>
            </div>
            <div className="col-span-1 space-y-4">
                {Array.from({ length: smallPostCount }).map((_, index) => (
                    <div key={index} className="flex gap-2">
                        <Skeleton className="h-12 w-16 shrink-0" />
                        <div className="flex-1 space-y-1.5">
                            <Skeleton className="w-full h-3" />
                            <Skeleton className="w-4/5 h-3" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
