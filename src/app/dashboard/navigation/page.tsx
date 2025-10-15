'use client';

import { useState } from 'react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import {
  collection,
  doc,
  writeBatch,
  query,
  where,
  orderBy,
} from 'firebase/firestore';
import {
  addDocumentNonBlocking,
  deleteDocumentNonBlocking,
  setDocumentNonBlocking,
} from '@/firebase/non-blocking-updates';
import { PageHeader } from '@/components/page-header';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Plus, Trash2, Edit } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  SheetClose,
} from '@/components/ui/sheet';

type NavigationMenu = {
  id: string;
  name: string;
};

type NavigationMenuItem = {
  id: string;
  menuId: string;
  label: string;
  url: string;
  order: number;
};

function MenuItemsManager({
  menu,
  onDeleteMenu,
}: {
  menu: NavigationMenu;
  onDeleteMenu: (menuId: string) => void;
}) {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [editingItem, setEditingItem] = useState<
    Partial<NavigationMenuItem> | {}
  >({});
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const menuItemsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(
      collection(firestore, 'navigation_menu_items'),
      where('menuId', '==', menu.id),
      orderBy('order', 'asc')
    );
  }, [firestore, menu.id]);

  const { data: menuItems, isLoading } =
    useCollection<NavigationMenuItem>(menuItemsQuery);

  const handleEditClick = (item: NavigationMenuItem) => {
    setEditingItem(item);
    setIsSheetOpen(true);
  };

  const handleAddNewClick = () => {
    setEditingItem({});
    setIsSheetOpen(true);
  };

  const handleSaveItem = async () => {
    if (!firestore) return;
    const itemToSave = editingItem as Partial<NavigationMenuItem>;

    if (!itemToSave.label || !itemToSave.url) {
      toast({
        variant: 'destructive',
        title: 'Missing fields',
        description: 'Label and URL are required.',
      });
      return;
    }

    try {
      if (itemToSave.id) {
        // Update existing item
        const itemRef = doc(
          firestore,
          'navigation_menu_items',
          itemToSave.id
        );
        await setDocumentNonBlocking(itemRef, { ...itemToSave }, { merge: true });
        toast({ title: 'Item Updated' });
      } else {
        // Add new item
        const newDocRef = collection(firestore, 'navigation_menu_items');
        const order = menuItems ? menuItems.length : 0;
        await addDocumentNonBlocking(newDocRef, {
          ...itemToSave,
          menuId: menu.id,
          order,
        });
        toast({ title: 'Item Added' });
      }
      setIsSheetOpen(false);
      setEditingItem({});
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Save failed',
        description: error.message,
      });
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!firestore) return;
    try {
      const itemRef = doc(firestore, 'navigation_menu_items', itemId);
      await deleteDocumentNonBlocking(itemRef);
      toast({ title: 'Item Deleted' });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Delete failed',
        description: error.message,
      });
    }
  };
  
  const handleDeleteMenuWithItems = async () => {
    if(!firestore) return;
    
    if (menuItems && menuItems.length > 0) {
        const batch = writeBatch(firestore);
        menuItems.forEach(item => {
            const itemRef = doc(firestore, 'navigation_menu_items', item.id);
            batch.delete(itemRef);
        });
        await batch.commit();
    }
    onDeleteMenu(menu.id);
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="font-headline text-xl">{menu.name}</CardTitle>
        </div>
        <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleAddNewClick}>
                <Plus className="mr-2 h-4 w-4" /> Add Item
            </Button>
             <Button variant="destructive" size="sm" onClick={handleDeleteMenuWithItems}>
                <Trash2 className="mr-2 h-4 w-4" /> Delete Menu
            </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading && <p>Loading items...</p>}
        <div className="space-y-2">
          {menuItems?.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between rounded-md border p-3"
            >
              <div className="font-medium">
                {item.label}{' '}
                <span className="text-sm text-muted-foreground">
                  ({item.url})
                </span>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => handleEditClick(item)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive"
                  onClick={() => handleDeleteItem(item.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
          {!isLoading && menuItems?.length === 0 && (
            <p className="text-sm text-muted-foreground p-3 text-center">
              No items in this menu yet.
            </p>
          )}
        </div>
        <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>
                { (editingItem as NavigationMenuItem).id ? 'Edit' : 'Add' } Menu Item
              </SheetTitle>
              <SheetDescription>
                Manage the label and URL for this navigation link.
              </SheetDescription>
            </SheetHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="label">Label</Label>
                <Input
                  id="label"
                  value={(editingItem as NavigationMenuItem).label || ''}
                  onChange={(e) =>
                    setEditingItem({ ...editingItem, label: e.target.value })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="url">URL</Label>
                <Input
                  id="url"
                  value={(editingItem as NavigationMenuItem).url || ''}
                  onChange={(e) =>
                    setEditingItem({ ...editingItem, url: e.target.value })
                  }
                />
              </div>
            </div>
            <SheetFooter>
                <SheetClose asChild>
                    <Button variant="outline">Cancel</Button>
                </SheetClose>
                 <Button onClick={handleSaveItem}>Save Changes</Button>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      </CardContent>
    </Card>
  );
}

export default function NavigationPage() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [newMenuName, setNewMenuName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const menusQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'navigation_menus'), orderBy('name'));
  }, [firestore]);

  const { data: menus, isLoading } = useCollection<NavigationMenu>(menusQuery);

  const handleAddMenu = async () => {
    if (!newMenuName.trim() || !firestore) return;

    setIsSubmitting(true);
    try {
      await addDocumentNonBlocking(collection(firestore, 'navigation_menus'), {
        name: newMenuName,
      });
      toast({ title: 'Menu Created', description: `"${newMenuName}" has been added.` });
      setNewMenuName('');
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error creating menu',
        description: error.message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleDeleteMenu = async (menuId: string) => {
    if (!firestore) return;
     try {
      await deleteDocumentNonBlocking(doc(firestore, 'navigation_menus', menuId));
      toast({ title: 'Menu Deleted' });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error deleting menu',
        description: error.message,
      });
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Navigation"
        description="Manage your site's reusable navigation menus."
      />
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Create New Menu</CardTitle>
          </CardHeader>
          <CardContent className="flex gap-2">
            <Input
              placeholder="New Menu Name (e.g., Header Navigation)"
              value={newMenuName}
              onChange={(e) => setNewMenuName(e.target.value)}
              disabled={isSubmitting}
            />
            <Button onClick={handleAddMenu} disabled={isSubmitting || !newMenuName.trim()}>
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Create Menu'
              )}
            </Button>
          </CardContent>
        </Card>

        {isLoading && <p>Loading menus...</p>}
        
        <div className='space-y-4'>
            {menus?.map((menu) => (
                <MenuItemsManager key={menu.id} menu={menu} onDeleteMenu={handleDeleteMenu} />
            ))}
        </div>

        {!isLoading && menus?.length === 0 && (
            <Card>
                <CardContent className="p-8 text-center text-muted-foreground">
                    You haven't created any menus yet.
                </CardContent>
            </Card>
        )}
      </div>
    </div>
  );
}
