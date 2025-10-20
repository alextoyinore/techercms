'use client';

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PageHeader } from "@/components/page-header";
import { Loader2, PlusCircle, MoreHorizontal } from "lucide-react";
import { collection, doc, query, orderBy } from "firebase/firestore";
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import {
  setDocumentNonBlocking,
  deleteDocumentNonBlocking,
} from "@/firebase/non-blocking-updates";
import { useToast } from "@/hooks/use-toast";
import { PaginationControls } from "@/components/pagination-controls";

type Tag = {
  id: string;
  name: string;
  slug: string;
};

const PAGE_SIZE = 10;

export default function TagsPage() {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const { toast } = useToast();
  const firestore = useFirestore();
  const [currentPage, setCurrentPage] = useState(1);

  const tagsCollection = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'tags'), orderBy('name'));
  }, [firestore]);

  const { data: allTags, isLoading } = useCollection<Tag>(tagsCollection);

  const paginatedTags = useMemo(() => {
    if (!allTags) return [];
    const startIndex = (currentPage - 1) * PAGE_SIZE;
    return allTags.slice(startIndex, startIndex + PAGE_SIZE);
  }, [allTags, currentPage]);

  const totalPages = useMemo(() => {
    if (!allTags) return 1;
    return Math.ceil(allTags.length / PAGE_SIZE);
  }, [allTags]);


  const handleEditClick = (tag: Tag) => {
    setEditingTag(tag);
    setName(tag.name);
    setSlug(tag.slug);
  };

  const handleCancelEdit = () => {
    setEditingTag(null);
    setName("");
    setSlug("");
  };

  const handleSubmit = async () => {
    if (!name || !slug) {
      toast({
        variant: "destructive",
        title: "Missing Fields",
        description: "Please fill out both Name and Slug.",
      });
      return;
    }

    if (!firestore) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Firestore is not available.",
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      const docRef = editingTag
        ? doc(firestore, "tags", editingTag.id)
        : doc(collection(firestore, "tags"));
      
      await setDocumentNonBlocking(docRef, { name, slug }, { merge: true });

      toast({
        title: `Tag ${editingTag ? 'Updated' : 'Added'}`,
        description: `"${name}" has been successfully ${editingTag ? 'updated' : 'added'}.`,
      });
      
      handleCancelEdit();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Uh oh! Something went wrong.",
        description: error.message || "Could not save the tag.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = (tagId: string, tagName: string) => {
    if (!firestore) return;
    try {
        deleteDocumentNonBlocking(doc(firestore, "tags", tagId));
        toast({
            title: "Tag Deleted",
            description: `"${tagName}" has been deleted.`,
        });
    } catch (error: any) {
        toast({
            variant: "destructive",
            title: "Error Deleting",
            description: error.message || "Could not delete tag.",
        });
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Tags"
        description="Organize your posts with relevant tags."
      />
      <div className="grid gap-4 md:grid-cols-5">
        <div className="md:col-span-3">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Slug</TableHead>
                    <TableHead><span className="sr-only">Actions</span></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading && (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center">
                        Loading tags...
                      </TableCell>
                    </TableRow>
                  )}
                  {!isLoading && paginatedTags.length === 0 && (
                     <TableRow>
                        <TableCell colSpan={3} className="text-center">
                            No tags found. Add one to get started.
                        </TableCell>
                     </TableRow>
                  )}
                  {paginatedTags.map((tag) => (
                    <TableRow key={tag.id}>
                      <TableCell className="font-medium">{tag.name}</TableCell>
                      <TableCell>{tag.slug}</TableCell>
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
                                <DropdownMenuItem onSelect={() => handleEditClick(tag)}>Edit</DropdownMenuItem>
                                <DropdownMenuItem onSelect={() => handleDelete(tag.id, tag.name)} className="text-destructive">Delete</DropdownMenuItem>
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
              />
            )}
          </Card>
        </div>
        <div className="md:col-span-2">
          <Card>
            <CardHeader className="p-4">
              <CardTitle className="font-headline text-xl">{editingTag ? 'Edit' : 'Add New'} Tag</CardTitle>
            </CardHeader>
            <CardContent className="p-4 grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Name</Label>
                <Input 
                  id="name" 
                  placeholder="Tag Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={isSubmitting}
                />
                <p className="text-sm text-muted-foreground">The name is how it appears on your site.</p>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="slug">Slug</Label>
                <Input 
                  id="slug" 
                  placeholder="tag-slug"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  disabled={isSubmitting}
                />
                 <p className="text-sm text-muted-foreground">The “slug” is the URL-friendly version of the name.</p>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleSubmit} disabled={isSubmitting} className="w-full">
                    {isSubmitting ? (
                    <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {editingTag ? 'Updating...' : 'Adding...'}
                    </>
                    ) : (
                    <>
                        {!editingTag && <PlusCircle className="mr-2 h-4 w-4" />}
                        {editingTag ? 'Update Tag' : 'Add Tag'}
                    </>
                    )}
                </Button>
                {editingTag && (
                    <Button variant="outline" onClick={handleCancelEdit} disabled={isSubmitting}>
                        Cancel
                    </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
