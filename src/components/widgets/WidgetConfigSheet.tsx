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
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { Loader2 } from 'lucide-react';
import { availableWidgets } from './widget-list';

type WidgetInstance = {
  id: string;
  widgetAreaId: string;
  type: string;
  order: number;
  config?: any;
};

type WidgetConfigSheetProps = {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  widget: WidgetInstance | null;
  onSave: (widgetId: string, newConfig: any) => void;
};

type Category = {
    id: string;
    name: string;
}

function GeneralFields({ config, onConfigChange }: { config: any, onConfigChange: (newConfig: any) => void }) {
    return (
        <div className="grid gap-4">
            <div className="grid gap-2">
                <Label htmlFor="widget-title">Widget Title</Label>
                <Input
                    id="widget-title"
                    value={config.title || ''}
                    onChange={(e) => onConfigChange({ ...config, title: e.target.value })}
                />
            </div>
        </div>
    )
}

function RecentPostsFields({ config, onConfigChange }: { config: any, onConfigChange: (newConfig: any) => void }) {
     return (
        <div className="grid gap-2">
            <Label htmlFor="post-count">Number of posts to show</Label>
            <Input
                id="post-count"
                type="number"
                value={config.count || 5}
                onChange={(e) => onConfigChange({ ...config, count: Number(e.target.value) })}
            />
        </div>
    )
}

function PostShowcaseFields({ config, onConfigChange }: { config: any, onConfigChange: (newConfig: any) => void }) {
    const firestore = useFirestore();
    const categoriesCollection = useMemoFirebase(() => {
        if (!firestore) return null;
        return collection(firestore, 'categories');
    }, [firestore]);
    const { data: categories, isLoading } = useCollection<Category>(categoriesCollection);

    const handleCategoryChange = (categoryId: string, checked: boolean) => {
        const currentIds = config.sourceIds || [];
        const newIds = checked ? [...currentIds, categoryId] : currentIds.filter((id: string) => id !== categoryId);
        onConfigChange({ ...config, sourceIds: newIds });
    };
    
    return (
        <div className="grid gap-4">
             <div className="grid gap-2">
                <Label>Source Type</Label>
                <select 
                    className="w-full p-2 border rounded-md"
                    value={config.sourceType || 'category'} 
                    onChange={(e) => onConfigChange({ ...config, sourceType: e.target.value })}>
                    <option value="category">Category</option>
                    <option value="tag">Tag</option>
                </select>
            </div>

            {config.sourceType === 'category' && (
                <div className="grid gap-2">
                    <Label>Categories</Label>
                    <div className="flex flex-row flex-wrap gap-x-4 gap-y-2">
                        {isLoading && <p>Loading categories...</p>}
                        {categories?.map((category) => (
                            <div key={category.id} className="flex items-center space-x-2">
                                <Checkbox
                                    id={`cat-${category.id}`}
                                    checked={(config.sourceIds || []).includes(category.id)}
                                    onCheckedChange={(checked) => handleCategoryChange(category.id, checked as boolean)}
                                />
                                <Label htmlFor={`cat-${category.id}`} className="font-normal">
                                    {category.name}
                                </Label>
                            </div>
                        ))}
                    </div>
                </div>
            )}
            
            {config.sourceType === 'tag' && (
                 <div className="grid gap-2">
                    <Label htmlFor="tags">Tags</Label>
                    <Input
                        id="tags"
                        placeholder="e.g. tech, news, featured"
                        value={config.tags || ''}
                        onChange={(e) => onConfigChange({ ...config, tags: e.target.value })}
                    />
                    <p className="text-sm text-muted-foreground">Comma-separated list of tags.</p>
                </div>
            )}

            <div className="grid gap-2">
                <Label htmlFor="post-count-showcase">Number of posts</Label>
                <Input
                    id="post-count-showcase"
                    type="number"
                    value={config.count || 3}
                    onChange={(e) => onConfigChange({ ...config, count: Number(e.target.value) })}
                />
            </div>
        </div>
    )
}

function CustomHtmlFields({ config, onConfigChange }: { config: any, onConfigChange: (newConfig: any) => void }) {
    return (
       <div className="grid gap-2">
           <Label htmlFor="html-content">HTML Content</Label>
           <Textarea
               id="html-content"
               value={config.html || ''}
               onChange={(e) => onConfigChange({ ...config, html: e.target.value })}
               rows={10}
           />
       </div>
   )
}

const widgetFieldComponents: Record<string, React.FC<any>> = {
    'recent-posts': RecentPostsFields,
    'post-showcase': PostShowcaseFields,
    'custom-html': CustomHtmlFields
};

export function WidgetConfigSheet({ isOpen, setIsOpen, widget, onSave }: WidgetConfigSheetProps) {
  const [config, setConfig] = useState<any>({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (widget) {
      setConfig(widget.config || {});
    }
  }, [widget]);

  const handleSave = () => {
    if (!widget) return;
    setIsSaving(true);
    onSave(widget.id, config);
    setIsSaving(false);
    setIsOpen(false);
  };
  
  const widgetMeta = widget ? availableWidgets.find(w => w.type === widget.type) : null;
  const FieldsComponent = widget ? widgetFieldComponents[widget.type] : null;

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetContent className="flex flex-col">
        <SheetHeader>
          <SheetTitle>Configure: {widgetMeta?.label}</SheetTitle>
          <SheetDescription>
            Modify the settings for this widget instance.
          </SheetDescription>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto py-4 grid gap-6">
            <GeneralFields config={config} onConfigChange={setConfig} />
            {FieldsComponent && <FieldsComponent config={config} onConfigChange={setConfig} />}
        </div>
        <SheetFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin"/>Saving...</> : 'Save Changes'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
