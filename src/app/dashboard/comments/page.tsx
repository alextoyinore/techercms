
'use client';

import { useState, useMemo, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PageHeader } from "@/components/page-header";
import { MoreHorizontal, Trash2 } from "lucide-react";
import { collectionGroup, doc, Timestamp, query, orderBy, getDoc } from "firebase/firestore";
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { deleteDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from 'date-fns';
import { PaginationControls } from "@/components/pagination-controls";
import Link from 'next/link';

type Comment = {
  id: string;
  authorName: string;
  content: string;
  postId: string;
  createdAt: Timestamp;
};

type CommentWithPost = Comment & { postTitle?: string };

export default function CommentsPage() {
  const { toast } = useToast();
  const firestore = useFirestore();

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [filter, setFilter] = useState('');
  const [commentsWithPosts, setCommentsWithPosts] = useState<CommentWithPost[]>([]);

  const commentsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collectionGroup(firestore, 'comments'), orderBy('createdAt', 'desc'));
  }, [firestore]);

  const { data: allComments, isLoading } = useCollection<Comment>(commentsQuery);

  useEffect(() => {
    if (allComments) {
        const fetchPostTitles = async () => {
            const enrichedComments = await Promise.all(
                allComments.map(async (comment) => {
                    if (!comment.postId || !firestore) return { ...comment, postTitle: 'Unknown Post' };
                    try {
                        const postRef = doc(firestore, 'posts', comment.postId);
                        const postSnap = await getDoc(postRef);
                        return { ...comment, postTitle: postSnap.exists() ? postSnap.data().title : 'Deleted Post' };
                    } catch {
                        return { ...comment, postTitle: 'Error fetching title' };
                    }
                })
            );
            setCommentsWithPosts(enrichedComments);
        };
        fetchPostTitles();
    }
  }, [allComments, firestore]);

  const filteredComments = useMemo(() => {
    if (!commentsWithPosts) return [];
    if (!filter) return commentsWithPosts;
    return commentsWithPosts.filter(comment =>
      comment.content.toLowerCase().includes(filter.toLowerCase()) ||
      comment.authorName.toLowerCase().includes(filter.toLowerCase()) ||
      comment.postTitle?.toLowerCase().includes(filter.toLowerCase())
    );
  }, [commentsWithPosts, filter]);

  const paginatedComments = useMemo(() => {
    if (!filteredComments) return [];
    const startIndex = (currentPage - 1) * pageSize;
    return filteredComments.slice(startIndex, startIndex + pageSize);
  }, [filteredComments, currentPage, pageSize]);

  const totalPages = useMemo(() => {
    if (!filteredComments) return 1;
    return Math.ceil(filteredComments.length / pageSize);
  }, [filteredComments, pageSize]);

  const handleDelete = (comment: Comment) => {
    if (!firestore) return;
    try {
        deleteDocumentNonBlocking(doc(firestore, `posts/${comment.postId}/comments`, comment.id));
        toast({
            title: "Comment Deleted",
            description: `The comment has been deleted.`,
        });
    } catch (error: any) {
        toast({
            variant: "destructive",
            title: "Error Deleting",
            description: error.message || "Could not delete comment.",
        });
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Comments"
        description="Manage all comments across your site."
      />
      <Card>
        <CardHeader className="p-4 border-b">
            <Input 
                placeholder="Filter comments by content, author, or post..."
                value={filter}
                onChange={(e) => {
                    setFilter(e.target.value);
                    setCurrentPage(1);
                }}
            />
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">S/N</TableHead>
                <TableHead>Comment</TableHead>
                <TableHead>Author</TableHead>
                <TableHead>In Response To</TableHead>
                <TableHead>Submitted On</TableHead>
                <TableHead><span className="sr-only">Actions</span></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center">
                    Loading comments...
                  </TableCell>
                </TableRow>
              )}
              {!isLoading && paginatedComments.length === 0 && (
                 <TableRow>
                    <TableCell colSpan={6} className="text-center">
                        No comments found.
                    </TableCell>
                 </TableRow>
              )}
              {paginatedComments.map((comment, index) => (
                <TableRow key={comment.id}>
                  <TableCell className="font-medium">{(currentPage - 1) * pageSize + index + 1}</TableCell>
                  <TableCell className="max-w-xs truncate">{comment.content}</TableCell>
                  <TableCell>{comment.authorName}</TableCell>
                   <TableCell>
                      <Link href={`/dashboard/posts/edit/${comment.postId}`} className="font-medium text-primary hover:underline">
                        {comment.postTitle}
                      </Link>
                    </TableCell>
                  <TableCell>{comment.createdAt ? formatDistanceToNow(comment.createdAt.toDate(), { addSuffix: true }) : ''}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button aria-haspopup="true" size="icon" variant="ghost">
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">Toggle menu</span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem onSelect={() => handleDelete(comment)} className="text-destructive">
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
        {totalPages > 1 && (
          <PaginationControls
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            pageSize={pageSize}
            onPageSizeChange={setPageSize}
            totalItems={filteredComments.length}
          />
        )}
      </Card>
    </div>
  );
}
