
import {
    FileText,
    List,
    Search,
    Cloud,
    Code,
    Image as ImageIcon,
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
    Type,
    PanelTop,
    PictureInPicture2,
    MessageCircle,
    Copy,
    Rows,
    RectangleHorizontal,
    Podcast
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export type Widget = {
    id: string;
    type: string;
    label: string;
    icon: LucideIcon;
    areaName: string;
    config?: any;
    defaultConfig?: any;
}

export const availableWidgets: Omit<Widget, 'id' | 'areaName' | 'config'>[] = [
    { type: 'recent-posts', label: 'Recent Posts', icon: FileText, defaultConfig: { title: 'Recent Posts', count: 5 } },
    { type: 'post-carousel', label: 'Post Carousel', icon: PanelTop, defaultConfig: { title: 'Featured Posts' } },
    { type: 'featured-and-smalls', label: 'Featured & Smalls', icon: PictureInPicture2, defaultConfig: { title: 'Top Stories' } },
    { type: 'featured-top-and-grid', label: 'Featured & Grid', icon: Copy, defaultConfig: { title: 'Highlights' } },
    { type: 'featured-and-list', label: 'Featured & List', icon: Rows, defaultConfig: { title: 'Latest' } },
    { type: 'big-featured', label: 'Big Featured', icon: RectangleHorizontal, defaultConfig: { title: 'Featured Story' } },
    { type: 'tabbed-posts', label: 'Tabbed Posts', icon: PanelTop, defaultConfig: { title: '' } },
    { type: 'chart', label: 'Chart', icon: BarChart, defaultConfig: { title: 'Chart' } },
    { type: 'categories-list', label: 'Categories List', icon: List, defaultConfig: { title: 'Categories' } },
    { type: 'search', label: 'Search', icon: Search, defaultConfig: { title: 'Search' } },
    { type: 'tag-cloud', label: 'Tag Cloud', icon: Cloud, defaultConfig: { title: 'Tag Cloud' } },
    { type: 'custom-html', label: 'Custom HTML', icon: Code, defaultConfig: { title: '', html: '' } },
    { type: 'image', label: 'Image', icon: ImageIcon, defaultConfig: { title: '', imageUrl: '', caption: '', linkUrl: '' } },
    { type: 'text', label: 'Text', icon: Type, defaultConfig: { title: '', text: '' } },
    { type: 'gallery', label: 'Gallery', icon: GalleryHorizontal, defaultConfig: { title: 'Gallery', galleryImages: [] } },
    { type: 'navigation-menu', label: 'Navigation Menu', icon: Menu, defaultConfig: { title: 'Navigation', navLinks: [] } },
    { type: 'social-follow', label: 'Social Follow', icon: Users, defaultConfig: { title: 'Follow Us', socialLinks: [] } },
    { type: 'post-showcase', label: 'Post Showcase', icon: LayoutGrid, defaultConfig: { title: 'Post Showcase', count: 3, sourceType: 'category', layout: 'list' } },
    { type: 'audio-player', label: 'Audio Player', icon: Podcast, defaultConfig: { title: 'Listen to Articles' } },
    { type: 'trading-ticker', label: 'Trading Ticker', icon: TrendingUp, defaultConfig: { title: 'Market Watch' } },
    { type: 'breaking-news', label: 'Breaking News', icon: Rss, defaultConfig: { title: 'Breaking News' } },
    { type: 'live-score', label: 'Live Score', icon: Star, defaultConfig: { title: 'Live Match' } },
    { type: 'sporting-tables', label: 'Sporting Tables', icon: BarChart, defaultConfig: { title: 'League Standings' } },
    { type: 'weather', label: 'Weather', icon: CloudSun, defaultConfig: { title: 'Weather', location: 'New York, NY' } },
];
