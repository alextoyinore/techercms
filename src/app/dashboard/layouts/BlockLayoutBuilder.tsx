
'use client';

import * as React from 'react';
import { useState, useEffect } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import { BlockLayout } from './BlockLayoutsView';
import { addDocumentNonBlocking, setDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { useToast } from '@/hooks/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { PostGridPreview } from './previews/PostGridPreview';
import { Textarea } from '@/components/ui/textarea';
import { PostListPreview } from './previews/PostListPreview';
import { HeroPreview } from './previews/HeroPreview';
import { CtaPreview } from './previews/CtaPreview';
import { FeatureGridPreview } from './previews/FeatureGridPreview';
import { GalleryPreview } from './previews/GalleryPreview';
import { VideoPreview } from './previews/VideoPreview';
import { TestimonialsPreview } from './previews/TestimonialsPreview';
import { ContactFormPreview } from './previews/ContactFormPreview';
import { PostCarouselPreview } from './previews/PostCarouselPreview';
import { FeaturedSmallsPreview } from './previews/FeaturedSmallsPreview';
import { TabbedPostsPreview } from './previews/TabbedPostsPreview';
import { MediaLibrary } from '@/components/media-library';
import Image from 'next/image';
import { Slider } from '@/components/ui/slider';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { FeaturedTopAndGridPreview } from './previews/FeaturedTopAndGridPreview';
import { FeaturedAndListPreview } from './previews/FeaturedAndListPreview';
import { BigFeaturedPreview } from './previews/BigFeaturedPreview';

type BlockLayoutBuilderProps = {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  editingLayout: BlockLayout | null;
};

type Category = {
    id: string;
    name: string;
}

type NewBlockType = 
    | 'post-grid' 
    | 'post-list'
    | 'post-carousel'
    | 'featured-and-smalls'
    | 'featured-top-and-grid'
    | 'featured-and-list'
    | 'tabbed-posts'
    | 'big-featured'
    | 'hero'
    | 'cta'
    | 'feature-grid'
    | 'gallery'
    | 'video'
    | 'testimonials'
    | 'contact-form';

const initialConfig = {
    'post-grid': { columns: 3, showImages: true, showExcerpts: false, imagePosition: 'before' },
    'post-list': { showImages: true, showExcerpts: true, imagePosition: 'before' },
    'post-carousel': { showImages: true, showExcerpts: false, imagePosition: 'before' },
    'featured-and-smalls': { featuredWidth: 50, showSmallImages: true, showSmallExcerpts: false, featuredPosition: 'left' },
    'featured-top-and-grid': { gridColumns: 3, showSmallImages: true, showSmallExcerpts: false, imagePosition: 'before' },
    'featured-and-list': { showSmallImages: true, showSmallExcerpts: true, imagePosition: 'before' },
    'big-featured': { imagePosition: 'left', showExcerpt: true, buttonText: 'Read More' },
    'tabbed-posts': { tabs: [{id: '1', title: 'Latest'}], showImages: true, showExcerpts: true },
    'hero': { headline: 'Hero Headline', subheadline: 'Subheadline text goes here.', buttonText: 'Learn More', buttonUrl: '#', imageUrl: '' },
    'cta': { headline: 'Call to Action', subheadline: 'Encourage users to take an action.', buttonText: 'Get Started', buttonUrl: '#' },
    'feature-grid': { features: [{ id: '1', icon: 'zap', title: 'Feature One', description: 'Description for feature one.'}, { id: '2', icon: 'bar-chart', title: 'Feature Two', description: 'Description for feature two.'}, { id: '3', icon: 'shield', title: 'Feature Three', description: 'Description for feature three.'}] },
    'gallery': { images: [] as { id: string; url: string }[] },
    'video': { videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' },
    'testimonials': { testimonials: [{ id: '1', author: 'Jane Doe', quote: 'This is a fantastic service!'}, {id: '2', author: 'John Smith', quote: 'I highly recommend this to everyone.'}] },
    'contact-form': { recipientEmail: 'you@example.com', submitButtonText: 'Send Message' }
}

const blockTypes: { value: NewBlockType, label: string, group: string }[] = [
    { value: 'post-grid', label: 'Post Grid', group: 'Posts' },
    { value: 'post-list', label: 'Post List', group: 'Posts' },
    { value: 'post-carousel', label: 'Post Carousel', group: 'Posts' },
    { value: 'featured-and-smalls', label: 'Featured & Smalls', group: 'Posts' },
    { value: 'featured-top-and-grid', label: 'Featured & Grid', group: 'Posts' },
    { value: 'featured-and-list', label: 'Featured & List', group: 'Posts' },
    { value: 'tabbed-posts', label: 'Tabbed Posts', group: 'Posts' },
    { value: 'big-featured', label: 'Big Featured', group: 'Posts' },
    { value: 'hero', label: 'Hero Section', group: 'Page Sections' },
    { value: 'cta', label: 'Call to Action', group: 'Page Sections' },
    { value: 'feature-grid', label: 'Feature Grid', group: 'Page Sections' },
    { value: 'gallery', label: 'Image Gallery', group: 'Media' },
    { value: 'video', label: 'Video', group: 'Media' },
    { value: 'testimonials', label: 'Testimonials', group: 'Content' },
    { value: 'contact-form', label: 'Contact Form', group: 'Utility' },
];

export function BlockLayoutBuilder({ isOpen, setIsOpen, editingLayout }: BlockLayoutBuilderProps) {
  const firestore = useFirestore();
  const { toast } = useToast();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<NewBlockType>('post-grid');
  const [config, setConfig] = useState<any>(initialConfig['post-grid']);
  const [isSaving, setIsSaving] = useState(false);

  const categoriesCollection = useMemoFirebase(() => firestore ? collection(firestore, 'categories') : null, [firestore]);
  const { data: categories, isLoading: isLoadingCategories } = useCollection<Category>(categoriesCollection);

  useEffect(() => {
    if (isOpen) {
        if (editingLayout) {
            setName(editingLayout.name);
            setDescription(editingLayout.description || '');
            setType(editingLayout.type as NewBlockType);
            setConfig(editingLayout.config || initialConfig[editingLayout.type as NewBlockType]);
        } else {
            setName('New Block Layout');
            setDescription('');
            setType('post-grid');
            setConfig(initialConfig['post-grid']);
        }
    }
  }, [isOpen, editingLayout]);

  const handleTypeChange = (newType: NewBlockType) => {
    setType(newType);
    setConfig(initialConfig[newType]);
  }

  const handleConfigChange = (newConfig: Partial<any>) => {
    setConfig(prev => ({ ...prev, ...newConfig }));
  };
  
  const handleFeatureChange = (index: number, field: 'title' | 'description' | 'icon', value: string) => {
    const newFeatures = [...config.features];
    newFeatures[index] = {...newFeatures[index], [field]: value};
    handleConfigChange({ features: newFeatures });
  };
  
  const handleTestimonialChange = (index: number, field: 'quote' | 'author', value: string) => {
    const newTestimonials = [...config.testimonials];
    newTestimonials[index] = {...newTestimonials[index], [field]: value};
    handleConfigChange({ testimonials: newTestimonials });
  };

  const handleTabChange = (index: number, field: 'title', value: string) => {
    const newTabs = [...(config.tabs || [])];
    const updatedTab = { ...newTabs[index], [field]: value };
    newTabs[index] = updatedTab;
    handleConfigChange({ tabs: newTabs });
  }

  const addTab = () => {
    const newTab = {id: `${Date.now()}`, title: 'New Tab'};
    handleConfigChange({ tabs: [...(config.tabs || []), newTab] });
  }

  const removeTab = (index: number) => {
    const newTabs = [...config.tabs];
    newTabs.splice(index, 1);
    handleConfigChange({ tabs: newTabs });
  }

  const handleCategoryChange = (categoryId: string, checked: boolean) => {
    const currentIds = config.categoryIds || [];
    const newIds = checked
        ? [...currentIds, categoryId]
        : currentIds.filter((id: string) => id !== categoryId);
    handleConfigChange({ categoryIds: newIds });
  };
  
  const handleAddGalleryImage = (url: string) => {
    const newImage = { id: `img-${Date.now()}`, url };
    const newImages = [...(config.images || []), newImage];
    handleConfigChange({ images: newImages });
  };

  const handleRemoveGalleryImage = (id: string) => {
    const newImages = (config.images || []).filter((img: { id: string }) => img.id !== id);
    handleConfigChange({ images: newImages });
  };


  const handleSave = async () => {
    if (!firestore) return;
    setIsSaving(true);
    
    const layoutData = { name, description, type, config };

    try {
        if (editingLayout) {
            const layoutRef = doc(firestore, 'block_layouts', editingLayout.id);
            await setDocumentNonBlocking(layoutRef, layoutData, { merge: true });
        } else {
            await addDocumentNonBlocking(collection(firestore, 'block_layouts'), layoutData);
        }
        toast({ title: 'Layout Saved!', description: `"${name}" has been saved.` });
        setIsOpen(false);
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Error saving layout', description: error.message });
    } finally {
        setIsSaving(false);
    }
  };
  
  const renderConfigFields = () => {
    switch(type) {
        case 'big-featured':
            return (
                <div className="grid gap-4">
                    <div className="grid gap-2">
                        <Label>Image Position</Label>
                        <RadioGroup
                            value={config.imagePosition || 'left'}
                            onValueChange={(value) => handleConfigChange({ imagePosition: value })}
                            className="flex gap-4"
                        >
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="left" id="pos-left-big" />
                                <Label htmlFor="pos-left-big">Left</Label>
                            </div>
                             <div className="flex items-center space-x-2">
                                <RadioGroupItem value="right" id="pos-right-big" />
                                <Label htmlFor="pos-right-big">Right</Label>
                            </div>
                        </RadioGroup>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Checkbox id="show-excerpt-big" checked={config.showExcerpt} onCheckedChange={c => handleConfigChange({ showExcerpt: c })} />
                        <Label htmlFor="show-excerpt-big">Show post excerpt</Label>
                    </div>
                    <div className="grid gap-2">
                        <Label>Button Text</Label>
                        <Input value={config.buttonText || ''} onChange={e => handleConfigChange({ buttonText: e.target.value })} placeholder="e.g., Read More"/>
                    </div>
                </div>
            )
        case 'hero':
        case 'cta':
            return (
                <div className="grid gap-4">
                    <div className="grid gap-2">
                        <Label>Headline</Label>
                        <Input value={config.headline || ''} onChange={e => handleConfigChange({ headline: e.target.value })} />
                    </div>
                     <div className="grid gap-2">
                        <Label>Sub-headline</Label>
                        <Textarea value={config.subheadline || ''} onChange={e => handleConfigChange({ subheadline: e.target.value })} />
                    </div>
                    <div className='grid grid-cols-2 gap-4'>
                        <div className="grid gap-2">
                            <Label>Button Text</Label>
                            <Input value={config.buttonText || ''} onChange={e => handleConfigChange({ buttonText: e.target.value })} />
                        </div>
                        <div className="grid gap-2">
                            <Label>Button URL</Label>
                            <Input value={config.buttonUrl || ''} onChange={e => handleConfigChange({ buttonUrl: e.target.value })} />
                        </div>
                    </div>
                    {type === 'hero' && (
                         <div className="grid gap-2">
                            <Label>Background Image URL</Label>
                            <Input value={config.imageUrl || ''} onChange={e => handleConfigChange({ imageUrl: e.target.value })} />
                        </div>
                    )}
                </div>
            );
        case 'feature-grid':
             return (
                <div className="grid gap-4">
                    {(config.features || []).map((feature: any, index: number) => (
                        <div key={feature.id} className="border p-4 rounded-md space-y-2">
                             <div className="grid gap-2">
                                <Label>Icon (Lucide name)</Label>
                                <Input value={feature.icon} onChange={e => handleFeatureChange(index, 'icon', e.target.value)} />
                            </div>
                            <div className="grid gap-2">
                                <Label>Title</Label>
                                <Input value={feature.title} onChange={e => handleFeatureChange(index, 'title', e.target.value)} />
                            </div>
                             <div className="grid gap-2">
                                <Label>Description</Label>
                                <Textarea value={feature.description} onChange={e => handleFeatureChange(index, 'description', e.target.value)} />
                            </div>
                        </div>
                    ))}
                </div>
             )
        case 'gallery':
            return (
                <div className="grid gap-4">
                    <div className="grid gap-2">
                        <Label>Images</Label>
                        <div className="grid grid-cols-3 gap-2">
                            {(config.images || []).map((image: { id: string; url: string }) => (
                                <div key={image.id} className="relative group">
                                    <Image src={image.url} alt="" width={100} height={100} className="rounded-md object-cover aspect-square" />
                                    <Button
                                        variant="destructive"
                                        size="icon"
                                        className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100"
                                        onClick={() => handleRemoveGalleryImage(image.id)}
                                    >
                                        <Trash2 className="h-3 w-3" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </div>
                    <MediaLibrary onSelect={handleAddGalleryImage}>
                        <Button variant="outline">
                            <Plus className="mr-2 h-4 w-4" /> Add from Library
                        </Button>
                    </MediaLibrary>
                </div>
            )
        case 'testimonials':
            return (
                <div className="grid gap-4">
                    {(config.testimonials || []).map((testimonial: any, index: number) => (
                         <div key={testimonial.id} className="border p-4 rounded-md space-y-2">
                            <div className="grid gap-2">
                                <Label>Author</Label>
                                <Input value={testimonial.author} onChange={e => handleTestimonialChange(index, 'author', e.target.value)} />
                            </div>
                             <div className="grid gap-2">
                                <Label>Quote</Label>
                                <Textarea value={testimonial.quote} onChange={e => handleTestimonialChange(index, 'quote', e.target.value)} />
                            </div>
                        </div>
                    ))}
                </div>
            )
        case 'video':
            return (
                <div className="grid gap-2">
                    <Label>Video URL</Label>
                    <Input value={config.videoUrl || ''} onChange={e => handleConfigChange({ videoUrl: e.target.value })} />
                    <p className='text-sm text-muted-foreground'>Enter the full URL for a YouTube or Vimeo video.</p>
                </div>
            )
         case 'contact-form':
            return (
                <div className="grid gap-4">
                    <div className="grid gap-2">
                        <Label>Recipient Email</Label>
                        <Input type="email" value={config.recipientEmail || ''} onChange={e => handleConfigChange({ recipientEmail: e.target.value })} />
                    </div>
                     <div className="grid gap-2">
                        <Label>Submit Button Text</Label>
                        <Input value={config.submitButtonText || ''} onChange={e => handleConfigChange({ submitButtonText: e.target.value })} />
                    </div>
                </div>
            )
        case 'post-grid':
        case 'post-carousel':
             return (
                <div className="grid gap-4">
                    <div className="grid grid-cols-2 gap-4">
                        {type === 'post-grid' && (
                             <div className="grid gap-2">
                                <Label htmlFor="columns">Columns</Label>
                                <Input id="columns" type="number" min="1" max="4" value={config.columns || ''} onChange={e => handleConfigChange({ columns: Number(e.target.value) })} />
                            </div>
                        )}
                    </div>
                    <div className="grid gap-2">
                        <Label>Image Position</Label>
                        <RadioGroup
                            value={config.imagePosition || 'before'}
                            onValueChange={(value) => handleConfigChange({ imagePosition: value })}
                            className="flex gap-4"
                        >
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="before" id="pos-before-grid" />
                                <Label htmlFor="pos-before-grid">Before Text</Label>
                            </div>
                             <div className="flex items-center space-x-2">
                                <RadioGroupItem value="after" id="pos-after-grid" />
                                <Label htmlFor="pos-after-grid">After Text</Label>
                            </div>
                        </RadioGroup>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Checkbox id="show-images" checked={config.showImages} onCheckedChange={c => handleConfigChange({ showImages: c })} />
                        <Label htmlFor="show-images">Show featured images</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Checkbox id="show-excerpts" checked={config.showExcerpts} onCheckedChange={c => handleConfigChange({ showExcerpts: c })} />
                        <Label htmlFor="show-excerpts">Show post excerpts</Label>
                    </div>
                </div>
            )
        case 'post-list':
             return (
                <div className="grid gap-4">
                    <div className="grid gap-2">
                        <Label>Image Position</Label>
                        <RadioGroup
                            value={config.imagePosition || 'before'}
                            onValueChange={(value) => handleConfigChange({ imagePosition: value })}
                            className="flex gap-4"
                        >
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="before" id="pos-before-list" />
                                <Label htmlFor="pos-before-list">Left</Label>
                            </div>
                             <div className="flex items-center space-x-2">
                                <RadioGroupItem value="after" id="pos-after-list" />
                                <Label htmlFor="pos-after-list">Right</Label>
                            </div>
                        </RadioGroup>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Checkbox id="show-images" checked={config.showImages} onCheckedChange={c => handleConfigChange({ showImages: c })} />
                        <Label htmlFor="show-images">Show featured images</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Checkbox id="show-excerpts" checked={config.showExcerpts} onCheckedChange={c => handleConfigChange({ showExcerpts: c })} />
                        <Label htmlFor="show-excerpts">Show post excerpts</Label>
                    </div>
                </div>
            )
        case 'featured-and-smalls':
            return (
                <div className="grid gap-4">
                    <div className="grid gap-2">
                        <Label>Featured Position</Label>
                        <RadioGroup
                            value={config.featuredPosition || 'left'}
                            onValueChange={(value) => handleConfigChange({ featuredPosition: value })}
                            className="flex gap-4"
                        >
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="left" id="pos-left" />
                                <Label htmlFor="pos-left">Left</Label>
                            </div>
                             <div className="flex items-center space-x-2">
                                <RadioGroupItem value="right" id="pos-right" />
                                <Label htmlFor="pos-right">Right</Label>
                            </div>
                        </RadioGroup>
                    </div>
                    <div className="grid gap-2">
                        <Label>Featured Post Width ({config.featuredWidth || 50}%)</Label>
                        <Slider 
                            value={[config.featuredWidth || 50]}
                            onValueChange={(v) => handleConfigChange({ featuredWidth: v[0]})}
                            min={25}
                            max={75}
                            step={1}
                        />
                    </div>
                    <div className="flex items-center space-x-2">
                        <Checkbox id="show-small-images" checked={config.showSmallImages} onCheckedChange={c => handleConfigChange({ showSmallImages: c })} />
                        <Label htmlFor="show-small-images">Show images on small posts</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Checkbox id="show-small-excerpts" checked={config.showSmallExcerpts} onCheckedChange={c => handleConfigChange({ showSmallExcerpts: c })} />
                        <Label htmlFor="show-small-excerpts">Show excerpts on small posts</Label>
                    </div>
                </div>
            )
        case 'featured-top-and-grid':
            return (
                <div className="grid gap-4">
                    <div className="grid gap-2">
                        <Label>Image Position (Featured Post)</Label>
                        <RadioGroup
                            value={config.imagePosition || 'before'}
                            onValueChange={(value) => handleConfigChange({ imagePosition: value })}
                            className="flex gap-4"
                        >
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="before" id="pos-before-topgrid" />
                                <Label htmlFor="pos-before-topgrid">Left</Label>
                            </div>
                             <div className="flex items-center space-x-2">
                                <RadioGroupItem value="after" id="pos-after-topgrid" />
                                <Label htmlFor="pos-after-topgrid">Right</Label>
                            </div>
                        </RadioGroup>
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="grid-columns">Grid Columns</Label>
                        <Input id="grid-columns" type="number" min="1" max="6" value={config.gridColumns || ''} onChange={e => handleConfigChange({ gridColumns: Number(e.target.value) })} />
                    </div>
                    <div className="flex items-center space-x-2">
                        <Checkbox id="show-small-images-grid" checked={config.showSmallImages} onCheckedChange={c => handleConfigChange({ showSmallImages: c })} />
                        <Label htmlFor="show-small-images-grid">Show images on grid posts</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Checkbox id="show-small-excerpts-grid" checked={config.showSmallExcerpts} onCheckedChange={c => handleConfigChange({ showSmallExcerpts: c })} />
                        <Label htmlFor="show-small-excerpts-grid">Show excerpts on grid posts</Label>
                    </div>
                </div>
            )
        case 'featured-and-list':
             return (
                <div className="grid gap-4">
                    <div className="grid gap-2">
                        <Label>Image Position (Featured Post)</Label>
                        <RadioGroup
                            value={config.imagePosition || 'before'}
                            onValueChange={(value) => handleConfigChange({ imagePosition: value })}
                            className="flex gap-4"
                        >
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="before" id="pos-before-featlist" />
                                <Label htmlFor="pos-before-featlist">Before Text</Label>
                            </div>
                             <div className="flex items-center space-x-2">
                                <RadioGroupItem value="after" id="pos-after-featlist" />
                                <Label htmlFor="pos-after-featlist">After Text</Label>
                            </div>
                        </RadioGroup>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Checkbox id="show-small-images-list" checked={config.showSmallImages} onCheckedChange={c => handleConfigChange({ showSmallImages: c })} />
                        <Label htmlFor="show-small-images-list">Show images on list posts</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Checkbox id="show-small-excerpts-list" checked={config.showSmallExcerpts} onCheckedChange={c => handleConfigChange({ showSmallExcerpts: c })} />
                        <Label htmlFor="show-small-excerpts-list">Show excerpts on list posts</Label>
                    </div>
                </div>
            )
        case 'tabbed-posts':
            return (
                <div className="grid gap-4">
                     <div className="flex items-center space-x-2">
                        <Checkbox id="show-images-tabs" checked={config.showImages} onCheckedChange={c => handleConfigChange({ showImages: c })} />
                        <Label htmlFor="show-images-tabs">Show featured images</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Checkbox id="show-excerpts-tabs" checked={config.showExcerpts} onCheckedChange={c => handleConfigChange({ showExcerpts: c })} />
                        <Label htmlFor="show-excerpts-tabs">Show post excerpts</Label>
                    </div>
                    <div className="grid gap-4 border-t pt-4">
                        <Label>Tabs</Label>
                        {(config.tabs || []).map((tab: any, index: number) => (
                            <div key={tab.id} className="grid gap-4 rounded-md border p-4">
                                <div className="grid gap-2">
                                    <Label>Tab Title</Label>
                                    <Input value={tab.title} onChange={e => handleTabChange(index, 'title', e.target.value)} />
                                </div>
                                <Button variant="ghost" size="sm" onClick={() => removeTab(index)} className="text-destructive hover:text-destructive justify-self-start">
                                    <Trash2 className="mr-2 h-4 w-4" /> Remove Tab
                                </Button>
                            </div>
                        ))}
                        <Button variant="outline" onClick={addTab}><Plus className="mr-2 h-4 w-4" /> Add Tab</Button>
                    </div>
                </div>
            )
        default:
            return <p>This block type has no configuration options.</p>
    }
  }

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetContent className="flex flex-col sm:max-w-4xl">
        <SheetHeader>
          <SheetTitle>{editingLayout ? 'Edit' : 'Create'} Block Layout</SheetTitle>
          <SheetDescription>
            Design a reusable content block for your pages or widget areas.
          </SheetDescription>
        </SheetHeader>
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-8 overflow-y-auto py-4 pr-2">
            {/* --- SETTINGS --- */}
            <div className="grid gap-6 auto-rows-max">
                 <div className="grid gap-2">
                    <Label htmlFor="layout-name">Layout Name</Label>
                    <Input id="layout-name" value={name} onChange={(e) => setName(e.target.value)} />
                </div>
                 <div className="grid gap-2">
                    <Label htmlFor="layout-description">Description</Label>
                    <Textarea id="layout-description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What is this block for?" />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="layout-type">Layout Type</Label>
                    <Select value={type} onValueChange={(v) => handleTypeChange(v as any)}>
                        <SelectTrigger id="layout-type">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                             {Object.entries(blockTypes.reduce((acc, t) => ({...acc, [t.group]: [...(acc[t.group] || []), t]}), {} as Record<string, typeof blockTypes>)).map(([group, types]) => (
                                <React.Fragment key={group}>
                                    <p className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">{group}</p>
                                    {types.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                                </React.Fragment>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                
                <div className="grid gap-4 border-t pt-4">
                    <h3 className="font-medium">Configuration</h3>
                    {renderConfigFields()}
                </div>
            </div>
            {/* --- PREVIEW --- */}
            <div className="bg-muted/50 rounded-lg p-4">
                 <h3 className="font-medium mb-4 text-center text-sm text-muted-foreground">Live Preview</h3>
                 {type === 'post-grid' && <PostGridPreview config={config} />}
                 {type === 'post-list' && <PostListPreview config={config} />}
                 {type === 'post-carousel' && <PostCarouselPreview config={config} />}
                 {type === 'featured-and-smalls' && <FeaturedSmallsPreview config={config} />}
                 {type === 'featured-top-and-grid' && <FeaturedTopAndGridPreview config={config} />}
                 {type === 'featured-and-list' && <FeaturedAndListPreview config={config} />}
                 {type === 'tabbed-posts' && <TabbedPostsPreview config={config} />}
                 {type === 'big-featured' && <BigFeaturedPreview config={config} />}
                 {type === 'hero' && <HeroPreview config={config} />}
                 {type === 'cta' && <CtaPreview config={config} />}
                 {type === 'feature-grid' && <FeatureGridPreview config={config} />}
                 {type === 'gallery' && <GalleryPreview config={config} />}
                 {type === 'video' && <VideoPreview config={config} />}
                 {type === 'testimonials' && <TestimonialsPreview config={config} />}
                 {type === 'contact-form' && <ContactFormPreview config={config} />}
            </div>
        </div>
        <SheetFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</> : 'Save Layout'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
