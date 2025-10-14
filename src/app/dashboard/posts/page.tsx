'use client';

import Link from "next/link";
import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { MoreHorizontal, PlusCircle } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
  } from "@/components/ui/dropdown-menu";
import { collection, doc, Timestamp } from "firebase/firestore";
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { deleteDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { useToast } from "@/hooks/use-toast";
import { format } from 'date-fns';

type Post = {
    id: string;
    title: string;
    status: 'draft' | 'published' | 'archived';
    authorId: string;
    categoryIds: string[];
    createdAt: Timestamp;
};

export default function PostsPage() {
    const firestore = useFirestore();
    const { toast } = useToast();

    const postsCollection = useMemoFirebase(() => {
        if (!firestore) return null;
        return collection(firestore, 'posts');
    }, [firestore]);

    const { data: posts, isLoading } = useCollection<Post>(postsCollection);
    
    // Sort posts by creation date, newest first
    const sortedPosts = useMemo(() => {
      if (!posts) return [];
      return [...posts].sort((a, b) => {
        const dateA = a.createdAt?.toDate() ?? new Date(0);
        const dateB = b.createdAt?.toDate() ?? new Date(0);
        return dateB.getTime() - dateA.getTime();
      });
    }, [posts]);


    const handleDelete = (postId: string, postTitle: string) => {
        if (!firestore) return;
        try {
            deleteDocumentNonBlocking(doc(firestore, "posts", postId));
            toast({
                title: "Post Deleted",
                description: `"${postTitle}" has been deleted.`,
            });
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Error Deleting Post",
                description: error.message || "Could not delete the post.",
            });
        }
    }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Posts" description="Manage and create your blog posts.">
        <Button asChild>
          <Link href="/dashboard/posts/new">
            <PlusCircle className="mr-2 h-4 w-4" />
            New Post
          </Link>
        </Button>
      </PageHeader>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow>
                    <TableCell colSpan={4} className="text-center">
                        Loading posts...
                    </TableCell>
                </TableRow>
              )}
              {!isLoading && sortedPosts.length === 0 && (
                <TableRow>
                    <TableCell colSpan={4} className="text-center">
                        No posts found. Create one to get started.
                    </TableCell>
                </TableRow>
              )}
              {!isLoading && sortedPosts.map((post) => (
                <TableRow key={post.id}>
                  <TableCell className="font-medium">{post.title}</TableCell>
                  <TableCell>
                    <Badge variant={post.status === "published" ? "default" : "secondary"}>
                      {post.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {post.createdAt ? format(post.createdAt.toDate(), 'PP') : 'N/A'}
                  </TableCell>
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
                        <DropdownMenuItem asChild>
                            <Link href={`/dashboard/posts/edit/${post.id}`}>Edit</Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDelete(post.id, post.title)} className="text-destructive">
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
      </Card>
    </div>
  );
}
