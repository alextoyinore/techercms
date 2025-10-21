
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
import { Input } from "@/components/ui/input";
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
import { useFirestore, useCollection, useDoc, useMemoFirebase } from "@/firebase";
import { deleteDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { useToast } from "@/hooks/use-toast";
import { format } from 'date-fns';
import { PaginationControls } from "@/components/pagination-controls";

type Page = {
    id: string;
    title: string;
    status: 'draft' | 'published';
    createdAt: Timestamp;
};

type SiteSettings = {
  homepagePageId?: string;
};

export default function PagesPage() {
    const firestore = useFirestore();
    const { toast } = useToast();

    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [filter, setFilter] = useState('');

    const pagesCollection = useMemoFirebase(() => {
        if (!firestore) return null;
        return collection(firestore, 'pages');
    }, [firestore]);
    
    const settingsRef = useMemoFirebase(() => {
        if (!firestore) return null;
        return doc(firestore, 'site_settings', 'config');
    }, [firestore]);

    const { data: allPages, isLoading: isLoadingPages } = useCollection<Page>(pagesCollection);
    const { data: settings, isLoading: isLoadingSettings } = useDoc<SiteSettings>(settingsRef);
    
    const sortedPages = useMemo(() => {
      if (!allPages) return [];
      return [...allPages].sort((a, b) => {
        const dateA = a.createdAt?.toDate() ?? new Date(0);
        const dateB = b.createdAt?.toDate() ?? new Date(0);
        return dateB.getTime() - dateA.getTime();
      });
    }, [allPages]);
    
    const filteredPages = useMemo(() => {
      if (!sortedPages) return [];
      if (!filter) return sortedPages;
      return sortedPages.filter(page =>
        page.title.toLowerCase().includes(filter.toLowerCase())
      );
    }, [sortedPages, filter]);

    const paginatedPages = useMemo(() => {
        if (!filteredPages) return [];
        const startIndex = (currentPage - 1) * pageSize;
        return filteredPages.slice(startIndex, startIndex + pageSize);
    }, [filteredPages, currentPage, pageSize]);

    const totalPages = useMemo(() => {
        if (!filteredPages) return 1;
        return Math.ceil(filteredPages.length / pageSize);
    }, [filteredPages, pageSize]);

    const isLoading = isLoadingPages || isLoadingSettings;

    const handleDelete = (pageId: string, pageTitle: string) => {
        if (!firestore) return;
        try {
            deleteDocumentNonBlocking(doc(firestore, "pages", pageId));
            toast({
                title: "Page Deleted",
                description: `"${pageTitle}" has been deleted.`,
            });
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Error Deleting Page",
                description: error.message || "Could not delete the page.",
            });
        }
    }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Pages" description="Manage your static pages.">
        <Button asChild>
          <Link href="/dashboard/pages/new">
            <PlusCircle className="mr-2 h-4 w-4" />
            New Page
          </Link>
        </Button>
      </PageHeader>
      <Card>
        <CardHeader className="p-4 border-b">
            <Input 
                placeholder="Filter pages..."
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
                        Loading pages...
                    </TableCell>
                </TableRow>
              )}
              {!isLoading && paginatedPages.length === 0 && (
                <TableRow>
                    <TableCell colSpan={4} className="text-center">
                        No pages found.
                    </TableCell>
                </TableRow>
              )}
              {!isLoading && paginatedPages.map((page) => {
                const isHomepage = page.id === settings?.homepagePageId;
                return (
                    <TableRow key={page.id}>
                        <TableCell className="font-medium">
                            {page.title}
                            {isHomepage && <span className="text-muted-foreground ml-2">— Homepage</span>}
                        </TableCell>
                        <TableCell>
                            <Badge variant={page.status === "published" ? "default" : "secondary"}>
                            {page.status}
                            </Badge>
                        </TableCell>
                        <TableCell>
                            {page.createdAt ? format(page.createdAt.toDate(), 'PP') : 'N/A'}
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
                                    <Link href={`/dashboard/pages/edit/${page.id}`}>Edit</Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleDelete(page.id, page.title)} className="text-destructive">
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
                totalItems={filteredPages.length}
            />
        )}
      </Card>
    </div>
  );
}
