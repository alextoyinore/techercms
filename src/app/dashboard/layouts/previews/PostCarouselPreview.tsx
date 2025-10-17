
'use client';

import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type PostCarouselPreviewProps = {
    config: {
        postCount?: number;
        showImages?: boolean;
        showExcerpts?: boolean;
        imagePosition?: 'before' | 'after';
    }
}

export function PostCarouselPreview({ config }: PostCarouselPreviewProps) {
    const { postCount = 5, showImages = true, showExcerpts = false, imagePosition = 'before' } = config;
    const isImageAfter = imagePosition === 'after';

    return (
        <div className="flex items-center gap-4">
            <Skeleton className="h-6 w-6 rounded-full" />
            <div className="flex-1 flex gap-4 overflow-hidden">
                {Array.from({ length: postCount }).map((_, index) => (
                    <div key={index} className={cn("w-2/5 shrink-0 space-y-2 flex flex-col", isImageAfter && "flex-col-reverse justify-end")}>
                        {showImages && <Skeleton className="w-full aspect-video" />}
                        <div className="space-y-1.5">
                            <Skeleton className="w-4/5 h-4" />
                            {showExcerpts && (
                                <div className="space-y-1.5 mt-1">
                                    <Skeleton className="w-full h-3" />
                                    <Skeleton className="w-5/6 h-3" />
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
            <Skeleton className="h-6 w-6 rounded-full" />
        </div>
    )
}
