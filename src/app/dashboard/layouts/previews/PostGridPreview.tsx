'use client'

import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

type PostGridPreviewProps = {
    config: {
        postCount?: number
        columns?: number
        showImages?: boolean
        showExcerpts?: boolean
        imagePosition?: 'before' | 'after';
    }
}

export function PostGridPreview({ config }: PostGridPreviewProps) {
    const { postCount = 6, columns = 3, showImages = true, showExcerpts = false, imagePosition = 'before' } = config

    const gridCols = {
        1: 'grid-cols-1',
        2: 'grid-cols-2',
        3: 'grid-cols-3',
        4: 'grid-cols-4',
    }[columns] || 'grid-cols-3'
    
    const isImageAfter = imagePosition === 'after';

    return (
        <div className={cn("grid gap-4", gridCols)}>
            {Array.from({ length: postCount }).map((_, index) => (
                <div key={index} className={cn("grid gap-2", isImageAfter && "flex flex-col-reverse justify-end")}>
                    {showImages && <Skeleton className="w-full aspect-video" />}
                    <div className="space-y-1.5">
                        <Skeleton className="w-4/5 h-4" />
                        {showExcerpts && (
                             <div className="space-y-1.5">
                                <Skeleton className="w-full h-3" />
                                <Skeleton className="w-full h-3" />
                             </div>
                        )}
                    </div>
                </div>
            ))}
        </div>
    )
}
