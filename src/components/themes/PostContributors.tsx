
'use client';

import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';

type User = {
    id: string;
    displayName?: string;
}

export const PostContributors: React.FC<{ contributorIds: string[] }> = ({ contributorIds }) => {
    const firestore = useFirestore();
    
    const contributorsQuery = useMemoFirebase(() => {
        if (!firestore || !contributorIds || contributorIds.length === 0) return null;
        return query(collection(firestore, 'users'), where('id', 'in', contributorIds));
    }, [firestore, contributorIds]);
    
    const { data: contributors } = useCollection<User>(contributorsQuery);

    if (!contributors || contributors.length === 0) {
        return null;
    }

    return (
        <div className="mt-4 text-sm text-muted-foreground">
            <span className="font-semibold">Contributors: </span>
            {contributors.map(c => c.displayName || 'Anonymous').join(', ')}
        </div>
    );
};
