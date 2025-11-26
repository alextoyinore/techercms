
'use client';
import { useState, useEffect, useRef } from 'react';
import { useFirestore } from '@/firebase';
import { collection, query, where, orderBy, Timestamp, getDocs, limit, startAfter, type QueryDocumentSnapshot } from 'firebase/firestore';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Play, Pause, SkipBack, SkipForward, Loader2, ListMusic } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { PostAuthor } from '../themes/PostAuthor';

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

const POSTS_PER_PAGE = 10;

export function AudioPlayerWidget({ title = 'Listen to Articles', tag = 'audio' }: AudioPlayerWidgetProps) {
    const firestore = useFirestore();
    const [playlist, setPlaylist] = useState<Post[]>([]);
    const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const audioRef = useRef<HTMLAudioElement>(null);
    
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot | null>(null);
    const [hasMore, setHasMore] = useState(true);

    const baseQuery = useMemo(() => {
        if (!firestore) return null;
        return query(
            collection(firestore, 'posts'),
            where('status', '==', 'published'),
            where('tagIds', 'array-contains', tag),
            orderBy('createdAt', 'desc')
        );
    }, [firestore, tag]);

    const fetchPosts = async (lastVisibleDoc: QueryDocumentSnapshot | null = null) => {
        if (!baseQuery) return;

        const isInitialFetch = !lastVisibleDoc;
        if(isInitialFetch) setIsLoading(true);
        else setIsLoadingMore(true);

        let q = query(baseQuery, limit(POSTS_PER_PAGE));

        if (lastVisibleDoc) {
            q = query(q, startAfter(lastVisibleDoc));
        }
        
        try {
            const snapshot = await getDocs(q);
            const newPosts = snapshot.docs
                .map(doc => ({ id: doc.id, ...doc.data() } as Post))
                .filter(p => p.audioUrl);
            
            setLastDoc(snapshot.docs[snapshot.docs.length - 1] || null);
            setHasMore(snapshot.docs.length === POSTS_PER_PAGE);

            if (isInitialFetch) {
                setPlaylist(newPosts);
            } else {
                setPlaylist(prev => [...prev, ...newPosts]);
            }
        } catch (error) {
            console.error("Error fetching audio posts:", error);
        } finally {
             if(isInitialFetch) setIsLoading(false);
             else setIsLoadingMore(false);
        }
    };
    
    useEffect(() => {
        fetchPosts();
    }, [baseQuery]);

    
    useEffect(() => {
        if (audioRef.current && playlist.length > 0 && playlist[currentTrackIndex]) {
            audioRef.current.src = playlist[currentTrackIndex].audioUrl;
            if (isPlaying) {
                audioRef.current.play().catch(e => console.error("Audio play failed:", e));
            }
        }
    }, [currentTrackIndex, playlist, isPlaying]);
    
    const handlePlayPause = () => {
        if (!audioRef.current) return;
        if (isPlaying) {
            audioRef.current.pause();
        } else {
            audioRef.current.play().catch(e => console.error("Audio play failed:", e));
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
                <CardHeader>
                    <CardTitle className="font-headline text-lg">{title}</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground text-center py-4">No audio articles found.</p>
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
                <div className="p-2 border-b flex items-center justify-between text-sm font-semibold text-muted-foreground">
                   <div className="flex items-center gap-2">
                     <ListMusic className="h-4 w-4" />
                     Up Next
                   </div>
                   {hasMore && (
                       <Button variant="ghost" size="sm" onClick={() => fetchPosts(lastDoc)} disabled={isLoadingMore}>
                           {isLoadingMore ? <Loader2 className="h-4 w-4 animate-spin"/> : "Load More"}
                       </Button>
                   )}
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
