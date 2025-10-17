'use client';

import { useState, useMemo, useEffect } from 'react';
import { useFirestore, useCollection, useDoc, useMemoFirebase } from '@/firebase';
import {
  collection,
  doc,
  writeBatch,
  query,
  where,
  orderBy,
  setDoc,
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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { menuLocations } from '@/lib/menu-locations';
import { Separator } from '@/components/ui/separator';

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

type Page = {
  id: string;
  title: string;
  slug: string;
};

type Category = {
  id: string;
  name: string;
  slug: string;
};

type SiteSettings = {
    menuAssignments?: Record<string, string>;
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
  const [linkType, setLinkType] = useState<'custom' | 'page' | 'category'>(
    'custom'
  );

  const menuItemsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(
      collection(firestore, 'navigation_menu_items'),
      where('menuId', '==', menu.id)
    );
  }, [firestore, menu.id]);

  const { data: menuItems, isLoading } =
    useCollection<NavigationMenuItem>(menuItemsQuery);

  const pagesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(
      collection(firestore, 'pages'),
      where('status', '==', 'published')
    );
  }, [firestore]);
  const { data: pages, isLoading: isLoadingPages } =
    useCollection<Page>(pagesQuery);

  const categoriesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'categories'));
  }, [firestore]);
  const { data: categories, isLoading: isLoadingCategories } =
    useCollection<Category>(categoriesQuery);

  const sortedMenuItems = useMemo(() => {
    if (!menuItems) return [];
    return [...menuItems].sort((a, b) => a.order - b.order);
  }, [menuItems]);

  useEffect(() => {
    if (isSheetOpen && (editingItem as NavigationMenuItem).id) {
      const url = (editingItem as NavigationMenuItem).url;
      if (url?.startsWith('/category/')) {
        setLinkType('category');
      } else if (url?.startsWith('/')) {
        setLinkType('page');
      } else {
        setLinkType('custom');
      }
    } else {
      setLinkType('custom');
    }
  }, [isSheetOpen, editingItem]);

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
        const itemRef = doc(
          firestore,
          'navigation_menu_items',
          itemToSave.id
        );
        await setDocumentNonBlocking(itemRef, { ...itemToSave }, { merge: true });
        toast({ title: 'Item Updated' });
      } else {
        const newDocRef = collection(firestore, 'navigation_menu_items');
        const order = sortedMenuItems ? sortedMenuItems.length : 0;
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
    if (!firestore) return;

    if (sortedMenuItems && sortedMenuItems.length > 0) {
      const batch = writeBatch(firestore);
      sortedMenuItems.forEach(item => {
        const itemRef = doc(firestore, 'navigation_menu_items', item.id);
        batch.delete(itemRef);
      });
      await batch.commit();
    }
    onDeleteMenu(menu.id);
  };

  const handlePageSelect = (slug: string) => {
    const selectedPage = pages?.find(p => p.slug === slug);
    if (selectedPage) {
      setEditingItem({
        ...editingItem,
        url: `/${slug}`,
        label: selectedPage.title,
      });
    }
  };

  const handleCategorySelect = (slug: string) => {
    const selectedCategory = categories?.find(c => c.slug === slug);
    if (selectedCategory) {
      setEditingItem({
        ...editingItem,
        url: `/category/${slug}`,
        label: selectedCategory.name,
      });
    }
  };

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
          <Button
            variant="destructive"
            size="sm"
            onClick={handleDeleteMenuWithItems}
          >
            <Trash2 className="mr-2 h-4 w-4" /> Delete Menu
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading && <p>Loading items...</p>}
        <div className="space-y-2">
          {sortedMenuItems?.map(item => (
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
          {!isLoading && sortedMenuItems?.length === 0 && (
            <p className="text-sm text-muted-foreground p-3 text-center">
              No items in this menu yet.
            </p>
          )}
        </div>
        <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
          <SheetContent className="flex flex-col">
            <SheetHeader>
              <SheetTitle>
                {(editingItem as NavigationMenuItem).id ? 'Edit' : 'Add'} Menu Item
              </SheetTitle>
              <SheetDescription>
                Configure the link for your navigation menu.
              </SheetDescription>
            </SheetHeader>
            <div className="flex-1 grid gap-6 py-4 overflow-y-auto px-1">
              <RadioGroup
                value={linkType}
                onValueChange={value =>
                  setLinkType(value as 'custom' | 'page' | 'category')
                }
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="custom" id="custom" />
                  <Label htmlFor="custom">Custom URL</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="page" id="page" />
                  <Label htmlFor="page">Page</Label>
                </div>
                 <div className="flex items-center space-x-2">
                  <RadioGroupItem value="category" id="category" />
                  <Label htmlFor="category">Category</Label>
                </div>
              </RadioGroup>

              {linkType === 'custom' && (
                <div className="grid gap-2">
                  <Label htmlFor="url">URL</Label>
                  <Input
                    id="url"
                    value={(editingItem as NavigationMenuItem).url || ''}
                    onChange={e =>
                      setEditingItem({ ...editingItem, url: e.target.value })
                    }
                  />
                </div>
              )}
              {linkType === 'page' && (
                <div className="grid gap-2">
                  <Label htmlFor="page-select">Select a Page</Label>
                  <Select
                    onValueChange={handlePageSelect}
                    value={(editingItem as NavigationMenuItem).url?.substring(1)}
                    disabled={isLoadingPages}
                  >
                    <SelectTrigger id="page-select">
                      <SelectValue placeholder="Choose a page..." />
                    </SelectTrigger>
                    <SelectContent>
                      {pages?.map(page => (
                        <SelectItem key={page.id} value={page.slug}>
                          {page.title}
                        </SelectItem>
                      ))}
                      {!isLoadingPages && pages?.length === 0 && (
                        <SelectItem value="no-pages" disabled>
                          No published pages available
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {linkType === 'category' && (
                <div className="grid gap-2">
                  <Label htmlFor="category-select">Select a Category</Label>
                  <Select
                    onValueChange={handleCategorySelect}
                    value={(editingItem as NavigationMenuItem).url?.split('/')[2]}
                    disabled={isLoadingCategories}
                  >
                    <SelectTrigger id="category-select">
                      <SelectValue placeholder="Choose a category..." />
                    </SelectTrigger>
                    <SelectContent>
                      {categories?.map(cat => (
                        <SelectItem key={cat.id} value={cat.slug}>
                          {cat.name}
                        </SelectItem>
                      ))}
                      {!isLoadingCategories && categories?.length === 0 && (
                        <SelectItem value="no-categories" disabled>
                          No categories available
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="grid gap-2">
                <Label htmlFor="label">Label</Label>
                <Input
                  id="label"
                  value={(editingItem as NavigationMenuItem).label || ''}
                  onChange={e =>
                    setEditingItem({ ...editingItem, label: e.target.value })
                  }
                  placeholder="The text to display"
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

  const settingsRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, 'site_settings', 'config');
  }, [firestore]);

  const { data: menus, isLoading } = useCollection<NavigationMenu>(menusQuery);
  const { data: settings, isLoading: isLoadingSettings } = useDoc<SiteSettings>(settingsRef);
  
  const [assignments, setAssignments] = useState<Record<string, string>>({});

  useEffect(() => {
    if (settings?.menuAssignments) {
        setAssignments(settings.menuAssignments);
    }
  }, [settings]);

  const handleAddMenu = async () => {
    if (!newMenuName.trim() || !firestore) return;

    setIsSubmitting(true);
    try {
      await addDocumentNonBlocking(collection(firestore, 'navigation_menus'), {
        name: newMenuName,
      });
      toast({
        title: 'Menu Created',
        description: `"${newMenuName}" has been added.`,
      });
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
  };

  const handleAssignmentChange = async (locationId: string, menuId: string) => {
    if (!settingsRef) return;
    const newAssignments = { ...assignments, [locationId]: menuId };
    setAssignments(newAssignments); // Optimistic update
    try {
      await setDoc(settingsRef, { menuAssignments: newAssignments }, { merge: true });
       toast({ title: 'Menu Location Updated' });
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Error Saving', description: error.message });
        setAssignments(settings?.menuAssignments || {}); // Revert on error
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Navigation"
        description="Manage your site's reusable navigation menus and their locations."
      />
      <div className="grid gap-6">
         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
                <CardHeader>
                    <CardTitle>Menu Locations</CardTitle>
                    <CardDescription>Assign menus to specific locations in your theme.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {menuLocations.map(location => (
                        <div key={location.id} className="grid grid-cols-2 items-center gap-4">
                            <div>
                                <Label htmlFor={`location-${location.id}`} className="font-medium">{location.name}</Label>
                                <p className="text-xs text-muted-foreground">Theme: {location.theme}</p>
                            </div>
                            <Select
                                value={assignments[location.id] || ''}
                                onValueChange={(menuId) => handleAssignmentChange(location.id, menuId)}
                                disabled={isLoading || isLoadingSettings}
                            >
                                <SelectTrigger id={`location-${location.id}`}>
                                    <SelectValue placeholder="Select a menu..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="">-- None --</SelectItem>
                                    <Separator />
                                    {menus?.map(menu => (
                                        <SelectItem key={menu.id} value={menu.id}>{menu.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    ))}
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>Create New Menu</CardTitle>
                </CardHeader>
                <CardContent className="flex gap-2">
                    <Input
                    placeholder="New Menu Name"
                    value={newMenuName}
                    onChange={e => setNewMenuName(e.target.value)}
                    disabled={isSubmitting}
                    />
                    <Button
                    onClick={handleAddMenu}
                    disabled={isSubmitting || !newMenuName.trim()}
                    >
                    {isSubmitting ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        'Create'
                    )}
                    </Button>
                </CardContent>
            </Card>
        </div>


        {isLoading && <p>Loading menus...</p>}

        <div className="space-y-4">
          {menus?.map(menu => (
            <MenuItemsManager
              key={menu.id}
              menu={menu}
              onDeleteMenu={handleDeleteMenu}
            />
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
