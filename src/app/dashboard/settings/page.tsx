'use client';

import Image from 'next/image';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PageHeader } from '@/components/page-header';
import { CheckCircle, Loader2 } from 'lucide-react';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { useTheme } from '@/components/theme-provider';
import { themes } from '@/lib/themes';
import { useAuth } from '@/firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { updateProfile, updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';

export default function SettingsPage() {
  const themeImages = PlaceHolderImages.filter(img =>
    img.id.startsWith('theme-')
  );
  const { theme: activeTheme, setTheme } = useTheme();

  const auth = useAuth();
  const [user, loadingUser] = useAuthState(auth);
  const { toast } = useToast();

  // Profile states
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Password states
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  useEffect(() => {
    if (user) {
      const nameParts = user.displayName?.split(' ') || ['', ''];
      setFirstName(nameParts[0] || '');
      setLastName(nameParts.slice(1).join(' ') || '');
      setEmail(user.email || '');
    }
  }, [user]);

  const handleProfileSave = async () => {
    if (!user) return;
    setIsSavingProfile(true);

    const newDisplayName = `${firstName} ${lastName}`.trim();
    
    try {
      if (user.displayName !== newDisplayName) {
        await updateProfile(user, { displayName: newDisplayName });
      }
      // Note: Updating email is a sensitive action often requiring re-authentication,
      // and is not implemented here for simplicity.
      
      toast({
        title: 'Profile Updated',
        description: 'Your profile information has been successfully updated.',
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Uh oh! Something went wrong.',
        description: error.message || 'Could not update your profile.',
      });
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handlePasswordUpdate = async () => {
    if (!user || !user.email) return;

    if (newPassword !== confirmPassword) {
      toast({
        variant: 'destructive',
        title: 'Passwords do not match',
        description: 'Please ensure your new password and confirmation match.',
      });
      return;
    }

    if (newPassword.length < 6) {
        toast({
            variant: 'destructive',
            title: 'Password too short',
            description: 'Your new password must be at least 6 characters long.',
        });
        return;
    }

    setIsUpdatingPassword(true);

    try {
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, newPassword);

      toast({
        title: 'Password Updated',
        description: 'Your password has been changed successfully.',
      });
      
      // Clear password fields
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');

    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error updating password',
        description: error.code === 'auth/wrong-password' 
          ? 'The current password you entered is incorrect.' 
          : error.message || 'Could not update your password.',
      });
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Settings"
        description="Manage your account settings and preferences."
      />
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="font-headline">Profile</CardTitle>
            <CardDescription>
              Update your personal information.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="first-name">First Name</Label>
                <Input 
                  id="first-name" 
                  value={firstName} 
                  onChange={e => setFirstName(e.target.value)} 
                  disabled={isSavingProfile || loadingUser}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="last-name">Last Name</Label>
                <Input 
                  id="last-name" 
                  value={lastName} 
                  onChange={e => setLastName(e.target.value)} 
                  disabled={isSavingProfile || loadingUser}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email" 
                type="email" 
                value={email} 
                disabled // Email change is a sensitive operation, disabling for now.
              />
               <p className="text-sm text-muted-foreground">Changing your email address is not supported at this time.</p>
            </div>
          </CardContent>
          <CardFooter className="border-t px-6 py-4">
            <Button onClick={handleProfileSave} disabled={isSavingProfile || loadingUser}>
                {isSavingProfile ? (
                    <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                    </>
                ) : 'Save Changes'}
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-headline">Password</CardTitle>
            <CardDescription>Change your password.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="current-password">Current Password</Label>
              <Input 
                id="current-password" 
                type="password" 
                value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)}
                disabled={isUpdatingPassword || loadingUser}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="new-password">New Password</Label>
                <Input 
                  id="new-password" 
                  type="password"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  disabled={isUpdatingPassword || loadingUser}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="confirm-password">
                  Confirm New Password
                </Label>
                <Input 
                  id="confirm-password" 
                  type="password" 
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  disabled={isUpdatingPassword || loadingUser}
                />
              </div>
            </div>
          </CardContent>
          <CardFooter className="border-t px-6 py-4">
            <Button onClick={handlePasswordUpdate} disabled={isUpdatingPassword || loadingUser}>
                {isUpdatingPassword ? (
                    <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Updating...
                    </>
                ) : 'Update Password'}
            </Button>
          </CardFooter>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="font-headline">Appearance</CardTitle>
            <CardDescription>
              Customize the look and feel of the admin dashboard.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {themes.map((theme, index) => {
              const image = themeImages[index % themeImages.length];
              const isActive = activeTheme.name === theme.name;
              return (
                <div key={theme.name} className="flex flex-col gap-2">
                   <Image
                      alt={theme.name}
                      className={`aspect-video w-full object-cover border rounded-lg ${isActive ? 'ring-2 ring-primary ring-offset-2' : ''}`}
                      data-ai-hint={image.imageHint}
                      height={400}
                      src={image.imageUrl}
                      width={600}
                    />
                  <div className="grid gap-0.5">
                    <h3 className="font-semibold">{theme.name}</h3>
                     {isActive && (
                        <p className="text-xs text-primary font-semibold flex items-center gap-1">
                          <CheckCircle className="h-3 w-3" />
                          Active
                        </p>
                      )}
                  </div>
                   <Button
                      onClick={() => setTheme(theme)}
                      disabled={isActive}
                      size="sm"
                      variant={isActive ? "secondary" : "outline"}
                    >
                      {isActive ? 'Activated' : 'Activate'}
                    </Button>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
