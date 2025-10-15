'use client';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';

type SearchWidgetProps = {
    title?: string;
}

export function SearchWidget({ title = 'Search' }: SearchWidgetProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="font-headline text-lg flex items-center gap-2">
                    <Search className="h-4 w-4" />
                    {title}
                </CardTitle>
            </CardHeader>
            <CardContent>
                <form className="flex items-center gap-2">
                    <Input placeholder="Search this site..." />
                    <Button type="submit" size="icon" aria-label="Search">
                        <Search className="h-4 w-4" />
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}
