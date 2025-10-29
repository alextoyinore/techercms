
'use client';

import { useState } from 'react';
import Image from 'next/image';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Card,
  CardContent
} from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { useFirestore, useCollection, useAuth, useMemoFirebase } from "@/firebase";
import { collection, query, orderBy, Timestamp } from "firebase/firestore";
import { MediaUploader } from './media-uploader';

type MediaItem = {
    id: string;
    url: string;
    filename: string;
    authorId: string;
    createdAt: Timestamp;
};

type MediaLibraryProps = {
    children: React.ReactNode;
    onSelect: (url: string) => void;
}

export function MediaLibrary({ children, onSelect }: MediaLibraryProps) {
  const [open, setOpen] = useState(false);
  const firestore = useFirestore();
  const auth = useAuth();

  const mediaCollection = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'media'), orderBy('createdAt', 'desc'));
  }, [firestore]);

  const { data: mediaItems, isLoading } = useCollection<MediaItem>(mediaCollection);

  const handleSelect = (url: string) => {
    onSelect(url);
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-4xl h-5/6 flex flex-col">
        <DialogHeader className="flex-row items-center justify-between">
          <DialogTitle>Media Library</DialogTitle>
          <MediaUploader />
        </DialogHeader>
        <div className="flex-1 overflow-y-auto">
            {isLoading && <p>Loading media...</p>}
            {!isLoading && mediaItems?.length === 0 && (
                <div className="flex items-center justify-center h-full">
                    <p className="text-muted-foreground">No media found. Upload something to get started.</p>
                </div>
            )}
             <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 p-4">
                {mediaItems?.map((item: MediaItem) => (
                <Card 
                    key={item.id} 
                    className="overflow-hidden group cursor-pointer"
                    onClick={() => handleSelect(item.url)}
                >
                    <CardContent className="p-0">
                    <Image
                        alt={item.filename}
                        className="aspect-square w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        height={300}
                        src={item.url}
                        width={300}
                    />
                    </CardContent>
                </Card>
                ))}
            </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
