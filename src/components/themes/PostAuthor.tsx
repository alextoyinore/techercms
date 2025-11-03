
'use client';
import { useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';

type User = {
    id: string;
    displayName?: string;
}

export const PostAuthor: React.FC<{ authorId: string, className?: string }> = ({ authorId, className }) => {
    const firestore = useFirestore();
    const authorRef = useMemoFirebase(() => {
        if (!firestore || !authorId) return null;
        return doc(firestore, 'users', authorId);
    }, [firestore, authorId]);

    const { data: author } = useDoc<User>(authorRef);

    if (!author) return null;

    return (
        <span className={`font-semibold ${className}`}>
            {author.displayName || 'Anonymous'}
        </span>
    );
};
