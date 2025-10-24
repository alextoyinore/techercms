
'use client';

import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Play, SkipBack, SkipForward, ListMusic } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

type AudioPlayerPreviewProps = {
    config: {
        title?: string;
    }
}

export function AudioPlayerPreview({ config }: AudioPlayerPreviewProps) {
    const { title = 'Listen to Articles' } = config;

    return (
        <Card className="overflow-hidden">
            <div className="bg-muted/50 p-4 space-y-2">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <div className="flex items-center justify-center gap-4 pt-2">
                    <Button variant="ghost" size="icon" disabled>
                        <SkipBack className="h-6 w-6" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-12 w-12 rounded-full" disabled>
                        <Play className="h-8 w-8" />
                    </Button>
                    <Button variant="ghost" size="icon" disabled>
                        <SkipForward className="h-6 w-6" />
                    </Button>
                </div>
            </div>
            <CardContent className="p-0">
                <div className="p-2 border-b flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                   <ListMusic className="h-4 w-4" />
                   Up Next
                </div>
                <div className="p-3 space-y-3">
                    {Array.from({ length: 3 }).map((_, index) => (
                         <div key={index} className="space-y-1">
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-3 w-1/3" />
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
