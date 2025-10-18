
'use client';

import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type TabbedPostsPreviewProps = {
    config: {
        tabs?: { id: string, title: string }[];
        showImages?: boolean;
        showExcerpts?: boolean;
    }
}

export function TabbedPostsPreview({ config }: TabbedPostsPreviewProps) {
    const { tabs = [], showImages = true, showExcerpts = true } = config;
    const defaultTab = tabs[0]?.id;

    return (
        <Tabs defaultValue={defaultTab}>
            <TabsList>
                {tabs.map((tab) => (
                    <TabsTrigger key={tab.id} value={tab.id}>{tab.title}</TabsTrigger>
                ))}
            </TabsList>
            {tabs.map((tab) => (
                 <TabsContent key={tab.id} value={tab.id}>
                    <div className="space-y-4 rounded-lg border p-4 mt-2">
                        {Array.from({ length: 3 }).map((_, index) => (
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
                </TabsContent>
            ))}
        </Tabs>
    )
}
