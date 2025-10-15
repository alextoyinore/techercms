'use client';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  FileText,
  ImageIcon,
  Folder,
  Users,
  File,
} from 'lucide-react';
import { PageHeader } from '@/components/page-header';
import { useAuthState } from 'react-firebase-hooks/auth';
import { useAuth, useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, Timestamp } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';

type ContentItem = {
  id: string;
};

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
    useCollection<ContentItem>(categoriesCollection);

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
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="font-headline">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-4">
              <li className="flex items-center gap-4">
                <Users className="h-5 w-5 text-muted-foreground" />
                <p className="text-sm">
                  New user <span className="font-semibold">John Doe</span> signed
                  up.
                </p>
                <time className="ml-auto text-xs text-muted-foreground">
                  2 min ago
                </time>
              </li>
              <li className="flex items-center gap-4">
                <FileText className="h-5 w-5 text-muted-foreground" />
                <p className="text-sm">
                  <span className="font-semibold">Jane Smith</span> published a
                  new post: "The Future of AI".
                </p>
                <time className="ml-auto text-xs text-muted-foreground">
                  1 hour ago
                </time>
              </li>
              <li className="flex items-center gap-4">
                <ImageIcon className="h-5 w-5 text-muted-foreground" />
                <p className="text-sm">
                  3 new images uploaded to the media library.
                </p>
                <time className="ml-auto text-xs text-muted-foreground">
                  4 hours ago
                </time>
              </li>
            </ul>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="font-headline">Quick Draft</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              More dashboard widgets and content coming soon.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
