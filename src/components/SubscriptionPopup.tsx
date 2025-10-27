
'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { SubscriptionForm } from './SubscriptionForm';

const POPUP_COOKIE_NAME = 'newsletter_popup_seen';
const POPUP_DELAY_MS = 5000; // 5 seconds

export function SubscriptionPopup() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Check if the cookie exists
    const hasSeenPopup = document.cookie.includes(`${POPUP_COOKIE_NAME}=true`);

    if (!hasSeenPopup) {
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, POPUP_DELAY_MS);

      return () => clearTimeout(timer);
    }
  }, []);

  const handleClose = () => {
    setIsOpen(false);
    // Set a cookie to prevent the popup from showing again for a year
    const expiryDate = new Date();
    expiryDate.setFullYear(expiryDate.getFullYear() + 1);
    document.cookie = `${POPUP_COOKIE_NAME}=true; expires=${expiryDate.toUTCString()}; path=/`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-headline text-2xl text-center">Don't Miss Out!</DialogTitle>
          <DialogDescription className="text-center">
            Join our newsletter for exclusive content, news, and updates.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <SubscriptionForm onSuccess={handleClose} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
