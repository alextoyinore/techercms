'use client';
import { useFirestore, useCollection, useDoc, useMemoFirebase } from '@/firebase';
import { collection, query, where, doc, orderBy } from 'firebase/firestore';
import { useMemo } from 'react';
import Link from 'next/link';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu"
import { cn } from '@/lib/utils';
import React from 'react';

type NavigationMenuItemData = {
  id: string;
  menuId: string;
  label: string;
  url: string;
  order: number;
  parentId?: string;
  type: 'custom' | 'page' | 'category';
  objectId?: string;
  target?: '_self' | '_blank';
};

type MenuItemWithChildren = NavigationMenuItemData & {
  children: MenuItemWithChildren[];
};

type SiteSettings = {
  menuAssignments?: Record<string, string>;
};

type MenuProps = {
  locationId: string;
  className?: string;
  linkClassName?: string;
  orientation?: "vertical" | "horizontal";
};

const ListItem = React.forwardRef<
  React.ElementRef<"a">,
  React.ComponentPropsWithoutRef<"a">
>(({ className, title, children, ...props }, ref) => {
  return (
    <li>
      <NavigationMenuLink asChild>
        <a
          ref={ref}
          className={cn(
            "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
            className
          )}
          {...props}
        >
          <div className="text-sm font-medium leading-none">{title}</div>
          <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
            {children}
          </p>
        </a>
      </NavigationMenuLink>
    </li>
  )
})
ListItem.displayName = "ListItem"


const RecursiveNavItem = ({ item, linkClassName }: { item: MenuItemWithChildren, linkClassName?: string }) => {
    if (item.children.length > 0) {
        return (
            <NavigationMenuItem>
                <NavigationMenuTrigger className={cn(navigationMenuTriggerStyle(), 'bg-transparent', linkClassName)}>{item.label}</NavigationMenuTrigger>
                <NavigationMenuContent>
                    <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px] ">
                        {item.children.map(child => (
                           <ListItem key={child.id} href={child.url} title={child.label}>
                           </ListItem>
                        ))}
                    </ul>
                </NavigationMenuContent>
            </NavigationMenuItem>
        );
    }

    return (
        <NavigationMenuItem>
            <Link href={item.url} legacyBehavior passHref>
                <NavigationMenuLink className={cn(navigationMenuTriggerStyle(), 'bg-transparent', linkClassName)}>
                    {item.label}
                </NavigationMenuLink>
            </Link>
        </NavigationMenuItem>
    );
};


export function Menu({ locationId, className, linkClassName, orientation = "horizontal" }: MenuProps) {
  const firestore = useFirestore();

  const settingsRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, 'site_settings', 'config');
  }, [firestore]);

  const { data: settings, isLoading: isLoadingSettings } = useDoc<SiteSettings>(settingsRef);
  
  const assignedMenuId = useMemo(() => {
    return settings?.menuAssignments?.[locationId];
  }, [settings, locationId]);

  const menuItemsQuery = useMemoFirebase(() => {
    if (!firestore || !assignedMenuId) return null;
    return query(
      collection(firestore, 'navigation_menu_items'),
      where('menuId', '==', assignedMenuId)
    );
  }, [firestore, assignedMenuId]);

  const { data: menuItems, isLoading: isLoadingItems } = useCollection<NavigationMenuItemData>(menuItemsQuery);

  const menuTree = useMemo(() => {
    if (!menuItems) return [];
    const itemsMap = new Map<string, MenuItemWithChildren>();
    const roots: MenuItemWithChildren[] = [];

    menuItems.forEach(item => {
      itemsMap.set(item.id, { ...item, children: [] });
    });

    menuItems.forEach(item => {
      const currentItem = itemsMap.get(item.id);
      if (!currentItem) return;

      if (item.parentId && itemsMap.has(item.parentId)) {
        const parentItem = itemsMap.get(item.parentId);
        parentItem?.children.push(currentItem);
      } else {
        roots.push(currentItem);
      }
    });

    // Sort children for each item
    itemsMap.forEach(item => {
        item.children.sort((a,b) => a.order - b.order);
    });

    return roots.sort((a,b) => a.order - b.order);
  }, [menuItems]);

  if (isLoadingSettings || (assignedMenuId && isLoadingItems)) {
    return <div className={className}><span className="text-sm text-muted-foreground">Loading Menu...</span></div>;
  }

  if (!assignedMenuId || !menuTree || menuTree.length === 0) {
    return null;
  }
  
  return (
    <NavigationMenu orientation={orientation} className={className}>
        <NavigationMenuList className={cn(orientation === 'vertical' && 'flex-col items-stretch space-x-0')}>
            {menuTree.map(item => (
                <RecursiveNavItem key={item.id} item={item} linkClassName={linkClassName} />
            ))}
        </NavigationMenuList>
    </NavigationMenu>
  );
}

  