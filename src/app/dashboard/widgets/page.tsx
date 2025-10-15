
'use client';

import { useMemo, useState, useEffect } from 'react';
import { PageHeader } from "@/components/page-header";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { GripVertical, X, Cog, Library, Trash2, Plus, Facebook, Twitter, Instagram, Linkedin, Youtube, Github } from "lucide-react";
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc, writeBatch, setDoc, query, where, or, and } from 'firebase/firestore';
import { DndContext, closestCenter, DragEndEvent, DragStartEvent, DragOverlay, useDraggable, PointerSensor, useSensor, useSensors, useDroppable } from '@dnd-kit/core';
import { arrayMove, SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { addDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetFooter } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { MediaLibrary } from '@/components/media-library';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import Image from 'next/image';
import { Checkbox } from '@/components/ui/checkbox';

const socialPlatforms = [
    { value: 'twitter', label: 'Twitter', icon: Twitter },
    { value: 'facebook', label: 'Facebook', icon: Facebook },
    { value: 'instagram', label: 'Instagram', icon: Instagram },
    { value: 'linkedin', label: 'LinkedIn', icon: Linkedin },
    { value: 'youtube', label: 'YouTube', icon: Youtube },
    { value: 'github', label: 'GitHub', icon: Github },
];

const availableWidgets = {
    'Content': [
        { type: 'text', name: 'Text', description: 'Display a block of text with an optional title.' },
        { type: 'image', name: 'Image', description: 'Display an image from your media library.' },
        { type: 'gallery', name: 'Gallery', description: 'Display a gallery of images.' },
        { type: 'custom-html', name: 'Custom HTML', description: 'Enter arbitrary HTML.' },
        { type: 'recent-posts', name: 'Recent Posts', description: 'Display a list of your most recent posts.' },
        { type: 'categories-list', name: 'Categories', description: 'Show a list of all post categories.' },
        { type: 'tag-cloud', name: 'Tag Cloud', description: 'A cloud of your most used tags.' },
        { type: 'post-showcase', name: 'Post Showcase', description: 'Display posts from a specific category or tag.' },
    ],
    'Navigation': [
        { type: 'navigation-menu', name: 'Navigation Menu', description: 'Display a reusable navigation menu.' },
    ],
    'Utility': [
        { type: 'search', name: 'Search', description: 'Display a search form.' },
        { type: 'weather', name: 'Weather', description: 'Display current weather for a location.' },
    ],
    'Social': [
        { type: 'social-follow', name: 'Social Follow', description: 'Display links to your social media profiles.' },
    ],
    'Finance': [
        { type: 'trading-ticker', name: 'Trading Ticker', description: 'Display a scrolling stock ticker.' },
    ],
    'News & Sports': [
        { type: 'breaking-news', name: 'Breaking News', description: 'Show a list of breaking news headlines.' },
        { type: 'live-score', name: 'Live Score', description: 'Display a live sports score.' },
        { type: 'sporting-tables', name: 'Sporting Tables', description: 'Show league standings.' },
    ]
};

const defaultWidgetAreas: Omit<WidgetArea, 'id' | 'pageId'>[] = [
    { name: 'Sidebar', description: 'Main sidebar for posts and pages.', theme: 'all' },
    { name: 'Header', description: 'Header area, useful for banners or announcements.', theme: 'all' },
    { name: 'Footer Column 1', description: 'First column in the site footer.', theme: 'all' },
    { name: 'Footer Column 2', description: 'Second column in the site footer.', theme: 'all' },
    { name: 'Homepage Content', description: 'Special content area on the homepage.', theme: 'all' },
];

type WidgetArea = {
    id: string;
    name: string;
    description: string;
    theme: string;
    pageId?: string;
}

type SocialLink = {
    id: string;
    platform: string;
    url: string;
}

type NavLink = {
    id: string;
    label: string;
    url: string;
}

type GalleryImage = {
    id: string;
    url: string;
}

type Category = {
    id: string;
    name: string;
}

type Tag = {
    id: string;
    name: string;
}

type NavigationMenu = {
    id: string;
    name: string;
}

type WidgetInstance = {
    id: string;
    widgetAreaId: string;
    type: string;
    order: number;
    config?: {
        title?: string;
        html?: string;
        text?: string;
        count?: number;
        imageUrl?: string;
        caption?: string;
        linkUrl?: string;
        socialLinks?: SocialLink[];
        galleryImages?: GalleryImage[];
        menuId?: string;
        sourceType?: 'category' | 'tag';
        sourceIds?: string[];
        tags?: string;
        layout?: 'list' | 'grid';
        gridColumns?: number;
        location?: string;
    }
}

type AvailableWidget = (typeof availableWidgets)[keyof typeof availableWidgets][0];

function AvailableWidgetCard({ widget }: { widget: AvailableWidget }) {
    const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
        id: `available-${widget.type}`,
        data: { widget, from: 'available' },
    });

    return (
        <div 
            ref={setNodeRef}
            className={cn(`flex items-start gap-2 rounded-md border p-3 bg-muted/50 cursor-grab active:cursor-grabbing`, isDragging && 'opacity-50')}
            {...listeners} 
            {...attributes}
        >
            <GripVertical className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div className="grid gap-0.5">
                <p className="font-medium">{widget.name}</p>
                <p className="text-xs text-muted-foreground">{widget.description}</p>
            </div>
        </div>
    )
}

