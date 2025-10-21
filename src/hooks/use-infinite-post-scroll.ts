
'use client';
import { useState, useEffect, useCallback } from 'react';
import { useFirestore } from '@/firebase';
import { collection, query, where, orderBy, limit, getDocs, startAfter, Timestamp } from 'firebase/firestore';
import type { Post } from '@/components/themes/PostComponent';

export const useInfinitePostScroll = (initialPost: Post, themeName?: string) => {
  const [posts, setPosts] = useState<Post[]>([initialPost]);
  const [lastDoc, setLastDoc] = useState<any | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const firestore = useFirestore();

  useEffect(() => {
    // Set initial lastDoc based on initialPost's createdAt
    const fetchInitialDoc = async () => {
      if (!firestore) return;
      const q = query(
        collection(firestore, 'posts'),
        where('__name__', '==', initialPost.id)
      );
      const snapshot = await getDocs(q);
      if (snapshot.docs.length > 0) {
        setLastDoc(snapshot.docs[0]);
      } else {
        setHasMore(false);
      }
    };
    fetchInitialDoc();
  }, [firestore, initialPost.id]);

  const loadNextPost = useCallback(async () => {
    if (!firestore || !hasMore || isLoadingMore || !lastDoc) return;
    setIsLoadingMore(true);

    const nextQuery = query(
      collection(firestore, 'posts'),
      where('status', '==', 'published'),
      orderBy('createdAt', 'desc'),
      startAfter(lastDoc),
      limit(1)
    );

    try {
      const snapshot = await getDocs(nextQuery);
      if (snapshot.empty) {
        setHasMore(false);
      } else {
        const nextPost = snapshot.docs[0].data() as Post;
        const nextPostWithId = { ...nextPost, id: snapshot.docs[0].id };

        // Update URL without navigation
        if (typeof window !== 'undefined') {
          window.history.pushState(null, '', `/${nextPostWithId.slug}`);
        }

        setPosts(prev => [...prev, nextPostWithId]);
        setLastDoc(snapshot.docs[0]);
      }
    } catch (error) {
      console.error("Error loading next post:", error);
      setHasMore(false); // Stop trying on error
    } finally {
      setIsLoadingMore(false);
    }
  }, [firestore, hasMore, isLoadingMore, lastDoc]);

  return { posts, isLoadingMore, hasMore, loadNextPost, themeName };
};
