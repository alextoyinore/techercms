
'use client';
import {
  GoogleAuthProvider,
  User,
  createUserWithEmailAndPassword,
  getDoc,
  signInWithEmailAndPassword,
  signInWithPopup,
} from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardFooter,
} from '@/components/ui/card';
import { Eye, EyeOff, Gem, Loader2 } from 'lucide-react';
import { useAuth, useDoc, useFirestore, useMemoFirebase, setDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';

const provider = new GoogleAuthProvider();

function GoogleSignInButton({ onAuthStart, onSuccess }: { onAuthStart: () => void, onSuccess: (user: User, isNewUser: boolean) => void }) {
  const auth = useAuth();
  const [isSigningIn, setIsSigningIn] = useState(false);
  const firestore = useFirestore();

  const handleSignIn = async () => {
    if (!auth || !firestore) return;
    onAuthStart();
    setIsSigningIn(true);
    try {
      const result = await signInWithPopup(auth, provider);
      // Check if user is new by trying to get their document
      const userDocRef = doc(firestore, 'users', result.user.uid);
      const userDoc = await (await import('firebase/firestore')).getDoc(userDocRef);
      const isNewUser = !userDoc.exists();
      onSuccess(result.user, isNewUser);
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

type SiteSettings = {
  siteName?: string;
}

export function AuthForm() {
  const router = useRouter();
  const auth = useAuth();
  const firestore = useFirestore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const settingsRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, 'site_settings', 'config');
  }, [firestore]);
  const { data: settings } = useDoc<SiteSettings>(settingsRef);

  const onUserAuthenticated = async (user: User, isNewUser: boolean) => {
    if (!firestore) {
      router.push('/');
      return;
    }
    
    if (isNewUser) {
        const userDocRef = doc(firestore, 'users', user.uid);
        const newUserProfile = {
            id: user.uid,
            email: user.email,
            displayName: user.displayName || user.email?.split('@')[0],
            photoURL: user.photoURL,
            bio: '',
            role: 'subscriber',
        };
        // Save the new user's profile to Firestore
        await setDocumentNonBlocking(userDocRef, newUserProfile, { merge: true });
        router.push('/');
    } else {
        try {
            const userDocRef = doc(firestore, 'users', user.uid);
            const userDoc = await (await import('firebase/firestore')).getDoc(userDocRef);

            if (userDoc.exists()) {
                const userData = userDoc.data();
                const role = userData.role;
                if (role === 'superuser' || role === 'editor' || role === 'writer') {
                    router.push('/dashboard');
                } else {
                    router.push('/');
                }
            } else {
                router.push('/');
            }
        } catch (error) {
            console.error("Error fetching user role:", error);
            router.push('/'); // Fallback on error
        }
    }
  };

  const handleEmailAuth = async () => {
    if (!auth) return;
    setAuthError(null);
    setIsAuthenticating(true);
    try {
      let userCredential;
      if (isRegister) {
        userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await onUserAuthenticated(userCredential.user, true); // New user
      } else {
        userCredential = await signInWithEmailAndPassword(auth, email, password);
        await onUserAuthenticated(userCredential.user, false); // Existing user
      }
    } catch (error: any) {
      setAuthError(error.message);
      console.error(error);
    } finally {
      setIsAuthenticating(false);
    }
  };

  const togglePasswordVisibility = () => setShowPassword(!showPassword);

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="mx-auto w-full max-w-[380px]">
        <CardHeader className="text-center p-6">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Gem className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-headline font-bold">{settings?.siteName || 'Techer CMS'}</h1>
          </div>
          <CardDescription>
            Enter your credentials to {isRegister ? 'join' : 'access your account'}
          </CardDescription>
        </CardHeader>
        <Separator />
        <CardContent className="p-6">
          <div className="grid gap-3">
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
            <Button onClick={handleEmailAuth} className="w-full mt-2" disabled={isAuthenticating}>
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
            <div className="relative mt-2">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Or continue with
                </span>
              </div>
            </div>
            <GoogleSignInButton onAuthStart={() => setIsAuthenticating(true)} onSuccess={onUserAuthenticated} />
          </div>
        </CardContent>
        <CardFooter className="justify-center p-4 pt-0">
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