function SortableWidgetInstance({ instance, onDelete, onSaveConfig }: { instance: WidgetInstance; onDelete: (id: string) => void; onSaveConfig: (id: string, config: any) => void; }) {
    const allWidgets = Object.values(availableWidgets).flat();
    const widgetInfo = allWidgets.find(w => w.type === instance.type);
    const name = widgetInfo?.name || instance.type;

    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
         id: instance.id,
         data: { instance, from: 'area', isWidgetInstance: true } 
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 100 : 'auto',
    };

    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [config, setConfig] = useState(instance.config || {});
    
    useEffect(() => {
        if (!isSheetOpen || instance.config) {
            setConfig(instance.config || {});
        }
    }, [isSheetOpen, instance.config]);

    const handleSave = () => {
        onSaveConfig(instance.id, config);
        setIsSheetOpen(false);
    }
    
    const handleSocialLinkChange = (index: number, field: 'platform' | 'url', value: string) => {
        const newLinks = [...(config.socialLinks || [])];
        newLinks[index] = { ...newLinks[index], [field]: value };
        setConfig({ ...config, socialLinks: newLinks });
    }

    const addSocialLink = () => {
        const newLink: SocialLink = { id: `link-${Date.now()}`, platform: 'twitter', url: '' };
        setConfig({ ...config, socialLinks: [...(config.socialLinks || []), newLink] });
    }
    
    const removeSocialLink = (index: number) => {
        const newLinks = [...(config.socialLinks || [])];
        newLinks.splice(index, 1);
        setConfig({ ...config, socialLinks: newLinks });
    }

    const addGalleryImage = (url: string) => {
        const newImage: GalleryImage = { id: `gallery-img-${Date.now()}`, url };
        setConfig({ ...config, galleryImages: [...(config.galleryImages || []), newImage] });
    };

    const removeGalleryImage = (index: number) => {
        const newImages = [...(config.galleryImages || [])];
        newImages.splice(index, 1);
        setConfig({ ...config, galleryImages: newImages });
    };
    
    const firestore = useFirestore();
    const categoriesCollection = useMemoFirebase(() => firestore ? collection(firestore, 'categories') : null, [firestore]);
    const { data: categories } = useCollection<Category>(categoriesCollection);
    
    const navMenusCollection = useMemoFirebase(() => firestore ? collection(firestore, 'navigation_menus') : null, [firestore]);
    const { data: navMenus } = useCollection<NavigationMenu>(navMenusCollection);

    const handleCategoryChange = (categoryId: string, checked: boolean) => {
        const currentIds = config.sourceIds || [];
        const newIds = checked
            ? [...currentIds, categoryId]
            : currentIds.filter((id: string) => id !== categoryId);
        setConfig({ ...config, sourceIds: newIds });
    };

    const renderConfigFields = () => {
        switch (instance.type) {
             case 'post-showcase':
                return (
                    <div className="grid gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="widget-title">Title</Label>
                            <Input
                                id="widget-title"
                                placeholder="e.g., Featured Posts"
                                value={config.title || ''}
                                onChange={(e) => setConfig({ ...config, title: e.target.value })}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label>Source Type</Label>
                            <Select
                                value={config.sourceType || 'category'}
                                onValueChange={(value) => setConfig({ ...config, sourceType: value, sourceIds: [], tags: '' })}
                            >
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="category">Category</SelectItem>
                                    <SelectItem value="tag">Tag</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {config.sourceType === 'category' && (
                             <div className="grid gap-2">
                                <Label>Categories</Label>
                                <ScrollArea className="h-40 rounded-md border p-2">
                                    <div className='grid gap-2'>
                                    {categories?.map(cat => (
                                        <div key={cat.id} className="flex items-center gap-2">
                                            <Checkbox
                                                id={`cat-${cat.id}`}
                                                checked={(config.sourceIds || []).includes(cat.id)}
                                                onCheckedChange={(checked) => handleCategoryChange(cat.id, checked as boolean)}
                                            />
                                            <Label htmlFor={`cat-${cat.id}`} className="font-normal">{cat.name}</Label>
                                        </div>
                                    ))}
                                    </div>
                                </ScrollArea>
                            </div>
                        )}
                         {config.sourceType === 'tag' && (
                             <div className="grid gap-2">
                                <Label htmlFor="widget-tags">Tags (comma-separated)</Label>
                                <Input
                                    id="widget-tags"
                                    placeholder="e.g., tech, news, featured"
                                    value={config.tags || ''}
                                    onChange={(e) => setConfig({ ...config, tags: e.target.value })}
                                />
                            </div>
                        )}

                        <div className="grid gap-2">
                            <Label htmlFor="widget-count">Number of posts</Label>
                            <Input
                                id="widget-count"
                                type="number"
                                value={config.count || 3}
                                onChange={(e) => setConfig({ ...config, count: parseInt(e.target.value, 10) || 3 })}
                            />
                        </div>
                         <div className="grid gap-2">
                            <Label>Layout</Label>
                            <Select
                                value={config.layout || 'list'}
                                onValueChange={(value) => setConfig({ ...config, layout: value })}
                            >
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="list">List</SelectItem>
                                    <SelectItem value="grid">Grid</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        {config.layout === 'grid' && (
                            <div className="grid gap-2">
                                <Label htmlFor="widget-grid-cols">Grid Columns</Label>
                                <Input
                                    id="widget-grid-cols"
                                    type="number"
                                    min="1"
                                    max="6"
                                    value={config.gridColumns || 2}
                                    onChange={(e) => setConfig({ ...config, gridColumns: parseInt(e.target.value, 10) || 2 })}
                                />
                            </div>
                        )}
                    </div>
                );
            case 'text':
                return (
                    <div className="grid gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="widget-title">Title</Label>
                            <Input
                                id="widget-title"
                                placeholder="Widget Title (optional)"
                                value={config.title || ''}
                                onChange={(e) => setConfig({ ...config, title: e.target.value })}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="widget-text">Content</Label>
                            <Textarea
                                id="widget-text"
                                className="min-h-40"
                                placeholder="Enter your text content here."
                                value={config.text || ''}
                                onChange={(e) => setConfig({ ...config, text: e.target.value })}
                            />
                        </div>
                    </div>
                );
             case 'gallery':
                return (
                    <div className="grid gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="widget-title">Title</Label>
                            <Input
                                id="widget-title"
                                placeholder="Gallery Title (optional)"
                                value={config.title || ''}
                                onChange={(e) => setConfig({ ...config, title: e.target.value })}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label>Images</Label>
                            <div className="grid grid-cols-3 gap-2">
                                {(config.galleryImages || []).map((image: GalleryImage, index: number) => (
                                    <div key={image.id} className="relative group">
                                        <Image src={image.url} alt={`Gallery image ${index + 1}`} width={100} height={100} className="rounded-md object-cover aspect-square" />
                                        <Button
                                            variant="destructive"
                                            size="icon"
                                            className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100"
                                            onClick={() => removeGalleryImage(index)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                             <MediaLibrary onSelect={addGalleryImage}>
                                <Button variant="outline" className="w-full">
                                    <Plus className="mr-2 h-4 w-4" /> Add Image from Library
                                </Button>
                            </MediaLibrary>
                        </div>
                    </div>
                );
             case 'navigation-menu':
                return (
                    <div className="grid gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="widget-title">Title</Label>
                            <Input
                                id="widget-title"
                                placeholder="Menu Title"
                                value={config.title || ''}
                                onChange={(e) => setConfig({ ...config, title: e.target.value })}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label>Menu</Label>
                            <Select
                                value={config.menuId || ''}
                                onValueChange={(value) => setConfig({ ...config, menuId: value })}
                            >
                                <SelectTrigger><SelectValue placeholder="Select a menu" /></SelectTrigger>
                                <SelectContent>
                                    {navMenus?.map(menu => (
                                        <SelectItem key={menu.id} value={menu.id}>{menu.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                );
            case 'trading-ticker':
            case 'breaking-news':
            case 'live-score':
            case 'sporting-tables':
                return (
                    <div className="grid gap-2">
                        <Label htmlFor="widget-title">Title</Label>
                        <Input
                            id="widget-title"
                            value={config.title || ''}
                            onChange={(e) => setConfig({ ...config, title: e.target.value })}
                        />
                        <p className="text-sm text-muted-foreground">This widget uses placeholder data. A developer will need to connect it to a live data source.</p>
                    </div>
                );
            case 'weather':
                return (
                    <div className="grid gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="widget-title">Title</Label>
                            <Input
                                id="widget-title"
                                placeholder="e.g., Local Weather"
                                value={config.title || ''}
                                onChange={(e) => setConfig({ ...config, title: e.target.value })}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="widget-location">Location</Label>
                            <Input
                                id="widget-location"
                                placeholder="e.g., New York, NY"
                                value={config.location || ''}
                                onChange={(e) => setConfig({ ...config, location: e.target.value })}
                            />
                        </div>
                         <p className="text-sm text-muted-foreground">This widget uses placeholder data. A developer will need to connect it to a live data source.</p>
                    </div>
                );
            case 'social-follow':
                return (
                     <div className="grid gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="widget-title">Title</Label>
                            <Input
                                id="widget-title"
                                placeholder="Follow Us"
                                value={config.title || ''}
                                onChange={(e) => setConfig({ ...config, title: e.target.value })}
                            />
                        </div>
                        <div className="grid gap-4">
                            <Label>Social Links</Label>
                            {(config.socialLinks || []).map((link, index) => (
                                <div key={link.id} className="grid gap-2 rounded-md border p-3">
                                    <div className='flex gap-2'>
                                        <div className='flex-1 grid gap-2'>
                                            <Label htmlFor={`platform-${index}`} className='text-xs'>Platform</Label>
                                            <Select value={link.platform} onValueChange={(value) => handleSocialLinkChange(index, 'platform', value)}>
                                                <SelectTrigger id={`platform-${index}`}>
                                                    <SelectValue placeholder="Select platform" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {socialPlatforms.map(p => (
                                                        <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                         <div className='flex-1 grid gap-2'>
                                            <Label htmlFor={`url-${index}`} className='text-xs'>URL</Label>
                                            <Input
                                                id={`url-${index}`}
                                                placeholder="https://twitter.com/user"
                                                value={link.url}
                                                onChange={(e) => handleSocialLinkChange(index, 'url', e.target.value)}
                                            />
                                        </div>
                                    </div>
                                    <Button variant="ghost" size="sm" onClick={() => removeSocialLink(index)} className='text-destructive hover:text-destructive w-fit'>
                                        <Trash2 className="mr-2 h-3 w-3" />
                                        Remove
                                    </Button>
                                </div>
                            ))}
                             <Button variant="outline" onClick={addSocialLink}>
                                <Plus className="mr-2 h-4 w-4" /> Add Link
                            </Button>
                        </div>
                    </div>
                );
            case 'image':
                return (
                    <div className="grid gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="widget-title">Title</Label>
                            <Input
                                id="widget-title"
                                placeholder="Widget Title (optional)"
                                value={config.title || ''}
                                onChange={(e) => setConfig({ ...config, title: e.target.value })}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label>Image</Label>
                            <MediaLibrary onSelect={(url) => setConfig({ ...config, imageUrl: url})}>
                                <Button variant="outline" className='w-full'>
                                    <Library className='mr-2 h-4 w-4' />
                                    Choose from Library
                                </Button>
                            </MediaLibrary>
                            {config.imageUrl && (
                                <Image src={config.imageUrl} alt="Selected image" width={200} height={112} className="rounded-md aspect-video object-cover mt-2" />
                            )}
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="widget-caption">Caption</Label>
                            <Input
                                id="widget-caption"
                                placeholder="Image caption (optional)"
                                value={config.caption || ''}
                                onChange={(e) => setConfig({ ...config, caption: e.target.value })}
                            />
                        </div>
                         <div className="grid gap-2">
                            <Label htmlFor="widget-linkUrl">Link URL</Label>
                            <Input
                                id="widget-linkUrl"
                                placeholder="https://example.com (optional)"
                                value={config.linkUrl || ''}
                                onChange={(e) => setConfig({ ...config, linkUrl: e.target.value })}
                            />
                        </div>
                    </div>
                );
            case 'recent-posts':
                 return (
                    <div className="grid gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="widget-title">Title</Label>
                            <Input
                                id="widget-title"
                                placeholder="Recent Posts"
                                value={config.title || ''}
                                onChange={(e) => setConfig({ ...config, title: e.target.value })}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="widget-count">Number of posts to show</Label>
                            <Input
                                id="widget-count"
                                type="number"
                                value={config.count || 5}
                                onChange={(e) => setConfig({ ...config, count: parseInt(e.target.value, 10) || 5 })}
                            />
                        </div>
                    </div>
                );
            case 'custom-html':
                return (
                    <div className="grid gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="widget-title">Title</Label>
                            <Input
                                id="widget-title"
                                value={config.title || ''}
                                onChange={(e) => setConfig({ ...config, title: e.target.value })}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="widget-html">HTML Content</Label>
                            <Textarea
                                id="widget-html"
                                className="min-h-40 font-mono"
                                value={config.html || ''}
                                onChange={(e) => setConfig({ ...config, html: e.target.value })}
                            />
                        </div>
                    </div>
                );
            default:
                return (
                     <div className="grid gap-2">
                        <Label htmlFor="widget-title">Title</Label>
                        <Input
                            id="widget-title"
                            value={config.title || ''}
                            onChange={(e) => setConfig({ ...config, title: e.target.value })}
                        />
                        <p className="text-sm text-muted-foreground">This widget has no other configurable options.</p>
                    </div>
                )
        }
    }


    return (
        <div ref={setNodeRef} style={style}  className={cn(`relative group/item flex items-center gap-2 rounded-md border p-3 bg-card cursor-grab active:cursor-grabbing`, isDragging && 'opacity-50 shadow-lg')}>
             <div {...attributes} {...listeners} className="flex-grow flex items-center gap-2">
                <GripVertical className="h-5 w-5 text-muted-foreground" />
                <div className="grid gap-0.5">
                    <p className="font-medium">{instance.config?.title || name}</p>
                </div>
            </div>
            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                <SheetTrigger asChild>
                     <button
                        className="absolute top-1/2 -translate-y-1/2 right-10 z-10 p-1 text-muted-foreground hover:text-foreground rounded-full hover:bg-muted"
                        aria-label="Configure widget"
                    >
                        <Cog className="h-4 w-4" />
                    </button>
                </SheetTrigger>
                <SheetContent>
                    <SheetHeader>
                        <SheetTitle>Configure: {name}</SheetTitle>
                        <SheetDescription>
                            Modify the settings for this widget instance.
                        </SheetDescription>
                    </SheetHeader>
                    <div className="py-4">
                       {renderConfigFields()}
                    </div>
                    <SheetFooter>
                        <Button variant="outline" onClick={() => setIsSheetOpen(false)}>Cancel</Button>
                        <Button onClick={handleSave}>Save Changes</Button>
                    </SheetFooter>
                </SheetContent>
            </Sheet>
            <button
                onClick={() => onDelete(instance.id)}
                className="absolute top-1/2 -translate-y-1/2 right-2 z-10 p-1 text-muted-foreground hover:text-destructive rounded-full hover:bg-destructive/10"
                aria-label="Remove widget"
            >
                <X className="h-4 w-4" />
            </button>
        </div>
    );
}

function WidgetPlaceholder() {
    return (
        <div className="p-8 text-center text-muted-foreground border-2 border-dashed rounded-lg">
            Drag widgets here
        </div>
    )
}


export default function WidgetsPage({ pageId }: { pageId?: string }) {
    const firestore = useFirestore();
    const { toast } = useToast();
    const [activeItem, setActiveItem] = useState<any>(null);

    const areasQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        if (pageId) {
            return query(collection(firestore, 'widget_areas'), where('pageId', '==', pageId));
        }
        return query(collection(firestore, 'widget_areas'), where('pageId', '==', null));
    }, [firestore, pageId]);
    
    const instancesCollection = useMemoFirebase(() => firestore ? collection(firestore, 'widget_instances') : null, [firestore]);

    const { data: widgetAreas, isLoading: isLoadingAreas } = useCollection<WidgetArea>(areasQuery);
    const { data: widgetInstances, isLoading: isLoadingInstances } = useCollection<WidgetInstance>(instancesCollection);

    const [localInstances, setLocalInstances] = useState<WidgetInstance[] | null>(null);

     useEffect(() => {
        if (widgetInstances) {
            setLocalInstances(widgetInstances);
        }
    }, [widgetInstances]);
    
     useEffect(() => {
        if (!pageId && !isLoadingAreas && widgetAreas && widgetAreas.length === 0 && firestore) {
            const batch = writeBatch(firestore);
            defaultWidgetAreas.forEach(areaData => {
                const newAreaRef = doc(collection(firestore, 'widget_areas'));
                batch.set(newAreaRef, { ...areaData, pageId: null });
            });
            batch.commit().catch(error => {
                toast({
                    variant: "destructive",
                    title: "Error Initializing Areas",
                    description: error.message || "Could not create default widget areas.",
                });
            });
        }
    }, [isLoadingAreas, widgetAreas, firestore, toast, pageId]);


    const widgetsByArea = useMemo(() => {
        if (!localInstances) return {};
        const result = (localInstances || []).reduce((acc, instance) => {
            if (!acc[instance.widgetAreaId]) {
                acc[instance.widgetAreaId] = [];
            }
            acc[instance.widgetAreaId].push(instance);
            return acc;
        }, {} as Record<string, WidgetInstance[]>);
    
        // Now sort each area's widgets by the 'order' property
        for (const areaId in result) {
            result[areaId].sort((a, b) => a.order - b.order);
        }
    
        return result;
    }, [localInstances]);
    

    const sensors = useSensors(useSensor(PointerSensor));

    const handleDragStart = (event: DragStartEvent) => {
        const { widget, instance } = event.active.data.current || {};
        if (widget) {
            setActiveItem(widget);
        } else if (instance) {
            setActiveItem(instance);
        }
    };
    
    const handleDeleteWidget = (instanceId: string) => {
        if (!firestore) return;

        const instanceToDelete = localInstances?.find(i => i.id === instanceId);
        const allWidgets = Object.values(availableWidgets).flat();
        const widgetName = instanceToDelete ? (allWidgets.find(w => w.type === instanceToDelete.type)?.name || 'Widget') : 'Widget';
        
        try {
            deleteDocumentNonBlocking(doc(firestore, 'widget_instances', instanceId));
            
            setLocalInstances(prev => (prev || []).filter(i => i.id !== instanceId));

            toast({
                title: "Widget Removed",
                description: `The "${widgetName}" widget has been removed.`
            });
        } catch(error: any) {
             toast({
                variant: "destructive",
                title: "Error Removing Widget",
                description: error.message || "Could not remove the widget.",
            });
        }
    };

    const handleSaveConfig = async (instanceId: string, config: any) => {
        if (!firestore) return;

        try {
            const instanceRef = doc(firestore, 'widget_instances', instanceId);
            await setDoc(instanceRef, { config }, { merge: true });

            setLocalInstances(prev => (prev || []).map(inst => inst.id === instanceId ? { ...inst, config } : inst));

            toast({
                title: 'Widget Updated',
                description: 'Your widget settings have been saved.',
            });
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Error Saving Settings',
                description: error.message || 'Could not save widget settings.',
            });
        }
    };

    const handleDragEnd = (event: DragEndEvent) => {
        setActiveItem(null);
        const { active, over } = event;
    
        if (!over) return;
    
        const fromAvailable = active.data.current?.from === 'available';
        const targetAreaId = over.data.current?.isWidgetArea ? String(over.id) : over.data.current?.instance?.widgetAreaId;
        
        if (!targetAreaId) return;

        if (fromAvailable && firestore) {
            try {
                const widgetType = active.data.current?.widget.type;
                const widgetName = active.data.current?.widget.name;
                const targetArea = widgetAreas?.find(area => area.id === targetAreaId);
                if (!targetArea) return;
        
                const newWidgetData: Omit<WidgetInstance, 'id'> = {
                    widgetAreaId: targetAreaId,
                    type: widgetType,
                    order: widgetsByArea[targetAreaId]?.length || 0,
                    config: { title: widgetName },
                };
        
                addDocumentNonBlocking(collection(firestore, 'widget_instances'), newWidgetData);
                toast({
                    title: "Widget Added",
                    description: `The "${widgetName}" widget was added to the "${targetArea.name}" area. It may take a moment to appear.`
                });
            } catch (error: any) {
                console.error("Error adding widget:", error);
                 toast({
                    variant: "destructive",
                    title: "Error Adding Widget",
                    description: error.message || "Could not save the new widget.",
                });
            }
            return;
        }

        if (!fromAvailable && localInstances && firestore) {
            const activeId = String(active.id);
            const overId = String(over.id);
        
            setLocalInstances(prevInstances => {
                if (!prevInstances) return null;
        
                const activeIndex = prevInstances.findIndex((i) => i.id === activeId);
                const overIndex = prevInstances.findIndex((i) => i.id === overId);
                const activeInstance = prevInstances[activeIndex];
        
                if (!activeInstance || overIndex < 0) return prevInstances;
        
                const isDroppingOnArea = over.data.current?.isWidgetArea;
                const destinationAreaId = isDroppingOnArea ? String(over.id) : prevInstances[overIndex].widgetAreaId;
        
                let newItems = [...prevInstances];
        
                if (activeInstance.widgetAreaId !== destinationAreaId) {
                    const movedItem = { ...newItems[activeIndex], widgetAreaId: destinationAreaId };
                    newItems.splice(activeIndex, 1);
        
                    const itemsInDest = newItems.filter(i => i.widgetAreaId === destinationAreaId);
                    const overInDestIndex = isDroppingOnArea ? itemsInDest.length : itemsInDest.findIndex(i => i.id === overId);
        
                    const globalOverIndex = isDroppingOnArea 
                        ? newItems.length 
                        : newItems.findIndex(i => i.id === overId);
        
                    newItems.splice(globalOverIndex, 0, movedItem);
                } else {
                    newItems = arrayMove(prevInstances, activeIndex, overIndex);
                }
        
                let batch = writeBatch(firestore);
                const areasToUpdate = new Set([activeInstance.widgetAreaId, destinationAreaId]);
        
                areasToUpdate.forEach(areaId => {
                    const itemsInArea = newItems.filter(i => i.widgetAreaId === areaId).sort((a, b) => {
                        const originalA = prevInstances.find(p => p.id === a.id);
                        const originalB = prevInstances.find(p => p.id === b.id);
                        if (a.widgetAreaId === b.widgetAreaId && a.widgetAreaId === activeInstance.widgetAreaId) {
                             const idxA = prevInstances.findIndex(p => p.id === a.id);
                             const idxB = prevInstances.findIndex(p => p.id === b.id);
                             return idxA - idxB;
                        }
                        return a.order - b.order;
                    });
                     itemsInArea.forEach((item, index) => {
                        if (item.order !== index || item.widgetAreaId !== areaId) {
                            const updatedItem = { ...item, order: index, widgetAreaId: areaId };
                            const itemIndexInNewItems = newItems.findIndex(i => i.id === item.id);
                            if(itemIndexInNewItems !== -1) {
                                newItems[itemIndexInNewItems] = updatedItem;
                            }
                            const docRef = doc(firestore, 'widget_instances', item.id);
                            batch.set(docRef, { order: index, widgetAreaId: areaId }, { merge: true });
                        }
                    });
                });
        
                batch.commit().catch(error => {
                    toast({ variant: 'destructive', title: 'Error updating widgets', description: error.message });
                    setLocalInstances(widgetInstances);
                });
                
                return newItems;
            });
        }
    };
    
    function DroppableWidgetArea({ area, areaWidgets }: { area: WidgetArea, areaWidgets: WidgetInstance[] }) {
        const { setNodeRef, isOver } = useDroppable({
            id: area.id,
            data: { isWidgetArea: true, areaId: area.id },
        });

        return (
            <div ref={setNodeRef} className={cn('p-4 rounded-lg min-h-[100px]', isOver ? 'bg-primary/10 ring-2 ring-primary' : 'bg-muted/30')}>
                <SortableContext items={areaWidgets.map(w => w.id)} strategy={verticalListSortingStrategy}>
                    <div className="grid gap-2">
                        {areaWidgets.length > 0 ? (
                            areaWidgets.map(instance => (
                                <SortableWidgetInstance key={instance.id} instance={instance} onDelete={handleDeleteWidget} onSaveConfig={handleSaveConfig} />
                            ))
                        ) : (
                            <WidgetPlaceholder />
                        )}
                    </div>
                </SortableContext>
            </div>
        );
    }

    const allWidgets = Object.values(availableWidgets).flat();
    
    const pageTitle = pageId ? "Page Widgets" : "Theme Widgets";
    const pageDescription = pageId 
        ? "Manage widgets specifically for this page. These will override theme-wide widgets in the same areas."
        : "Manage widgets for your entire site. These appear in areas defined by your active theme.";

    return (
        <DndContext 
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
        >
            <div className="flex flex-col gap-6">
               {!pageId && (
                 <PageHeader
                    title={pageTitle}
                    description={pageDescription}
                />
               )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                    <div className="lg:col-span-2">
                        <Card>
                            <CardHeader>
                                <CardTitle className="font-headline">Widget Areas</CardTitle>
                                <CardDescription>
                                    Drag widgets from the right to a widget area below to activate them. Drag existing widgets to reorder.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                               <Accordion type="multiple" defaultValue={widgetAreas?.map(a => a.id) || []} className="w-full space-y-4">
                                    {(isLoadingAreas || isLoadingInstances && !localInstances) && <p>Loading widget areas...</p>}
                                    {widgetAreas?.map((area) => {
                                        const areaWidgets = widgetsByArea[area.id] || [];
                                        return (
                                            <Card key={area.id}>
                                                <AccordionItem value={area.id} className="border-b-0">
                                                    <AccordionTrigger className="p-4 hover:no-underline rounded-t-lg">
                                                        <div className="flex-1 text-left">
                                                            <h3 className="font-semibold">{area.name}</h3>
                                                            <p className="text-sm text-muted-foreground">{area.description}</p>
                                                        </div>
                                                    </AccordionTrigger>
                                                    <AccordionContent className="px-4 pb-4 pt-0">
                                                        <DroppableWidgetArea area={area} areaWidgets={areaWidgets} />
                                                    </AccordionContent>
                                                </AccordionItem>
                                            </Card>
                                        )
                                    })}
                                    {!isLoadingAreas && widgetAreas?.length === 0 && (
                                         <div className="p-8 text-center text-muted-foreground border-2 border-dashed rounded-lg">
                                            <p>No widget areas found for this context.</p>
                                        </div>
                                    )}
                                </Accordion>
                            </CardContent>
                        </Card>
                    </div>
                    <div className="lg:col-span-1 sticky top-20">
                         <Card className="flex flex-col max-h-[calc(100vh-10rem)]">
                            <CardHeader>
                                <CardTitle className="font-headline">Available Widgets</CardTitle>
                                 <CardDescription>
                                    Drag these to a widget area on the left.
                                 </CardDescription>
                            </CardHeader>
                            <CardContent className="flex-1 overflow-y-auto px-6">
                                <ScrollArea className="h-full pr-2">
                                    <div className="grid gap-4">
                                        {Object.entries(availableWidgets).map(([groupName, widgets]) => (
                                            <div key={groupName} className="grid gap-2">
                                                <h4 className="font-medium text-sm text-muted-foreground">{groupName}</h4>
                                                {widgets.map((widget) => (
                                                    <AvailableWidgetCard key={widget.type} widget={widget} />
                                                ))}
                                            </div>
                                        ))}
                                    </div>
                                </ScrollArea>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
             <DragOverlay>
                {activeItem ? (
                    <div className="flex items-start gap-2 rounded-md border p-3 bg-card shadow-lg cursor-grabbing">
                       <GripVertical className="h-5 w-5 text-muted-foreground mt-0.5" />
                       <div className="grid gap-0.5">
                           <p className="font-medium">{activeItem.config?.title || activeItem.name || allWidgets.find(w => w.type === activeItem.type)?.name}</p>
                       </div>
                   </div>
                ) : null}
            </DragOverlay>
        </DndContext>
    );
}

