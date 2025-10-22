
'use client';
import { useFirestore, useCollection, useDoc, useMemoFirebase } from '@/firebase';
import { collection, query, where, doc, orderBy } from 'firebase/firestore';
import { useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { cn } from '@/lib/utils';
import React from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from './ui/button';
import { ChevronDown } from 'lucide-react';

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

const RecursiveNavItem = ({ item, linkClassName }: { item: MenuItemWithChildren, linkClassName?: string }) => {
    const pathname = usePathname();
    const isActive = pathname === item.url;

    if (item.children.length > 0) {
        return (
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className={cn('h-auto p-0 hover:bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0', linkClassName)} data-active={isActive}>
                        {item.label}
                        <ChevronDown className="relative top-[1px] ml-1 h-3 w-3 transition duration-200 group-data-[state=open]:rotate-180" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                    {item.children.map(child => (
                        <DropdownMenuItem key={child.id} asChild>
                            <Link href={child.url} className={cn("cursor-pointer", pathname === child.url && "font-semibold text-primary")}>
                                {child.label}
                            </Link>
                        </DropdownMenuItem>
                    ))}
                </DropdownMenuContent>
            </DropdownMenu>
        );
    }

    return (
        <Link href={item.url} className={cn(linkClassName, isActive && "font-bold text-primary")}>
            {item.label}
        </Link>
    );
};

const MobileRecursiveNavItem = ({ item, linkClassName }: { item: MenuItemWithChildren, linkClassName?: string }) => {
    const pathname = usePathname();
    const isActive = pathname === item.url;
  if (item.children.length > 0) {
    return (
      <AccordionItem value={item.id} className="border-b-0">
        <AccordionTrigger className={cn("py-2 hover:no-underline", linkClassName)}>{item.label}</AccordionTrigger>
        <AccordionContent className="pl-4">
          <div className="flex flex-col space-y-2">
            {item.children.map(child => (
              <Link key={child.id} href={child.url} className={cn("text-lg text-foreground/80", linkClassName, pathname === child.url && "text-primary font-semibold")}>
                {child.label}
              </Link>
            ))}
          </div>
        </AccordionContent>
      </AccordionItem>
    );
  }

  return (
    <div>
      <Link href={item.url} className={cn("block py-2", linkClassName, isActive && "text-primary font-semibold")}>
        {item.label}
      </Link>
    </div>
  );
};


export function Menu({ locationId, className, linkClassName, orientation = "horizontal" }: MenuProps) {
  const firestore = useFirestore();
  const isMobile = useIsMobile();

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
  
  if (isMobile) {
    return (
      <Accordion type="multiple" className={cn("w-full", className)}>
        {menuTree.map(item => (
          <MobileRecursiveNavItem key={item.id} item={item} linkClassName={linkClassName} />
        ))}
      </Accordion>
    )
  }

  return (
    <div className={cn("flex", orientation === 'horizontal' ? 'items-center' : 'flex-col items-stretch', className)}>
        {menuTree.map(item => (
            <RecursiveNavItem key={item.id} item={item} linkClassName={linkClassName} />
        ))}
    </div>
  );
}
