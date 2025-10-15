'use client';

import { useState, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PlusCircle, Loader2, Upload } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useAuth } from '@/firebase';
import { collection, doc, serverTimestamp } from 'firebase/firestore';
import { setDocumentNonBlocking } from '@/firebase/non-blocking-updates';

export function MediaUploader() {
  const [open, setOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const firestore = useFirestore();
  const auth = useAuth();

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !firestore || !auth?.currentUser) {
        toast({
            variant: 'destructive',
            title: 'Upload failed',
            description: 'Could not prepare the upload. Please try again.'
        });
        return;
    }

    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

    if (!cloudName || !uploadPreset) {
      toast({
        variant: "destructive",
        title: "Cloudinary not configured",
        description: "Please set up your Cloudinary environment variables.",
      });
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', uploadPreset);

    try {
      const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error.message || 'Upload to Cloudinary failed');
      }

      const data = await response.json();
      
      const mediaRef = doc(collection(firestore, "media"));
      const newMediaItem = {
          url: data.secure_url,
          filename: file.name,
          authorId: auth.currentUser.uid,
          createdAt: serverTimestamp(),
      };
      
      await setDocumentNonBlocking(mediaRef, newMediaItem, {});

      toast({
        title: "Media Uploaded",
        description: `"${file.name}" has been added to your library.`,
      });

      setOpen(false); // Close dialog on successful upload
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Upload Failed",
        description: error.message || "Could not upload the media.",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Upload Media
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Upload New Media</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
            <p className='text-sm text-muted-foreground'>Choose a file to upload to your media library.</p>
            <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleUpload} 
                className="hidden" 
                accept="image/*,video/*"
                disabled={isUploading}
            />
            <Button 
                variant="outline" 
                onClick={() => fileInputRef.current?.click()} 
                disabled={isUploading}
            >
            {isUploading ? (
                <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading...
                </>
            ) : (
                <>
                <Upload className="mr-2 h-4 w-4" />
                Choose File
                </>
            )}
            </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

    