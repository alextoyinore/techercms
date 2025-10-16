'use client';

import { Skeleton } from "@/components/ui/skeleton";

export function GalleryPreview() {
    return (
        <div className="grid grid-cols-3 gap-2 rounded-lg border p-4">
            {Array.from({ length: 6 }).map((_, index) => (
                <Skeleton key={index} className="aspect-square w-full" />
            ))}
        </div>
    )
}

    