'use client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import Link from 'next/link';
import { Facebook, Twitter, Instagram, Linkedin, Youtube, Github, Link2 } from 'lucide-react';

const iconMap: Record<string, React.FC<any>> = {
    twitter: Twitter,
    facebook: Facebook,
    instagram: Instagram,
    linkedin: Linkedin,
    youtube: Youtube,
    github: Github,
    default: Link2,
};

type SocialLink = {
    platform: string;
    url: string;
}

type SocialFollowWidgetProps = {
    title?: string;
    socialLinks?: SocialLink[];
}

export function SocialFollowWidget({ title = 'Follow Us', socialLinks = [] }: SocialFollowWidgetProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="font-headline text-lg">{title}</CardTitle>
            </CardHeader>
            <CardContent>
                {socialLinks.length > 0 ? (
                    <div className="flex items-center gap-4">
                        {socialLinks.map((link, index) => {
                            const Icon = iconMap[link.platform] || iconMap.default;
                            return (
                                <Link key={index} href={link.url} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary">
                                    <Icon className="h-6 w-6" />
                                    <span className="sr-only">{link.platform}</span>
                                </Link>
                            )
                        })}
                    </div>
                ) : (
                    <p className="text-sm text-muted-foreground">No social links configured. Add some in the dashboard.</p>
                )}
            </CardContent>
        </Card>
    );
}
