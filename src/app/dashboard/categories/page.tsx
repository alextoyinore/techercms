'use client';

import { useState } from "react";
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
import { PageHeader } from "@/components/page-header";
import { Loader2, PlusCircle } from "lucide-react";
import { collection, DocumentData } from "firebase/firestore";
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { addDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { useToast } from "@/hooks/use-toast";

type Category = {
  id: string;
  name: string;
  slug: string;
};

export default function CategoriesPage() {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const firestore = useFirestore();

  const categoriesCollection = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'categories');
  }, [firestore]);

  const { data: categories, isLoading } = useCollection<Category>(categoriesCollection);

  const handleAddCategory = async () => {
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
      await addDocumentNonBlocking(collection(firestore, "categories"), { name, slug });
      toast({
        title: "Category Added",
        description: `"${name}" has been successfully added.`,
      });
      setName("");
      setSlug("");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Uh oh! Something went wrong.",
        description: error.message || "Could not add the category.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Categories"
        description="Organize your posts by grouping them into categories."
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
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading && (
                    <TableRow>
                      <TableCell colSpan={2} className="text-center">
                        Loading categories...
                      </TableCell>
                    </TableRow>
                  )}
                  {!isLoading && categories?.length === 0 && (
                     <TableRow>
                        <TableCell colSpan={2} className="text-center">
                            No categories found. Add one to get started.
                        </TableCell>
                     </TableRow>
                  )}
                  {categories?.map((category) => (
                    <TableRow key={category.id}>
                      <TableCell className="font-medium">{category.name}</TableCell>
                      <TableCell>{category.slug}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
        <div className="md:col-span-2">
          <Card>
            <CardHeader className="p-4">
              <CardTitle className="font-headline text-xl">Add New Category</CardTitle>
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
              <Button onClick={handleAddCategory} disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Adding...
                  </>
                ) : (
                  <>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add Category
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
