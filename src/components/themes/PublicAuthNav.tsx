
'use client';

import { useAuthState } from 'react-firebase-hooks/auth';
import { useAuth } from '@/firebase';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Separator } from '../ui/separator';

type PublicAuthNavProps = {
    className?: string;
    linkClassName?: string;
    orientation?: 'horizontal' | 'vertical';
}

export function PublicAuthNav({ className, linkClassName, orientation = 'horizontal' }: PublicAuthNavProps) {
  const auth = useAuth();
  const [user, loading] = useAuthState(auth);
  const router = useRouter();

  const handleLogout = async () => {
    if (auth) {
      await auth.signOut();
    }
    router.push('/');
  };

  if (loading) {
    return <div className="h-6 w-24 animate-pulse bg-muted rounded-md" />;
  }

  const separator = orientation === 'horizontal' 
    ? <Separator orientation="vertical" className="h-4 mx-1" />
    : <Separator className="my-2" />;

  return (
    <div className={cn("flex items-center text-sm", orientation === 'vertical' ? 'flex-col items-stretch space-y-2' : 'gap-2', className)}>
      {user ? (
        <>
          <Button variant="ghost" asChild className={cn('text-muted-foreground hover:text-primary hover:bg-transparent', linkClassName)}>
            <Link href="/dashboard">Dashboard</Link>
          </Button>
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
