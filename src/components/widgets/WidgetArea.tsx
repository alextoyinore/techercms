
'use client';
import { useFirestore, useCollection, useMemoFirebase, useDoc } from '@/firebase';
import { collection, query, where, doc } from 'firebase/firestore';
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
import { WeatherWidget } from '@/components/widgets/WeatherWidget';
import { PostCarouselWidget } from '@/components/widgets/PostCarouselWidget';
import { FeaturedSmallsWidget } from '@/components/widgets/FeaturedSmallsWidget';
import { TabbedPostsWidget } from '@/components/widgets/TabbedPostsWidget';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AudioPlayerWidget } from './AudioPlayerWidget';
import { SubscriptionWidget } from './SubscriptionWidget';
import { FeaturedTopAndGridWidget } from './FeaturedTopAndGridWidget';
import { FeaturedAndListWidget } from './FeaturedAndListWidget';
import { BigFeaturedWidget } from './BigFeaturedWidget';
import { ChartWidget } from './ChartWidget';


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
    'weather': WeatherWidget,
    'post-carousel': PostCarouselWidget,
    'featured-and-smalls': FeaturedSmallsWidget,
    'tabbed-posts': TabbedPostsWidget,
    'audio-player': AudioPlayerWidget,
    'subscription-form': SubscriptionWidget,
    'featured-top-and-grid': FeaturedTopAndGridWidget,
    'featured-and-list': FeaturedAndListWidget,
    'big-featured': BigFeaturedWidget,
    'chart': ChartWidget,
};

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
    pageId?: string;
}

type Page = {
    id: string;
    disabledWidgetAreas?: string[];
}

export function WidgetArea({ areaName, isPageSpecific = false, pageId }: { areaName: string, isPageSpecific?: boolean, pageId?: string }) {
    const firestore = useFirestore();

    const pageRef = useMemoFirebase(() => {
        if(!firestore || !pageId) return null;
        return doc(firestore, 'pages', pageId);
    }, [firestore, pageId]);
    const { data: pageData } = useDoc<Page>(pageRef);

    const widgetAreasQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        let q = query(collection(firestore, 'widget_areas'), where('name', '==', areaName));
        
        if (isPageSpecific) {
            // This requires the pageId to be passed for page-specific areas
            if (!pageId) return null;
            q = query(q, where('pageId', '==', pageId));
        } else {
            // For theme-wide areas, ensure we don't fetch page-specific ones
            q = query(q, where('pageId', '==', null));
        }
        return q;
    }, [firestore, areaName, isPageSpecific, pageId]);
    
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
    
    const isDisabled = pageData?.disabledWidgetAreas?.includes(areaName);

    if (isDisabled || isLoadingAreas || isLoadingInstances) {
        return null;
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

    