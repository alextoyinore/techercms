
'use client';

import { useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import Link from 'next/link';

type User = {
    id: string;
    displayName?: string;
    photoURL?: string;
    bio?: string;
}

export const PostAuthorBio: React.FC<{ authorId: string }> = ({ authorId }) => {
    const firestore = useFirestore();
    const authorRef = useMemoFirebase(() => {
        if (!firestore || !authorId) return null;
        return doc(firestore, 'users', authorId);
    }, [firestore, authorId]);

    const { data: author } = useDoc<User>(authorRef);

    if (!author) return null;

    return (
        <div className="mt-12 pt-8 border-t">
            <div className="flex items-center gap-4 rounded-lg bg-muted/50 p-6">
                <Link href={`/author/${author.id}`}>
                    <Avatar className="h-20 w-20">
                        <AvatarImage src={author.photoURL} alt={author.displayName} />
                        <AvatarFallback>{author.displayName?.charAt(0) || 'A'}</AvatarFallback>
                    </Avatar>
                </Link>
                <div className="flex-1">
                    <h4 className="font-bold font-headline text-lg">
                        <Link href={`/author/${author.id}`} className="hover:underline">
                            {author.displayName || 'Anonymous'}
                        </Link>
                    </h4>
                    <p className="text-sm text-muted-foreground mt-1">{author.bio || 'The author has not provided a biography.'}</p>
                </div>
            </div>
        </div>
    );
};

    