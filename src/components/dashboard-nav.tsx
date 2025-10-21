
'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard,
    FileText,
    ImageIcon,
    Folder,
    Tag,
    Paintbrush,
    Sparkles,
    Settings,
    Gem,
    File,
    LayoutTemplate,
    Menu,
    LayoutGrid,
    Users,
    User as UserIcon,
} from "lucide-react";
import {
    SidebarMenu,
    SidebarMenuItem,
    SidebarMenuButton,
} from "@/components/ui/sidebar";
import type { User as FirebaseUser } from "firebase/auth";
import { useDoc, useMemoFirebase, useFirestore } from "@/firebase";
import { doc } from "firebase/firestore";

type UserRole = {
    role: 'superuser' | 'writer' | string;
};


const navItems = [
    { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard", requiredRole: null },
    { href: "/dashboard/pages", icon: File, label: "Pages", requiredRole: null },
    { href: "/dashboard/posts", icon: FileText, label: "Posts", requiredRole: null },
    { href: "/dashboard/media", icon: ImageIcon, label: "Media", requiredRole: null },
    { href: "/dashboard/categories", icon: Folder, label: "Categories", requiredRole: null },
    { href: "/dashboard/tags", icon: Tag, label: "Tags", requiredRole: null },
    { href: "/dashboard/themes", icon: Paintbrush, label: "Themes", requiredRole: null },
    { href: "/dashboard/layouts", icon: LayoutGrid, label: "Layouts", requiredRole: null },
    { href: "/dashboard/widgets", icon: LayoutTemplate, label: "Widgets", requiredRole: null },
    { href: "/dashboard/navigation", icon: Menu, label: "Navigation", requiredRole: null },
    { href: "/dashboard/seo-analyzer", icon: Sparkles, label: "SEO Analyzer", requiredRole: null },
    { href: "/dashboard/users", icon: Users, label: "Users", requiredRole: 'superuser' },
    { href: "/dashboard/profile", icon: UserIcon, label: "Profile", requiredRole: null },
    { href: "/dashboard/settings", icon: Settings, label: "Settings", requiredRole: null },
];

export function DashboardNav({ user }: { user: FirebaseUser | null }) {
    const pathname = usePathname();
    const firestore = useFirestore();

    const userRef = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        return doc(firestore, 'users', user.uid);
    }, [firestore, user]);

    const { data: userData } = useDoc<UserRole>(userRef);
    const userRole = userData?.role;

    return (
        <div className="flex flex-col h-full">
            <div className="p-2 md:px-4 md:py-6 flex items-center justify-between">
                <Link href="/dashboard" className="flex items-center gap-2 group-data-[state=collapsed]:justify-center">
                    <Gem className="w-6 h-6 text-primary" />
                    <span className="text-lg font-headline font-bold text-sidebar-foreground group-data-[state=collapsed]:hidden">
                        Techer CMS
                    </span>
                </Link>
            </div>

            <div className="flex-1 overflow-y-auto">
                <SidebarMenu className="px-2 md:px-4">
                    {navItems.map((item) => {
                        if (item.requiredRole && item.requiredRole !== userRole) {
                            return null;
                        }
                        return (
                            <SidebarMenuItem key={item.href}>
                                <SidebarMenuButton
                                    asChild
                                    size="lg"
                                    isActive={pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href))}
                                    className="w-full justify-start group-data-[state=collapsed]:justify-center text-base font-semibold md:text-sm md:font-medium"
                                    tooltip={item.label}
                                >
                                    <Link href={item.href}>
                                        <item.icon className="h-5 w-5 md:h-4 md:w-4" />
                                        <span className="group-data-[state=collapsed]:hidden">{item.label}</span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        )
                    })}
                </SidebarMenu>
            </div>
        </div>
    );
}
