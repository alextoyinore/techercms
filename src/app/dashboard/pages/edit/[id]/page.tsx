'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PageHeader } from '@/components/page-header';
import { ArrowLeft, Loader2, Upload, Library, LayoutTemplate, Wand2, Construction } from 'lucide-react';
import { useFirestore, useAuth, useDoc, useMemoFirebase, useCollection } from '@/firebase';
import { doc, serverTimestamp, Timestamp, collection, writeBatch, query, where, getDocs } from 'firebase/firestore';
import { setDocumentNonBlocking, addDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { useToast } from '@/hooks/use-toast';
import RichTextEditor from '@/components/rich-text-editor';
import { Loading } from '@/components/loading';
import { MediaLibrary } from '@/components/media-library';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import WidgetsPage from '@/app/dashboard/widgets/page';
import { Switch } from '@/components/ui/switch';
import PageBuilder from './page-builder';


type Page = {
    id: string;
    title: string;
    content: string;
    slug: string;
    featuredImageUrl: string;
    status: 'draft' | 'published';
    authorId: string;
    createdAt: Timestamp;
    updatedAt: Timestamp;
    builderEnabled?: boolean;
};

const pageWidgetAreas = [
    { name: 'Page Header', description: 'Displays at the top of the page, above the main content.', theme: 'all' },
    { name: 'Page Content', description: 'Displays as the main content of the page. If empty, the content from the rich text editor will be shown instead.', theme: 'all' },
    { name: 'Page Sidebar', description: 'A sidebar specific to this page.', theme: 'all' },
    { name: 'Page Footer', description: 'Displays at the bottom of the page, above the site footer.', theme: 'all' },
];

export default function EditPagePage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const pageId = params.id as string;
  
  const firestore = useFirestore();
  const auth = useAuth();
  const { toast } = useToast();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [featuredImageUrl, setFeaturedImageUrl] = useState('');
  const [builderEnabled, setBuilderEnabled] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isInitializingWidgets, setIsInitializingWidgets] = useState(false);
  const [submissionStatus, setSubmissionStatus] = useState<'draft' | 'published' | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const pageRef = useMemoFirebase(() => {
    if (!firestore || !pageId) return null;
    return doc(firestore, 'pages', pageId);
  }, [firestore, pageId]);

  const { data: page, isLoading: isLoadingPage } = useDoc<Page>(pageRef);

  const pageAreasQuery = useMemoFirebase(() => {
    if (!firestore || !pageId) return null;
    return query(collection(firestore, 'widget_areas'), where('pageId', '==', pageId));
  }, [firestore, pageId]);

  const { data: currentPageAreas, isLoading: isLoadingAreas } = useCollection(pageAreasQuery);
  const hasInitializedWidgets = currentPageAreas && currentPageAreas.length > 0;
  
  const activeTab = builderEnabled ? (searchParams.get('tab') || 'builder') : 'content';

  useEffect(() => {
    if (page) {
      setTitle(page.title || '');
      setContent(page.content || '');
      setFeaturedImageUrl(page.featuredImageUrl || '');
      setBuilderEnabled(page.builderEnabled || false);
    }
  }, [page]);

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

  const handleSubmit = async (status: 'draft' | 'published') => {
    if (!title) {
        toast({
            variant: "destructive",
            title: "Title is missing",
            description: "Please enter a title for your page.",
        });
        return;
    }

    if (!firestore || !auth?.currentUser || !pageRef) {
        toast({
            variant: "destructive",
            title: "Error",
            description: "Could not connect to the database. Please try again.",
        });
        return;
    }

    setIsSubmitting(true);
    setSubmissionStatus(status);
    
    // Logic to add featured image URL to media library if it's not already there
    if (featuredImageUrl) {
        const mediaQuery = query(collection(firestore, 'media'), where('url', '==', featuredImageUrl));
        const querySnapshot = await getDocs(mediaQuery);
        if (querySnapshot.empty) {
            const filename = featuredImageUrl.split('/').pop() || 'image.jpg';
            addDocumentNonBlocking(collection(firestore, "media"), {
                url: featuredImageUrl,
                filename: filename,
                authorId: auth.currentUser.uid,
                createdAt: serverTimestamp(),
            });
        }
    }
    
    const slug = title.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');

    const updatedPage = {
        title,
        content,
        featuredImageUrl,
        slug,
        status,
        builderEnabled,
        authorId: auth.currentUser.uid,
        updatedAt: serverTimestamp(),
    };

    try {
        await setDocumentNonBlocking(pageRef, updatedPage, { merge: true });
        toast({
            title: `Page Updated`,
            description: `Your page "${title}" has been successfully updated.`,
        });
        if (status === 'published' && !builderEnabled) {
            router.push('/dashboard/pages');
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
  
  const handleInitializeWidgets = async () => {
    if (!firestore || !pageId) return;

    setIsInitializingWidgets(true);
    try {
      const batch = writeBatch(firestore);
      pageWidgetAreas.forEach(area => {
        const areaRef = doc(collection(firestore, "widget_areas"));
        batch.set(areaRef, { ...area, pageId: pageId });
      });
      await batch.commit();
      toast({
        title: "Widget Areas Initialized",
        description: "This page can now have its own widget layouts.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Initialization Failed",
        description: error.message || "Could not create widget areas for this page.",
      });
    } finally {
      setIsInitializingWidgets(false);
    }
  };
  
  if (isLoadingPage || isLoadingAreas) {
    return <Loading />
  }
  
  if (!page) {
    return (
        <div className="flex flex-col gap-6 items-center justify-center h-full">
            <PageHeader title="Page not found" description="This page could not be found." />
            <Button variant="outline" asChild>
                <Link href="/dashboard/pages">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Pages
                </Link>
            </Button>
        </div>
    )
  }
  
  const handleTabChange = (value: string) => {
    router.push(`/dashboard/pages/edit/${pageId}?tab=${value}`);
  }

  const handleBuilderToggle = (checked: boolean) => {
    setBuilderEnabled(checked);
    if(checked) {
        handleTabChange('builder');
    } else {
        handleTabChange('content');
    }
  }

  const PageContentEditor = (
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
        </div>

        <div className="grid auto-rows-max items-start gap-4 lg:col-span-1 lg:sticky lg:top-36">
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
  );

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Edit Page" description="Refine your content and layout.">
        <div className="flex items-center gap-4">
             <div className="flex items-center space-x-2">
                <Switch 
                    id="builder-mode" 
                    checked={builderEnabled}
                    onCheckedChange={handleBuilderToggle}
                />
                <Label htmlFor="builder-mode" className="flex items-center gap-2">
                    <Construction className="h-4 w-4" />
                    Builder Mode
                </Label>
            </div>
            <Button variant="outline" asChild>
                <Link href="/dashboard/pages">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Pages
                </Link>
            </Button>
        </div>
      </PageHeader>
      
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <div className='flex justify-between items-end'>
          <TabsList>
            <TabsTrigger value="content" disabled={builderEnabled}>Content</TabsTrigger>
            <TabsTrigger value="builder" disabled={!builderEnabled}>Builder</TabsTrigger>
            <TabsTrigger value="widgets"><LayoutTemplate className="mr-2 h-4 w-4" /> Page Widgets</TabsTrigger>
          </TabsList>
          <div className="flex gap-2">
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
                  Updating...
                </>
              ) : (
                'Update & Publish'
              )}
            </Button>
          </div>
        </div>

        <TabsContent value="content">
          {PageContentEditor}
        </TabsContent>
         <TabsContent value="builder">
          <PageBuilder pageId={pageId}/>
        </TabsContent>
        <TabsContent value="widgets">
            {hasInitializedWidgets ? (
              <WidgetsPage pageId={pageId} />
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Initialize Page Widgets</CardTitle>
                  <CardDescription>
                    This page doesn't have its own widget areas yet. Initialize them to create a unique widget layout for this page.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button onClick={handleInitializeWidgets} disabled={isInitializingWidgets}>
                    {isInitializingWidgets ? (
                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Initializing...</>
                    ) : (
                      <><Wand2 className="mr-2 h-4 w-4" /> Initialize Widget Areas</>
                    )}
                  </Button>
                </CardContent>
              </Card>
            )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
