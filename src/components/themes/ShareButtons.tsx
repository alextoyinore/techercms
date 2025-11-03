
'use client';

import {
  FacebookShareButton,
  TwitterShareButton,
  LinkedinShareButton,
  WhatsappShareButton,
  FacebookIcon,
  TwitterIcon,
  LinkedinIcon,
  WhatsappIcon,
} from 'react-share';
import { useAuth, useCollection, useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, doc, serverTimestamp } from 'firebase/firestore';
import { deleteDocumentNonBlocking, setDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { useToast } from '@/hooks/use-toast';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { ThumbsUp, Link as LinkIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';

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
  const router = useRouter();

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
        router.push('/login');
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

  const handleCopyLink = () => {
    navigator.clipboard.writeText(currentUrl).then(() => {
      toast({
        title: "Link Copied!",
        description: "The post URL has been copied to your clipboard.",
      });
    }, (err) => {
      console.error('Could not copy text: ', err);
      toast({
        variant: "destructive",
        title: "Copy Failed",
        description: "Could not copy the link. Please try again.",
      });
    });
  };


  if (!currentUrl) {
    return null;
  }

  return (
    <div className="my-8">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
            <Button 
                variant="ghost"
                onClick={handleLike}
                className="flex items-center gap-2 px-2 hover:bg-transparent"
            >
                <ThumbsUp className={cn("h-8 w-8 transition-colors", hasLiked && "fill-green-500 text-green-500")} />
                <span className="font-semibold">Like</span>
                <span className="font-semibold text-muted-foreground">({likeCount})</span>
            </Button>
            <Button 
                variant="ghost"
                onClick={handleCopyLink}
                className="flex items-center gap-2 px-2 hover:bg-transparent"
            >
                <LinkIcon className="h-8 w-8"/>
                <span className="font-semibold">Copy Link</span>
            </Button>
        </div>
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
            <WhatsappShareButton url={currentUrl} title={title}>
                <WhatsappIcon size={32} round />
            </WhatsappShareButton>
        </div>
      </div>
    </div>
  );
};
