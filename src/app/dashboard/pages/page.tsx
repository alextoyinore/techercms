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

type Page = {
    id: string;
    title: string;
    status: 'draft' | 'published';
    createdAt: Timestamp;
};

export default function PagesPage() {
    const firestore = useFirestore();
    const { toast } = useToast();

    const pagesCollection = useMemoFirebase(() => {
        if (!firestore) return null;
        return collection(firestore, 'pages');
    }, [firestore]);

    const { data: pages, isLoading } = useCollection<Page>(pagesCollection);
    
    // Sort pages by creation date, newest first
    const sortedPages = useMemo(() => {
      if (!pages) return [];
      return [...pages].sort((a, b) => {
        const dateA = a.createdAt?.toDate() ?? new Date(0);
        const dateB = b.createdAt?.toDate() ?? new Date(0);
        return dateB.getTime() - dateA.getTime();
      });
    }, [pages]);


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
              {!isLoading && sortedPages.length === 0 && (
                <TableRow>
                    <TableCell colSpan={4} className="text-center">
                        No pages found. Create one to get started.
                    </TableCell>
                </TableRow>
              )}
              {!isLoading && sortedPages.map((page) => (
                <TableRow key={page.id}>
                  <TableCell className="font-medium">{page.title}</TableCell>
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
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
