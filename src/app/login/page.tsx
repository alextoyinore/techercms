'use client';

import { useAuthState } from 'react-firebase-hooks/auth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAuth } from '@/firebase';
import { AuthForm } from '@/app/auth-form';
import { Loading } from '@/components/loading';

export default function LoginPage() {
  const auth = useAuth();
  const [user, loading] = useAuthState(auth);
  const router = useRouter();

  useEffect(() => {
    if (user) {
      router.push('/dashboard');
    }
  }, [user, router]);

  if (loading) {
    return <Loading />;
  }
  
  if (user) {
    // While redirecting, show loading to prevent flashing the login form
    return <Loading />;
  }

  return <AuthForm />;
}
