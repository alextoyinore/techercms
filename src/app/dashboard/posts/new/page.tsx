
'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { PageHeader } from '@/components/page-header';
import { ArrowLeft, PlusCircle, Loader2, X } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { useFirestore, useAuth, useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc, serverTimestamp } from 'firebase/firestore';
import { setDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { useToast } from '@/hooks/use-toast';

type Category = {
  id: string;
  name: string;
  slug: string;
};

export default function NewPostPage() {
  const router = useRouter();
  const firestore = useFirestore();
  const auth = useAuth();
  const { toast } = useToast();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const categoriesCollection = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'categories');
  }, [firestore]);
  const { data: categories, isLoading: isLoadingCategories } = useCollection<Category>(categoriesCollection);

  const handleCategoryChange = (categoryId: string, checked: boolean) => {
    setSelectedCategories(prev =>
      checked ? [...prev, categoryId] : prev.filter(id => id !== categoryId)
    );
  };

  const handleAddTag = () => {
    if (newTag && !tags.includes(newTag)) {
      setTags([...tags, newTag]);
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };
  
  const handleSubmit = async (status: 'draft' | 'published') => {
    if (!title) {
        toast({
            variant: "destructive",
            title: "Title is missing",
            description: "Please enter a title for your post.",
        });
        return;
    }

    if (!firestore || !auth?.currentUser) {
        toast({
            variant: "destructive",
            title: "Error",
            description: "Could not connect to the database. Please try again.",
        });
        return;
    }

    setIsSubmitting(true);
    const postRef = doc(collection(firestore, "posts"));
    const slug = title.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');

    const newPost = {
        title,
        content,
        slug,
        status,
        authorId: auth.currentUser.uid,
        categoryIds: selectedCategories,
        tagIds: tags, // In a real app, you might want to store tag IDs instead of names
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    };

    try {
        await setDocumentNonBlocking(postRef, newPost, { merge: false });
        toast({
            title: `Post ${status === 'published' ? 'Published' : 'Saved'}`,
            description: `Your post "${title}" has been successfully saved.`,
        });
        router.push('/dashboard/posts');
    } catch (error: any) {
        toast({
            variant: "destructive",
            title: "Uh oh! Something went wrong.",
            description: error.message || "Could not save the post.",
        });
    } finally {
        setIsSubmitting(false);
    }
  };


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
                <Input 
                    id="title" 
                    placeholder="Your amazing post title" 
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    disabled={isSubmitting}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="content">Content</Label>
                <Textarea
                  id="content"
                  placeholder="Start writing your content here..."
                  className="min-h-[300px]"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  disabled={isSubmitting}
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
            <CardContent className="border-t pt-6 flex justify-between gap-2">
              <Button variant="outline" onClick={() => handleSubmit('draft')} disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="animate-spin" /> : 'Save Draft'}
              </Button>
              <Button onClick={() => handleSubmit('published')} disabled={isSubmitting}>
                 {isSubmitting ? <Loader2 className="animate-spin" /> : 'Publish'}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="font-headline">Categories</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-2">
              {isLoadingCategories && <p>Loading categories...</p>}
              {categories?.map((category) => (
                <div key={category.id} className="flex items-center space-x-2">
                  <Checkbox 
                    id={category.id} 
                    onCheckedChange={(checked) => handleCategoryChange(category.id, checked as boolean)}
                    disabled={isSubmitting}
                  />
                  <Label htmlFor={category.id} className="font-normal">
                    {category.name}
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
                {tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className='flex items-center gap-1'>
                        {tag}
                        <button onClick={() => handleRemoveTag(tag)} disabled={isSubmitting}>
                            <X className="h-3 w-3" />
                        </button>
                    </Badge>
                ))}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="tags">Add Tags</Label>
                <div className="flex gap-2">
                  <Input 
                    id="tags" 
                    placeholder="New tag" 
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                    disabled={isSubmitting}
                  />
                  <Button variant="outline" size="icon" onClick={handleAddTag} disabled={isSubmitting}>
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
