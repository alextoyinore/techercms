
'use client';

import { Sidebar, SidebarFooter, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { DashboardNav } from "@/components/dashboard-nav";
import { UserNav } from "@/components/user-nav";
import { useAuthState } from 'react-firebase-hooks/auth';
import { useRouter } from "next/navigation";
import { useEffect, useState, useMemo } from "react";
import { useAuth, useDoc, useFirestore, useMemoFirebase } from "@/firebase";
import { Loading } from "@/components/loading";
import { doc } from "firebase/firestore";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { File, PlusCircle } from "lucide-react";

type UserRole = {
  role: 'superuser' | 'writer' | string;
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const auth = useAuth();
  const firestore = useFirestore();
  const [user, authLoading, authError] = useAuthState(auth);
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);

  const userRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);

  const { data: userData, isLoading: roleLoading } = useDoc<UserRole>(userRef);
  const userRole = userData?.role;

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (authLoading || roleLoading || !isClient) return;

    if (!user) {
      router.push('/');
      return;
    }
    
    const allowedRoles = ['superuser', 'writer', 'editor', 'subscriber'];
    if (!userRole || !allowedRoles.includes(userRole)) {
        router.push('/');
    }

  }, [authLoading, roleLoading, user, userRole, router, isClient]);

  const isLoading = authLoading || roleLoading || !isClient;
  const isAuthorized = user && userRole && ['superuser', 'writer', 'editor', 'subscriber'].includes(userRole);


  if (isLoading) {
    return <Loading />;
  }
  
  if (!isAuthorized) {
    return <Loading />;
  }

  if (authError) {
    return <div>Error: {authError.message}</div>;
  }
  
  return (
    <SidebarProvider>
      <div className="min-h-screen w-full bg-background text-foreground flex">
        <Sidebar collapsible="icon" className="flex flex-col border-r">
          <DashboardNav user={user} />
        </Sidebar>
        <div className="flex flex-col flex-1">
          <header className="p-2 md:p-4 border-b flex items-center justify-between lg:justify-end sticky top-0 bg-background z-10 gap-4">
              <SidebarTrigger className="lg:hidden" />
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" asChild>
                    <Link href="/dashboard/posts/new">
                        <PlusCircle className="h-4 w-4" />
                        <span className="hidden sm:inline ml-2">New Post</span>
                    </Link>
                </Button>
                <Button variant="outline" size="sm" asChild>
                     <Link href="/dashboard/pages/new">
                        <File className="h-4 w-4" />
                        <span className="hidden sm:inline ml-2">New Page</span>
                    </Link>
                </Button>
              </div>
              <UserNav user={user} />
          </header>
          <main className="flex-1 p-4 sm:p-6">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}
