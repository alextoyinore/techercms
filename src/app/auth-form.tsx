'use client';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  User,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from 'firebase/auth';
import {useAuthState} from 'react-firebase-hooks/auth';
import {useRouter} from 'next/navigation';
import {useCallback, useState, useEffect} from 'react';
import {Button} from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {Gem} from 'lucide-react';
import {getFirebaseAuth} from '@/firebase';
import {sessionLogin} from './actions';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';

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
    <Button variant="outline" onClick={handleSignIn} className="w-full">
      Sign In with Google
    </Button>
  );
}

export function AuthForm() {
  const router = useRouter();
  const [user, loading, error] = useAuthState(getFirebaseAuth());
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const onUser = useCallback(
    async (user: User | null) => {
      if (user) {
        const idToken = await user.getIdToken();
        await sessionLogin(idToken);
        // router.push('/dashboard') is now handled in useEffect
      }
    },
    []
  );

  useEffect(() => {
    if (user) {
      onUser(user);
      router.push('/dashboard');
    }
  }, [user, router, onUser]);

  const handleEmailAuth = async () => {
    const auth = getFirebaseAuth();
    setAuthError(null);
    try {
      let userCredential;
      if (isRegister) {
        userCredential = await createUserWithEmailAndPassword(
          auth,
          email,
          password
        );
      } else {
        userCredential = await signInWithEmailAndPassword(auth, email, password);
      }
      // onUser will be called by the useEffect hook when `user` state changes
    } catch (error: any) {
      setAuthError(error.message);
      console.error(error);
    }
  };

  if (loading || user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="mx-auto w-full max-w-sm">
        <CardHeader>
          <div className="flex items-center justify-center gap-2 mb-4">
            <Gem className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-headline font-bold">Techer CMS</h1>
          </div>
          <CardTitle className="text-2xl font-headline">
            {isRegister ? 'Create an account' : 'Login'}
          </CardTitle>
          <CardDescription>
            Enter your credentials to {isRegister ? 'join' : 'access your account'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            {authError && <p className="text-sm text-destructive">{authError}</p>}
            {error && <p className="text-sm text-destructive">{error.message}</p>}
            <Button onClick={handleEmailAuth} className="w-full">
              {isRegister ? 'Sign Up' : 'Sign In'}
            </Button>
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Or continue with
                </span>
              </div>
            </div>
            <GoogleSignInButton onUser={onUser} />
          </div>
        </CardContent>
        <CardFooter className="justify-center">
          <Button variant="link" onClick={() => setIsRegister(!isRegister)}>
            {isRegister
              ? 'Already have an account? Sign In'
              : "Don't have an account? Sign Up"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
