'use client';
import { useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import Link from 'next/link';

type User = {
    id: string;
    displayName?: string;
}

export const PostAuthor: React.FC<{ authorId: string }> = ({ authorId }) => {
    const firestore = useFirestore();
    const authorRef = useMemoFirebase(() => {
        if (!firestore || !authorId) return null;
        return doc(firestore, 'users', authorId);
    }, [firestore, authorId]);

    const { data: author } = useDoc<User>(authorRef);

    if (!author) return null;

    return (
        <span className="font-semibold hover:underline">
            {author.displayName || 'Anonymous'}
        </span>
    );
};
