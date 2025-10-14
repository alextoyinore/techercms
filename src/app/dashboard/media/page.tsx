import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter
} from "@/components/ui/card";
import { PlusCircle, MoreVertical } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { PlaceHolderImages, ImagePlaceholder } from "@/lib/placeholder-images";

export default function MediaPage() {
  const mediaItems = PlaceHolderImages.filter(img => img.id.startsWith("media-"));

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Media" description="Manage your uploaded images and videos.">
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Upload Media
        </Button>
      </PageHeader>
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {mediaItems.map((item: ImagePlaceholder) => (
          <Card key={item.id} className="overflow-hidden group">
            <CardContent className="p-0">
              <Image
                alt={item.description}
                className="aspect-square w-full object-cover transition-transform duration-300 group-hover:scale-105"
                data-ai-hint={item.imageHint}
                height={400}
                src={item.imageUrl}
                width={400}
              />
            </CardContent>
            <CardFooter className="p-2 justify-between bg-card/80 backdrop-blur-sm">
                <div className="truncate">
                    <p className="text-xs font-medium truncate">{item.description}</p>
                    <p className="text-xs text-muted-foreground">800x600</p>
                </div>
                <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0">
                    <MoreVertical className="h-4 w-4"/>
                </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
