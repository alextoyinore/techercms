'use client';

import { Skeleton } from "@/components/ui/skeleton";

type HeroPreviewProps = {
    config: {
        headline?: string;
        subheadline?: string;
        buttonText?: string;
    }
}

export function HeroPreview({ config }: HeroPreviewProps) {
    const { headline = "Hero Headline", subheadline, buttonText = "Learn More" } = config;
    
    return (
        <div className="relative aspect-video w-full rounded-lg border p-8 flex flex-col justify-center items-center text-center space-y-4 bg-muted">
            <h2 className="text-3xl font-extrabold tracking-tight">{headline}</h2>
            {subheadline && <p className="text-lg text-muted-foreground">{subheadline}</p>}
            <Skeleton className="h-10 w-32" />
        </div>
    )
}

    