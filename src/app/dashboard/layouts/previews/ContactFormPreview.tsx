'use client';

import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

type ContactFormPreviewProps = {
    config: {
        submitButtonText?: string;
    }
}

export function ContactFormPreview({ config }: ContactFormPreviewProps) {
    const { submitButtonText = 'Send Message' } = config;

    return (
        <div className="space-y-4 rounded-lg border p-6">
            <div className="space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-8 w-full" />
            </div>
            <div className="space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-8 w-full" />
            </div>
             <div className="space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-20 w-full" />
            </div>
            <Button disabled className="w-full">{submitButtonText}</Button>
        </div>
    )
}

    