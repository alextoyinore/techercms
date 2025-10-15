'use client';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import Image from 'next/image';
import Link from 'next/link';

type ImageWidgetProps = {
    title?: string;
    imageUrl?: string;
    caption?: string;
    linkUrl?: string;
}

export function ImageWidget({ title, imageUrl, caption, linkUrl }: ImageWidgetProps) {
    
    const imageContent = imageUrl ? (
        <div className="relative aspect-video w-full overflow-hidden rounded-md">
            <Image src={imageUrl} alt={caption || title || 'Widget Image'} fill className="object-cover" />
        </div>
    ) : null;

    return (
        <Card>
            {title && (
                <CardHeader>
                    <CardTitle className="font-headline text-lg">{title}</CardTitle>
                </CardHeader>
            )}
            <CardContent>
                <div className="grid gap-2">
                    {linkUrl && imageUrl ? (
                         <Link href={linkUrl} target="_blank" rel="noopener noreferrer">
                            {imageContent}
                        </Link>
                    ) : imageContent}

                    {caption && (
                        <p className="text-sm text-muted-foreground text-center italic">{caption}</p>
                    )}

                    {!imageUrl && (
                        <div className="flex items-center justify-center bg-muted aspect-video rounded-md">
                            <p className="text-sm text-muted-foreground">Please select an image.</p>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
