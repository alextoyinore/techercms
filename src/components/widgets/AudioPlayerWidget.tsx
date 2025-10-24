
'use client';
import { useState, useEffect, useRef } from 'react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, orderBy, Timestamp } from 'firebase/firestore';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Play, Pause, SkipBack, SkipForward, Loader2, ListMusic } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { PostAuthor } from '../themes/PostAuthor';
import Link from 'next/link';

type Post = {
    id: string;
    title: string;
    slug: string;
    audioUrl: string;
    authorId: string;
    createdAt: Timestamp;
};

type AudioPlayerWidgetProps = {
    title?: string;
    tag?: string;
};

export function AudioPlayerWidget({ title = 'Listen to Articles', tag = 'audio' }: AudioPlayerWidgetProps) {
    const firestore = useFirestore();
    const [playlist, setPlaylist] = useState<Post[]>([]);
    const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const audioRef = useRef<HTMLAudioElement>(null);

    const postsQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(
            collection(firestore, 'posts'),
            where('status', '==', 'published'),
            where('tagIds', 'array-contains', tag),
            orderBy('createdAt', 'desc')
        );
    }, [firestore, tag]);

    const { data: posts, isLoading } = useCollection<Post>(postsQuery);

    useEffect(() => {
        if (posts) {
            setPlaylist(posts.filter(p => p.audioUrl));
        }
    }, [posts]);
    
    useEffect(() => {
        if (audioRef.current && playlist.length > 0) {
            audioRef.current.src = playlist[currentTrackIndex].audioUrl;
            if (isPlaying) {
                audioRef.current.play();
            }
        }
    }, [currentTrackIndex, playlist, isPlaying]);
    
    const handlePlayPause = () => {
        if (!audioRef.current) return;
        if (isPlaying) {
            audioRef.current.pause();
        } else {
            audioRef.current.play();
        }
        setIsPlaying(!isPlaying);
    };

    const handleNext = () => {
        setCurrentTrackIndex((prevIndex) => (prevIndex + 1) % playlist.length);
    };
    
    const handlePrevious = () => {
        setCurrentTrackIndex((prevIndex) => (prevIndex - 1 + playlist.length) % playlist.length);
    };
    
    const handleTrackEnd = () => {
        handleNext();
    };

    const selectTrack = (index: number) => {
        setCurrentTrackIndex(index);
        setIsPlaying(true);
    };

    const currentTrack = playlist[currentTrackIndex];

    if (isLoading) {
        return (
            <Card>
                <CardContent className="p-4 text-center text-muted-foreground">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                    <p>Loading Playlist...</p>
                </CardContent>
            </Card>
        );
    }
    
    if (playlist.length === 0) {
        return (
             <Card>
                <CardContent className="p-4 text-center text-muted-foreground">
                    <p>No audio articles found.</p>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className="overflow-hidden">
            <audio ref={audioRef} onEnded={handleTrackEnd} />
            <div className="bg-muted/50 p-4 space-y-2">
                <h3 className="font-bold text-lg leading-tight truncate">{currentTrack?.title || 'Select a track'}</h3>
                <div className="text-sm text-muted-foreground">
                   {currentTrack && <PostAuthor authorId={currentTrack.authorId} />}
                </div>
                <div className="flex items-center justify-center gap-4 pt-2">
                    <Button variant="ghost" size="icon" onClick={handlePrevious}>
                        <SkipBack className="h-6 w-6" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-12 w-12 rounded-full" onClick={handlePlayPause}>
                        {isPlaying ? <Pause className="h-8 w-8" /> : <Play className="h-8 w-8" />}
                    </Button>
                    <Button variant="ghost" size="icon" onClick={handleNext}>
                        <SkipForward className="h-6 w-6" />
                    </Button>
                </div>
            </div>
            <CardContent className="p-0">
                <div className="p-2 border-b flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                   <ListMusic className="h-4 w-4" />
                   Up Next
                </div>
                <ScrollArea className="h-64">
                    {playlist.map((track, index) => (
                        <button
                            key={track.id}
                            className={`w-full text-left p-3 text-sm hover:bg-muted/50 ${index === currentTrackIndex ? 'bg-muted' : ''}`}
                            onClick={() => selectTrack(index)}
                        >
                            <p className="font-semibold">{track.title}</p>
                            <p className="text-xs text-muted-foreground"><PostAuthor authorId={track.authorId} /></p>
                        </button>
                    ))}
                </ScrollArea>
            </CardContent>
        </Card>
    );
}
