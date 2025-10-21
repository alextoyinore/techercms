
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


type Category = {
  id: string;
  name: string;
  slug: string;
};

export default function CategoriesPage() {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const { toast } = useToast();
  const firestore = useFirestore();

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [filter, setFilter] = useState('');

  const categoriesCollection = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'categories'), orderBy('name'));
  }, [firestore]);

  const { data: allCategories, isLoading } = useCollection<Category>(categoriesCollection);

  const filteredCategories = useMemo(() => {
    if (!allCategories) return [];
    if (!filter) return allCategories;
    return allCategories.filter(category =>
      category.name.toLowerCase().includes(filter.toLowerCase())
    );
  }, [allCategories, filter]);

  const paginatedCategories = useMemo(() => {
    if (!filteredCategories) return [];
    const startIndex = (currentPage - 1) * pageSize;
    return filteredCategories.slice(startIndex, startIndex + pageSize);
  }, [filteredCategories, currentPage, pageSize]);

  const totalPages = useMemo(() => {
    if (!filteredCategories) return 1;
    return Math.ceil(filteredCategories.length / pageSize);
  }, [filteredCategories, pageSize]);


  const handleEditClick = (category: Category) => {
    setEditingCategory(category);
    setName(category.name);
    setSlug(category.slug);
  };

  const handleCancelEdit = () => {
    setEditingCategory(null);
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
      const docRef = editingCategory
        ? doc(firestore, "categories", editingCategory.id)
        : doc(collection(firestore, "categories"));
      
      await setDocumentNonBlocking(docRef, { name, slug }, { merge: true });

      toast({
        title: `Category ${editingCategory ? 'Updated' : 'Added'}`,
        description: `"${name}" has been successfully ${editingCategory ? 'updated' : 'added'}.`,
      });
      
      handleCancelEdit();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Uh oh! Something went wrong.",
        description: error.message || "Could not save the category.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = (categoryId: string, categoryName: string) => {
    if (!firestore) return;
    try {
        deleteDocumentNonBlocking(doc(firestore, "categories", categoryId));
        toast({
            title: "Category Deleted",
            description: `"${categoryName}" has been deleted.`,
        });
    } catch (error: any) {
        toast({
            variant: "destructive",
            title: "Error Deleting",
            description: error.message || "Could not delete category.",
        });
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Categories"
        description="Organize your posts by grouping them into categories."
      />
      <div className="grid gap-4 md:grid-cols-5">
        <div className="md:col-span-3">
          <Card>
            <CardHeader className="p-4 border-b">
                <Input 
                    placeholder="Filter categories..."
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
                    <TableHead>Name</TableHead>
                    <TableHead>Slug</TableHead>
                    <TableHead><span className="sr-only">Actions</span></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading && (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center">
                        Loading categories...
                      </TableCell>
                    </TableRow>
                  )}
                  {!isLoading && paginatedCategories.length === 0 && (
                     <TableRow>
                        <TableCell colSpan={3} className="text-center">
                            No categories found.
                        </TableCell>
                     </TableRow>
                  )}
                  {paginatedCategories.map((category) => (
                    <TableRow key={category.id}>
                      <TableCell className="font-medium">{category.name}</TableCell>
                      <TableCell>{category.slug}</TableCell>
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
                                <DropdownMenuItem onSelect={() => handleEditClick(category)}>Edit</DropdownMenuItem>
                                <DropdownMenuItem onSelect={() => handleDelete(category.id, category.name)} className="text-destructive">Delete</DropdownMenuItem>
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
                totalItems={filteredCategories.length}
              />
            )}
          </Card>
        </div>
        <div className="md:col-span-2">
          <Card>
            <CardHeader className="p-4">
              <CardTitle className="font-headline text-xl">{editingCategory ? 'Edit' : 'Add New'} Category</CardTitle>
            </CardHeader>
            <CardContent className="p-4 grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Name</Label>
                <Input 
                  id="name" 
                  placeholder="Category Name"
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
                  placeholder="category-slug"
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
                        {editingCategory ? 'Updating...' : 'Adding...'}
                    </>
                    ) : (
                    <>
                        {!editingCategory && <PlusCircle className="mr-2 h-4 w-4" />}
                        {editingCategory ? 'Update Category' : 'Add Category'}
                    </>
                    )}
                </Button>
                {editingCategory && (
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
