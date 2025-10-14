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
import { Eye, EyeOff, Gem, Loader2 } from 'lucide-react';
import { useAuth } from '@/firebase';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loading } from '@/components/loading';
import { Separator } from '@/components/ui/separator';

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
  onAuthStart,
}: {
  onSuccess: () => void;
  onAuthStart: () => void;
}) {
  const auth = useAuth();
  const [isSigningIn, setIsSigningIn] = useState(false);

  const handleSignIn = async () => {
    if (!auth) return;
    setIsSigningIn(true);
    onAuthStart();
    try {
      const result = await signInWithPopup(auth, provider);
      const idToken = await result.user.getIdToken();
      const success = await setSession(idToken);
      if (success) {
        onSuccess();
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsSigningIn(false);
    }
  };
  return (
    <Button variant="outline" onClick={handleSignIn} disabled={isSigningIn} className="w-full">
      {isSigningIn ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Redirecting...
        </>
      ) : (
        'Sign In with Google'
      )}
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
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const onUserAuthenticated = useCallback(() => {
    router.push('/dashboard');
  }, [router]);

  useEffect(() => {
    if (!loading && user) {
      onUserAuthenticated();
    }
  }, [loading, user, onUserAuthenticated]);

  const handleEmailAuth = async () => {
    if (!auth) return;
    setAuthError(null);
    setIsAuthenticating(true);
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
    } finally {
      setIsAuthenticating(false);
    }
  };

  const togglePasswordVisibility = () => setShowPassword(!showPassword);

  if (loading || user) {
    return <Loading />;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="mx-auto w-full max-w-sm">
        <CardHeader className="text-center">
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
        <Separator />
        <CardContent className="pt-6">
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
                disabled={isAuthenticating}
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
                disabled={isAuthenticating}
              />
              <button
                type="button"
                onClick={togglePasswordVisibility}
                className="absolute bottom-0 right-0 h-10 w-10 flex items-center justify-center text-muted-foreground"
                disabled={isAuthenticating}
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                <span className="sr-only">
                  {showPassword ? 'Hide password' : 'Show password'}
                </span>
              </button>
            </div>
            {authError && <p className="text-sm text-destructive">{authError}</p>}
            {error && <p className="text-sm text-destructive">{error.message}</p>}
            <Button onClick={handleEmailAuth} className="w-full" disabled={isAuthenticating}>
              {isAuthenticating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Please wait
                </>
              ) : isRegister ? (
                'Sign Up'
              ) : (
                'Sign In'
              )}
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
            <GoogleSignInButton
              onSuccess={onUserAuthenticated}
              onAuthStart={() => setIsAuthenticating(true)}
            />
          </div>
        </CardContent>
        <CardFooter className="justify-center">
          <Button variant="link" onClick={() => setIsRegister(!isRegister)} disabled={isAuthenticating}>
            {isRegister
              ? 'Already have an account? Sign In'
              : "Don't have an account? Sign Up"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
