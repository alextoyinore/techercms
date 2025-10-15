
import {
    FileText,
    List,
    Search,
    Cloud,
    Code,
    Image,
    Users,
    TrendingUp,
    Rss,
    Star,
    BarChart,
    MessageSquare,
    Link,
    GalleryHorizontal,
    Menu,
    LayoutGrid,
    CloudSun,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export type Widget = {
    id?: string;
    type: string;
    label: string;
    icon: LucideIcon;
    areaName?: string;
}

export const availableWidgets: Omit<Widget, 'id' | 'areaName'>[] = [
    { type: 'recent-posts', label: 'Recent Posts', icon: FileText },
    { type: 'categories-list', label: 'Categories List', icon: List },
    { type: 'search', label: 'Search', icon: Search },
    { type: 'tag-cloud', label: 'Tag Cloud', icon: Cloud },
    { type: 'custom-html', label: 'Custom HTML', icon: Code },
    { type: 'image', label: 'Image', icon: Image },
    { type: 'text', label: 'Text', icon: MessageSquare },
    { type: 'gallery', label: 'Gallery', icon: GalleryHorizontal },
    { type: 'navigation-menu', label: 'Navigation Menu', icon: Menu },
    { type: 'social-follow', label: 'Social Follow', icon: Users },
    { type: 'post-showcase', label: 'Post Showcase', icon: LayoutGrid },
    { type: 'trading-ticker', label: 'Trading Ticker', icon: TrendingUp },
    { type: 'breaking-news', label: 'Breaking News', icon: Rss },
    { type: 'live-score', label: 'Live Score', icon: Star },
    { type: 'sporting-tables', label: 'Sporting Tables', icon: BarChart },
    { type: 'weather', label: 'Weather', icon: CloudSun },
];
