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

const mockTags = [
  { id: "1", name: "Next.js", slug: "nextjs", count: 10 },
  { id: "2", name: "React", slug: "react", count: 12 },
  { id: "3", name: "Tailwind CSS", slug: "tailwind-css", count: 6 },
  { id: "4", name: "GenAI", slug: "genai", count: 4 },
  { id: "5", name: "Server Components", slug: "server-components", count: 9 },
  { id: "6", name: "Shadcn UI", slug: "shadcn-ui", count: 15 },
];

export default function TagsPage() {
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
                    <TableHead>Post Count</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockTags.map((tag) => (
                    <TableRow key={tag.id}>
                      <TableCell className="font-medium">{tag.name}</TableCell>
                      <TableCell>{tag.slug}</TableCell>
                      <TableCell>{tag.count}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="font-headline">Add New Tag</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" placeholder="Tag Name" />
                <p className="text-sm text-muted-foreground">The name is how it appears on your site.</p>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="slug">Slug</Label>
                <Input id="slug" placeholder="tag-slug" />
                 <p className="text-sm text-muted-foreground">The “slug” is the URL-friendly version of the name.</p>
              </div>
              <Button>
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Tag
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
