
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PageHeader } from '@/components/page-header';
import { ArrowLeft, PlusCircle, Loader2, X, Upload, Library, Sparkles } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { useFirestore, useAuth, useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc, serverTimestamp, writeBatch } from 'firebase/firestore';
import { setDocumentNonBlocking, addDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { useToast } from '@/hooks/use-toast';
import RichTextEditor from '@/components/rich-text-editor';
import { Textarea } from '@/components/ui/textarea';
import { MediaLibrary } from '@/components/media-library';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { generateMetaDescription } from '@/ai/flows/generate-meta-description';

type Category = {
  id: string;
  name: string;
  slug: string;
};

type Tag = {
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
  const [excerpt, setExcerpt] = useState('');
  const [metaDescription, setMetaDescription] = useState('');
  const [featuredImageUrl, setFeaturedImageUrl] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionStatus, setSubmissionStatus] = useState<'draft' | 'published' | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isGeneratingMeta, setIsGeneratingMeta] = useState(false);

  // State for new category dialog
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategorySlug, setNewCategorySlug] = useState('');
  const [isSavingCategory, setIsSavingCategory] = useState(false);


  const fileInputRef = useRef<HTMLInputElement>(null);

  const categoriesCollection = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'categories');
  }, [firestore]);
  const { data: categories, isLoading: isLoadingCategories } = useCollection<Category>(categoriesCollection);

  const tagsCollection = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'tags');
  }, [firestore]);
  const { data: allTags, isLoading: isLoadingTags } = useCollection<Tag>(tagsCollection);

  const filteredTags = useMemo(() => {
    if (!newTag || !allTags) return [];
    return allTags.filter(tag => 
        tag.name.toLowerCase().includes(newTag.toLowerCase()) && !tags.includes(tag.name)
    );
  }, [newTag, allTags, tags]);

  const handleCategoryChange = (categoryId: string, checked: boolean) => {
    setSelectedCategories(prev =>
      checked ? [...prev, categoryId] : prev.filter(id => id !== categoryId)
    );
  };

  const handleAddTag = (tag: string) => {
    const newTag = tag.trim();
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
    if (!file || !firestore || !auth?.currentUser) return;

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

      const mediaCollectionRef = collection(firestore, "media");
      addDocumentNonBlocking(mediaCollectionRef, {
        url: data.secure_url,
        filename: file.name,
        authorId: auth.currentUser.uid,
        createdAt: serverTimestamp(),
      });

      toast({
        title: "Image Uploaded",
        description: "Your featured image has been successfully uploaded and saved.",
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

    const handleGenerateMetaDescription = async () => {
    if (!title || !content) {
      toast({
        variant: 'destructive',
        title: 'Missing Content',
        description: 'Please provide a title and content to generate a description.',
      });
      return;
    }
    setIsGeneratingMeta(true);
    try {
      const result = await generateMetaDescription({ title, content });
      setMetaDescription(result.metaDescription);
      toast({ title: 'Meta Description Generated!' });
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Generation Failed', description: error.message });
    } finally {
      setIsGeneratingMeta(false);
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

    if (!firestore || !auth?.currentUser) {
        toast({
            variant: "destructive",
            title: "Error",
            description: "Could not connect to the database. Please try again.",
        });
        return;
    }

    setIsSubmitting(true);
    setSubmissionStatus(status);
    
    let finalMetaDescription = metaDescription;
    if (!finalMetaDescription && content) {
        try {
            const result = await generateMetaDescription({ title, content });
            finalMetaDescription = result.metaDescription;
            toast({ title: 'Auto-Generated Meta Description', description: 'A meta description was created for you.' });
        } catch (e) {
            console.error("Failed to auto-generate meta description:", e);
        }
    }

    const postRef = doc(collection(firestore, "posts"));
    const slug = title.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
    const titleKeywords = title.toLowerCase().split(' ').filter(Boolean);

    const newPost = {
        title,
        slug,
        titleKeywords,
        content,
        excerpt,
        metaDescription: finalMetaDescription,
        featuredImageUrl,
        status,
        authorId: auth.currentUser.uid,
        categoryIds: selectedCategories,
        tagIds: tags, 
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    };

    try {
        const batch = writeBatch(firestore);

        // 1. Create the post
        batch.set(postRef, newPost);
        
        // 2. Sync tags with the main tags collection
        const existingTags = allTags?.map(t => t.name.toLowerCase()) || [];
        tags.forEach(tag => {
            if (!existingTags.includes(tag.toLowerCase())) {
                const newTagRef = doc(collection(firestore, 'tags'));
                const tagSlug = tag.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
                batch.set(newTagRef, { name: tag, slug: tagSlug });
            }
        });

        await batch.commit();

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
        setSubmissionStatus(null);
    }
  };
  
  const handleAddNewCategory = async () => {
    if (!newCategoryName || !newCategorySlug || !firestore) {
        toast({ variant: 'destructive', title: 'Missing fields', description: 'Please provide both a name and a slug.'});
        return;
    }
    setIsSavingCategory(true);
    try {
        await addDocumentNonBlocking(collection(firestore, 'categories'), { name: newCategoryName, slug: newCategorySlug });
        toast({ title: 'Category Added!', description: `"${newCategoryName}" has been successfully added.`});
        setNewCategoryName('');
        setNewCategorySlug('');
        setIsCategoryDialogOpen(false);
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Error', description: error.message || 'Could not save the category.'});
    } finally {
        setIsSavingCategory(false);
    }
  }

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

        <div className="grid auto-rows-max items-start gap-4 lg:col-span-1 lg:sticky lg:top-20">
          <Card>
            <CardHeader>
              <CardTitle className="font-headline">Publish</CardTitle>
            </CardHeader>
            <CardContent className="border-t pt-6 flex justify-between gap-2">
              <Button variant="outline" onClick={() => handleSubmit('draft')} disabled={isSubmitting || isUploading}>
                {isSubmitting && submissionStatus === 'draft' ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Draft'
                )}
              </Button>
              <Button onClick={() => handleSubmit('published')} disabled={isSubmitting || isUploading}>
                {isSubmitting && submissionStatus === 'published' ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Publishing...
                  </>
                ) : (
                  'Publish'
                )}
              </Button>
            </CardContent>
          </Card>
           <Card>
            <CardHeader>
                <CardTitle className="font-headline">SEO</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
                <div className="grid gap-2">
                    <Label htmlFor="meta-description">Meta Description</Label>
                    <Textarea 
                        id="meta-description"
                        value={metaDescription}
                        onChange={(e) => setMetaDescription(e.target.value)}
                        placeholder="A concise summary for search engines."
                        disabled={isSubmitting || isGeneratingMeta}
                        maxLength={155}
                    />
                    <p className="text-xs text-muted-foreground">{metaDescription.length} / 155</p>
                </div>
                 <Button variant="outline" size="sm" onClick={handleGenerateMetaDescription} disabled={isGeneratingMeta || !title || !content}>
                    {isGeneratingMeta ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Sparkles className="mr-2 h-4 w-4" />}
                    Generate Description
                </Button>
            </CardContent>
          </Card>
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
                    <div className="flex flex-col gap-2">
                        <Button 
                        variant="outline" 
                        className="w-full"
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
                            Upload New
                            </>
                        )}
                        </Button>
                        <MediaLibrary onSelect={(url) => setFeaturedImageUrl(url)}>
                            <Button variant="outline" className="w-full" disabled={isSubmitting || isUploading}>
                                <Library className="mr-2 h-4 w-4" />
                                Browse Library
                            </Button>
                        </MediaLibrary>
                    </div>
                </CardContent>
            </Card>
          <Card>
            <CardHeader>
              <CardTitle className="font-headline">Categories</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-2">
                <div className="flex flex-row flex-wrap gap-x-4 gap-y-2 max-h-32 overflow-y-auto">
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
                </div>
                 <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
                    <DialogTrigger asChild>
                        <Button variant="outline" size="sm" className="mt-2">
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Add New Category
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Add New Category</DialogTitle>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="new-category-name">Name</Label>
                                <Input id="new-category-name" value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} disabled={isSavingCategory}/>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="new-category-slug">Slug</Label>
                                <Input id="new-category-slug" value={newCategorySlug} onChange={(e) => setNewCategorySlug(e.target.value)} disabled={isSavingCategory}/>
                            </div>
                        </div>
                        <DialogFooter>
                            <DialogClose asChild>
                                <Button variant="outline" disabled={isSavingCategory}>Cancel</Button>
                            </DialogClose>
                            <Button onClick={handleAddNewCategory} disabled={isSavingCategory}>
                                {isSavingCategory ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                Save Category
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
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
                <Popover open={newTag.length > 0 && filteredTags.length > 0} >
                    <PopoverTrigger asChild>
                        <div className="flex gap-2">
                            <Input
                                id="tags"
                                placeholder="New tag"
                                value={newTag}
                                onChange={(e) => setNewTag(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag(newTag))}
                                disabled={isSubmitting}
                            />
                            <Button variant="outline" size="icon" onClick={() => handleAddTag(newTag)} disabled={isSubmitting}>
                                <PlusCircle className="h-4 w-4" />
                            </Button>
                        </div>
                    </PopoverTrigger>
                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                        <ul className='max-h-48 overflow-y-auto'>
                            {filteredTags.map(tag => (
                                <li 
                                    key={tag.id}
                                    className="p-2 text-sm hover:bg-accent cursor-pointer"
                                    onClick={() => handleAddTag(tag.name)}
                                >
                                    {tag.name}
                                </li>
                            ))}
                        </ul>
                    </PopoverContent>
                </Popover>
              </div>
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
}

    