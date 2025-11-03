
'use client';

import Link from "next/link";
import Image from "next/image";
import { useMemo, useState, useEffect } from "react";
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
import { MoreHorizontal, PlusCircle, Loader2, Podcast, Megaphone, Star, View } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
    DropdownMenuCheckboxItem,
  } from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { collection, doc, Timestamp, getDocs, getDoc } from "firebase/firestore";
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { deleteDocumentNonBlocking, setDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { useToast } from "@/hooks/use-toast";
import { format } from 'date-fns';
import { PaginationControls } from "@/components/pagination-controls";
import { Switch } from "@/components/ui/switch";
import { BreakingNewsIndicator } from "@/components/BreakingNewsIndicator";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

type Post = {
    id: string;
    title: string;
    status: 'draft' | 'published' | 'archived';
    authorId: string;
    categoryIds: string[];
    createdAt: Timestamp;
    featuredImageUrl?: string;
    audioUrl?: string;
    isBreaking?: boolean;
    tagIds?: string[];
    focusKeyword?: string;
};

type User = {
    id: string;
    displayName?: string;
    photoURL?: string;
};

const VISIBILITY_STORAGE_KEY = 'post_column_visibility';

const defaultVisibility = {
    image: true,
    title: true,
    author: true,
    status: true,
    views: true,
    audio: true,
    breaking: true,
    featured: true,
    keyword: false,
    date: true,
};

export default function PostsPage() {
    const firestore = useFirestore();
    const { toast } = useToast();

    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [filter, setFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [viewCounts, setViewCounts] = useState<Record<string, number | null>>({});
    
    const [columnVisibility, setColumnVisibility] = useState(defaultVisibility);

    useEffect(() => {
        const storedVisibility = localStorage.getItem(VISIBILITY_STORAGE_KEY);
        if (storedVisibility) {
            setColumnVisibility(JSON.parse(storedVisibility));
        }
    }, []);

    useEffect(() => {
        localStorage.setItem(VISIBILITY_STORAGE_KEY, JSON.stringify(columnVisibility));
    }, [columnVisibility]);

    const postsCollection = useMemoFirebase(() => {
        if (!firestore) return null;
        return collection(firestore, 'posts');
    }, [firestore]);

    const usersCollection = useMemoFirebase(() => {
        if (!firestore) return null;
        return collection(firestore, 'users');
    }, [firestore]);

    const { data: allPosts, isLoading: isLoadingPosts } = useCollection<Post>(postsCollection);
    const { data: allUsers, isLoading: isLoadingUsers } = useCollection<User>(usersCollection);

    const usersMap = useMemo(() => {
        if (!allUsers) return new Map();
        return new Map(allUsers.map(user => [user.id, user]));
    }, [allUsers]);
    
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
            let statusMatch = true;
            switch(statusFilter) {
                case 'all':
                    statusMatch = true;
                    break;
                case 'breaking':
                    statusMatch = post.isBreaking === true;
                    break;
                case 'audio':
                    statusMatch = !!post.audioUrl;
                    break;
                default:
                    statusMatch = post.status === statusFilter;
                    break;
            }
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
    
    useEffect(() => {
        if (paginatedPosts && firestore) {
            paginatedPosts.forEach(post => {
                if (viewCounts[post.id] === undefined) { // Check if not already fetched or fetching
                    setViewCounts(prev => ({ ...prev, [post.id]: null })); // Mark as fetching
                    const viewsCollection = collection(firestore, `posts/${post.id}/views`);
                    getDocs(viewsCollection).then(snapshot => {
                        setViewCounts(prev => ({ ...prev, [post.id]: snapshot.size }));
                    }).catch(() => {
                         setViewCounts(prev => ({ ...prev, [post.id]: 0 })); // Set to 0 on error
                    });
                }
            });
        }
    }, [paginatedPosts, firestore, viewCounts]);

    const handleBreakingChange = async (postId: string, checked: boolean) => {
      if (!firestore) return;
      try {
        const postRef = doc(firestore, 'posts', postId);
        await setDocumentNonBlocking(postRef, { isBreaking: checked }, { merge: true });
        toast({
          title: "Post Updated",
          description: `Breaking news status has been ${checked ? 'enabled' : 'disabled'}.`
        });
      } catch (error: any) {
        toast({
          variant: "destructive",
          title: "Update Failed",
          description: error.message || "Could not update the post."
        });
      }
    };
    
    const handleFeaturedChange = async (post: Post, checked: boolean) => {
        if (!firestore) return;
        const postRef = doc(firestore, 'posts', post.id);
        const currentTags = post.tagIds || [];
        
        let newTags;
        if (checked) {
            // Add 'featured' tag if it doesn't exist
            newTags = [...new Set([...currentTags, 'featured'])];
        } else {
            // Remove 'featured' tag
            newTags = currentTags.filter(tag => tag !== 'featured');
        }

        try {
            await setDocumentNonBlocking(postRef, { tagIds: newTags }, { merge: true });
            toast({
                title: "Post Updated",
                description: `Post has been ${checked ? 'featured' : 'unfeatured'}.`
            });
        } catch (error: any) {
             toast({
                variant: "destructive",
                title: "Update Failed",
                description: error.message || "Could not update the post's featured status."
            });
        }
    };


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
    
    const visibleColumns = Object.values(columnVisibility).filter(Boolean).length + 2; // +2 for S/N and Actions
    const isLoading = isLoadingPosts || isLoadingUsers;

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
                    <SelectItem value="all">All Posts</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                    <SelectItem value="breaking">Breaking News</SelectItem>
                    <SelectItem value="audio">Has Audio</SelectItem>
                </SelectContent>
            </Select>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline">
                        <View className="mr-2 h-4 w-4" />
                        View
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                    <DropdownMenuLabel>Toggle Columns</DropdownMenuLabel>
                    {Object.entries(columnVisibility).map(([key, value]) => (
                        <DropdownMenuCheckboxItem
                            key={key}
                            checked={value}
                            onCheckedChange={(checked) => setColumnVisibility(prev => ({...prev, [key]: checked}))}
                            className="capitalize"
                        >
                            {key}
                        </DropdownMenuCheckboxItem>
                    ))}
                </DropdownMenuContent>
            </DropdownMenu>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">S/N</TableHead>
                {columnVisibility.image && <TableHead className="w-[80px]">Image</TableHead>}
                {columnVisibility.title && <TableHead>Title</TableHead>}
                {columnVisibility.author && <TableHead>Author</TableHead>}
                {columnVisibility.status && <TableHead>Status</TableHead>}
                {columnVisibility.views && <TableHead>Views</TableHead>}
                {columnVisibility.audio && <TableHead>Audio</TableHead>}
                {columnVisibility.breaking && <TableHead>Breaking</TableHead>}
                {columnVisibility.featured && <TableHead>Featured</TableHead>}
                {columnVisibility.keyword && <TableHead>Keyword</TableHead>}
                {columnVisibility.date && <TableHead>Date</TableHead>}
                <TableHead>
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow>
                    <TableCell colSpan={visibleColumns} className="text-center">
                        Loading posts...
                    </TableCell>
                </TableRow>
              )}
              {!isLoading && paginatedPosts.length === 0 && (
                <TableRow>
                    <TableCell colSpan={visibleColumns} className="text-center">
                        No posts found.
                    </TableCell>
                </TableRow>
              )}
              {!isLoading && paginatedPosts.map((post, index) => {
                const author = usersMap.get(post.authorId);
                return (
                    <TableRow key={post.id}>
                       <TableCell className="font-medium">
                            {(currentPage - 1) * pageSize + index + 1}
                        </TableCell>
                        {columnVisibility.image && (
                            <TableCell>
                                {post.featuredImageUrl ? (
                                    <Image 
                                        src={post.featuredImageUrl} 
                                        alt={post.title} 
                                        width={60} 
                                        height={40} 
                                        className="rounded-sm object-cover aspect-[3/2]" 
                                    />
                                ) : (
                                    <div className="h-10 w-[60px] bg-muted rounded-sm" />
                                )}
                            </TableCell>
                        )}
                      {columnVisibility.title && (
                        <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                            {post.isBreaking && <BreakingNewsIndicator />}
                            <span>{post.title}</span>
                            </div>
                        </TableCell>
                      )}
                       {columnVisibility.author && (
                           <TableCell>
                               <div className="flex items-center gap-2">
                                    <Avatar className="h-6 w-6">
                                        <AvatarImage src={author?.photoURL} />
                                        <AvatarFallback>{author?.displayName?.charAt(0) || 'U'}</AvatarFallback>
                                    </Avatar>
                                    <span className="text-xs">{author?.displayName || 'Unknown'}</span>
                               </div>
                           </TableCell>
                       )}
                      {columnVisibility.status && (
                        <TableCell>
                            <Badge variant={post.status === "published" ? "default" : "secondary"}>
                            {post.status}
                            </Badge>
                        </TableCell>
                      )}
                       {columnVisibility.views && (
                            <TableCell>
                                {viewCounts[post.id] === null ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                viewCounts[post.id]
                                )}
                            </TableCell>
                       )}
                        {columnVisibility.audio && (
                            <TableCell>
                                {post.audioUrl && <Podcast className="h-4 w-4 text-muted-foreground" />}
                            </TableCell>
                        )}
                        {columnVisibility.breaking && (
                            <TableCell>
                                <Switch
                                checked={post.isBreaking}
                                onCheckedChange={(checked) => handleBreakingChange(post.id, checked)}
                                aria-label="Mark as breaking news"
                                />
                            </TableCell>
                        )}
                         {columnVisibility.featured && (
                            <TableCell>
                                <Switch
                                checked={(post.tagIds || []).includes('featured')}
                                onCheckedChange={(checked) => handleFeaturedChange(post, checked)}
                                aria-label="Mark as featured"
                                />
                            </TableCell>
                         )}
                         {columnVisibility.keyword && <TableCell className="text-xs truncate max-w-24">{post.focusKeyword}</TableCell>}
                         {columnVisibility.date && (
                            <TableCell>
                                {post.createdAt ? format(post.createdAt.toDate(), 'PP') : 'N/A'}
                            </TableCell>
                         )}
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
                )
              })}
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
