'use client';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, getDocs, doc } from 'firebase/firestore';
import { useMemo, useEffect, useState } from 'react';
import { WidgetArea } from './widgets/WidgetArea';
import { PostGridWidget } from './widgets/PostGridWidget';

// Dynamically import all widgets
import { RecentPostsWidget } from '@/components/widgets/RecentPostsWidget';
import { CategoriesListWidget } from '@/components/widgets/CategoriesListWidget';
import { SearchWidget } from '@/components/widgets/SearchWidget';
import { TagCloudWidget } from '@/components/widgets/TagCloudWidget';
import { CustomHtmlWidget } from '@/components/widgets/CustomHtmlWidget';
import { ImageWidget } from '@/components/widgets/ImageWidget';
import { SocialFollowWidget } from '@/components/widgets/SocialFollowWidget';
import { TradingTickerWidget } from '@/components/widgets/TradingTickerWidget';
import { BreakingNewsWidget } from '@/components/widgets/BreakingNewsWidget';
import { LiveScoreWidget } from '@/components/widgets/LiveScoreWidget';
import { SportingTablesWidget } from '@/components/widgets/SportingTablesWidget';
import { TextWidget } from '@/components/widgets/TextWidget';
import { GalleryWidget } from '@/components/widgets/GalleryWidget';
import { NavigationWidget } from '@/components/widgets/NavigationWidget';
import { PostShowcaseWidget } from '@/components/widgets/PostShowcaseWidget';
import { WeatherWidget } from '@/components/widgets/WeatherWidget';
import { PostCarouselWidget } from '@/components/widgets/PostCarouselWidget';
import { FeaturedSmallsWidget } from '@/components/widgets/FeaturedSmallsWidget';
import { TabbedPostsWidget } from '@/components/widgets/TabbedPostsWidget';

const blockLayoutWidgets: Record<string, React.FC<any>> = {
    'post-grid': PostGridWidget,
    'post-list': RecentPostsWidget, // Assuming PostList uses RecentPostsWidget logic for now
    'post-carousel': PostCarouselWidget,
    'featured-and-smalls': FeaturedSmallsWidget,
    'tabbed-posts': TabbedPostsWidget,
    'hero': CustomHtmlWidget, // Placeholder
    'cta': CustomHtmlWidget, // Placeholder
    'feature-grid': CustomHtmlWidget, // Placeholder
    'gallery': GalleryWidget,
    'video': CustomHtmlWidget, // Placeholder
    'testimonials': CustomHtmlWidget, // Placeholder
    'contact-form': CustomHtmlWidget, // Placeholder
};

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

type BlockLayout = {
    id: string;
    type: string;
    config: any;
}

function RenderedBlock({ block }: { block: SectionBlock }) {
    const firestore = useFirestore();
    const layoutRef = useMemoFirebase(() => doc(firestore, 'block_layouts', block.blockLayoutId), [firestore, block.blockLayoutId]);
    const { data: layout, isLoading } = useDoc<BlockLayout>(layoutRef);

    if (isLoading || !layout) {
        return <div className="animate-pulse bg-muted h-24 rounded-md"></div>;
    }
    
    const WidgetComponent = blockLayoutWidgets[layout.type];

    if (!WidgetComponent) {
        return <p className="text-sm text-destructive">Error: Block type "{layout.type}" not found.</p>;
    }
    
    return <WidgetComponent {...layout.config} />;
}

export function PageBuilderRenderer({ pageId }: { pageId: string }) {
    const firestore = useFirestore();

    const sectionsQuery = useMemoFirebase(() => query(collection(firestore, 'page_sections'), where('pageId', '==', pageId)), [firestore, pageId]);
    const { data: sections, isLoading: isLoadingSections } = useCollection<PageSection>(sectionsQuery);
    
    const [blocks, setBlocks] = useState<SectionBlock[]>([]);
    const [isLoadingBlocks, setIsLoadingBlocks] = useState(true);

    useEffect(() => {
        const fetchBlocks = async () => {
            if (!sections || sections.length === 0) {
                setIsLoadingBlocks(false);
                setBlocks([]);
                return;
            };
            setIsLoadingBlocks(true);
            const sectionIds = sections.map(s => s.id);
            const blocksQuery = query(collection(firestore, 'section_blocks'), where('sectionId', 'in', sectionIds));
            const snapshot = await getDocs(blocksQuery);
            const fetchedBlocks = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as SectionBlock));
            setBlocks(fetchedBlocks);
            setIsLoadingBlocks(false);
        }
        fetchBlocks();
    }, [sections, firestore]);

    const sortedSections = useMemo(() => sections?.sort((a, b) => a.order - b.order), [sections]);

    const blocksBySectionAndColumn = useMemo(() => {
        return blocks.reduce((acc, block) => {
            const key = `${block.sectionId}-${block.columnIndex}`;
            if (!acc[key]) acc[key] = [];
            acc[key].push(block);
            return acc;
        }, {} as Record<string, SectionBlock[]>);
    }, [blocks]);


    if (isLoadingSections) {
        return <div className="container mx-auto py-8"><p>Loading page structure...</p></div>
    }

    if (!sortedSections || sortedSections.length === 0) {
        return null;
    }
    
    const getColumnClasses = (sectionType: string, columnIndex: number) => {
        switch(sectionType) {
            case 'two-column-50-50': return 'md:col-span-1';
            case 'two-column-33-67': return columnIndex === 0 ? 'md:col-span-1' : 'md:col-span-2';
            case 'two-column-67-33': return columnIndex === 0 ? 'md:col-span-2' : 'md:col-span-1';
            default: return 'col-span-1'; // For one-column
        }
    }
    
    const getGridClasses = (sectionType: string) => {
        switch(sectionType) {
            case 'two-column-50-50': return 'grid-cols-1 md:grid-cols-2';
            case 'two-column-33-67': return 'grid-cols-1 md:grid-cols-3';
            case 'two-column-67-33': return 'grid-cols-1 md:grid-cols-3';
            default: return 'grid-cols-1';
        }
    }

    return (
        <div className="space-y-8 md:space-y-12">
            {sortedSections.map(section => {
                const sectionBlocksCol0 = (blocksBySectionAndColumn[`${section.id}-0`] || []).sort((a,b) => a.order - b.order);
                const sectionBlocksCol1 = (blocksBySectionAndColumn[`${section.id}-1`] || []).sort((a,b) => a.order - b.order);
                
                return (
                    <section key={section.id} className="container mx-auto">
                        <div className={`grid ${getGridClasses(section.type)} gap-8`}>
                            <div className={`${getColumnClasses(section.type, 0)} space-y-6`}>
                               {sectionBlocksCol0.map(block => <RenderedBlock key={block.id} block={block} />)}
                            </div>
                            {section.type !== 'one-column' && (
                                <div className={`${getColumnClasses(section.type, 1)} space-y-6`}>
                                   {sectionBlocksCol1.map(block => <RenderedBlock key={block.id} block={block} />)}
                                </div>
                            )}
                        </div>
                    </section>
                )
            })}
        </div>
    )

}
