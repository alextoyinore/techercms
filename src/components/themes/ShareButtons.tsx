
'use client';

import {
  FacebookShareButton,
  TwitterShareButton,
  LinkedinShareButton,
  FacebookIcon,
  TwitterIcon,
  LinkedinIcon,
} from 'react-share';
import { usePathname } from 'next/navigation';

type ShareButtonsProps = {
  title: string;
};

export const ShareButtons = ({ title }: ShareButtonsProps) => {
  const pathname = usePathname();
  const url = typeof window !== 'undefined' ? `${window.location.origin}${pathname}` : '';

  if (!url) {
    return null;
  }

  return (
    <div className="my-8 py-6 border-y">
      <div className="flex items-center gap-4">
        <p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Share This</p>
        <div className="flex items-center gap-2">
            <FacebookShareButton url={url} quote={title}>
                <FacebookIcon size={32} round />
            </FacebookShareButton>
            <TwitterShareButton url={url} title={title}>
                <TwitterIcon size={32} round />
            </TwitterShareButton>
            <LinkedinShareButton url={url} title={title}>
                <LinkedinIcon size={32} round />
            </LinkedinShareButton>
        </div>
      </div>
    </div>
  );
};
