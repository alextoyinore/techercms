
'use client';

import {
  FacebookShareButton,
  TwitterShareButton,
  LinkedinShareButton,
  FacebookIcon,
  TwitterIcon,
  LinkedinIcon,
} from 'react-share';
import { useAuth, useCollection, useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, doc, serverTimestamp } from 'firebase/firestore';
import { deleteDocumentNonBlocking, setDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { useToast } from '@/hooks/use-toast';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { ThumbsUp } from 'lucide-react';
import { cn } from '@/lib/utils';

type ShareButtonsProps = {
  title: string;
  postId: string;
};

export const ShareButtons = ({ title, postId }: ShareButtonsProps) => {
  const [currentUrl, setCurrentUrl] = useState('');
  const { toast } = useToast();
  const firestore = useFirestore();
  const auth = useAuth();
  const user = auth?.currentUser;

  // Set URL on client-side mount
  useEffect(() => {
    setCurrentUrl(window.location.href);
  }, []);

  // Fetch likes for the post
  const likesQuery = useMemoFirebase(() => {
    if (!firestore || !postId) return null;
    return collection(firestore, `posts/${postId}/likes`);
  }, [firestore, postId]);
  const { data: likes } = useCollection(likesQuery);
  const likeCount = likes?.length || 0;

  // Check if the current user has liked the post
  const likeDocRef = useMemoFirebase(() => {
    if (!firestore || !postId || !user) return null;
    return doc(firestore, `posts/${postId}/likes`, user.uid);
  }, [firestore, postId, user]);
  const { data: userLike } = useDoc(likeDocRef);
  const hasLiked = !!userLike;
  
  const handleLike = () => {
    if (!user) {
        toast({
            variant: "destructive",
            title: "Authentication Required",
            description: "You must be logged in to like a post.",
        });
        return;
    }

    if (!likeDocRef) return;

    if (hasLiked) {
        // Unlike the post
        deleteDocumentNonBlocking(likeDocRef);
    } else {
        // Like the post
        setDocumentNonBlocking(likeDocRef, {
            userId: user.uid,
            postId: postId,
            createdAt: serverTimestamp(),
        }, {});
    }
  };


  if (!currentUrl) {
    return null;
  }

  return (
    <div className="my-8">
      <div className="flex items-center justify-between gap-4">
        <Button 
            variant="ghost"
            onClick={handleLike}
            disabled={!user}
            className="flex items-center gap-2 px-2 hover:bg-transparent"
        >
            <ThumbsUp className={cn("h-6 w-6 transition-colors", hasLiked && "fill-green-500 text-green-500")} />
            <span className="font-semibold">Like</span>
            <span className="font-semibold text-muted-foreground">({likeCount})</span>
        </Button>
        <div className="flex items-center gap-2">
            <p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground hidden sm:block">Share This</p>
            <FacebookShareButton url={currentUrl} quote={title}>
                <FacebookIcon size={32} round />
            </FacebookShareButton>
            <TwitterShareButton url={currentUrl} title={title}>
                <TwitterIcon size={32} round />
            </TwitterShareButton>
            <LinkedinShareButton url={currentUrl} title={title}>
                <LinkedinIcon size={32} round />
            </LinkedinShareButton>
        </div>
      </div>
    </div>
  );
};
