'use client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import Link from 'next/link';

type NavLink = {
    id: string;
    label: string;
    url: string;
}

type NavigationWidgetProps = {
    title?: string;
    navLinks?: NavLink[];
}

export function NavigationWidget({ title = 'Navigation', navLinks = [] }: NavigationWidgetProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="font-headline text-lg">{title}</CardTitle>
            </CardHeader>
            <CardContent>
                {navLinks.length > 0 ? (
                    <ul className="space-y-2">
                        {navLinks.map((link) => (
                            <li key={link.id}>
                                <Link href={link.url} className="text-sm text-primary hover:underline">
                                    {link.label}
                                </Link>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-sm text-muted-foreground">No links configured. Add some in the dashboard.</p>
                )}
            </CardContent>
        </Card>
    );
}
