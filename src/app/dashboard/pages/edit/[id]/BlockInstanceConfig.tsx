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
import { Loader2, Plus, Trash2 } from 'lucide-react';
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
import { Textarea } from '@/components/ui/textarea';
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

  const handleCategoryChange = (categoryId: string, checked: boolean) => {
    const currentIds = config.sourceIds || [];
    const newIds = checked
        ? [...currentIds, categoryId]
        : currentIds.filter((id: string) => id !== categoryId);
    handleConfigChange({ sourceIds: newIds });
  };
  
  const renderContentFilterFields = () => {
    const postTypes = ['post-grid', 'post-list', 'post-carousel', 'featured-and-smalls', 'tabbed-posts'];
    if (!layoutType || !postTypes.includes(layoutType)) {
        return <p className="text-sm text-muted-foreground">This block type has no content filtering options.</p>;
    }

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
                    value={config.postCount || (layoutType === 'featured-and-smalls' ? 5 : 6)}
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
