'use client';
import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, orderBy, writeBatch, doc } from 'firebase/firestore';
import { Plus, GripVertical, Trash2 } from 'lucide-react';
import { DndContext, closestCenter, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { addDocumentNonBlocking, setDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { useToast } from '@/hooks/use-toast';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { BlockLayout } from '@/app/dashboard/layouts/BlockLayoutsView';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

type PageSection = {
    id: string;
    pageId: string;
    order: number;
    type: 'one-column' | 'two-column-50-50' | 'two-column-33-67' | 'two-column-67-33';
    config?: any;
}

type SectionBlock = {
    id: string;
    sectionId: string;
    blockLayoutId: string;
    columnIndex: number;
    order: number;
}

const sectionTypes = [
    { type: 'one-column', label: 'Single Column' },
    { type: 'two-column-50-50', label: 'Two Columns (50/50)' },
    { type: 'two-column-33-67', label: 'Two Columns (33/67)' },
    { type: 'two-column-67-33', label: 'Two Columns (67/33)' },
];

function SectionBlockItem({ block, layouts, onDelete }: { block: SectionBlock, layouts: BlockLayout[], onDelete: (id: string) => void }) {
    const layout = layouts.find(l => l.id === block.blockLayoutId);
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: block.id, data: { type: 'block', block }});
    const style = { transform: CSS.Transform.toString(transform), transition };

    return (
        <div ref={setNodeRef} style={style} className="bg-background border rounded-md p-2 flex items-center gap-2">
            <div {...attributes} {...listeners} className="cursor-grab flex-grow flex items-center gap-2">
                <GripVertical className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm font-medium">{layout?.name || 'Unknown Block'}</span>
            </div>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => onDelete(block.id)}>
                <Trash2 className="h-4 w-4" />
            </Button>
        </div>
    );
}

function ColumnDropzone({ section, columnIndex, blocks, layouts, onAddBlock, onDeleteBlock }: { section: PageSection, columnIndex: number, blocks: SectionBlock[], layouts: BlockLayout[], onAddBlock: (sectionId: string, columnIndex: number) => void, onDeleteBlock: (id: string) => void }) {
    const sortedBlocks = useMemo(() => blocks.sort((a, b) => a.order - b.order), [blocks]);
    
    return (
        <SortableContext items={sortedBlocks.map(b => b.id)} strategy={verticalListSortingStrategy}>
            <div className="bg-muted/50 p-4 rounded-lg min-h-[120px] flex flex-col gap-2">
                {sortedBlocks.map(block => (
                    <SectionBlockItem key={block.id} block={block} layouts={layouts} onDelete={onDeleteBlock} />
                ))}
                <Button variant="outline" size="sm" onClick={() => onAddBlock(section.id, columnIndex)}>
                    <Plus className="mr-2 h-4 w-4" /> Add Block
                </Button>
            </div>
        </SortableContext>
    );
}


function PageSectionItem({ section, blocks, layouts, onAddBlock, onDeleteSection, onDeleteBlock }: { section: PageSection, blocks: SectionBlock[], layouts: BlockLayout[], onAddBlock: (sectionId: string, columnIndex: number) => void, onDeleteSection: (id: string) => void, onDeleteBlock: (id: string) => void }) {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: section.id, data: { type: 'section' }});
    const style = { transform: CSS.Transform.toString(transform), transition };

    const getGridCols = () => {
        switch(section.type) {
            case 'two-column-50-50': return 'grid-cols-2';
            case 'two-column-33-67': return 'grid-cols-3';
            case 'two-column-67-33': return 'grid-cols-3';
            default: return 'grid-cols-1';
        }
    }

    return (
        <div ref={setNodeRef} style={style} className="bg-card border rounded-lg p-4 space-y-4">
             <div className="flex items-center justify-between">
                <div {...attributes} {...listeners} className="flex items-center gap-2 cursor-grab text-muted-foreground">
                    <GripVertical />
                    <span className="text-sm font-medium">{sectionTypes.find(st => st.type === section.type)?.label}</span>
                </div>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => onDeleteSection(section.id)}>
                    <Trash2 className="h-4 w-4" />
                </Button>
            </div>
            <div className={`grid gap-4 ${getGridCols()}`}>
                <div className={section.type === 'two-column-67-33' ? 'col-span-2' : 'col-span-1'}>
                   <ColumnDropzone section={section} columnIndex={0} blocks={blocks.filter(b => b.columnIndex === 0)} layouts={layouts} onAddBlock={onAddBlock} onDeleteBlock={onDeleteBlock} />
                </div>
                {section.type !== 'one-column' && (
                    <div className={section.type === 'two-column-33-67' ? 'col-span-2' : 'col-span-1'}>
                        <ColumnDropzone section={section} columnIndex={1} blocks={blocks.filter(b => b.columnIndex === 1)} layouts={layouts} onAddBlock={onAddBlock} onDeleteBlock={onDeleteBlock}/>
                    </div>
                )}
            </div>
        </div>
    );
}

