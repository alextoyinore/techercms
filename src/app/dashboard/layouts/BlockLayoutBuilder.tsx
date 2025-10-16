'use client';

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
import { Loader2 } from 'lucide-react';
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
import { PostGridPreview } from './PostGridPreview';
import { Textarea } from '@/components/ui/textarea';
import { PostListPreview } from './PostListPreview';

type BlockLayoutBuilderProps = {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  editingLayout: BlockLayout | null;
};

type Category = {
    id: string;
    name: string;
}

const initialConfig = {
    'post-grid': { postCount: 6, columns: 3, showImages: true, showExcerpts: false, filterType: 'latest', categoryIds: [], tagIds: [] },
    'post-list': { postCount: 5, showImages: true, showExcerpts: true, filterType: 'latest', categoryIds: [], tagIds: [] }
}

export function BlockLayoutBuilder({ isOpen, setIsOpen, editingLayout }: BlockLayoutBuilderProps) {
  const firestore = useFirestore();
  const { toast } = useToast();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<'post-grid' | 'post-list'>('post-grid');
  const [config, setConfig] = useState<any>(initialConfig['post-grid']);
  const [isSaving, setIsSaving] = useState(false);

  const categoriesCollection = useMemoFirebase(() => firestore ? collection(firestore, 'categories') : null, [firestore]);
  const { data: categories, isLoading: isLoadingCategories } = useCollection<Category>(categoriesCollection);

  useEffect(() => {
    if (isOpen) {
        if (editingLayout) {
            setName(editingLayout.name);
            setDescription(editingLayout.description || '');
            setType(editingLayout.type);
            setConfig(editingLayout.config || initialConfig[editingLayout.type]);
        } else {
            setName('New Block Layout');
            setDescription('');
            setType('post-grid');
            setConfig(initialConfig['post-grid']);
        }
    }
  }, [isOpen, editingLayout]);

  const handleTypeChange = (newType: 'post-grid' | 'post-list') => {
    setType(newType);
    setConfig(initialConfig[newType]);
  }

  const handleConfigChange = (newConfig: Partial<any>) => {
    setConfig(prev => ({ ...prev, ...newConfig }));
  };

  const handleCategoryChange = (categoryId: string, checked: boolean) => {
    const currentIds = config.categoryIds || [];
    const newIds = checked
        ? [...currentIds, categoryId]
        : currentIds.filter((id: string) => id !== categoryId);
    handleConfigChange({ categoryIds: newIds });
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
                            <SelectItem value="post-grid">Post Grid</SelectItem>
                            <SelectItem value="post-list">Post List</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                
                {/* --- CONFIG FIELDS --- */}
                <div className="grid gap-4 border-t pt-4">
                    <h3 className="font-medium">Configuration</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="post-count">Number of Posts</Label>
                            <Input id="post-count" type="number" value={config.postCount || ''} onChange={e => handleConfigChange({ postCount: Number(e.target.value) })} />
                        </div>
                        {type === 'post-grid' && (
                             <div className="grid gap-2">
                                <Label htmlFor="columns">Columns</Label>
                                <Input id="columns" type="number" min="1" max="4" value={config.columns || ''} onChange={e => handleConfigChange({ columns: Number(e.target.value) })} />
                            </div>
                        )}
                    </div>
                     <div className="flex items-center space-x-2">
                        <Checkbox id="show-images" checked={config.showImages} onCheckedChange={c => handleConfigChange({ showImages: c })} />
                        <Label htmlFor="show-images">Show featured images</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Checkbox id="show-excerpts" checked={config.showExcerpts} onCheckedChange={c => handleConfigChange({ showExcerpts: c })} />
                        <Label htmlFor="show-excerpts">Show post excerpts</Label>
                    </div>

                    <div className="grid gap-2">
                        <Label>Content Filter</Label>
                        <Select value={config.filterType} onValueChange={v => handleConfigChange({ filterType: v, categoryIds: [], tagIds: [] })}>
                             <SelectTrigger><SelectValue /></SelectTrigger>
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
                            <ScrollArea className="h-32 rounded-md border p-2">
                               {isLoadingCategories ? <p>Loading...</p> : categories?.map(cat => (
                                   <div key={cat.id} className="flex items-center space-x-2 p-1">
                                        <Checkbox 
                                            id={`cat-${cat.id}`}
                                            checked={(config.categoryIds || []).includes(cat.id)}
                                            onCheckedChange={c => handleCategoryChange(cat.id, c as boolean)}
                                        />
                                        <Label htmlFor={`cat-${cat.id}`} className="font-normal">{cat.name}</Label>
                                   </div>
                               ))}
                            </ScrollArea>
                        </div>
                    )}
                    {config.filterType === 'tag' && (
                         <div className="grid gap-2">
                            <Label htmlFor="tags">Tags (comma-separated)</Label>
                            <Input id="tags" value={(config.tagIds || []).join(', ')} onChange={e => handleConfigChange({ tagIds: e.target.value.split(',').map(t => t.trim()).filter(Boolean) })} />
                        </div>
                    )}

                </div>
            </div>
            {/* --- PREVIEW --- */}
            <div className="bg-muted/50 rounded-lg p-4">
                 <h3 className="font-medium mb-4 text-center text-sm text-muted-foreground">Live Preview</h3>
                 {type === 'post-grid' ? (
                     <PostGridPreview config={config} />
                 ) : type === 'post-list' ? (
                     <PostListPreview config={config} />
                 ) : (
                     <p className='text-center text-sm text-muted-foreground'>No preview available for this layout type yet.</p>
                 )}
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
