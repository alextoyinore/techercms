'use client';

import { Sidebar, SidebarProvider } from "@/components/ui/sidebar";
import { DashboardNav } from "@/components/dashboard-nav";
import { UserNav } from "@/components/user-nav";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { PanelLeft } from "lucide-react";
import { useAuthState } from 'react-firebase-hooks/auth';
import { useRouter } from "next/navigation";
import { useEffect } from "react";
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

  useEffect(() => {
    // If auth state is not loading and there's no user,
    // it means the user is not authenticated.
    // Redirect them to the login page.
    if (!loading && !user) {
      router.push('/');
    }
  }, [loading, user, router]);

  // While the authentication state is loading, display the loading component.
  // Also, if there's no user object yet (even if loading is false),
  // it might be a brief moment before the redirect kicks in.
  // Showing the loader prevents a flash of unstyled/broken content.
  if (loading || !user) {
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
        <Sidebar className="hidden lg:flex lg:flex-col lg:border-r">
          <DashboardNav />
          <div className="mt-auto p-4">
            <UserNav user={user} />
          </div>
        </Sidebar>
        <div className="flex flex-col flex-1">
          <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-card px-4 sm:h-16 sm:px-6">
            <Sheet>
              <SheetTrigger asChild>
                <Button size="icon" variant="outline" className="lg:hidden">
                  <PanelLeft className="h-5 w-5" />
                  <span className="sr-only">Toggle Menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="lg:hidden p-0 max-w-xs">
                 <SheetTitle className="sr-only">Menu</SheetTitle>
                <div className="flex flex-col h-full">
                  <DashboardNav />
                  <div className="mt-auto p-4">
                    <UserNav user={user} />
                  </div>
                </div>
              </SheetContent>
            </Sheet>
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
