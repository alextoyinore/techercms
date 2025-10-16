'use client'

import { Skeleton } from "@/components/ui/skeleton"

type PostListPreviewProps = {
    config: {
        postCount?: number
        showImages?: boolean
        showExcerpts?: boolean
    }
}

export function PostListPreview({ config }: PostListPreviewProps) {
    const { postCount = 5, showImages = true, showExcerpts = true } = config

    return (
        <div className="space-y-6">
            {Array.from({ length: postCount }).map((_, index) => (
                <div key={index} className="flex gap-4">
                    {showImages && <Skeleton className="h-16 w-24 shrink-0" />}
                    <div className="flex-1 space-y-2">
                        <Skeleton className="w-4/5 h-4" />
                        {showExcerpts && (
                             <div className="space-y-1.5">
                                <Skeleton className="w-full h-3" />
                                <Skeleton className="w-5/6 h-3" />
                             </div>
                        )}
                    </div>
                </div>
            ))}
        </div>
    )
}
