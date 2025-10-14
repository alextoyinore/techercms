'use client';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  User,
} from 'firebase/auth';
import {useAuthState} from 'react-firebase-hooks/auth';
import {useRouter} from 'next/navigation';
import {useCallback} from 'react';
import {Button} from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {Gem} from 'lucide-react';
import {getFirebaseAuth} from '@/firebase';
import {sessionLogin} from './actions';

const provider = new GoogleAuthProvider();

function GoogleSignInButton({
  onUser,
}: {
  onUser: (user: User | null) => void;
}) {
  const handleSignIn = async () => {
    const auth = getFirebaseAuth();
    try {
      const result = await signInWithPopup(auth, provider);
      onUser(result.user);
    } catch (error) {
      console.error(error);
      onUser(null);
    }
  };
  return (
    <Button onClick={handleSignIn} className="w-full">
      Sign In with Google
    </Button>
  );
}

export function AuthForm() {
  const router = useRouter();
  const [user, loading, error] = useAuthState(getFirebaseAuth());
  const onUser = useCallback(
    async (user: User | null) => {
      if (user) {
        const idToken = await user.getIdToken();
        await sessionLogin(idToken);
        router.push('/dashboard');
      }
    },
    [router]
  );
  if (loading) {
    return <div>Loading...</div>;
  }
  if (error) {
    return <div>Error: {error.message}</div>;
  }
  if (user) {
    router.push('/dashboard');
    return null;
  }
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="mx-auto w-full max-w-sm">
        <CardHeader>
          <div className="flex items-center justify-center gap-2 mb-4">
            <Gem className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-headline font-bold">Techer CMS</h1>
          </div>
          <CardTitle className="text-2xl font-headline">Login</CardTitle>
          <CardDescription>
            Enter your email below to login to your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <GoogleSignInButton onUser={onUser} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
