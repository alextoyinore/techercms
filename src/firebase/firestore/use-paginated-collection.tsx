'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Query,
  onSnapshot,
  DocumentData,
  FirestoreError,
  QuerySnapshot,
  query,
  limit,
  startAfter,
  DocumentSnapshot,
} from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import type { WithId, InternalQuery } from './use-collection';

export interface UsePaginatedCollectionResult<T> {
  data: WithId<T>[];
  isLoading: boolean;
  error: FirestoreError | Error | null;
  loadMore: () => void;
  hasMore: boolean;
  totalCount: number | null;
}

export function usePaginatedCollection<T = any>(
  baseQuery: Query<DocumentData> | null | undefined,
  pageSize: number = 10
): UsePaginatedCollectionResult<T> {
  type ResultItemType = WithId<T>;

  const [data, setData] = useState<ResultItemType[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<FirestoreError | Error | null>(null);
  const [lastDoc, setLastDoc] = useState<DocumentSnapshot<DocumentData> | null>(null);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [isFetchingMore, setIsFetchingMore] = useState<boolean>(false);
  const [totalCount, setTotalCount] = useState<number | null>(null);

  useEffect(() => {
    if (!baseQuery) {
      setData([]);
      setTotalCount(0);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const initialQuery = query(baseQuery, limit(pageSize));

    const unsubscribe = onSnapshot(
      initialQuery,
      (snapshot: QuerySnapshot<DocumentData>) => {
        const results: ResultItemType[] = snapshot.docs.map(doc => ({ ...(doc.data() as T), id: doc.id }));
        setData(results);
        setLastDoc(snapshot.docs[snapshot.docs.length - 1] || null);
        setHasMore(snapshot.docs.length === pageSize);
        setError(null);
        setIsLoading(false);
      },
      (err: FirestoreError) => {
        const path = (baseQuery as unknown as InternalQuery)._query.path.canonicalString();
        const contextualError = new FirestorePermissionError({ operation: 'list', path });
        setError(contextualError);
        errorEmitter.emit('permission-error', contextualError);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [baseQuery, pageSize]);

  const loadMore = useCallback(() => {
    if (!baseQuery || !hasMore || isFetchingMore || !lastDoc) return;

    setIsFetchingMore(true);
    const nextQuery = query(baseQuery, startAfter(lastDoc), limit(pageSize));

    onSnapshot(
      nextQuery,
      (snapshot: QuerySnapshot<DocumentData>) => {
        const newResults: ResultItemType[] = snapshot.docs.map(doc => ({ ...(doc.data() as T), id: doc.id }));
        setData(prevData => [...prevData, ...newResults]);
        setLastDoc(snapshot.docs[snapshot.docs.length - 1] || null);
        setHasMore(snapshot.docs.length === pageSize);
        setIsFetchingMore(false);
      },
      (err: FirestoreError) => {
        console.error("Error fetching more documents: ", err);
        setError(err);
        setIsFetchingMore(false);
      }
    );
  }, [baseQuery, hasMore, isFetchingMore, lastDoc, pageSize]);

  return { data, isLoading, error, loadMore, hasMore, totalCount };
}
