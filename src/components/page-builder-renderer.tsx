'use client';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { useMemo } from 'react';
import { WidgetArea } from './widgets/WidgetArea';

type PageSection = {
    id: string;
    pageId: string;
    order: number;
    type: string;
    config?: any;
}

type SectionBlock = {
    id: string;
    sectionId: string;
    blockLayoutId: string;
    columnIndex: number;
    order: number;
}

export function PageBuilderRenderer({ pageId }: { pageId: string }) {
    const firestore = useFirestore();

    const sectionsQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'page_sections'), where('pageId', '==', pageId));
    }, [firestore, pageId]);

    const { data: sections, isLoading: isLoadingSections } = useCollection<PageSection>(sectionsQuery);
    
    const sectionIds = useMemo(() => sections?.map(s => s.id) || [], [sections]);

    const blocksQuery = useMemoFirebase(() => {
        if (!firestore || sectionIds.length === 0) return null;
        return query(collection(firestore, 'section_blocks'), where('sectionId', 'in', sectionIds));
    }, [firestore, sectionIds]);

    const { data: blocks, isLoading: isLoadingBlocks } = useCollection<SectionBlock>(blocksQuery);

    const sortedSections = useMemo(() => sections?.sort((a, b) => a.order - b.order), [sections]);

    const blocksBySection = useMemo(() => {
        return (blocks || []).reduce((acc, block) => {
            if (!acc[block.sectionId]) {
                acc[block.sectionId] = [];
            }
            acc[block.sectionId].push(block);
            return acc;
        }, {} as Record<string, SectionBlock[]>);
    }, [blocks]);


    if (isLoadingSections || isLoadingBlocks) {
        return <p>Loading page...</p>
    }

    if (!sortedSections || sortedSections.length === 0) {
        return <p className="container mx-auto py-8 text-center text-muted-foreground">This page has no content yet.</p>;
    }
    
    return (
        <div className="space-y-8">
            {sortedSections.map(section => {
                const sectionBlocks = blocksBySection[section.id] || [];
                // Render section based on type, for now just a placeholder
                return (
                    <div key={section.id} className="border p-4 rounded-lg">
                        <h3 className="font-bold">Section (Type: {section.type})</h3>
                        <div className="grid grid-cols-2 gap-4 mt-4">
                            {/* Placeholder for columns */}
                             <div>
                                 <h4>Column 1</h4>
                                 {sectionBlocks.filter(b => b.columnIndex === 0).sort((a,b) => a.order - b.order).map(block => (
                                     <div key={block.id} className="border p-2 my-2">Block: {block.blockLayoutId}</div>
                                 ))}
                             </div>
                             <div>
                                 <h4>Column 2</h4>
                                {sectionBlocks.filter(b => b.columnIndex === 1).sort((a,b) => a.order - b.order).map(block => (
                                     <div key={block.id} className="border p-2 my-2">Block: {block.blockLayoutId}</div>
                                 ))}
                             </div>
                        </div>
                    </div>
                )
            })}
        </div>
    )

}
