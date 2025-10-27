
'use client';

import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

type SubscriptionFormPreviewProps = {
    config: {
        title?: string;
        description?: string;
        buttonText?: string;
    }
}

export function SubscriptionFormPreview({ config }: SubscriptionFormPreviewProps) {
    const { title = 'Subscribe', description, buttonText = 'Subscribe' } = config;

    return (
        <div className="space-y-3 rounded-lg border p-6 text-center bg-card">
            <h3 className="font-bold text-xl">{title}</h3>
            {description && <p className="text-sm text-muted-foreground">{description}</p>}
            <div className="flex w-full max-w-sm mx-auto items-center space-x-2 pt-2">
                <Skeleton className="h-9 flex-1" />
                <Button disabled>{buttonText}</Button>
            </div>
        </div>
    )
}
