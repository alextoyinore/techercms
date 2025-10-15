'use client';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import Image from 'next/image';

type GalleryImage = {
    id: string;
    url: string;
}

type GalleryWidgetProps = {
    title?: string;
    galleryImages?: GalleryImage[];
}

export function GalleryWidget({ title, galleryImages = [] }: GalleryWidgetProps) {
    return (
        <Card>
            {title && (
                <CardHeader>
                    <CardTitle className="font-headline text-lg">{title}</CardTitle>
                </CardHeader>
            )}
            <CardContent className={!title ? 'pt-6' : ''}>
                {galleryImages.length > 0 ? (
                    <div className="grid grid-cols-2 gap-2">
                        {galleryImages.map((image) => (
                           <div key={image.id} className="relative aspect-square w-full overflow-hidden rounded-md">
                             <Image src={image.url} alt="Gallery image" fill className="object-cover" />
                           </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-sm text-muted-foreground">No images in this gallery. Add some in the dashboard.</p>
                )}
            </CardContent>
        </Card>
    );
}
