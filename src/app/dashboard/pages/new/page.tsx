
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
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
import { ArrowLeft, Loader2, Upload, Library, Sparkles, Key } from 'lucide-react';
import { useFirestore, useAuth } from '@/firebase';
import { collection, doc, serverTimestamp, writeBatch, getDocs, query, where } from 'firebase/firestore';
import { setDocumentNonBlocking, addDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { useToast } from '@/hooks/use-toast';
import RichTextEditor from '@/components/rich-text-editor';
import { MediaLibrary } from '@/components/media-library';
import { Textarea } from '@/components/ui/textarea';
import { generateMetaDescription } from '@/ai/flows/generate-meta-description';
import { generateKeyword } from '@/ai/flows/generate-keyword';

const pageWidgetAreas = [
    { name: 'Page Header', description: 'Displays at the top of the page, above the main content.', theme: 'all' },
    { name: 'Page Content', description: 'Displays as the main content of the page. If empty, the content from the rich text editor will be shown instead.', theme: 'all' },
    { name: 'Page Sidebar', description: 'A sidebar specific to this page.', theme: 'all' },
    { name: 'Page Footer', description: 'Displays at the bottom of the page, above the site footer.', theme: 'all' },
];

export default function NewPagePage() {
  const router = useRouter();
  const firestore = useFirestore();
  const auth = useAuth();
  const { toast } = useToast();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [metaDescription, setMetaDescription] = useState('');
  const [focusKeyword, setFocusKeyword] = useState('');
  const [featuredImageUrl, setFeaturedImageUrl] = useState('');
  const [featuredImageCaption, setFeaturedImageCaption] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionStatus, setSubmissionStatus] = useState<'draft' | 'published' | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isGeneratingMeta, setIsGeneratingMeta] = useState(false);
  const [isGeneratingKeyword, setIsGeneratingKeyword] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
  
  const handleGenerateKeyword = async () => {
    if (!title || !content) {
      toast({
        variant: 'destructive',
        title: 'Missing Content',
        description: 'Please provide a title and content to generate a keyword.',
      });
      return;
    }
    setIsGeneratingKeyword(true);
    try {
      const result = await generateKeyword({ title, content });
      setFocusKeyword(result.focusKeyword);
      toast({ title: 'Focus Keyword Generated!' });
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Generation Failed', description: error.message });
    } finally {
      setIsGeneratingKeyword(false);
    }
  };


  const handleSubmit = async (status: 'draft' | 'published') => {
    if (!title) {
        toast({
            variant: "destructive",
            title: "Title is missing",
            description: "Please enter a title for your page.",
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
            toast({ title: 'Auto-Generated Meta Description' });
        } catch (e) {
            console.error("Failed to auto-generate meta description:", e);
        }
    }

    let finalFocusKeyword = focusKeyword;
    if (!finalFocusKeyword && content) {
        try {
            const result = await generateKeyword({ title, content });
            finalFocusKeyword = result.focusKeyword;
            toast({ title: 'Auto-Generated Focus Keyword' });
        } catch (e) {
            console.error("Failed to auto-generate focus keyword:", e);
        }
    }

    const pageRef = doc(collection(firestore, "pages"));
    const slug = title.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');

    const newPage = {
        title,
        content,
        metaDescription: finalMetaDescription,
        focusKeyword: finalFocusKeyword,
        featuredImageUrl,
        featuredImageCaption,
        slug,
        status,
        authorId: auth.currentUser.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    };

    try {
        const batch = writeBatch(firestore);

        // 1. Create the page
        batch.set(pageRef, newPage);

        // 2. Create the widget areas for the page
        pageWidgetAreas.forEach(area => {
            const areaRef = doc(collection(firestore, "widget_areas"));
            batch.set(areaRef, { ...area, pageId: pageRef.id });
        });

        await batch.commit();

        toast({
            title: `Page ${status === 'published' ? 'Published' : 'Saved'}`,
            description: `Your page "${title}" has been successfully created.`,
        });

        // Redirect to the edit page after creation
        if (status === 'draft') {
            // If saving as a draft, go directly to the widgets tab
            router.push(`/dashboard/pages/edit/${pageRef.id}?tab=widgets`);
        } else {
            // If publishing, go to the content tab of the new page
            router.push(`/dashboard/pages/edit/${pageRef.id}`);
        }

    } catch (error: any) {
        toast({
            variant: "destructive",
            title: "Uh oh! Something went wrong.",
            description: error.message || "Could not save the page.",
        });
    } finally {
        setIsSubmitting(false);
        setSubmissionStatus(null);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="New Page" description="Create a new static page.">
        <Button variant="outline" asChild>
          <Link href="/dashboard/pages">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Pages
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
                    placeholder="Your amazing page title" 
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
          <Card>
            <CardHeader>
              <CardTitle className="font-headline">SEO</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-6">
                <div className="grid gap-2">
                    <Label htmlFor="focus-keyword" className="flex items-center gap-2"><Key className="h-4 w-4" /> Focus Keyword</Label>
                    <div className="flex gap-2">
                        <Input 
                            id="focus-keyword"
                            value={focusKeyword}
                            onChange={(e) => setFocusKeyword(e.target.value)}
                            placeholder="e.g., Next.js Performance"
                            disabled={isSubmitting || isGeneratingKeyword}
                        />
                        <Button variant="outline" size="icon" onClick={handleGenerateKeyword} disabled={isGeneratingKeyword || !title || !content} aria-label="Generate Keyword">
                            {isGeneratingKeyword ? <Loader2 className="h-4 w-4 animate-spin"/> : <Sparkles className="h-4 w-4" />}
                        </Button>
                    </div>
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="meta-description">Meta Description</Label>
                    <Textarea 
                        id="meta-description"
                        value={metaDescription}
                        onChange={(e) => setMetaDescription(e.target.value)}
                        placeholder="A concise summary for search engines."
                        disabled={isSubmitting || isGeneratingMeta}
                        maxLength={155}
                        rows={3}
                    />
                    <p className="text-xs text-muted-foreground">{metaDescription.length} / 155</p>
                </div>
                 <Button variant="outline" size="sm" onClick={handleGenerateMetaDescription} disabled={isGeneratingMeta || !title || !content} className="w-fit">
                    {isGeneratingMeta ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Sparkles className="mr-2 h-4 w-4" />}
                    Generate Description
                </Button>
            </CardContent>
          </Card>
        </div>

        <div className="grid auto-rows-max items-start gap-4 lg:col-span-1 lg:sticky lg:top-20">
          <Card>
            <CardHeader>
              <CardTitle className="font-headline">Publish</CardTitle>
            </CardHeader>
            <CardContent className="border-t pt-6">
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
                <CardTitle className="font-headline">Featured Image</CardTitle>
                <CardDescription>Set a main image for this page.</CardDescription>
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
                <div className="grid gap-2">
                    <Label htmlFor="featured-image-caption">Image Caption</Label>
                    <Input
                        id="featured-image-caption"
                        placeholder="e.g., Photo by Jane Doe"
                        value={featuredImageCaption}
                        onChange={(e) => setFeaturedImageCaption(e.target.value)}
                        disabled={isSubmitting}
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
        </div>
      </div>
    </div>
  );
}

    