import { Sidebar, SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { DashboardNav } from "@/components/dashboard-nav";
import { UserNav } from "@/components/user-nav";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { PanelLeft } from "lucide-react";
import {
  Auth,
  useAuthState,
  User,
} from 'react-firebase-hooks/auth';
import {getFirebaseAuth, getFirebaseApp} from '@/firebase';
import {useAuth as useNextAuth} from '../auth-provider';

function getAvatar(user: User) {
  if (user.photoURL) {
    return user.photoURL;
  }
  return 'https://i.pravatar.cc/150?u=a042581f4e29026704d';
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  getFirebaseApp();
  const [user, loading, error] = useAuthState(getFirebaseAuth());
  const {tokens} = useNextAuth();
  if (loading) {
    return <div>Loading...</div>;
  }
  if (error) {
    return <div>Error: {error.message}</div>;
  }
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
