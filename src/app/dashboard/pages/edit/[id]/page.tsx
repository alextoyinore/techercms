'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PageHeader } from '@/components/page-header';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useFirestore, useAuth, useDoc, useMemoFirebase } from '@/firebase';
import { doc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { setDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { useToast } from '@/hooks/use-toast';
import RichTextEditor from '@/components/rich-text-editor';
import { Loading } from '@/components/loading';

type Page = {
    id: string;
    title: string;
    content: string;
    slug: string;
    status: 'draft' | 'published';
    authorId: string;
    createdAt: Timestamp;
    updatedAt: Timestamp;
};

export default function EditPagePage() {
  const router = useRouter();
  const params = useParams();
  const pageId = params.id as string;
  
  const firestore = useFirestore();
  const auth = useAuth();
  const { toast } = useToast();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionStatus, setSubmissionStatus] = useState<'draft' | 'published' | null>(null);

  const pageRef = useMemoFirebase(() => {
    if (!firestore || !pageId) return null;
    return doc(firestore, 'pages', pageId);
  }, [firestore, pageId]);

  const { data: page, isLoading: isLoadingPage } = useDoc<Page>(pageRef);

  useEffect(() => {
    if (page) {
      setTitle(page.title || '');
      setContent(page.content || '');
    }
  }, [page]);

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
    const slug = title.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');

    const updatedPage = {
        title,
        content,
        slug,
        status,
        authorId: auth.currentUser.uid,
        updatedAt: serverTimestamp(),
    };

    try {
        await setDocumentNonBlocking(pageRef, updatedPage, { merge: true });
        toast({
            title: `Page Updated`,
            description: `Your page "${title}" has been successfully updated.`,
        });
        router.push('/dashboard/pages');
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
  
  if (isLoadingPage) {
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

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Edit Page" description="Refine your content.">
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
        </div>

        <div className="grid auto-rows-max items-start gap-4 lg:col-span-1 lg:sticky lg:top-20">
          <Card>
            <CardHeader>
              <CardTitle className="font-headline">Publish</CardTitle>
            </CardHeader>
            <CardContent className="border-t pt-6 flex justify-between gap-2">
              <Button variant="outline" onClick={() => handleSubmit('draft')} disabled={isSubmitting}>
                {isSubmitting && submissionStatus === 'draft' ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Draft'
                )}
              </Button>
              <Button onClick={() => handleSubmit('published')} disabled={isSubmitting}>
                 {isSubmitting && submissionStatus === 'published' ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  'Update & Publish'
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
