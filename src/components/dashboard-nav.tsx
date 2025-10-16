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
    User,
    File,
    LayoutTemplate,
    Menu,
    LayoutGrid,
} from "lucide-react";
import {
    SidebarMenu,
    SidebarMenuItem,
    SidebarMenuButton,
} from "@/components/ui/sidebar";
import type { User as FirebaseUser } from "firebase/auth";

const navItems = [
    { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { href: "/dashboard/pages", icon: File, label: "Pages" },
    { href: "/dashboard/posts", icon: FileText, label: "Posts" },
    { href: "/dashboard/media", icon: ImageIcon, label: "Media" },
    { href: "/dashboard/categories", icon: Folder, label: "Categories" },
    { href: "/dashboard/tags", icon: Tag, label: "Tags" },
    { href: "/dashboard/themes", icon: Paintbrush, label: "Themes" },
    { href: "/dashboard/layouts", icon: LayoutGrid, label: "Layouts" },
    { href: "/dashboard/widgets", icon: LayoutTemplate, label: "Widgets" },
    { href: "/dashboard/navigation", icon: Menu, label: "Navigation" },
    { href: "/dashboard/seo-analyzer", icon: Sparkles, label: "SEO Analyzer" },
    { href: "/dashboard/profile", icon: User, label: "Profile" },
    { href: "/dashboard/settings", icon: Settings, label: "Settings" },
];

export function DashboardNav({ user }: { user: FirebaseUser | null }) {
    const pathname = usePathname();

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
                    {navItems.map((item) => (
                        <SidebarMenuItem key={item.href}>
                            <SidebarMenuButton
                                asChild
                                isActive={pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href))}
                                className="w-full justify-start group-data-[state=collapsed]:justify-center"
                                tooltip={item.label}
                            >
                                <Link href={item.href}>
                                    <item.icon className="h-4 w-4" />
                                    <span className="group-data-[state=collapsed]:hidden">{item.label}</span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    ))}
                </SidebarMenu>
            </div>
        </div>
    );
}
