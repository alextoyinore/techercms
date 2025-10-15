'use client';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { useMemo } from 'react';
import { RecentPostsWidget } from '@/components/widgets/RecentPostsWidget';
import { CategoriesListWidget } from '@/components/widgets/CategoriesListWidget';
import { SearchWidget } from '@/components/widgets/SearchWidget';
import { TagCloudWidget } from '@/components/widgets/TagCloudWidget';
import { CustomHtmlWidget } from '@/components/widgets/CustomHtmlWidget';
import { ImageWidget } from '@/components/widgets/ImageWidget';
import { SocialFollowWidget } from '@/components/widgets/SocialFollowWidget';
import { TradingTickerWidget } from '@/components/widgets/TradingTickerWidget';
import { BreakingNewsWidget } from '@/components/widgets/BreakingNewsWidget';
import { LiveScoreWidget } from '@/components/widgets/LiveScoreWidget';
import { SportingTablesWidget } from '@/components/widgets/SportingTablesWidget';
import { TextWidget } from '@/components/widgets/TextWidget';
import { GalleryWidget } from '@/components/widgets/GalleryWidget';
import { NavigationWidget } from '@/components/widgets/NavigationWidget';
import { PostShowcaseWidget } from '@/components/widgets/PostShowcaseWidget';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type WidgetInstance = {
    id: string;
    widgetAreaId: string;
    type: string;
    order: number;
    config?: any;
};

type WidgetArea = {
    id: string;
    name: string;
}

const widgetComponents: Record<string, React.FC<any>> = {
    'recent-posts': RecentPostsWidget,
    'categories-list': CategoriesListWidget,
    'search': SearchWidget,
    'tag-cloud': TagCloudWidget,
    'custom-html': CustomHtmlWidget,
    'image': ImageWidget,
    'social-follow': SocialFollowWidget,
    'trading-ticker': TradingTickerWidget,
    'breaking-news': BreakingNewsWidget,
    'live-score': LiveScoreWidget,
    'sporting-tables': SportingTablesWidget,
    'text': TextWidget,
    'gallery': GalleryWidget,
    'navigation-menu': NavigationWidget,
    'post-showcase': PostShowcaseWidget,
};

export function WidgetArea({ areaName }: { areaName: string }) {
    const firestore = useFirestore();

    const widgetAreasQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'widget_areas'), where('name', '==', areaName));
    }, [firestore, areaName]);
    
    const { data: widgetAreas, isLoading: isLoadingAreas } = useCollection<WidgetArea>(widgetAreasQuery);

    const areaId = useMemo(() => widgetAreas?.[0]?.id, [widgetAreas]);

    const widgetInstancesQuery = useMemoFirebase(() => {
        if (!firestore || !areaId) return null;
        return query(collection(firestore, 'widget_instances'), where('widgetAreaId', '==', areaId));
    }, [firestore, areaId]);

    const { data: widgetInstances, isLoading: isLoadingInstances } = useCollection<WidgetInstance>(widgetInstancesQuery);

    const sortedInstances = useMemo(() => {
        if (!widgetInstances) return [];
        return [...widgetInstances].sort((a, b) => a.order - b.order);
    }, [widgetInstances]);

    if (isLoadingAreas || isLoadingInstances) {
        return (
            <div className='space-y-4'>
                <div className="p-4 border rounded-lg animate-pulse bg-muted/50 h-24"></div>
                <div className="p-4 border rounded-lg animate-pulse bg-muted/50 h-32"></div>
            </div>
        )
    }

    if (!sortedInstances || sortedInstances.length === 0) {
        return null;
    }

    return (
        <>
            {sortedInstances.map(instance => {
                const WidgetComponent = widgetComponents[instance.type];
                if (WidgetComponent) {
                    return <WidgetComponent key={instance.id} {...instance.config} />;
                }
                return (
                    <Card key={instance.id}>
                        <CardHeader>
                            <CardTitle className="text-base">Unknown Widget</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground">Widget type "{instance.type}" is not implemented.</p>
                        </CardContent>
                    </Card>
                )
            })}
        </>
    );
}
