'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PageHeader } from '@/components/page-header';
import { ArrowLeft, PlusCircle, Loader2, X, Upload } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { useFirestore, useAuth, useCollection, useDoc, useMemoFirebase } from '@/firebase';
import { collection, doc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { setDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { useToast } from '@/hooks/use-toast';
import RichTextEditor from '@/components/rich-text-editor';
import { Textarea } from '@/components/ui/textarea';
import { Loading } from '@/components/loading';

type Category = {
  id: string;
  name: string;
  slug: string;
};

type Post = {
    id: string;
    title: string;
    content: string;
    excerpt: string;
    featuredImageUrl: string;
    slug: string;
    status: 'draft' | 'published' | 'archived';
    authorId: string;
    categoryIds: string[];
    tagIds: string[];
    createdAt: Timestamp;
    updatedAt: Timestamp;
};

export default function EditPostPage() {
  const router = useRouter();
  const params = useParams();
  const postId = params.id as string;
  
  const firestore = useFirestore();
  const auth = useAuth();
  const { toast } = useToast();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [featuredImageUrl, setFeaturedImageUrl] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const postRef = useMemoFirebase(() => {
    if (!firestore || !postId) return null;
    return doc(firestore, 'posts', postId);
  }, [firestore, postId]);

  const { data: post, isLoading: isLoadingPost } = useDoc<Post>(postRef);

  const categoriesCollection = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'categories');
  }, [firestore]);
  const { data: categories, isLoading: isLoadingCategories } = useCollection<Category>(categoriesCollection);

  useEffect(() => {
    if (post) {
      setTitle(post.title || '');
      setContent(post.content || '');
      setExcerpt(post.excerpt || '');
      setFeaturedImageUrl(post.featuredImageUrl || '');
      setSelectedCategories(post.categoryIds || []);
      setTags(post.tagIds || []);
    }
  }, [post]);


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
  
  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

    if (!cloudName || !uploadPreset) {
      toast({
        variant: "destructive",
        title: "Cloudinary not configured",
        description: "Please set up your Cloudinary environment variables.",
      });
      return;
    }
    
    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', uploadPreset);

    try {
      const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const data = await response.json();
      setFeaturedImageUrl(data.secure_url);
      toast({
        title: "Image Uploaded",
        description: "Your featured image has been successfully uploaded.",
      });

    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Upload Failed",
        description: error.message || "Could not upload the image.",
      });
    } finally {
      setIsUploading(false);
    }
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

    if (!firestore || !auth?.currentUser || !postRef) {
        toast({
            variant: "destructive",
            title: "Error",
            description: "Could not connect to the database. Please try again.",
        });
        return;
    }

    setIsSubmitting(true);
    const slug = title.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');

    const updatedPost = {
        title,
        content,
        excerpt,
        featuredImageUrl,
        slug,
        status,
        authorId: auth.currentUser.uid,
        categoryIds: selectedCategories,
        tagIds: tags, 
        updatedAt: serverTimestamp(),
    };

    try {
        await setDocumentNonBlocking(postRef, updatedPost, { merge: true });
        toast({
            title: `Post Updated`,
            description: `Your post "${title}" has been successfully updated.`,
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
  
  if (isLoadingPost) {
    return <Loading />
  }
  
  if (!post) {
    return (
        <div className="flex flex-col gap-6 items-center justify-center h-full">
            <PageHeader title="Post not found" description="This post could not be found." />
            <Button variant="outline" asChild>
                <Link href="/dashboard/posts">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Posts
                </Link>
            </Button>
        </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Edit Post" description="Refine your masterpiece.">
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
            <CardContent className="p-4 grid gap-4">
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
                <RichTextEditor
                  content={content}
                  onChange={setContent}
                  disabled={isSubmitting}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid auto-rows-max items-start gap-4 lg:col-span-1">
          <Card>
            <CardHeader>
                <CardTitle className="font-headline">Excerpt</CardTitle>
                <CardDescription>A short summary of the post.</CardDescription>
            </CardHeader>
            <CardContent>
                <Textarea 
                    id="excerpt"
                    value={excerpt}
                    onChange={(e) => setExcerpt(e.target.value)}
                    placeholder="Write a brief excerpt..."
                    disabled={isSubmitting}
                />
            </CardContent>
          </Card>
            <Card>
                <CardHeader>
                    <CardTitle className="font-headline">Featured Image</CardTitle>
                    <CardDescription>Set a main image for this post.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4">
                    {featuredImageUrl && (
                      <div className="relative aspect-video w-full">
                        <Image
                          src={featuredImageUrl}
                          alt="Featured image preview"
                          fill
                          className="rounded-md object-cover"
                        />
                      </div>
                    )}
                    <div className="grid gap-2">
                        <Label htmlFor="featured-image">Image URL</Label>
                        <Input 
                            id="featured-image"
                            placeholder="https://example.com/image.jpg"
                            value={featuredImageUrl}
                            onChange={(e) => setFeaturedImageUrl(e.target.value)}
                            disabled={isSubmitting || isUploading}
                        />
                    </div>
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      onChange={handleImageUpload} 
                      className="hidden" 
                      accept="image/*"
                    />
                    <Button 
                      variant="outline" 
                      onClick={() => fileInputRef.current?.click()} 
                      disabled={isSubmitting || isUploading}
                    >
                      {isUploading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload className="mr-2 h-4 w-4" />
                          Upload
                        </>
                      )}
                    </Button>
                </CardContent>
            </Card>
          <Card>
            <CardHeader>
              <CardTitle className="font-headline">Categories</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-row flex-wrap gap-x-4 gap-y-2">
              {isLoadingCategories && <p>Loading categories...</p>}
              {categories?.map((category) => (
                <div key={category.id} className="flex items-center space-x-2">
                  <Checkbox 
                    id={category.id}
                    checked={selectedCategories.includes(category.id)}
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

          <Card>
            <CardHeader>
              <CardTitle className="font-headline">Publish</CardTitle>
            </CardHeader>
            <CardContent className="border-t pt-6 flex justify-between gap-2">
              <Button variant="outline" onClick={() => handleSubmit('draft')} disabled={isSubmitting || isUploading}>
                {isSubmitting ? <Loader2 className="animate-spin" /> : 'Save Draft'}
              </Button>
              <Button onClick={() => handleSubmit('published')} disabled={isSubmitting || isUploading}>
                 {isSubmitting ? <Loader2 className="animate-spin" /> : 'Update & Publish'}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
