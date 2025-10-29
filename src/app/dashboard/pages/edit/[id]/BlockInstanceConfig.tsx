
'use client';

import * as React from 'react';
import { useState, useEffect, useMemo } from 'react';
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
import { Loader2, Plus, Trash2, X } from 'lucide-react';
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
import { Badge } from '@/components/ui/badge';


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
  const [categorySearch, setCategorySearch] = useState('');

  const layout = block ? layouts.find(l => l.id === block.blockLayoutId) : null;
  const layoutType = layout?.type;

  const categoriesCollection = useMemoFirebase(() => firestore ? collection(firestore, 'categories') : null, [firestore]);
  const { data: categories, isLoading: isLoadingCategories } = useCollection<Category>(categoriesCollection);

  const sortedCategories = useMemo(() => {
    if (!categories) return [];
    return [...categories].sort((a, b) => a.name.localeCompare(b.name));
  }, [categories]);

  const filteredCategories = useMemo(() => {
    if (!sortedCategories) return [];
    if (!categorySearch) return sortedCategories;
    return sortedCategories.filter(category =>
        category.name.toLowerCase().includes(categorySearch.toLowerCase())
    );
  }, [sortedCategories, categorySearch]);

  const getSelectedCategoriesForTab = (tabIndex: number) => {
    const tab = (config.tabs || [])[tabIndex];
    if (!tab || !tab.sourceIds || !categories) return [];
    return tab.sourceIds.map((id: string) => categories.find(c => c.id === id)).filter(Boolean) as Category[];
  }

  const getSelectedCategoriesForBlock = () => {
    if (!config.sourceIds || !categories) return [];
    return config.sourceIds.map((id: string) => categories.find(c => c.id === id)).filter(Boolean) as Category[];
  }


  useEffect(() => {
    if (block) {
      // If it's a tabbed block and no tabs are configured in the instance,
      // initialize it with the default from the layout.
      if (layoutType === 'tabbed-posts' && !block.config?.tabs) {
          setConfig({ ...layout?.config, ...block.config, tabs: layout?.config.tabs || [{id: `${Date.now()}`, title: 'Latest'}] });
      } else {
        setConfig(block.config || {});
      }
    }
  }, [block, layout, layoutType]);

  const handleSave = () => {
    if (!block) return;
    onSave(block.id, config);
  }

  const handleConfigChange = (newConfig: Partial<any>) => {
    setConfig(prev => ({ ...prev, ...newConfig }));
  };

  const handleTabChange = (index: number, field: string, value: any) => {
    const newTabs = [...(config.tabs || [])];
    const updatedTab = { ...newTabs[index], [field]: value };
    newTabs[index] = updatedTab;
    handleConfigChange({ tabs: newTabs });
  }

  const addTab = () => {
    const newTab = {id: `${Date.now()}`, title: 'New Tab', filterType: 'latest'};
    handleConfigChange({ tabs: [...(config.tabs || []), newTab] });
  }

  const removeTab = (index: number) => {
    const newTabs = [...config.tabs];
    newTabs.splice(index, 1);
    handleConfigChange({ tabs: newTabs });
  }

  const handleCategoryChangeForTabs = (categoryId: string, checked: boolean, tabIndex: number) => {
    const tab = (config.tabs || [])[tabIndex];
    if (!tab) return;
    const currentIds = tab.sourceIds || [];
    const newIds = checked ? [...currentIds, categoryId] : currentIds.filter((id: string) => id !== categoryId);
    handleTabChange(tabIndex, 'sourceIds', newIds);
  };

  const handleCategoryChange = (categoryId: string, checked: boolean) => {
    const currentIds = config.sourceIds || [];
    const newIds = checked
        ? [...currentIds, categoryId]
        : currentIds.filter((id: string) => id !== categoryId);
    handleConfigChange({ sourceIds: newIds });
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
        const tabs = config.tabs || [];
        return (
             <div className="grid gap-4 border-t pt-4">
                <div className="flex justify-between items-center">
                    <h3 className="font-medium">Tabs</h3>
                    <Button variant="outline" size="sm" onClick={addTab}><Plus className="mr-2 h-4 w-4" /> Add Tab</Button>
                </div>
                {tabs.map((tab: any, index: number) => {
                    const selectedCategoriesForTab = getSelectedCategoriesForTab(index);
                    return (
                        <div key={tab.id || index} className="grid gap-4 rounded-md border p-4">
                            <div className="flex justify-between items-start">
                                <div className="grid gap-2 flex-grow">
                                    <Label htmlFor={`tab-title-${index}`}>Tab Title</Label>
                                    <Input id={`tab-title-${index}`} value={tab.title} onChange={e => handleTabChange(index, 'title', e.target.value)} />
                                </div>
                                <Button variant="ghost" size="icon" onClick={() => removeTab(index)} className="text-destructive hover:text-destructive ml-2 shrink-0">
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                            <div className="grid gap-2">
                                <Label>Content Source</Label>
                                <Select 
                                    value={tab.filterType || 'latest'} 
                                    onValueChange={v => {
                                        const newTabs = [...(config.tabs || [])];
                                        newTabs[index] = { ...newTabs[index], filterType: v, sourceIds: [], tags: '' };
                                        handleConfigChange({ tabs: newTabs });
                                    }}
                                >
                                    <SelectTrigger><SelectValue/></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="latest">Latest Posts</SelectItem>
                                        <SelectItem value="category">By Category</SelectItem>
                                        <SelectItem value="tag">By Tag</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            {tab.filterType === 'category' && (
                                <div className="grid gap-2">
                                    <Label>Categories</Label>
                                     {selectedCategoriesForTab.length > 0 && (
                                        <div className="flex flex-wrap gap-1 border-b pb-2">
                                            {selectedCategoriesForTab.map(cat => (
                                                <Badge key={cat.id} variant="secondary" className="flex items-center gap-1">
                                                    {cat.name}
                                                    <button onClick={() => handleCategoryChangeForTabs(cat.id, false, index)}>
                                                        <X className="h-3 w-3" />
                                                    </button>
                                                </Badge>
                                            ))}
                                        </div>
                                    )}
                                    <Input placeholder="Search categories..." value={categorySearch} onChange={(e) => setCategorySearch(e.target.value)} />
                                    <ScrollArea className="h-40 rounded-md border p-2">
                                        <div className='grid gap-2'>
                                        {isLoadingCategories && <p>Loading...</p>}
                                        {filteredCategories?.map(cat => (
                                            <div key={cat.id} className="flex items-center gap-2">
                                                <Checkbox
                                                    id={`cat-tab-${index}-${cat.id}`}
                                                    checked={(tab.sourceIds || []).includes(cat.id)}
                                                    onCheckedChange={(checked) => handleCategoryChangeForTabs(cat.id, checked as boolean, index)}
                                                />
                                                <Label htmlFor={`cat-tab-${index}-${cat.id}`} className="font-normal">{cat.name}</Label>
                                            </div>
                                        ))}
                                        </div>
                                    </ScrollArea>
                                </div>
                            )}
                            {tab.filterType === 'tag' && (
                                <div className="grid gap-2">
                                    <Label htmlFor={`tags-tab-${index}`}>Tags (comma-separated)</Label>
                                    <Input
                                        id={`tags-tab-${index}`}
                                        placeholder="e.g., tech, news"
                                        value={tab.tags || ''}
                                        onChange={e => handleTabChange(index, 'tags', e.target.value)}
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
    const selectedCategoriesForBlock = getSelectedCategoriesForBlock();


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
                    {selectedCategoriesForBlock.length > 0 && (
                        <div className="flex flex-wrap gap-1 border-b pb-2">
                            {selectedCategoriesForBlock.map(cat => (
                                <Badge key={cat.id} variant="secondary" className="flex items-center gap-1">
                                    {cat.name}
                                    <button onClick={() => handleCategoryChange(cat.id, false)}>
                                        <X className="h-3 w-3" />
                                    </button>
                                </Badge>
                            ))}
                        </div>
                    )}
                    <Input placeholder="Search categories..." value={categorySearch} onChange={(e) => setCategorySearch(e.target.value)} />
                    <ScrollArea className="h-40 rounded-md border p-2">
                        <div className='grid gap-2'>
                        {isLoadingCategories && <p>Loading...</p>}
                        {filteredCategories?.map(cat => (
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
