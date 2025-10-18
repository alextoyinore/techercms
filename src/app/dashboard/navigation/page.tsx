'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
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
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Plus, Trash2, Edit, GripVertical } from 'lucide-react';
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
import { DndContext, closestCenter, DragEndEvent, useSensor, useSensors, PointerSensor } from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { cn } from '@/lib/utils';


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
  parentId?: string;
  type: 'custom' | 'page' | 'category';
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

type MenuItemWithChildren = NavigationMenuItem & { children: MenuItemWithChildren[] };


const SortableMenuItem = ({ item, onEdit, onDelete, level = 0 }: { item: MenuItemWithChildren, onEdit: (item: NavigationMenuItem) => void, onDelete: (itemId: string) => void, level?: number }) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });
    const style = { transform: CSS.Transform.toString(transform), transition };
  
    return (
      <div ref={setNodeRef} style={style} className={cn('relative', isDragging && 'opacity-50 z-10')}>
        <div className="flex items-center bg-card border rounded-md" style={{ marginLeft: `${level * 2}rem` }}>
          <div {...attributes} {...listeners} className="p-2 cursor-grab touch-none">
            <GripVertical className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="flex-grow font-medium text-sm p-2">{item.label}</div>
          <div className="flex gap-1 p-1">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEdit(item)}>
              <Edit className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => onDelete(item.id)}>
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
        {item.children.length > 0 && (
          <div className="mt-1">
            {item.children.map(child => (
              <SortableMenuItem key={child.id} item={child} onEdit={onEdit} onDelete={onDelete} level={level + 1} />
            ))}
          </div>
        )}
      </div>
    );
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
    
  const [localMenuItems, setLocalMenuItems] = useState<NavigationMenuItem[]>([]);
  useEffect(() => {
    if(menuItems) {
      setLocalMenuItems(menuItems);
    }
  }, [menuItems]);


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

  const menuTree = useMemo(() => {
    if (!localMenuItems) return [];
    const itemsMap = new Map<string, MenuItemWithChildren>();
    const roots: MenuItemWithChildren[] = [];

    localMenuItems.forEach(item => {
      itemsMap.set(item.id, { ...item, children: [] });
    });

    localMenuItems.forEach(item => {
      const currentItem = itemsMap.get(item.id);
      if (!currentItem) return;

      if (item.parentId && itemsMap.has(item.parentId)) {
        const parentItem = itemsMap.get(item.parentId);
        parentItem?.children.push(currentItem);
      } else {
        roots.push(currentItem);
      }
    });

    itemsMap.forEach(item => {
        item.children.sort((a,b) => a.order - b.order);
    });

    return roots.sort((a,b) => a.order - b.order);
  }, [localMenuItems]);

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
  
  const getOrderForNewItem = (parentId?: string) => {
    if (!localMenuItems) return 0;
    const siblings = localMenuItems.filter(item => item.parentId === parentId);
    return siblings.length;
  }

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
        const order = getOrderForNewItem(itemToSave.parentId);
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
    if (!firestore || !localMenuItems) return;
    try {
      const batch = writeBatch(firestore);
      const itemsToDelete = [itemId];
      const childrenStack = localMenuItems.filter(item => item.parentId === itemId).map(i => i.id);

      while(childrenStack.length > 0) {
        const currentId = childrenStack.pop()!;
        itemsToDelete.push(currentId);
        const children = localMenuItems.filter(item => item.parentId === currentId).map(i => i.id);
        childrenStack.push(...children);
      }

      itemsToDelete.forEach(id => {
        batch.delete(doc(firestore, 'navigation_menu_items', id));
      });
      
      await batch.commit();
      toast({ title: 'Item and sub-items Deleted' });
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

    if (localMenuItems && localMenuItems.length > 0) {
      const batch = writeBatch(firestore);
      localMenuItems.forEach(item => {
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
        type: 'page',
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
        type: 'category'
      });
    }
  };
  
  const sensors = useSensors(useSensor(PointerSensor, {
    activationConstraint: {
        distance: 8,
    },
  }));

  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id || !localMenuItems) return;

    setLocalMenuItems((items) => {
        const oldIndex = items.findIndex(item => item.id === active.id);
        const newIndex = items.findIndex(item => item.id === over.id);

        if (oldIndex === -1 || newIndex === -1) return items;

        const newOrder = arrayMove(items, oldIndex, newIndex);

        // Batch updates to Firestore
        const batch = writeBatch(firestore);
        newOrder.forEach((item, index) => {
            const itemRef = doc(firestore, 'navigation_menu_items', item.id);
            if (item.order !== index) {
                batch.update(itemRef, { order: index });
            }
        });

        batch.commit().then(() => {
            toast({ title: "Menu reordered" });
        }).catch(error => {
            toast({ variant: 'destructive', title: 'Reorder failed', description: error.message });
            // Revert local state on error
            setLocalMenuItems(menuItems || []);
        });

        return newOrder;
    });

  }, [localMenuItems, firestore, toast, menuItems]);

  return (
    <div>
        <div className="flex items-center justify-between mb-2">
             <Button variant="outline" size="sm" onClick={handleAddNewClick}>
                <Plus className="mr-2 h-4 w-4" /> Add Item
             </Button>
             <Button
                variant="ghost"
                size="sm"
                className="text-destructive hover:text-destructive"
                onClick={handleDeleteMenuWithItems}
             >
                <Trash2 className="mr-2 h-4 w-4" /> Delete Menu
             </Button>
        </div>
        <div className="space-y-1">
          {isLoading && <p className="text-sm text-center text-muted-foreground p-4">Loading items...</p>}
          
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={localMenuItems?.map(i => i.id) || []} strategy={verticalListSortingStrategy}>
              {menuTree.map(item => (
                <SortableMenuItem key={item.id} item={item} onEdit={handleEditClick} onDelete={handleDeleteItem} />
              ))}
            </SortableContext>
          </DndContext>
          
          {!isLoading && menuTree.length === 0 && (
            <p className="text-sm text-muted-foreground p-3 text-center border rounded-md">
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
                      setEditingItem({ ...editingItem, url: e.target.value, type: 'custom' })
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
    </div>
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
    const newAssignments = { ...assignments, [locationId]: menuId === 'none' ? '' : menuId };
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
         <div className="lg:col-span-2 space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Manage Menus</CardTitle>
                    <CardDescription>Create a new menu or edit an existing one below.</CardDescription>
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
                            'Create Menu'
                        )}
                    </Button>
                </CardContent>
                <div className="px-6 pb-6">
                    {isLoading && <p className="text-sm text-muted-foreground text-center">Loading menus...</p>}
                    {!isLoading && menus && menus.length > 0 && (
                        <Accordion type="single" collapsible className="w-full">
                            {menus.map(menu => (
                                <AccordionItem value={menu.id} key={menu.id}>
                                    <AccordionTrigger>{menu.name}</AccordionTrigger>
                                    <AccordionContent>
                                        <MenuItemsManager
                                            menu={menu}
                                            onDeleteMenu={handleDeleteMenu}
                                        />
                                    </AccordionContent>
                                </AccordionItem>
                            ))}
                        </Accordion>
                    )}
                    {!isLoading && (!menus || menus.length === 0) && (
                        <p className="text-sm text-muted-foreground text-center p-4 border rounded-md">No menus created yet.</p>
                    )}
                </div>
            </Card>
        </div>

        <div className="lg:col-span-1">
            <Card>
                <CardHeader>
                    <CardTitle>Menu Locations</CardTitle>
                    <CardDescription>Assign menus to specific locations in your theme.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {menuLocations.map(location => (
                        <div key={location.id} className="grid items-center gap-2">
                            <div>
                                <Label htmlFor={`location-${location.id}`} className="font-medium">{location.name}</Label>
                                <p className="text-xs text-muted-foreground">Theme: {location.theme}</p>
                            </div>
                            <Select
                                value={assignments[location.id] || 'none'}
                                onValueChange={(menuId) => handleAssignmentChange(location.id, menuId)}
                                disabled={isLoading || isLoadingSettings}
                            >
                                <SelectTrigger id={`location-${location.id}`}>
                                    <SelectValue placeholder="Select a menu..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">-- None --</SelectItem>
                                    <Separator />
                                    {menus?.map(menu => (
                                        <SelectItem key={menu.id} value={menu.id}>{menu.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    ))}
                     {!isLoadingSettings && menuLocations.length === 0 && (
                        <p className="text-sm text-center text-muted-foreground p-4">No menu locations defined by your themes.</p>
                    )}
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}
