'use client';

import { Sidebar, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { DashboardNav } from "@/components/dashboard-nav";
import { UserNav } from "@/components/user-nav";
import { useAuthState } from 'react-firebase-hooks/auth';
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/firebase";
import { Loading } from "@/components/loading";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const auth = useAuth();
  const [user, loading, error] = useAuthState(auth);
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    // This effect runs only on the client, after the component has mounted.
    setIsClient(true);
  }, []);

  useEffect(() => {
    // If auth state is not loading and there's no user,
    // it means the user is not authenticated.
    // Redirect them to the login page.
    if (!loading && !user) {
      router.push('/');
    }
  }, [loading, user, router]);

  // While the authentication state is loading, or before the client has mounted,
  // display the loading component. This prevents hydration errors by ensuring
  // server and initial client renders are identical.
  if (loading || !user || !isClient) {
    return <Loading />;
  }

  // If there's an error fetching the auth state, display it.
  if (error) {
    return <div>Error: {error.message}</div>;
  }
  
  // If we have a user and loading is complete, render the dashboard.
  return (
    <SidebarProvider>
      <div className="min-h-screen w-full bg-background text-foreground flex">
        <Sidebar collapsible="icon" className="flex flex-col border-r">
          <DashboardNav />
          <div className="mt-auto p-4">
            <UserNav user={user} />
          </div>
        </Sidebar>
        <div className="flex flex-col flex-1">
          <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-card px-4 sm:h-16 sm:px-6">
            <SidebarTrigger className="lg:hidden" />
            <div className="flex-1">
              {/* Header content can go here if needed */}
            </div>
          </header>
          <main className="flex-1 p-4 sm:p-6">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}
