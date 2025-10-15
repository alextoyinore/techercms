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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from '@/components/ui/switch';


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
                <CardTitle className="font-headline">Localization</CardTitle>
                <CardDescription>
                    Set your language and timezone preferences.
                </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
                <div className="grid gap-2">
                    <Label htmlFor="language">Language</Label>
                    <Select defaultValue="en">
                        <SelectTrigger id="language">
                            <SelectValue placeholder="Select a language" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="en">English</SelectItem>
                            <SelectItem value="es">Español</SelectItem>
                            <SelectItem value="fr">Français</SelectItem>
                            <SelectItem value="de">Deutsch</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="timezone">Timezone</Label>
                    <Select defaultValue="america/los_angeles">
                        <SelectTrigger id="timezone">
                            <SelectValue placeholder="Select a timezone" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="etc/gmt+12">(GMT-12:00) International Date Line West</SelectItem>
                            <SelectItem value="pacific/midway">(GMT-11:00) Midway Island, Samoa</SelectItem>
                            <SelectItem value="pacific/honolulu">(GMT-10:00) Hawaii</SelectItem>
                            <SelectItem value="us/alaska">(GMT-09:00) Alaska</SelectItem>
                            <SelectItem value="america/los_angeles">(GMT-08:00) Pacific Time (US & Canada)</SelectItem>
                            <SelectItem value="america/tijuana">(GMT-08:00) Tijuana, Baja California</SelectItem>
                            <SelectItem value="america/denver">(GMT-07:00) Mountain Time (US & Canada)</SelectItem>
                            <SelectItem value="america/chihuahua">(GMT-07:00) Chihuahua, La Paz, Mazatlan</SelectItem>
                            <SelectItem value="america/phoenix">(GMT-07:00) Arizona</SelectItem>
                            <SelectItem value="america/chicago">(GMT-06:00) Central Time (US & Canada)</SelectItem>
                            <SelectItem value="america/guatemala">(GMT-06:00) Central America</SelectItem>
                            <SelectItem value="america/mexico_city">(GMT-06:00) Guadalajara, Mexico City, Monterrey</SelectItem>
                            <SelectItem value="canada/saskatchewan">(GMT-06:00) Saskatchewan</SelectItem>
                            <SelectItem value="america/bogota">(GMT-05:00) Bogota, Lima, Quito, Rio Branco</SelectItem>
                            <SelectItem value="us/eastern">(GMT-05:00) Eastern Time (US & Canada)</SelectItem>
                            <SelectItem value="us/east-indiana">(GMT-05:00) Indiana (East)</SelectItem>
                            <SelectItem value="canada/atlantic">(GMT-04:00) Atlantic Time (Canada)</SelectItem>
                            <SelectItem value="america/caracas">(GMT-04:00) Caracas, La Paz</SelectItem>
                            <SelectItem value="america/manaus">(GMT-04:00) Manaus</SelectItem>
                            <SelectItem value="america/santiago">(GMT-04:00) Santiago</SelectItem>
                            <SelectItem value="canada/newfoundland">(GMT-03:30) Newfoundland</SelectItem>
                            <SelectItem value="america/sao_paulo">(GMT-03:00) Brasilia</SelectItem>
                            <SelectItem value="america/argentina/buenos_aires">(GMT-03:00) Buenos Aires, Georgetown</SelectItem>
                            <SelectItem value="america/godthab">(GMT-03:00) Greenland</SelectItem>
                            <SelectItem value="america/montevideo">(GMT-03:00) Montevideo</SelectItem>
                            <SelectItem value="atlantic/south_georgia">(GMT-02:00) Mid-Atlantic</SelectItem>
                            <SelectItem value="atlantic/azores">(GMT-01:00) Azores</SelectItem>
                            <SelectItem value="atlantic/cape_verde">(GMT-01:00) Cape Verde Is.</SelectItem>
                            <SelectItem value="africa/casablanca">(GMT+00:00) Casablanca, Monrovia, Reykjavik</SelectItem>
                            <SelectItem value="etc/gmt">(GMT+00:00) Greenwich Mean Time : Dublin, Edinburgh, Lisbon, London</SelectItem>
                            <SelectItem value="europe/amsterdam">(GMT+01:00) Amsterdam, Berlin, Bern, Rome, Stockholm, Vienna</SelectItem>
                            <SelectItem value="europe/belgrade">(GMT+01:00) Belgrade, Bratislava, Budapest, Ljubljana, Prague</SelectItem>
                            <SelectItem value="europe/brussels">(GMT+01:00) Brussels, Copenhagen, Madrid, Paris</SelectItem>
                            <SelectItem value="europe/sarajevo">(GMT+01:00) Sarajevo, Skopje, Warsaw, Zagreb</SelectItem>
                            <SelectItem value="africa/lagos">(GMT+01:00) West Central Africa</SelectItem>
                            <SelectItem value="asia/amman">(GMT+02:00) Amman</SelectItem>
                            <SelectItem value="europe/athens">(GMT+02:00) Athens, Bucharest, Istanbul</SelectItem>
                            <SelectItem value="asia/beirut">(GMT+02:00) Beirut</SelectItem>
                            <SelectItem value="africa/cairo">(GMT+02:00) Cairo</SelectItem>
                            <SelectItem value="africa/harare">(GMT+02:00) Harare, Pretoria</SelectItem>
                            <SelectItem value="europe/helsinki">(GMT+02:00) Helsinki, Kyiv, Riga, Sofia, Tallinn, Vilnius</SelectItem>
                            <SelectItem value="asia/jerusalem">(GMT+02:00) Jerusalem</SelectItem>
                            <SelectItem value="europe/minsk">(GMT+02:00) Minsk</SelectItem>
                            <SelectItem value="africa/windhoek">(GMT+02:00) Windhoek</SelectItem>
                            <SelectItem value="asia/kuwait">(GMT+03:00) Kuwait, Riyadh</SelectItem>
                            <SelectItem value="europe/moscow">(GMT+03:00) Moscow, St. Petersburg, Volgograd</SelectItem>
                            <SelectItem value="africa/nairobi">(GMT+03:00) Nairobi</SelectItem>
                            <SelectItem value="asia/tbilisi">(GMT+03:00) Tbilisi</SelectItem>
                            <SelectItem value="asia/tehran">(GMT+03:30) Tehran</SelectItem>
                            <SelectItem value="asia/muscat">(GMT+04:00) Abu Dhabi, Muscat</SelectItem>
                            <SelectItem value="asia/baku">(GMT+04:00) Baku</SelectItem>
                            <SelectItem value="asia/yerevan">(GMT+04:00) Yerevan</SelectItem>
                            <SelectItem value="asia/kabul">(GMT+04:30) Kabul</SelectItem>
                            <SelectItem value="asia/karachi">(GMT+05:00) Islamabad, Karachi, Tashkent</SelectItem>
                            <SelectItem value="asia/kolkata">(GMT+05:30) Chennai, Kolkata, Mumbai, New Delhi</SelectItem>
                            <SelectItem value="asia/kathmandu">(GMT+05:45) Kathmandu</SelectItem>
                            <SelectItem value="asia/almaty">(GMT+06:00) Almaty, Novosibirsk</SelectItem>
                            <SelectItem value="asia/dhaka">(GMT+06:00) Astana, Dhaka</SelectItem>
                            <SelectItem value="asia/rangoon">(GMT+06:30) Yangon (Rangoon)</SelectItem>
                            <SelectItem value="asia/bangkok">(GMT+07:00) Bangkok, Hanoi, Jakarta</SelectItem>
                            <SelectItem value="asia/krasnoyarsk">(GMT+07:00) Krasnoyarsk</SelectItem>
                            <SelectItem value="asia/hong_kong">(GMT+08:00) Beijing, Chongqing, Hong Kong, Urumqi</SelectItem>
                            <SelectItem value="asia/kuala_lumpur">(GMT+08:00) Kuala Lumpur, Singapore</SelectItem>
                            <SelectItem value="asia/irkutsk">(GMT+08:00) Irkutsk, Ulaan Bataar</SelectItem>
                            <SelectItem value="australia/perth">(GMT+08:00) Perth</SelectItem>
                            <SelectItem value="asia/taipei">(GMT+08:00) Taipei</SelectItem>
                            <SelectItem value="asia/tokyo">(GMT+09:00) Osaka, Sapporo, Tokyo</SelectItem>
                            <SelectItem value="asia/seoul">(GMT+09:00) Seoul</SelectItem>
                            <SelectItem value="asia/yakutsk">(GMT+09:00) Yakutsk</SelectItem>
                            <SelectItem value="australia/adelaide">(GMT+09:30) Adelaide</SelectItem>
                            <SelectItem value="australia/darwin">(GMT+09:30) Darwin</SelectItem>
                            <SelectItem value="australia/brisbane">(GMT+10:00) Brisbane</SelectItem>
                            <SelectItem value="australia/canberra">(GMT+10:00) Canberra, Melbourne, Sydney</SelectItem>
                            <SelectItem value="australia/hobart">(GMT+10:00) Hobart</SelectItem>
                            <SelectItem value="pacific/guam">(GMT+10:00) Guam, Port Moresby</SelectItem>
                            <SelectItem value="asia/vladivostok">(GMT+10:00) Vladivostok</SelectItem>
                            <SelectItem value="asia/magadan">(GMT+11:00) Magadan, Solomon Is., New Caledonia</SelectItem>
                            <SelectItem value="pacific/auckland">(GMT+12:00) Auckland, Wellington</SelectItem>
                            <SelectItem value="pacific/fiji">(GMT+12:00) Fiji, Kamchatka, Marshall Is.</SelectItem>
                            <SelectItem value="pacific/tongatapu">(GMT+13:00) Nuku'alofa</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </CardContent>
            <CardFooter className="border-t px-6 py-4">
                <Button>Save Preferences</Button>
            </CardFooter>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle className="font-headline">Notifications</CardTitle>
                <CardDescription>
                    Manage how you receive notifications from the app.
                </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
                <div className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
                    <div className="space-y-0.5">
                        <Label>Email Notifications</Label>
                        <p className="text-xs text-muted-foreground">
                            Receive emails about new comments and mentions.
                        </p>
                    </div>
                    <Switch />
                </div>
                <div className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
                    <div className="space-y-0.5">
                        <Label>Weekly Digest</Label>
                        <p className="text-xs text-muted-foreground">
                            Get a summary of your site's activity once a week.
                        </p>
                    </div>
                    <Switch />
                </div>
            </CardContent>
             <CardFooter className="border-t px-6 py-4">
                <Button>Save Notifications</Button>
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
