
'use client';

import Link from "next/link";
import { useMemo, useState } from "react";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { collection, doc, Timestamp } from "firebase/firestore";
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { deleteDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { useToast } from "@/hooks/use-toast";
import { format } from 'date-fns';
import { PaginationControls } from "@/components/pagination-controls";

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

    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [filter, setFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    const postsCollection = useMemoFirebase(() => {
        if (!firestore) return null;
        return collection(firestore, 'posts');
    }, [firestore]);

    const { data: allPosts, isLoading } = useCollection<Post>(postsCollection);
    
    const sortedPosts = useMemo(() => {
      if (!allPosts) return [];
      return [...allPosts].sort((a, b) => {
        const dateA = a.createdAt?.toDate() ?? new Date(0);
        const dateB = b.createdAt?.toDate() ?? new Date(0);
        return dateB.getTime() - dateA.getTime();
      });
    }, [allPosts]);

    const filteredPosts = useMemo(() => {
        if (!sortedPosts) return [];
        return sortedPosts.filter(post => {
            const titleMatch = post.title.toLowerCase().includes(filter.toLowerCase());
            const statusMatch = statusFilter === 'all' || post.status === statusFilter;
            return titleMatch && statusMatch;
        });
    }, [sortedPosts, filter, statusFilter]);

    const paginatedPosts = useMemo(() => {
        if (!filteredPosts) return [];
        const startIndex = (currentPage - 1) * pageSize;
        return filteredPosts.slice(startIndex, startIndex + pageSize);
    }, [filteredPosts, currentPage, pageSize]);

    const totalPages = useMemo(() => {
        if (!filteredPosts) return 1;
        return Math.ceil(filteredPosts.length / pageSize);
    }, [filteredPosts, pageSize]);


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
        <CardHeader className="p-4 border-b flex-row gap-4">
            <Input 
                placeholder="Filter posts..."
                className="flex-1"
                value={filter}
                onChange={(e) => {
                    setFilter(e.target.value);
                    setCurrentPage(1);
                }}
            />
            <Select value={statusFilter} onValueChange={(value) => {
                setStatusFilter(value);
                setCurrentPage(1);
            }}>
                <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
            </Select>
        </CardHeader>
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
              {!isLoading && paginatedPosts.length === 0 && (
                <TableRow>
                    <TableCell colSpan={4} className="text-center">
                        No posts found.
                    </TableCell>
                </TableRow>
              )}
              {!isLoading && paginatedPosts.map((post) => (
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
        {totalPages > 1 && (
            <PaginationControls
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                pageSize={pageSize}
                onPageSizeChange={setPageSize}
                totalItems={filteredPosts.length}
            />
        )}
      </Card>
    </div>
  );
}
