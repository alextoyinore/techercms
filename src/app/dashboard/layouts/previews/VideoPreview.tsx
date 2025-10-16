'use client';

import { Skeleton } from "@/components/ui/skeleton";
import { PlayCircle } from "lucide-react";

export function VideoPreview() {
    return (
        <div className="relative aspect-video w-full rounded-lg border bg-muted flex items-center justify-center">
            <PlayCircle className="h-16 w-16 text-muted-foreground/50" />
        </div>
    )
}

    