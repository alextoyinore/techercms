
'use client';

import { useAuthState } from 'react-firebase-hooks/auth';
import { useAuth, useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Separator } from '../ui/separator';
import { useState, useEffect } from 'react';
import { doc } from 'firebase/firestore';

type PublicAuthNavProps = {
    className?: string;
    linkClassName?: string;
    orientation?: 'horizontal' | 'vertical';
}

type UserRole = {
  role: 'superuser' | 'writer' | 'editor' | 'subscriber';
};

export function PublicAuthNav({ className, linkClassName, orientation = 'horizontal' }: PublicAuthNavProps) {
  const auth = useAuth();
  const firestore = useFirestore();
  const [user, loading] = useAuthState(auth);
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);

  const userRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);
  
  const { data: userData, isLoading: isLoadingRole } = useDoc<UserRole>(userRef);

  useEffect(() => {
    // This effect runs only on the client, after the initial render.
    setIsClient(true);
  }, []);

  const handleLogout = async () => {
    if (auth) {
      await auth.signOut();
    }
    router.push('/');
  };

  const canAccessDashboard = userData && ['superuser', 'editor', 'writer'].includes(userData.role);

  if (loading || isLoadingRole || !isClient) {
    // Render the loading skeleton on the server AND on the initial client render
    // to prevent hydration mismatch.
    return <div className="h-6 w-24 animate-pulse bg-muted rounded-md" />;
  }

  const separator = orientation === 'horizontal' 
    ? <Separator orientation="vertical" className="h-4 mx-1" />
    : <Separator className="my-2" />;

  return (
    <div className={cn("flex items-center text-sm", orientation === 'vertical' ? 'flex-col items-stretch space-y-2' : 'gap-2', className)}>
      {user ? (
        <>
          {canAccessDashboard && (
            <Button variant="ghost" asChild className={cn('text-muted-foreground hover:text-primary hover:bg-transparent', linkClassName)}>
              <Link href="/dashboard">Dashboard</Link>
            </Button>
          )}
          <Button variant="ghost" onClick={handleLogout} className={cn('text-muted-foreground hover:text-primary hover:bg-transparent', linkClassName)}>
            Logout
          </Button>
        </>
      ) : (
        <>
          <Button variant="ghost" asChild className={cn('text-muted-foreground hover:text-primary hover:bg-transparent', linkClassName)}>
            <Link href="/login">Login</Link>
          </Button>
          <Button variant="ghost" asChild className={cn('text-muted-foreground hover:text-primary hover:bg-transparent', linkClassName)}>
            <Link href="/signup">Create Account</Link>
          </Button>
        </>
      )}
    </div>
  );
}
