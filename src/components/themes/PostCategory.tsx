'use client';
import { useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import Link from 'next/link';

type Category = {
    id: string;
    name: string;
    slug: string;
}

export const PostCategory: React.FC<{ categoryId: string, className?: string }> = ({ categoryId, className }) => {
    const firestore = useFirestore();
    const categoryRef = useMemoFirebase(() => {
        if (!firestore || !categoryId) return null;
        return doc(firestore, 'categories', categoryId);
    }, [firestore, categoryId]);

    const { data: category } = useDoc<Category>(categoryRef);

    if (!category) return null;

    return (
        <Link href={`/category/${category.slug}`} className={className}>
            {category.name}
        </Link>
    );
};
