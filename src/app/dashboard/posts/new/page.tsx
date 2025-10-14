import Link from "next/link";
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
import { Textarea } from "@/components/ui/textarea";
import { PageHeader } from "@/components/page-header";
import { ArrowLeft, PlusCircle } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

const mockCategories = ["Web Dev", "Tutorial", "AI", "Tech", "Design", "UX", "CSS"];

export default function NewPostPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="New Post" description="Create a new masterpiece.">
        <Button variant="outline" asChild>
          <Link href="/dashboard/posts">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Posts
          </Link>
        </Button>
      </PageHeader>

      <div className="grid gap-4 lg:grid-cols-3 lg:gap-8">
        <div className="lg:col-span-2 grid auto-rows-max items-start gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="font-headline">Post Details</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-6">
              <div className="grid gap-2">
                <Label htmlFor="title">Title</Label>
                <Input id="title" placeholder="Your amazing post title" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="content">Content</Label>
                <Textarea
                  id="content"
                  placeholder="Start writing your content here..."
                  className="min-h-[300px]"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid auto-rows-max items-start gap-4 lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="font-headline">Publish</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6">
                <p className="text-sm text-muted-foreground">
                  Status: <span className="font-semibold text-foreground">Draft</span>
                </p>
              </div>
            </CardContent>
            <CardContent className="border-t pt-6 flex justify-between">
              <Button variant="outline">Save Draft</Button>
              <Button>Publish</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="font-headline">Categories</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-2">
              {mockCategories.map((category) => (
                <div key={category} className="flex items-center space-x-2">
                  <Checkbox id={category} />
                  <Label htmlFor={category} className="font-normal">
                    {category}
                  </Label>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="font-headline">Tags</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2 mb-4">
                <Badge variant="secondary">Next.js</Badge>
                <Badge variant="secondary">React</Badge>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="tags">Add Tags</Label>
                <div className="flex gap-2">
                  <Input id="tags" placeholder="New tag" />
                  <Button variant="outline" size="icon">
                    <PlusCircle className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
