'use client';

import { Skeleton } from "@/components/ui/skeleton";

type TabbedPostsPreviewProps = {
    config: {
        tabs?: { title: string }[];
    }
}

export function TabbedPostsPreview({ config }: TabbedPostsPreviewProps) {
    const { tabs = [] } = config;
    return (
        <div className="space-y-4">
            <div className="flex gap-2 border-b">
                {tabs.map((tab, index) => (
                    <Skeleton key={index} className="h-8 w-20 rounded-t-md" />
                ))}
            </div>
            <div className="space-y-4">
                 {Array.from({ length: 3 }).map((_, index) => (
                     <div key={index} className="flex gap-4">
                        <Skeleton className="h-16 w-24 shrink-0" />
                        <div className="flex-1 space-y-2">
                            <Skeleton className="w-4/5 h-4" />
                            <div className="space-y-1.5">
                                <Skeleton className="w-full h-3" />
                                <Skeleton className="w-5/6 h-3" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
