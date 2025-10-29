
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useRef, useMemo, useEffect, useCallback } from 'react';
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
import { ArrowLeft, PlusCircle, Loader2, X, Upload, Library, Sparkles, Megaphone, Podcast } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { useFirestore, useAuth, useCollection, useDoc, useMemoFirebase } from '@/firebase';
import { collection, doc, serverTimestamp, writeBatch, DocumentReference } from 'firebase/firestore';
import { setDocumentNonBlocking, addDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { useToast } from '@/hooks/use-toast';
import RichTextEditor from '@/components/rich-text-editor';
import { Textarea } from '@/components/ui/textarea';
import { MediaLibrary } from '@/components/media-library';
import { generateMetaDescription } from '@/ai/flows/generate-meta-description';
import { textToSpeech } from '@/ai/flows/text-to-speech';
import { Switch } from '@/components/ui/switch';
import { ToastAction } from '@/components/ui/toast';

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

type SiteSettings = {
    autoSaveInterval?: number;
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
  const [audioUrl, setAudioUrl] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [categorySearch, setCategorySearch] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [isBreaking, setIsBreaking] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionStatus, setSubmissionStatus] = useState<'draft' | 'published' | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isGeneratingMeta, setIsGeneratingMeta] = useState(false);
  const [shouldGenerateAudio, setShouldGenerateAudio] = useState(false);

  // State for new category dialog
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategorySlug, setNewCategorySlug] = useState('');
  const [isSavingCategory, setIsSavingCategory] = useState(false);
  
  const [savedPostId, setSavedPostId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const settingsRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, 'site_settings', 'config');
  }, [firestore]);
  const { data: settings } = useDoc<SiteSettings>(settingsRef);

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
  
  const handleSave = useCallback(async (status: 'draft' | 'published', isManualSave: boolean) => {
    if (!title.trim()) {
      if (isManualSave) {
        toast({ variant: "destructive", title: "Title is missing" });
      }
      return;
    }

    if (!firestore || !auth?.currentUser) return;
    if (isSubmitting && isManualSave) return;

    if (isManualSave) {
        setIsSubmitting(true);
        setSubmissionStatus(status);
    }
    
    let postRef: DocumentReference;
    if (savedPostId) {
        postRef = doc(firestore, "posts", savedPostId);
    } else {
        postRef = doc(collection(firestore, "posts"));
    }

    let finalAudioUrl = audioUrl;
    let finalTags = [...tags];

    let finalMetaDescription = metaDescription;

    const slug = title.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
    const titleKeywords = title.toLowerCase().split(' ').filter(Boolean);

    const postData = {
        title, slug, titleKeywords, content, excerpt, status, isBreaking,
        metaDescription: finalMetaDescription,
        featuredImageUrl, audioUrl: finalAudioUrl,
        authorId: auth.currentUser.uid,
        categoryIds: selectedCategories,
        tagIds: finalTags,
        updatedAt: serverTimestamp(),
        ...(savedPostId ? {} : { createdAt: serverTimestamp() }),
    };

    try {
      await setDocumentNonBlocking(postRef, postData, { merge: true });
      
      if (!savedPostId) {
        setSavedPostId(postRef.id);
      }

      if (isManualSave) {
        toast({
            title: `Post ${status === 'published' ? 'Published' : 'Saved'}`,
            description: `Your post "${title}" has been successfully saved.`,
        });
        router.push(`/dashboard/posts/edit/${postRef.id}`);
      } else {
         toast({ description: "Draft auto-saved.", duration: 2000 });
      }

    } catch (error: any) {
        if(isManualSave) {
            toast({ variant: "destructive", title: "Uh oh! Something went wrong." });
        }
        console.error("Save error:", error);
    } finally {
        if (isManualSave) {
            setIsSubmitting(false);
            setSubmissionStatus(null);
        }
    }
  }, [title, content, excerpt, metaDescription, featuredImageUrl, audioUrl, selectedCategories, tags, isBreaking, firestore, auth, savedPostId, isSubmitting, toast, router]);

  useEffect(() => {
    const autoSaveIntervalMinutes = settings?.autoSaveInterval || 5;
    
    const interval = setInterval(() => {
      // Using a function to get the latest title value inside the interval
      if (title.trim()) {
        handleSave('draft', false);
      }
    }, autoSaveIntervalMinutes * 60 * 1000);
  
    return () => clearInterval(interval);
  }, [settings, title, handleSave]);
  
  const wordCount = useMemo(() => {
    if (!content) return 0;
    const parser = new DOMParser();
    const doc = parser.parseFromString(content, 'text/html');
    doc.querySelectorAll('[data-type="related-post"]').forEach(el => el.remove());
    const text = doc.body.textContent || "";
    if (!text.trim()) return 0;
    const words = text.trim().split(/\s+/);
    return words.length;
  }, [content]);

  const sortedCategories = useMemo(() => {
    if (!categories) return [];
    return [...categories].sort((a, b) => a.name.localeCompare(b.name));
  }, [categories]);

  const filteredCategories = useMemo(() => {
    if (!sortedCategories) return [];
    if (!categorySearch) return sortedCategories;
    return sortedCategories.filter(category =>
        category.name.toLowerCase().includes(categorySearch.toLowerCase())
    );
  }, [sortedCategories, categorySearch]);
  
  const selectedCategoryObjects = useMemo(() => {
    if (!categories) return [];
    return selectedCategories.map(id => categories.find(c => c.id === id)).filter(Boolean) as Category[];
  }, [selectedCategories, categories]);


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
  
  const processTags = useCallback((input: string) => {
    const newTags = input.split(',')
        .map(tag => tag.trim().replace(/^#/, ''))
        .filter(tag => tag && !tags.includes(tag));
    
    if (newTags.length > 0) {
        setTags(prev => [...prev, ...newTags]);
    }
    setNewTag('');
  }, [tags]);


  const handleTagInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value.includes(',')) {
      processTags(value);
    } else {
      setNewTag(value);
    }
  }

  const handleTagInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      processTags(newTag);
    }
  }

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
  
  const handleSubmit = (status: 'draft' | 'published') => {
    handleSave(status, true);
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
                <p className="text-sm text-muted-foreground text-right">
                  Word Count: {wordCount}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid auto-rows-max items-start gap-4 lg:col-span-1 lg:sticky lg:top-20">
          <Card>
            <CardHeader>
              <CardTitle className="font-headline">Publish</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 border-t pt-6">
                <div className="flex items-center space-x-2">
                    <Switch
                        id="is-breaking"
                        checked={isBreaking}
                        onCheckedChange={setIsBreaking}
                        disabled={isSubmitting}
                    />
                    <Label htmlFor="is-breaking" className="flex items-center gap-2">
                        <Megaphone className="h-4 w-4" />
                        Mark as Breaking News
                    </Label>
                </div>
                <div className="flex justify-between gap-2">
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
                </div>
            </CardContent>
          </Card>
           <Card>
            <CardHeader>
                <CardTitle className="font-headline">Audio</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
                {audioUrl && (
                  <audio controls src={audioUrl} className="w-full">Your browser does not support the audio element.</audio>
                )}
                <div className="flex items-center space-x-2">
                    <Switch
                        id="generate-audio"
                        checked={shouldGenerateAudio}
                        onCheckedChange={setShouldGenerateAudio}
                        disabled={isSubmitting || !!audioUrl}
                    />
                    <Label htmlFor="generate-audio" className="flex items-center gap-2">
                        <Podcast className="h-4 w-4" />
                        Generate audio on save
                    </Label>
                </div>
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
            <CardContent className="grid gap-4">
                {selectedCategoryObjects.length > 0 && (
                    <div className="flex flex-wrap gap-2 border-b pb-4">
                        {selectedCategoryObjects.map(cat => (
                            <Badge key={cat.id} variant="secondary" className="flex items-center gap-1">
                                {cat.name}
                                <button onClick={() => handleCategoryChange(cat.id, false)} disabled={isSubmitting}>
                                    <X className="h-3 w-3" />
                                </button>
                            </Badge>
                        ))}
                    </div>
                )}
                <Input
                    placeholder="Search categories..."
                    value={categorySearch}
                    onChange={(e) => setCategorySearch(e.target.value)}
                />
                <div className="flex flex-col gap-2 max-h-32 overflow-y-auto border p-2 rounded-md">
                    {isLoadingCategories && <p>Loading categories...</p>}
                    {filteredCategories?.map((category) => (
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
                    {!isLoadingCategories && filteredCategories?.length === 0 && (
                        <p className="text-xs text-muted-foreground text-center p-2">No categories found.</p>
                    )}
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
              <div className="grid gap-2 relative">
                <Label htmlFor="tags">Add Tags</Label>
                <div className="flex gap-2">
                    <Input
                        id="tags"
                        placeholder="Add a tag..."
                        value={newTag}
                        onChange={handleTagInputChange}
                        onKeyDown={handleTagInputKeyDown}
                        disabled={isSubmitting}
                    />
                </div>
                 <p className="text-xs text-muted-foreground">Separate tags with a comma or press Enter.</p>
              </div>
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
}

    