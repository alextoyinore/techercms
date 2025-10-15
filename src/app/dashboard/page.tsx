'use client';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from '@/components/ui/card';
import {
  FileText,
  ImageIcon,
  Folder,
  File,
  PlusCircle,
  ArrowRight,
  List,
  Loader2,
} from 'lucide-react';
import { PageHeader } from '@/components/page-header';
import { useAuthState } from 'react-firebase-hooks/auth';
import { useAuth, useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, Timestamp, doc, serverTimestamp } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, LineChart, Line, Legend } from 'recharts';
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart';
import { useMemo, useState } from 'react';
import { format, subMonths, startOfMonth } from 'date-fns';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { setDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { useRouter } from 'next/navigation';

type ContentItem = {
  id: string;
  title?: string;
  categoryIds?: string[];
  createdAt?: Timestamp;
};

type Category = {
    id: string;
    name: string;
}

function StatCard({
  title,
  value,
  icon: Icon,
  isLoading,
}: {
  title: string;
  value: number | string;
  icon: React.ElementType;
  isLoading: boolean;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-8 w-24" />
        ) : (
          <div className="text-2xl font-bold">{value}</div>
        )}
      </CardContent>
    </Card>
  );
}

export default function Dashboard() {
  const auth = useAuth();
  const firestore = useFirestore();
  const [user] = useAuthState(auth);
  const { toast } = useToast();
  const router = useRouter();

  const [draftTitle, setDraftTitle] = useState('');
  const [isSavingDraft, setIsSavingDraft] = useState(false);

  const postsCollection = useMemoFirebase(
    () => (firestore ? collection(firestore, 'posts') : null),
    [firestore]
  );
  const pagesCollection = useMemoFirebase(
    () => (firestore ? collection(firestore, 'pages') : null),
    [firestore]
  );
  const mediaCollection = useMemoFirebase(
    () => (firestore ? collection(firestore, 'media') : null),
    [firestore]
  );
  const categoriesCollection = useMemoFirebase(
    () => (firestore ? collection(firestore, 'categories') : null),
    [firestore]
  );

  const { data: posts, isLoading: isLoadingPosts } =
    useCollection<ContentItem>(postsCollection);
  const { data: pages, isLoading: isLoadingPages } =
    useCollection<ContentItem>(pagesCollection);
  const { data: mediaItems, isLoading: isLoadingMedia } =
    useCollection<ContentItem>(mediaCollection);
  const { data: categories, isLoading: isLoadingCategories } =
    useCollection<Category>(categoriesCollection);

  const recentPosts = useMemo(() => {
    if (!posts) return [];
    return [...posts]
        .sort((a, b) => (b.createdAt?.toDate() ?? 0) > (a.createdAt?.toDate() ?? 0) ? 1 : -1)
        .slice(0, 5);
  }, [posts]);

  const postsPerCategoryChartData = useMemo(() => {
    if (!posts || !categories) return [];
    
    const categoryCounts = categories.map(category => {
      const count = posts.filter(post => post.categoryIds?.includes(category.id)).length;
      return { name: category.name, posts: count };
    });

    return categoryCounts.filter(c => c.posts > 0);
  }, [posts, categories]);

  const contentOverTimeChartData = useMemo(() => {
    if (!posts || !pages) return [];

    const sixMonthsAgo = subMonths(new Date(), 5);
    const months = Array.from({ length: 6 }, (_, i) => startOfMonth(subMonths(new Date(), i))).reverse();
    
    const data = months.map(monthDate => {
      const monthKey = format(monthDate, 'MMM yyyy');
      
      const postCount = posts.filter(post => {
        const postDate = post.createdAt?.toDate();
        return postDate && format(postDate, 'MMM yyyy') === monthKey;
      }).length;

      const pageCount = pages.filter(page => {
        const pageDate = page.createdAt?.toDate();
        return pageDate && format(pageDate, 'MMM yyyy') === monthKey;
      }).length;
      
      return { month: format(monthDate, 'MMM'), posts: postCount, pages: pageCount };
    });

    return data;
  }, [posts, pages]);


  const chartConfig = {
      posts: {
        label: "Posts",
        color: "hsl(var(--primary))",
      },
       pages: {
        label: "Pages",
        color: "hsl(var(--accent))",
      },
  } satisfies import("@/components/ui/chart").ChartConfig;


  const stats = [
    {
      title: 'Total Posts',
      value: posts?.length ?? 0,
      icon: FileText,
      isLoading: isLoadingPosts,
    },
    {
      title: 'Total Pages',
      value: pages?.length ?? 0,
      icon: File,
      isLoading: isLoadingPages,
    },
    {
      title: 'Media Items',
      value: mediaItems?.length ?? 0,
      icon: ImageIcon,
      isLoading: isLoadingMedia,
    },
    {
      title: 'Categories',
      value: categories?.length ?? 0,
      icon: Folder,
      isLoading: isLoadingCategories,
    },
  ];

  const handleSaveDraft = async () => {
    if (!draftTitle.trim() || !firestore || !user) {
        toast({
            variant: "destructive",
            title: "Title is missing",
            description: "Please enter a title for your draft."
        });
        return;
    }
    setIsSavingDraft(true);

    const newPostRef = doc(collection(firestore, "posts"));
    const newPost = {
        title: draftTitle,
        status: 'draft',
        content: '',
        excerpt: '',
        featuredImageUrl: '',
        slug: draftTitle.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, ''),
        authorId: user.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    };

    try {
        await setDocumentNonBlocking(newPostRef, newPost, {});
        toast({
            title: "Draft Saved!",
            description: `"${draftTitle}" has been saved as a draft.`,
            action: <Button variant="outline" size="sm" onClick={() => router.push(`/dashboard/posts/edit/${newPostRef.id}`)}>Edit</Button>
        });
        setDraftTitle('');
    } catch (error: any) {
        toast({
            variant: "destructive",
            title: "Error saving draft",
            description: error.message || "Could not save the draft."
        });
    } finally {
        setIsSavingDraft(false);
    }
  };

  const displayName = user?.displayName || 'User';

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Dashboard"
        description={`Welcome back, ${displayName}!`}
      />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map(stat => (
          <StatCard
            key={stat.title}
            title={stat.title}
            value={stat.value}
            icon={stat.icon}
            isLoading={stat.isLoading}
          />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-1 grid gap-4 auto-rows-max">
            <Card>
                <CardHeader>
                    <CardTitle className="font-headline">Quick Draft</CardTitle>
                    <CardDescription>Jot down a new post idea.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-2">
                    <Input 
                        placeholder="Draft Title" 
                        value={draftTitle} 
                        onChange={(e) => setDraftTitle(e.target.value)}
                        disabled={isSavingDraft}
                    />
                    <Button onClick={handleSaveDraft} disabled={isSavingDraft}>
                        {isSavingDraft ? (
                            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</>
                        ) : 'Save Draft'}
                    </Button>
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle className="font-headline">Recent Posts</CardTitle>
                </CardHeader>
                <CardContent>
                    {isLoadingPosts ? (
                       <div className="space-y-4">
                            <Skeleton className="h-6 w-full" />
                            <Skeleton className="h-6 w-5/6" />
                            <Skeleton className="h-6 w-full" />
                       </div>
                    ) : recentPosts.length > 0 ? (
                        <div className="space-y-4">
                            {recentPosts.map(post => (
                                <div key={post.id} className="flex justify-between items-center text-sm">
                                    <Link href={`/dashboard/posts/edit/${post.id}`} className="hover:underline truncate" title={post.title}>
                                        {post.title}
                                    </Link>
                                    <span className='text-muted-foreground shrink-0 ml-4'>
                                        {post.createdAt ? format(post.createdAt.toDate(), 'MMM d') : ''}
                                    </span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-muted-foreground text-center">No recent posts.</p>
                    )}
                </CardContent>
                <CardFooter>
                    <Button variant="outline" asChild className="w-full">
                        <Link href="/dashboard/posts">
                            View All Posts <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                    </Button>
                </CardFooter>
            </Card>
        </div>
        <div className="lg:col-span-2 grid gap-4 auto-rows-max">
            <Card>
            <CardHeader>
                <CardTitle className="font-headline">Posts per Category</CardTitle>
                <CardDescription>A breakdown of your content distribution.</CardDescription>
            </CardHeader>
            <CardContent>
                {isLoadingPosts || isLoadingCategories ? (
                    <Skeleton className='w-full aspect-video'/>
                ) : postsPerCategoryChartData.length > 0 ? (
                    <ChartContainer config={chartConfig} className='w-full'>
                        <BarChart data={postsPerCategoryChartData} accessibilityLayer>
                            <CartesianGrid vertical={false} />
                            <XAxis dataKey="name" tickLine={false} tickMargin={10} axisLine={false} />
                            <YAxis tickLine={false} axisLine={false} allowDecimals={false}/>
                            <Tooltip cursor={false} content={<ChartTooltipContent />} />
                            <Bar dataKey="posts" fill="hsl(var(--primary))" radius={4} />
                        </BarChart>
                    </ChartContainer>
                ) : (
                    <div className='flex items-center justify-center min-h-[250px] text-center text-muted-foreground'>
                        <p>No posts with categories yet. <br/> Assign posts to categories to see this chart.</p>
                    </div>
                )}
            </CardContent>
            </Card>
            <Card>
            <CardHeader>
                <CardTitle className="font-headline">Content Over Time</CardTitle>
                <CardDescription>Your publishing trend for the last 6 months.</CardDescription>
            </CardHeader>
            <CardContent>
                {isLoadingPosts || isLoadingPages ? (
                    <Skeleton className='w-full aspect-video'/>
                ) : contentOverTimeChartData.length > 0 ? (
                    <ChartContainer config={chartConfig} className='w-full'>
                        <LineChart data={contentOverTimeChartData} accessibilityLayer>
                            <CartesianGrid vertical={false} />
                            <XAxis dataKey="month" tickLine={false} tickMargin={10} axisLine={false} />
                            <YAxis tickLine={false} axisLine={false} allowDecimals={false}/>
                            <Tooltip cursor={false} content={<ChartTooltipContent />} />
                            <Legend content={({ payload }) => (
                                <div className="flex justify-center gap-4 mt-4">
                                {payload?.map((entry) => (
                                    <div key={entry.value} className="flex items-center gap-2">
                                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
                                    <span className="text-sm text-muted-foreground capitalize">{entry.value}</span>
                                    </div>
                                ))}
                                </div>
                            )} />
                            <Line type="monotone" dataKey="posts" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                            <Line type="monotone" dataKey="pages" stroke="hsl(var(--accent))" strokeWidth={2} dot={false} />
                        </LineChart>
                    </ChartContainer>
                ) : (
                    <div className='flex items-center justify-center min-h-[250px] text-center text-muted-foreground'>
                        <p>Not enough data to display chart. <br/> Create some posts or pages to get started.</p>
                    </div>
                )}
            </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}
