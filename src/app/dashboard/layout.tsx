
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

  const roleRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'roles', user.uid);
  }, [firestore, user]);

  const { data: userRole, isLoading: roleLoading } = useDoc<UserRole>(roleRef);

  useEffect(() => {
    // This effect runs only on the client, after the component has mounted.
    setIsClient(true);
  }, []);

  useEffect(() => {
    // Wait until loading is complete and we are on the client
    if (authLoading || roleLoading || !isClient) return;

    if (!user) {
      router.push('/');
      return;
    }
    
    // After loading, if userRole is null (doc doesn't exist) or the role is not allowed, redirect.
    const allowedRoles = ['superuser', 'writer'];
    if (!userRole || !allowedRoles.includes(userRole.role)) {
        router.push('/');
    }

  }, [authLoading, roleLoading, user, userRole, router, isClient]);

  const isLoading = authLoading || roleLoading || !isClient;
  const isAuthorized = user && userRole && ['superuser', 'writer'].includes(userRole.role);


  if (isLoading) {
    return <Loading />;
  }
  
  if (!isAuthorized) {
    // Show loading while redirecting or if unauthorized to prevent content flash
    return <Loading />;
  }

  // If there's an auth error, display it.
  if (authError) {
    return <div>Error: {authError.message}</div>;
  }
  
  // If we have an authorized user, render the dashboard.
  return (
    <SidebarProvider>
      <div className="min-h-screen w-full bg-background text-foreground flex">
        <Sidebar collapsible="icon" className="flex flex-col border-r">
          <DashboardNav user={user} />
          <div className="mt-auto hidden md:block">
            <div className="p-4">
              <UserNav user={user} />
            </div>
            <SidebarFooter />
          </div>
        </Sidebar>
        <div className="flex flex-col flex-1">
          <header className="p-2 md:p-4 border-b flex items-center justify-between lg:hidden sticky top-0 bg-background z-10">
              <SidebarTrigger />
              <UserNav user={user} />
          </header>
          <main className="flex-1 p-4 sm:p-6">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}
