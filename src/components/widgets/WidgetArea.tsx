'use client';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { useMemo } from 'react';
import { RecentPostsWidget } from '@/components/widgets/RecentPostsWidget';
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
    // Future widgets can be added here
    // 'categories-list': CategoriesListWidget,
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
        return <p>Loading widgets...</p>;
    }

    if (!sortedInstances || sortedInstances.length === 0) {
        return null; // Don't render anything if there are no widgets for this area
    }

    return (
        <>
            {sortedInstances.map(instance => {
                const WidgetComponent = widgetComponents[instance.type];
                if (WidgetComponent) {
                    return <WidgetComponent key={instance.id} {...instance.config} />;
                }
                return null;
            })}
        </>
    );
}
