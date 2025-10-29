
'use client';

import Image from "next/image";
import {
  Card,
  CardContent,
  CardFooter
} from "@/components/ui/card";
import { MoreVertical, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { useFirestore, useCollection, useAuth, useMemoFirebase } from "@/firebase";
import { collection, doc, query, orderBy, Timestamp } from "firebase/firestore";
import { MediaUploader } from "@/components/media-uploader";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
  } from "@/components/ui/dropdown-menu";
import { deleteDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { useToast } from "@/hooks/use-toast";

type MediaItem = {
    id: string;
    url: string;
    filename: string;
    authorId: string;
    createdAt: Timestamp;
};

export default function MediaPage() {
  const firestore = useFirestore();
  const auth = useAuth();
  const { toast } = useToast();

  const mediaCollection = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'media'), orderBy('createdAt', 'desc'));
  }, [firestore]);

  const { data: mediaItems, isLoading } = useCollection<MediaItem>(mediaCollection);

  const handleDelete = (mediaId: string, filename: string) => {
    if (!firestore) return;
    try {
        deleteDocumentNonBlocking(doc(firestore, "media", mediaId));
        toast({
            title: "Media Deleted",
            description: `"${filename}" has been deleted.`,
        });
    } catch (error: any) {
        toast({
            variant: "destructive",
            title: "Error Deleting Media",
            description: error.message || "Could not delete the media item.",
        });
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Media" description="Manage your uploaded images and other files.">
        <MediaUploader />
      </PageHeader>
      
      {isLoading && <p>Loading media...</p>}
      {!isLoading && mediaItems?.length === 0 && (
        <Card className="flex items-center justify-center h-64">
            <CardContent className="text-center text-muted-foreground p-6">
                <p>No media found. Upload something to get started.</p>
            </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {mediaItems?.map((item: MediaItem) => (
          <Card key={item.id} className="overflow-hidden group">
            <CardContent className="p-0">
              <Image
                alt={item.filename}
                className="aspect-square w-full object-cover transition-transform duration-300 group-hover:scale-105"
                height={400}
                src={item.url}
                width={400}
              />
            </CardContent>
            <CardFooter className="p-2 justify-between bg-card/80 backdrop-blur-sm">
                <div className="truncate">
                    <p className="text-xs font-medium truncate">{item.filename}</p>
                    <p className="text-xs text-muted-foreground">
                        {item.createdAt ? new Date(item.createdAt.seconds * 1000).toLocaleDateString() : ''}
                    </p>
                </div>
                 <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0">
                            <MoreVertical className="h-4 w-4"/>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => handleDelete(item.id, item.filename)} className="text-destructive">
                           <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
