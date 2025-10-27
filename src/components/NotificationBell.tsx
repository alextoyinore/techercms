
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useFirestore, useAuth, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, orderBy, limit, Timestamp, doc } from 'firebase/firestore';
import { setDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Bell, Mail } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ScrollArea } from './ui/scroll-area';

type Notification = {
    id: string;
    userId: string;
    message: string;
    link: string;
    isRead: boolean;
    createdAt: Timestamp;
};

export function NotificationBell() {
    const firestore = useFirestore();
    const auth = useAuth();
    const user = auth?.currentUser;

    const notificationsQuery = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        return query(
            collection(firestore, 'notifications'),
            where('userId', '==', user.uid),
            orderBy('createdAt', 'desc'),
            limit(20)
        );
    }, [firestore, user]);

    const { data: notifications, isLoading } = useCollection<Notification>(notificationsQuery);

    const unreadCount = notifications?.filter(n => !n.isRead).length || 0;

    const handleNotificationClick = (notification: Notification) => {
        if (!notification.isRead && firestore) {
            const notifRef = doc(firestore, 'notifications', notification.id);
            setDocumentNonBlocking(notifRef, { isRead: true }, { merge: true });
        }
    };

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                        <span className="absolute top-1 right-1 flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
                        </span>
                    )}
                    <span className="sr-only">Toggle notifications</span>
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0">
                <div className="font-medium border-b p-3">Notifications</div>
                <ScrollArea className="h-96">
                    {isLoading && <p className="p-4 text-sm text-muted-foreground text-center">Loading...</p>}
                    {!isLoading && notifications?.length === 0 && (
                        <div className="text-center p-8">
                            <Mail className="mx-auto h-12 w-12 text-muted-foreground" />
                            <h3 className="mt-4 text-lg font-medium">All caught up!</h3>
                            <p className="mt-1 text-sm text-muted-foreground">You have no new notifications.</p>
                        </div>
                    )}
                    <div className="divide-y">
                        {notifications?.map(notification => (
                            <Link key={notification.id} href={notification.link} passHref legacyBehavior>
                                <a
                                    onClick={() => handleNotificationClick(notification)}
                                    className={`block p-3 hover:bg-muted/50 ${!notification.isRead ? 'bg-primary/5' : ''}`}
                                >
                                    <p className="text-sm">{notification.message}</p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        {formatDistanceToNow(notification.createdAt.toDate(), { addSuffix: true })}
                                    </p>
                                </a>
                            </Link>
                        ))}
                    </div>
                </ScrollArea>
            </PopoverContent>
        </Popover>
    );
}

    