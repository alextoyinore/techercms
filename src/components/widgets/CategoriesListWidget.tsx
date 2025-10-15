'use client';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, orderBy, query } from 'firebase/firestore';
import { useMemo } from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { List } from 'lucide-react';

type Category = {
    id: string;
    name: string;
    slug: string;
}

export function CategoriesListWidget() {
    const firestore = useFirestore();

    const categoriesQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(
            collection(firestore, 'categories'), 
            orderBy('name', 'asc')
        );
    }, [firestore]);

    const { data: categories, isLoading } = useCollection<Category>(categoriesQuery);

    return (
        <Card>
            <CardHeader>
                <CardTitle className="font-headline text-lg flex items-center gap-2">
                    <List className="h-4 w-4" />
                    Categories
                </CardTitle>
            </CardHeader>
            <CardContent>
                {isLoading && <p className="text-sm text-muted-foreground">Loading categories...</p>}
                <ul className="space-y-2">
                    {categories && categories.map(category => (
                        <li key={category.id} className="text-sm">
                            <Link href={`/category/${category.slug}`} className="text-primary hover:underline">
                                {category.name}
                            </Link>
                        </li>
                    ))}
                    {!isLoading && categories?.length === 0 && (
                        <p className="text-sm text-muted-foreground">No categories found.</p>
                    )}
                </ul>
            </CardContent>
        </Card>
    );
}
