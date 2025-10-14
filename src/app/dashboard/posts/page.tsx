import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
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
  } from "@/components/ui/dropdown-menu"

const mockPosts = [
  { id: '1', title: "The Ultimate Guide to Next.js 14", status: "Published", author: "Jane Doe", categories: ["Web Dev", "Tutorial"], date: "2023-10-26" },
  { id: '2', title: "AI in 2024: Trends to Watch", status: "Draft", author: "John Smith", categories: ["AI", "Tech"], date: "2023-10-25" },
  { id: '3', title: "A Deep Dive into Server Components", status: "Published", author: "Jane Doe", categories: ["Web Dev"], date: "2023-10-24" },
  { id: '4', title: "Designing for Accessibility", status: "Review", author: "Emily White", categories: ["Design", "UX"], date: "2023-10-23" },
  { id: '5', title: "Getting Started with Tailwind CSS", status: "Published", author: "Michael Brown", categories: ["CSS", "Tutorial"], date: "2023-10-22" },
];

export default function PostsPage() {
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
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Author</TableHead>
                <TableHead>Categories</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockPosts.map((post) => (
                <TableRow key={post.id}>
                  <TableCell className="font-medium">{post.title}</TableCell>
                  <TableCell>
                    <Badge variant={post.status === "Published" ? "default" : "secondary"}>
                      {post.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{post.author}</TableCell>
                  <TableCell className="space-x-1">
                    {post.categories.map(cat => <Badge key={cat} variant="outline">{cat}</Badge>)}
                  </TableCell>
                  <TableCell>{post.date}</TableCell>
                  <TableCell>
                  <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button aria-haspopup="true" size="icon" variant="ghost">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Toggle menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem>Edit</DropdownMenuItem>
                        <DropdownMenuItem>Delete</DropdownMenuItem>
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
