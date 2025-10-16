'use client';

import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

type CtaPreviewProps = {
    config: {
        headline?: string;
        subheadline?: string;
        buttonText?: string;
    }
}

export function CtaPreview({ config }: CtaPreviewProps) {
    const { headline = "Call to Action", subheadline, buttonText = "Get Started" } = config;
    
    return (
        <div className="p-8 rounded-lg border text-center space-y-4">
            <h3 className="text-2xl font-bold">{headline}</h3>
            {subheadline && <p className="text-muted-foreground">{subheadline}</p>}
            <Button disabled>{buttonText}</Button>
        </div>
    )
}

    