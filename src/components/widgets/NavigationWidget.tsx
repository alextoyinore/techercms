'use client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import Link from 'next/link';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, orderBy } from 'firebase/firestore';

type NavLink = {
    id: string;
    label: string;
    url: string;
    order: number;
}

type NavigationWidgetProps = {
    title?: string;
    menuId?: string;
}

export function NavigationWidget({ title = 'Navigation', menuId }: NavigationWidgetProps) {
    const firestore = useFirestore();

    const menuItemsQuery = useMemoFirebase(() => {
        if (!firestore || !menuId) return null;
        return query(
            collection(firestore, 'navigation_menu_items'),
            where('menuId', '==', menuId),
            orderBy('order', 'asc')
        );
    }, [firestore, menuId]);

    const { data: navLinks, isLoading } = useCollection<NavLink>(menuItemsQuery);
    
    const showLoading = isLoading && menuId;
    const showNoMenu = !menuId;
    const showNoLinks = !isLoading && navLinks?.length === 0 && menuId;

    return (
        <Card>
            <CardHeader>
                <CardTitle className="font-headline text-lg">{title}</CardTitle>
            </CardHeader>
            <CardContent>
                {showLoading && <p className="text-sm text-muted-foreground">Loading links...</p>}
                {showNoMenu && <p className="text-sm text-muted-foreground">Please select a menu in the widget settings.</p>}
                {showNoLinks && <p className="text-sm text-muted-foreground">This menu has no links yet.</p>}
                
                {navLinks && navLinks.length > 0 && (
                    <ul className="space-y-2">
                        {navLinks.map((link) => (
                            <li key={link.id}>
                                <Link href={link.url} className="text-sm text-primary hover:underline">
                                    {link.label}
                                </Link>
                            </li>
                        ))}
                    </ul>
                )}
            </CardContent>
        </Card>
    );
}
