import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
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
import { PlusCircle } from "lucide-react";

const mockCategories = [
  { id: "1", name: "Web Dev", slug: "web-dev", count: 15 },
  { id: "2", name: "Tutorial", slug: "tutorial", count: 8 },
  { id: "3", name: "AI", slug: "ai", count: 5 },
  { id: "4", name: "Tech", slug: "tech", count: 12 },
  { id: "5", name: "Design", slug: "design", count: 20 },
  { id: "6", name: "UX", slug: "ux", count: 7 },
];

export default function CategoriesPage() {
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
                    <TableHead>Post Count</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockCategories.map((category) => (
                    <TableRow key={category.id}>
                      <TableCell className="font-medium">{category.name}</TableCell>
                      <TableCell>{category.slug}</TableCell>
                      <TableCell>{category.count}</TableCell>
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
                <Input id="name" placeholder="Category Name" />
                <p className="text-sm text-muted-foreground">The name is how it appears on your site.</p>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="slug">Slug</Label>
                <Input id="slug" placeholder="category-slug" />
                 <p className="text-sm text-muted-foreground">The “slug” is the URL-friendly version of the name.</p>
              </div>
              <Button>
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Category
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
