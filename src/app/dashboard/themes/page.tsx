'use client';

import Image from 'next/image';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Upload, CheckCircle } from 'lucide-react';
import { PageHeader } from '@/components/page-header';
import { PlaceHolderImages, ImagePlaceholder } from '@/lib/placeholder-images';

export default function ThemesPage() {
  const themeImages = PlaceHolderImages.filter(img =>
    img.id.startsWith('theme-')
  );
  
  const frontendThemes = [
    { name: 'Magazine Pro', active: true },
    { name: 'Minimalist Blog', active: false },
    { name: 'Creative Portfolio', active: false },
  ]

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Website Themes"
        description="Customize the look and feel of your public-facing website."
      >
        <Button variant="outline">
          <Upload className="mr-2 h-4 w-4" />
          Upload Theme
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {frontendThemes.map((theme, index) => {
          const image = themeImages[index % themeImages.length];
          return (
            <Card
              key={theme.name}
              className={`overflow-hidden group ${
                theme.active ? 'border-primary ring-2 ring-primary' : ''
              }`}
            >
              <CardHeader>
                <Image
                  alt={theme.name}
                  className="aspect-video w-full object-cover border rounded-lg"
                  data-ai-hint={image.imageHint}
                  height={400}
                  src={image.imageUrl}
                  width={600}
                />
              </CardHeader>
              <CardContent>
                <CardTitle className="font-headline text-xl">
                  {theme.name}
                </CardTitle>
                {theme.active && (
                  <CardDescription className="text-primary font-semibold flex items-center gap-2 mt-1">
                    <CheckCircle className="h-4 w-4" />
                    Active Theme
                  </CardDescription>
                )}
              </CardContent>
              <CardFooter className="gap-2">
                <Button
                  disabled={theme.active}
                  className="w-full"
                >
                  {theme.active ? 'Activated' : 'Activate'}
                </Button>
                <Button variant="outline" className="w-full">
                  Customize
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
