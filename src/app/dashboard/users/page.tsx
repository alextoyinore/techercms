'use client';

import { useState, useMemo } from 'react';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { PlusCircle, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { useAuth, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc, setDoc } from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { setDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useAuthState } from 'react-firebase-hooks/auth';
import { useRouter } from 'next/navigation';

type User = {
  id: string;
  displayName?: string;
  email: string;
  photoURL?: string;
  role: 'superuser' | 'writer' | 'editor' | 'subscriber';
};

const availableRoles: User['role'][] = ['writer', 'editor', 'subscriber', 'superuser'];

export default function UsersPage() {
  const { toast } = useToast();
  const auth = useAuth();
  const firestore = useFirestore();
  const [currentUser] = useAuthState(auth);
  const router = useRouter();

  const [isNewUserDialogOpen, setIsNewUserDialogOpen] = useState(false);
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<User['role']>('writer');

  const usersCollection = useMemoFirebase(() => collection(firestore, 'users'), [firestore]);
  const { data: users, isLoading: isLoadingUsers } = useCollection<User>(usersCollection);
  
  const currentUserRoleQuery = useMemoFirebase(() => {
    if (!firestore || !currentUser) return null;
    return doc(firestore, 'users', currentUser.uid);
  }, [firestore, currentUser]);
  
  const { data: currentUserData } = useCollection<User>(currentUserRoleQuery as any);

  if (currentUserData && (currentUserData as any).role !== 'superuser') {
    router.push('/dashboard');
    return null;
  }

  const handleCreateUser = async () => {
    if (!newEmail || !newPassword) {
      toast({ variant: 'destructive', title: 'Missing fields' });
      return;
    }
    setIsCreatingUser(true);
    try {
      // This is a temporary auth instance.
      const tempAuth = auth;
      const userCredential = await createUserWithEmailAndPassword(tempAuth, newEmail, newPassword);
      const newUser = userCredential.user;

      await setDoc(doc(firestore, 'users', newUser.uid), {
        email: newUser.email,
        role: newRole,
        displayName: '',
        photoURL: '',
      });

      toast({ title: 'User Created', description: 'The new user account has been successfully created.' });
      setIsNewUserDialogOpen(false);
      setNewEmail('');
      setNewPassword('');
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error creating user', description: error.message });
    } finally {
      setIsCreatingUser(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: User['role']) => {
    const userRef = doc(firestore, 'users', userId);
    setDocumentNonBlocking(userRef, { role: newRole }, { merge: true });
    toast({ title: 'Role Updated', description: "The user's role has been updated." });
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Users" description="Manage user accounts and roles.">
        <Dialog open={isNewUserDialogOpen} onOpenChange={setIsNewUserDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              New User
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New User</DialogTitle>
              <DialogDescription>
                Create a new user account and assign them a role. They will be sent an invitation to set their password.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="role">Role</Label>
                <Select value={newRole} onValueChange={(value) => setNewRole(value as User['role'])}>
                  <SelectTrigger id="role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {availableRoles.map((role) => (
                      <SelectItem key={role} value={role} className="capitalize">
                        {role}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
              <Button onClick={handleCreateUser} disabled={isCreatingUser}>
                {isCreatingUser && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create User
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </PageHeader>
      <div className="border rounded-lg w-full">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoadingUsers && (
              <TableRow>
                <TableCell colSpan={3} className="text-center">Loading users...</TableCell>
              </TableRow>
            )}
            {users?.map((user) => (
              <TableRow key={user.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.photoURL} />
                      <AvatarFallback>{user.displayName?.charAt(0) || user.email.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <span className="font-medium">{user.displayName || 'No Name'}</span>
                  </div>
                </TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                    <Select 
                        value={user.role} 
                        onValueChange={(value) => handleRoleChange(user.id, value as User['role'])}
                        disabled={user.id === currentUser?.uid}
                    >
                        <SelectTrigger className="w-32">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {availableRoles.map((role) => (
                                <SelectItem key={role} value={role} className="capitalize">{role}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
