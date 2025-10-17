'use client';
import { useDoc, useMemoFirebase, useFirestore } from '@/firebase';
import { WidgetArea } from '@/components/widgets/WidgetArea';
import Link from 'next/link';
import { doc } from 'firebase/firestore';
import { Menu } from '@/components/Menu';

type SiteSettings = {
    siteName?: string;
}

function PublicHeader({ siteName, HeaderComponent }: { siteName?: string, HeaderComponent?: React.FC<{siteName?: string}> }) {
    if (HeaderComponent) {
        return <HeaderComponent siteName={siteName} />;
    }

    return (
        <header className="py-4 px-6 border-b sticky top-0 bg-background/80 backdrop-blur-sm z-10">
            <div className="container mx-auto flex justify-between items-center">
                <Link href="/" className="text-2xl font-bold font-headline text-primary">
                    {siteName || 'My Awesome Site'}
                </Link>
                <nav>
                    <Link href="/login" className="text-sm font-medium text-muted-foreground hover:text-primary">
                        Admin Login
                    </Link>
                </nav>
            </div>
        </header>
    );
}

function PublicFooter({ siteName, FooterComponent }: { siteName?: string, FooterComponent?: React.FC<{siteName?: string}> }) {
    if (FooterComponent) {
        return <FooterComponent siteName={siteName} />;
    }

    return (
        <footer className="py-12 px-6 border-t mt-12 bg-muted/20">
            <div className="container mx-auto grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                <div className="lg:col-span-2">
                    <p className="font-bold font-headline text-primary text-lg">{siteName || 'My Awesome Site'}</p>
                    <p className="text-sm text-muted-foreground mt-2">&copy; {new Date().getFullYear()} All Rights Reserved.</p>
                </div>
                <div className="space-y-4">
                    <WidgetArea areaName="Footer Column 1" />
                </div>
                <div className="space-y-4">
                    <WidgetArea areaName="Footer Column 2" />
                </div>
            </div>
        </footer>
    );
}


type ThemeLayoutProps = {
    children: React.ReactNode;
    HeaderComponent?: React.FC<{ siteName?: string }>;
    FooterComponent?: React.FC<{ siteName?: string }>;
    pageId?: string;
    className?: string;
};

export function ThemeLayout({ children, HeaderComponent, FooterComponent, pageId, className }: ThemeLayoutProps) {
    const firestore = useFirestore();

    const settingsRef = useMemoFirebase(() => {
        if (!firestore) return null;
        return doc(firestore, 'site_settings', 'config');
    }, [firestore]);

    const { data: settings } = useDoc<SiteSettings>(settingsRef);
    
    return (
        <div className={className}>
            <WidgetArea areaName="Header" />
            <WidgetArea areaName="Page Header" isPageSpecific={!!pageId} pageId={pageId} />
            <PublicHeader siteName={settings?.siteName} HeaderComponent={HeaderComponent} />
            <main className="container mx-auto py-8 px-6">
                {children}
            </main>
             <WidgetArea areaName="Page Footer" isPageSpecific={!!pageId} pageId={pageId} />
            <PublicFooter siteName={settings?.siteName} FooterComponent={FooterComponent} />
        </div>
    )
}
