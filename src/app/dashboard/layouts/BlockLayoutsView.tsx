'use client';
import { useState } from 'react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle, Edit, Trash2 } from 'lucide-react';
import { BlockLayoutBuilder } from './BlockLayoutBuilder';
import { deleteDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

export type BlockLayout = {
  id: string;
  name: string;
  description?: string;
  type: 'post-list' | 'post-grid';
  config: any;
};

export function BlockLayoutsView() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [editingLayout, setEditingLayout] = useState<BlockLayout | null>(null);

  const blockLayoutsCollection = useMemoFirebase(
    () => (firestore ? collection(firestore, 'block_layouts') : null),
    [firestore]
  );
  const { data: blockLayouts, isLoading } = useCollection<BlockLayout>(blockLayoutsCollection);

  const handleCreateNew = () => {
    setEditingLayout(null);
    setIsSheetOpen(true);
  };

  const handleEdit = (layout: BlockLayout) => {
    setEditingLayout(layout);
    setIsSheetOpen(true);
  };

  const handleDelete = (layout: BlockLayout) => {
    if (!firestore) return;
    deleteDocumentNonBlocking(doc(firestore, 'block_layouts', layout.id));
    toast({
        title: "Block Layout Deleted",
        description: `"${layout.name}" has been deleted.`,
    })
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Reusable Content Blocks</CardTitle>
          <CardDescription>
            Create, manage, and reuse complex content blocks across your site.
          </CardDescription>
        </CardHeader>
        <CardContent>
            {isLoading && <p>Loading layouts...</p>}
            {!isLoading && (!blockLayouts || blockLayouts.length === 0) && (
                 <div className="text-center py-10 border-2 border-dashed rounded-lg">
                    <p className="text-muted-foreground">No block layouts created yet.</p>
                    <Button variant="link" onClick={handleCreateNew}>Create one to get started</Button>
                </div>
            )}
            {!isLoading && blockLayouts && blockLayouts.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {blockLayouts.map(layout => (
                        <Card key={layout.id} className="flex flex-col">
                            <CardHeader>
                                <CardTitle className="text-lg">{layout.name}</CardTitle>
                                <CardDescription>Type: {layout.type}</CardDescription>
                            </CardHeader>
                             <CardContent className="flex-grow">
                                <p className="text-sm text-muted-foreground">{layout.description || 'No description.'}</p>
                            </CardContent>
                            <CardFooter className="flex justify-end gap-2">
                                <Button variant="ghost" size="icon" onClick={() => handleEdit(layout)}>
                                    <Edit className="h-4 w-4" />
                                </Button>
                                 <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            This will permanently delete the "{layout.name}" block layout. This action cannot be undone.
                                        </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => handleDelete(layout)}>Delete</AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            )}
        </CardContent>
        <CardFooter>
            <Button onClick={handleCreateNew}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Create New Block Layout
            </Button>
        </CardFooter>
      </Card>
      <BlockLayoutBuilder
        isOpen={isSheetOpen}
        setIsOpen={setIsSheetOpen}
        editingLayout={editingLayout}
      />
    </>
  );
}
