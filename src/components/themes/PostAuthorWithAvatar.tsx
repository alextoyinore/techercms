
'use client';
import { useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

type User = {
    id: string;
    displayName?: string;
    photoURL?: string;
}

export const PostAuthorWithAvatar: React.FC<{ authorId: string }> = ({ authorId }) => {
    const firestore = useFirestore();
    const authorRef = useMemoFirebase(() => {
        if (!firestore || !authorId) return null;
        return doc(firestore, 'users', authorId);
    }, [firestore, authorId]);

    const { data: author } = useDoc<User>(authorRef);

    if (!author) return null;

    return (
        <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
                <AvatarImage src={author.photoURL} alt={author.displayName} />
                <AvatarFallback>{author.displayName?.charAt(0) || 'A'}</AvatarFallback>
            </Avatar>
            <div>
                <span className="font-semibold block">{author.displayName || 'Anonymous'}</span>
                <span className="text-xs text-muted-foreground">Author</span>
            </div>
        </div>
    );
};
