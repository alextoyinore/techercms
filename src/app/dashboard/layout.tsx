
'use client';

import { Sidebar, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { DashboardNav } from "@/components/dashboard-nav";
import { UserNav } from "@/components/user-nav";
import { useAuthState } from 'react-firebase-hooks/auth';
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState, useMemo } from "react";
import { useAuth, useDoc, useFirestore, useMemoFirebase } from "@/firebase";
import { Loading } from "@/components/loading";
import { doc } from "firebase/firestore";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { File, PlusCircle } from "lucide-react";
import { NotificationBell } from "@/components/NotificationBell";
import { PushNotificationManager } from "@/components/PushNotificationManager";

type UserRole = {
  role: 'superuser' | 'writer' | 'editor' | 'subscriber';
};

const adminOnlyPaths = [
  '/dashboard/layouts',
  '/dashboard/widgets',
  '/dashboard/navigation',
  '/dashboard/users',
  '/dashboard/settings',
  '/dashboard/themes',
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const auth = useAuth();
  const firestore = useFirestore();
  const [user, authLoading, authError] = useAuthState(auth);
  const router = useRouter();
  const pathname = usePathname();
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

  const isAccessingAdminPage = adminOnlyPaths.some(p => pathname.startsWith(p));

  // Primary loading state check
  const isLoading = authLoading || roleLoading || !isClient;
  
  useEffect(() => {
    if (isLoading) return;

    if (!user) {
      router.push('/');
      return;
    }
    
    // If user data is loaded and they are trying to access an admin page without the superuser role
    if (userData && isAccessingAdminPage && userRole !== 'superuser') {
        router.push('/dashboard');
    }

  }, [isLoading, user, userData, userRole, isAccessingAdminPage, router]);


  if (isLoading) {
    return <Loading />;
  }
  
  // If user is not authenticated after loading, they will be redirected by the effect above.
  // Render loading to prevent flashing content during redirect.
  if (!user) {
     return <Loading />;
  }
  
  // If the user's role is loaded, but they are not a superuser and are trying to access an admin page
  if (userData && isAccessingAdminPage && userRole !== 'superuser') {
    // The redirect has been initiated. Show a loading screen to prevent flashing the unauthorized page content.
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
          <header className="p-2 md:p-4 border-b flex items-center sticky top-0 bg-background z-10 gap-4">
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
              <div className="flex items-center gap-2 ml-auto">
                <PushNotificationManager />
                <NotificationBell />
                <UserNav user={user} />
              </div>
          </header>
          <main className="flex-1 p-4 sm:p-6">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}
