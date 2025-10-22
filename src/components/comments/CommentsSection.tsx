
'use client';

import { useState, useMemo } from 'react';
import { useFirestore, useCollection, useAuth, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, Timestamp, where, doc, serverTimestamp } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';
import { addDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

type Comment = {
    id: string;
    authorId: string;
    authorName: string;
    authorPhotoURL: string;
    content: string;
    createdAt: Timestamp;
    parentId?: string;
};

type CommentWithChildren = Comment & { children: CommentWithChildren[] };

function CommentItem({ comment }: { comment: CommentWithChildren }) {
    return (
        <div className="flex items-start space-x-4">
            <Avatar>
                <AvatarImage src={comment.authorPhotoURL} alt={comment.authorName} />
                <AvatarFallback>{comment.authorName?.charAt(0) || 'U'}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
                <div className="flex items-center gap-2">
                    <p className="font-semibold">{comment.authorName}</p>
                    <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(comment.createdAt.toDate(), { addSuffix: true })}
                    </p>
                </div>
                <p className="text-sm text-foreground/90">{comment.content}</p>
                
                {/* Placeholder for reply functionality */}
                {/* <Button variant="ghost" size="sm" className="mt-1 h-auto p-1 text-xs">Reply</Button> */}

                {comment.children.length > 0 && (
                    <div className="mt-4 space-y-4 border-l-2 pl-4">
                        {comment.children.map(child => (
                            <CommentItem key={child.id} comment={child} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export function CommentsSection({ postId }: { postId: string }) {
    const firestore = useFirestore();
    const auth = useAuth();
    const user = auth?.currentUser;
    const { toast } = useToast();

    const [newComment, setNewComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const commentsQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(
            collection(firestore, 'posts', postId, 'comments'),
            orderBy('createdAt', 'asc')
        );
    }, [firestore, postId]);

    const { data: comments, isLoading } = useCollection<Comment>(commentsQuery);

    const commentTree = useMemo(() => {
        if (!comments) return [];
        const itemsMap = new Map<string, CommentWithChildren>();
        const roots: CommentWithChildren[] = [];

        comments.forEach(item => {
            itemsMap.set(item.id, { ...item, children: [] });
        });

        comments.forEach(item => {
            const currentItem = itemsMap.get(item.id);
            if (!currentItem) return;

            if (item.parentId && itemsMap.has(item.parentId)) {
                const parentItem = itemsMap.get(item.parentId);
                parentItem?.children.push(currentItem);
            } else {
                roots.push(currentItem);
            }
        });

        return roots;
    }, [comments]);

    const handleSubmit = async () => {
        if (!firestore || !user || !newComment.trim()) return;

        setIsSubmitting(true);
        const commentData = {
            authorId: user.uid,
            authorName: user.displayName || 'Anonymous',
            authorPhotoURL: user.photoURL || '',
            content: newComment,
            createdAt: serverTimestamp(),
        };

        try {
            await addDocumentNonBlocking(collection(firestore, 'posts', postId, 'comments'), commentData);
            setNewComment('');
            toast({
                title: 'Comment Added',
                description: 'Your comment has been posted.',
            });
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: `Could not post your comment: ${error.message}`,
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="mt-12">
            <h3 className="text-2xl font-bold font-headline mb-6">Comments ({comments?.length || 0})</h3>
            <div className="space-y-6">
                {isLoading && <p>Loading comments...</p>}
                {!isLoading && commentTree.length === 0 && (
                    <p className="text-sm text-muted-foreground">No comments yet. Be the first to share your thoughts!</p>
                )}
                {commentTree.map(comment => (
                    <CommentItem key={comment.id} comment={comment} />
                ))}
            </div>

            <div className="mt-8 border-t pt-8">
                {user ? (
                    <div className="grid gap-4">
                        <h4 className="font-semibold">Leave a Comment</h4>
                        <Textarea
                            placeholder="Share your thoughts..."
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            disabled={isSubmitting}
                        />
                        <Button onClick={handleSubmit} disabled={isSubmitting || !newComment.trim()}>
                            {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin"/> Posting...</> : 'Post Comment'}
                        </Button>
                    </div>
                ) : (
                    <p className="text-sm text-muted-foreground">You must be logged in to post a comment.</p>
                )}
            </div>
        </div>
    );
}
