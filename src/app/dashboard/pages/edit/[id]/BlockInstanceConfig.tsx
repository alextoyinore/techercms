
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
import { collection } from 'firebase/firestore';
import { Loader2 } from 'lucide-react';
import { BlockLayout } from '@/app/dashboard/layouts/BlockLayoutsView';
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
import type { SectionBlock } from './page-builder';


type BlockInstanceConfigProps = {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  block: SectionBlock | null;
  layouts: BlockLayout[];
  onSave: (blockId: string, newConfig: any) => void;
};

type Category = {
    id: string;
    name: string;
}

export function BlockInstanceConfig({ isOpen, setIsOpen, block, layouts, onSave }: BlockInstanceConfigProps) {
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const [config, setConfig] = useState<any>({});
  const [isSaving, setIsSaving] = useState(false);

  const layout = block ? layouts.find(l => l.id === block.blockLayoutId) : null;
  const layoutType = layout?.type;

  const categoriesCollection = useMemoFirebase(() => firestore ? collection(firestore, 'categories') : null, [firestore]);
  const { data: categories, isLoading: isLoadingCategories } = useCollection<Category>(categoriesCollection);

  useEffect(() => {
    if (block) {
      setConfig(block.config || {});
    }
  }, [block]);

  const handleSave = () => {
    if (!block) return;
    onSave(block.id, config);
  }

  const handleConfigChange = (newConfig: Partial<any>) => {
    setConfig(prev => ({ ...prev, ...newConfig }));
  };

  const handleTabConfigChange = (index: number, newTabConfig: any) => {
    const newTabs = [...(config.tabs || layout?.config.tabs || [])];
    newTabs[index] = { ...newTabs[index], ...newTabConfig };
    handleConfigChange({ tabs: newTabs });
  }

  const handleCategoryChange = (categoryId: string, checked: boolean, tabIndex?: number) => {
    if (tabIndex !== undefined) {
        const tab = (config.tabs || [])[tabIndex] || (layout?.config.tabs || [])[tabIndex];
        const currentIds = tab.sourceIds || [];
        const newIds = checked ? [...currentIds, categoryId] : currentIds.filter((id: string) => id !== categoryId);
        handleTabConfigChange(tabIndex, { sourceIds: newIds });
    } else {
        const currentIds = config.sourceIds || [];
        const newIds = checked ? [...currentIds, categoryId] : currentIds.filter((id: string) => id !== categoryId);
        handleConfigChange({ sourceIds: newIds });
    }
  };
  
  const renderContentFilterFields = () => {
    const postTypes = [
        'post-grid', 
        'post-list', 
        'post-carousel', 
        'featured-and-smalls', 
        'featured-top-and-grid',
        'featured-and-list',
        'big-featured'
    ];
    if (layoutType === 'tabbed-posts') {
        const tabs = layout?.config.tabs || [];
        return (
             <div className="grid gap-4 border-t pt-4">
                <h3 className="font-medium">Content Source per Tab</h3>
                {tabs.map((tab: any, index: number) => {
                    const tabConfig = (config.tabs || [])[index] || {};
                    return (
                        <div key={tab.id || index} className="grid gap-4 rounded-md border p-4">
                            <p className="font-semibold text-sm">{tab.title}</p>
                            <div className="grid gap-2">
                                <Label>Filter Type</Label>
                                <Select 
                                    value={tabConfig.filterType || 'latest'} 
                                    onValueChange={v => handleTabConfigChange(index, { filterType: v, sourceIds: [], tags: '' })}
                                >
                                    <SelectTrigger><SelectValue/></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="latest">Latest Posts</SelectItem>
                                        <SelectItem value="category">By Category</SelectItem>
                                        <SelectItem value="tag">By Tag</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            {tabConfig.filterType === 'category' && (
                                <div className="grid gap-2">
                                    <Label>Categories</Label>
                                    <ScrollArea className="h-40 rounded-md border p-2">
                                        <div className='grid gap-2'>
                                        {isLoadingCategories && <p>Loading...</p>}
                                        {categories?.map(cat => (
                                            <div key={cat.id} className="flex items-center gap-2">
                                                <Checkbox
                                                    id={`cat-tab-${index}-${cat.id}`}
                                                    checked={(tabConfig.sourceIds || []).includes(cat.id)}
                                                    onCheckedChange={(checked) => handleCategoryChange(cat.id, checked as boolean, index)}
                                                />
                                                <Label htmlFor={`cat-tab-${index}-${cat.id}`} className="font-normal">{cat.name}</Label>
                                            </div>
                                        ))}
                                        </div>
                                    </ScrollArea>
                                </div>
                            )}
                            {tabConfig.filterType === 'tag' && (
                                <div className="grid gap-2">
                                    <Label htmlFor={`tags-tab-${index}`}>Tags (comma-separated)</Label>
                                    <Input
                                        id={`tags-tab-${index}`}
                                        placeholder="e.g., tech, news"
                                        value={tabConfig.tags || ''}
                                        onChange={e => handleTabConfigChange(index, { tags: e.target.value })}
                                    />
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>
        )
    }

    if (!layoutType || !postTypes.includes(layoutType)) {
        return <p className="text-sm text-muted-foreground">This block type has no content filtering options.</p>;
    }
    
    let postCountDefault = 6;
    if (layoutType === 'featured-and-smalls') postCountDefault = 5;
    if (layoutType === 'big-featured') postCountDefault = 1;


    return (
        <div className="grid gap-4 border-t pt-4">
            <h3 className="font-medium">Content Source</h3>
            <div className="grid gap-2">
                <Label>Filter Type</Label>
                <Select value={config.filterType || 'latest'} onValueChange={v => handleConfigChange({ filterType: v, sourceIds: [], tags: '' })}>
                    <SelectTrigger><SelectValue/></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="latest">Latest Posts</SelectItem>
                        <SelectItem value="category">By Category</SelectItem>
                        <SelectItem value="tag">By Tag</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            
            {config.filterType === 'category' && (
                <div className="grid gap-2">
                    <Label>Categories</Label>
                    <ScrollArea className="h-40 rounded-md border p-2">
                        <div className='grid gap-2'>
                        {isLoadingCategories && <p>Loading...</p>}
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

             {config.filterType === 'tag' && (
                <div className="grid gap-2">
                    <Label htmlFor="tags">Tags (comma-separated)</Label>
                    <Input
                        id="tags"
                        placeholder="e.g., tech, news"
                        value={config.tags || ''}
                        onChange={e => handleConfigChange({ tags: e.target.value })}
                    />
                </div>
            )}

            <div className="grid gap-2">
                <Label htmlFor="post-count">Number of posts to display</Label>
                <Input
                    id="post-count"
                    type="number"
                    min="1"
                    value={config.postCount || postCountDefault}
                    onChange={e => handleConfigChange({ postCount: Number(e.target.value) })}
                />
            </div>
        </div>
    );
  }

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetContent className="flex flex-col sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Configure: {layout?.name}</SheetTitle>
          <SheetDescription>
            Set the content and display options for this block instance.
          </SheetDescription>
        </SheetHeader>
        <ScrollArea className="flex-1 -mx-6 px-6">
            <div className="py-4 space-y-4">
                 <div className="grid gap-2">
                    <Label htmlFor="section-title">Section Title (Optional)</Label>
                    <Input
                        id="section-title"
                        placeholder="e.g., Latest News"
                        value={config.title || ''}
                        onChange={(e) => handleConfigChange({ title: e.target.value })}
                    />
                </div>
                {renderContentFilterFields()}
            </div>
        </ScrollArea>
        <SheetFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</> : 'Save Changes'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
