'use client';
import { useFirestore, useCollection, useDoc, useMemoFirebase } from '@/firebase';
import { collection, query, where, doc, orderBy } from 'firebase/firestore';
import { useMemo } from 'react';
import Link from 'next/link';

type NavigationMenu = {
    id: string;
    name: string;
};

type NavigationMenuItem = {
    id: string;
    menuId: string;
    label: string;
    url: string;
    order: number;
};

type SiteSettings = {
    menuAssignments?: Record<string, string>;
};

type MenuProps = {
    locationId: string;
    className?: string;
    linkClassName?: string;
};

export function Menu({ locationId, className, linkClassName }: MenuProps) {
    const firestore = useFirestore();

    const settingsRef = useMemoFirebase(() => {
        if (!firestore) return null;
        return doc(firestore, 'site_settings', 'config');
    }, [firestore]);

    const { data: settings, isLoading: isLoadingSettings } = useDoc<SiteSettings>(settingsRef);
    
    const assignedMenuId = useMemo(() => {
        return settings?.menuAssignments?.[locationId];
    }, [settings, locationId]);

    const menuItemsQuery = useMemoFirebase(() => {
        if (!firestore || !assignedMenuId) return null;
        return query(
            collection(firestore, 'navigation_menu_items'),
            where('menuId', '==', assignedMenuId),
            orderBy('order', 'asc')
        );
    }, [firestore, assignedMenuId]);

    const { data: menuItems, isLoading: isLoadingItems } = useCollection<NavigationMenuItem>(menuItemsQuery);

    if (isLoadingSettings || (assignedMenuId && isLoadingItems)) {
        return <div className={className}><span className="text-sm text-muted-foreground">Loading Menu...</span></div>;
    }

    if (!assignedMenuId || !menuItems || menuItems.length === 0) {
        return null; // Don't render anything if no menu is assigned or it has no items
    }
    
    return (
        <nav className={className}>
            {menuItems.map(item => (
                <Link key={item.id} href={item.url} className={linkClassName}>
                    {item.label}
                </Link>
            ))}
        </nav>
    );
}
