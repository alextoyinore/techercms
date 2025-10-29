
'use client';

import { PageHeader } from '@/components/page-header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageLayoutsView } from './PageLayoutsView';
import { BlockLayoutsView } from './BlockLayoutsView';
import { useAuth, useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { useAuthState } from 'react-firebase-hooks/auth';
import { useEffect } from 'react';
import { Loading } from '@/components/loading';

type UserRole = {
  role: 'superuser' | 'writer' | string;
};

export default function LayoutsPage() {
  const auth = useAuth();
  const firestore = useFirestore();
  const [currentUser, authLoading] = useAuthState(auth);
  const router = useRouter();

  const userRef = useMemoFirebase(() => {
    if (!firestore || !currentUser) return null;
    return doc(firestore, 'users', currentUser.uid);
  }, [firestore, currentUser]);

  const { data: userData, isLoading: userLoading } = useDoc<UserRole>(userRef);

  useEffect(() => {
    // Wait until both auth and user data loading are complete
    if (!authLoading && !userLoading) {
      // If loading is done and the user is not a superuser, then redirect
      if (userData?.role !== 'superuser') {
        router.push('/dashboard');
      }
    }
  }, [authLoading, userLoading, userData, router]);


  if (authLoading || userLoading) {
    return <Loading />;
  }
  
  if (userData?.role !== 'superuser') {
    return <Loading />; // Show loading while redirecting
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Layouts"
        description="Manage your site's page structures and reusable content blocks."
      />
      <Tabs defaultValue="page-layouts">
        <TabsList>
          <TabsTrigger value="page-layouts">Page Layouts</TabsTrigger>
          <TabsTrigger value="block-layouts">Block Layouts</TabsTrigger>
        </TabsList>
        <TabsContent value="page-layouts">
          <PageLayoutsView />
        </TabsContent>
        <TabsContent value="block-layouts">
          <BlockLayoutsView />
        </TabsContent>
      </Tabs>
    </div>
  );
}
