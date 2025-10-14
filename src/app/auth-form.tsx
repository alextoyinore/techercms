'use client';
import {
  GoogleAuthProvider,
  User,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
} from 'firebase/auth';
import { useAuthState } from 'react-firebase-hooks/auth';
import { useRouter } from 'next/navigation';
import { useCallback, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Eye, EyeOff, Gem } from 'lucide-react';
import { useAuth } from '@/firebase';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const provider = new GoogleAuthProvider();

async function setSession(idToken: string) {
  const response = await fetch('/api/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ idToken }),
  });

  return response.ok;
}

function GoogleSignInButton({
  onSuccess,
}: {
  onSuccess: () => void;
}) {
  const auth = useAuth();
  const handleSignIn = async () => {
    if (!auth) return;
    try {
      const result = await signInWithPopup(auth, provider);
      const idToken = await result.user.getIdToken();
      const success = await setSession(idToken);
      if (success) {
        onSuccess();
      }
    } catch (error) {
      console.error(error);
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
  const auth = useAuth();
  const [user, loading, error] = useAuthState(auth);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const onUserAuthenticated = useCallback(() => {
    router.push('/dashboard');
  }, [router]);

  useEffect(() => {
    if (user) {
      // If user is already logged in via an existing session, redirect.
      // This might happen if they land on the login page but have a valid cookie.
      onUserAuthenticated();
    }
  }, [user, onUserAuthenticated]);

  const handleEmailAuth = async () => {
    if (!auth) return;
    setAuthError(null);
    try {
      let userCredential;
      if (isRegister) {
        userCredential = await createUserWithEmailAndPassword(auth, email, password);
      } else {
        userCredential = await signInWithEmailAndPassword(auth, email, password);
      }
      const idToken = await userCredential.user.getIdToken();
      const success = await setSession(idToken);
      if (success) {
        onUserAuthenticated();
      } else {
        setAuthError('Failed to create session. Please try again.');
      }
    } catch (error: any) {
      setAuthError(error.message);
      console.error(error);
    }
  };

  const togglePasswordVisibility = () => setShowPassword(!showPassword);

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
            <div className="grid gap-2 relative">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pr-10"
              />
              <button
                type="button"
                onClick={togglePasswordVisibility}
                className="absolute bottom-0 right-0 h-10 w-10 flex items-center justify-center text-muted-foreground"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                <span className="sr-only">
                  {showPassword ? 'Hide password' : 'Show password'}
                </span>
              </button>
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
            <GoogleSignInButton onSuccess={onUserAuthenticated} />
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
