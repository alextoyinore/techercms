'use client';

import { Skeleton } from "@/components/ui/skeleton";
import Image from "next/image";

type GalleryPreviewProps = {
    config: {
        images?: { id: string; url: string }[];
    }
}

export function GalleryPreview({ config }: GalleryPreviewProps) {
    const { images = [] } = config;

    return (
        <div className="grid grid-cols-3 gap-2 rounded-lg border p-4">
            {images.length > 0 ? (
                images.map((image) => (
                     <div key={image.id} className="relative aspect-square w-full">
                        <Image src={image.url} alt="Gallery preview" fill className="rounded-md object-cover" />
                    </div>
                ))
            ) : (
                Array.from({ length: 6 }).map((_, index) => (
                    <Skeleton key={index} className="aspect-square w-full" />
                ))
            )}
        </div>
    )
}