export default function PageBuilder({ pageId }: PageBuilderProps) {
    const firestore = useFirestore();
    const { toast } = useToast();

    const [sections, setSections] = useState<PageSection[]>([]);
    const [blocks, setBlocks] = useState<SectionBlock[]>([]);
    
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [currentTarget, setCurrentTarget] = useState<{sectionId: string, columnIndex: number} | null>(null);

    const sectionsQuery = useMemoFirebase(() => query(collection(firestore, 'page_sections'), where('pageId', '==', pageId)), [firestore, pageId]);
    const { data: fetchedSections, isLoading: isLoadingSections } = useCollection<PageSection>(sectionsQuery);
    
    const blockLayoutsCollection = useMemoFirebase(() => collection(firestore, 'block_layouts'), [firestore]);
    const { data: blockLayouts, isLoading: isLoadingLayouts } = useCollection<BlockLayout>(blockLayoutsCollection);

    const sectionIds = useMemo(() => sections.map(s => s.id), [sections]);
    const blocksQuery = useMemoFirebase(() => {
        return (firestore && sectionIds.length > 0) ? query(collection(firestore, 'section_blocks'), where('sectionId', 'in', sectionIds)) : null;
    }, [firestore, sectionIds]);
    const { data: fetchedBlocks, isLoading: isLoadingBlocks } = useCollection<SectionBlock>(blocksQuery);

    useEffect(() => {
        if (fetchedSections) setSections(fetchedSections.sort((a,b) => a.order - b.order));
    }, [fetchedSections]);

    useEffect(() => {
        if(fetchedBlocks) setBlocks(fetchedBlocks);
    }, [fetchedBlocks]);

    const addSection = (type: PageSection['type']) => {
        const newSection = {
            pageId,
            order: sections.length,
            type,
        };
        addDocumentNonBlocking(collection(firestore, 'page_sections'), newSection);
    };

    const deleteSection = async (sectionId: string) => {
        const batch = writeBatch(firestore);
        // Delete the section
        batch.delete(doc(firestore, 'page_sections', sectionId));
        // Delete all blocks within that section
        const blocksToDelete = blocks.filter(b => b.sectionId === sectionId);
        blocksToDelete.forEach(block => {
            batch.delete(doc(firestore, 'section_blocks', block.id));
        });
        await batch.commit();
        toast({ title: 'Section Deleted' });
    }

    const deleteBlock = (blockId: string) => {
        deleteDocumentNonBlocking(doc(firestore, 'section_blocks', blockId));
        toast({ title: 'Block Removed' });
    }
    
    const handleAddBlockClick = (sectionId: string, columnIndex: number) => {
        setCurrentTarget({sectionId, columnIndex});
        setIsSheetOpen(true);
    }
    
    const handleSelectBlockLayout = (layout: BlockLayout) => {
        if (!currentTarget) return;
        
        const existingBlocks = blocks.filter(b => b.sectionId === currentTarget.sectionId && b.columnIndex === currentTarget.columnIndex);

        const newBlock = {
            sectionId: currentTarget.sectionId,
            blockLayoutId: layout.id,
            columnIndex: currentTarget.columnIndex,
            order: existingBlocks.length,
        };
        addDocumentNonBlocking(collection(firestore, 'section_blocks'), newBlock);
        setIsSheetOpen(false);
    }

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over || active.id === over.id) return;
        
        const activeIsSection = active.data.current?.type === 'section';
        const activeIsBlock = active.data.current?.type === 'block';

        const batch = writeBatch(firestore);

        if (activeIsSection) {
            setSections(currentSections => {
                const oldIndex = currentSections.findIndex(s => s.id === active.id);
                const newIndex = currentSections.findIndex(s => s.id === over.id);
                const newOrder = arrayMove(currentSections, oldIndex, newIndex);
                newOrder.forEach((section, index) => {
                    if (section.order !== index) {
                         batch.update(doc(firestore, 'page_sections', section.id), { order: index });
                    }
                });
                batch.commit();
                return newOrder;
            });
        }
        
        if (activeIsBlock) {
             setBlocks(currentBlocks => {
                const activeBlock = active.data.current?.block as SectionBlock;
                const overBlock = over.data.current?.block as SectionBlock;
                const overIsColumn = !over.data.current?.block; // Dropped on a column, not another block

                const oldIndex = currentBlocks.findIndex(b => b.id === active.id);
                const newIndex = overIsColumn ? -1 : currentBlocks.findIndex(b => b.id === over.id);

                let newOrder = arrayMove(currentBlocks, oldIndex, newIndex);

                // Handle moving between columns
                if(overBlock && activeBlock.sectionId === overBlock.sectionId && activeBlock.columnIndex !== overBlock.columnIndex) {
                    newOrder = newOrder.map(b => b.id === active.id ? {...b, columnIndex: overBlock.columnIndex} : b);
                }
                
                // Update orders
                const sectionsToUpdate = new Set(newOrder.map(b => b.sectionId));
                sectionsToUpdate.forEach(sectionId => {
                    const columnsToUpdate = new Set(newOrder.filter(b => b.sectionId === sectionId).map(b => b.columnIndex));
                    columnsToUpdate.forEach(columnIndex => {
                        newOrder.filter(b => b.sectionId === sectionId && b.columnIndex === columnIndex)
                            .sort((a,b) => a.order - b.order)
                            .forEach((block, index) => {
                                const originalBlock = currentBlocks.find(b => b.id === block.id);
                                if (originalBlock && (originalBlock.order !== index || originalBlock.columnIndex !== columnIndex)) {
                                    batch.update(doc(firestore, 'section_blocks', block.id), { order: index, columnIndex });
                                }
                        });
                    })
                })

                batch.commit();
                return newOrder;
             });
        }
    };


    const blocksBySection = useMemo(() => {
        return blocks.reduce((acc, block) => {
            if (!acc[block.sectionId]) acc[block.sectionId] = [];
            acc[block.sectionId].push(block);
            return acc;
        }, {} as Record<string, SectionBlock[]>);
    }, [blocks]);

    return (
        <div className="space-y-4">
            <DndContext onDragEnd={handleDragEnd} collisionDetection={closestCenter}>
                <SortableContext items={sections.map(s => s.id)} strategy={verticalListSortingStrategy}>
                    {sections.map(section => (
                        <PageSectionItem
                            key={section.id}
                            section={section}
                            blocks={blocksBySection[section.id] || []}
                            layouts={blockLayouts || []}
                            onAddBlock={handleAddBlockClick}
                            onDeleteSection={deleteSection}
                            onDeleteBlock={deleteBlock}
                        />
                    ))}
                </SortableContext>
            </DndContext>
            
            <Card>
                <CardHeader>
                    <CardTitle>New Section</CardTitle>
                    <CardDescription>Add a new layout container to the page.</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-2">
                    {sectionTypes.map(st => (
                        <Button key={st.type} variant="secondary" onClick={() => addSection(st.type as any)}>
                            <Plus className="mr-2 h-4 w-4" /> {st.label}
                        </Button>
                    ))}
                </CardContent>
            </Card>

            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                <SheetContent>
                    <SheetHeader>
                        <SheetTitle>Select a Block Layout</SheetTitle>
                        <SheetDescription>Choose a reusable content block to add to this section.</SheetDescription>
                    </SheetHeader>
                    <div className="py-4 space-y-2">
                        {isLoadingLayouts && <p>Loading layouts...</p>}
                        {blockLayouts?.map(layout => (
                            <div key={layout.id} className="p-3 border rounded-md hover:bg-accent cursor-pointer" onClick={() => handleSelectBlockLayout(layout)}>
                               <p className="font-semibold">{layout.name}</p>
                               <p className="text-sm text-muted-foreground">{layout.description || `Type: ${layout.type}`}</p>
                            </div>
                        ))}
                    </div>
                </SheetContent>
            </Sheet>
        </div>
    )
}
