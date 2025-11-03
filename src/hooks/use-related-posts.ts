
'use client';

import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, orderBy, limit } from 'firebase/firestore';

export const useRelatedPosts = (postId: string, categoryIds?: string[], tagIds?: string[]) => {
  const firestore = useFirestore();

  const relatedQuery = useMemoFirebase(() => {
    if (!firestore) return null;

    let q = query(
      collection(firestore, 'posts'),
      where('status', '==', 'published'),
      where('__name__', '!=', postId)
    );
    
    const hasCategories = categoryIds && categoryIds.length > 0;

    if (hasCategories) {
      q = query(q, where('categoryIds', 'array-contains-any', categoryIds));
    }
    // Note: Firestore does not support multiple array-contains-any clauses.
    // We prioritize categories. If no categories, we could search by tags,
    // but a combined query is not possible with this data structure.

    return query(q, orderBy('createdAt', 'desc'), limit(3));
  }, [firestore, postId, categoryIds]);

  return useCollection(relatedQuery);
};
