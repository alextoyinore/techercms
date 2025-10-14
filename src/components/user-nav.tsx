'use client';

import {Avatar, AvatarFallback, AvatarImage} from '@/components/ui/avatar';
import {Button} from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {LogOut, Settings, User} from 'lucide-react';
import Link from 'next/link';
import {User as FirebaseUser} from 'firebase/auth';
import {sessionLogout} from '@/app/actions';
import {useRouter} from 'next/navigation';

function getAvatar(user: FirebaseUser) {
  if (user.photoURL) {
    return user.photoURL;
  }
  return 'https://i.pravatar.cc/150?u=a042581f4e29026704d';
}
function getName(user: FirebaseUser) {
  if (user.displayName) {
    return user.displayName;
  }
  return 'User';
}

function getEmail(user: FirebaseUser) {
  if (user.email) {
    return user.email;
  }
  return '';
}

export function UserNav({user}: {user: FirebaseUser | null}) {
  const router = useRouter();
  const handleLogout = async () => {
    await sessionLogout();
    router.push('/');
  };
  if (!user) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="relative h-10 w-full justify-start gap-2 px-2"
        >
          <Avatar className="h-8 w-8">
            <AvatarImage src={getAvatar(user)} alt="@user" />
            <AvatarFallback>U</AvatarFallback>
          </Avatar>
          <div className="flex flex-col items-start_ text-left">
            <p className="text-sm font-medium leading-none">{getName(user)}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {getEmail(user)}
            </p>
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{getName(user)}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {getEmail(user)}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem asChild>
            <Link href="/dashboard/settings">
              <User className="mr-2 h-4 w-4" />
              <span>Profile</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/dashboard/settings">
              <Settings className="mr-2 h-4 w-4" />
              <span>Settings</span>
            </Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
